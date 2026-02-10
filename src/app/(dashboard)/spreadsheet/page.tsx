'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  type VisibilityState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSpreadsheetColumns } from '@/components/spreadsheet/use-spreadsheet-columns'
import { ColumnVisibilityToggle } from '@/components/spreadsheet/column-visibility-toggle'
import { SpreadsheetTable } from '@/components/spreadsheet/spreadsheet-table'

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

export default function SpreadsheetPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showAll, setShowAll] = useState(false)
  const [extraDataFields, setExtraDataFields] = useState<string[]>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [hasInitVisibility, setHasInitVisibility] = useState(false)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const limit = showAll ? 10000 : 100
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
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
  }, [page, limit, sortBy, sortOrder, debouncedSearch])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Extract extra_data fields from loaded data
  useEffect(() => {
    if (companies.length > 0) {
      const fieldsSet = new Set<string>()
      companies.forEach((c) => {
        if (c.extra_data) {
          Object.keys(c.extra_data).forEach((k) => fieldsSet.add(k))
        }
      })
      setExtraDataFields(Array.from(fieldsSet).sort())
    }
  }, [companies])

  const { columns, defaultVisibility } =
    useSpreadsheetColumns(extraDataFields)

  // Set default visibility once we have columns
  useEffect(() => {
    if (!hasInitVisibility && Object.keys(defaultVisibility).length > 0) {
      setColumnVisibility(defaultVisibility)
      setHasInitVisibility(true)
    }
  }, [defaultVisibility, hasInitVisibility])

  const table = useReactTable({
    data: companies,
    columns,
    state: { columnVisibility, columnFilters },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
  })

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(columnId)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const handleRowClick = (id: string) => {
    router.push(`/stocks/${id}`)
  }

  const handleColumnFilterChange = (columnId: string, value: string) => {
    setColumnFilters((prev) => {
      const existing = prev.filter((f) => f.id !== columnId)
      if (value) {
        return [...existing, { id: columnId, value }]
      }
      return existing
    })
  }

  const clearAllFilters = () => {
    setColumnFilters([])
  }

  const filteredRowCount = table.getFilteredRowModel().rows.length
  const totalRowCount = companies.length
  const hasActiveFilters = columnFilters.length > 0

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b bg-white px-4 py-2">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, symbol, WKN, ISIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Column visibility */}
        <ColumnVisibilityToggle table={table} />

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={clearAllFilters}
          >
            <X className="h-3 w-3" />
            Clear Filters
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Row count */}
        <span className="text-xs text-slate-500">
          {hasActiveFilters
            ? `${filteredRowCount.toLocaleString()} of ${total.toLocaleString()} rows`
            : `${total.toLocaleString()} rows`}
        </span>

        {/* View mode */}
        <Button
          variant={showAll ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            setShowAll((prev) => !prev)
            setPage(1)
          }}
        >
          {showAll ? 'Paginated' : 'Show All'}
        </Button>

        {/* Pagination */}
        {!showAll && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs tabular-nums text-slate-600">
              {page}/{totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <SpreadsheetTable
          table={table}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRowClick={handleRowClick}
          loading={loading}
          columnFilters={columnFilters}
          onColumnFilterChange={handleColumnFilterChange}
        />
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between border-t bg-slate-50 px-4 py-1 text-[10px] text-slate-500">
        <span>
          {hasActiveFilters
            ? `Showing ${filteredRowCount.toLocaleString()} of ${totalRowCount.toLocaleString()} (${totalRowCount - filteredRowCount} filtered)`
            : !showAll
              ? `Showing ${Math.min((page - 1) * limit + 1, total)}-${Math.min(page * limit, total)} of ${total.toLocaleString()}`
              : `Showing all ${companies.length.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        <span>
          {columns.length} columns ({table.getVisibleLeafColumns().length}{' '}
          visible)
        </span>
      </div>
    </div>
  )
}
