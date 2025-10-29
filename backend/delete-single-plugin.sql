-- Delete a single plugin safely
-- Replace 'PLUGIN_ID_HERE' with the actual plugin UUID or slug

-- Option 1: Delete by plugin ID (UUID)
DELETE FROM plugin_registry
WHERE id = 'PLUGIN_ID_HERE';

-- Option 2: Delete by plugin slug
DELETE FROM plugin_registry
WHERE slug = 'your-plugin-slug';

-- The CASCADE foreign key constraints will automatically delete:
-- - All events in plugin_events
-- - All hooks in plugin_hooks
-- - All scripts in plugin_scripts
-- - All entities in plugin_entities
-- - All controllers in plugin_controllers
-- - All migrations in plugin_migrations
-- - All docs in plugin_docs
-- - All admin pages in plugin_admin_pages

-- Example:
-- DELETE FROM plugin_registry WHERE slug = 'cart-hamid';
-- DELETE FROM plugin_registry WHERE id = '123e4567-e89b-12d3-a456-426614174000';
