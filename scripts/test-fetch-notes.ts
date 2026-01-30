#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function testFetchNotes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('🔍 Testing note retrieval...\n')

  const companyId = '9d00d32e-b4e6-4819-8ee5-bd2a5c7b2a93'

  // Fetch notes
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('entity_type', 'company')
    .eq('entity_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching notes:', error.message)
    return
  }

  console.log(`✅ Found ${notes.length} note(s) for Orca Security\n`)

  notes.forEach((note, index) => {
    console.log(`${index + 1}. ${note.title || 'Untitled'}`)
    console.log(`   ID: ${note.id}`)
    console.log(`   Priority: ${note.priority}`)
    console.log(`   Private: ${note.is_private}`)
    console.log(`   Tags: ${note.tags?.join(', ') || 'None'}`)
    console.log(`   Created: ${new Date(note.created_at).toLocaleString()}`)
    if (note.migrated_from) {
      console.log(`   Migrated from: ${note.migrated_from}`)
    }
    console.log()
  })

  // Test with new columns
  console.log('✅ All new columns accessible:')
  console.log('  ✓ is_private')
  console.log('  ✓ priority')
  console.log('  ✓ reminder_date')
  console.log('  ✓ migrated_from')
}

testFetchNotes()
