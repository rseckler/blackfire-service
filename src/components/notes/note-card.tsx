"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Note, stripHtml, truncateText } from '@/lib/services/notes-service'
import {
  Star,
  Lock,
  Users,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onView: (note: Note) => void
  onDelete: (noteId: string) => void
  isOwner: boolean
}

const PRIORITY_CONFIG = {
  0: { label: 'Normal', icon: Minus, color: 'text-muted-foreground' },
  1: { label: 'Low', icon: ArrowDown, color: 'text-blue-500' },
  2: { label: 'Medium', icon: AlertCircle, color: 'text-yellow-500' },
  3: { label: 'High', icon: ArrowUp, color: 'text-red-500' },
} as const

export function NoteCard({ note, onEdit, onView, onDelete, isOwner }: NoteCardProps) {
  const priorityConfig = PRIORITY_CONFIG[note.priority as keyof typeof PRIORITY_CONFIG]
  const PriorityIcon = priorityConfig.icon
  const contentPreview = truncateText(stripHtml(note.content), 300)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id)
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        !isOwner && "opacity-90"
      )}
      onClick={() => onView(note)}
    >
      <CardContent className="p-4">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Priority indicator */}
            {note.priority > 0 && (
              <PriorityIcon
                className={cn("h-4 w-4 flex-shrink-0", priorityConfig.color)}
                title={priorityConfig.label}
              />
            )}

            {/* Title or default */}
            <h3 className="font-semibold text-sm truncate">
              {note.title || 'Untitled Note'}
            </h3>

            {/* Privacy indicator */}
            {note.is_private ? (
              <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" title="Private" />
            ) : (
              <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" title="Shared" />
            )}
          </div>

          {/* Actions (only for owner) */}
          {isOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(note)
                }}
                title="Edit"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={handleDelete}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Content preview */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {contentPreview}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer with reminder and created date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {/* Reminder date */}
            {note.reminder_date && (
              <div className="flex items-center gap-1" title="Reminder">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(note.reminder_date), 'MMM d, yyyy')}</span>
              </div>
            )}

            {/* Migrated indicator */}
            {note.migrated_from && (
              <Badge variant="outline" className="text-xs">
                Migrated
              </Badge>
            )}
          </div>

          {/* Created date */}
          <span className="text-xs">
            {format(new Date(note.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
