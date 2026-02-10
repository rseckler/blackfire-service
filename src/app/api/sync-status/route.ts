import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get total companies count
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })

    // Get count of stocks with prices + max Price_Update in one query
    const { data, error } = await supabase
      .from('companies')
      .select('extra_data')
      .not('extra_data->Current_Price', 'is', null)

    if (error) {
      console.error('Error fetching sync status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sync status' },
        { status: 500 }
      )
    }

    // Find the most recent Price_Update from results
    let lastPriceUpdate: string | null = null
    const stocksWithPrices = data?.length ?? 0

    if (data) {
      for (const row of data) {
        const update = row.extra_data?.Price_Update as string | undefined
        if (update && (!lastPriceUpdate || update > lastPriceUpdate)) {
          lastPriceUpdate = update
        }
      }
    }

    return NextResponse.json({
      lastPriceUpdate,
      totalCompanies: totalCompanies ?? 0,
      stocksWithPrices,
    })
  } catch (error) {
    console.error('Error in sync-status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
