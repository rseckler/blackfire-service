import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
        <p className="text-muted-foreground">
          Track your investments and performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            Portfolio management coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
