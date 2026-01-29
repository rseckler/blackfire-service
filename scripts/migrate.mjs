#!/usr/bin/env node

/**
 * Run database migration
 * Simple approach using Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment from .env.local
import { config } from 'dotenv'
config({ path: join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

console.log('🔄 Running database migration...\n')

// Read migration SQL
const migrationPath = join(__dirname, '../supabase/migrations/20260129000001_add_notion_fields.sql')
const sql = readFileSync(migrationPath, 'utf-8')

console.log('📄 Migration SQL loaded')
console.log(`   Statements to execute:\n`)

// Show the SQL
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'))

statements.forEach((stmt, i) => {
  const preview = stmt.substring(0, 60).replace(/\n/g, ' ')
  console.log(`   ${i + 1}. ${preview}...`)
})

console.log('\n⚠️  Note: These DDL statements need to be executed in Supabase Dashboard')
console.log('   Reason: ALTER TABLE requires database owner privileges\n')

console.log('=' .repeat(70))
console.log('COPY THIS SQL TO SUPABASE DASHBOARD → SQL EDITOR:')
console.log('='.repeat(70))
console.log('\n' + sql + '\n')
console.log('='.repeat(70))
console.log('\nThen press "Run" or Cmd+Enter\n')

process.exit(0)
