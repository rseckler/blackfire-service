'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

interface Company {
  id: string
  name: string
  symbol: string | null
  wkn: string | null
  isin: string | null
  satellog: string
  current_price: number | null
  extra_data: Record<string, string | number | boolean | null>
  created_at: string
}

interface CompaniesResponse {
  companies: Company[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function StocksPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const limit = 50

  useEffect(() => {
    fetchCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortOrder])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
      })

      const response = await fetch(`/api/companies?${params}`)
      const data: CompaniesResponse = await response.json()

      setCompanies(data.companies)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const formatValue = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    if (typeof value === 'boolean') return value ? '✓' : '✗'
    return String(value)
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Stocks</h2>
        <p className="text-muted-foreground">
          Browse and analyze {total.toLocaleString()} companies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, symbol, WKN, or ISIN..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
              >
                Clear
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Loading companies...
              </div>
            ) : companies.length === 0 ? (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                No companies found
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {/* Core Fields */}
                        <TableHead className="sticky left-0 bg-background z-10 min-w-[250px]">
                          <button
                            className="flex items-center space-x-1 hover:text-foreground"
                            onClick={() => handleSort('name')}
                          >
                            <span>Name</span>
                            {sortBy === 'name' && (
                              <ArrowUpDown className="h-4 w-4" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="min-w-[100px]">Symbol</TableHead>
                        <TableHead className="min-w-[100px]">Ticker</TableHead>
                        <TableHead className="min-w-[100px]">WKN</TableHead>
                        <TableHead className="min-w-[120px]">ISIN</TableHead>

                        {/* Market Data */}
                        <TableHead className="text-right min-w-[100px]">Current Price</TableHead>
                        <TableHead className="text-right min-w-[100px]">Day High</TableHead>
                        <TableHead className="text-right min-w-[100px]">Day Low</TableHead>
                        <TableHead className="text-right min-w-[100px]">Price Change %</TableHead>
                        <TableHead className="min-w-[80px]">Currency</TableHead>
                        <TableHead className="text-right min-w-[120px]">Volume</TableHead>
                        <TableHead className="text-right min-w-[150px]">Market Cap</TableHead>
                        <TableHead className="min-w-[120px]">Market Status</TableHead>
                        <TableHead className="min-w-[150px]">Price Update</TableHead>

                        {/* Categories */}
                        <TableHead className="min-w-[150px]">Industry</TableHead>
                        <TableHead className="min-w-[100px]">Exchange</TableHead>
                        <TableHead className="min-w-[100px]">Thier</TableHead>
                        <TableHead className="min-w-[100px]">Thier Group</TableHead>
                        <TableHead className="min-w-[100px]">VIP</TableHead>
                        <TableHead className="min-w-[100px]">Prio Buy</TableHead>
                        <TableHead className="min-w-[100px]">Leverage</TableHead>

                        {/* Info Fields */}
                        <TableHead className="min-w-[150px]">Info1</TableHead>
                        <TableHead className="min-w-[150px]">Info2</TableHead>
                        <TableHead className="min-w-[150px]">Info3</TableHead>
                        <TableHead className="min-w-[150px]">Info5</TableHead>

                        {/* Source & Meta */}
                        <TableHead className="min-w-[100px]">Source</TableHead>
                        <TableHead className="text-right min-w-[100px]">Purchase $</TableHead>
                        <TableHead className="text-right min-w-[100px]">Ranking</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>

                        {/* UI Colors */}
                        <TableHead className="min-w-[120px]">Background</TableHead>
                        <TableHead className="min-w-[120px]">Font Color</TableHead>

                        {/* Profile - last because it's long */}
                        <TableHead className="min-w-[300px]">Profile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => {
                        const ed = company.extra_data || {}
                        return (
                          <TableRow
                            key={company.id}
                            className="cursor-pointer"
                            onClick={() => router.push(`/stocks/${company.id}`)}
                          >
                            {/* Core Fields */}
                            <TableCell className="sticky left-0 bg-background z-10 font-medium">
                              {company.name}
                            </TableCell>
                            <TableCell>
                              {company.symbol || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              {formatValue(ed.Ticker)}
                            </TableCell>
                            <TableCell>
                              {company.wkn || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              {company.isin || <span className="text-muted-foreground">-</span>}
                            </TableCell>

                            {/* Market Data */}
                            <TableCell className="text-right">
                              {ed.Current_Price ?
                                `${formatValue(ed.Current_Price)} ${ed.Currency || ''}`.trim() :
                                <span className="text-muted-foreground">-</span>
                              }
                            </TableCell>
                            <TableCell className="text-right">{formatValue(ed.Day_High)}</TableCell>
                            <TableCell className="text-right">{formatValue(ed.Day_Low)}</TableCell>
                            <TableCell className="text-right">
                              {typeof ed.Price_Change_Percent === 'number' ?
                                <span className={ed.Price_Change_Percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {ed.Price_Change_Percent > 0 ? '+' : ''}{formatValue(ed.Price_Change_Percent)}%
                                </span> :
                                <span className="text-muted-foreground">-</span>
                              }
                            </TableCell>
                            <TableCell>{formatValue(ed.Currency)}</TableCell>
                            <TableCell className="text-right">{formatValue(ed.Volume)}</TableCell>
                            <TableCell className="text-right">{formatValue(ed.Market_Cap)}</TableCell>
                            <TableCell>{formatValue(ed.Market_Status)}</TableCell>
                            <TableCell>
                              {(typeof ed.Price_Update === 'string' || typeof ed.Price_Update === 'number') ?
                                new Date(ed.Price_Update).toLocaleString() :
                                <span className="text-muted-foreground">-</span>
                              }
                            </TableCell>

                            {/* Categories */}
                            <TableCell>{formatValue(ed.Industry)}</TableCell>
                            <TableCell>{formatValue(ed.Exchange)}</TableCell>
                            <TableCell>{formatValue(ed.Thier)}</TableCell>
                            <TableCell>{formatValue(ed.Thier_Group)}</TableCell>
                            <TableCell>{formatValue(ed.VIP)}</TableCell>
                            <TableCell>{formatValue(ed.Prio_Buy)}</TableCell>
                            <TableCell>{formatValue(ed.Leverage)}</TableCell>

                            {/* Info Fields */}
                            <TableCell>{formatValue(ed.Info1)}</TableCell>
                            <TableCell>{formatValue(ed.Info2)}</TableCell>
                            <TableCell>{formatValue(ed.Info3)}</TableCell>
                            <TableCell>{formatValue(ed.Info5)}</TableCell>

                            {/* Source & Meta */}
                            <TableCell>{formatValue(ed.Source)}</TableCell>
                            <TableCell className="text-right">{formatValue(ed['Purchase_$'])}</TableCell>
                            <TableCell className="text-right">{formatValue(ed['Ranking alt'])}</TableCell>
                            <TableCell>
                              {ed['Date '] ? formatValue(ed['Date ']) : <span className="text-muted-foreground">-</span>}
                            </TableCell>

                            {/* UI Colors */}
                            <TableCell>
                              {typeof ed.Background_color === 'string' ? (
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded border"
                                    style={{ backgroundColor: ed.Background_color }}
                                  />
                                  <span className="text-xs">{ed.Background_color}</span>
                                </div>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              {typeof ed.Font_color === 'string' ? (
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded border"
                                    style={{ backgroundColor: ed.Font_color }}
                                  />
                                  <span className="text-xs">{ed.Font_color}</span>
                                </div>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>

                            {/* Profile - truncated with title */}
                            <TableCell>
                              {ed.Profile ? (
                                <div className="max-w-[300px] truncate" title={ed.Profile}>
                                  {ed.Profile}
                                </div>
                              ) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{' '}
                    {Math.min(page * limit, total)} of {total.toLocaleString()}{' '}
                    companies
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
