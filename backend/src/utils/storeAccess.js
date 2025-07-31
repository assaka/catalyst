const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');

/**
 * Get all stores accessible to a user (owned or team member)
 * @param {string} userId - User ID to check access for
 * @param {object} options - Additional options
 * @returns {Promise<Array>} Array of accessible stores with access info
 */
async function getUserAccessibleStores(userId, options = {}) {
  const {
    includeInactive = false,
    limit = null,
    offset = null,
    search = null
  } = options;

  let whereClause = '';
  const replacements = { user_id: userId };

  // Add search filter if provided
  if (search) {
    whereClause += ` AND (s.name ILIKE :search OR s.description ILIKE :search)`;
    replacements.search = `%${search}%`;
  }

  // Add active filter if needed
  if (!includeInactive) {
    whereClause += ` AND s.is_active = true`;
  }

  // Build pagination
  let limitClause = '';
  if (limit) {
    limitClause = `LIMIT :limit`;
    replacements.limit = limit;
    
    if (offset) {
      limitClause += ` OFFSET :offset`;
      replacements.offset = offset;
    }
  }

  const query = `
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
        ${whereClause}
    ORDER BY 
        -- Direct ownership first, then by store name
        CASE WHEN s.user_id = :user_id THEN 0 ELSE 1 END,
        s.name ASC
    ${limitClause}
  `;

  try {
    const stores = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    return stores;
  } catch (error) {
    console.error('❌ Error fetching accessible stores:', error);
    
    // If store_teams table doesn't exist yet, fall back to owner-only query
    if (error.message.includes('does not exist') || error.message.includes('store_teams')) {
      console.log('⚠️ store_teams table not found, falling back to owner-only access');
      const fallbackQuery = `
        SELECT DISTINCT
            s.id, s.name, s.slug, s.description, s.logo_url,
            s.banner_url, s.theme_color, s.currency, s.timezone,
            s.is_active, s.created_at, s.updated_at,
            'owner' as access_role,
            true as is_direct_owner,
            null as team_permissions,
            null as team_status
        FROM stores s
        WHERE s.user_id = :user_id ${whereClause}
        ORDER BY s.name ASC ${limitClause}
      `;
      
      return await sequelize.query(fallbackQuery, {
        replacements,
        type: QueryTypes.SELECT
      });
    }
    
    throw error;
  }
}

/**
 * Get count of stores accessible to a user
 * @param {string} userId - User ID to check access for
 * @param {object} options - Additional options
 * @returns {Promise<number>} Count of accessible stores
 */
async function getUserAccessibleStoresCount(userId, options = {}) {
  const {
    includeInactive = false,
    search = null
  } = options;

  let whereClause = '';
  const replacements = { user_id: userId };

  // Add search filter if provided
  if (search) {
    whereClause += ` AND (s.name ILIKE :search OR s.description ILIKE :search)`;
    replacements.search = `%${search}%`;
  }

  // Add active filter if needed
  if (!includeInactive) {
    whereClause += ` AND s.is_active = true`;
  }

  const query = `
    SELECT COUNT(DISTINCT s.id) as count
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
        ${whereClause}
  `;

  try {
    const result = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    return parseInt(result[0].count);
  } catch (error) {
    console.error('❌ Error counting accessible stores:', error);
    
    // If store_teams table doesn't exist yet, fall back to owner-only count
    if (error.message.includes('does not exist') || error.message.includes('store_teams')) {
      console.log('⚠️ store_teams table not found, falling back to owner-only count');
      const fallbackQuery = `
        SELECT COUNT(DISTINCT s.id) as count
        FROM stores s
        WHERE s.user_id = :user_id ${whereClause}
      `;
      
      const result = await sequelize.query(fallbackQuery, {
        replacements,
        type: QueryTypes.SELECT
      });
      
      return parseInt(result[0].count);
    }
    
    throw error;
  }
}

/**
 * Check if user has access to a specific store
 * @param {string} userId - User ID to check access for
 * @param {string} storeId - Store ID to check access to
 * @returns {Promise<object|null>} Store access info or null if no access
 */
async function checkUserStoreAccess(userId, storeId) {
  const replacements = { user_id: userId, store_id: storeId };

  const query = `
    SELECT DISTINCT
        s.id,
        s.name,
        s.user_id as owner_id,
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
        s.id = :store_id
        AND (
            -- User is direct owner
            s.user_id = :user_id
            OR 
            -- User is active team member
            (st.user_id = :user_id AND st.status = 'active' AND st.is_active = true)
        )
  `;

  try {
    const result = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('❌ Error checking store access:', error);
    
    // If store_teams table doesn't exist yet, fall back to owner-only check
    if (error.message.includes('does not exist') || error.message.includes('store_teams')) {
      console.log('⚠️ store_teams table not found, falling back to owner-only check');
      const fallbackQuery = `
        SELECT 
            s.id, s.name, s.user_id as owner_id,
            'owner' as access_role,
            true as is_direct_owner,
            null as team_permissions,
            null as team_status
        FROM stores s
        WHERE s.id = :store_id AND s.user_id = :user_id
      `;
      
      const result = await sequelize.query(fallbackQuery, {
        replacements,
        type: QueryTypes.SELECT
      });
      
      return result.length > 0 ? result[0] : null;
    }
    
    throw error;
  }
}

/**
 * Get stores for dropdown/selection (simplified data)
 * @param {string} userId - User ID to check access for
 * @returns {Promise<Array>} Array of stores with minimal data for dropdowns
 */
async function getUserStoresForDropdown(userId) {
  const replacements = { user_id: userId };

  const query = `
    SELECT DISTINCT
        s.id,
        s.name,
        s.logo_url,
        CASE 
            WHEN s.user_id = :user_id THEN 'owner'
            WHEN st.role IS NOT NULL THEN st.role
            ELSE NULL
        END as access_role,
        CASE 
            WHEN s.user_id = :user_id THEN true
            ELSE false
        END as is_direct_owner
    FROM stores s
    LEFT JOIN store_teams st ON (
        s.id = st.store_id 
        AND st.user_id = :user_id 
        AND st.status = 'active' 
        AND st.is_active = true
    )
    WHERE 
        s.is_active = true
        AND (
            -- User is direct owner
            s.user_id = :user_id
            OR 
            -- User is active team member
            (st.user_id = :user_id AND st.status = 'active' AND st.is_active = true)
        )
    ORDER BY 
        -- Direct ownership first, then by store name
        CASE WHEN s.user_id = :user_id THEN 0 ELSE 1 END,
        s.name ASC
  `;

  try {
    const stores = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });

    return stores;
  } catch (error) {
    console.error('❌ Error fetching stores for dropdown:', error);
    
    // If store_teams table doesn't exist yet, fall back to owner-only dropdown
    if (error.message.includes('does not exist') || error.message.includes('store_teams')) {
      console.log('⚠️ store_teams table not found, falling back to owner-only dropdown');
      const fallbackQuery = `
        SELECT DISTINCT
            s.id, s.name, s.logo_url,
            'owner' as access_role,
            true as is_direct_owner
        FROM stores s
        WHERE s.is_active = true AND s.user_id = :user_id
        ORDER BY s.name ASC
      `;
      
      return await sequelize.query(fallbackQuery, {
        replacements,
        type: QueryTypes.SELECT
      });
    }
    
    throw error;
  }
}

module.exports = {
  getUserAccessibleStores,
  getUserAccessibleStoresCount,
  checkUserStoreAccess,
  getUserStoresForDropdown
};