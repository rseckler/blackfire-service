/**
 * Brave Search API Client
 *
 * Searches for recent news and analysis about companies.
 * Free tier: 2,000 queries/month
 *
 * API Documentation: https://api.search.brave.com/app/documentation/web-search
 */

export interface BraveSearchResult {
  title: string
  url: string
  description: string
  age?: string
}

export class BraveSearchClient {
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.search.brave.com/res/v1/web/search'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BRAVE_API_KEY || ''
  }

  async search(query: string, count: number = 5): Promise<BraveSearchResult[]> {
    if (!this.apiKey) {
      console.warn('Brave API key not set, skipping web search')
      return []
    }

    const params = new URLSearchParams({
      q: query,
      count: String(count),
      freshness: 'pm', // past month
      text_decorations: 'false',
    })

    try {
      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        console.error(`Brave Search error: ${response.status} ${response.statusText}`)
        return []
      }

      const json = await response.json()
      const results = json.web?.results || []

      return results.slice(0, count).map((r: Record<string, string>) => ({
        title: r.title || '',
        url: r.url || '',
        description: r.description || '',
        age: r.age,
      }))
    } catch (error) {
      console.error('Brave Search failed:', error)
      return []
    }
  }
}

let braveSearchClient: BraveSearchClient | null = null

export function getBraveSearchClient(): BraveSearchClient {
  if (!braveSearchClient) {
    braveSearchClient = new BraveSearchClient()
  }
  return braveSearchClient
}
