-- ============================================
-- MASTER DATABASE SCHEMA
-- Platform-level tables for multi-tenant architecture
-- ============================================

-- ============================================
-- 1. USERS TABLE (Agency users only)
-- Identical structure to tenant users table
-- Only contains rows where account_type = 'agency'
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login TIMESTAMP,
  role VARCHAR(50) DEFAULT 'store_owner' CHECK (role IN ('admin', 'store_owner')),
  account_type VARCHAR(50) DEFAULT 'agency' CHECK (account_type = 'agency'),
  credits DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint on email + role (same as tenant)
CREATE UNIQUE INDEX IF NOT EXISTS unique_email_role ON users(email, role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- ============================================
-- 2. STORES TABLE (Minimal registry)
-- Only contains: id, user_id, slug, status, is_active, created_at
-- Full store data (name, settings, etc.) in tenant DB
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_database' CHECK (status IN (
    'pending_database',  -- Waiting for DB connection
    'provisioning',      -- Creating tenant DB
    'active',           -- Fully operational
    'suspended',        -- Temporarily disabled
    'inactive'          -- Permanently disabled
  )),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active) WHERE is_active = true;

-- ============================================
-- 3. STORE_DATABASES TABLE
-- Encrypted tenant database connection credentials
-- ============================================
CREATE TABLE IF NOT EXISTS store_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID UNIQUE NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  database_type VARCHAR(50) NOT NULL CHECK (database_type IN ('supabase', 'postgresql', 'mysql')),

  -- Encrypted credentials (AES-256)
  connection_string_encrypted TEXT NOT NULL,

  -- Connection details (non-sensitive)
  host VARCHAR(255),
  port INTEGER,
  database_name VARCHAR(255) DEFAULT 'postgres',

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_connection_test TIMESTAMP,
  connection_status VARCHAR(50) DEFAULT 'pending' CHECK (connection_status IN (
    'pending',
    'connected',
    'failed',
    'timeout'
  )),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_databases_store_id ON store_databases(store_id);
CREATE INDEX IF NOT EXISTS idx_store_databases_active ON store_databases(is_active) WHERE is_active = true;

-- ============================================
-- 4. STORE_HOSTNAMES TABLE
-- Maps hostnames to stores for fast resolution
-- ============================================
CREATE TABLE IF NOT EXISTS store_hostnames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  hostname VARCHAR(255) UNIQUE NOT NULL, -- 'myshop.catalyst.com'
  slug VARCHAR(255) NOT NULL,            -- 'myshop'
  is_primary BOOLEAN DEFAULT true,
  is_custom_domain BOOLEAN DEFAULT false,
  ssl_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_hostname ON store_hostnames(hostname);
CREATE INDEX IF NOT EXISTS idx_store_hostnames_store_id ON store_hostnames(store_id);
CREATE INDEX IF NOT EXISTS idx_store_hostnames_slug ON store_hostnames(slug);
CREATE INDEX IF NOT EXISTS idx_store_hostnames_primary ON store_hostnames(store_id, is_primary) WHERE is_primary = true;

-- ============================================
-- 5. SUBSCRIPTIONS TABLE
-- Store subscription plans and billing
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID UNIQUE NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Plan details
  plan_name VARCHAR(50) NOT NULL CHECK (plan_name IN ('free', 'starter', 'professional', 'enterprise')),
  status VARCHAR(50) NOT NULL DEFAULT 'trial' CHECK (status IN (
    'trial',
    'active',
    'cancelled',
    'expired',
    'suspended'
  )),

  -- Pricing
  price_monthly DECIMAL(10, 2),
  price_annual DECIMAL(10, 2),
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'annual')),

  -- Resource limits
  max_products INTEGER,
  max_orders_per_month INTEGER,
  max_storage_gb INTEGER,
  max_api_calls_per_month INTEGER,

  -- Dates
  started_at TIMESTAMP DEFAULT NOW(),
  trial_ends_at TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_name);

-- ============================================
-- 6. CREDIT_BALANCES TABLE
-- Current credit balance per store (source of truth)
-- ============================================
CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID UNIQUE NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  reserved_balance DECIMAL(10, 2) DEFAULT 0.00 CHECK (reserved_balance >= 0), -- For pending transactions
  lifetime_purchased DECIMAL(10, 2) DEFAULT 0.00,
  lifetime_spent DECIMAL(10, 2) DEFAULT 0.00,
  last_purchase_at TIMESTAMP,
  last_spent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_balances_store_id ON credit_balances(store_id);

-- ============================================
-- 7. CREDIT_TRANSACTIONS TABLE
-- All credit purchases, adjustments, refunds
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Transaction details
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'purchase',        -- User bought credits
    'adjustment',      -- Manual admin adjustment
    'refund',         -- Refund issued
    'bonus',          -- Promotional credits
    'migration'       -- Data migration
  )),

  -- Payment info (for purchases)
  payment_method VARCHAR(50),           -- 'stripe', 'paypal', etc.
  payment_provider_id VARCHAR(255),     -- External transaction ID
  payment_status VARCHAR(50) DEFAULT 'completed' CHECK (payment_status IN (
    'pending',
    'completed',
    'failed',
    'refunded'
  )),

  -- Metadata
  description TEXT,
  reference_id VARCHAR(255),            -- Related invoice/order ID
  processed_by UUID REFERENCES users(id), -- Admin who processed (for adjustments)
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_store_id ON credit_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- ============================================
-- 8. SERVICE_CREDIT_COSTS TABLE
-- Pricing for all services that consume credits
-- (Keep existing if already exists, or create new)
-- ============================================
CREATE TABLE IF NOT EXISTS service_credit_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key VARCHAR(100) UNIQUE NOT NULL,  -- Code reference key
  service_name VARCHAR(255) NOT NULL,
  service_category VARCHAR(50) CHECK (service_category IN (
    'store_operations',
    'plugin_management',
    'ai_services',
    'data_migration',
    'storage',
    'akeneo_integration',
    'other'
  )),

  -- Pricing
  cost_per_unit DECIMAL(10, 4) NOT NULL,
  billing_type VARCHAR(50) NOT NULL CHECK (billing_type IN (
    'per_use',
    'per_day',
    'per_month',
    'per_hour',
    'per_item',
    'per_mb',
    'flat_rate'
  )),

  -- Display
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,      -- Show in pricing page
  display_order INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_credit_costs_key ON service_credit_costs(service_key);
