-- Check if playamin is in store_teams for Hamid store

-- 1. Get user IDs
SELECT id, email FROM users WHERE email IN ('info@itomoti.com', 'playamin998@gmail.com');

-- 2. Get Hamid store details
SELECT id, name, user_id FROM stores WHERE name = 'Hamid';

-- 3. Check store_teams entries
SELECT 
    st.id,
    st.store_id,
    st.user_id,
    st.role,
    st.status,
    st.is_active,
    u.email as member_email,
    s.name as store_name
FROM store_teams st
JOIN users u ON st.user_id = u.id
JOIN stores s ON st.store_id = s.id
WHERE s.name = 'Hamid' OR u.email = 'playamin998@gmail.com';

-- 4. Check if store_teams table exists and has any data
SELECT COUNT(*) as total_teams FROM store_teams;

-- 5. Show all team relationships
SELECT 
    s.name as store_name,
    u.email as member_email,
    st.role,
    st.status,
    st.is_active,
    st.created_at
FROM store_teams st
JOIN users u ON st.user_id = u.id
JOIN stores s ON st.store_id = s.id
ORDER BY s.name, st.created_at;