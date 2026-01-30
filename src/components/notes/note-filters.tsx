"use client"

import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface NoteFilters {
  tags: string[]
  priority: number | null
  visibility: 'all' | 'private' | 'shared'
  sortBy: 'date' | 'priority' | 'title'
}

interface NoteFiltersProps {
  filters: NoteFilters
  onFiltersChange: (filters: NoteFilters) => void
  availableTags: string[]
}

export function NoteFiltersComponent({ filters, onFiltersChange, availableTags }: NoteFiltersProps) {
  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      onFiltersChange({
        ...filters,
        tags: [...filters.tags, tag],
      })
    }
  }

  const removeTag = (tag: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter((t) => t !== tag),
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      tags: [],
      priority: null,
      visibility: 'all',
      sortBy: 'date',
    })
  }

  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.priority !== null ||
    filters.visibility !== 'all'

  return (
    <div className="space-y-4 p-4 border rounded-md bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tag Filter */}
        <div className="space-y-2">
          <Label htmlFor="tag-filter" className="text-xs">
            Filter by Tag
          </Label>
          {availableTags.length > 0 ? (
            <Select onValueChange={addTag}>
              <SelectTrigger id="tag-filter" className="h-9">
                <SelectValue placeholder="Select tag..." />
              </SelectTrigger>
              <SelectContent>
                {availableTags
                  .filter((tag) => !filters.tags.includes(tag))
                  .map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">No tags available</p>
          )}

          {/* Selected tags */}
          {filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label htmlFor="priority-filter" className="text-xs">
            Filter by Priority
          </Label>
          <Select
            value={filters.priority?.toString() || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                priority: value === 'all' ? null : parseInt(value),
              })
            }
          >
            <SelectTrigger id="priority-filter" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="3">High</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="1">Low</SelectItem>
              <SelectItem value="0">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visibility Filter */}
        <div className="space-y-2">
          <Label htmlFor="visibility-filter" className="text-xs">
            Show Notes
          </Label>
          <Select
            value={filters.visibility}
            onValueChange={(value: 'all' | 'private' | 'shared') =>
              onFiltersChange({
                ...filters,
                visibility: value,
              })
            }
          >
            <SelectTrigger id="visibility-filter" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All notes</SelectItem>
              <SelectItem value="private">My private notes</SelectItem>
              <SelectItem value="shared">Shared notes only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <Label htmlFor="sort-filter" className="text-xs">
            Sort By
          </Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value: 'date' | 'priority' | 'title') =>
              onFiltersChange({
                ...filters,
                sortBy: value,
              })
            }
          >
            <SelectTrigger id="sort-filter" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (newest first)</SelectItem>
              <SelectItem value="priority">Priority (high to low)</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
