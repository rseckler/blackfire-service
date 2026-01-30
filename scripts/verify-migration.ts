#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function verifyMigration() {
  console.log('🔍 Verifying migration status...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Try to query with new columns
    const { data, error } = await supabase
      .from('notes')
      .select('id, is_private, priority, reminder_date, migrated_from')
      .limit(1)

    if (error) {
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        console.log('❌ Migration NOT applied yet')
        console.log('\nMissing columns detected. Please run:')
        console.log('  npx tsx scripts/apply-migration-direct.ts')
        console.log('\nAnd follow the instructions to apply via Supabase Dashboard.\n')
        return false
      }
      console.log('⚠️  Error checking migration:', error.message)
      return false
    }

    console.log('✅ Migration successfully applied!')
    console.log('\nNew columns available:')
    console.log('  ✓ is_private (BOOLEAN)')
    console.log('  ✓ priority (INTEGER 0-3)')
    console.log('  ✓ reminder_date (TIMESTAMPTZ)')
    console.log('  ✓ migrated_from (TEXT)')
    console.log('\n🚀 Ready to test the Notes System!\n')
    return true

  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  }
}

verifyMigration()
