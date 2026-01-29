'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2 } from 'lucide-react'

interface WatchlistItem {
  id: string
  company_id: string
  added_at: string
  notes: string | null
  companies: {
    id: string
    name: string
    symbol: string | null
    wkn: string | null
    isin: string | null
    current_price: number | null
    extra_data: Record<string, unknown>
  }
}

export default function WatchlistPage() {
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist')
      const data = await response.json()

      if (response.ok) {
        setWatchlist(data.watchlist || [])
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (companyId: string) => {
    if (!confirm('Remove this company from your watchlist?')) return

    try {
      const response = await fetch(`/api/watchlist?company_id=${companyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state
        setWatchlist(watchlist.filter(item => item.company_id !== companyId))
      } else {
        alert('Failed to remove from watchlist')
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
      alert('Failed to remove from watchlist')
    }
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') return value.toLocaleString()
    return value.toString()
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Watchlist</h2>
        <p className="text-muted-foreground">
          {watchlist.length} companies you&apos;re monitoring
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              Loading watchlist...
            </div>
          ) : watchlist.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4 text-muted-foreground">
              <div>Your watchlist is empty</div>
              <Button onClick={() => router.push('/stocks')}>
                Browse Stocks
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Change %</TableHead>
                    <TableHead>Market Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlist.map((item) => {
                    const company = item.companies
                    const ed = company.extra_data || {}

                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/stocks/${company.id}`)}
                      >
                        <TableCell className="font-medium">
                          {company.name}
                        </TableCell>
                        <TableCell>
                          {company.symbol || ed.Ticker || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {ed.Current_Price
                            ? `${formatValue(ed.Current_Price)} ${ed.Currency || 'USD'}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {ed.Price_Change_Percent !== null && ed.Price_Change_Percent !== undefined ? (
                            <span className={ed.Price_Change_Percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {ed.Price_Change_Percent > 0 ? '+' : ''}{formatValue(ed.Price_Change_Percent)}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{ed.Market_Status || '-'}</TableCell>
                        <TableCell>
                          {new Date(item.added_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemove(company.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