CREATE INDEX IF NOT EXISTS idx_service_credit_costs_category ON service_credit_costs(service_category);
CREATE INDEX IF NOT EXISTS idx_service_credit_costs_active ON service_credit_costs(is_active) WHERE is_active = true;

-- ============================================
-- 9. JOB_QUEUE TABLE
-- Centralized job queue (from Multi-Tenant Job Architecture)
-- ============================================
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Job details
  job_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  )),

  -- Execution
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,

  -- Results
  result JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_store_id ON job_queue(store_id);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_pending ON job_queue(status, priority, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_created ON job_queue(created_at DESC);

-- ============================================
-- 10. USAGE_METRICS TABLE
-- Store usage tracking for analytics
-- ============================================
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,

  -- Product metrics
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_deleted INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,

  -- Order metrics
  orders_created INTEGER DEFAULT 0,
  orders_total_value DECIMAL(10, 2) DEFAULT 0,

  -- Storage metrics
  storage_uploaded_bytes BIGINT DEFAULT 0,
  storage_deleted_bytes BIGINT DEFAULT 0,
  storage_total_bytes BIGINT DEFAULT 0,

  -- API metrics
  api_calls INTEGER DEFAULT 0,
  api_errors INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(store_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_store_date ON usage_metrics(store_id, metric_date DESC);

-- ============================================
-- 11. API_USAGE_LOGS TABLE
-- API call logging for monitoring
-- ============================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Request details
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Client info
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Error tracking
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Partitioned by date for performance (implement partitioning separately if needed)
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_store_id ON api_usage_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);

-- ============================================
-- 12. BILLING_TRANSACTIONS TABLE
-- Payment history for subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),

  -- Transaction details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'completed',
    'failed',
    'refunded'
  )),

  -- Payment provider
  payment_method VARCHAR(50),           -- 'stripe', 'paypal', 'credit_card'
  payment_provider_id VARCHAR(255),     -- External payment ID

  -- Invoice
  description TEXT,
  invoice_url TEXT,

  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_store_id ON billing_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_subscription ON billing_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_status ON billing_transactions(status);

-- ============================================
-- SEED DATA - Default Service Credit Costs
-- ============================================
INSERT INTO service_credit_costs (service_key, service_name, service_category, cost_per_unit, billing_type, description, is_active, is_visible, display_order)
VALUES
  ('store_creation', 'Store Creation', 'store_operations', 0.00, 'per_use', 'Create a new store', true, false, 1),
  ('product_import', 'Product Import', 'data_migration', 0.10, 'per_item', 'Import products from external source', true, true, 10),
  ('product_export', 'Product Export', 'data_migration', 0.05, 'per_item', 'Export products to external format', true, true, 11),
  ('ai_translation', 'AI Translation', 'ai_services', 1.00, 'per_use', 'Translate content using AI', true, true, 20),
  ('ai_content_generation', 'AI Content Generation', 'ai_services', 2.00, 'per_use', 'Generate product descriptions with AI', true, true, 21),
  ('storage_usage', 'Storage Usage', 'storage', 0.10, 'per_mb', 'Cloud storage for media files', true, true, 30),
  ('akeneo_sync', 'Akeneo Sync', 'akeneo_integration', 5.00, 'per_day', 'Daily Akeneo synchronization', true, true, 40),
  ('plugin_marketplace', 'Plugin Purchase', 'plugin_management', 0.00, 'flat_rate', 'Purchase plugins from marketplace', true, false, 50)
ON CONFLICT (service_key) DO NOTHING;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_databases_updated_at BEFORE UPDATE ON store_databases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_hostnames_updated_at BEFORE UPDATE ON store_hostnames
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_balances_updated_at BEFORE UPDATE ON credit_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE users IS 'Platform users (agency/store owners only). Full user structure synced from tenant DBs where account_type = agency';
COMMENT ON TABLE stores IS 'Minimal store registry with slug for routing. Full store data (name, settings, etc.) stored in tenant databases';
COMMENT ON TABLE store_databases IS 'Encrypted tenant database connection credentials. Allows backend to connect to each store tenant DB';
COMMENT ON TABLE store_hostnames IS 'Maps hostnames/domains to stores for fast tenant resolution';
COMMENT ON TABLE subscriptions IS 'Store subscription plans and billing information';
COMMENT ON TABLE credit_balances IS 'Current credit balance per store (source of truth)';
COMMENT ON TABLE credit_transactions IS 'Credit purchase history and adjustments';
COMMENT ON TABLE service_credit_costs IS 'Pricing for all services that consume credits';
COMMENT ON TABLE job_queue IS 'Centralized job queue for processing tenant jobs';
COMMENT ON TABLE usage_metrics IS 'Daily usage metrics per store for analytics';
COMMENT ON TABLE api_usage_logs IS 'API call logs for monitoring and rate limiting';
COMMENT ON TABLE billing_transactions IS 'Subscription payment history';

-- ============================================
-- MASTER DATABASE SCHEMA COMPLETE
-- ============================================
