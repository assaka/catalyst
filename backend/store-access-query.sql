-- SQL Query to get stores where user is owner or team member
-- This query returns stores accessible to a specific user ID

-- For Sequelize with replacements use :user_id
-- For raw PostgreSQL use $1

-- Sequelize version (with replacements):
SELECT DISTINCT
    s.id,
    s.name,
    s.slug,
    s.description,
    s.logo_url,
    s.banner_url,
    s.theme_color,
    s.currency,
    s.timezone,
    s.is_active,
    s.created_at,
    s.updated_at,
    -- Access type information
    CASE 
        WHEN s.user_id = :user_id THEN 'owner'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE NULL
    END as access_role,
    CASE 
        WHEN s.user_id = :user_id THEN true
        ELSE false
    END as is_direct_owner,
    st.permissions as team_permissions,
    st.status as team_status
FROM stores s
LEFT JOIN store_teams st ON (
    s.id = st.store_id 
    AND st.user_id = :user_id 
    AND st.status = 'active' 
    AND st.is_active = true
)
WHERE 
    -- User is direct owner
    s.user_id = :user_id
    OR 
    -- User is active team member
    (st.user_id = :user_id AND st.status = 'active' AND st.is_active = true)
ORDER BY 
    -- Direct ownership first, then by store name
    CASE WHEN s.user_id = :user_id THEN 0 ELSE 1 END,
    s.name ASC;

-- Raw PostgreSQL version (with $1 parameters):
/*
SELECT DISTINCT
    s.id,
    s.name,
    s.slug,
    -- Access type information
    CASE 
        WHEN s.user_id = $1 THEN 'owner'
        WHEN st.role IS NOT NULL THEN st.role
        ELSE NULL
    END as access_role,
    CASE 
        WHEN s.user_id = $1 THEN true
        ELSE false
    END as is_direct_owner,
    st.permissions as team_permissions
FROM stores s
LEFT JOIN store_teams st ON (
    s.id = st.store_id 
    AND st.user_id = $1 
    AND st.status = 'active' 
    AND st.is_active = true
)
WHERE 
    s.user_id = $1
    OR 
    (st.user_id = $1 AND st.status = 'active' AND st.is_active = true)
ORDER BY 
    CASE WHEN s.user_id = $1 THEN 0 ELSE 1 END,
    s.name ASC;
*/