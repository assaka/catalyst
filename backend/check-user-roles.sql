-- ===================================================================
-- CHECK USER ROLES - Why are they seeing all stores?
-- ===================================================================

-- Check the actual roles of both users
SELECT 
    'User Roles Check' as info,
    id,
    email,
    role,
    is_active,
    created_at
FROM users 
WHERE email IN ('info@itomoti.com', 'playamin998@gmail.com');

-- If both users have role = 'admin', that's why they see all stores!
-- The API gives admins access to ALL stores regardless of ownership

-- To fix this, update their roles to 'store_owner' instead:
/*
UPDATE users 
SET role = 'store_owner'
WHERE email IN ('info@itomoti.com', 'playamin998@gmail.com')
  AND role = 'admin';
*/

-- After update, verify:
/*
SELECT 
    'After Role Update' as status,
    id,
    email,
    role
FROM users 
WHERE email IN ('info@itomoti.com', 'playamin998@gmail.com');
*/