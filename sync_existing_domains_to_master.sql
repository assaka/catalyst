-- ============================================================
-- ONE-TIME SYNC: Sync existing custom domains to master DB
-- ============================================================
-- Run this ONLY ONCE after creating custom_domains_lookup table
-- This syncs any domains that were added before the sync feature

-- STEP 1: Check what's in your tenant DB custom_domains table
-- Replace 'YOUR_STORE_ID' with actual store_id
-- Run this in TENANT database first to see what domains exist:
/*
SELECT
    id,
    store_id,
    domain,
    verification_status,
    is_verified,
    is_active,
    is_primary,
    ssl_status,
    verified_at,
    created_at
FROM custom_domains
WHERE store_id = 'YOUR_STORE_ID';
*/

-- STEP 2: If domains exist, manually insert to master DB custom_domains_lookup
-- Run this in MASTER database (replace values with actual data):
/*
INSERT INTO custom_domains_lookup (
    domain,
    store_id,
    is_verified,
    is_active,
    is_primary,
    ssl_status,
    verified_at,
    created_at,
    updated_at
) VALUES (
    'www.sprshop.nl',                           -- domain from tenant DB
    '947fa171-625f-4374-9c30-574d8c6e5abf',    -- store_id
    true,                                       -- is_verified (check tenant DB)
    true,                                       -- is_active
    true,                                       -- is_primary
    'pending',                                  -- ssl_status
    NOW(),                                      -- verified_at (or actual date)
    NOW(),                                      -- created_at
    NOW()                                       -- updated_at
)
ON CONFLICT (domain) DO UPDATE SET
    is_verified = EXCLUDED.is_verified,
    is_active = EXCLUDED.is_active,
    is_primary = EXCLUDED.is_primary,
    ssl_status = EXCLUDED.ssl_status,
    updated_at = NOW();
*/

-- STEP 3: Update master stores table with primary domain and count
-- Run this in MASTER database (replace values):
/*
UPDATE stores
SET
    primary_custom_domain = 'www.sprshop.nl',
    domain_verified = true,
    custom_domains_count = 1,
    updated_at = NOW()
WHERE id = '947fa171-625f-4374-9c30-574d8c6e5abf';
*/

-- STEP 4: Verify the sync worked
-- Run in MASTER database:
/*
SELECT
    s.id,
    s.slug,
    s.primary_custom_domain,
    s.domain_verified,
    s.custom_domains_count
FROM stores s
WHERE s.id = '947fa171-625f-4374-9c30-574d8c6e5abf';

SELECT * FROM custom_domains_lookup
WHERE store_id = '947fa171-625f-4374-9c30-574d8c6e5abf';
*/
