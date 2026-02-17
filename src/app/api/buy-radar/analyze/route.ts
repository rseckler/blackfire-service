import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BuyRadarService } from '@/lib/services/buy-radar-service'

export const maxDuration = 60

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/buy-radar/analyze
 * Trigger analysis for a specific company or all buy radar companies
 * Body: { companyId?: string } — if no companyId, analyzes all
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const body = await request.json().catch(() => ({}))
    const { companyId } = body as { companyId?: string }

    const service = new BuyRadarService()
    const results: { companyId: string; companyName: string; recommendation: string; success: boolean; error?: string }[] = []

    if (companyId) {
      // Analyze single company
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, name, symbol, extra_data')
        .eq('id', companyId)
        .single()

      if (error || !company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }

      const result = await analyzeAndStore(supabase, service, company)
      results.push(result)
    } else {
      // Analyze all buy radar companies
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name, symbol, extra_data')
        .or(
          'extra_data->>Thier_Group.in.(2026,2026*,2026**,2026***),' +
          'extra_data->>VIP.eq.Defcon 1'
        )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      for (const company of companies || []) {
        try {
          const result = await analyzeAndStore(supabase, service, company)
          results.push(result)
          // 2s delay between analyses to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (err) {
          results.push({
            companyId: company.id,
            companyName: company.name,
            recommendation: 'error',
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }
    }

    return NextResponse.json({
      analyzed: results.length,
      successful: results.filter(r => r.success).length,
      results,
    })
  } catch (error) {
    console.error('Error in POST /api/buy-radar/analyze:', error)
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

  return {
    companyId: company.id,
    companyName: company.name,
    recommendation: analysis.recommendation,
    success: true,
  }
}
