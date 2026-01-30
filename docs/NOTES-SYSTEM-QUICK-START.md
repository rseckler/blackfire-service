# Notes System - Quick Start Guide

**5-Minute Setup & Usage Guide**

## Setup (First Time)

### 1. Apply Database Migration

```bash
# Option A: Via Supabase Dashboard
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Paste contents of supabase/migrations/20260130000002_add_notes_features.sql
# 3. Click "Run"

# Option B: Via Supabase CLI
supabase db push
```

### 2. Migrate Existing Info Fields (Optional)

If you have companies with Info1-Info5 fields:

```bash
npm run migrate:info-fields
```

This converts Info1-Info5 to editable notes. Watch console output for results.

### 3. Start Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000/stocks/[any-company-id]`

## Using the Notes System

### Create a Note

1. Click **"Add Note"** button in Notes section
2. Fill in:
   - **Title** (optional) - e.g., "Investment Thesis"
   - **Content** (required) - Use formatting toolbar
   - **Tags** - Type and press Enter (e.g., "Research", "Risk")
   - **Priority** - Normal / Low / Medium / High
   - **Visibility** - Private (only you) / Shared (all users)
   - **Reminder** - Optional follow-up date
3. Click **"Create"**

### Edit a Note

1. Click anywhere on a note card
2. Modify any fields
3. Click **"Update"**

### Delete a Note

1. Click trash icon on note card
2. Confirm deletion

### Filter Notes

Use filter controls above the grid:
- **Tags** - Show only notes with specific tags
- **Priority** - Filter by importance level
- **Visibility** - Show all / private only / shared only
- **Sort** - By date, priority, or title

Click **"Clear all"** to reset filters.

## Rich-Text Formatting

Toolbar buttons (hover for tooltips):

| Button | Function |
|--------|----------|
| **B** | Bold text |
| _I_ | Italic text |
| <u>U</u> | Underline text |
| H2, H3 | Headings |
| • | Bullet list |
| 1. | Numbered list |
| 🎨 | Text color |
| 🖍️ | Highlight (background) |
| ⬅️ ➡️ | Text alignment |
| ↶ ↷ | Undo / Redo |

## Privacy Modes

### Private Note (🔒)
- Only visible to you
- Cannot be edited by others
- Use for personal research, drafts

### Shared Note (👥)
- Visible to all users
- Only you can edit/delete
- Use for team insights, public research

## Priority Levels

- **Normal** (0) - Default, no indicator
- **Low** (1) - Blue arrow down ↓
- **Medium** (2) - Yellow warning ⚠️
- **High** (3) - Red arrow up ↑

## Tags Best Practices

Suggested tags:
- `Research` - Due diligence, analysis
- `Trade Idea` - Investment opportunities
- `Risk` - Risks and concerns
- `Catalyst` - Upcoming events
- `Technical` - Chart analysis
- `Fundamental` - Financial metrics
- `News` - Recent developments
- `Migrated` - Auto-added for Info1-Info5 migration

## Keyboard Shortcuts

In editor:
- `Ctrl+B` / `Cmd+B` - Bold
- `Ctrl+I` / `Cmd+I` - Italic
- `Ctrl+U` / `Cmd+U` - Underline
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - Redo

In tag input:
- `Enter` - Add tag
- `Backspace` (empty input) - Remove last tag

## API Endpoints (for developers)

```bash
# Get company notes
GET /api/notes?companyId=COMPANY_ID

# Create note
POST /api/notes
Body: { companyId, content, title?, tags?, isPrivate?, priority?, reminderDate? }

# Update note
PATCH /api/notes/NOTE_ID
Body: { title?, content?, tags?, isPrivate?, priority?, reminderDate? }

# Delete note
DELETE /api/notes/NOTE_ID

# Get tags
GET /api/notes/tags?companyId=COMPANY_ID
```

## Troubleshooting

### Notes not loading

1. Check browser console for errors
2. Verify you're logged in (check user menu)
3. Refresh page
4. Check Supabase connection in `.env.local`

### Cannot edit a note

- Only note owners can edit
- Shared notes are read-only for other users
- Check if you're the creator (user_id match)

### Migration script fails

```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Ensure you have:
# - NEXT_PUBLIC_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY

# Check at least one user exists in auth.users table
```

### Rich-text formatting not working

- Clear browser cache
- Check TipTap extensions loaded (console)
- Verify `@tiptap/*` packages installed:
  ```bash
  npm list @tiptap/react
  ```

## File Locations

Quick reference for code navigation:

```
Components:
  src/components/notes/company-notes-section.tsx  (Main entry point)
  src/components/notes/note-dialog.tsx            (Create/Edit modal)
  src/components/notes/note-editor.tsx            (Rich-text editor)

API:
  src/app/api/notes/route.ts                      (GET/POST)
  src/app/api/notes/[id]/route.ts                 (PATCH/DELETE)

Services:
  src/lib/services/notes-service.ts               (Business logic)

Hooks:
  src/components/notes/hooks/use-notes.ts         (React Query)

Database:
  supabase/migrations/20260130000002_add_notes_features.sql

Scripts:
  scripts/migrate-info-fields.ts                  (Info1-5 migration)
```

## Need Help?

- **Testing Guide**: `docs/NOTES-SYSTEM-TESTING.md`
- **Full Documentation**: `docs/NOTES-SYSTEM-IMPLEMENTATION.md`
- **Project Instructions**: `CLAUDE.md`

## Quick Tips

💡 **Use tags consistently** - Start with a few core tags, reuse them
💡 **Set reminders** - For earnings dates, follow-up research
💡 **Mark priority** - High priority for actionable insights
💡 **Private by default** - Keep drafts private, share when ready
💡 **Format for readability** - Use headings, lists, highlights
💡 **Search with filters** - Combine tag + priority for precise results

## What's Next?

After notes system is live:
- Gather user feedback
- Monitor usage patterns
- Prioritize Phase 2 features:
  - Full-text search
  - Export to PDF/Markdown
  - Note templates
  - Email reminders
  - Attachments

---

**Implementation Date**: 2026-01-30
**Status**: ✅ Ready for Use
**Version**: 1.0.0
