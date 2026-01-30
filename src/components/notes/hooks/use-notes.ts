import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Note, CreateNoteInput, UpdateNoteInput } from '@/lib/services/notes-service'

/**
 * Fetch notes for a company
 */
export function useCompanyNotes(companyId: string | null) {
  return useQuery<Note[]>({
    queryKey: ['notes', 'company', companyId],
    queryFn: async () => {
      if (!companyId) return []

      const response = await fetch(`/api/notes?companyId=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }
      const data = await response.json()
      return data.notes
    },
    enabled: !!companyId,
  })
}

/**
 * Create a new note
 */
export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<CreateNoteInput, 'userId'>) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create note')
      }

      const data = await response.json()
      return data.note as Note
    },
    onSuccess: (note) => {
      // Invalidate company notes query to refetch
      queryClient.invalidateQueries({ queryKey: ['notes', 'company', note.entity_id] })
    },
  })
}

/**
 * Update a note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, updates }: { noteId: string; updates: UpdateNoteInput }) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update note')
      }

      const data = await response.json()
      return data.note as Note
    },
    onSuccess: (note) => {
      // Invalidate company notes query to refetch
      queryClient.invalidateQueries({ queryKey: ['notes', 'company', note.entity_id] })
    },
  })
}

/**
 * Delete a note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, companyId }: { noteId: string; companyId: string }) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete note')
      }

      return { noteId, companyId }
    },
    onSuccess: (data) => {
      // Invalidate company notes query to refetch
      queryClient.invalidateQueries({ queryKey: ['notes', 'company', data.companyId] })
    },
  })
}

/**
 * Fetch available tags for a company
 */
export function useNoteTags(companyId: string | null) {
  return useQuery<string[]>({
    queryKey: ['notes', 'tags', companyId],
    queryFn: async () => {
      if (!companyId) return []

      const response = await fetch(`/api/notes/tags?companyId=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tags')
      }
      const data = await response.json()
      return data.tags
    },
    enabled: !!companyId,
  })
}
