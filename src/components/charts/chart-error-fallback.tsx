/**
 * Chart Error Fallback
 *
 * Error state for charts with retry functionality
 */

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChartErrorFallbackProps {
  error: Error
  onRetry?: () => void
  warning?: string
}

export function ChartErrorFallback({ error, onRetry, warning }: ChartErrorFallbackProps) {
  const isRateLimitError = error.message.toLowerCase().includes('rate limit')

  return (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border bg-card">
      <div className="flex max-w-md flex-col items-center space-y-4 p-8 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {isRateLimitError ? 'Rate Limit Reached' : 'Unable to Load Chart'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isRateLimitError
              ? 'API rate limit has been reached. Please try again later or check back tomorrow.'
              : warning || error.message || 'An error occurred while loading the chart data.'}
          </p>
        </div>

        {onRetry && !isRateLimitError && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}

        {isRateLimitError && (
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Free tier limit: 25 requests per day
          </div>
        )}
      </div>
    </div>
  )
}
