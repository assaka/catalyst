-- ========================================
-- Add custom domain columns to master stores table
-- ========================================
-- Purpose: Store PRIMARY custom domain + count for ultra-fast routing
-- Note: A store can have MULTIPLE custom domains, but only ONE primary
-- Optimization: Only query custom_domains_lookup if custom_domains_count > 1
-- Benefits:
--   - 99% of requests hit stores table only (single query)
--   - Only stores with 2+ domains trigger lookup query
-- Synced from: Tenant DB when domains are added/removed/verified

-- Add custom domain columns to stores table (if not exists)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS primary_custom_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domains_count INTEGER DEFAULT 0;

-- Index for fast primary custom domain lookups
CREATE INDEX IF NOT EXISTS idx_stores_primary_custom_domain ON stores(primary_custom_domain) WHERE primary_custom_domain IS NOT NULL;

-- Comments
COMMENT ON COLUMN stores.primary_custom_domain IS 'Primary custom domain for this store (fastest routing). Only query custom_domains_lookup if custom_domains_count > 1.';
COMMENT ON COLUMN stores.domain_verified IS 'Whether the primary custom domain has been verified';
COMMENT ON COLUMN stores.custom_domains_count IS 'Total number of custom domains (0, 1, 2, etc). Avoids lookup query when <= 1';
