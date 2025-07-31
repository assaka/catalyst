const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');

/**
 * SIMPLE dropdown stores - only owned stores for now
 * @param {string} userId - User ID to check access for
 * @returns {Promise<Array>} Array of stores with minimal data for dropdowns
 */
async function getUserStoresForDropdown(userId) {
  try {
    console.log(`🔍 Getting owned stores for user ID: ${userId}`);
    
    // ONLY owned stores - using Sequelize named replacements
    const query = `
      SELECT 
          s.id,
          s.name,
          s.logo_url,
          'owner' as access_role,
          true as is_direct_owner
      FROM stores s
      WHERE s.is_active = true 
        AND s.user_id = :userId
      ORDER BY s.name ASC
    `;

    const stores = await sequelize.query(query, {
      replacements: { userId: userId },
      type: QueryTypes.SELECT
    });

    console.log(`✅ Returning ${stores.length} owned stores for user ${userId}`);
    
    // Log each store for debugging
    stores.forEach(store => {
      console.log(`   - ${store.name} (${store.access_role})`);
    });

    return stores;

  } catch (error) {
    console.error('❌ Error fetching stores for dropdown:', error);
    console.error('Error details:', error);
    return [];
  }
}

/**
 * SIMPLE store access check - only ownership
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
        'owner' as access_role,
        true as is_direct_owner
      FROM stores s
      WHERE s.id = :storeId AND s.user_id = :userId AND s.is_active = true
    `;
    
    const result = await sequelize.query(query, {
      replacements: { storeId: storeId, userId: userId },
      type: QueryTypes.SELECT
    });

    const hasAccess = result.length > 0;
    console.log(`✅ Access check result: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
    
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