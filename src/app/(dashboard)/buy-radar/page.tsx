'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, Crosshair } from 'lucide-react'
import { useBuyRadarCompanies, useAnalyzeCompany } from '@/components/buy-radar/hooks/use-buy-radar'
import { RadarCard } from '@/components/buy-radar/radar-card'
import { RadarFilters, type RadarFilter } from '@/components/buy-radar/radar-filters'
import { RadarDetailDialog } from '@/components/buy-radar/radar-detail-dialog'
import type { BuyRadarCompany } from '@/lib/services/buy-radar-service'

export default function BuyRadarPage() {
  const { data: companies, isLoading, error } = useBuyRadarCompanies()
  const analyzeMutation = useAnalyzeCompany()
  const [filter, setFilter] = useState<RadarFilter>('all')
  const [selectedCompany, setSelectedCompany] = useState<BuyRadarCompany | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const counts = {
    all: companies?.length ?? 0,
    buy: companies?.filter(c => c.recommendation === 'buy').length ?? 0,
    wait: companies?.filter(c => c.recommendation === 'wait').length ?? 0,
    avoid: companies?.filter(c => c.recommendation === 'avoid').length ?? 0,
    unanalyzed: companies?.filter(c => !c.recommendation).length ?? 0,
  }

  const filtered = companies?.filter(c => {
    if (filter === 'all') return true
    if (filter === 'unanalyzed') return !c.recommendation
    return c.recommendation === filter
  }) ?? []

  const handleCardClick = (company: BuyRadarCompany) => {
    setSelectedCompany(company)
    setDialogOpen(true)
  }

  const handleRefreshAll = () => {
    analyzeMutation.mutate(undefined)
  }

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center space-y-4">
        <p className="text-red-400">Failed to load Buy Radar data</p>
        <p className="text-sm text-slate-500">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crosshair className="h-6 w-6 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Buy Radar</h1>
            <p className="text-sm text-slate-400">
              AI-powered buy timing analysis for filtered companies
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefreshAll}
          disabled={analyzeMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {analyzeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh All
            </>
          )}
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 text-sm">
        <span className="text-green-400">{counts.buy} Buy</span>
        <span className="text-yellow-400">{counts.wait} Wait</span>
        <span className="text-red-400">{counts.avoid} Avoid</span>
        <span className="text-slate-500">{counts.unanalyzed} Pending</span>
      </div>

      {/* Filters */}
      <RadarFilters active={filter} onChange={setFilter} counts={counts} />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-slate-500">
          No companies match this filter
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(company => (
            <RadarCard
              key={company.company_id}
              company={company}
              onClick={() => handleCardClick(company)}
            />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <RadarDetailDialog
        company={selectedCompany}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
