"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { NotesGrid } from './notes-grid'
import { NoteDialog } from './note-dialog'
import { useCompanyNotes, useNoteTags } from './hooks/use-notes'
import { Note } from '@/lib/services/notes-service'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CompanyNotesSectionProps {
  companyId: string
}

export function CompanyNotesSection({ companyId }: CompanyNotesSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const { data: notes = [], isLoading, error } = useCompanyNotes(companyId)
  const { data: availableTags = [] } = useNoteTags(companyId)

  // Get current user
  React.useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  const handleCreateNote = () => {
    setSelectedNote(null)
    setDialogOpen(true)
  }

  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setDialogOpen(true)
  }

  const handleDeleteNote = async (noteId: string) => {
    // Deletion is handled by the mutation hook in notes-grid
    // This is just a placeholder for the interface
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Notes</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Notes</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-destructive">
            <p>Error loading notes. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <NotesGrid
            notes={notes}
            userId={userId || undefined}
            onCreateNote={userId ? handleCreateNote : () => {}}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            availableTags={availableTags}
            isLoggedIn={!!userId}
          />
        </CardContent>
      </Card>

      {userId && (
        <NoteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          companyId={companyId}
          note={selectedNote}
        />
      )}
    </>
  )
}
