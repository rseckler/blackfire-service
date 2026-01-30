"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { NoteEditor } from './note-editor'
import { Note } from '@/lib/services/notes-service'
import { useCreateNote, useUpdateNote, useDeleteNote, useNoteTags } from './hooks/use-notes'
import { Lock, Users, Calendar as CalendarIcon, X, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const noteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
  priority: z.number().min(0).max(3).optional(),
  reminderDate: z.date().optional().nullable(),
})

type NoteFormData = z.infer<typeof noteSchema>

interface NoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  note?: Note | null
}

export function NoteDialog({ open, onOpenChange, companyId, note }: NoteDialogProps) {
  const isEditing = !!note
  const [content, setContent] = useState(note?.content || '<p></p>')
  const [tags, setTags] = useState<string[]>(note?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    note?.reminder_date ? new Date(note.reminder_date) : undefined
  )

  const { data: existingTags = [] } = useNoteTags(companyId)
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      tags: note?.tags || [],
      isPrivate: note?.is_private !== undefined ? note.is_private : true,
      priority: note?.priority || 0,
      reminderDate: note?.reminder_date ? new Date(note.reminder_date) : null,
    },
  })

  const isPrivate = watch('isPrivate')
  const priority = watch('priority')

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      reset({
        title: note.title || '',
        content: note.content,
        tags: note.tags,
        isPrivate: note.is_private,
        priority: note.priority,
        reminderDate: note.reminder_date ? new Date(note.reminder_date) : null,
      })
      setContent(note.content)
      setTags(note.tags || [])
      setReminderDate(note.reminder_date ? new Date(note.reminder_date) : undefined)
    } else {
      reset({
        title: '',
        content: '<p></p>',
        tags: [],
        isPrivate: true,
        priority: 0,
        reminderDate: null,
      })
      setContent('<p></p>')
      setTags([])
      setReminderDate(undefined)
    }
  }, [note, reset])

  const onSubmit = async (data: NoteFormData) => {
    try {
      if (isEditing && note) {
        await updateNoteMutation.mutateAsync({
          noteId: note.id,
          updates: {
            title: data.title,
            content,
            tags,
            isPrivate: data.isPrivate,
            priority: data.priority,
            reminderDate: reminderDate ? reminderDate.toISOString() : null,
          },
        })
      } else {
        await createNoteMutation.mutateAsync({
          companyId,
          title: data.title,
          content,
          tags,
          isPrivate: data.isPrivate,
          priority: data.priority,
          reminderDate: reminderDate ? reminderDate.toISOString() : null,
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const handleDelete = async () => {
    if (!note) return
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNoteMutation.mutateAsync({ noteId: note.id, companyId })
        onOpenChange(false)
      } catch (error) {
        console.error('Error deleting note:', error)
      }
    }
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed]
      setTags(newTags)
      setValue('tags', newTags)
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove)
    setTags(newTags)
    setValue('tags', newTags)
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const isLoading = createNoteMutation.isPending || updateNoteMutation.isPending || deleteNoteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Note' : 'Create Note'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your note with rich formatting' : 'Add a new note with rich formatting'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Enter a title for your note"
              {...register('title')}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <NoteEditor
              content={content}
              onChange={(html) => {
                setContent(html)
                setValue('content', html)
              }}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </div>
            </Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Input
                id="tags"
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 p-0"
                list="existing-tags"
              />
              {existingTags.length > 0 && (
                <datalist id="existing-tags">
                  {existingTags.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Type a tag and press Enter to add. Use existing tags for consistency.
            </p>
          </div>

          {/* Priority and Privacy */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority?.toString()}
                onValueChange={(value) => setValue('priority', parseInt(value))}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Normal</SelectItem>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <Label htmlFor="privacy">Visibility</Label>
              <Select
                value={isPrivate ? 'private' : 'shared'}
                onValueChange={(value) => setValue('isPrivate', value === 'private')}
              >
                <SelectTrigger id="privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private (Only you)
                    </div>
                  </SelectItem>
                  <SelectItem value="shared">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Shared (All users)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reminder Date */}
          <div className="space-y-2">
            <Label>Reminder Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !reminderDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reminderDate ? format(reminderDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reminderDate}
                  onSelect={(date) => {
                    setReminderDate(date)
                    setValue('reminderDate', date || null)
                  }}
                  initialFocus
                />
                {reminderDate && (
                  <div className="p-2 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setReminderDate(undefined)
                        setValue('reminderDate', null)
                      }}
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
