import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BuyRadarCompany, BuyRadarAnalysis } from '@/lib/services/buy-radar-service'

interface FilterOption {
  value: string
  count: number
}

interface BuyRadarFiltersResponse {
  thierGroups: FilterOption[]
  vipLevels: FilterOption[]
}

/**
 * Fetch available filter values (Thier_Group, VIP) with counts
 */
export function useBuyRadarFilters() {
  return useQuery<BuyRadarFiltersResponse>({
    queryKey: ['buy-radar', 'filters'],
    queryFn: async () => {
      const response = await fetch('/api/buy-radar/filters')
      if (!response.ok) {
        throw new Error('Failed to fetch filter options')
      }
      return response.json()
    },
  })
}

/**
 * Fetch buy radar companies with configurable filters
 */
export function useBuyRadarCompanies(thierGroups: string[], vipLevels: string[]) {
  return useQuery<BuyRadarCompany[]>({
    queryKey: ['buy-radar', 'companies', thierGroups, vipLevels],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (thierGroups.length > 0) {
        params.set('thierGroups', thierGroups.join(','))
      }
      if (vipLevels.length > 0) {
        params.set('vipLevels', vipLevels.join(','))
      }
      const response = await fetch(`/api/buy-radar?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch buy radar data')
      }
      const data = await response.json()
      return data.companies
    },
    // Only fetch when at least one filter is set
    enabled: thierGroups.length > 0 || vipLevels.length > 0,
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
 * Trigger analysis for a company or all companies (with filters)
 */
export function useAnalyzeCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params?: { companyId?: string; thierGroups?: string[]; vipLevels?: string[] }) => {
      const response = await fetch('/api/buy-radar/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
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
