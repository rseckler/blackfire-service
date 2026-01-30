#!/usr/bin/env node

import { Client } from 'pg'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function applyMigration() {
  console.log('🚀 Applying database migration...\n')

  // Get database connection details
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
    process.exit(1)
  }

  // Extract project ref from URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (!projectRef) {
    console.error('❌ Could not extract project ref from URL')
    process.exit(1)
  }

  // Read migration SQL
  const migrationSQL = readFileSync(
    resolve(__dirname, '../supabase/migrations/20260130000002_add_notes_features.sql'),
    'utf-8'
  )

  console.log('📋 Migration SQL loaded')
  console.log('📊 Project:', projectRef)
  console.log('\n⚠️  To apply this migration, you need direct database access.')
  console.log('\n📝 Please follow these steps:\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/editor')
  console.log('2. Click "SQL Editor" in the left sidebar')
  console.log('3. Click "+ New query" button')
  console.log('4. Paste the following SQL:\n')
  console.log('=' .repeat(70))
  console.log(migrationSQL)
  console.log('=' .repeat(70))
  console.log('\n5. Click "Run" button (or press Cmd/Ctrl + Enter)')
  console.log('\n✅ After running, you can verify with: npx tsx scripts/verify-migration.ts\n')
}

applyMigration().catch(console.error)
