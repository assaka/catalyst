-- =====================================================
-- MINIMAL AI STUDIO TABLES CREATION
-- Only creates what's missing (plugins table already exists)
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. AI Usage Logs - Track all AI API calls
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL,
  model_used VARCHAR(100),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);

-- 2. Update existing credit_usage constraint for AI types
ALTER TABLE credit_usage DROP CONSTRAINT IF EXISTS credit_usage_usage_type_check;

ALTER TABLE credit_usage ADD CONSTRAINT credit_usage_usage_type_check CHECK (
  usage_type IN (
    'akeneo_schedule',
    'akeneo_manual',
    'marketplace_export',
    'shopify_sync',
    'ai_description',
    'ai_plugin_generation',
    'ai_plugin_modification',
    'ai_translation',
    'ai_layout',
    'ai_code_patch',
    'ai_chat',
    'other'
  )
);

-- 3. Plugin Marketplace (if doesn't exist)
CREATE TABLE IF NOT EXISTS plugin_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  long_description TEXT,
  author_id UUID REFERENCES users(id),
  author_name VARCHAR(255),
  category VARCHAR(100),
  pricing_model VARCHAR(50) NOT NULL DEFAULT 'free',
  base_price DECIMAL(10, 2) DEFAULT 0.00,
  monthly_price DECIMAL(10, 2),
  yearly_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  license_type VARCHAR(50) DEFAULT 'per_store',
  trial_days INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  downloads INTEGER DEFAULT 0,
  active_installations INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  icon_url TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  plugin_structure JSONB,
  dependencies JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_plugin_marketplace_slug ON plugin_marketplace(slug);
CREATE INDEX IF NOT EXISTS idx_plugin_marketplace_status ON plugin_marketplace(status);

-- 4. Plugin Hooks (normalized)
CREATE TABLE IF NOT EXISTS plugin_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  hook_name VARCHAR(255) NOT NULL,
  hook_type VARCHAR(20) NOT NULL DEFAULT 'filter',
  handler_function TEXT NOT NULL,
  priority INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugin_hooks_plugin ON plugin_hooks(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_hooks_name ON plugin_hooks(hook_name);

-- 5. Plugin Events (normalized)
CREATE TABLE IF NOT EXISTS plugin_event_listeners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  listener_function TEXT NOT NULL,
  priority INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugin_event_listeners_plugin ON plugin_event_listeners(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_event_listeners_name ON plugin_event_listeners(event_name);

-- 6. Plugin Widgets (for slot editor)
CREATE TABLE IF NOT EXISTS plugin_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  widget_id VARCHAR(255) NOT NULL,
  widget_name VARCHAR(255) NOT NULL,
  description TEXT,
  component_code TEXT NOT NULL,
  default_config JSONB DEFAULT '{}'::jsonb,
  category VARCHAR(100),
  icon VARCHAR(50),
  preview_image TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_plugin_widget_id UNIQUE (plugin_id, widget_id)
);

CREATE INDEX IF NOT EXISTS idx_plugin_widgets_plugin ON plugin_widgets(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_widgets_widget_id ON plugin_widgets(widget_id);

-- 7. Plugin Admin Pages (custom admin pages)
CREATE TABLE IF NOT EXISTS plugin_admin_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  page_key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  route VARCHAR(255) NOT NULL,
  component_code TEXT NOT NULL,
  parent_key VARCHAR(100),
  order_position INTEGER DEFAULT 100,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_plugin_admin_page_key UNIQUE (plugin_id, page_key)
);

CREATE INDEX IF NOT EXISTS idx_plugin_admin_pages_plugin ON plugin_admin_pages(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_admin_pages_route ON plugin_admin_pages(route);

-- 8. Plugin Routes (API endpoints)
CREATE TABLE IF NOT EXISTS plugin_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  handler_function TEXT NOT NULL,
  middleware JSONB DEFAULT '[]'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_plugin_route_path UNIQUE (plugin_id, method, path)
);

CREATE INDEX IF NOT EXISTS idx_plugin_routes_plugin ON plugin_routes(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_routes_path ON plugin_routes(path);

-- 9. Plugin Data (key-value storage)
CREATE TABLE IF NOT EXISTS plugin_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  data_key VARCHAR(255) NOT NULL,
  data_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_plugin_data_key UNIQUE (plugin_id, data_key)
);

CREATE INDEX IF NOT EXISTS idx_plugin_data_plugin ON plugin_data(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_data_key ON plugin_data(data_key);

-- 10. Verify all tables exist and show counts
SELECT
  'ai_usage_logs' as table_name,
  COUNT(*) as count,
  'Track AI operations' as description
FROM ai_usage_logs
UNION ALL
SELECT 'credit_usage', COUNT(*), 'Credit tracking (existing)'
FROM credit_usage
UNION ALL
SELECT 'plugins', COUNT(*), 'Installed plugins (existing)'
FROM plugins
UNION ALL
SELECT 'plugin_marketplace', COUNT(*), 'Marketplace plugins'
FROM plugin_marketplace
UNION ALL
SELECT 'plugin_hooks', COUNT(*), 'Plugin hook registrations'
FROM plugin_hooks
UNION ALL
SELECT 'plugin_event_listeners', COUNT(*), 'Plugin event listeners'
FROM plugin_event_listeners
UNION ALL
SELECT 'plugin_widgets', COUNT(*), 'Plugin widgets for slot editor'
FROM plugin_widgets
UNION ALL
SELECT 'plugin_admin_pages', COUNT(*), 'Plugin admin pages'
FROM plugin_admin_pages
UNION ALL
SELECT 'plugin_routes', COUNT(*), 'Plugin API routes'
FROM plugin_routes
UNION ALL
SELECT 'plugin_data', COUNT(*), 'Plugin key-value storage'
FROM plugin_data
ORDER BY table_name;
