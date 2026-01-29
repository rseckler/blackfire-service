#!/usr/bin/env tsx

/**
 * Import Companies from Notion to PostgreSQL (Supabase)
 *
 * This script imports all companies from the Notion database used in
 * Blackfire_automation project into the PostgreSQL database.
 *
 * Usage:
 *   npm run import:notion
 *
 * Environment Variables Required:
 *   NOTION_API_KEY - Notion Integration Token
 *   NOTION_DATABASE_ID - Aktien_Blackfire Database ID
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase Project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase Service Role Key (for admin operations)
 */

import { Client } from '@notionhq/client'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const BATCH_SIZE = 100 // Insert in batches to avoid memory issues

// Validation
if (!NOTION_API_KEY) {
  console.error('❌ NOTION_API_KEY not found in environment variables')
  process.exit(1)
}

if (!NOTION_DATABASE_ID) {
  console.error('❌ NOTION_DATABASE_ID not found in environment variables')
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase credentials not found in environment variables')
  process.exit(1)
}

// Initialize clients
const notion = new Client({ auth: NOTION_API_KEY })
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Type definitions
interface NotionPage {
  id: string
  properties: any
}

interface CompanyData {
  name: string
  satellog: string | null
  symbol: string | null
  wkn: string | null
  isin: string | null
  sector: string | null
  industry: string | null
  market_cap: number | null
  description: string | null
  website: string | null
  country: string | null
  exchange: string | null
  currency: string | null
  current_price: number | null
  price_change_percent: number | null
  price_update: string | null
  market_status: string | null
  day_high: number | null
  day_low: number | null
  volume: number | null
  notion_page_id: string
  last_synced_at: string
  extra_data: Record<string, any>
}

/**
 * Extract text from Notion rich text property
 */
function extractText(property: any): string | null {
  if (!property) return null

  if (property.type === 'title' && property.title?.[0]?.plain_text) {
    return property.title[0].plain_text
  }

  if (property.type === 'rich_text' && property.rich_text?.[0]?.plain_text) {
    return property.rich_text[0].plain_text
  }

  return null
}

/**
 * Extract number from Notion number property
 */
function extractNumber(property: any): number | null {
  if (!property || property.type !== 'number') return null
  return property.number
}

/**
 * Extract date from Notion date property
 */
function extractDate(property: any): string | null {
  if (!property || property.type !== 'date') return null
  return property.date?.start || null
}

/**
 * Extract select from Notion select property
 */
function extractSelect(property: any): string | null {
  if (!property || property.type !== 'select') return null
  return property.select?.name || null
}

/**
 * Map Notion page to Company data
 */
function mapNotionPageToCompany(page: NotionPage): CompanyData {
  const props = page.properties

  // Required fields
  const name = extractText(props.Name) || 'Unknown Company'
  const satellog = extractText(props.satellog)

  // Stock identifiers
  const symbol = extractText(props.Company_Symbol)
  const wkn = extractText(props.WKN)
  const isin = extractText(props.ISIN)

  // Price data
  const current_price = extractNumber(props.Current_Price)
  const price_change_percent = extractNumber(props.Price_Change_Percent)
  const price_update = extractDate(props.Price_Update)
  const market_status = extractSelect(props.Market_Status)
  const day_high = extractNumber(props.Day_High)
  const day_low = extractNumber(props.Day_Low)
  const volume = extractNumber(props.Volume)
  const market_cap = extractNumber(props.Market_Cap)

  // Exchange data
  const exchange = extractSelect(props.Exchange)
  const currency = extractSelect(props.Currency)

  // Additional metadata (store all other properties in extra_data)
  const extra_data: Record<string, any> = {}

  // Store all properties that aren't mapped above
  const mappedKeys = new Set([
    'Name', 'satellog', 'Company_Symbol', 'WKN', 'ISIN',
    'Current_Price', 'Price_Change_Percent', 'Price_Update',
    'Market_Status', 'Day_High', 'Day_Low', 'Volume', 'Market_Cap',
    'Exchange', 'Currency'
  ])

  for (const [key, value] of Object.entries(props)) {
    if (!mappedKeys.has(key)) {
      // Store raw property for later use
      extra_data[key] = value
    }
  }

  return {
    name,
    satellog,
    symbol,
    wkn,
    isin,
    sector: null, // Could be mapped from extra_data if exists
    industry: null,
    market_cap,
    description: null,
    website: null,
    country: null,
    exchange,
    currency: currency || 'USD',
    current_price,
    price_change_percent,
    price_update,
    market_status,
    day_high,
    day_low,
    volume,
    notion_page_id: page.id,
    last_synced_at: new Date().toISOString(),
    extra_data
  }
}

