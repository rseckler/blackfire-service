/**
 * Buy Radar Service
 *
 * Analyzes filtered companies using Claude Sonnet 4.5 to determine
 * optimal buy timing based on price data, web research, and financials.
 */

import Anthropic from '@anthropic-ai/sdk'
import { getBraveSearchClient } from './brave-search'
import { AlphaVantageClient } from './alpha-vantage'

// Types
export interface BuyRadarCompany {
  company_id: string
  company_name: string
  symbol: string | null
  extra_data: Record<string, string | number | boolean | null>
  latest_analysis_id: string | null
  recommendation: 'buy' | 'wait' | 'avoid' | null
  confidence: number | null
  reasoning: string | null
  summary: string | null
  current_price: number | null
  target_price: number | null
  price_gap_percent: number | null
  catalysts: string[] | null
  risks: string[] | null
  web_research_summary: string | null
  data_sources: Record<string, unknown> | null
  model_used: string | null
  analysis_duration_ms: number | null
  analyzed_at: string | null
}

export interface BuyRadarAnalysis {
  id: string
  company_id: string
  recommendation: 'buy' | 'wait' | 'avoid'
  confidence: number
  reasoning: string
  summary: string
  current_price: number | null
  target_price: number | null
  price_gap_percent: number | null
  catalysts: string[]
  risks: string[]
  web_research_summary: string | null
  data_sources: Record<string, unknown>
  model_used: string
  analysis_duration_ms: number | null
  created_at: string
}

interface CompanyData {
  name: string
  symbol: string | null
  extraData: Record<string, string | number | boolean | null>
  priceHistory: { date: string; close: number }[]
  webResults: { title: string; description: string }[]
}

interface ClaudeAnalysisResult {
  recommendation: 'buy' | 'wait' | 'avoid'
  confidence: number
  reasoning: string
  summary: string
  target_price: number | null
  catalysts: string[]
  risks: string[]
}

const MODEL = 'claude-sonnet-4-5-20250929'

export class BuyRadarService {
  private anthropic: Anthropic
  private braveSearch = getBraveSearchClient()

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  /**
   * Gather all available data for a company
   */
  async gatherCompanyData(
    company: { name: string; symbol: string | null; extra_data: Record<string, string | number | boolean | null> }
  ): Promise<CompanyData> {
    const data: CompanyData = {
      name: company.name,
      symbol: company.symbol,
      extraData: company.extra_data,
      priceHistory: [],
      webResults: [],
    }

    // Fetch price history (if symbol available)
    if (company.symbol) {
      try {
        const av = new AlphaVantageClient()
        const result = await av.getDailyPrices(company.symbol, 'compact')
        data.priceHistory = result.data.slice(-30).map(d => ({
          date: d.timestamp,
          close: d.close,
        }))
      } catch (error) {
        console.warn(`Alpha Vantage failed for ${company.symbol}:`, error)
      }
    }

    // Web search for recent news
    try {
      const searchQuery = `${company.name} stock analysis 2026`
      data.webResults = await this.braveSearch.search(searchQuery, 5)
    } catch (error) {
      console.warn(`Brave Search failed for ${company.name}:`, error)
    }

    return data
  }

