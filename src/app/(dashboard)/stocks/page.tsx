'use client'

import { useState, useEffect } from 'react'
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
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
                        <TableHead>
                          <button
                            className="flex items-center space-x-1 hover:text-foreground"
                            onClick={() => handleSort('symbol')}
                          >
                            <span>Symbol</span>
                            {sortBy === 'symbol' && (
                              <ArrowUpDown className="h-4 w-4" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead>WKN</TableHead>
                        <TableHead>ISIN</TableHead>
                        <TableHead className="text-right">
                          <button
                            className="flex items-center space-x-1 hover:text-foreground ml-auto"
                            onClick={() => handleSort('current_price')}
                          >
                            <span>Price</span>
                            {sortBy === 'current_price' && (
                              <ArrowUpDown className="h-4 w-4" />
                            )}
                          </button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">
                            {company.name}
                          </TableCell>
                          <TableCell>
                            {company.symbol || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {company.wkn || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {company.isin || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {company.current_price ? (
                              `$${company.current_price.toFixed(2)}`
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
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
