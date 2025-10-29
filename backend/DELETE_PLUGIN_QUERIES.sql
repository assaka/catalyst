-- ========================================
-- DELETE A SINGLE PLUGIN - MANUAL QUERIES
-- ========================================
-- Copy these queries one by one into Supabase SQL Editor
-- Replace YOUR_PLUGIN_ID with the actual UUID

-- STEP 1: Find your plugin ID (run this first)
SELECT id, name, slug, version FROM plugin_registry;

-- Copy the ID from above, then replace YOUR_PLUGIN_ID below with it
-- Example: '123e4567-e89b-12d3-a456-426614174000'

-- STEP 2: Delete all related data (run these in order)

DELETE FROM plugin_admin_scripts WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_admin_pages WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_docs WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_data WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_dependencies WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_migrations WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_controllers WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_entities WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_widgets WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_scripts WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_events WHERE plugin_id = 'YOUR_PLUGIN_ID';
DELETE FROM plugin_hooks WHERE plugin_id = 'YOUR_PLUGIN_ID';

-- STEP 3: Finally delete the plugin itself
DELETE FROM plugin_registry WHERE id = 'YOUR_PLUGIN_ID';

-- STEP 4: Verify it's gone
SELECT id, name, slug FROM plugin_registry;

-- ========================================
-- ALTERNATIVE: Delete by slug instead of ID
-- ========================================

-- Find the plugin
SELECT id, name, slug FROM plugin_registry WHERE slug = 'your-plugin-slug';

-- Then use the ID in the queries above, OR use these queries with slug:

DELETE FROM plugin_admin_scripts WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_admin_pages WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_docs WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_data WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_dependencies WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_migrations WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_controllers WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_entities WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_widgets WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_scripts WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_events WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_hooks WHERE plugin_id IN (SELECT id FROM plugin_registry WHERE slug = 'your-plugin-slug');
DELETE FROM plugin_registry WHERE slug = 'your-plugin-slug';