  /**
   * Analyze a company using Claude Sonnet 4.5
   */
  async analyzeWithClaude(data: CompanyData): Promise<ClaudeAnalysisResult> {
    const ipoPrice = data.extraData['IPO_Price_$'] ?? data.extraData['IPO_Price'] ?? null
    const purchasePrice = data.extraData['Purchase_$'] ?? data.extraData['Purchase'] ?? null
    const thierGroup = data.extraData['Thier_Group'] ?? null
    const vip = data.extraData['VIP'] ?? null
    const sector = data.extraData['Sector'] ?? data.extraData['Branche'] ?? null
    const country = data.extraData['Country'] ?? data.extraData['Land'] ?? null
    const marketCap = data.extraData['Market_Cap'] ?? null

    const currentPrice = data.priceHistory.length > 0
      ? data.priceHistory[data.priceHistory.length - 1].close
      : null

    const priceHistoryText = data.priceHistory.length > 0
      ? data.priceHistory.map(p => `${p.date}: $${p.close}`).join('\n')
      : 'No price data available'

    const webResearchText = data.webResults.length > 0
      ? data.webResults.map(r => `- ${r.title}: ${r.description}`).join('\n')
      : 'No recent news found'

    const prompt = `You are a stock investment analyst. Analyze the following company and determine the optimal buy timing.

## Company: ${data.name}
- Symbol: ${data.symbol || 'N/A'}
- Sector: ${sector || 'N/A'}
- Country: ${country || 'N/A'}
- Market Cap: ${marketCap || 'N/A'}
- Thier Group: ${thierGroup || 'N/A'}
- VIP Status: ${vip || 'N/A'}

## Target Prices
- IPO Price: ${ipoPrice ? `$${ipoPrice}` : 'N/A'}
- Purchase Target: ${purchasePrice ? `$${purchasePrice}` : 'N/A'}
- Current Price: ${currentPrice ? `$${currentPrice}` : 'N/A'}

## 30-Day Price History
${priceHistoryText}

## Recent News & Analysis
${webResearchText}

## Your Task
Evaluate whether NOW is a good time to buy this stock. Consider:
1. Current price vs target prices (IPO_Price_$, Purchase_$)
2. Recent price trend (30-day history)
3. Recent news sentiment and catalysts
4. Risk factors

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "recommendation": "buy" | "wait" | "avoid",
  "confidence": 1-10,
  "reasoning": "Detailed reasoning (2-4 sentences in English)",
  "summary": "One-sentence summary for display card",
  "target_price": number or null,
  "catalysts": ["catalyst1", "catalyst2"],
  "risks": ["risk1", "risk2"]
}`

    const response = await this.anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    try {
      const parsed = JSON.parse(text) as ClaudeAnalysisResult

      // Validate and clamp confidence
      parsed.confidence = Math.max(1, Math.min(10, Math.round(parsed.confidence)))

      // Validate recommendation
      if (!['buy', 'wait', 'avoid'].includes(parsed.recommendation)) {
        parsed.recommendation = 'wait'
      }

      return parsed
    } catch {
      console.error('Failed to parse Claude response:', text)
      return {
        recommendation: 'wait',
        confidence: 1,
        reasoning: 'Analysis could not be completed. Raw response parsing failed.',
        summary: 'Analysis failed - manual review needed',
        target_price: null,
        catalysts: [],
        risks: ['Analysis parsing error'],
      }
    }
  }

  /**
   * Full analysis pipeline for a single company
   */
  async analyzeCompany(
    companyId: string,
    companyName: string,
    companySymbol: string | null,
    extraData: Record<string, string | number | boolean | null>
  ): Promise<{
    analysis: ClaudeAnalysisResult
    currentPrice: number | null
    priceGapPercent: number | null
    webResearchSummary: string | null
    dataSources: Record<string, unknown>
    durationMs: number
  }> {
    const startTime = Date.now()

    const data = await this.gatherCompanyData({
      name: companyName,
      symbol: companySymbol,
      extra_data: extraData,
    })

    const analysis = await this.analyzeWithClaude(data)

    const currentPrice = data.priceHistory.length > 0
      ? data.priceHistory[data.priceHistory.length - 1].close
      : null

    // Calculate price gap
    let priceGapPercent: number | null = null
    const purchaseTarget = Number(extraData['Purchase_$']) || Number(extraData['IPO_Price_$']) || null
    if (currentPrice && purchaseTarget) {
      priceGapPercent = ((currentPrice - purchaseTarget) / purchaseTarget) * 100
    }

    const webResearchSummary = data.webResults.length > 0
      ? data.webResults.map(r => `${r.title}`).join('; ')
      : null

    const dataSources: Record<string, unknown> = {
      alpha_vantage: data.priceHistory.length > 0,
      brave_search: data.webResults.length,
      price_data_points: data.priceHistory.length,
    }

    return {
      analysis,
      currentPrice,
      priceGapPercent,
      webResearchSummary,
      dataSources,
      durationMs: Date.now() - startTime,
    }
  }
}
