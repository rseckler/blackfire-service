'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BuyRadarCompany } from '@/lib/services/buy-radar-service'
import { formatDistanceToNow } from 'date-fns'

interface RadarCardProps {
  company: BuyRadarCompany
  onClick: () => void
}

const recommendationConfig = {
  buy: { label: 'BUY', color: 'bg-green-500/20 text-green-400 border-green-500/30', border: 'border-l-green-500' },
  wait: { label: 'WAIT', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', border: 'border-l-yellow-500' },
  avoid: { label: 'AVOID', color: 'bg-red-500/20 text-red-400 border-red-500/30', border: 'border-l-red-500' },
}

export function RadarCard({ company, onClick }: RadarCardProps) {
  const rec = company.recommendation
    ? recommendationConfig[company.recommendation]
    : null

  const thierGroup = company.extra_data?.['Thier_Group'] as string | null
  const vip = company.extra_data?.['VIP'] as string | null

  return (
    <Card
      className={cn(
        'cursor-pointer border-l-4 transition-all hover:shadow-lg hover:shadow-black/20',
        rec ? rec.border : 'border-l-slate-600',
        'bg-slate-900 border-slate-800'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-100">
              {company.company_name}
            </h3>
            <p className="text-xs text-slate-400">
              {company.symbol || 'No symbol'}
              {thierGroup && ` | ${thierGroup}`}
              {vip === 'Defcon 1' && ' | VIP'}
            </p>
          </div>
          {rec && (
            <Badge className={cn('shrink-0 text-xs', rec.color)}>
              {rec.label}
            </Badge>
          )}
        </div>

        {/* Price Info */}
        {company.current_price != null && (
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-100">
              ${company.current_price.toFixed(2)}
            </span>
            {company.price_gap_percent != null && (
              <span className={cn(
                'text-xs font-medium',
                company.price_gap_percent < 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {company.price_gap_percent > 0 ? '+' : ''}{company.price_gap_percent.toFixed(1)}% vs target
              </span>
            )}
          </div>
        )}

        {/* Confidence */}
        {company.confidence != null && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Confidence</span>
              <span className="text-slate-300">{company.confidence}/10</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-800">
              <div
                className={cn(
                  'h-full rounded-full',
                  company.confidence >= 7 ? 'bg-green-500' :
                  company.confidence >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${company.confidence * 10}%` }}
              />
            </div>
          </div>
        )}

        {/* Summary */}
        {company.summary && (
          <p className="mt-3 line-clamp-2 text-xs text-slate-400">
            {company.summary}
          </p>
        )}

        {/* Footer */}
        {company.analyzed_at && (
          <p className="mt-3 text-[10px] text-slate-500">
            {formatDistanceToNow(new Date(company.analyzed_at), { addSuffix: true })}
          </p>
        )}

        {/* No analysis yet */}
        {!company.recommendation && (
          <p className="mt-3 text-xs italic text-slate-500">
            Not yet analyzed
          </p>
        )}
      </CardContent>
    </Card>
  )
}
