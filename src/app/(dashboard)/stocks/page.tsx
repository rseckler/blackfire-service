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
  const [showAll, setShowAll] = useState(false)

  const limit = showAll ? 10000 : 50

  // Core fields that are always shown first
  const coreFields = ['name', 'symbol', 'wkn', 'isin']

  useEffect(() => {
    fetchCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortOrder, showAll])

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
        className="flex items-center space-x-1 hover:text-foreground w-full text-left"
        onClick={(e) => {
          e.stopPropagation()
          handleSort(column)
        }}
        type="button"
      >
        <span>{label}</span>
        {sortBy === column && (
          <ArrowUpDown className="h-4 w-4 ml-1" />
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
            {/* Search and Options */}
            <div className="space-y-3">
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

              {/* View options */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <Button
                  variant={showAll ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => {
                    setShowAll(false)
                    setPage(1)
                  }}
                >
                  Paginated ({limit} per page)
                </Button>
                <Button
                  variant={showAll ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setShowAll(true)
                    setPage(1)
                  }}
                >
                  Show All ({total.toLocaleString()})
                </Button>
              </div>
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
                {/* Info banner */}
                <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground border flex items-center justify-between mb-4">
                  <span>💡 Viewing {coreFields.length + allExtraDataFields.length} columns total. Header stays fixed, content scrolls.</span>
                </div>

                {/* Table with fixed header - single scrollable container */}
                <div
                  className="border rounded-md"
                  style={{
                    height: '600px',
                    overflow: 'scroll',
                    position: 'relative',
                  }}
                >
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    position: 'relative',
                  }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
                      backgroundColor: 'hsl(var(--background))',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}>
                      <tr>
                        {/* Core Fields - always shown first */}
                        <th style={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 30,
                          backgroundColor: 'hsl(var(--background))',
                          minWidth: '250px',
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          borderRight: '1px solid hsl(var(--border))',
                        }}>
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              width: '100%',
                              textAlign: 'left',
                            }}
                            onClick={() => handleSort('name')}
                            type="button"
                          >
                            <span>Name</span>
                            {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}
                          </button>
                        </th>

                        {/* Other core fields */}
                        {['symbol', 'wkn', 'isin'].map(field => (
                          <th key={field} style={{
                            minWidth: '120px',
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                          }}>
                            <button
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                              onClick={() => handleSort(field)}
                              type="button"
                            >
                              <span>{field.toUpperCase()}</span>
                              {sortBy === field && <ArrowUpDown className="h-4 w-4" />}
                            </button>
                          </th>
                        ))}

                        {/* Dynamic extra_data fields */}
                        {allExtraDataFields.map(field => {
                          const isPrice = field.includes('Price') || field.includes('$')
                          const isLongText = field === 'Profile' || field.includes('Info')
                          const minWidth = isLongText ? '300px' : isPrice ? '120px' : '150px'
                          const align = isPrice || field.includes('Volume') || field.includes('Cap') ? 'right' : 'left'

                          return (
                            <th key={field} style={{
                              minWidth,
                              padding: '12px 16px',
                              textAlign: align,
                              fontWeight: 500,
                              fontSize: '0.875rem',
                            }}>
                              <button
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                                onClick={() => handleSort(field)}
                                type="button"
                              >
                                <span>{field.replace(/_/g, ' ')}</span>
                                {sortBy === field && <ArrowUpDown className="h-4 w-4" />}
                              </button>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((company) => {
                        const ed = company.extra_data || {}
                        return (
                          <tr
                            key={company.id}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid hsl(var(--border))',
                            }}
                            onClick={() => router.push(`/stocks/${company.id}`)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {/* Name - Sticky */}
                            <td style={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 10,
                              backgroundColor: 'hsl(var(--background))',
                              padding: '12px 16px',
                              fontWeight: 500,
                              borderRight: '1px solid hsl(var(--border))',
                            }}>
                              {company.name}
                            </td>

                            {/* Other core fields */}
                            <td style={{ padding: '12px 16px' }}>
                              {company.symbol || <span style={{ color: 'hsl(var(--muted-foreground))' }}>-</span>}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {company.wkn || <span style={{ color: 'hsl(var(--muted-foreground))' }}>-</span>}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {company.isin || <span style={{ color: 'hsl(var(--muted-foreground))' }}>-</span>}
                            </td>

                            {/* Dynamic extra_data fields */}
                            {allExtraDataFields.map(field => {
                              const value = ed[field]
                              const isPrice = field.includes('Price') || field.includes('$')
                              const align = isPrice || field.includes('Volume') || field.includes('Cap') ? 'right' : 'left'

                              // Special rendering for specific fields
                              if (field === 'Price_Change_Percent' && typeof value === 'number') {
                                return (
                                  <td key={field} style={{ padding: '12px 16px', textAlign: align }}>
                                    <span style={{ color: value >= 0 ? '#16a34a' : '#dc2626' }}>
                                      {value > 0 ? '+' : ''}{formatValue(value)}%
                                    </span>
                                  </td>
                                )
                              }

                              if ((field.includes('color') || field.includes('Color')) && typeof value === 'string' && value.startsWith('#')) {
                                return (
                                  <td key={field} style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div
                                        style={{
                                          width: '16px',
                                          height: '16px',
                                          borderRadius: '2px',
                                          border: '1px solid hsl(var(--border))',
                                          backgroundColor: value,
                                        }}
                                      />
                                      <span style={{ fontSize: '0.75rem' }}>{value}</span>
                                    </div>
                                  </td>
                                )
                              }

                              if (field === 'Profile' && typeof value === 'string') {
                                return (
                                  <td key={field} style={{ padding: '12px 16px' }}>
                                    <div style={{
                                      maxWidth: '300px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }} title={value}>
                                      {value}
                                    </div>
                                  </td>
                                )
                              }

                              if ((field.includes('time') || field.includes('Time') || field.includes('Update') || field.includes('Date')) &&
                                  (typeof value === 'string' || typeof value === 'number')) {
                                try {
                                  return (
                                    <td key={field} style={{ padding: '12px 16px', textAlign: align }}>
                                      {new Date(value).toLocaleString()}
                                    </td>
                                  )
                                } catch {
                                  return (
                                    <td key={field} style={{ padding: '12px 16px', textAlign: align }}>
                                      {formatValue(value)}
                                    </td>
                                  )
                                }
                              }

                              return (
                                <td key={field} style={{ padding: '12px 16px', textAlign: align }}>
                                  {formatValue(value)}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination - only show when not in "Show All" mode */}
                {!showAll && (
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
                )}

                {/* Show All mode indicator */}
                {showAll && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Showing all {companies.length.toLocaleString()} of {total.toLocaleString()} companies
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
