/**
 * Chart Loading Skeleton
 *
 * Animated loading state for charts
 */

export function ChartLoadingSkeleton() {
  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-lg border bg-card">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-[420px] p-4">
        {/* Y-axis lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-px w-full bg-muted/50" />
          ))}
        </div>

        {/* Candlesticks simulation */}
        <div className="relative z-10 flex h-full items-end justify-around gap-1 px-4 pb-8">
          {[...Array(20)].map((_, i) => {
            const height = Math.random() * 60 + 20
            const delay = i * 50
            return (
              <div
                key={i}
                className="w-2 animate-pulse rounded-sm bg-muted"
                style={{
                  height: `${height}%`,
                  animationDelay: `${delay}ms`,
                }}
              />
            )
          })}
        </div>

        {/* Loading text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-background/80 px-6 py-3 text-sm text-muted-foreground backdrop-blur-sm">
            Loading chart data...
          </div>
        </div>
      </div>
    </div>
  )
}
