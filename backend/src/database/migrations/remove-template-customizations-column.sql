-- Remove template_customizations column from stores table
-- This column was added in add-store-publishing-fields.sql but is no longer used

-- First, remove the comment if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'template_customizations'
    ) THEN
        -- Remove the column
        ALTER TABLE stores DROP COLUMN IF EXISTS template_customizations;
        
        RAISE NOTICE 'Removed template_customizations column from stores table';
    ELSE
        RAISE NOTICE 'template_customizations column does not exist in stores table';
    END IF;
END $$;