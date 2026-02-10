'use client'

import { type ReactNode } from 'react'

export function formatCellValue(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

export function renderCell(
  field: string,
  value: string | number | boolean | null | undefined
): ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300">-</span>
  }

  // Price change percent: green/red coloring
  if (field === 'Price_Change_Percent' && typeof value === 'number') {
    return (
      <span className={value >= 0 ? 'text-emerald-600' : 'text-red-600'}>
        {value > 0 ? '+' : ''}
        {value.toLocaleString()}%
      </span>
    )
  }

  // Color swatches
  if (
    (field.includes('color') || field.includes('Color')) &&
    typeof value === 'string' &&
    value.startsWith('#')
  ) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 shrink-0 rounded-sm border border-slate-200"
          style={{ backgroundColor: value }}
        />
        <span className="text-[10px] text-slate-500">{value}</span>
      </div>
    )
  }

  // Date/time fields
  if (
    (field.includes('time') ||
      field.includes('Time') ||
      field.includes('Update') ||
      field.includes('Date')) &&
    (typeof value === 'string' || typeof value === 'number')
  ) {
    try {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        return <span>{d.toLocaleDateString()}</span>
      }
    } catch {
      // fall through
    }
  }

  // Profile / long text: truncate
  if (
    (field === 'Profile' || field.includes('Info')) &&
    typeof value === 'string' &&
    value.length > 60
  ) {
    return (
      <span className="block max-w-[200px] truncate" title={value}>
        {value}
      </span>
    )
  }

  // Numeric values: right-align is handled by the column def, just format
  if (typeof value === 'number') {
    return <span>{value.toLocaleString()}</span>
  }

  return <span>{String(value)}</span>
}

/** Determine if a field should be right-aligned */
export function isNumericField(field: string): boolean {
  const numericPatterns = [
    'Price',
    'Volume',
    'Cap',
    'Market_Cap',
    'Day_High',
    'Day_Low',
    'current_price',
    '$',
  ]
  return numericPatterns.some((p) => field.includes(p))
}
