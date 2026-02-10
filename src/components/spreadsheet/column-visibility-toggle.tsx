'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Columns3, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface ColumnVisibilityToggleProps<T> {
  table: Table<T>
}

export function ColumnVisibilityToggle<T>({
  table,
}: ColumnVisibilityToggleProps<T>) {
  const [search, setSearch] = useState('')

  const allColumns = table
    .getAllColumns()
    .filter((col) => col.getCanHide())

  const filtered = search
    ? allColumns.filter((col) =>
        (col.columnDef.header as string)
          ?.toLowerCase()
          .includes(search.toLowerCase())
      )
    : allColumns

  const visibleCount = allColumns.filter((col) => col.getIsVisible()).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns3 className="h-3.5 w-3.5" />
          <span>
            Columns ({visibleCount}/{allColumns.length})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        {/* Search */}
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>

        {/* Show All / Hide All */}
        <div className="flex gap-1 border-b px-2 py-1.5">
          <button
            className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50"
            onClick={() => table.toggleAllColumnsVisible(true)}
          >
            Show all
          </button>
          <button
            className="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50"
            onClick={() => {
              // Hide all hideable columns
              allColumns.forEach((col) => col.toggleVisibility(false))
            }}
          >
            Hide all
          </button>
        </div>

        {/* Column list */}
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filtered.map((col) => (
            <label
              key={col.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={col.getIsVisible()}
                onChange={col.getToggleVisibilityHandler()}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              <span className="truncate">
                {(col.columnDef.header as string) || col.id}
              </span>
            </label>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No columns match
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
