import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const offset = (page - 1) * limit

    // Build query - include extra_data
    let query = supabase
      .from('companies')
      .select('id, name, symbol, wkn, isin, satellog, current_price, extra_data, created_at', { count: 'exact' })

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,symbol.ilike.%${search}%,wkn.ilike.%${search}%,isin.ilike.%${search}%`)
    }

    // Sorting - handle both direct columns and extra_data fields
    const directColumns = ['name', 'symbol', 'wkn', 'isin', 'current_price', 'created_at', 'satellog']

    if (directColumns.includes(sortBy)) {
      // Sort by direct column
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    } else {
      // Sort by extra_data field using JSONB arrow operator
      query = query.order(`extra_data->${sortBy}` as any, { ascending: sortOrder === 'asc' })
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch companies', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      companies: data,
      total: count,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    })
  } catch (error) {
    console.error('Error in companies API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
