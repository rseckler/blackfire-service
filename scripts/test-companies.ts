#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function getCompanies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, symbol, extra_data')
    .limit(5)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('📊 Available companies for testing:\n')
  data?.forEach((company: any, index: number) => {
    const hasInfo = ['Info1', 'Info2', 'Info3', 'Info4', 'Info5'].some(
      field => company.extra_data?.[field]
    )
    console.log(`${index + 1}. ${company.name}`)
    console.log(`   ID: ${company.id}`)
    console.log(`   Symbol: ${company.symbol || 'N/A'}`)
    console.log(`   Has Info fields: ${hasInfo ? '✓ Yes' : '✗ No'}`)
    console.log(`   URL: http://localhost:3000/stocks/${company.id}\n`)
  })
}

getCompanies()
