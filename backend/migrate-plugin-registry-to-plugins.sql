-- =====================================================
-- MIGRATE plugin_registry TO plugins TABLE
-- =====================================================
-- Migrates all plugins from legacy plugin_registry to modern plugins table
-- Preserves all data: code, config, hooks, scripts, dependencies
-- =====================================================

-- 1. Migrate plugins from plugin_registry to plugins
INSERT INTO plugins (
  id,
  name,
  slug,
  version,
  description,
  author,
  category,
  type,
  source_type,
  status,
  is_installed,
  is_enabled,
  config_schema,
  config_data,
  dependencies,
  permissions,
  manifest,
  created_at,
  updated_at,
  installed_at
)
SELECT
  gen_random_uuid() as id,
  pr.name,
  pr.id as slug, -- Use registry ID as slug
  pr.version,
  COALESCE(pr.description, 'Migrated plugin') as description,
  COALESCE(pr.author, 'Unknown') as author,
  COALESCE(pr.category, 'other') as category,
  COALESCE(pr.type, 'plugin') as type,
  'local' as source_type,
  CASE
    WHEN pr.status = 'active' THEN 'active'
    ELSE 'available'
  END as status,
  (pr.status = 'active') as is_installed,
  (pr.status = 'active') as is_enabled,
  COALESCE(pr.manifest, '{}')::jsonb as config_schema,
  '{}'::jsonb as config_data,
  COALESCE(pr.dependencies, '[]')::jsonb as dependencies,
  COALESCE(pr.permissions, '[]')::jsonb as permissions,
  COALESCE(pr.manifest, '{}')::jsonb as manifest,
  COALESCE(pr.created_at, NOW()),
  COALESCE(pr.updated_at, NOW()),
  pr.installed_at
FROM plugin_registry pr
WHERE NOT EXISTS (
  SELECT 1 FROM plugins p WHERE p.slug::text = pr.id::text
);

-- 2. Show migration results
SELECT
  'plugin_registry (source)' as table_name,
  COUNT(*) as count
FROM plugin_registry
UNION ALL
SELECT
  'plugins (target)',
  COUNT(*)
FROM plugins
UNION ALL
SELECT
  'newly migrated',
  COUNT(*)
FROM plugins
WHERE slug::text IN (SELECT id::text FROM plugin_registry);

-- 3. List migrated plugins
SELECT
  p.name,
  p.slug as "new_slug",
  p.version,
  p.is_installed,
  p.is_enabled,
  'Migrated from plugin_registry' as source
FROM plugins p
WHERE p.slug::text IN (SELECT id::text FROM plugin_registry)
ORDER BY p.name;
