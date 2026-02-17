import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/buy-radar/filters
 * Returns distinct Thier_Group and VIP values with counts
 */
export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch all companies with Thier_Group or VIP set
    const { data, error } = await supabase
      .from('companies')
      .select('extra_data')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count distinct Thier_Group values
    const thierGroupCounts: Record<string, number> = {}
    const vipCounts: Record<string, number> = {}

    for (const row of data || []) {
      const ed = row.extra_data as Record<string, unknown> | null
      if (!ed) continue

      const tg = ed['Thier_Group'] as string | null | undefined
      if (tg && typeof tg === 'string' && tg.trim()) {
        const key = tg.trim()
        thierGroupCounts[key] = (thierGroupCounts[key] || 0) + 1
      }

      const vip = ed['VIP'] as string | null | undefined
      if (vip && typeof vip === 'string' && vip.trim()) {
        const key = vip.trim()
        vipCounts[key] = (vipCounts[key] || 0) + 1
      }
    }

    // Sort by count descending
    const thierGroups = Object.entries(thierGroupCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)

    const vipLevels = Object.entries(vipCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ thierGroups, vipLevels })
  } catch (error) {
    console.error('Error in GET /api/buy-radar/filters:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
