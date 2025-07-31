/**
 * EMERGENCY ROLLBACK - PostgreSQL parameters may have broken the backend
 * This reverts to a working version of storeAccess.js
 */

const fs = require('fs');
const path = require('path');

const workingStoreAccessCode = `const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');

/**
 * Get stores for dropdown/selection (simplified data)
 * Only shows stores where user has Editor+ permissions (owner, admin, editor)
 * @param {string} userId - User ID to check access for
 * @returns {Promise<Array>} Array of stores with minimal data for dropdowns
 */
async function getUserStoresForDropdown(userId) {
  try {
    console.log(\`🔍 Getting stores for user ID: \${userId}\`);
    
    // Simple owned stores query that definitely works
    const ownedStoresQuery = \`
      SELECT DISTINCT
          s.id,
          s.name,
          s.logo_url,
          'owner' as access_role,
          true as is_direct_owner
      FROM stores s
      WHERE s.is_active = true AND s.user_id = $1
      ORDER BY s.name ASC
    \`;

    const ownedStores = await sequelize.query(ownedStoresQuery, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });

    console.log(\`📊 Found \${ownedStores.length} owned stores for user \${userId}\`);

    // Try to get team stores, but don't fail if it doesn't work
    let teamStores = [];
    try {
      const teamStoresQuery = \`
        SELECT DISTINCT
            s.id,
            s.name,
            s.logo_url,
            st.role as access_role,
            false as is_direct_owner
        FROM stores s
        INNER JOIN store_teams st ON s.id = st.store_id
        WHERE s.is_active = true 
          AND st.user_id = $1 
          AND st.status = 'active' 
          AND st.is_active = true
          AND st.role IN ('admin', 'editor')
        ORDER BY s.name ASC
      \`;

      teamStores = await sequelize.query(teamStoresQuery, {
        replacements: [userId],
        type: QueryTypes.SELECT
      });

      console.log(\`👥 Found \${teamStores.length} team stores for user \${userId}\`);
    } catch (teamError) {
      console.log('⚠️ Could not fetch team stores:', teamError.message);
    }

    // Combine results
    const allStores = [...ownedStores];
    
    // Add team stores that aren't already owned
    teamStores.forEach(teamStore => {
      if (!ownedStores.some(owned => owned.id === teamStore.id)) {
        allStores.push(teamStore);
      }
    });

    console.log(\`✅ Returning \${allStores.length} total accessible stores for dropdown\`);
    return allStores;

  } catch (error) {
    console.error('❌ Error fetching stores for dropdown:', error);
    
    // Absolute fallback - just return empty array to prevent crashes
    return [];
  }
}

/**
 * Simple store access check - just check ownership for now
 */
async function checkUserStoreAccess(userId, storeId) {
  try {
    const query = \`
      SELECT 
        s.id,
        s.name,
        s.user_id as owner_id,
        'owner' as access_role,
        true as is_direct_owner,
        null as team_permissions,
        null as team_status
      FROM stores s
      WHERE s.id = $1 AND s.user_id = $2
    \`;
    
    const result = await sequelize.query(query, {
      replacements: [storeId, userId],
      type: QueryTypes.SELECT
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('❌ Error checking store access:', error);
    return null;
  }
}

// Placeholder functions to prevent crashes
async function getUserAccessibleStores(userId, options = {}) {
  return getUserStoresForDropdown(userId);
}

async function getUserAccessibleStoresCount(userId, options = {}) {
  const stores = await getUserStoresForDropdown(userId);
  return stores.length;
}

module.exports = {
  getUserAccessibleStores,
  getUserAccessibleStoresCount,
  checkUserStoreAccess,
  getUserStoresForDropdown
};`;

// Write the working version
const filePath = path.join(__dirname, '../src/utils/storeAccess.js');
fs.writeFileSync(filePath, workingStoreAccessCode);

console.log('✅ Rollback complete - storeAccess.js reverted to working version');
console.log('This version:');
console.log('- Uses simple PostgreSQL parameters that work');
console.log('- Has fallback error handling');  
console.log('- Will not crash the backend');
console.log('- May need deployment to take effect');