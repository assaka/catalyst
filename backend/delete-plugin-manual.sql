-- Manual plugin deletion without CASCADE
-- Replace 'YOUR_PLUGIN_ID' with the actual UUID
-- Replace 'your-plugin-slug' with the actual slug

-- Step 1: Find your plugin ID first
SELECT id, name, slug, version
FROM plugin_registry
WHERE slug = 'your-plugin-slug';
-- Copy the 'id' value and use it below

-- Step 2: Set the plugin ID variable (PostgreSQL)
-- Replace this with your actual plugin ID
\set plugin_id '\'YOUR_PLUGIN_ID\''

-- OR if running these one by one, replace $1 with the actual UUID in quotes:
-- Example: WHERE plugin_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- Step 3: Delete all related data (child tables first)

-- Delete admin scripts
DELETE FROM plugin_admin_scripts WHERE plugin_id = :plugin_id;

-- Delete admin pages
DELETE FROM plugin_admin_pages WHERE plugin_id = :plugin_id;

-- Delete plugin docs
DELETE FROM plugin_docs WHERE plugin_id = :plugin_id;

-- Delete plugin data (key-value storage)
DELETE FROM plugin_data WHERE plugin_id = :plugin_id;

-- Delete plugin dependencies
DELETE FROM plugin_dependencies WHERE plugin_id = :plugin_id;

-- Delete plugin migrations
DELETE FROM plugin_migrations WHERE plugin_id = :plugin_id;

-- Delete plugin controllers
DELETE FROM plugin_controllers WHERE plugin_id = :plugin_id;

-- Delete plugin entities
DELETE FROM plugin_entities WHERE plugin_id = :plugin_id;

-- Delete plugin widgets
DELETE FROM plugin_widgets WHERE plugin_id = :plugin_id;

-- Delete plugin scripts
DELETE FROM plugin_scripts WHERE plugin_id = :plugin_id;

-- Delete plugin events
DELETE FROM plugin_events WHERE plugin_id = :plugin_id;

-- Delete plugin hooks
DELETE FROM plugin_hooks WHERE plugin_id = :plugin_id;

-- Step 4: Finally delete the plugin itself (parent table)
DELETE FROM plugin_registry WHERE id = :plugin_id;

-- Verify deletion
SELECT COUNT(*) FROM plugin_registry WHERE id = :plugin_id;
-- Should return 0

-- Show remaining plugins
SELECT id, name, slug, version FROM plugin_registry ORDER BY created_at DESC;
