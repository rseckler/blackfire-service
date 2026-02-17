'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  count: number
}

interface RadarCompanyFiltersProps {
  thierGroups: FilterOption[]
  vipLevels: FilterOption[]
  selectedThierGroups: string[]
  selectedVipLevels: string[]
  onThierGroupsChange: (values: string[]) => void
  onVipLevelsChange: (values: string[]) => void
  totalResults: number
  isLoading: boolean
}

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const selectAll = () => onChange(options.map(o => o.value))
  const clearAll = () => onChange([])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
          selected.length > 0
            ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
        )}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="rounded-full bg-blue-500/30 px-1.5 text-xs font-medium">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
            <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300">
              Select all
            </button>
            <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-400">
              Clear
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1.5">
            {options.map(opt => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-slate-700/50"
              >
                <Checkbox
                  checked={selected.includes(opt.value)}
                  onCheckedChange={() => toggle(opt.value)}
                />
                <span className="flex-1 text-slate-200">{opt.value}</span>
                <span className="text-xs text-slate-500">{opt.count}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function RadarCompanyFilters({
  thierGroups,
  vipLevels,
  selectedThierGroups,
  selectedVipLevels,
  onThierGroupsChange,
  onVipLevelsChange,
  totalResults,
  isLoading,
}: RadarCompanyFiltersProps) {
  const hasFilters = selectedThierGroups.length > 0 || selectedVipLevels.length > 0
  const hasMultipleFilters = selectedThierGroups.length > 0 && selectedVipLevels.length > 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-slate-400">Company Filters:</span>

      <FilterDropdown
        label="Thier Group"
        options={thierGroups}
        selected={selectedThierGroups}
        onChange={onThierGroupsChange}
      />

      {hasMultipleFilters && (
        <span className="text-xs font-medium text-slate-500">AND</span>
      )}

      <FilterDropdown
        label="VIP Level"
        options={vipLevels}
        selected={selectedVipLevels}
        onChange={onVipLevelsChange}
      />

      {hasFilters && (
        <>
          <span className="text-sm text-slate-500">
            {isLoading ? '...' : `${totalResults} companies`}
          </span>
          <button
            onClick={() => {
              onThierGroupsChange([])
              onVipLevelsChange([])
            }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        </>
      )}
    </div>
  )
}
