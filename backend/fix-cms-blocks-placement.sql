-- Fix CMS blocks placement field to support JSON arrays properly
-- The field was created as VARCHAR(255) but needs to be JSONB for proper array storage

-- First, let's check current state
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'cms_blocks' AND column_name = 'placement';

-- Step 1: Remove the existing default value
ALTER TABLE cms_blocks ALTER COLUMN placement DROP DEFAULT;

-- Step 2: Update the placement column to JSONB type to handle arrays properly
ALTER TABLE cms_blocks 
ALTER COLUMN placement TYPE JSONB 
USING 
  CASE 
    WHEN placement IS NULL THEN '["content"]'::jsonb
    WHEN placement::text ~ '^\[.*\]$' THEN placement::jsonb
    WHEN placement = '' THEN '["content"]'::jsonb
    ELSE ('["' || placement || '"]')::jsonb
  END;

-- Step 3: Set new default value
ALTER TABLE cms_blocks 
ALTER COLUMN placement SET DEFAULT '["content"]'::jsonb;

-- Verify the change
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cms_blocks' AND column_name = 'placement';

-- Show some sample data to verify conversion
SELECT id, title, placement 
FROM cms_blocks 
LIMIT 5;