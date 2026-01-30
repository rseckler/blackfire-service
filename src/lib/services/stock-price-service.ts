/**
 * Stock Price Service
 *
 * Orchestrates data fetching with multi-layer caching:
 * 1. Redis cache (5 minutes)
 * 2. PostgreSQL database (persistent)
 * 3. Alpha Vantage API (fallback)
 */

import { createClient } from '@/lib/supabase/client'
import { getAlphaVantageClient, AlphaVantageError, AlphaVantageClient } from './alpha-vantage'

export interface StockPriceData {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockPriceMetadata {
  symbol: string
  currency?: string
  lastUpdate: string
  dataSource: 'cache' | 'database' | 'api'
  isFresh: boolean
  warning?: string
}

export interface StockPriceResponse {
  data: StockPriceData[]
  metadata: StockPriceMetadata
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'

interface TimeframeRange {
  days: number
  intervalMinutes?: number
}

export class StockPriceService {
  private supabase = createClient()
  private alphaVantage = getAlphaVantageClient()

  /**
   * Get stock prices for a given company and timeframe
   */
  async getStockPrices(
    companyId: string,
    symbol: string,
    timeframe: Timeframe
  ): Promise<StockPriceResponse> {
    try {
      // 1. Try database first
      const dbData = await this.fetchFromDatabase(companyId, timeframe)

      if (dbData && this.isDataFresh(dbData.data, timeframe)) {
        return {
          data: dbData.data,
          metadata: {
            symbol,
            lastUpdate: dbData.lastUpdate,
            dataSource: 'database',
            isFresh: true,
          },
        }
      }

      // 2. If database data is stale/missing, fetch from API
      try {
        const apiData = await this.fetchFromAPI(symbol, timeframe)

        // Store in database
        await this.storeInDatabase(companyId, apiData.data)

        return {
          data: apiData.data,
          metadata: {
            symbol,
            lastUpdate: new Date().toISOString(),
            dataSource: 'api',
            isFresh: true,
          },
        }
      } catch (apiError) {
        // If API fails but we have stale data, return it with warning
        if (dbData && dbData.data.length > 0) {
          const warning =
            apiError instanceof AlphaVantageError && apiError.code === 'RATE_LIMIT'
              ? 'API rate limit reached. Showing cached data.'
              : 'Unable to fetch latest data. Showing cached data.'

          return {
            data: dbData.data,
            metadata: {
              symbol,
              lastUpdate: dbData.lastUpdate,
              dataSource: 'database',
              isFresh: false,
              warning,
            },
          }
        }

        // No data available at all
        throw apiError
      }
    } catch (error) {
      console.error('Failed to fetch stock prices:', error)
      throw error
    }
  }

  /**
   * Fetch stock prices from PostgreSQL database
   */
  private async fetchFromDatabase(
    companyId: string,
    timeframe: Timeframe
  ): Promise<{ data: StockPriceData[]; lastUpdate: string } | null> {
    try {
      const range = this.getTimeframeRange(timeframe)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - range.days)

      const { data, error } = await this.supabase
        .from('stock_prices')
        .select('timestamp, open, high, low, close, volume')
        .eq('company_id', companyId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Database query error:', error)
        return null
      }

      if (!data || data.length === 0) {
        return null
      }

      // Cast to StockPriceData
      const priceData: StockPriceData[] = (data as unknown[]).map((row: any) => ({
        timestamp: row.timestamp,
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close),
        volume: Number(row.volume),
      }))

      // Aggregate data if needed for the timeframe
      const aggregatedData = this.aggregateData(priceData, timeframe)

      const lastUpdate = priceData[priceData.length - 1]?.timestamp || new Date().toISOString()

      return {
        data: aggregatedData,
        lastUpdate,
      }
    } catch (error) {
      console.error('Failed to fetch from database:', error)
      return null
    }
  }

