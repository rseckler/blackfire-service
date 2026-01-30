# Notes System Testing Guide

This guide outlines the testing procedures for the newly implemented Notes System.

## Prerequisites

1. **Database Migration**: Run the migration to add new columns to the notes table:
   ```bash
   # Apply migration via Supabase dashboard or CLI
   # Migration file: supabase/migrations/20260130000002_add_notes_features.sql
   ```

2. **Environment Setup**: Ensure you have:
   - `.env.local` with valid Supabase credentials
   - At least one user account created
   - At least one company with Info1-Info5 fields in extra_data

3. **Data Migration** (Optional): Migrate existing Info1-Info5 fields to notes:
   ```bash
   npm run migrate:info-fields
   ```

## Test Checklist

### 1. UI Components Load Correctly

- [ ] Navigate to a company detail page (`/stocks/[id]`)
- [ ] Verify "Notes" section appears after the stock chart
- [ ] Check that the section loads without errors
- [ ] Verify empty state message if no notes exist

### 2. Create New Note

- [ ] Click "Add Note" button
- [ ] Dialog opens with form fields:
  - [ ] Title input (optional)
  - [ ] Rich-text editor with formatting toolbar
  - [ ] Tags input
  - [ ] Priority selector (Normal, Low, Medium, High)
  - [ ] Visibility toggle (Private/Shared)
  - [ ] Reminder date picker (optional)
- [ ] Test rich-text formatting:
  - [ ] Bold, Italic, Underline work
  - [ ] Text color picker works
  - [ ] Highlight (background color) works
  - [ ] Headings (H2, H3) work
  - [ ] Bullet and numbered lists work
  - [ ] Text alignment (left, center, right) works
  - [ ] Undo/Redo buttons work
- [ ] Add tags by typing and pressing Enter
- [ ] Remove tags by clicking X
- [ ] Select priority level
- [ ] Toggle visibility (Private/Shared)
- [ ] Set reminder date
- [ ] Click "Create" button
- [ ] Verify note appears in grid
- [ ] Check that note persists after page reload

### 3. View Notes

- [ ] Verify notes display in card grid (2-3 columns on desktop)
- [ ] Each card shows:
  - [ ] Title (or "Untitled Note")
  - [ ] Content preview (truncated)
  - [ ] Tags as colored badges
  - [ ] Priority indicator (icon with color)
  - [ ] Privacy icon (lock for private, users for shared)
  - [ ] Reminder date if set
  - [ ] "Migrated" badge if from Info1-Info5
  - [ ] Created date
  - [ ] Edit/Delete buttons (only for note owner)
- [ ] Verify shared notes from other users are visible
- [ ] Verify you cannot edit/delete notes from other users

### 4. Edit Note

- [ ] Click anywhere on a note card you own
- [ ] Dialog opens with existing note data pre-filled
- [ ] Edit title
- [ ] Modify content with rich formatting
- [ ] Add/remove tags
- [ ] Change priority
- [ ] Toggle visibility
- [ ] Update reminder date
- [ ] Click "Update" button
- [ ] Verify changes are saved and displayed
- [ ] Check that updated_at timestamp changes

### 5. Delete Note

- [ ] Click trash icon on a note card
- [ ] Confirm deletion in dialog
- [ ] Verify note is removed from grid
- [ ] Check that deletion persists after page reload

### 6. Filter & Sort Notes

- [ ] Test tag filter:
  - [ ] Select a tag from dropdown
  - [ ] Verify only notes with that tag are shown
  - [ ] Add multiple tags to filter
  - [ ] Remove tag filters
- [ ] Test priority filter:
  - [ ] Filter by High, Medium, Low, Normal
  - [ ] Verify correct notes are shown
- [ ] Test visibility filter:
  - [ ] "All notes" - shows private + shared
  - [ ] "My private notes" - shows only your private notes
  - [ ] "Shared notes only" - shows only shared notes
- [ ] Test sorting:
  - [ ] "Date (newest first)" - most recent first
  - [ ] "Priority (high to low)" - High → Medium → Low → Normal
  - [ ] "Title (A-Z)" - alphabetical order
- [ ] Click "Clear all" to reset filters

### 7. Migrated Notes from Info1-Info5

