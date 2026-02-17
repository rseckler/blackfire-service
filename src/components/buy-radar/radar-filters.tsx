'use client'

import { cn } from '@/lib/utils'

export type RadarFilter = 'all' | 'buy' | 'wait' | 'avoid' | 'unanalyzed'

interface RadarFiltersProps {
  active: RadarFilter
  onChange: (filter: RadarFilter) => void
  counts: { all: number; buy: number; wait: number; avoid: number; unanalyzed: number }
}

const filters: { key: RadarFilter; label: string; color: string; activeColor: string }[] = [
  { key: 'all', label: 'All', color: 'text-slate-400', activeColor: 'bg-slate-700 text-white' },
  { key: 'buy', label: 'Buy', color: 'text-green-400', activeColor: 'bg-green-500/20 text-green-400' },
  { key: 'wait', label: 'Wait', color: 'text-yellow-400', activeColor: 'bg-yellow-500/20 text-yellow-400' },
  { key: 'avoid', label: 'Avoid', color: 'text-red-400', activeColor: 'bg-red-500/20 text-red-400' },
  { key: 'unanalyzed', label: 'Pending', color: 'text-slate-500', activeColor: 'bg-slate-600/30 text-slate-300' },
]

export function RadarFilters({ active, onChange, counts }: RadarFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            active === f.key ? f.activeColor : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          )}
        >
          {f.label}
          <span className="ml-1.5 text-xs opacity-70">{counts[f.key]}</span>
        </button>
      ))}
    </div>
  )
}
