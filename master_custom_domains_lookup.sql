-- ========================================
-- Custom Domains Lookup Table (Master DB)
-- ========================================
-- Purpose: Fast domain-to-store resolution for incoming requests
-- Location: Master database (platform DB)
-- Synced from: Tenant databases when domains are added/verified/removed

CREATE TABLE IF NOT EXISTS custom_domains_lookup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Domain information
    domain VARCHAR(255) NOT NULL UNIQUE,
    store_id UUID NOT NULL,

    -- Status tracking
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    is_redirect BOOLEAN DEFAULT false,
    redirect_to VARCHAR(255),

    -- SSL status (for quick checks without querying tenant DB)
    ssl_status VARCHAR(50) DEFAULT 'pending',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Indexes for fast lookups
    CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Index for fast domain lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_custom_domains_lookup_domain ON custom_domains_lookup(domain);

-- Index for store queries
CREATE INDEX IF NOT EXISTS idx_custom_domains_lookup_store_id ON custom_domains_lookup(store_id);

-- Index for active verified domains (routing)
CREATE INDEX IF NOT EXISTS idx_custom_domains_lookup_active_verified ON custom_domains_lookup(domain, is_verified, is_active) WHERE is_verified = true AND is_active = true;

-- Comments
COMMENT ON TABLE custom_domains_lookup IS 'Lookup table for fast domain-to-store resolution. Synced from tenant databases.';
COMMENT ON COLUMN custom_domains_lookup.domain IS 'Fully qualified domain name (e.g., shop.example.com)';
COMMENT ON COLUMN custom_domains_lookup.store_id IS 'Reference to stores table in master DB';
COMMENT ON COLUMN custom_domains_lookup.is_verified IS 'Whether domain ownership has been verified';
COMMENT ON COLUMN custom_domains_lookup.is_active IS 'Whether domain is currently active';
COMMENT ON COLUMN custom_domains_lookup.is_primary IS 'Whether this is the primary domain for the store';
COMMENT ON COLUMN custom_domains_lookup.is_redirect IS 'Whether this domain redirects to another domain';
COMMENT ON COLUMN custom_domains_lookup.redirect_to IS 'Target domain to redirect to (e.g., example.com -> www.example.com)';
COMMENT ON COLUMN custom_domains_lookup.ssl_status IS 'SSL certificate status: pending, active, failed';
