#!/usr/bin/env node

/**
 * Check if a company has a symbol
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const companyId = process.argv[2] || '51c7417a-0ce7-4361-a6cb-654dae1f254f'

async function checkCompanySymbol() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log(`\n🔍 Checking company: ${companyId}\n`)

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, symbol, wkn, isin')
    .eq('id', companyId)
    .single()

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  if (!data) {
    console.error('❌ Company not found')
    process.exit(1)
  }

  console.log('Company Data:')
  console.log('─────────────')
  console.log(`Name:   ${data.name}`)
  console.log(`Symbol: ${data.symbol || '❌ NO SYMBOL'}`)
  console.log(`WKN:    ${data.wkn || '-'}`)
  console.log(`ISIN:   ${data.isin || '-'}`)
  console.log()

  if (!data.symbol) {
    console.log('⚠️  This company has NO SYMBOL - chart cannot be displayed!')
    console.log('💡 Add a symbol to enable charts\n')
  } else {
    console.log(`✅ Symbol found: ${data.symbol}`)
    console.log('📊 Chart should be available\n')
  }
}

checkCompanySymbol().catch(console.error)
