-- Simple plugin deletion for Supabase SQL Editor
-- Copy-paste this entire script and replace the plugin_id value

-- STEP 1: Find your plugin ID
-- Uncomment and run this first:
-- SELECT id, name, slug FROM plugin_registry;

-- STEP 2: Copy the plugin ID from above and paste it below
-- Replace this with your actual plugin UUID:
DO $$
DECLARE
  plugin_id UUID := 'YOUR_PLUGIN_ID_HERE';  -- ⚠️ REPLACE THIS
BEGIN
  -- Delete from all child tables first
  DELETE FROM plugin_admin_scripts WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted admin scripts';

  DELETE FROM plugin_admin_pages WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted admin pages';

  DELETE FROM plugin_docs WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted docs';

  DELETE FROM plugin_data WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted plugin data';

  DELETE FROM plugin_dependencies WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted dependencies';

  DELETE FROM plugin_migrations WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted migrations';

  DELETE FROM plugin_controllers WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted controllers';

  DELETE FROM plugin_entities WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted entities';

  DELETE FROM plugin_widgets WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted widgets';

  DELETE FROM plugin_scripts WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted scripts';

  DELETE FROM plugin_events WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted events';

  DELETE FROM plugin_hooks WHERE plugin_id = plugin_id;
  RAISE NOTICE 'Deleted hooks';

  -- Finally delete the plugin itself
  DELETE FROM plugin_registry WHERE id = plugin_id;
  RAISE NOTICE 'Deleted plugin from registry';

  RAISE NOTICE '✅ Plugin deleted successfully!';
END $$;

-- STEP 3: Verify deletion
-- SELECT id, name, slug FROM plugin_registry;
