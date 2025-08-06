const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');

/**
 * Get stores for dropdown - owned stores + team stores where user is editor+
 * @param {string} userId - User ID to check access for
 * @returns {Promise<Array>} Array of stores with minimal data for dropdowns
 */
async function getUserStoresForDropdown(userId) {
  try {
    console.log(`🔍 Getting accessible stores for user ID: ${userId}`);
    
    // BULLETPROOF: Simple query with clear logic
    const query = `
      SELECT DISTINCT
          s.id,
          s.name,
          s.logo_url,
          s.created_at,
          s.updated_at,
          s.is_active,
          CASE 
            WHEN s.user_id = :userId THEN 'owner'
            ELSE (
              SELECT st.role 
              FROM store_teams st 
              WHERE st.store_id = s.id 
                AND st.user_id = :userId 
                AND st.status = 'active' 
                AND st.is_active = true 
                AND st.role IN ('admin', 'editor')
              LIMIT 1
            )
          END as access_role,
          (s.user_id = :userId) as is_direct_owner
      FROM stores s
      WHERE s.is_active = true 
        AND (
          -- Case 1: User owns the store
          s.user_id = :userId
          OR
          -- Case 2: User is editor/admin team member
          EXISTS (
            SELECT 1 
            FROM store_teams st 
            WHERE st.store_id = s.id 
              AND st.user_id = :userId 
              AND st.status = 'active' 
              AND st.is_active = true
              AND st.role IN ('admin', 'editor')
          )
        )
      ORDER BY s.name ASC
    `;

    const stores = await sequelize.query(query, {
      replacements: { userId: userId },
      type: QueryTypes.SELECT
    });

    console.log(`✅ Returning ${stores.length} accessible stores for user ${userId}`);
    
    // Log each store for debugging
    stores.forEach(store => {
      console.log(`   - ${store.name} (${store.access_role}, owner: ${store.is_direct_owner})`);
    });

    return stores;

  } catch (error) {
    console.error('❌ Error fetching stores for dropdown:', error);
    console.error('❌ MAIN QUERY FAILED - this should not happen!');
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // DO NOT use fallback - return empty to identify the issue
    console.log('🚨 RETURNING EMPTY ARRAY TO IDENTIFY MAIN QUERY ISSUE');
    return [];
  }
}

/**
 * Check store access - ownership OR team membership with editor+ permissions
 * @param {string} userId - User ID to check access for
 * @param {string} storeId - Store ID to check access to
 * @returns {Promise<object|null>} Store access info or null if no access
 */
async function checkUserStoreAccess(userId, storeId) {
  try {
    console.log(`🔍 Checking access: user ${userId} to store ${storeId}`);
    
    const query = `
      SELECT 
        s.id,
        s.name,
        s.user_id as owner_id,
        CASE 
          WHEN s.user_id = :userId THEN 'owner'
          WHEN st.role IS NOT NULL THEN st.role
          ELSE NULL
        END as access_role,
        (s.user_id = :userId) as is_direct_owner,
        st.role as team_role,
        st.status as team_status
      FROM stores s
      LEFT JOIN store_teams st ON s.id = st.store_id 
          AND st.user_id = :userId 
          AND st.status = 'active' 
          AND st.is_active = true
      WHERE s.id = :storeId 
        AND s.is_active = true
        AND (
          s.user_id = :userId 
          OR (st.user_id = :userId AND st.role IN ('admin', 'editor'))
        )
    `;
    
    const result = await sequelize.query(query, {
      replacements: { storeId: storeId, userId: userId },
      type: QueryTypes.SELECT
    });

    const hasAccess = result.length > 0;
    console.log(`✅ Access check result: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
    
    if (hasAccess && result[0]) {
      console.log(`   Role: ${result[0].access_role}, Owner: ${result[0].is_direct_owner}`);
    }
    
    return hasAccess ? result[0] : null;
  } catch (error) {
    console.error('❌ Error checking store access:', error);
    return null;
  }
}

/**
 * Get all stores accessible to a user (owned or team member)
 * @param {string} userId - User ID to check access for
 * @param {object} options - Additional options
 * @returns {Promise<Array>} Array of accessible stores with access info
 */
async function getUserAccessibleStores(userId, options = {}) {
  return getUserStoresForDropdown(userId);
}

/**
 * Get count of stores accessible to a user
 * @param {string} userId - User ID to check access for
 * @param {object} options - Additional options
 * @returns {Promise<number>} Count of accessible stores
 */
async function getUserAccessibleStoresCount(userId, options = {}) {
  const stores = await getUserStoresForDropdown(userId);
  return stores.length;
}

module.exports = {
  getUserAccessibleStores,
  getUserAccessibleStoresCount,
  checkUserStoreAccess,
  getUserStoresForDropdown
};