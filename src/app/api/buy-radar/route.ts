import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/buy-radar?thierGroups=2026*,2026**&vipLevels=Defcon 1
 * Returns buy radar companies matching the given filters.
 * Both filters use AND logic: company must match thierGroups AND vipLevels.
 * If only one filter is set, only that filter applies.
 * If no filters → empty list.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const thierGroupsParam = searchParams.get('thierGroups')
    const vipLevelsParam = searchParams.get('vipLevels')

    // Parse comma-separated filter values
    const thierGroups = thierGroupsParam
      ? thierGroupsParam.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const vipLevels = vipLevelsParam
      ? vipLevelsParam.split(',').map(s => s.trim()).filter(Boolean)
      : []

    // No filters → empty list (user must choose filters first)
    if (thierGroups.length === 0 && vipLevels.length === 0) {
      return NextResponse.json({ companies: [] })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Build query: fetch companies matching filters
    let query = supabase
      .from('companies')
      .select('id, name, symbol, extra_data')

    // AND logic: both filters must match if both are set
    if (thierGroups.length > 0 && vipLevels.length > 0) {
      query = query
        .in('extra_data->>Thier_Group', thierGroups)
        .in('extra_data->>VIP', vipLevels)
    } else if (thierGroups.length > 0) {
      query = query.in('extra_data->>Thier_Group', thierGroups)
    } else {
      query = query.in('extra_data->>VIP', vipLevels)
    }

    const { data: companies, error } = await query

    if (error) {
      console.error('Error fetching buy radar companies:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch latest analysis for each company
    const companyIds = (companies || []).map(c => c.id)

    if (companyIds.length === 0) {
      return NextResponse.json({ companies: [] })
    }

    // Get latest analysis per company using distinct on
    const { data: analyses, error: analysisError } = await supabase
      .from('buy_radar_analyses')
      .select('*')
      .in('company_id', companyIds)
      .order('company_id')
      .order('created_at', { ascending: false })

    if (analysisError) {
      console.error('Error fetching analyses:', analysisError)
    }

    // Build a map of latest analysis per company
    const latestAnalysis = new Map<string, typeof analyses extends (infer T)[] ? T : never>()
    for (const a of analyses || []) {
      if (!latestAnalysis.has(a.company_id)) {
        latestAnalysis.set(a.company_id, a)
      }
    }

    // Combine companies with their latest analysis
    const result = (companies || []).map(c => {
      const analysis = latestAnalysis.get(c.id)
      return {
        company_id: c.id,
        company_name: c.name,
        symbol: c.symbol,
        extra_data: c.extra_data,
        latest_analysis_id: analysis?.id || null,
        recommendation: analysis?.recommendation || null,
        confidence: analysis?.confidence || null,
        reasoning: analysis?.reasoning || null,
        summary: analysis?.summary || null,
        current_price: analysis?.current_price || null,
        target_price: analysis?.target_price || null,
        price_gap_percent: analysis?.price_gap_percent || null,
        catalysts: analysis?.catalysts || null,
        risks: analysis?.risks || null,
        web_research_summary: analysis?.web_research_summary || null,
        data_sources: analysis?.data_sources || null,
        model_used: analysis?.model_used || null,
        analysis_duration_ms: analysis?.analysis_duration_ms || null,
        analyzed_at: analysis?.created_at || null,
      }
    })

    return NextResponse.json({ companies: result })
  } catch (error) {
    console.error('Error in GET /api/buy-radar:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
