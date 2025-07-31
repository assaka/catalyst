-- ===================================================================
-- CHECK HAMID STORE OWNERSHIP AND ACCESS
-- ===================================================================

-- 1. Check who owns Hamid store
SELECT 
    'HAMID STORE OWNERSHIP' as check_type,
    s.id as store_id,
    s.name as store_name,
    s.user_id as owner_user_id,
    u.email as owner_email,
    s.is_active,
    s.created_at
FROM stores s
LEFT JOIN users u ON u.id = s.user_id
WHERE s.name = 'Hamid';

-- 2. Check info@itomoti.com's access to Hamid
SELECT 
    'INFO USER ACCESS TO HAMID' as check_type,
    s.id as store_id,
    s.name as store_name,
    CASE 
        WHEN s.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com') THEN 'OWNER'
        WHEN st.user_id IS NOT NULL THEN CONCAT('TEAM_', UPPER(st.role))
        ELSE 'NO_ACCESS'
    END as access_type,
    st.status as team_status,
    st.is_active as team_active
FROM stores s
LEFT JOIN store_teams st ON (
    st.store_id = s.id 
    AND st.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
)
WHERE s.name = 'Hamid';

-- 3. List ALL stores and their owners
SELECT 
    'ALL STORES OWNERSHIP' as check_type,
    s.id,
    s.name,
    s.user_id as owner_user_id,
    u.email as owner_email,
    s.is_active
FROM stores s
LEFT JOIN users u ON u.id = s.user_id
ORDER BY s.name;

-- 4. Check all team memberships for Hamid store
SELECT 
    'HAMID TEAM MEMBERS' as check_type,
    st.id as team_id,
    u.email as member_email,
    st.role,
    st.status,
    st.is_active,
    st.created_at
FROM store_teams st
JOIN users u ON u.id = st.user_id
JOIN stores s ON s.id = st.store_id
WHERE s.name = 'Hamid'
ORDER BY st.created_at;

-- 5. FIX: If info@itomoti.com doesn't own Hamid, transfer ownership
-- UNCOMMENT THE FOLLOWING LINES TO FIX:
/*
UPDATE stores 
SET user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
WHERE name = 'Hamid';

-- Verify the fix
SELECT 'AFTER FIX - Hamid ownership' as status, s.name, u.email as owner
FROM stores s
JOIN users u ON u.id = s.user_id
WHERE s.name = 'Hamid';
*/