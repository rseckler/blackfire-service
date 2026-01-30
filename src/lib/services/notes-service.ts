import { createClient } from '@/lib/supabase/client'

export interface Note {
  id: string
  user_id: string
  entity_type: 'company' | 'sector' | 'basket' | 'general'
  entity_id: string
  title: string | null
  content: string  // HTML from TipTap
  tags: string[]
  is_private: boolean
  priority: 0 | 1 | 2 | 3  // 0=Normal, 1=Low, 2=Medium, 3=High
  reminder_date: string | null  // ISO date string
  migrated_from: string | null  // "Info1", "Info2", etc. if migrated
  notion_page_id: string | null
  created_at: string
  updated_at: string
}

export interface CreateNoteInput {
  companyId: string
  userId: string
  title?: string
  content: string
  tags?: string[]
  isPrivate?: boolean
  priority?: number
  reminderDate?: string | null
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  tags?: string[]
  isPrivate?: boolean
  priority?: number
  reminderDate?: string | null
}

/**
 * Create a new note
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: input.userId,
      entity_type: 'company',
      entity_id: input.companyId,
      title: input.title || null,
      content: input.content,
      tags: input.tags || [],
      is_private: input.isPrivate !== undefined ? input.isPrivate : true,
      priority: input.priority || 0,
      reminder_date: input.reminderDate || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating note:', error)
    throw new Error(`Failed to create note: ${error.message}`)
  }

  return data
}

/**
 * Get all notes for a company
 * Returns user's private notes + all shared notes
 */
export async function getCompanyNotes(companyId: string, userId: string): Promise<Note[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('entity_type', 'company')
    .eq('entity_id', companyId)
    .or(`user_id.eq.${userId},is_private.eq.false`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching company notes:', error)
    throw new Error(`Failed to fetch notes: ${error.message}`)
  }

  return data || []
}

/**
 * Update a note
 */
export async function updateNote(
  noteId: string,
  userId: string,
  updates: UpdateNoteInput
): Promise<Note> {
  const supabase = createClient()

  // First verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('notes')
    .select('user_id')
    .eq('id', noteId)
    .single()

  if (fetchError || !existing) {
    throw new Error('Note not found')
  }

  if (existing.user_id !== userId) {
    throw new Error('Unauthorized: You can only edit your own notes')
  }

  const { data, error } = await supabase
    .from('notes')
    .update({
      title: updates.title,
      content: updates.content,
      tags: updates.tags,
      is_private: updates.isPrivate,
      priority: updates.priority,
      reminder_date: updates.reminderDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single()

  if (error) {
    console.error('Error updating note:', error)
    throw new Error(`Failed to update note: ${error.message}`)
  }

  return data
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  const supabase = createClient()

  // First verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('notes')
    .select('user_id')
    .eq('id', noteId)
    .single()

  if (fetchError || !existing) {
    throw new Error('Note not found')
  }

  if (existing.user_id !== userId) {
    throw new Error('Unauthorized: You can only delete your own notes')
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)

  if (error) {
    console.error('Error deleting note:', error)
    throw new Error(`Failed to delete note: ${error.message}`)
  }
}

/**
 * Get all unique tags for a company (for autocomplete)
 */
export async function getNoteTags(companyId: string, userId: string): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('tags')
    .eq('entity_type', 'company')
    .eq('entity_id', companyId)
    .or(`user_id.eq.${userId},is_private.eq.false`)

  if (error) {
    console.error('Error fetching note tags:', error)
    return []
  }

  // Flatten and deduplicate tags
  const allTags = data.flatMap(note => note.tags || [])
  return Array.from(new Set(allTags)).sort()
}

/**
 * Helper to strip HTML tags for preview text
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Helper to truncate text for preview
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
