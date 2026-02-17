import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BuyRadarService } from '@/lib/services/buy-radar-service'

export const maxDuration = 300

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PARALLEL_BATCH_SIZE = 5
const TIMEOUT_BUFFER_MS = 30_000 // stop 30s before max timeout

/**
 * GET /api/cron/buy-radar?offset=0
 * Daily cron job (06:00 UTC) — analyzes all buy radar companies in batches.
 * Self-re-invokes with next offset when approaching timeout.
 * Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  // Verify: Vercel cron sends Bearer token, manual dashboard trigger sends x-vercel-cron header
  const authHeader = request.headers.get('authorization')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isVercelInternal = request.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && !isVercelInternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Fetch all buy radar companies
    const { data: allCompanies, error } = await supabase
      .from('companies')
      .select('id, name, symbol, extra_data')
      .in('extra_data->>Thier_Group', ['2026', '2026*', '2026**', '2026***'])
      .order('name')

    if (error) {
      console.error('Cron: Failed to fetch companies:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = allCompanies?.length || 0
    const companies = (allCompanies || []).slice(offset)

    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All companies already processed',
        total,
        offset,
      })
    }

    let successful = 0
    let failed = 0
    let processed = 0
    const errors: string[] = []
    const service = new BuyRadarService()

    // Process in parallel sub-batches of PARALLEL_BATCH_SIZE
    for (let i = 0; i < companies.length; i += PARALLEL_BATCH_SIZE) {
      // Check if we're approaching the timeout
      const elapsed = Date.now() - startTime
      if (elapsed > (maxDuration * 1000) - TIMEOUT_BUFFER_MS) {
        // Trigger next batch via self-invocation
        const nextOffset = offset + processed
        const baseUrl = request.nextUrl.origin
        console.log(`Cron: Timeout approaching at ${elapsed}ms, re-invoking with offset=${nextOffset}`)

        fetch(`${baseUrl}/api/cron/buy-radar?offset=${nextOffset}`, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        }).catch(err => console.error('Cron: Self-invocation failed:', err))

        const duration = Date.now() - startTime
        return NextResponse.json({
          success: true,
          batch: true,
          total,
          offset,
          processed,
          successful,
          failed,
          nextOffset,
          errors: errors.slice(0, 10),
          duration_ms: duration,
        })
      }

      const batch = companies.slice(i, i + PARALLEL_BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map(company => analyzeAndStore(supabase, service, company))
      )

      for (let j = 0; j < results.length; j++) {
        processed++
        const result = results[j]
        if (result.status === 'fulfilled') {
          successful++
        } else {
          failed++
          const msg = `${batch[j].name}: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`
          errors.push(msg)
          console.error(`Cron: Analysis failed for ${batch[j].name}:`, result.reason)
        }
      }

      console.log(`Cron: Batch done — ${successful}/${processed} of ${total} (offset ${offset})`)
    }

    const duration = Date.now() - startTime
    console.log(`Cron: Completed ${successful}/${total} in ${duration}ms (${failed} failed)`)

    return NextResponse.json({
      success: true,
      batch: false,
      total,
      offset,
      processed,
      successful,
      failed,
      errors: errors.slice(0, 10),
      duration_ms: duration,
    })
  } catch (error) {
    console.error('Cron: Buy Radar failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function analyzeAndStore(
  supabase: ReturnType<typeof createClient>,
  service: BuyRadarService,
  company: { id: string; name: string; symbol: string | null; extra_data: Record<string, string | number | boolean | null> }
) {
  const { analysis, currentPrice, priceGapPercent, webResearchSummary, dataSources, durationMs } =
    await service.analyzeCompany(company.id, company.name, company.symbol, company.extra_data)

  const { error: insertError } = await supabase
    .from('buy_radar_analyses')
    .insert({
      company_id: company.id,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      summary: analysis.summary,
      current_price: currentPrice,
      target_price: analysis.target_price,
      price_gap_percent: priceGapPercent,
      catalysts: analysis.catalysts,
      risks: analysis.risks,
      web_research_summary: webResearchSummary,
      data_sources: dataSources,
      model_used: 'claude-sonnet-4-5-20250929',
      analysis_duration_ms: durationMs,
    })

  if (insertError) {
    throw new Error(`Failed to store analysis: ${insertError.message}`)
  }

  return { companyId: company.id, companyName: company.name, recommendation: analysis.recommendation }
}
