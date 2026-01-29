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
  const [allExtraDataFields, setAllExtraDataFields] = useState<string[]>([])

  const limit = 50

  // Core fields that are always shown first
  const coreFields = ['name', 'symbol', 'wkn', 'isin']

  useEffect(() => {
    fetchCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortOrder])

  // Extract all unique extra_data fields from loaded companies
  useEffect(() => {
    if (companies.length > 0) {
      const fieldsSet = new Set<string>()
      companies.forEach(company => {
        if (company.extra_data) {
          Object.keys(company.extra_data).forEach(key => fieldsSet.add(key))
        }
      })
      setAllExtraDataFields(Array.from(fieldsSet).sort())
    }
  }, [companies])

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
                {/* Info banner for wide table */}
                <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground border">
                  💡 Tip: Scroll horizontally and vertically within the table below to view all {companies.length} companies across {coreFields.length + allExtraDataFields.length} columns
                </div>

                <div className="rounded-md border overflow-auto max-h-[600px] relative">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-20">
                      <TableRow>
                        {/* Core Fields - always shown first */}
                        <SortableHeader column="name" label="Name" className="sticky left-0 bg-background z-30 min-w-[250px]" />
                        <SortableHeader column="symbol" label="Symbol" className="min-w-[100px]" />
                        <SortableHeader column="wkn" label="WKN" className="min-w-[100px]" />
                        <SortableHeader column="isin" label="ISIN" className="min-w-[120px]" />

                        {/* Dynamic extra_data fields */}
                        {allExtraDataFields.map(field => {
                          // Determine appropriate width based on field type
                          const isPrice = field.includes('Price') || field.includes('$')
                          const isLongText = field === 'Profile' || field.includes('Info')
                          const minWidth = isLongText ? 'min-w-[300px]' : isPrice ? 'min-w-[120px]' : 'min-w-[150px]'
                          const align = isPrice || field.includes('Volume') || field.includes('Cap') ? 'text-right' : ''

                          return (
                            <SortableHeader
                              key={field}
                              column={field}
                              label={field.replace(/_/g, ' ')}
                              className={`${minWidth} ${align}`}
                            />
                          )
                        })}
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
                            <TableCell className="sticky left-0 bg-background z-30 font-medium border-r">
                              {company.name}
                            </TableCell>
                            <TableCell>
                              {company.symbol || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              {company.wkn || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                              {company.isin || <span className="text-muted-foreground">-</span>}
                            </TableCell>

                            {/* Dynamic extra_data fields */}
                            {allExtraDataFields.map(field => {
                              const value = ed[field]
                              const isPrice = field.includes('Price') || field.includes('$')
                              const align = isPrice || field.includes('Volume') || field.includes('Cap') ? 'text-right' : ''

                              // Special rendering for specific fields
                              if (field === 'Price_Change_Percent' && typeof value === 'number') {
                                return (
                                  <TableCell key={field} className={align}>
                                    <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {value > 0 ? '+' : ''}{formatValue(value)}%
                                    </span>
                                  </TableCell>
                                )
                              }

                              if ((field.includes('color') || field.includes('Color')) && typeof value === 'string' && value.startsWith('#')) {
                                return (
                                  <TableCell key={field}>
                                    <div className="flex items-center space-x-2">
                                      <div
                                        className="w-4 h-4 rounded border"
                                        style={{ backgroundColor: value }}
                                      />
                                      <span className="text-xs">{value}</span>
                                    </div>
                                  </TableCell>
                                )
                              }

                              if (field === 'Profile' && typeof value === 'string') {
                                return (
                                  <TableCell key={field}>
                                    <div className="max-w-[300px] truncate" title={value}>
                                      {value}
                                    </div>
                                  </TableCell>
                                )
                              }

                              if ((field.includes('time') || field.includes('Time') || field.includes('Update') || field.includes('Date')) &&
                                  (typeof value === 'string' || typeof value === 'number')) {
                                try {
                                  return (
                                    <TableCell key={field} className={align}>
                                      {new Date(value).toLocaleString()}
                                    </TableCell>
                                  )
                                } catch {
                                  return <TableCell key={field} className={align}>{formatValue(value)}</TableCell>
                                }
                              }

                              return (
                                <TableCell key={field} className={align}>
                                  {formatValue(value)}
                                </TableCell>
                              )
                            })}
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
