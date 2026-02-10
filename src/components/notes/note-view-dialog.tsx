"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NoteEditor } from './note-editor'
import { Note } from '@/lib/services/notes-service'
import {
  Lock,
  Users,
  Calendar,
  Edit,
  ArrowDown,
  ArrowUp,
  Minus,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const PRIORITY_CONFIG = {
  0: { label: 'Normal', icon: Minus, color: 'text-muted-foreground' },
  1: { label: 'Low', icon: ArrowDown, color: 'text-blue-500' },
  2: { label: 'Medium', icon: AlertCircle, color: 'text-yellow-500' },
  3: { label: 'High', icon: ArrowUp, color: 'text-red-500' },
} as const

interface NoteViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note | null
  isOwner: boolean
  onEdit: (note: Note) => void
}

export function NoteViewDialog({ open, onOpenChange, note, isOwner, onEdit }: NoteViewDialogProps) {
  if (!note) return null

  const priorityConfig = PRIORITY_CONFIG[note.priority as keyof typeof PRIORITY_CONFIG]
  const PriorityIcon = priorityConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {note.priority > 0 && (
              <PriorityIcon
                className={cn("h-5 w-5 flex-shrink-0", priorityConfig.color)}
                title={priorityConfig.label}
              />
            )}
            <DialogTitle className="text-xl">
              {note.title || 'Untitled Note'}
            </DialogTitle>
            {note.is_private ? (
              <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" title="Private" />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" title="Shared" />
            )}
          </div>
        </DialogHeader>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Created {format(new Date(note.created_at), 'MMM d, yyyy')}</span>
          {note.updated_at && note.updated_at !== note.created_at && (
            <span>Updated {format(new Date(note.updated_at), 'MMM d, yyyy')}</span>
          )}
          {note.reminder_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Reminder: {format(new Date(note.reminder_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          {note.priority > 0 && (
            <Badge variant="outline" className={priorityConfig.color}>
              {priorityConfig.label} priority
            </Badge>
          )}
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="border rounded-md p-4 bg-muted/10 min-h-[150px]">
          <NoteEditor
            content={note.content}
            onChange={() => {}}
            readOnly
          />
        </div>

        {/* Migrated indicator */}
        {note.migrated_from && (
          <p className="text-xs text-muted-foreground">
            Migrated from: {note.migrated_from}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isOwner && (
            <Button
              onClick={() => {
                onOpenChange(false)
                onEdit(note)
              }}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
