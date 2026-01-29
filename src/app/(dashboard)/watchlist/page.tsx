import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Watchlist</h2>
        <p className="text-muted-foreground">
          Stocks you&apos;re monitoring
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            Watchlist feature coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
