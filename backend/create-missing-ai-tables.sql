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

-- 4. Verify what exists
SELECT
  'ai_usage_logs' as table_name,
  COUNT(*) as count,
  'Track AI operations' as description
FROM ai_usage_logs
UNION ALL
SELECT
  'credit_usage',
  COUNT(*),
  'Track credit deductions (existing)'
FROM credit_usage
UNION ALL
SELECT
  'plugins',
  COUNT(*),
  'Your installed plugins (existing)'
FROM plugins
UNION ALL
SELECT
  'plugin_marketplace',
  COUNT(*),
  'Marketplace plugins'
FROM plugin_marketplace;
