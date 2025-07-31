-- ===================================================================
-- FIX PLAYAMIN998 STORE ACCESS - RESTRICTIVE APPROACH
-- This ensures playamin998@gmail.com ONLY sees stores they have explicit access to
-- ===================================================================

-- Step 1: Check current situation
SELECT 
    'BEFORE FIX - Current User Store Access' as status,
    u.id as user_id,
    u.email,
    s.id as store_id,
    s.name as store_name,
    CASE 
        WHEN s.user_id = u.id THEN 'OWNER'
        WHEN st.user_id IS NOT NULL THEN CONCAT('TEAM_', UPPER(st.role))
        ELSE 'NO_ACCESS'
    END as access_type
FROM users u
CROSS JOIN stores s
LEFT JOIN store_teams st ON (st.store_id = s.id AND st.user_id = u.id AND st.status = 'active' AND st.is_active = true)
WHERE u.email IN ('info@itomoti.com', 'playamin998@gmail.com')
    AND s.is_active = true
ORDER BY u.email, s.name;

-- Step 2: Clean up any incorrect team memberships for playamin998@gmail.com
DELETE FROM store_teams 
WHERE user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com');

-- Step 3: Ensure playamin998@gmail.com is NOT an owner of any stores
-- (Transfer any owned stores back to info@itomoti.com)
UPDATE stores 
SET user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
WHERE user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com');

-- Step 4: Add playamin998@gmail.com as EDITOR to ONLY Hamid store
INSERT INTO store_teams (store_id, user_id, role, status, permissions, is_active, created_at, updated_at)
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
    NOW() as updated_at
FROM stores s, users u
WHERE s.name = 'Hamid' 
  AND u.email = 'playamin998@gmail.com'
  AND s.is_active = true;

-- Step 5: Verify the fix - show what each user should see
SELECT 'AFTER FIX - info@itomoti.com stores' as test_result;

SELECT DISTINCT
    s.id,
    s.name,
    s.logo_url,
    'owner' as access_role,
    true as is_direct_owner
FROM stores s
WHERE s.is_active = true 
  AND s.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')

UNION

SELECT DISTINCT
    s.id,
    s.name,
    s.logo_url,
    st.role as access_role,
    false as is_direct_owner
FROM stores s
INNER JOIN store_teams st ON st.store_id = s.id
WHERE s.is_active = true 
  AND st.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
  AND st.status = 'active' 
  AND st.is_active = true
  AND st.role IN ('admin', 'editor')
  AND s.user_id != (SELECT id FROM users WHERE email = 'info@itomoti.com')

ORDER BY name ASC;

-- Step 6: Verify playamin998@gmail.com access
SELECT 'AFTER FIX - playamin998@gmail.com stores' as test_result;

SELECT DISTINCT
    s.id,
    s.name,
    s.logo_url,
    'owner' as access_role,
    true as is_direct_owner
FROM stores s
WHERE s.is_active = true 
  AND s.user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com')

UNION

SELECT DISTINCT
    s.id,
    s.name,
    s.logo_url,
    st.role as access_role,
    false as is_direct_owner
FROM stores s
INNER JOIN store_teams st ON st.store_id = s.id
WHERE s.is_active = true 
  AND st.user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com')
  AND st.status = 'active' 
  AND st.is_active = true
  AND st.role IN ('admin', 'editor')
  AND s.user_id != (SELECT id FROM users WHERE email = 'playamin998@gmail.com')

ORDER BY name ASC;

-- Step 7: Final verification - count stores per user
SELECT 
    'FINAL COUNT CHECK' as summary,
    u.email,
    COUNT(DISTINCT CASE 
        WHEN s.user_id = u.id THEN s.id 
        WHEN st.user_id = u.id AND st.status = 'active' AND st.is_active = true AND st.role IN ('admin', 'editor') THEN s.id 
    END) as accessible_stores_count
FROM users u
LEFT JOIN stores s ON (s.is_active = true)
LEFT JOIN store_teams st ON (st.store_id = s.id AND st.user_id = u.id)
WHERE u.email IN ('info@itomoti.com', 'playamin998@gmail.com')
GROUP BY u.id, u.email
ORDER BY u.email;

-- Expected Results:
-- info@itomoti.com: Should see ALL stores they own (multiple stores)
-- playamin998@gmail.com: Should see ONLY 1 store (Hamid) as team member