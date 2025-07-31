-- ===================================================================
-- COMPLETE TEST SETUP FOR STORE ACCESS
-- This creates a proper test scenario with owned and team stores
-- ===================================================================

-- Step 1: Clean slate - Remove all team memberships
DELETE FROM store_teams;

-- Step 2: Ensure info@itomoti.com owns most stores
UPDATE stores 
SET user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
WHERE name NOT IN ('Playamin Store')  -- Keep any existing Playamin Store
  AND user_id != (SELECT id FROM users WHERE email = 'info@itomoti.com');

-- Step 3: Create or update Playamin Store
INSERT INTO stores (
    name,
    slug,
    user_id,
    description,
    is_active,
    currency,
    timezone,
    created_at,
    updated_at
)
SELECT 
    'Playamin Store' as name,
    'playamin-store' as slug,
    u.id as user_id,
    'Store owned by playamin998@gmail.com' as description,
    true as is_active,
    'USD' as currency,
    'UTC' as timezone,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
WHERE u.email = 'playamin998@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Playamin Store')
ON CONFLICT (slug) DO UPDATE SET
    user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com'),
    updated_at = NOW();

-- Step 4: Set up team memberships
-- Add playamin as EDITOR to Hamid store
INSERT INTO store_teams (
    store_id, 
    user_id, 
    role, 
    status, 
    permissions, 
    is_active
)
SELECT 
    s.id,
    u.id,
    'editor',
    'active',
    jsonb_build_object(
        'canManageProducts', true,
        'canManageOrders', true,
        'canManageCategories', true,
        'canViewReports', true,
        'canManageContent', true,
        'canManageTeam', false,
        'canManageStore', false,
        'canDeleteStore', false
    ),
    true
FROM stores s, users u
WHERE s.name = 'Hamid' 
  AND u.email = 'playamin998@gmail.com';

-- Step 5: Add info@itomoti.com as VIEWER to Playamin Store (for testing)
INSERT INTO store_teams (
    store_id, 
    user_id, 
    role, 
    status, 
    permissions, 
    is_active
)
SELECT 
    s.id,
    u.id,
    'viewer',
    'active',
    jsonb_build_object(
        'canManageProducts', false,
        'canManageOrders', false,
        'canManageCategories', false,
        'canViewReports', true,
        'canManageContent', false,
        'canManageTeam', false,
        'canManageStore', false,
        'canDeleteStore', false
    ),
    true
FROM stores s, users u
WHERE s.name = 'Playamin Store' 
  AND u.email = 'info@itomoti.com';

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '=== FINAL SETUP VERIFICATION ===' as section;

-- Show all stores and ownership
SELECT 
    'All Stores' as info,
    s.name,
    u.email as owner_email,
    s.is_active
FROM stores s
JOIN users u ON u.id = s.user_id
WHERE s.is_active = true
ORDER BY s.name;

-- Show all team memberships
SELECT 
    'All Team Memberships' as info,
    s.name as store_name,
    u.email as member_email,
    st.role,
    st.status
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE st.is_active = true
ORDER BY s.name, u.email;

-- What info@itomoti.com should see in dropdown
SELECT 
    'info@itomoti.com dropdown (Editor+ only)' as test,
    s.name as store_name,
    CASE 
        WHEN s.user_id = u.id THEN 'owner'
        WHEN st.role IN ('admin', 'editor') THEN st.role
        ELSE 'no_access'
    END as access_type
FROM users u
LEFT JOIN stores s ON s.is_active = true
LEFT JOIN store_teams st ON (st.store_id = s.id AND st.user_id = u.id AND st.status = 'active' AND st.role IN ('admin', 'editor'))
WHERE u.email = 'info@itomoti.com'
  AND (s.user_id = u.id OR st.role IN ('admin', 'editor'))
ORDER BY s.name;

-- What playamin998@gmail.com should see in dropdown
SELECT 
    'playamin998@gmail.com dropdown (Editor+ only)' as test,
    s.name as store_name,
    CASE 
        WHEN s.user_id = u.id THEN 'owner'
        WHEN st.role IN ('admin', 'editor') THEN st.role
        ELSE 'no_access'
    END as access_type
FROM users u
LEFT JOIN stores s ON s.is_active = true
LEFT JOIN store_teams st ON (st.store_id = s.id AND st.user_id = u.id AND st.status = 'active' AND st.role IN ('admin', 'editor'))
WHERE u.email = 'playamin998@gmail.com'
  AND (s.user_id = u.id OR st.role IN ('admin', 'editor'))
ORDER BY s.name;

-- Summary
SELECT 
    'Summary' as info,
    u.email,
    COUNT(DISTINCT CASE WHEN s.user_id = u.id THEN s.id END) as owned_stores,
    COUNT(DISTINCT CASE WHEN st.role IN ('admin', 'editor') THEN st.store_id END) as editor_access_stores,
    COUNT(DISTINCT CASE WHEN st.role = 'viewer' THEN st.store_id END) as viewer_only_stores
FROM users u
LEFT JOIN stores s ON (s.user_id = u.id AND s.is_active = true)
LEFT JOIN store_teams st ON (st.user_id = u.id AND st.status = 'active' AND st.is_active = true)
WHERE u.email IN ('info@itomoti.com', 'playamin998@gmail.com')
GROUP BY u.id, u.email
ORDER BY u.email;

-- Expected results:
-- info@itomoti.com: Owns most stores, has viewer access to Playamin Store (won't show in dropdown)
-- playamin998@gmail.com: Owns Playamin Store, has editor access to Hamid (both show in dropdown)