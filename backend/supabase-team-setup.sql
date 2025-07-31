-- ===================================================================
-- SUPABASE TEAM/WORKSPACE SETUP SQL COMMANDS
-- Run these commands in Supabase SQL Editor in order
-- ===================================================================

-- Step 1: Create store_teams table
-- ===================================================================
CREATE TABLE IF NOT EXISTS store_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP,
    accepted_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, user_id)
);

-- Create indexes for store_teams
CREATE INDEX IF NOT EXISTS idx_store_teams_store_id ON store_teams(store_id);
CREATE INDEX IF NOT EXISTS idx_store_teams_user_id ON store_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_store_teams_status ON store_teams(status);

-- Step 2: Create store_invitations table
-- ===================================================================
CREATE TABLE IF NOT EXISTS store_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    accepted_by UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for store_invitations
CREATE INDEX IF NOT EXISTS idx_store_invitations_store_id ON store_invitations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_invitations_email ON store_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_store_invitations_token ON store_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_store_invitations_status ON store_invitations(status);

-- Step 3: Add info@itomoti.com as admin to Hamid store
-- ===================================================================
-- First, let's find the store and user IDs
WITH hamid_store AS (
    SELECT id as store_id FROM stores WHERE name = 'Hamid' LIMIT 1
),
itomoti_user AS (
    SELECT id as user_id FROM users WHERE email = 'info@itomoti.com' LIMIT 1
)
INSERT INTO store_teams (store_id, user_id, role, status, accepted_at, permissions)
SELECT 
    h.store_id,
    u.user_id,
    'admin',
    'active',
    CURRENT_TIMESTAMP,
    '{"canManageContent": true, "canManageProducts": true, "canManageOrders": true, "canManageCategories": true, "canViewReports": true}'::jsonb
FROM hamid_store h, itomoti_user u
ON CONFLICT (store_id, user_id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    accepted_at = CURRENT_TIMESTAMP,
    permissions = '{"canManageContent": true, "canManageProducts": true, "canManageOrders": true, "canManageCategories": true, "canViewReports": true}'::jsonb;

-- Step 4: Create migration tracking table and mark migrations as completed
-- ===================================================================
CREATE TABLE IF NOT EXISTS _migrations (
    name VARCHAR(255) PRIMARY KEY,
    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mark our migrations as completed
INSERT INTO _migrations (name) VALUES 
    ('create-store-teams-tables'),
    ('add-test-team-member')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Verification queries (run these to check the setup)
-- ===================================================================

-- Check if tables were created successfully
SELECT 
    'store_teams' as table_name,
    COUNT(*) as record_count
FROM store_teams
UNION ALL
SELECT 
    'store_invitations' as table_name,
    COUNT(*) as record_count
FROM store_invitations;

-- Check if you were added to Hamid store
SELECT 
    s.name as store_name,
    u.email as user_email,
    st.role,
    st.status,
    st.permissions,
    st.accepted_at
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE u.email = 'info@itomoti.com';

-- Test the team access query
SELECT DISTINCT
    s.id,
    s.name,
    s.slug,
    -- Access type information
    CASE 
        WHEN s.user_id = u.id THEN 'owner'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE NULL
    END as access_role,
    CASE 
        WHEN s.user_id = u.id THEN true
        ELSE false
    END as is_direct_owner,
    st.permissions as team_permissions,
    st.status as team_status,
    -- Add ORDER BY expressions to SELECT for DISTINCT compatibility
    CASE WHEN s.user_id = u.id THEN 0 ELSE 1 END as ownership_priority
FROM stores s
CROSS JOIN users u
LEFT JOIN store_teams st ON (
    s.id = st.store_id 
    AND st.user_id = u.id 
    AND st.status = 'active' 
    AND st.is_active = true
)
WHERE 
    u.email = 'info@itomoti.com'
    AND (
        -- User is direct owner
        s.user_id = u.id
        OR 
        -- User is active team member
        (st.user_id = u.id AND st.status = 'active' AND st.is_active = true)
    )
ORDER BY 
    ownership_priority,
    s.name ASC;