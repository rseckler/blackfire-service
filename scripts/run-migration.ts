#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMigration() {
  console.log('🔍 Checking if migration is needed...\n')
  
  const { data, error } = await supabase
    .from('notes')
    .select('id, is_private, priority, reminder_date, migrated_from')
    .limit(1)
  
  if (error) {
    if (error.message.includes('is_private') || error.message.includes('priority')) {
      console.log('❌ Migration needed. Please apply via Supabase Dashboard:')
      console.log('\n1. Go to: https://supabase.com/dashboard')
      console.log('2. SQL Editor → New Query')
      console.log('3. Paste from: supabase/migrations/20260130000002_add_notes_features.sql')
      console.log('4. Click Run\n')
      return false
    }
  }
  
  console.log('✅ Migration already applied!\n')
  return true
}

checkMigration()
