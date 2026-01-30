/**
 * React Query Hook for Stock Chart Data
 *
 * Fetches stock price data with automatic caching and refetching
 */

import { useQuery } from '@tanstack/react-query'
import { Timeframe, StockPriceResponse } from '@/lib/services/stock-price-service'

interface UseStockChartDataOptions {
  companyId: string
  timeframe: Timeframe
  enabled?: boolean
}

interface UseStockChartDataResult {
  data: StockPriceResponse | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useStockChartData({
  companyId,
  timeframe,
  enabled = true,
}: UseStockChartDataOptions): UseStockChartDataResult {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['stockPrices', companyId, timeframe],
    queryFn: async () => {
      const response = await fetch(
        `/api/stocks/${companyId}/prices?timeframe=${timeframe}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json() as Promise<StockPriceResponse>
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch: () => {
      refetch()
    },
  }
}
