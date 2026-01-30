import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateNote, deleteNote } from '@/lib/services/notes-service'

/**
 * PATCH /api/notes/[id]
 * Update a note
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const noteId = params.id
    const body = await request.json()
    const { title, content, tags, isPrivate, priority, reminderDate } = body

    const note = await updateNote(noteId, user.id, {
      title,
      content,
      tags,
      isPrivate,
      priority,
      reminderDate,
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error in PATCH /api/notes/[id]:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Unauthorized') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete a note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const noteId = params.id
    await deleteNote(noteId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/notes/[id]:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Unauthorized') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
