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

  const SortableHeader = ({ column, label, className = '' }: { column: string, label: string, className?: string }) => (
    <TableHead className={className}>
      <button
        className="flex items-center space-x-1 hover:text-foreground"
        onClick={() => handleSort(column)}
      >
        <span>{label}</span>
        {sortBy === column && (
          <ArrowUpDown className="h-4 w-4" />
        )}
      </button>
    </TableHead>
  )

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
                        <SortableHeader column="name" label="Name" className="sticky left-0 bg-background z-10 min-w-[250px]" />
                        <SortableHeader column="symbol" label="Symbol" className="min-w-[100px]" />
                        <SortableHeader column="Ticker" label="Ticker" className="min-w-[100px]" />
                        <SortableHeader column="wkn" label="WKN" className="min-w-[100px]" />
                        <SortableHeader column="isin" label="ISIN" className="min-w-[120px]" />

                        {/* Market Data */}
                        <SortableHeader column="Current_Price" label="Current Price" className="text-right min-w-[100px]" />
                        <SortableHeader column="Day_High" label="Day High" className="text-right min-w-[100px]" />
                        <SortableHeader column="Day_Low" label="Day Low" className="text-right min-w-[100px]" />
                        <SortableHeader column="Price_Change_Percent" label="Price Change %" className="text-right min-w-[100px]" />
                        <SortableHeader column="Currency" label="Currency" className="min-w-[80px]" />
                        <SortableHeader column="Volume" label="Volume" className="text-right min-w-[120px]" />
                        <SortableHeader column="Market_Cap" label="Market Cap" className="text-right min-w-[150px]" />
                        <SortableHeader column="Market_Status" label="Market Status" className="min-w-[120px]" />
                        <SortableHeader column="Price_Update" label="Price Update" className="min-w-[150px]" />

                        {/* Categories */}
                        <SortableHeader column="Industry" label="Industry" className="min-w-[150px]" />
                        <SortableHeader column="Exchange" label="Exchange" className="min-w-[100px]" />
                        <SortableHeader column="Thier" label="Thier" className="min-w-[100px]" />
                        <SortableHeader column="Thier_Group" label="Thier Group" className="min-w-[100px]" />
                        <SortableHeader column="VIP" label="VIP" className="min-w-[100px]" />
                        <SortableHeader column="Prio_Buy" label="Prio Buy" className="min-w-[100px]" />
                        <SortableHeader column="Leverage" label="Leverage" className="min-w-[100px]" />

                        {/* Info Fields */}
                        <SortableHeader column="Info1" label="Info1" className="min-w-[150px]" />
                        <SortableHeader column="Info2" label="Info2" className="min-w-[150px]" />
                        <SortableHeader column="Info3" label="Info3" className="min-w-[150px]" />
                        <SortableHeader column="Info5" label="Info5" className="min-w-[150px]" />

                        {/* Source & Meta */}
                        <SortableHeader column="Source" label="Source" className="min-w-[100px]" />
                        <SortableHeader column="Purchase_$" label="Purchase $" className="text-right min-w-[100px]" />
                        <SortableHeader column="Ranking alt" label="Ranking" className="text-right min-w-[100px]" />
                        <SortableHeader column="Date " label="Date" className="min-w-[100px]" />

                        {/* UI Colors */}
                        <SortableHeader column="Background_color" label="Background" className="min-w-[120px]" />
                        <SortableHeader column="Font_color" label="Font Color" className="min-w-[120px]" />

                        {/* Profile - last because it's long */}
                        <SortableHeader column="Profile" label="Profile" className="min-w-[300px]" />
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
                              {typeof ed.Profile === 'string' ? (
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
