-- Migration: Add status field to customization_snapshots for 'open' snapshot state management
-- This enables undo operations during editing and finalization on publish

-- Add status enum type if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_snapshot_status') THEN
        CREATE TYPE enum_snapshot_status AS ENUM ('open', 'finalized');
    END IF;
END $$;

-- Add status column to customization_snapshots table
ALTER TABLE customization_snapshots 
ADD COLUMN IF NOT EXISTS status enum_snapshot_status DEFAULT 'open';

-- Add index for efficient querying of open snapshots
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_status 
ON customization_snapshots(status);

-- Add composite index for finding open snapshots by customization
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_customization_status 
ON customization_snapshots(customization_id, status);

-- Update existing snapshots to be 'finalized' by default (backward compatibility)
UPDATE customization_snapshots 
SET status = 'finalized' 
WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN customization_snapshots.status IS 'Status: open (allows undo during editing), finalized (locked for rollback after publish)';

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'customization_snapshots' AND column_name = 'status';