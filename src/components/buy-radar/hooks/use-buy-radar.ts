import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BuyRadarCompany, BuyRadarAnalysis } from '@/lib/services/buy-radar-service'

/**
 * Fetch all buy radar companies with latest analysis
 */
export function useBuyRadarCompanies() {
  return useQuery<BuyRadarCompany[]>({
    queryKey: ['buy-radar'],
    queryFn: async () => {
      const response = await fetch('/api/buy-radar')
      if (!response.ok) {
        throw new Error('Failed to fetch buy radar data')
      }
      const data = await response.json()
      return data.companies
    },
  })
}

/**
 * Fetch analysis history for a specific company
 */
export function useBuyRadarHistory(companyId: string | null) {
  return useQuery<BuyRadarAnalysis[]>({
    queryKey: ['buy-radar', 'history', companyId],
    queryFn: async () => {
      if (!companyId) return []
      const response = await fetch(`/api/buy-radar/${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analysis history')
      }
      const data = await response.json()
      return data.analyses
    },
    enabled: !!companyId,
  })
}

/**
 * Trigger analysis for a company or all companies
 */
export function useAnalyzeCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (companyId?: string) => {
      const response = await fetch('/api/buy-radar/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyId ? { companyId } : {}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analysis failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buy-radar'] })
    },
  })
}
