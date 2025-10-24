-- ==========================================
-- Master Database - Business Management Tables
-- ==========================================
-- Purpose: Track subscriptions, billing, usage, and platform administration
-- These tables remain in the master/platform database

-- ==========================================
-- SUBSCRIPTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Plan details
  plan_name VARCHAR(50) NOT NULL, -- 'free', 'starter', 'professional', 'enterprise'
  status VARCHAR(50) NOT NULL DEFAULT 'trial', -- 'active', 'trial', 'cancelled', 'expired', 'suspended'

  -- Pricing
  price_monthly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'annual'
  currency VARCHAR(3) DEFAULT 'USD',

  -- Resource limits
  max_products INTEGER,
  max_orders_per_month INTEGER,
  max_storage_gb INTEGER,
  max_api_calls_per_month INTEGER,
  max_admin_users INTEGER DEFAULT 5,

  -- Dates
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ==========================================
-- BILLING TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'disputed'

  -- Payment
  payment_method VARCHAR(50), -- 'stripe', 'paypal', 'credit_card', 'bank_transfer'
  payment_provider VARCHAR(50), -- 'stripe', 'paypal', etc.
  payment_provider_id VARCHAR(255), -- External payment ID from provider
  payment_provider_response JSONB,

  -- Invoice
  invoice_number VARCHAR(100) UNIQUE,
  invoice_url VARCHAR(500),
  invoice_pdf_url VARCHAR(500),

  -- Description
  description TEXT,
  line_items JSONB DEFAULT '[]', -- Array of {description, amount, quantity}

  -- Dates
  processed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_transactions_store_id ON billing_transactions(store_id);
CREATE INDEX idx_billing_transactions_subscription_id ON billing_transactions(subscription_id);
CREATE INDEX idx_billing_transactions_status ON billing_transactions(status);
CREATE INDEX idx_billing_transactions_created_at ON billing_transactions(created_at DESC);

-- ==========================================
-- USAGE METRICS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Time period
  metric_date DATE NOT NULL,
  metric_hour INTEGER, -- 0-23, NULL for daily rollup

  -- Product metrics
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_deleted INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,

  -- Category metrics
  categories_created INTEGER DEFAULT 0,
  categories_updated INTEGER DEFAULT 0,

  -- Order metrics
  orders_created INTEGER DEFAULT 0,
  orders_completed INTEGER DEFAULT 0,
  orders_cancelled INTEGER DEFAULT 0,
  orders_total_value DECIMAL(10,2) DEFAULT 0,
  orders_avg_value DECIMAL(10,2) DEFAULT 0,

  -- Customer metrics
  customers_new INTEGER DEFAULT 0,
  customers_returning INTEGER DEFAULT 0,

  -- Storage metrics
  storage_uploaded_bytes BIGINT DEFAULT 0,
  storage_deleted_bytes BIGINT DEFAULT 0,
  storage_total_bytes BIGINT DEFAULT 0,
  storage_files_count INTEGER DEFAULT 0,

  -- API metrics
  api_calls INTEGER DEFAULT 0,
  api_errors INTEGER DEFAULT 0,
  api_avg_response_time_ms INTEGER DEFAULT 0,

  -- Page views
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(store_id, metric_date, metric_hour)
);

CREATE INDEX idx_usage_metrics_store_id ON usage_metrics(store_id);
CREATE INDEX idx_usage_metrics_date ON usage_metrics(metric_date DESC);
CREATE INDEX idx_usage_metrics_store_date ON usage_metrics(store_id, metric_date DESC);

-- ==========================================
-- API USAGE LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- Request details
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500),
  query_params JSONB,

  -- Response details
  status_code INTEGER,
  response_time_ms INTEGER,
  response_size_bytes INTEGER,

  -- Client details
  ip_address VARCHAR(45),
  user_agent TEXT,
  api_key_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_usage_logs_store_id ON api_usage_logs(store_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_status_code ON api_usage_logs(status_code);

-- ==========================================
-- PLATFORM ADMINS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role and permissions
  role VARCHAR(50) NOT NULL DEFAULT 'support', -- 'super_admin', 'admin', 'support', 'billing', 'developer'
  permissions JSONB DEFAULT '{}', -- Fine-grained permissions object

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,

  -- MFA
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_platform_admins_role ON platform_admins(role);
CREATE INDEX idx_platform_admins_is_active ON platform_admins(is_active);

-- ==========================================
-- STORE ANALYTICS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS store_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Period
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Revenue
  revenue_total DECIMAL(10,2) DEFAULT 0,
  revenue_avg_order DECIMAL(10,2) DEFAULT 0,

  -- Orders
  orders_count INTEGER DEFAULT 0,
  orders_conversion_rate DECIMAL(5,2) DEFAULT 0,

  -- Products
  products_best_selling JSONB DEFAULT '[]', -- [{id, name, quantity_sold, revenue}]
  products_low_stock JSONB DEFAULT '[]',

  -- Customers
  customers_new INTEGER DEFAULT 0,
  customers_returning INTEGER DEFAULT 0,
  customers_lifetime_value DECIMAL(10,2) DEFAULT 0,

  -- Traffic
  traffic_sessions INTEGER DEFAULT 0,
  traffic_page_views INTEGER DEFAULT 0,
  traffic_bounce_rate DECIMAL(5,2) DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(store_id, period_type, period_start)
);

CREATE INDEX idx_store_analytics_store_id ON store_analytics(store_id);
CREATE INDEX idx_store_analytics_period ON store_analytics(period_start DESC);

-- ==========================================
-- AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor (who did it)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- Target (what was affected)
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  entity_type VARCHAR(100), -- 'store', 'subscription', 'product', 'order', etc.
  entity_id UUID,

  -- Action
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'export', etc.
  action_category VARCHAR(50), -- 'auth', 'billing', 'data', 'settings'
  description TEXT,

  -- Changes
  changes_before JSONB,
  changes_after JSONB,

  -- Request context
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'warning'
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_store_id ON audit_logs(store_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==========================================
-- UPDATE STORES TABLE
-- ==========================================
-- Add new columns to existing stores table

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS database_type VARCHAR(50) DEFAULT 'supabase-database',
ADD COLUMN IF NOT EXISTS database_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(50) DEFAULT 'supabase-storage',
ADD COLUMN IF NOT EXISTS storage_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS product_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_calls_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT NOW();

-- Create indexes on new columns
CREATE INDEX IF NOT EXISTS idx_stores_database_status ON stores(database_status);
CREATE INDEX IF NOT EXISTS idx_stores_subscription_status ON stores(subscription_status);
CREATE INDEX IF NOT EXISTS idx_stores_last_activity ON stores(last_activity_at DESC);

-- ==========================================
-- COMMENTS
-- ==========================================
COMMENT ON TABLE subscriptions IS 'Store subscription plans and billing cycles';
COMMENT ON TABLE billing_transactions IS 'Payment transactions and invoices';
COMMENT ON TABLE usage_metrics IS 'Resource usage tracking per store';
COMMENT ON TABLE api_usage_logs IS 'API request logs for monitoring and debugging';
COMMENT ON TABLE platform_admins IS 'Platform administrators with elevated permissions';
COMMENT ON TABLE store_analytics IS 'Aggregated analytics and business intelligence';
COMMENT ON TABLE audit_logs IS 'Audit trail for all significant actions';
