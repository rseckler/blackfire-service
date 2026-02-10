'use client'

import { type Table, type ColumnFiltersState, flexRender } from '@tanstack/react-table'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface SpreadsheetTableProps {
  table: Table<Company>
  onSort: (columnId: string) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onRowClick: (id: string) => void
  loading: boolean
  columnFilters: ColumnFiltersState
  onColumnFilterChange: (columnId: string, value: string) => void
}

/** Maps our column ids back to the API sort key */
function columnIdToSortKey(id: string): string {
  if (id.startsWith('extra_')) return id.slice(6)
  return id
}

export function SpreadsheetTable({
  table,
  onSort,
  sortBy,
  sortOrder,
  onRowClick,
  loading,
  columnFilters,
  onColumnFilterChange,
}: SpreadsheetTableProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Loading...
      </div>
    )
  }

  const rows = table.getRowModel().rows
  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        No companies found
      </div>
    )
  }

  const hasActiveFilters = columnFilters.length > 0

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-20">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortKey = columnIdToSortKey(header.column.id)
                const isSorted = sortBy === sortKey
                const canSort = header.column.getCanSort()
                const isRowNum = header.column.id === '_row'
                const isName = header.column.id === 'name'
                const meta = header.column.columnDef.meta as
                  | { numeric?: boolean }
                  | undefined

                return (
                  <th
                    key={header.id}
                    className={cn(
                      'whitespace-nowrap border-b border-r border-slate-200 bg-slate-100 px-2 py-1.5 text-left font-semibold text-slate-600',
                      meta?.numeric && 'text-right',
                      isRowNum && 'sticky left-0 z-30 w-10 min-w-[40px] bg-slate-100 text-center',
                      isName &&
                        'sticky left-10 z-30 min-w-[120px] bg-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]',
                      canSort && 'cursor-pointer select-none hover:bg-slate-200'
                    )}
                    style={{ width: header.getSize() }}
                    onClick={() => {
                      if (canSort) onSort(sortKey)
                    }}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        meta?.numeric && 'justify-end'
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {isSorted &&
                        (sortOrder === 'asc' ? (
                          <ArrowUp className="h-3 w-3 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 shrink-0" />
                        ))}
                    </div>
                  </th>
                )
              })}
            </tr>
          ))}
          {/* Filter row */}
          <tr>
            {table.getHeaderGroups()[0]?.headers.map((header) => {
              const isRowNum = header.column.id === '_row'
              const isName = header.column.id === 'name'
              const canFilter = header.column.getCanFilter()
              const meta = header.column.columnDef.meta as
                | { numeric?: boolean }
                | undefined
              const filterValue =
                (columnFilters.find((f) => f.id === header.column.id)
                  ?.value as string) ?? ''

              return (
                <th
                  key={`filter-${header.id}`}
                  className={cn(
                    'border-b border-r border-slate-200 bg-slate-50 px-1 py-0.5',
                    isRowNum && 'sticky left-0 z-30 w-10 min-w-[40px] bg-slate-50',
                    isName &&
                      'sticky left-10 z-30 min-w-[120px] bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]'
                  )}
                  style={{ width: header.getSize() }}
                >
                  {canFilter ? (
                    <input
                      type="text"
                      value={filterValue}
                      onChange={(e) =>
                        onColumnFilterChange(header.column.id, e.target.value)
                      }
                      placeholder="Filter..."
                      className={cn(
                        'w-full h-5 px-1 text-[10px] bg-white border border-slate-200 rounded-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200',
                        meta?.numeric && 'text-right'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="h-5" />
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-blue-50/50',
                rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
              )}
              onClick={() => onRowClick(row.original.id)}
            >
              {row.getVisibleCells().map((cell) => {
                const isRowNum = cell.column.id === '_row'
                const isName = cell.column.id === 'name'
                const meta = cell.column.columnDef.meta as
                  | { numeric?: boolean }
                  | undefined
                const bgClass =
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'

                return (
                  <td
                    key={cell.id}
                    className={cn(
                      'whitespace-nowrap border-b border-r border-slate-100 px-2 py-1',
                      meta?.numeric && 'text-right',
                      isRowNum &&
                        `sticky left-0 z-10 w-10 min-w-[40px] text-center ${bgClass}`,
                      isName &&
                        `sticky left-10 z-10 min-w-[120px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] ${bgClass}`
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
