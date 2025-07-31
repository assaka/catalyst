-- ===================================================================
-- CREATE A STORE OWNED BY PLAYAMIN998
-- This will test that users can see their owned stores + team stores
-- ===================================================================

-- Step 1: Get playamin's user ID
SELECT 
    'Playamin User Info' as info,
    id,
    email
FROM users 
WHERE email = 'playamin998@gmail.com';

-- Step 2: Create a new store owned by playamin998@gmail.com
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
    'Test store owned by playamin998@gmail.com' as description,
    true as is_active,
    'USD' as currency,
    'UTC' as timezone,
    NOW() as created_at,
    NOW() as updated_at
FROM users u
WHERE u.email = 'playamin998@gmail.com';

-- Step 3: Verify the new store was created
SELECT 
    'New Store Created' as status,
    s.id,
    s.name,
    s.slug,
    u.email as owner_email,
    s.created_at
FROM stores s
JOIN users u ON u.id = s.user_id
WHERE s.name = 'Playamin Store';

-- Step 4: Show what each user should now see
SELECT '=== EXPECTED ACCESS AFTER ADDING PLAYAMIN STORE ===' as section;

-- info@itomoti.com should see:
-- - All their owned stores
-- - NOT see Playamin Store (no access)
SELECT 
    'info@itomoti.com expected access' as user_access,
    s.name as store_name,
    CASE 
        WHEN s.user_id = u.id THEN 'OWNER'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE 'NO ACCESS'
    END as access_type
FROM users u
CROSS JOIN stores s
LEFT JOIN store_teams st ON (st.store_id = s.id AND st.user_id = u.id AND st.status = 'active')
WHERE u.email = 'info@itomoti.com'
  AND s.is_active = true
  AND (s.user_id = u.id OR st.user_id = u.id)
ORDER BY s.name;

-- playamin998@gmail.com should see:
-- - Playamin Store (as owner)
-- - Hamid (as team editor)
SELECT 
    'playamin998@gmail.com expected access' as user_access,
    s.name as store_name,
    CASE 
        WHEN s.user_id = u.id THEN 'OWNER'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE 'NO ACCESS'
    END as access_type
FROM users u
CROSS JOIN stores s
LEFT JOIN store_teams st ON (st.store_id = s.id AND st.user_id = u.id AND st.status = 'active')
WHERE u.email = 'playamin998@gmail.com'
  AND s.is_active = true
  AND (s.user_id = u.id OR st.user_id = u.id)
ORDER BY s.name;

-- Step 5: Summary count
SELECT 
    'Final Store Count' as summary,
    u.email,
    COUNT(DISTINCT CASE WHEN s.user_id = u.id THEN s.id END) as owned_stores,
    COUNT(DISTINCT CASE WHEN st.user_id = u.id THEN st.store_id END) as team_stores,
    COUNT(DISTINCT CASE 
        WHEN s.user_id = u.id THEN s.id 
        WHEN st.user_id = u.id THEN st.store_id 
    END) as total_accessible_stores
FROM users u
LEFT JOIN stores s ON (s.user_id = u.id AND s.is_active = true)
LEFT JOIN store_teams st ON (st.user_id = u.id AND st.status = 'active' AND st.is_active = true)
WHERE u.email IN ('info@itomoti.com', 'playamin998@gmail.com')
GROUP BY u.id, u.email
ORDER BY u.email;

-- Expected final results:
-- info@itomoti.com: 6 owned stores, 0 team stores = 6 total
-- playamin998@gmail.com: 1 owned store (Playamin Store), 1 team store (Hamid) = 2 total