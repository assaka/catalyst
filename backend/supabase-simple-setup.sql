-- ===================================================================
-- SIMPLE SUPABASE TEAM SETUP (Run in Supabase SQL Editor)
-- ===================================================================

-- 1. Create store_teams table
CREATE TABLE IF NOT EXISTS store_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_active BOOLEAN DEFAULT true,
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, user_id)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_store_teams_store_id ON store_teams(store_id);
CREATE INDEX IF NOT EXISTS idx_store_teams_user_id ON store_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_store_teams_status ON store_teams(status);

-- 3. Add you to Hamid store (MAIN GOAL)
INSERT INTO store_teams (store_id, user_id, role, status, permissions)
SELECT 
    s.id as store_id,
    u.id as user_id,
    'admin' as role,
    'active' as status,
    '{"canManageContent": true, "canManageProducts": true, "canManageOrders": true, "canManageCategories": true, "canViewReports": true}'::jsonb as permissions
FROM stores s, users u
WHERE s.name = 'Hamid' 
  AND u.email = 'info@itomoti.com'
ON CONFLICT (store_id, user_id) 
DO UPDATE SET 
    role = 'admin',
    status = 'active',
    permissions = '{"canManageContent": true, "canManageProducts": true, "canManageOrders": true, "canManageCategories": true, "canViewReports": true}'::jsonb;

-- 4. Verify it worked
SELECT 
    s.name as store_name,
    u.email as user_email,
    st.role,
    st.status,
    'SUCCESS: You now have admin access to Hamid store!' as message
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE u.email = 'info@itomoti.com' AND s.name = 'Hamid';

-- 5. Create migration tracking (optional)
CREATE TABLE IF NOT EXISTS _migrations (
    name VARCHAR(255) PRIMARY KEY,
    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO _migrations (name) VALUES 
    ('create-store-teams-tables'),
    ('add-test-team-member')
ON CONFLICT (name) DO NOTHING;

-- 6. Show all accessible stores for info@itomoti.com
SELECT 
    s.id,
    s.name,
    CASE 
        WHEN s.user_id = u.id THEN 'owner'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE 'no_access'
    END as access_role,
    CASE 
        WHEN s.user_id = u.id THEN 'Direct Owner'
        WHEN st.role IS NOT NULL THEN 'Team Member'
        ELSE 'No Access'
    END as access_type
FROM stores s
CROSS JOIN users u
LEFT JOIN store_teams st ON (s.id = st.store_id AND st.user_id = u.id AND st.status = 'active')
WHERE u.email = 'info@itomoti.com'
  AND (s.user_id = u.id OR (st.user_id = u.id AND st.status = 'active'))
ORDER BY 
    CASE WHEN s.user_id = u.id THEN 0 ELSE 1 END,
    s.name;