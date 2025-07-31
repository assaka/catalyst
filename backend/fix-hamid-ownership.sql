-- ===================================================================
-- FIX HAMID STORE OWNERSHIP ISSUE
-- Transfer ownership from playamin998@gmail.com to info@itomoti.com
-- Then add playamin998@gmail.com as editor-only team member
-- ===================================================================

-- Step 1: Check current ownership
SELECT 
    s.name as store_name,
    s.id as store_id,
    s.user_id as current_owner_id,
    owner.email as current_owner_email,
    'Current owner of Hamid store' as status
FROM stores s
LEFT JOIN users owner ON owner.id = s.user_id
WHERE s.name = 'Hamid';

-- Step 2: Transfer Hamid store ownership to info@itomoti.com
UPDATE stores 
SET user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
WHERE name = 'Hamid';

-- Step 3: Remove any existing team membership for playamin (to avoid conflicts)
DELETE FROM store_teams 
WHERE store_id = (SELECT id FROM stores WHERE name = 'Hamid')
  AND user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com');

-- Step 4: Add playamin998@gmail.com as EDITOR team member (not owner)
INSERT INTO store_teams (store_id, user_id, role, status, permissions)
SELECT 
    s.id as store_id,
    u.id as user_id,
    'editor' as role,
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
  AND u.email = 'playamin998@gmail.com';

-- Step 5: Verify the fix
SELECT 
    'OWNERSHIP CHECK' as check_type,
    s.name as store_name,
    owner.email as store_owner,
    CASE 
        WHEN owner.email = 'info@itomoti.com' THEN '✅ CORRECT: info@itomoti.com owns Hamid'
        ELSE '❌ WRONG: Should be info@itomoti.com'
    END as ownership_status
FROM stores s
LEFT JOIN users owner ON owner.id = s.user_id
WHERE s.name = 'Hamid'

UNION ALL

SELECT 
    'TEAM MEMBER CHECK' as check_type,
    s.name as store_name,
    u.email as team_member,
    CASE 
        WHEN st.role = 'editor' THEN '✅ CORRECT: playamin is editor team member'
        ELSE '❌ WRONG: Should be editor'
    END as team_status
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE u.email = 'playamin998@gmail.com' AND s.name = 'Hamid';

-- Step 6: Test what stores each user can see
SELECT 
    u.email as user_email,
    s.name as accessible_store,
    CASE 
        WHEN s.user_id = u.id THEN 'OWNER'
        WHEN st.role IS NOT NULL THEN CONCAT('TEAM_MEMBER_', UPPER(st.role))
        ELSE 'NO_ACCESS'
    END as access_type,
    'playamin998@gmail.com should ONLY see Hamid store' as expected_result
FROM users u
CROSS JOIN stores s
LEFT JOIN store_teams st ON (s.id = st.store_id AND st.user_id = u.id AND st.status = 'active')
WHERE u.email IN ('info@itomoti.com', 'playamin998@gmail.com')
  AND (s.user_id = u.id OR (st.user_id = u.id AND st.status = 'active'))
ORDER BY u.email, s.name;