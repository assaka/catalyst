-- ===================================================================
-- ADD PLAYAMIN TO HAMID STORE TEAM
-- Run in Supabase SQL Editor
-- ===================================================================

-- Add playamin998@gmail.com as admin to Hamid store
INSERT INTO store_teams (store_id, user_id, role, status, permissions)
SELECT 
    s.id as store_id,
    u.id as user_id,
    'admin' as role,
    'active' as status,
    '{"canManageContent": true, "canManageProducts": true, "canManageOrders": true, "canManageCategories": true, "canViewReports": true}'::jsonb as permissions
FROM stores s, users u
WHERE s.name = 'Hamid' 
  AND u.email = 'playamin998@gmail.com'
ON CONFLICT (store_id, user_id) 
DO UPDATE SET 
    role = 'admin',
    status = 'active',
    permissions = '{"canManageContent": true, "canManageProducts": true, "canManageOrders": true, "canManageCategories": true, "canViewReports": true}'::jsonb;

-- Verify both users now have access to Hamid store
SELECT 
    s.name as store_name,
    u.email as user_email,
    st.role,
    st.status,
    st.permissions,
    'Team member added successfully!' as message
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE s.name = 'Hamid'
ORDER BY u.email;

-- Show all team memberships for both users
SELECT 
    u.email as user_email,
    s.name as store_name,
    st.role,
    st.status,
    CASE 
        WHEN s.user_id = u.id THEN 'Store Owner'
        ELSE 'Team Member'
    END as access_type
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE u.email IN ('info@itomoti.com', 'playamin998@gmail.com')
ORDER BY u.email, s.name;