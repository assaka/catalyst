-- =====================================================
-- Migration: Make UI Labels Store-Specific
-- =====================================================
-- This migration adds store_id to the translations table
-- and updates all existing translations to be scoped to stores
-- =====================================================

-- Step 1: Add store_id column to translations table (nullable first)
ALTER TABLE translations
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

-- Step 2: For existing translations, assign them to all stores
-- (Each store gets its own copy of existing UI labels)
DO $$
DECLARE
    store_record RECORD;
    translation_record RECORD;
BEGIN
    -- Loop through all stores
    FOR store_record IN SELECT id FROM stores
    LOOP
        -- Loop through all existing translations (where store_id is null)
        FOR translation_record IN
            SELECT id, key, language_code, value, category, type
            FROM translations
            WHERE store_id IS NULL
        LOOP
            -- Create a copy for this store (if not already exists)
            INSERT INTO translations (id, store_id, key, language_code, value, category, type, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                store_record.id,
                translation_record.key,
                translation_record.language_code,
                translation_record.value,
                translation_record.category,
                translation_record.type,
                NOW(),
                NOW()
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Step 3: Delete old global translations (where store_id is null)
DELETE FROM translations WHERE store_id IS NULL;

-- Step 4: Make store_id NOT NULL
ALTER TABLE translations
ALTER COLUMN store_id SET NOT NULL;

-- Step 5: Drop old unique index
DROP INDEX IF EXISTS translations_key_language_unique;

-- Step 6: Create new unique index with store_id
CREATE UNIQUE INDEX IF NOT EXISTS translations_store_key_language_unique
ON translations(store_id, key, language_code);

-- Step 7: Create index on store_id for better query performance
CREATE INDEX IF NOT EXISTS translations_store_id_index
ON translations(store_id);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check that all translations now have store_id
SELECT COUNT(*) as translations_with_store_id
FROM translations
WHERE store_id IS NOT NULL;

-- Check that no translations are without store_id
SELECT COUNT(*) as translations_without_store_id
FROM translations
WHERE store_id IS NULL;

-- Show distribution of translations per store
SELECT
    s.name as store_name,
    COUNT(t.id) as translation_count,
    COUNT(DISTINCT t.language_code) as languages_count
FROM stores s
LEFT JOIN translations t ON t.store_id = s.id
GROUP BY s.id, s.name
ORDER BY translation_count DESC;
