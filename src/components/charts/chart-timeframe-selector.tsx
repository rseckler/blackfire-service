/**
 * Chart Timeframe Selector
 *
 * Button group for selecting chart timeframe
 */

import { Timeframe } from '@/lib/services/stock-price-service'
import { cn } from '@/lib/utils'

interface ChartTimeframeSelectorProps {
  value: Timeframe
  onChange: (timeframe: Timeframe) => void
  className?: string
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
]

export function ChartTimeframeSelector({
  value,
  onChange,
  className,
}: ChartTimeframeSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1 rounded-lg border bg-muted/50 p-1', className)}>
      {TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe.value}
          onClick={() => onChange(timeframe.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            'hover:bg-background/80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === timeframe.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          )}
          aria-label={`View ${timeframe.label} chart`}
          aria-pressed={value === timeframe.value}
        >
          {timeframe.label}
        </button>
      ))}
    </div>
  )
}
