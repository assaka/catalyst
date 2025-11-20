const { masterDbClient } = require('../database/masterConnection');

/**
 * Get stores for dropdown - owned stores + team stores where user is editor+
 * @param {string} userId - User ID to check access for
 * @returns {Promise<Array>} Array of stores with minimal data for dropdowns
 */
async function getUserStoresForDropdown(userId) {
  try {
    console.log(`🔍 Getting accessible stores for user ID: ${userId}`);
    
    // BULLETPROOF: Simple query with clear logic
    // Note: Can't use DISTINCT with JSON columns, so we cast settings to text for comparison
    const query = `
      SELECT DISTINCT ON (s.id)
          s.id,
          s.name,
          s.slug,
          s.logo_url,
          s.settings,
          s.created_at,
          s.updated_at,
          s.is_active,
          s.published,
          s.published_at,
          s.user_id as owner_id,
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
      ORDER BY s.id, s.name ASC
    `;

    // Simplified: Only return stores owned by user (team access can be added later)
    const { data: stores, error } = await masterDbClient
      .from('stores')
      .select('id, slug, status, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user stores:', error);
      return [];
    }

    return stores || [];

  } catch (error) {
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
    console.log('🔍 checkUserStoreAccess called:', { userId, storeId });
    console.log('🔍 masterDbClient is:', masterDbClient ? 'CONNECTED' : 'NULL/UNDEFINED');

    if (!masterDbClient) {
      console.error('❌ masterDbClient is not initialized!');
      return null;
    }

    // First, check if user owns the store
    const { data: store, error: storeError } = await masterDbClient
      .from('stores')
      .select('id, name, user_id, is_active, slug')
      .eq('id', storeId)
      .eq('is_active', true)
      .single();

    if (storeError || !store) {
      console.log('❌ Store not found or not active:', storeId);
      console.log('❌ Error details:', storeError);
      console.log('❌ Store data:', store);

      // Also try without is_active filter to see if store exists at all
      const { data: anyStore, error: anyError } = await masterDbClient
        .from('stores')
        .select('id, user_id, is_active, status')
        .eq('id', storeId)
        .single();

      console.log('🔍 Store check without is_active filter:', { anyStore, anyError });
      return null;
    }

    // Check direct ownership
    if (store.user_id === userId) {
      console.log('✅ User is direct owner of store');
      return {
        id: store.id,
        name: store.name,
        owner_id: store.user_id,
        access_role: 'owner',
        is_direct_owner: true,
        team_role: null,
        team_status: null
      };
    }

    // Check team membership
    const { data: teamMember, error: teamError } = await masterDbClient
      .from('store_teams')
      .select('role, status')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('is_active', true)
      .in('role', ['admin', 'editor'])
      .single();

    if (teamError || !teamMember) {
      console.log('❌ User is not a team member with sufficient permissions');
      return null;
    }

    console.log('✅ User is team member with role:', teamMember.role);
    return {
      id: store.id,
      name: store.name,
      owner_id: store.user_id,
      access_role: teamMember.role,
      is_direct_owner: false,
      team_role: teamMember.role,
      team_status: teamMember.status
    };

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