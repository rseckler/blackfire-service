import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getNoteTags } from '@/lib/services/notes-service'

/**
 * GET /api/notes/tags?companyId=XXX
 * Get all unique tags for a company
 * If not logged in, returns tags from shared notes only
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    if (user) {
      const tags = await getNoteTags(companyId, user.id)
      return NextResponse.json({ tags })
    } else {
      // Get tags from shared notes only for non-authenticated users
      const { data: notes, error } = await supabase
        .from('notes')
        .select('tags')
        .eq('entity_type', 'company')
        .eq('entity_id', companyId)
        .eq('is_private', false)

      if (error) {
        throw error
      }

      // Flatten and deduplicate tags
      const allTags = (notes || []).flatMap(note => note.tags || [])
      const uniqueTags = Array.from(new Set(allTags)).sort()

      return NextResponse.json({ tags: uniqueTags })
    }
  } catch (error) {
    console.error('Error in GET /api/notes/tags:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
