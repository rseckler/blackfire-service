/**
 * Symbol Enrichment Service
 *
 * Enriches companies with stock ticker symbols from ISIN/WKN
 * Uses OpenFIGI API (free tier: 250 requests/day)
 */

import { createClient } from '@/lib/supabase/client'

interface OpenFIGIRequest {
  idType: 'ID_ISIN' | 'ID_WERTPAPIER'
  idValue: string
  exchCode?: string
}

interface OpenFIGIResponse {
  data?: Array<{
    figi: string
    ticker?: string
    exchCode?: string
    name?: string
    marketSector?: string
  }>
  error?: string
}

export class SymbolEnrichmentService {
  private readonly openFigiUrl = 'https://api.openfigi.com/v3/mapping'
  private readonly openFigiKey = process.env.OPENFIGI_API_KEY || '' // Optional, free tier works without

  /**
   * Enrich a single company with ticker symbol
   */
  async enrichCompany(companyId: string): Promise<boolean> {
    const supabase = createClient()

    try {
      // Fetch company data
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('id, name, symbol, isin, wkn')
        .eq('id', companyId)
        .single()

      if (fetchError || !company) {
        console.error('Company not found:', companyId)
        return false
      }

      // Skip if already has symbol
      if (company.symbol) {
        console.log(`Company ${company.name} already has symbol: ${company.symbol}`)
        return true
      }

      // Try ISIN first, then WKN
      let ticker: string | null = null

      if (company.isin) {
        ticker = await this.lookupByISIN(company.isin)
      }

      if (!ticker && company.wkn) {
        ticker = await this.lookupByWKN(company.wkn)
      }

      if (ticker) {
        // Update company with ticker symbol
        const { error: updateError } = await supabase
          .from('companies')
          .update({ symbol: ticker })
          .eq('id', companyId)

        if (updateError) {
          console.error('Failed to update company:', updateError)
          return false
        }

        console.log(`✅ Enriched ${company.name} with symbol: ${ticker}`)
        return true
      } else {
        console.log(`❌ No ticker found for ${company.name} (ISIN: ${company.isin}, WKN: ${company.wkn})`)
        return false
      }
    } catch (error) {
      console.error('Enrichment error:', error)
      return false
    }
  }

  /**
   * Enrich all companies missing symbols
   */
  async enrichAllCompanies(limit = 50): Promise<{ enriched: number; failed: number }> {
    const supabase = createClient()
    let enriched = 0
    let failed = 0

    try {
      // Get companies without symbols
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name, isin, wkn')
        .is('symbol', null)
        .or('isin.not.is.null,wkn.not.is.null')
        .limit(limit)

      if (error || !companies) {
        console.error('Failed to fetch companies:', error)
        return { enriched, failed }
      }

      console.log(`Found ${companies.length} companies to enrich`)

      // Process in batches to respect rate limits
      for (const company of companies) {
        const success = await this.enrichCompany(company.id)

        if (success) {
          enriched++
        } else {
          failed++
        }

        // Rate limiting: Wait 250ms between requests (240 req/min = 4 req/sec)
        await this.sleep(250)
      }

      console.log(`\n✅ Enrichment complete: ${enriched} enriched, ${failed} failed`)
      return { enriched, failed }
    } catch (error) {
      console.error('Batch enrichment error:', error)
      return { enriched, failed }
    }
  }

  /**
   * Lookup ticker by ISIN
   */
  private async lookupByISIN(isin: string): Promise<string | null> {
    try {
      const request: OpenFIGIRequest = {
        idType: 'ID_ISIN',
        idValue: isin,
      }

      const response = await this.queryOpenFIGI([request])

      if (response && response.length > 0 && response[0].data) {
        // Prefer US exchanges for Alpha Vantage compatibility
        const usExchange = response[0].data.find((item) =>
          ['US', 'NYSE', 'NASDAQ', 'BATS'].includes(item.exchCode || '')
        )

        if (usExchange?.ticker) {
          return usExchange.ticker
        }

        // Fallback to first ticker found
        const firstTicker = response[0].data.find((item) => item.ticker)
        return firstTicker?.ticker || null
      }

      return null
    } catch (error) {
      console.error('ISIN lookup error:', error)
      return null
    }
  }

  /**
   * Lookup ticker by WKN (German securities identification number)
   */
  private async lookupByWKN(wkn: string): Promise<string | null> {
    try {
      const request: OpenFIGIRequest = {
        idType: 'ID_WERTPAPIER',
        idValue: wkn,
      }

      const response = await this.queryOpenFIGI([request])

      if (response && response.length > 0 && response[0].data) {
        // Prefer US exchanges
        const usExchange = response[0].data.find((item) =>
          ['US', 'NYSE', 'NASDAQ', 'BATS'].includes(item.exchCode || '')
        )

        if (usExchange?.ticker) {
          return usExchange.ticker
        }

        // Fallback to first ticker
        const firstTicker = response[0].data.find((item) => item.ticker)
        return firstTicker?.ticker || null
      }

      return null
    } catch (error) {
      console.error('WKN lookup error:', error)
      return null
    }
  }

  /**
   * Query OpenFIGI API
   */
  private async queryOpenFIGI(requests: OpenFIGIRequest[]): Promise<OpenFIGIResponse[]> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (this.openFigiKey) {
        headers['X-OPENFIGI-APIKEY'] = this.openFigiKey
      }

      const response = await fetch(this.openFigiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requests),
      })

      if (!response.ok) {
        throw new Error(`OpenFIGI API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('OpenFIGI query error:', error)
      return []
    }
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
let enrichmentService: SymbolEnrichmentService | null = null

export function getSymbolEnrichmentService(): SymbolEnrichmentService {
  if (!enrichmentService) {
    enrichmentService = new SymbolEnrichmentService()
  }
  return enrichmentService
}
