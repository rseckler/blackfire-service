/**
 * Alpha Vantage API Client
 *
 * Provides stock price data with rate limiting and error handling.
 * Free tier: 25 requests/day, 5 requests/minute
 *
 * API Documentation: https://www.alphavantage.co/documentation/
 */

export interface AlphaVantageTimeSeriesData {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface AlphaVantageMetadata {
  symbol: string
  lastRefreshed: string
  timeZone: string
  interval?: string
}

export interface AlphaVantageResponse {
  data: AlphaVantageTimeSeriesData[]
  metadata: AlphaVantageMetadata
}

export type AlphaVantageInterval = '1min' | '5min' | '15min' | '30min' | '60min'
export type AlphaVantageFunction =
  | 'TIME_SERIES_INTRADAY'
  | 'TIME_SERIES_DAILY'
  | 'TIME_SERIES_WEEKLY'
  | 'TIME_SERIES_MONTHLY'

interface AlphaVantageAPIError {
  'Error Message'?: string
  'Note'?: string
  'Information'?: string
}

class AlphaVantageError extends Error {
  constructor(
    message: string,
    public code: 'RATE_LIMIT' | 'API_ERROR' | 'INVALID_SYMBOL' | 'NETWORK_ERROR',
    public details?: unknown
  ) {
    super(message)
    this.name = 'AlphaVantageError'
  }
}

export class AlphaVantageClient {
  private readonly apiKey: string
  private readonly baseUrl = 'https://www.alphavantage.co/query'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY || ''

    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key is required. Set ALPHA_VANTAGE_API_KEY environment variable.')
    }
  }

  /**
   * Fetch intraday stock prices (1min, 5min, 15min, 30min, 60min intervals)
   * Use for: 1D, 1W, 1M timeframes
   */
  async getIntradayPrices(
    symbol: string,
    interval: AlphaVantageInterval = '5min',
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<AlphaVantageResponse> {
    const params = new URLSearchParams({
      function: 'TIME_SERIES_INTRADAY',
      symbol,
      interval,
      outputsize: outputSize,
      apikey: this.apiKey,
    })

    return this.fetchTimeSeries(params, `Time Series (${interval})`)
  }

  /**
   * Fetch daily stock prices
   * Use for: 3M, 6M, 1Y timeframes
   */
  async getDailyPrices(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<AlphaVantageResponse> {
    const params = new URLSearchParams({
      function: 'TIME_SERIES_DAILY',
      symbol,
      outputsize: outputSize,
      apikey: this.apiKey,
    })

    return this.fetchTimeSeries(params, 'Time Series (Daily)')
  }

  /**
   * Fetch weekly stock prices
   * Use for: ALL timeframe
   */
  async getWeeklyPrices(symbol: string): Promise<AlphaVantageResponse> {
    const params = new URLSearchParams({
      function: 'TIME_SERIES_WEEKLY',
      symbol,
      apikey: this.apiKey,
    })

    return this.fetchTimeSeries(params, 'Weekly Time Series')
  }

  /**
   * Fetch monthly stock prices
   * Use for: Very long timeframes
   */
  async getMonthlyPrices(symbol: string): Promise<AlphaVantageResponse> {
    const params = new URLSearchParams({
      function: 'TIME_SERIES_MONTHLY',
      symbol,
      apikey: this.apiKey,
    })

    return this.fetchTimeSeries(params, 'Monthly Time Series')
  }

  /**
   * Generic time series fetcher
   */
  private async fetchTimeSeries(
    params: URLSearchParams,
    timeSeriesKey: string
  ): Promise<AlphaVantageResponse> {
    const url = `${this.baseUrl}?${params.toString()}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // No cache - we handle caching at service layer
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new AlphaVantageError(
          `HTTP ${response.status}: ${response.statusText}`,
          'NETWORK_ERROR'
        )
      }

      const json = await response.json() as Record<string, unknown>

      // Check for API errors
      const errorCheck = json as AlphaVantageAPIError

      if (errorCheck['Error Message']) {
        throw new AlphaVantageError(
          errorCheck['Error Message'],
          'INVALID_SYMBOL',
          json
        )
      }

      if (errorCheck['Note']) {
        // Rate limit message
        throw new AlphaVantageError(
          'API rate limit reached. Please try again later.',
          'RATE_LIMIT',
          json
        )
      }

      if (errorCheck['Information']) {
        // Information message (could be rate limit or other info)
        if (errorCheck['Information'].toLowerCase().includes('rate limit')) {
          throw new AlphaVantageError(
            'API rate limit reached. Please try again later.',
            'RATE_LIMIT',
            json
          )
        }
        throw new AlphaVantageError(
          errorCheck['Information'],
          'API_ERROR',
          json
        )
      }

      // Extract metadata
      const metaData = json['Meta Data'] as Record<string, string> | undefined
      if (!metaData) {
        throw new AlphaVantageError(
          'Invalid API response: missing metadata',
          'API_ERROR',
          json
        )
      }

      // Extract time series data
      const timeSeries = json[timeSeriesKey] as Record<string, Record<string, string>> | undefined
      if (!timeSeries) {
        throw new AlphaVantageError(
          `Invalid API response: missing time series data (${timeSeriesKey})`,
          'API_ERROR',
          json
        )
      }

      // Transform to our format
      const data: AlphaVantageTimeSeriesData[] = Object.entries(timeSeries).map(
        ([timestamp, values]) => ({
          timestamp,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'], 10),
        })
      ).sort((a, b) =>
        // Sort ascending by timestamp
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      const metadata: AlphaVantageMetadata = {
        symbol: metaData['2. Symbol'] || metaData['1. Symbol'] || '',
        lastRefreshed: metaData['3. Last Refreshed'] || '',
        timeZone: metaData['4. Time Zone'] || metaData['5. Time Zone'] || 'US/Eastern',
        interval: metaData['4. Interval'],
      }

      return { data, metadata }
    } catch (error) {
      if (error instanceof AlphaVantageError) {
        throw error
      }

      // Network or parsing error
      throw new AlphaVantageError(
        `Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        error
      )
    }
  }

  /**
   * Get appropriate API function and interval for a given timeframe
   * NOTE: Free tier only supports DAILY, WEEKLY, MONTHLY (no intraday)
   */
  static getTimeframeConfig(timeframe: string): {
    function: AlphaVantageFunction
    interval?: AlphaVantageInterval
    outputSize: 'compact' | 'full'
  } {
    switch (timeframe) {
      case '1D':
      case '1W':
      case '1M':
        // Free tier doesn't support intraday - use daily data for all short timeframes
        return { function: 'TIME_SERIES_DAILY', outputSize: 'compact' }
      case '3M':
      case '6M':
      case '1Y':
        return { function: 'TIME_SERIES_DAILY', outputSize: 'full' }
      case 'ALL':
        return { function: 'TIME_SERIES_WEEKLY', outputSize: 'compact' }
      default:
        return { function: 'TIME_SERIES_DAILY', outputSize: 'compact' }
    }
  }
}

// Export singleton instance
let alphaVantageClient: AlphaVantageClient | null = null

export function getAlphaVantageClient(): AlphaVantageClient {
  if (!alphaVantageClient) {
    alphaVantageClient = new AlphaVantageClient()
  }
  return alphaVantageClient
}

export { AlphaVantageError }