/**
 * Fetch all pages from Notion database (with pagination)
 */
async function fetchAllNotionPages(): Promise<NotionPage[]> {
  const pages: NotionPage[] = []
  let cursor: string | undefined = undefined
  let hasMore = true
  let pageCount = 0

  console.log('📥 Fetching companies from Notion...')

  while (hasMore) {
    const response: any = await notion.databases.query({
      database_id: NOTION_DATABASE_ID!,
      start_cursor: cursor,
      page_size: 100
    })

    pages.push(...response.results)
    pageCount++

    hasMore = response.has_more
    cursor = response.next_cursor

    console.log(`   Fetched page ${pageCount}: ${pages.length} companies total`)
  }

  console.log(`✅ Fetched ${pages.length} companies from Notion\n`)

  return pages
}

/**
 * Insert companies into Supabase in batches
 */
async function insertCompanies(companies: CompanyData[]): Promise<void> {
  console.log(`📤 Inserting ${companies.length} companies into PostgreSQL...\n`)

  let inserted = 0
  let skipped = 0
  let errors = 0

  // Process in batches
  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(companies.length / BATCH_SIZE)

    console.log(`   Processing batch ${batchNum}/${totalBatches} (${batch.length} companies)...`)

    try {
      const { data, error } = await supabase
        .from('companies')
        .upsert(batch, {
          onConflict: 'satellog',
          ignoreDuplicates: false
        })

      if (error) {
        console.error(`   ❌ Batch ${batchNum} error:`, error.message)
        errors += batch.length
      } else {
        inserted += batch.length
        console.log(`   ✅ Batch ${batchNum} inserted successfully`)
      }
    } catch (err) {
      console.error(`   ❌ Batch ${batchNum} exception:`, err)
      errors += batch.length
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n📊 Import Summary:')
  console.log(`   ✅ Inserted/Updated: ${inserted}`)
  console.log(`   ⏩ Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   📈 Total: ${companies.length}`)
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Notion → PostgreSQL Import\n')
  console.log('Configuration:')
  console.log(`   Notion Database: ${NOTION_DATABASE_ID}`)
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   Batch Size: ${BATCH_SIZE}\n`)

  const startTime = Date.now()

  try {
    // Step 1: Fetch all pages from Notion
    const notionPages = await fetchAllNotionPages()

    if (notionPages.length === 0) {
      console.log('⚠️  No companies found in Notion database')
      return
    }

    // Step 2: Map Notion pages to company data
    console.log('🔄 Mapping Notion data to PostgreSQL schema...')
    const companies = notionPages.map(mapNotionPageToCompany)
    console.log(`✅ Mapped ${companies.length} companies\n`)

    // Step 3: Show sample data
    console.log('📋 Sample company data:')
    const sample = companies[0]
    console.log(`   Name: ${sample.name}`)
    console.log(`   Satellog: ${sample.satellog}`)
    console.log(`   Symbol: ${sample.symbol}`)
    console.log(`   ISIN: ${sample.isin}`)
    console.log(`   Current Price: ${sample.current_price} ${sample.currency}`)
    console.log(`   Extra Fields: ${Object.keys(sample.extra_data).length}\n`)

    // Step 4: Insert into Supabase
    await insertCompanies(companies)

    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(`\n✅ Import completed in ${duration}s`)

  } catch (error) {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  }
}

// Run import
main()
