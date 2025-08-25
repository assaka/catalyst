-- Remove obsolete code storage columns from customization_snapshots table
-- Since we now store only optimized line diffs, full code storage is no longer needed

-- Remove code_before and code_after columns that are causing NOT NULL constraint issues
ALTER TABLE customization_snapshots 
DROP COLUMN IF EXISTS code_before,
DROP COLUMN IF EXISTS code_after;

-- Add comment to document the optimization
COMMENT ON TABLE customization_snapshots IS 'Optimized storage using line diffs instead of full code - ~98% storage reduction';