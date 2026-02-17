import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BuyRadarService } from '@/lib/services/buy-radar-service'

export const maxDuration = 300

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/cron/buy-radar
 * Daily cron job (06:00 UTC) — analyzes all buy radar companies
 * Protected by CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Fetch all buy radar companies
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, symbol, extra_data')
      .or(
        'extra_data->>Thier_Group.in.(2026,2026*,2026**,2026***),' +
        'extra_data->>VIP.eq.Defcon 1'
      )

    if (error) {
      console.error('Cron: Failed to fetch companies:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = companies?.length || 0
    let successful = 0
    let failed = 0
    const errors: string[] = []

    const service = new BuyRadarService()

    for (const company of companies || []) {
      try {
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
          throw new Error(insertError.message)
        }

        successful++
      } catch (err) {
        failed++
        const msg = `${company.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        errors.push(msg)
        console.error(`Cron: Analysis failed for ${company.name}:`, err)
      }

      // 2s delay between analyses
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const duration = Date.now() - startTime

    console.log(`Buy Radar Cron: ${successful}/${total} analyzed in ${duration}ms (${failed} failed)`)

    return NextResponse.json({
      success: true,
      total,
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
