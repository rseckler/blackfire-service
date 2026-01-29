import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StocksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Stocks</h2>
        <p className="text-muted-foreground">
          Browse and analyze stocks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            Stock database coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
