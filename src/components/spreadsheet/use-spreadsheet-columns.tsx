'use client'

import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { renderCell, isNumericField } from './cell-renderers'

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

/** Core fields that always appear first (after row number) */
const CORE_FIELDS = ['name', 'symbol', 'wkn', 'isin'] as const

/** Default visible extra_data columns */
const DEFAULT_VISIBLE_EXTRA = new Set([
  'Current_Price',
  'Currency',
  'Price_Change_Percent',
  'Exchange',
  'Market_Status',
  'Day_High',
  'Day_Low',
  'Volume',
  'Market_Cap',
  'Price_Update',
  'Satellog',
])

export function useSpreadsheetColumns(extraDataFields: string[]) {
  return useMemo(() => {
    const columns: ColumnDef<Company, unknown>[] = []

    // Row number column
    columns.push({
      id: '_row',
      header: '#',
      size: 40,
      minSize: 40,
      maxSize: 40,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <span className="text-[10px] text-slate-400">{row.index + 1}</span>
      ),
    } as ColumnDef<Company, unknown>)

    // Core columns
    columns.push({
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      size: 220,
      minSize: 120,
      enableHiding: false,
      cell: ({ getValue }) => (
        <span className="font-medium">{String(getValue() ?? '')}</span>
      ),
    } as ColumnDef<Company, unknown>)

    columns.push({
      id: 'symbol',
      accessorKey: 'symbol',
      header: 'Symbol',
      size: 80,
      minSize: 60,
      cell: ({ getValue }) => renderCell('symbol', getValue() as string | null),
    } as ColumnDef<Company, unknown>)

    columns.push({
      id: 'wkn',
      accessorKey: 'wkn',
      header: 'WKN',
      size: 80,
      minSize: 60,
      cell: ({ getValue }) => renderCell('wkn', getValue() as string | null),
    } as ColumnDef<Company, unknown>)

    columns.push({
      id: 'isin',
      accessorKey: 'isin',
      header: 'ISIN',
      size: 120,
      minSize: 80,
      cell: ({ getValue }) => renderCell('isin', getValue() as string | null),
    } as ColumnDef<Company, unknown>)

    // Extra data columns (sorted alphabetically)
    for (const field of extraDataFields) {
      const numeric = isNumericField(field)
      const isLongText = field === 'Profile' || field.includes('Info')

      columns.push({
        id: `extra_${field}`,
        accessorFn: (row: Company) => row.extra_data?.[field] ?? null,
        header: field.replace(/_/g, ' '),
        size: isLongText ? 250 : numeric ? 100 : 130,
        minSize: 60,
        meta: { extraDataField: field, numeric },
        cell: ({ getValue }) =>
          renderCell(
            field,
            getValue() as string | number | boolean | null
          ),
      } as ColumnDef<Company, unknown>)
    }

    // Determine default visibility
    const defaultVisibility: Record<string, boolean> = {}
    for (const field of extraDataFields) {
      defaultVisibility[`extra_${field}`] = DEFAULT_VISIBLE_EXTRA.has(field)
    }

    return { columns, defaultVisibility }
  }, [extraDataFields])
}
