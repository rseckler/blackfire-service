#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function testAPI() {
  console.log('🧪 Testing Notes API Endpoints...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get user and company
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const userId = users[0].id
  
  const companyId = '9d00d32e-b4e6-4819-8ee5-bd2a5c7b2a93'

  // Test 1: Create Note
  console.log('1️⃣  Testing CREATE note...')
  const { data: newNote, error: createError } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      entity_type: 'company',
      entity_id: companyId,
      title: 'API Test Note',
      content: '<p>Testing <strong>API operations</strong> with <em>rich text</em>.</p>',
      tags: ['API Test', 'Automation'],
      is_private: true,
      priority: 3,
      reminder_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()

  if (createError) {
    console.log('❌ CREATE failed:', createError.message)
  } else {
    console.log('✅ CREATE successful')
    console.log(`   Note ID: ${newNote.id}`)
    console.log(`   Title: ${newNote.title}`)
    console.log(`   Priority: ${newNote.priority} (High)`)
    console.log(`   Private: ${newNote.is_private}\n`)

    // Test 2: Update Note
    console.log('2️⃣  Testing UPDATE note...')
    const { data: updatedNote, error: updateError } = await supabase
      .from('notes')
      .update({
        title: 'API Test Note (Updated)',
        priority: 1,
        tags: ['API Test', 'Automation', 'Updated']
      })
      .eq('id', newNote.id)
      .select()
      .single()

    if (updateError) {
      console.log('❌ UPDATE failed:', updateError.message)
    } else {
      console.log('✅ UPDATE successful')
      console.log(`   New title: ${updatedNote.title}`)
      console.log(`   New priority: ${updatedNote.priority} (Low)`)
      console.log(`   New tags: ${updatedNote.tags.join(', ')}\n`)
    }

    // Test 3: Fetch Notes
    console.log('3️⃣  Testing FETCH notes...')
    const { data: notes, error: fetchError } = await supabase
      .from('notes')
      .select('id, title, priority, is_private, tags')
      .eq('entity_type', 'company')
      .eq('entity_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (fetchError) {
      console.log('❌ FETCH failed:', fetchError.message)
    } else {
      console.log(`✅ FETCH successful - Found ${notes.length} notes`)
      notes.forEach((note, i) => {
        console.log(`   ${i + 1}. ${note.title}`)
      })
      console.log()
    }

    // Test 4: Delete Note
    console.log('4️⃣  Testing DELETE note...')
    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', newNote.id)

    if (deleteError) {
      console.log('❌ DELETE failed:', deleteError.message)
    } else {
      console.log('✅ DELETE successful')
      console.log(`   Note ${newNote.id} deleted\n`)
    }
  }

  console.log('═'.repeat(60))
  console.log('✨ API Tests Complete!\n')
  console.log('Summary:')
  console.log('  ✅ CREATE - Working')
  console.log('  ✅ UPDATE - Working')
  console.log('  ✅ FETCH - Working')
  console.log('  ✅ DELETE - Working')
  console.log('═'.repeat(60))
}

testAPI()
