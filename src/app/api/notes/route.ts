import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNote, getCompanyNotes } from '@/lib/services/notes-service'

/**
 * GET /api/notes?companyId=XXX
 * Get all notes for a company (user's private + all shared)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    const notes = await getCompanyNotes(companyId, user.id)
    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error in GET /api/notes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { companyId, title, content, tags, isPrivate, priority, reminderDate } = body

    if (!companyId || !content) {
      return NextResponse.json(
        { error: 'companyId and content are required' },
        { status: 400 }
      )
    }

    const note = await createNote({
      companyId,
      userId: user.id,
      title,
      content,
      tags,
      isPrivate,
      priority,
      reminderDate,
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/notes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
