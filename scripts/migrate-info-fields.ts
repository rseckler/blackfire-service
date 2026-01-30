#!/usr/bin/env tsx

/**
 * Migration Script: Convert Info1-Info5 fields to Notes
 *
 * This script reads all companies with Info1-Info5 in extra_data
 * and converts each Info field to a note entry in the notes table.
 *
 * Usage:
 *   npm run migrate-info-fields
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Company {
  id: string
  name: string
  extra_data: Record<string, any>
}

interface MigrationStats {
  companiesProcessed: number
  notesCreated: number
  errors: number
  skipped: number
}

async function migrateInfoFields() {
  const stats: MigrationStats = {
    companiesProcessed: 0,
    notesCreated: 0,
    errors: 0,
    skipped: 0,
  }

  console.log('🚀 Starting Info1-Info5 migration...\n')

  try {
    // Step 1: Get system user (or first admin user) to use as note creator
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError || !users || users.users.length === 0) {
      console.error('❌ No users found. Please create at least one user first.')
      process.exit(1)
    }

    const systemUserId = users.users[0].id
    console.log(`📝 Using user ${users.users[0].email} as note creator\n`)

    // Step 2: Fetch all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, extra_data')

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError)
      process.exit(1)
    }

    if (!companies || companies.length === 0) {
      console.log('ℹ️  No companies found to migrate.')
      return stats
    }

    console.log(`📊 Found ${companies.length} companies to process\n`)

    // Step 3: Process each company
    for (const company of companies as Company[]) {
      stats.companiesProcessed++
      const extraData = company.extra_data || {}

      // Check if company has any Info fields
      const infoFields = ['Info1', 'Info2', 'Info3', 'Info4', 'Info5']
      const hasInfoFields = infoFields.some(field => extraData[field])

      if (!hasInfoFields) {
        stats.skipped++
        continue
      }

      console.log(`\n📦 Processing: ${company.name} (${company.id})`)

      // Process each Info field
      for (const infoField of infoFields) {
        const infoValue = extraData[infoField]

        if (!infoValue || typeof infoValue !== 'string') {
          continue
        }

        try {
          // Create note entry
          const { error: insertError } = await supabase
            .from('notes')
            .insert({
              user_id: systemUserId,
              entity_type: 'company',
              entity_id: company.id,
              title: `${infoField}`,
              content: `<p>${infoValue}</p>`, // Wrap in HTML paragraph
              tags: ['Migrated'],
              is_private: false, // Make shared (visible to all)
              priority: 2, // Medium priority
              migrated_from: infoField,
            })

          if (insertError) {
            console.error(`   ❌ Error creating note from ${infoField}:`, insertError.message)
            stats.errors++
          } else {
            console.log(`   ✓ Migrated ${infoField}: "${infoValue.substring(0, 50)}${infoValue.length > 50 ? '...' : ''}"`)
            stats.notesCreated++
          }
        } catch (error) {
          console.error(`   ❌ Unexpected error with ${infoField}:`, error)
          stats.errors++
        }
      }
    }

    // Print final statistics
    console.log('\n' + '='.repeat(60))
    console.log('✅ Migration completed!\n')
    console.log('📊 Statistics:')
    console.log(`   Companies processed: ${stats.companiesProcessed}`)
    console.log(`   Companies with Info fields: ${stats.companiesProcessed - stats.skipped}`)
    console.log(`   Companies skipped: ${stats.skipped}`)
    console.log(`   Notes created: ${stats.notesCreated}`)
    console.log(`   Errors: ${stats.errors}`)
    console.log('='.repeat(60))

    return stats

  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error)
    process.exit(1)
  }
}

// Run migration
migrateInfoFields()
  .then(() => {
    console.log('\n✨ Migration script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error)
    process.exit(1)
  })
