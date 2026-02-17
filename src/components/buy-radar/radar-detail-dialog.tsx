'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import type { BuyRadarCompany, BuyRadarAnalysis } from '@/lib/services/buy-radar-service'
import { useBuyRadarHistory, useAnalyzeCompany } from './hooks/use-buy-radar'
import Link from 'next/link'

interface RadarDetailDialogProps {
  company: BuyRadarCompany | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const recColors = {
  buy: 'bg-green-500/20 text-green-400 border-green-500/30',
  wait: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  avoid: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function RadarDetailDialog({ company, open, onOpenChange }: RadarDetailDialogProps) {
  const { data: history, isLoading: historyLoading } = useBuyRadarHistory(
    open ? company?.company_id ?? null : null
  )
  const analyzeMutation = useAnalyzeCompany()

  if (!company) return null

  const handleReanalyze = () => {
    analyzeMutation.mutate(company.company_id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto bg-slate-900 text-slate-100 sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg">{company.company_name}</DialogTitle>
              <p className="mt-1 text-sm text-slate-400">
                {company.symbol || 'No symbol'}
              </p>
            </div>
            {company.recommendation && (
              <Badge className={cn('text-sm', recColors[company.recommendation])}>
                {company.recommendation.toUpperCase()}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Price Info */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-slate-800/50 p-4">
          <div>
            <p className="text-xs text-slate-400">Current Price</p>
            <p className="text-lg font-bold">
              {company.current_price != null ? `$${company.current_price.toFixed(2)}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Target Price</p>
            <p className="text-lg font-bold">
              {company.target_price != null ? `$${company.target_price.toFixed(2)}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Price Gap</p>
            <p className={cn(
              'text-lg font-bold',
              company.price_gap_percent != null && company.price_gap_percent < 0
                ? 'text-green-400' : 'text-red-400'
            )}>
              {company.price_gap_percent != null
                ? `${company.price_gap_percent > 0 ? '+' : ''}${company.price_gap_percent.toFixed(1)}%`
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Confidence */}
        {company.confidence != null && (
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Confidence</span>
              <span className="font-medium">{company.confidence}/10</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-800">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  company.confidence >= 7 ? 'bg-green-500' :
                  company.confidence >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${company.confidence * 10}%` }}
              />
            </div>
          </div>
        )}

        {/* Reasoning */}
        {company.reasoning && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-300">Analysis</h4>
            <p className="text-sm text-slate-400">{company.reasoning}</p>
          </div>
        )}

        {/* Catalysts & Risks */}
        <div className="grid gap-4 sm:grid-cols-2">
          {company.catalysts && company.catalysts.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-green-400">Catalysts</h4>
              <ul className="space-y-1">
                {company.catalysts.map((c, i) => (
                  <li key={i} className="text-xs text-slate-400">+ {c}</li>
                ))}
              </ul>
            </div>
          )}
          {company.risks && company.risks.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-red-400">Risks</h4>
              <ul className="space-y-1">
                {company.risks.map((r, i) => (
                  <li key={i} className="text-xs text-slate-400">- {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Web Research */}
        {company.web_research_summary && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-300">Web Research</h4>
            <p className="text-xs text-slate-400">{company.web_research_summary}</p>
          </div>
        )}

        <Separator className="bg-slate-800" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReanalyze}
            disabled={analyzeMutation.isPending}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3 w-3" />
            )}
            Re-analyze
          </Button>
          <Link href={`/stocks/${company.company_id}`}>
            <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">
              <ExternalLink className="mr-2 h-3 w-3" />
              View Company
            </Button>
          </Link>
        </div>

        {/* History */}
        {historyLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : history && history.length > 1 ? (
          <div>
            <h4 className="mb-2 text-sm font-medium text-slate-300">Analysis History</h4>
            <div className="space-y-2">
              {history.slice(1, 6).map((a: BuyRadarAnalysis) => (
                <div key={a.id} className="flex items-center justify-between rounded bg-slate-800/50 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-[10px]', recColors[a.recommendation])}>
                      {a.recommendation.toUpperCase()}
                    </Badge>
                    <span className="text-slate-400">{a.confidence}/10</span>
                  </div>
                  <span className="text-slate-500">
                    {format(new Date(a.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Metadata */}
        {company.analyzed_at && (
          <p className="text-[10px] text-slate-500">
            Last analyzed {formatDistanceToNow(new Date(company.analyzed_at), { addSuffix: true })}
            {company.model_used && ` | ${company.model_used}`}
            {company.analysis_duration_ms && ` | ${(company.analysis_duration_ms / 1000).toFixed(1)}s`}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
