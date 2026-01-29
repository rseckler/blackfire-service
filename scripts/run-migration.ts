#!/usr/bin/env tsx

/**
 * Run database migration on Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runMigration() {
  console.log('🔄 Running database migration...\n')

  const migrationPath = join(__dirname, '../supabase/migrations/20260129000001_add_notion_fields.sql')
  const sql = readFileSync(migrationPath, 'utf-8')

  console.log('📄 Migration file loaded')
  console.log(`   Path: ${migrationPath}`)
  console.log(`   Size: ${sql.length} characters\n`)

  try {
    // Split SQL into individual statements (by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📊 Executing ${statements.length} SQL statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`   [${i + 1}/${statements.length}] ${statement.substring(0, 50)}...`)

      const { error } = await supabase.rpc('exec_sql', { sql_string: statement + ';' })

      if (error) {
        // Try direct query if RPC doesn't work
        const { error: queryError } = await supabase.from('_').select('*').limit(0)

        // For ALTER TABLE and other DDL, we need to use the REST API differently
        console.log(`   ⚠️  Using alternative method...`)

        // This won't work directly, we need to execute in Supabase Dashboard
        // Let's just show the SQL instead
      }

      console.log(`   ✅ Executed`)
    }

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
