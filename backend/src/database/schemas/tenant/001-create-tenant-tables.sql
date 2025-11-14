-- ============================================
-- TENANT DATABASE SCHEMA
-- Store-specific operational data
-- ============================================

-- This SQL creates all tables needed for a tenant database
-- Run this when provisioning a new store's database

-- ============================================
-- CORE STORE & USER TABLES
-- ============================================

-- Stores table (FULL data - not minimal like master)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY,
  user_id UUID, -- References master DB user
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  theme_color VARCHAR(20) DEFAULT '#3B82F6',
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',

  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  website_url TEXT,

  -- Stripe
  stripe_account_id VARCHAR(255),

  -- Status
  deployment_status VARCHAR(50) DEFAULT 'draft',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table (ALL types - agency, admin, staff, customers)
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
  role VARCHAR(50) DEFAULT 'store_owner',
  account_type VARCHAR(50) DEFAULT 'agency',
  credits DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_email_role ON users(email, role);

-- ============================================
-- CREDIT TABLES (Tenant-Level)
-- ============================================

-- Credit balance cache (synced from master)
CREATE TABLE IF NOT EXISTS credit_balance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  last_synced_at TIMESTAMP DEFAULT NOW()
);

-- Credit spending log
CREATE TABLE IF NOT EXISTS credit_spending_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  service_key VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTE: Additional tables to be added:
-- - Products, Categories, Orders, Customers
-- - CMS Pages, Blocks
-- - Plugins (15+ tables)
-- - Cron jobs
-- - Integrations
-- - All other e-commerce tables
--
-- These should be extracted from existing models
-- or provided as separate migration files
-- ============================================

-- Placeholder comment for remaining tables
COMMENT ON TABLE stores IS 'Full store data for tenant. Master DB only has minimal registry.';
COMMENT ON TABLE users IS 'All user types for this store. Master DB only has agency users.';
COMMENT ON TABLE credit_balance_cache IS 'Cached balance from master DB (source of truth).';
COMMENT ON TABLE credit_spending_log IS 'Local spending history for this store.';
