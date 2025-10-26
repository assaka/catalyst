/**
 * Store Settings Cache
 *
 * In-memory cache for store settings to avoid repeated database queries
 * Cache expires after 5 minutes or can be manually invalidated
 */

const { Store } = require('../models');

// In-memory cache: { store_id: { settings: {...}, timestamp: Date } }
const storeCache = new Map();

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get store settings with caching
 *
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Store settings object
 */
async function getStoreSettings(storeId) {
  if (!storeId) return {};

  const now = Date.now();
  const cached = storeCache.get(storeId);

  // Return cached if valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.settings;
  }

  // Fetch from database
  try {
    const store = await Store.findByPk(storeId, {
      attributes: ['settings']
    });

    const settings = store?.settings || {};

    // Cache the result
    storeCache.set(storeId, {
      settings,
      timestamp: now
    });

    return settings;
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return {};
  }
}

/**
 * Invalidate cache for a specific store
 *
 * @param {string} storeId - Store ID to invalidate
 */
function invalidateStore(storeId) {
  storeCache.delete(storeId);
}

/**
 * Clear entire cache
 */
function clearCache() {
  storeCache.clear();
}

/**
 * Get cache statistics
 *
 * @returns {Object} Cache stats
 */
function getCacheStats() {
  return {
    size: storeCache.size,
    stores: Array.from(storeCache.keys()),
    ttl: CACHE_TTL
  };
}

module.exports = {
  getStoreSettings,
  invalidateStore,
  clearCache,
  getCacheStats
};
