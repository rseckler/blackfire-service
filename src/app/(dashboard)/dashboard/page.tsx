'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Star, FileText, TrendingUp, RefreshCw, Database, BarChart3, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SyncStatus {
  lastPriceUpdate: string | null
  totalCompanies: number
  stocksWithPrices: number
}

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
    title: "Today's Gain",
    value: '$0.00',
    icon: TrendingUp,
    description: 'Daily performance',
  },
]

export default function DashboardPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncLoading, setSyncLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sync-status')
      .then((res) => res.json())
      .then((data) => setSyncStatus(data))
      .catch((err) => console.error('Failed to fetch sync status:', err))
      .finally(() => setSyncLoading(false))
  }, [])

  const lastUpdateRelative = syncStatus?.lastPriceUpdate
    ? formatDistanceToNow(new Date(syncStatus.lastPriceUpdate), { addSuffix: true })
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Your investment portfolio at a glance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

        {/* Last Sync Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${syncLoading ? 'animate-spin' : ''}`} />
          </CardHeader>
          <CardContent>
            {syncLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">...</div>
            ) : lastUpdateRelative ? (
              <>
                <div className="text-2xl font-bold">{lastUpdateRelative}</div>
                <p className="text-xs text-muted-foreground">
                  {syncStatus!.totalCompanies.toLocaleString()} companies, {syncStatus!.stocksWithPrices.toLocaleString()} with prices
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">No data</div>
                <p className="text-xs text-muted-foreground">No price updates yet</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            {syncLoading ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Loading status...
              </div>
            ) : syncStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Price Update</p>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus.lastPriceUpdate
                        ? `${new Date(syncStatus.lastPriceUpdate).toLocaleString()} (${lastUpdateRelative})`
                        : 'No updates yet'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Companies</p>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus.totalCompanies.toLocaleString()} in database
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Stocks with Prices</p>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus.stocksWithPrices.toLocaleString()} of {syncStatus.totalCompanies.toLocaleString()} ({syncStatus.totalCompanies > 0 ? Math.round((syncStatus.stocksWithPrices / syncStatus.totalCompanies) * 100) : 0}%)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Failed to load status
              </div>
            )}
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
