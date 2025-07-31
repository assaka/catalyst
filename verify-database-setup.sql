-- ===================================================================
-- COMPREHENSIVE DATABASE VERIFICATION FOR STORE ACCESS ISSUES
-- Run this in Supabase SQL Editor to check current state
-- ===================================================================

-- 1. Check all users
SELECT 'USERS CHECK' as check_type, id, email, is_active, created_at 
FROM users 
WHERE email IN ('info@itomoti.com', 'playamin998@gmail.com')
ORDER BY email;

-- 2. Check all stores and their owners
SELECT 
    'STORES CHECK' as check_type,
    s.id,
    s.name,
    s.user_id as owner_user_id,
    u.email as owner_email,
    s.is_active
FROM stores s
LEFT JOIN users u ON u.id = s.user_id
ORDER BY s.name;

-- 3. Check team memberships
SELECT 
    'TEAM MEMBERSHIPS' as check_type,
    st.id as team_id,
    s.name as store_name,
    u.email as member_email,
    st.role,
    st.status,
    st.is_active,
    st.permissions,
    st.created_at
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
ORDER BY s.name, u.email;

-- 4. Simulate dropdown query for info@itomoti.com
SELECT 
    'DROPDOWN FOR INFO@ITOMOTI' as check_type,
    s.id,
    s.name,
    s.logo_url,
    CASE 
        WHEN s.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com') THEN 'owner'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE NULL
    END as access_role,
    CASE 
        WHEN s.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com') THEN true
        ELSE false
    END as is_direct_owner
FROM stores s
LEFT JOIN store_teams st ON (
    s.id = st.store_id 
    AND st.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
    AND st.status = 'active' 
    AND st.is_active = true
)
WHERE 
    s.is_active = true
    AND (
        -- User is direct owner
        s.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
        OR 
        -- User is active team member with Editor+ permissions (admin, editor)
        (st.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com') 
         AND st.status = 'active' 
         AND st.is_active = true 
         AND st.role IN ('admin', 'editor'))
    )
ORDER BY 
    CASE WHEN s.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com') THEN 0 ELSE 1 END,
    s.name ASC;

-- 5. Simulate dropdown query for playamin998@gmail.com
SELECT 
    'DROPDOWN FOR PLAYAMIN' as check_type,
    s.id,
    s.name,
    s.logo_url,
    CASE 
        WHEN s.user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com') THEN 'owner'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE NULL
    END as access_role,
    CASE 
        WHEN s.user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com') THEN true
        ELSE false
    END as is_direct_owner
FROM stores s
LEFT JOIN store_teams st ON (
    s.id = st.store_id 
    AND st.user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com')
    AND st.status = 'active' 
    AND st.is_active = true
)
WHERE 
    s.is_active = true
    AND (
        -- User is direct owner
        s.user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com')
        OR 
        -- User is active team member with Editor+ permissions (admin, editor)
        (st.user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com') 
         AND st.status = 'active' 
         AND st.is_active = true 
         AND st.role IN ('admin', 'editor'))
    )
ORDER BY 
    CASE WHEN s.user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com') THEN 0 ELSE 1 END,
    s.name ASC;

-- 6. Check if store_teams table exists and has proper structure
SELECT 
    'TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'store_teams'
ORDER BY ordinal_position;

-- 7. Expected results summary
SELECT 
    'EXPECTED RESULTS' as summary,
    'info@itomoti.com should own all stores except Hamid' as info_expected,
    'playamin998@gmail.com should only see Hamid as editor' as playamin_expected,
    'If playamin sees all stores, team membership is not working' as diagnosis;