import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Star, FileText, TrendingUp } from 'lucide-react'

const stats = [
  {
    title: 'Portfolio Value',
    value: '$0.00',
    icon: Briefcase,
    description: 'Total portfolio value',
  },
  {
    title: 'Watchlist',
    value: '0',
    icon: Star,
    description: 'Stocks on your watchlist',
  },
  {
    title: 'Notes',
    value: '0',
    icon: FileText,
    description: 'Research notes',
  },
  {
    title: 'Today\'s Gain',
    value: '$0.00',
    icon: TrendingUp,
    description: 'Daily performance',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Your investment portfolio at a glance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No recent activity
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
              <p>Get started by:</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Adding stocks to your watchlist</li>
                <li>• Recording your first purchase</li>
                <li>• Creating research notes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
