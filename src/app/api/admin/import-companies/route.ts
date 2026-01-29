import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 100

interface NotionProperty {
  id: string
  type: string
  [key: string]: unknown
}

interface NotionPage {
  id: string
  properties: Record<string, NotionProperty>
}

interface CompanyData {
  satellog: string
  name: string
  symbol?: string
  wkn?: string
  isin?: string
  current_price?: number
  extra_data: Record<string, unknown>
}

export async function POST() {
  try {
    // Verify environment variables
    const NOTION_API_KEY = process.env.NOTION_API_KEY
    const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
      return NextResponse.json(
        { error: 'Notion credentials missing' },
        { status: 500 }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: 'Supabase credentials missing' },
        { status: 500 }
      )
    }

    // Initialize clients
    const notion = new Client({ auth: NOTION_API_KEY })
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    console.log('🔄 Starting Notion → PostgreSQL import...')

    // Fetch all pages from Notion
    const pages: NotionPage[] = []
    let hasMore = true
    let cursor: string | undefined = undefined

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        start_cursor: cursor,
        page_size: 100,
      })

      pages.push(...(response.results as NotionPage[]))
      hasMore = response.has_more
      cursor = response.next_cursor || undefined

      console.log(`📄 Fetched ${pages.length} pages so far...`)
    }

    console.log(`✅ Fetched total of ${pages.length} pages from Notion`)

    // Transform Notion pages to company data
    const companies: CompanyData[] = pages.map((page) => {
      const props = page.properties
      const extraData: Record<string, unknown> = {}

      // Helper to extract property value
      const getValue = (prop: NotionProperty): unknown => {
        if (!prop) return null

        switch (prop.type) {
          case 'title':
            return (prop as any).title?.[0]?.plain_text || null
          case 'rich_text':
            return (prop as any).rich_text?.[0]?.plain_text || null
          case 'number':
            return (prop as any).number || null
          case 'select':
            return (prop as any).select?.name || null
          case 'multi_select':
            return (prop as any).multi_select?.map((s: any) => s.name) || []
          case 'date':
            return (prop as any).date?.start || null
          case 'checkbox':
            return (prop as any).checkbox || false
          case 'url':
            return (prop as any).url || null
          case 'email':
            return (prop as any).email || null
          case 'phone_number':
            return (prop as any).phone_number || null
          default:
            return null
        }
      }

      // Extract core fields
      const satellog = getValue(props['Satellog'])?.toString() || `notion_${page.id}`
      const name = getValue(props['Name'])?.toString() || 'Unknown Company'
      const symbol = getValue(props['Symbol'])?.toString()
      const wkn = getValue(props['WKN'])?.toString()
      const isin = getValue(props['ISIN'])?.toString()
      const currentPrice = getValue(props['Current Price']) as number | null

      // Store all other properties in extra_data
      Object.entries(props).forEach(([key, prop]) => {
        if (!['Satellog', 'Name', 'Symbol', 'WKN', 'ISIN', 'Current Price'].includes(key)) {
          const value = getValue(prop)
          if (value !== null) {
            extraData[key] = value
          }
        }
      })

      return {
        satellog,
        name,
        symbol: symbol || undefined,
        wkn: wkn || undefined,
        isin: isin || undefined,
        current_price: currentPrice || undefined,
        extra_data: extraData,
      }
    })

    console.log(`📊 Transformed ${companies.length} companies`)

    // Insert in batches
    let inserted = 0
    let updated = 0

    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE)

      const { error, count } = await supabase
        .from('companies')
        .upsert(batch, {
          onConflict: 'satellog',
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error)
        throw error
      }

      const batchCount = count || batch.length
      inserted += batchCount
      console.log(`✅ Batch ${i / BATCH_SIZE + 1}: ${batchCount} companies`)
    }

    console.log(`\n✅ Import complete!`)
    console.log(`   Total processed: ${companies.length}`)
    console.log(`   Inserted/Updated: ${inserted}`)

    return NextResponse.json({
      success: true,
      total: companies.length,
      inserted,
      updated,
    })
  } catch (error) {
    console.error('❌ Import failed:', error)
    return NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
