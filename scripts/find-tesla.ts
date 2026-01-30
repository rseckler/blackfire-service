import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

supabase
  .from('companies')
  .select('id, name, symbol')
  .eq('symbol', 'TSLA')
  .single()
  .then(({ data, error }) => {
    if (error) {
      console.error('Error:', error)
      process.exit(1)
    }
    console.log('\n🚗 Tesla found!')
    console.log(`   Name: ${data.name}`)
    console.log(`   Symbol: ${data.symbol}`)
    console.log(`   ID: ${data.id}`)
    console.log(`\n   🔗 Direct Link: http://localhost:3000/stocks/${data.id}`)
    console.log('\n   📊 This page should now show the interactive stock chart!\n')
    process.exit(0)
  })
