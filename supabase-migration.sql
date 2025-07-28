-- Migration: Add sort_order column to product_labels table
-- Run this in Supabase SQL Editor

-- Add sort_order column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_labels' AND column_name = 'sort_order'
    ) THEN
        -- Add the column
        ALTER TABLE product_labels ADD COLUMN sort_order INTEGER DEFAULT 0 NOT NULL;
        
        -- Create index for better performance when ordering
        CREATE INDEX IF NOT EXISTS idx_product_labels_sort_order ON product_labels(sort_order);
        
        -- Update existing labels to have sort_order = priority for consistency
        UPDATE product_labels SET sort_order = priority WHERE sort_order = 0;
        
        RAISE NOTICE 'Added sort_order column to product_labels table';
    ELSE
        RAISE NOTICE 'sort_order column already exists in product_labels table';
    END IF;
END $$;

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_labels' 
AND column_name IN ('sort_order', 'priority')
ORDER BY column_name;

-- Show current product labels with their sort_order values
SELECT 
    id,
    name,
    text,
    priority,
    sort_order,
    is_active,
    store_id
FROM product_labels 
ORDER BY sort_order ASC, priority DESC, name ASC;