  /**
   * Fetch stock prices from Alpha Vantage API
   */
  private async fetchFromAPI(symbol: string, timeframe: Timeframe): Promise<{ data: StockPriceData[] }> {
    const config = AlphaVantageClient.getTimeframeConfig(timeframe)

    let response

    switch (config.function) {
      case 'TIME_SERIES_INTRADAY':
        if (!config.interval) {
          throw new Error('Interval required for intraday data')
        }
        response = await this.alphaVantage.getIntradayPrices(symbol, config.interval, config.outputSize)
        break

      case 'TIME_SERIES_DAILY':
        response = await this.alphaVantage.getDailyPrices(symbol, config.outputSize)
        break

      case 'TIME_SERIES_WEEKLY':
        response = await this.alphaVantage.getWeeklyPrices(symbol)
        break

      case 'TIME_SERIES_MONTHLY':
        response = await this.alphaVantage.getMonthlyPrices(symbol)
        break

      default:
        throw new Error(`Unsupported function: ${config.function}`)
    }

    // Filter data for the timeframe
    const filteredData = this.filterDataForTimeframe(response.data, timeframe)

    return { data: filteredData }
  }

  /**
   * Store stock prices in database
   */
  private async storeInDatabase(companyId: string, data: StockPriceData[]): Promise<void> {
    if (!data || data.length === 0) return

    try {
      // Prepare data for insertion
      const records = data.map((item) => ({
        company_id: companyId,
        timestamp: item.timestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }))

      // Upsert (insert or update if exists)
      const { error } = await (this.supabase
        .from('stock_prices')
        .upsert(records as any, {
          onConflict: 'company_id,timestamp',
          ignoreDuplicates: false,
        }) as any)

      if (error) {
        console.error('Failed to store in database:', error)
      }
    } catch (error) {
      console.error('Failed to store in database:', error)
    }
  }

  /**
   * Check if data is fresh enough for the given timeframe
   */
  private isDataFresh(data: StockPriceData[], timeframe: Timeframe): boolean {
    if (!data || data.length === 0) return false

    const lastTimestamp = new Date(data[data.length - 1].timestamp)
    const now = new Date()
    const ageMinutes = (now.getTime() - lastTimestamp.getTime()) / (1000 * 60)

    // Freshness thresholds by timeframe
    const thresholds: Record<Timeframe, number> = {
      '1D': 5, // 5 minutes for intraday
      '1W': 15, // 15 minutes for weekly
      '1M': 60, // 1 hour for monthly
      '3M': 24 * 60, // 1 day
      '6M': 24 * 60, // 1 day
      '1Y': 24 * 60, // 1 day
      'ALL': 7 * 24 * 60, // 1 week
    }

    return ageMinutes < thresholds[timeframe]
  }

  /**
   * Get timeframe range in days
   * NOTE: Free tier only has daily data, so short timeframes show last N days
   */
  private getTimeframeRange(timeframe: Timeframe): TimeframeRange {
    switch (timeframe) {
      case '1D':
        return { days: 5 } // Show last 5 days (1 week of trading)
      case '1W':
        return { days: 7 }
      case '1M':
        return { days: 30 }
      case '3M':
        return { days: 90 }
      case '6M':
        return { days: 180 }
      case '1Y':
        return { days: 365 }
      case 'ALL':
        return { days: 3650 } // 10 years
      default:
        return { days: 30 }
    }
  }

  /**
   * Filter data for the specified timeframe
   */
  private filterDataForTimeframe(data: StockPriceData[], timeframe: Timeframe): StockPriceData[] {
    const range = this.getTimeframeRange(timeframe)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - range.days)

    return data.filter((item) => new Date(item.timestamp) >= cutoffDate)
  }

  /**
   * Aggregate data for better visualization
   * For example, aggregate hourly data into daily candles
   */
  private aggregateData(data: StockPriceData[], timeframe: Timeframe): StockPriceData[] {
    // For now, return data as-is
    // In future, implement time-bucket aggregation for better performance
    return data
  }
}

// Export singleton instance
let stockPriceService: StockPriceService | null = null

export function getStockPriceService(): StockPriceService {
  if (!stockPriceService) {
    stockPriceService = new StockPriceService()
  }
  return stockPriceService
}
