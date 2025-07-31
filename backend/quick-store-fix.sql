-- ===================================================================
-- QUICK STORE ACCESS FIX (Less Destructive)
-- This fixes store access without deleting existing team memberships
-- ===================================================================

-- Step 1: Check current Hamid store ownership
SELECT 
    'Current Hamid Owner' as info,
    s.id,
    s.name,
    s.user_id as owner_id,
    u.email as owner_email
FROM stores s
LEFT JOIN users u ON u.id = s.user_id
WHERE s.name = 'Hamid';

-- Step 2: Transfer Hamid ownership to info@itomoti.com if needed
UPDATE stores 
SET user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
WHERE name = 'Hamid'
  AND user_id != (SELECT id FROM users WHERE email = 'info@itomoti.com');

-- Step 3: Remove playamin998 from all team memberships first
DELETE FROM store_teams 
WHERE user_id = (SELECT id FROM users WHERE email = 'playamin998@gmail.com');

-- Step 4: Add playamin998 as EDITOR to ONLY Hamid store
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

-- Step 5: Verify the results
SELECT 'After Fix - Store Access' as status;

-- Check info@itomoti.com access (should own all stores including Hamid)
SELECT 
    u.email,
    COUNT(s.id) as owned_stores,
    STRING_AGG(s.name, ', ' ORDER BY s.name) as store_names
FROM users u
JOIN stores s ON s.user_id = u.id
WHERE u.email = 'info@itomoti.com'
GROUP BY u.id, u.email;

-- Check playamin998@gmail.com access (should only have team access to Hamid)
SELECT 
    u.email,
    s.name as store_name,
    st.role as team_role,
    st.status
FROM users u
JOIN store_teams st ON st.user_id = u.id
JOIN stores s ON s.id = st.store_id
WHERE u.email = 'playamin998@gmail.com';