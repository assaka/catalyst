-- Check missing store 81b6dba6-3edd-477d-9432-061551fbfc5b for playamin998@gmail.com

-- 1. Get playamin's user ID
SELECT id, email, role FROM users WHERE email = 'playamin998@gmail.com';

-- 2. Check the specific store details
SELECT 
    id, 
    name, 
    user_id, 
    is_active, 
    created_at,
    updated_at
FROM stores 
WHERE id = '81b6dba6-3edd-477d-9432-061551fbfc5b';

-- 3. Check if store belongs to playamin (replace USER_ID with actual ID from query 1)
SELECT 
    s.id,
    s.name,
    s.user_id,
    s.is_active,
    u.email as owner_email
FROM stores s
JOIN users u ON s.user_id = u.id
WHERE s.id = '81b6dba6-3edd-477d-9432-061551fbfc5b';

-- 4. Show ALL stores owned by playamin (replace USER_ID with actual ID from query 1)  
SELECT 
    s.id,
    s.name,
    s.is_active,
    s.created_at
FROM stores s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'playamin998@gmail.com'
ORDER BY s.created_at DESC;