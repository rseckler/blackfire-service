"use client"

import React, { useState, useMemo } from 'react'
import { Note } from '@/lib/services/notes-service'
import { NoteCard } from './note-card'
import { NoteFiltersComponent, NoteFilters } from './note-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface NotesGridProps {
  notes: Note[]
  userId?: string
  onCreateNote: () => void
  onEditNote: (note: Note) => void
  onViewNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  availableTags: string[]
  isLoggedIn?: boolean
}

export function NotesGrid({
  notes,
  userId,
  onCreateNote,
  onEditNote,
  onViewNote,
  onDeleteNote,
  availableTags,
  isLoggedIn = false,
}: NotesGridProps) {
  const [filters, setFilters] = useState<NoteFilters>({
    tags: [],
    priority: null,
    visibility: 'all',
    sortBy: 'date',
  })

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = [...notes]

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter((note) =>
        filters.tags.some((tag) => note.tags?.includes(tag))
      )
    }

    // Filter by priority
    if (filters.priority !== null) {
      filtered = filtered.filter((note) => note.priority === filters.priority)
    }

    // Filter by visibility
    if (filters.visibility === 'private') {
      filtered = filtered.filter((note) => userId && note.user_id === userId && note.is_private)
    } else if (filters.visibility === 'shared') {
      filtered = filtered.filter((note) => !note.is_private)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'priority':
          return b.priority - a.priority
        case 'title':
          const aTitle = (a.title || 'Untitled').toLowerCase()
          const bTitle = (b.title || 'Untitled').toLowerCase()
          return aTitle.localeCompare(bTitle)
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [notes, filters, userId])

  return (
    <div className="space-y-6">
      {/* Header with Add Note button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            {notes.length !== filteredNotes.length && ` (${notes.length} total)`}
            {!isLoggedIn && notes.length > 0 && ' (shared)'}
          </p>
        </div>
        {isLoggedIn && (
          <Button onClick={onCreateNote} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        )}
      </div>

      {/* Filters */}
      <NoteFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
      />

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <p className="text-muted-foreground mb-4">
            {notes.length === 0
              ? isLoggedIn
                ? 'No notes yet. Create your first note to get started!'
                : 'No shared notes available for this company.'
              : 'No notes match your filters.'}
          </p>
          {notes.length === 0 && isLoggedIn && (
            <Button onClick={onCreateNote} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first note
            </Button>
          )}
          {!isLoggedIn && notes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Log in to create and view notes.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={onEditNote}
              onView={onViewNote}
              onDelete={onDeleteNote}
              isOwner={userId ? note.user_id === userId : false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
