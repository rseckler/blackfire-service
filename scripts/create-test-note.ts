#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function createTestNote() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  console.log('🧪 Creating test note...\n')

  try {
    // Get first user
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️  No users found. Creating a test user...\n')
      
      // Create test user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'test@blackfire.local',
        password: 'test123456',
        email_confirm: true
      })
      
      if (createError) {
        console.error('❌ Error creating user:', createError.message)
        return
      }
      
      console.log('✓ Test user created:')
      console.log('  Email: test@blackfire.local')
      console.log('  Password: test123456\n')
      
      users.push(newUser.user!)
    }

    const testUser = users[0]
    console.log(`✓ Using user: ${testUser.email}\n`)

    // Get a test company
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1)
      .single()

    if (!companies) {
      console.error('❌ No companies found')
      return
    }

    console.log(`✓ Testing with company: ${companies.name}\n`)

    // Create a test note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: testUser.id,
        entity_type: 'company',
        entity_id: companies.id,
        title: 'Test Note - System Verification',
        content: '<p>This is a <strong>test note</strong> created to verify the Notes System is working correctly.</p><p>Features tested:</p><ul><li>Rich-text formatting</li><li>Tags and priorities</li><li>Privacy controls</li></ul>',
        tags: ['Test', 'System Check'],
        is_private: false,
        priority: 2,
        reminder_date: null
      })
      .select()
      .single()

    if (noteError) {
      console.error('❌ Error creating note:', noteError.message)
      return
    }

    console.log('✅ Test note created successfully!\n')
    console.log('Note Details:')
    console.log(`  ID: ${note.id}`)
    console.log(`  Title: ${note.title}`)
    console.log(`  Priority: ${note.priority} (Medium)`)
    console.log(`  Visibility: ${note.is_private ? 'Private' : 'Shared'}`)
    console.log(`  Tags: ${note.tags.join(', ')}`)
    console.log(`\n📱 View in browser:`)
    console.log(`  http://localhost:3000/stocks/${companies.id}`)
    console.log(`\n🔐 Login credentials (if needed):`)
    console.log(`  Email: ${testUser.email}`)
    console.log(`  Password: test123456 (if test user was just created)`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTestNote()
