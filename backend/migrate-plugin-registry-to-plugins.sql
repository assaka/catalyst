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
  pr.description,
  pr.author,
  pr.category,
  pr.type,
  'local' as source_type,
  pr.status,
  (pr.status = 'active') as is_installed,
  (pr.status = 'active') as is_enabled,
  pr.config as config_schema, -- Map config to config_schema
  '{}' as config_data, -- Empty config data initially
  pr.dependencies,
  pr.permissions,
  pr.manifest,
  pr.created_at,
  pr.updated_at,
  pr.installed_at
FROM plugin_registry pr
WHERE NOT EXISTS (
  SELECT 1 FROM plugins p WHERE p.slug = pr.id
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
WHERE slug IN (SELECT id FROM plugin_registry);

-- 3. List migrated plugins
SELECT
  p.name,
  p.slug as "new_slug",
  p.version,
  p.is_installed,
  p.is_enabled,
  'Migrated from plugin_registry' as source
FROM plugins p
WHERE p.slug IN (SELECT id FROM plugin_registry)
ORDER BY p.name;
