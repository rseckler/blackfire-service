/**
 * Chart Configuration Hook
 *
 * Provides TradingView Lightweight Charts configuration
 */

import { useMemo } from 'react'
import { DeepPartial, ChartOptions, TimeScaleOptions } from 'lightweight-charts'

interface UseChartConfigOptions {
  height?: number
  theme?: 'light' | 'dark'
}

export function useChartConfig({ height = 500, theme = 'light' }: UseChartConfigOptions = {}) {
  const chartOptions: DeepPartial<ChartOptions> = useMemo(() => {
    const isDark = theme === 'dark'

    return {
      width: 0, // Will be set dynamically
      height,
      layout: {
        background: {
          color: isDark ? '#1a1a1a' : '#ffffff',
        },
        textColor: isDark ? '#d1d5db' : '#374151',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: {
          color: isDark ? '#2d2d2d' : '#f3f4f6',
          style: 1,
        },
        horzLines: {
          color: isDark ? '#2d2d2d' : '#f3f4f6',
          style: 1,
        },
      },
      crosshair: {
        mode: 0, // Normal crosshair
        vertLine: {
          color: isDark ? '#6b7280' : '#9ca3af',
          width: 1,
          style: 3, // Dashed
          labelBackgroundColor: isDark ? '#374151' : '#e5e7eb',
        },
        horzLine: {
          color: isDark ? '#6b7280' : '#9ca3af',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#374151' : '#e5e7eb',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#2d2d2d' : '#e5e7eb',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: isDark ? '#2d2d2d' : '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 6,
        minBarSpacing: 0.5,
      } as DeepPartial<TimeScaleOptions>,
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    }
  }, [height, theme])

  const candlestickOptions = useMemo(() => {
    const isDark = theme === 'dark'

    return {
      upColor: '#22c55e', // green-500
      downColor: '#ef4444', // red-500
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: isDark ? '#4ade80' : '#16a34a', // green-400 / green-600
      wickDownColor: isDark ? '#f87171' : '#dc2626', // red-400 / red-600
    }
  }, [theme])

  const areaOptions = useMemo(() => {
    const isDark = theme === 'dark'

    return {
      topColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(96, 165, 250, 0.4)', // blue-500 with opacity
      bottomColor: isDark ? 'rgba(59, 130, 246, 0.0)' : 'rgba(96, 165, 250, 0.0)',
      lineColor: isDark ? '#3b82f6' : '#2563eb', // blue-500 / blue-600
      lineWidth: 2,
    }
  }, [theme])

  const volumeOptions = useMemo(() => {
    return {
      priceFormat: {
        type: 'volume' as const,
      },
      priceScaleId: '', // Use separate price scale
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    }
  }, [])

  return {
    chartOptions,
    candlestickOptions,
    areaOptions,
    volumeOptions,
  }
}
