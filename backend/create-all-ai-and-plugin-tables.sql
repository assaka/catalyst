-- =====================================================
-- COMPLETE AI STUDIO & PLUGIN SYSTEM TABLES
-- Run this SQL in Supabase SQL Editor
-- =====================================================
-- Creates all tables needed for:
-- - AI Studio (usage tracking, credits)
-- - Plugin Marketplace
-- - Plugin Management
-- =====================================================

-- =====================================================
-- 1. AI STUDIO TABLES
-- =====================================================

-- AI Usage Logs - Track all AI API calls
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

-- =====================================================
-- Update existing credit_usage table with AI usage types
-- =====================================================

-- Add new AI usage types to existing constraint
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

-- =====================================================
-- 2. PLUGIN MARKETPLACE TABLES
-- =====================================================

-- Plugin Marketplace - Central marketplace for all plugins
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

  -- Pricing & Monetization
  pricing_model VARCHAR(50) NOT NULL DEFAULT 'free',
  base_price DECIMAL(10, 2) DEFAULT 0.00,
  monthly_price DECIMAL(10, 2),
  yearly_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  license_type VARCHAR(50) DEFAULT 'per_store',
  trial_days INTEGER DEFAULT 0,

  -- Marketplace Metadata
  status VARCHAR(50) DEFAULT 'pending',
  downloads INTEGER DEFAULT 0,
  active_installations INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,

  -- Media
  icon_url TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,

  -- Plugin Structure (stored as JSON)
  plugin_structure JSONB,
  dependencies JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT chk_pricing_model CHECK (pricing_model IN ('free', 'one_time', 'subscription', 'freemium', 'custom')),
  CONSTRAINT chk_license_type CHECK (license_type IN ('per_store', 'unlimited', 'per_user')),
  CONSTRAINT chk_marketplace_status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
);

CREATE INDEX IF NOT EXISTS idx_plugin_marketplace_slug ON plugin_marketplace(slug);
CREATE INDEX IF NOT EXISTS idx_plugin_marketplace_category ON plugin_marketplace(category);
CREATE INDEX IF NOT EXISTS idx_plugin_marketplace_status ON plugin_marketplace(status);
CREATE INDEX IF NOT EXISTS idx_plugin_marketplace_author ON plugin_marketplace(author_id);

-- Plugin Versions - Version history
CREATE TABLE IF NOT EXISTS plugin_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_plugin_id UUID NOT NULL REFERENCES plugin_marketplace(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  changelog TEXT,
  plugin_structure JSONB,
  is_current BOOLEAN DEFAULT false,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_plugin_version UNIQUE (marketplace_plugin_id, version)
);

CREATE INDEX IF NOT EXISTS idx_plugin_versions_marketplace ON plugin_versions(marketplace_plugin_id);

-- Plugin Licenses - Track purchases
CREATE TABLE IF NOT EXISTS plugin_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_plugin_id UUID NOT NULL REFERENCES plugin_marketplace(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  license_key VARCHAR(255) NOT NULL UNIQUE,
  license_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  amount_paid DECIMAL(10, 2),
  currency VARCHAR(3),
  billing_interval VARCHAR(20),
  subscription_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plugin_licenses_marketplace ON plugin_licenses(marketplace_plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_licenses_tenant ON plugin_licenses(tenant_id);

-- =====================================================
-- 3. PLUGINS TABLE (already exists - skip creation)
-- =====================================================

-- Note: plugins table already exists with this structure:
-- - Uses config_schema (not plugin_structure)
-- - Has config_data, install_path, health check fields
-- - Has is_installed, is_enabled booleans
-- - Status values: 'available', 'installed', 'active', etc.
-- - Source types: 'local', 'github', 'marketplace'
--
-- If plugins table doesn't exist, run this:
-- (But it should already exist based on your schema)

-- CREATE TABLE IF NOT EXISTS plugins (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name VARCHAR(255) NOT NULL,
--   slug VARCHAR(255) NOT NULL UNIQUE,
--   version VARCHAR(50) NOT NULL,
--   description TEXT,
--   author VARCHAR(255),
--   category VARCHAR(100),
--   type VARCHAR(50) DEFAULT 'plugin',
--   source_type VARCHAR(50) DEFAULT 'local',
--   source_url TEXT,
--   install_path VARCHAR(500),
--   status VARCHAR(50) DEFAULT 'available',
--   is_installed BOOLEAN DEFAULT false,
--   is_enabled BOOLEAN DEFAULT false,
--   config_schema JSONB,
--   config_data JSONB DEFAULT '{}'::jsonb,
--   dependencies JSONB DEFAULT '[]'::jsonb,
--   permissions JSONB DEFAULT '[]'::jsonb,
--   manifest JSONB,
--   installation_log TEXT,
--   last_health_check TIMESTAMP WITH TIME ZONE,
--   health_status VARCHAR(50),
--   installed_at TIMESTAMP WITH TIME ZONE,
--   enabled_at TIMESTAMP WITH TIME ZONE,
--   disabled_at TIMESTAMP WITH TIME ZONE,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- =====================================================
-- VERIFY TABLES CREATED
-- =====================================================

SELECT 'ai_usage_logs' as table_name, COUNT(*) as count FROM ai_usage_logs
UNION ALL
SELECT 'credit_usage', COUNT(*) FROM credit_usage
UNION ALL
SELECT 'plugin_marketplace', COUNT(*) FROM plugin_marketplace
UNION ALL
SELECT 'plugin_versions', COUNT(*) FROM plugin_versions
UNION ALL
SELECT 'plugin_licenses', COUNT(*) FROM plugin_licenses
UNION ALL
SELECT 'plugins', COUNT(*) FROM plugins;