- [ ] Run migration script: `npm run migrate:info-fields`
- [ ] Check console output for success
- [ ] Navigate to a company that had Info1-Info5 fields
- [ ] Verify migrated notes appear with:
  - [ ] Title as "Info1", "Info2", etc.
  - [ ] Content wrapped in HTML paragraph
  - [ ] "Migrated" tag
  - [ ] Medium priority (2)
  - [ ] Shared visibility (is_private=false)
  - [ ] migrated_from field populated
- [ ] Edit a migrated note
- [ ] Verify it behaves like any other note after editing
- [ ] Check that Info1-Info5 no longer display in "Additional Information" card

### 8. Row-Level Security (RLS)

- [ ] Log in as User A
- [ ] Create a private note on Company X
- [ ] Log in as User B (different browser/incognito)
- [ ] Navigate to Company X
- [ ] Verify User A's private note is NOT visible
- [ ] Create a shared note as User B
- [ ] Switch back to User A
- [ ] Verify User B's shared note IS visible
- [ ] Verify User A cannot edit User B's note

### 9. Performance & Error Handling

- [ ] Create 20+ notes on a single company
- [ ] Verify grid loads without performance issues
- [ ] Test with very long note content (5000+ characters)
- [ ] Verify content saves and loads correctly
- [ ] Test with special characters in title/content
- [ ] Test with HTML injection attempts (should be sanitized)
- [ ] Disconnect from internet and try to create note
- [ ] Verify error handling and user feedback
- [ ] Reconnect and verify note creation works

### 10. Mobile Responsiveness

- [ ] Open company detail page on mobile viewport
- [ ] Verify notes section displays correctly
- [ ] Test creating note on mobile
- [ ] Verify rich-text toolbar is usable on mobile
- [ ] Test filters collapse/expand on mobile
- [ ] Verify card grid stacks vertically on mobile

### 11. API Endpoints

Test API routes manually or with curl:

```bash
# Get notes for a company
curl http://localhost:3000/api/notes?companyId=COMPANY_ID_HERE

# Create note
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"companyId":"COMPANY_ID","content":"<p>Test note</p>","title":"Test"}'

# Update note
curl -X PATCH http://localhost:3000/api/notes/NOTE_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title"}'

# Delete note
curl -X DELETE http://localhost:3000/api/notes/NOTE_ID

# Get tags
curl http://localhost:3000/api/notes/tags?companyId=COMPANY_ID
```

### 12. Database Integrity

Run SQL queries in Supabase dashboard:

```sql
-- Check migrated notes
SELECT * FROM notes WHERE migrated_from IS NOT NULL;

-- Check note ownership
SELECT user_id, COUNT(*) FROM notes GROUP BY user_id;

-- Check privacy distribution
SELECT is_private, COUNT(*) FROM notes GROUP BY is_private;

-- Check priority distribution
SELECT priority, COUNT(*) FROM notes GROUP BY priority;

-- Check notes with reminders
SELECT * FROM notes WHERE reminder_date IS NOT NULL;

-- Verify indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'notes';
```

## Known Issues & Limitations

1. **TipTap Bundle Size**: ~150KB, acceptable but monitor for performance
2. **No Real-time Collaboration**: Multiple users editing same note simultaneously not supported yet
3. **No Version History**: Edits overwrite previous content (future enhancement)
4. **No Attachments**: Cannot attach files to notes (future enhancement)

## Success Criteria

✅ All test checkboxes above are checked
✅ No console errors during normal use
✅ Notes persist across page reloads
✅ RLS policies prevent unauthorized access
✅ Migrated Info1-Info5 fields are fully editable notes
✅ Rich-text formatting works as expected
✅ Filters and sorting work correctly
✅ Mobile responsive

## Rollback Plan

If critical issues are found:

1. Revert company detail page changes:
   ```bash
   git checkout HEAD~1 src/app/(dashboard)/stocks/[id]/page.tsx
   ```

2. Remove CompanyNotesSection import

3. Notes in database remain intact, can be accessed later

4. Info1-Info5 data still exists in extra_data JSONB field

## Next Steps After Testing

1. Deploy to production VPS
2. Run migration script on production database
3. Monitor user feedback
4. Implement Phase 2 enhancements:
   - Full-text search across notes
   - Email reminders for reminder_date
   - Export notes to markdown/PDF
   - Note templates
   - Bulk operations
