-- Add all job-related pages to navigation
-- Structure:
-- Import & Export:
--   - Marketplace Hub
--   - Shopify Integration
--   - Akeneo Integration
--   - Import/Export Jobs (with analytics)
--
-- Advanced:
--   - Background Jobs (all jobs)
--   - Job Scheduler (cron jobs)

DO $$
DECLARE
  import_export_parent UUID;
  advanced_parent UUID;
BEGIN
  -- Get parent IDs by copying from existing items
  SELECT parent_key INTO import_export_parent
  FROM admin_navigation_registry
  WHERE key = 'shopify_integration'
  LIMIT 1;

  SELECT parent_key INTO advanced_parent
  FROM admin_navigation_registry
  WHERE key IN ('cache', 'monitoring', 'settings')
    AND parent_key IS NOT NULL
  LIMIT 1;

  RAISE NOTICE 'Import & Export parent: %', import_export_parent;
  RAISE NOTICE 'Advanced parent: %', advanced_parent;

  -- ============================================
  -- IMPORT & EXPORT SECTION
  -- ============================================

  -- 1. Marketplace Hub
  INSERT INTO admin_navigation_registry (
    id, key, label, icon, route, parent_key, order_position,
    is_core, is_visible, plugin_id, category, required_permission,
    description, badge_config, type, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'marketplace_hub', 'Marketplace Hub', 'ShoppingCart',
    '/admin/marketplace-hub', import_export_parent, 310,
    true, true, NULL, 'import_export', NULL,
    'Unified marketplace management with AI optimization',
    jsonb_build_object('text', 'New', 'variant', 'default', 'color', 'blue'),
    'new', NOW(), NOW()
  )
  ON CONFLICT (key) DO UPDATE SET
    label = EXCLUDED.label,
    route = EXCLUDED.route,
    parent_key = EXCLUDED.parent_key,
    order_position = EXCLUDED.order_position,
    updated_at = NOW();

  -- 2. Import/Export Jobs (with analytics)
  INSERT INTO admin_navigation_registry (
    id, key, label, icon, route, parent_key, order_position,
    is_core, is_visible, plugin_id, category, required_permission,
    description, badge_config, type, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'import_export_jobs', 'Jobs & Analytics', 'BarChart3',
    '/admin/import-export-jobs', import_export_parent, 350,
    true, true, NULL, 'import_export', NULL,
    'Monitor import/export jobs and view performance analytics',
    NULL, NULL, NOW(), NOW()
  )
  ON CONFLICT (key) DO UPDATE SET
    label = EXCLUDED.label,
    route = EXCLUDED.route,
    parent_key = EXCLUDED.parent_key,
    order_position = EXCLUDED.order_position,
    updated_at = NOW();

  -- Update Shopify order (stays at 330)
  UPDATE admin_navigation_registry
  SET type = NULL, updated_at = NOW()
  WHERE key = 'shopify_integration' AND type = 'coming_soon';

  -- ============================================
  -- ADVANCED SECTION
  -- ============================================

  -- 3. Background Jobs (all jobs monitoring)
  INSERT INTO admin_navigation_registry (
    id, key, label, icon, route, parent_key, order_position,
    is_core, is_visible, plugin_id, category, required_permission,
    description, badge_config, type, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'background_jobs', 'Background Jobs', 'Activity',
    '/admin/background-jobs', advanced_parent, 910,
    true, true, NULL, 'advanced', NULL,
    'Monitor all background job processing and queue status',
    NULL, NULL, NOW(), NOW()
  )
  ON CONFLICT (key) DO UPDATE SET
    label = EXCLUDED.label,
    route = EXCLUDED.route,
    parent_key = EXCLUDED.parent_key,
    order_position = EXCLUDED.order_position,
    updated_at = NOW();

  -- 4. Job Scheduler (cron jobs)
  INSERT INTO admin_navigation_registry (
    id, key, label, icon, route, parent_key, order_position,
    is_core, is_visible, plugin_id, category, required_permission,
    description, badge_config, type, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'job_scheduler', 'Job Scheduler', 'Clock',
    '/admin/job-scheduler', advanced_parent, 920,
    true, true, NULL, 'advanced', NULL,
    'Schedule recurring tasks and cron jobs (plugin support)',
    jsonb_build_object('text', 'New', 'variant', 'outline', 'color', 'purple'),
    'new', NOW(), NOW()
  )
  ON CONFLICT (key) DO UPDATE SET
    label = EXCLUDED.label,
    route = EXCLUDED.route,
    parent_key = EXCLUDED.parent_key,
    order_position = EXCLUDED.order_position,
    updated_at = NOW();

  RAISE NOTICE '✅ All job pages added to navigation';

END $$;

-- Verify Import & Export section
SELECT
  key,
  label,
  route,
  order_position,
  type,
  badge_config->>'text' as badge
FROM admin_navigation_registry
WHERE category = 'import_export'
ORDER BY order_position;

-- Expected:
-- marketplace_hub        | Marketplace Hub    | /admin/marketplace-hub    | 310 | new  | New
-- shopify_integration    | Shopify            | /admin/shopify-integration| 330 | NULL | NULL
-- akeneo_integration     | Akeneo PIM         | /admin/akeneo-integration | 340 | NULL | NULL
-- import_export_jobs     | Jobs & Analytics   | /admin/import-export-jobs | 350 | NULL | NULL

-- Verify Advanced section
SELECT
  key,
  label,
  route,
  order_position
FROM admin_navigation_registry
WHERE category = 'advanced'
ORDER BY order_position;

-- Should include:
-- background_jobs | Background Jobs | /admin/background-jobs | 910
-- job_scheduler   | Job Scheduler   | /admin/job-scheduler   | 920
