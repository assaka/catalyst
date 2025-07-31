-- ===================================================================
-- ADD PLAYAMIN AS EDITOR TO HAMID STORE ONLY
-- This gives view/edit access but NOT admin privileges
-- ===================================================================

-- Add playamin998@gmail.com as EDITOR to Hamid store
INSERT INTO store_teams (store_id, user_id, role, status, permissions)
SELECT 
    s.id as store_id,
    u.id as user_id,
    'editor' as role,  -- EDITOR role (not admin)
    'active' as status,
    '{
        "canManageProducts": true,
        "canManageOrders": true, 
        "canManageCategories": true,
        "canViewReports": true,
        "canManageContent": true,
        "canManageTeam": false,
        "canManageStore": false,
        "canDeleteStore": false
    }'::jsonb as permissions
FROM stores s, users u
WHERE s.name = 'Hamid' 
  AND u.email = 'playamin998@gmail.com'
ON CONFLICT (store_id, user_id) 
DO UPDATE SET 
    role = 'editor',  -- Ensure it's editor, not admin
    status = 'active',
    permissions = '{
        "canManageProducts": true,
        "canManageOrders": true, 
        "canManageCategories": true,
        "canViewReports": true,
        "canManageContent": true,
        "canManageTeam": false,
        "canManageStore": false,
        "canDeleteStore": false
    }'::jsonb;

-- Verify the setup
SELECT 
    s.name as store_name,
    u.email as user_email,
    st.role,
    st.status,
    st.permissions,
    CASE 
        WHEN st.role = 'editor' THEN '✅ CORRECT: Editor access (view/edit only)'
        WHEN st.role = 'admin' THEN '⚠️  WARNING: Admin access (too much power)'
        ELSE '❌ INCORRECT: Wrong role'
    END as access_level_check
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE u.email = 'playamin998@gmail.com' AND s.name = 'Hamid';

-- Show what playamin998@gmail.com CAN and CANNOT do
SELECT 
    'playamin998@gmail.com Hamid Store Permissions' as summary,
    '✅ CAN view all store data' as can_view,
    '✅ CAN edit products' as can_edit_products,
    '✅ CAN manage orders' as can_manage_orders,
    '✅ CAN manage categories' as can_manage_categories,
    '✅ CAN view reports' as can_view_reports,
    '❌ CANNOT manage team members' as cannot_manage_team,
    '❌ CANNOT change store settings' as cannot_manage_store,
    '❌ CANNOT delete store' as cannot_delete_store,
    '❌ CANNOT access other stores' as cannot_access_other_stores;

-- Verify playamin998@gmail.com can ONLY access Hamid store
SELECT 
    u.email,
    s.name as accessible_store,
    st.role,
    'This should ONLY show Hamid store' as note
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE u.email = 'playamin998@gmail.com'
ORDER BY s.name;