-- ===================================================================
-- COMPREHENSIVE STORE ACCESS FIX
-- This ensures proper ownership and team access for all users
-- ===================================================================

-- Step 1: Show current state
SELECT '=== CURRENT STATE ===' as section;

SELECT 
    'Store Ownership' as info,
    s.id,
    s.name,
    s.user_id as owner_id,
    u.email as owner_email,
    s.is_active
FROM stores s
LEFT JOIN users u ON u.id = s.user_id
ORDER BY s.name;

-- Step 2: Check user IDs
SELECT 
    'User IDs' as info,
    id,
    email,
    is_active
FROM users 
WHERE email IN ('info@itomoti.com', 'playamin998@gmail.com');

-- Step 3: Current team memberships
SELECT 
    'Current Team Memberships' as info,
    st.id,
    s.name as store_name,
    u.email as member_email,
    st.role,
    st.status,
    st.is_active
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
ORDER BY s.name, u.email;

-- ===================================================================
-- FIX SECTION - Run these to fix the issues
-- ===================================================================

-- Step 4: Ensure info@itomoti.com owns all stores except any specifically assigned
UPDATE stores 
SET user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
WHERE name IN ('Hamid', 'Store1', 'Store2', 'Store3', 'Store4', 'Store5', 'Store6')
  AND user_id != (SELECT id FROM users WHERE email = 'info@itomoti.com');

-- Step 5: Clean up ALL team memberships and rebuild
DELETE FROM store_teams;

-- Step 6: Add playamin998@gmail.com as EDITOR to ONLY Hamid store
INSERT INTO store_teams (
    store_id, 
    user_id, 
    role, 
    status, 
    permissions, 
    is_active, 
    created_at, 
    updated_at,
    invited_by_user_id
)
SELECT 
    s.id as store_id,
    u.id as user_id,
    'editor' as role,
    'active' as status,
    jsonb_build_object(
        'canManageProducts', true,
        'canManageOrders', true,
        'canManageCategories', true,
        'canViewReports', true,
        'canManageContent', true,
        'canManageTeam', false,
        'canManageStore', false,
        'canDeleteStore', false
    ) as permissions,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at,
    (SELECT id FROM users WHERE email = 'info@itomoti.com') as invited_by_user_id
FROM stores s, users u
WHERE s.name = 'Hamid' 
  AND u.email = 'playamin998@gmail.com';

-- ===================================================================
-- VERIFICATION SECTION
-- ===================================================================

-- Step 7: Verify info@itomoti.com access (should see all stores as owner)
SELECT '=== VERIFICATION: info@itomoti.com access ===' as section;

SELECT DISTINCT
    s.id,
    s.name,
    CASE 
        WHEN s.user_id = u.id THEN 'owner'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE 'no_access'
    END as access_role
FROM stores s
CROSS JOIN users u
LEFT JOIN store_teams st ON (
    st.store_id = s.id 
    AND st.user_id = u.id 
    AND st.status = 'active' 
    AND st.is_active = true
)
WHERE u.email = 'info@itomoti.com'
  AND s.is_active = true
  AND (s.user_id = u.id OR st.user_id = u.id)
ORDER BY s.name;

-- Step 8: Verify playamin998@gmail.com access (should see ONLY Hamid)
SELECT '=== VERIFICATION: playamin998@gmail.com access ===' as section;

SELECT DISTINCT
    s.id,
    s.name,
    CASE 
        WHEN s.user_id = u.id THEN 'owner'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE 'no_access'
    END as access_role
FROM stores s
CROSS JOIN users u
LEFT JOIN store_teams st ON (
    st.store_id = s.id 
    AND st.user_id = u.id 
    AND st.status = 'active' 
    AND st.is_active = true
)
WHERE u.email = 'playamin998@gmail.com'
  AND s.is_active = true
  AND (s.user_id = u.id OR st.user_id = u.id)
ORDER BY s.name;

-- Step 9: Final count check
SELECT '=== FINAL COUNTS ===' as section;

SELECT 
    u.email,
    COUNT(DISTINCT s.id) as owned_stores,
    COUNT(DISTINCT st.store_id) as team_stores,
    COUNT(DISTINCT COALESCE(s.id, st.store_id)) as total_accessible_stores
FROM users u
LEFT JOIN stores s ON (s.user_id = u.id AND s.is_active = true)
LEFT JOIN store_teams st ON (st.user_id = u.id AND st.status = 'active' AND st.is_active = true)
WHERE u.email IN ('info@itomoti.com', 'playamin998@gmail.com')
GROUP BY u.id, u.email
ORDER BY u.email;

-- Expected results:
-- info@itomoti.com: 6+ owned stores, 0 team stores
-- playamin998@gmail.com: 0 owned stores, 1 team store (Hamid)