-- Add new columns to notes table for enhanced features
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 3),
ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS migrated_from TEXT;

-- Priority levels:
-- 0 = Normal (default)
-- 1 = Low
-- 2 = Medium
-- 3 = High/Important

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_reminder ON notes(reminder_date) WHERE reminder_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_user_entity ON notes(user_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_private ON notes(is_private);

-- Add comment for documentation
COMMENT ON COLUMN notes.is_private IS 'TRUE = only visible to note owner, FALSE = visible to all users';
COMMENT ON COLUMN notes.priority IS '0=Normal, 1=Low, 2=Medium, 3=High/Important';
COMMENT ON COLUMN notes.migrated_from IS 'Tracks migration source (e.g., Info1, Info2, Info3, Info4, Info5)';
COMMENT ON COLUMN notes.reminder_date IS 'Optional reminder date for follow-up';
