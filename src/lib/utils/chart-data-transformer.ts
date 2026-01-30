/**
 * Chart Data Transformer
 *
 * Transforms stock price data into formats suitable for TradingView Lightweight Charts
 */

import { StockPriceData } from '@/lib/services/stock-price-service'
import { Time } from 'lightweight-charts'

export interface CandlestickData {
  time: Time
  open: number
  high: number
  low: number
  close: number
}

export interface AreaData {
  time: Time
  value: number
}

export interface VolumeData {
  time: Time
  value: number
  color?: string
}

export interface TransformedChartData {
  candlestick: CandlestickData[]
  area: AreaData[]
  volume: VolumeData[]
}

/**
 * Transform API data to TradingView chart format
 */
export function transformToChartData(data: StockPriceData[]): TransformedChartData {
  if (!data || data.length === 0) {
    return {
      candlestick: [],
      area: [],
      volume: [],
    }
  }

  const candlestick: CandlestickData[] = []
  const area: AreaData[] = []
  const volume: VolumeData[] = []

  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    // For daily data, use YYYY-MM-DD format as Time type
    const date = new Date(item.timestamp)
    const time = date.toISOString().split('T')[0] as Time

    // Candlestick data
    candlestick.push({
      time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    })

    // Area data (use close price)
    area.push({
      time,
      value: item.close,
    })

    // Volume data with color (green for up, red for down)
    const previousClose = i > 0 ? data[i - 1].close : item.open
    const isUp = item.close >= previousClose

    volume.push({
      time,
      value: item.volume,
      color: isUp ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)', // green-500 / red-500
    })
  }

  return {
    candlestick,
    area,
    volume,
  }
}

/**
 * Calculate price change statistics
 */
export function calculatePriceStats(data: StockPriceData[]) {
  if (!data || data.length === 0) {
    return null
  }

  const firstPrice = data[0].close
  const lastPrice = data[data.length - 1].close
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = (priceChange / firstPrice) * 100

  const high = Math.max(...data.map((d) => d.high))
  const low = Math.min(...data.map((d) => d.low))

  return {
    firstPrice,
    lastPrice,
    priceChange,
    priceChangePercent,
    high,
    low,
    range: high - low,
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

/**
 * Format volume for display
 */
export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`
  }
  return volume.toFixed(0)
}

/**
 * Format timestamp for tooltip
 */
export function formatTimestamp(timestamp: number, includeTime = true): string {
  const date = new Date(timestamp * 1000)

  if (includeTime) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
