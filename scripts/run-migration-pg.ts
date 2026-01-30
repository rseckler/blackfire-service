#!/usr/bin/env node

import { Client } from 'pg'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function runMigration() {
  console.log('🚀 Running database migration...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!projectRef || !password) {
    console.log('⚠️  Direct database connection not available.')
    console.log('\n📝 Please apply migration manually via Supabase Dashboard:')
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/editor\n`)
    return
  }

  // Construct connection string
  const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✓ Connected to database\n')

    // Read and execute migration
    const migrationSQL = readFileSync(
      resolve(__dirname, '../supabase/migrations/20260130000002_add_notes_features.sql'),
      'utf-8'
    )

    console.log('📄 Executing migration SQL...\n')
    await client.query(migrationSQL)

    console.log('✅ Migration applied successfully!\n')

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
      console.log('\n⚠️  Could not connect to database directly.')
      console.log('📝 Please apply via Supabase Dashboard instead.\n')
    } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('ℹ️  Migration already applied (columns/indexes exist)\n')
    } else {
      console.error('❌ Migration error:', error.message)
    }
  } finally {
    await client.end()
  }
}

runMigration()
