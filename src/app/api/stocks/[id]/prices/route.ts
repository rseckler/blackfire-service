/**
 * Stock Prices API Endpoint
 *
 * GET /api/stocks/[id]/prices?timeframe=1M
 *
 * Returns OHLCV data for stock charts with multi-layer caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStockPriceService, Timeframe } from '@/lib/services/stock-price-service'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const VALID_TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await context.params
    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get('timeframe') || '1M') as Timeframe

    // Validate timeframe
    if (!VALID_TIMEFRAMES.includes(timeframe)) {
      return NextResponse.json(
        { error: `Invalid timeframe. Must be one of: ${VALID_TIMEFRAMES.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch company to get symbol
    const supabase = await createClient()
    const { data, error: companyError } = await supabase
      .from('companies')
      .select('symbol, name')
      .eq('id', companyId)
      .single()

    if (companyError || !data) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const company = data as { symbol: string | null; name: string }
    const symbol = company.symbol

    if (!symbol) {
      return NextResponse.json(
        { error: 'Company does not have a stock symbol' },
        { status: 400 }
      )
    }

    // Fetch stock prices
    const stockPriceService = getStockPriceService()
    const result = await stockPriceService.getStockPrices(
      companyId,
      symbol,
      timeframe
    )

    // Set cache headers
    // - Cache for 5 minutes
    // - Allow stale data while revalidating for 1 minute
    const headers = new Headers({
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    })

    return NextResponse.json(result, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('API error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
