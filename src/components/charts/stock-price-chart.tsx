/**
 * Stock Price Chart
 *
 * Interactive TradingView chart with multiple timeframes
 */

'use client'

import { useEffect, useRef, useState, memo, useCallback } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeriesPartialOptions,
  AreaSeriesPartialOptions,
  HistogramSeriesPartialOptions,
} from 'lightweight-charts'
import { Timeframe } from '@/lib/services/stock-price-service'
import { useStockChartData } from './hooks/use-stock-chart-data'
import { ChartTimeframeSelector } from './chart-timeframe-selector'
import { ChartLoadingSkeleton } from './chart-loading-skeleton'
import { ChartErrorFallback } from './chart-error-fallback'
import {
  transformToChartData,
  calculatePriceStats,
  formatPrice,
  formatVolume,
  formatTimestamp,
} from '@/lib/utils/chart-data-transformer'
import { AlertCircle } from 'lucide-react'

interface StockPriceChartProps {
  companyId: string
  symbol: string
  companyName: string
  currency?: string
  className?: string
}

function StockPriceChartComponent({
  companyId,
  symbol,
  companyName,
  currency = 'USD',
  className,
}: StockPriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  // Fetch data
  const { data, isLoading, isError, error, refetch } = useStockChartData({
    companyId,
    timeframe,
  })

  // Debug logging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Chart Debug:', {
        companyId,
        symbol,
        timeframe,
        hasData: !!data,
        dataLength: data?.data?.length || 0,
        isLoading,
        isError,
        error: error?.message,
      })
    }
  }, [companyId, symbol, timeframe, data, isLoading, isError, error])

  // Callback ref that initializes chart when container mounts
  const chartContainerRef = useCallback((container: HTMLDivElement | null) => {
    if (!container) {
      // Container unmounted - cleanup
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candlestickSeriesRef.current = null
        areaSeriesRef.current = null
        volumeSeriesRef.current = null
      }
      return
    }

    // Skip if already initialized
    if (chartRef.current) {
      return
    }

    // Chart options inline
    const chartOptions = {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: container.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
      },
      crosshair: {
        mode: 1 as const, // CrosshairMode.Normal
        vertLine: {
          width: 1 as const,
          color: '#9B7DFF',
          style: 1 as const,
        },
        horzLine: {
          width: 1 as const,
          color: '#9B7DFF',
          style: 1 as const,
        },
      },
    }

    const candlestickOptions = {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    }

    const volumeOptions = {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    }

    const chart = createChart(container, chartOptions)
    chartRef.current = chart

    // Free tier only supports daily data - use candlestick for all timeframes
    candlestickSeriesRef.current = chart.addCandlestickSeries(
      candlestickOptions as CandlestickSeriesPartialOptions
    )

    // Add volume series
    volumeSeriesRef.current = chart.addHistogramSeries(volumeOptions as HistogramSeriesPartialOptions)

    // Handle resize
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup will happen when callback ref is called with null
  }, [])

  // Update chart data
  useEffect(() => {
    if (!data?.data || data.data.length === 0) {
      return
    }

    const transformed = transformToChartData(data.data)

    // Update price series (candlestick for all timeframes)
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(transformed.candlestick)
    }

    // Update volume series
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(transformed.volume)
    }

    // Fit content to visible range
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [data, timeframe])

  const handleTimeframeChange = useCallback((newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe)
  }, [])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  // Calculate stats
  const stats = data?.data ? calculatePriceStats(data.data) : null

  // Always render chart container (for callback ref to work)
  // Show loading/error/empty states as overlays
  return (
    <div className={className}>
      <div className="rounded-lg border bg-card">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Price Stats */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-bold">
                  {stats ? formatPrice(stats.lastPrice, currency) : '-'}
                </h3>
                {stats && (
                  <div
                    className={`flex items-baseline gap-1 text-sm font-medium ${
                      stats.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <span>
                      {stats.priceChange >= 0 ? '+' : ''}
                      {formatPrice(stats.priceChange, currency)}
                    </span>
                    <span>
                      ({stats.priceChange >= 0 ? '+' : ''}
                      {stats.priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{companyName}</span>
                <span>•</span>
                <span>{symbol}</span>
                {data?.metadata?.warning && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      {data.metadata.warning}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Timeframe Selector */}
            <ChartTimeframeSelector value={timeframe} onChange={handleTimeframeChange} />
          </div>
        </div>

        {/* Chart Container - always rendered for ref callback */}
        <div className="relative p-4">
          {/* Chart canvas */}
          <div ref={chartContainerRef} className="h-[500px] w-full" />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-4 flex items-center justify-center bg-white/90">
              <ChartLoadingSkeleton />
            </div>
          )}

          {/* Error overlay */}
          {isError && error && !isLoading && (
            <div className="absolute inset-4 flex items-center justify-center bg-white/90">
              <ChartErrorFallback error={error} onRetry={handleRetry} warning={data?.metadata.warning} />
            </div>
          )}

          {/* No data overlay */}
          {!isLoading && !isError && (!data?.data || data.data.length === 0) && (
            <div className="absolute inset-4 flex items-center justify-center bg-white/90">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                <p>No price data available for {symbol}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {stats && (
          <div className="border-t px-4 py-3">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">High: </span>
                <span className="font-medium">{formatPrice(stats.high, currency)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Low: </span>
                <span className="font-medium">{formatPrice(stats.low, currency)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Range: </span>
                <span className="font-medium">{formatPrice(stats.range, currency)}</span>
              </div>
              {data.data[data.data.length - 1]?.volume && (
                <div>
                  <span className="text-muted-foreground">Volume: </span>
                  <span className="font-medium">
                    {formatVolume(data.data[data.data.length - 1].volume)}
                  </span>
                </div>
              )}
              <div className="ml-auto text-muted-foreground">
                Last updated: {new Date(data.metadata.lastUpdate).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const StockPriceChart = memo(StockPriceChartComponent)
