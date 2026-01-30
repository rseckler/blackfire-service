/**
 * Add Test Symbols (Quick Start)
 *
 * Manually adds known ticker symbols to test the chart functionality
 * Usage: tsx scripts/add-test-symbols.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

// Known US tech stocks with their ISINs for matching
const TEST_SYMBOLS = [
  { name: 'Apple', symbol: 'AAPL', isin: 'US0378331005' },
  { name: 'Microsoft', symbol: 'MSFT', isin: 'US5949181045' },
  { name: 'Tesla', symbol: 'TSLA', isin: 'US88160R1014' },
  { name: 'Amazon', symbol: 'AMZN', isin: 'US0231351067' },
  { name: 'Alphabet', symbol: 'GOOGL', isin: 'US02079K3059' },
  { name: 'NVIDIA', symbol: 'NVDA', isin: 'US67066G1040' },
  { name: 'Meta', symbol: 'META', isin: 'US30303M1027' },
]

async function main() {
  console.log('🚀 Adding Test Symbols')
  console.log('======================\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  let added = 0
  let updated = 0
  let notFound = 0

  for (const testSymbol of TEST_SYMBOLS) {
    try {
      // Try to find by ISIN first
      let { data: companies, error } = await supabase
        .from('companies')
        .select('id, name, symbol, isin')
        .eq('isin', testSymbol.isin)
        .limit(1)

      // If not found by ISIN, try by name (case-insensitive)
      if (!companies || companies.length === 0) {
        const result = await supabase
          .from('companies')
          .select('id, name, symbol, isin')
          .ilike('name', `%${testSymbol.name}%`)
          .limit(1)

        companies = result.data
        error = result.error
      }

      if (error) {
        console.error(`❌ Error querying ${testSymbol.name}:`, error.message)
        continue
      }

      if (!companies || companies.length === 0) {
        console.log(`⚠️  ${testSymbol.name} not found in database`)
        notFound++

        // Optionally create the company
        const { data: newCompany, error: insertError } = await supabase
          .from('companies')
          .insert({
            name: testSymbol.name,
            symbol: testSymbol.symbol,
            isin: testSymbol.isin,
          })
          .select()
          .single()

        if (insertError) {
          console.error(`   Failed to create: ${insertError.message}`)
        } else {
          console.log(`   ✅ Created ${testSymbol.name} with symbol ${testSymbol.symbol}`)
          added++
        }
        continue
      }

      const company = companies[0]

      if (company.symbol) {
        console.log(`✓ ${company.name} already has symbol: ${company.symbol}`)
        continue
      }

      // Update with symbol
      const { error: updateError } = await supabase
        .from('companies')
        .update({ symbol: testSymbol.symbol })
        .eq('id', company.id)

      if (updateError) {
        console.error(`❌ Failed to update ${company.name}:`, updateError.message)
      } else {
        console.log(`✅ ${company.name} → ${testSymbol.symbol}`)
        updated++
      }
    } catch (err) {
      console.error(`❌ Error processing ${testSymbol.name}:`, err)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   🆕 Added: ${added}`)
  console.log(`   ⚠️  Not found: ${notFound}`)
  console.log('\n💡 Tip: Visit http://localhost:3000/stocks and click on a company to see the chart!')

  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Script error:', error)
  process.exit(1)
})
