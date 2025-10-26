/**
 * Store Settings and Cache Configuration Cache
 *
 * In-memory cache for store settings and cache configuration
 * to avoid repeated database queries. Integrates with cacheUtils.
 * Cache expires after 5 minutes or can be manually invalidated.
 */

const { Store } = require('../models');

// In-memory cache: { store_id: { settings: {...}, cacheConfig: {...}, timestamp: Date } }
const storeCache = new Map();

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get complete store data with caching (settings + cache config)
 *
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} { settings, cacheConfig }
 */
async function getStoreData(storeId) {
  if (!storeId) return { settings: {}, cacheConfig: { enabled: true, duration: 60 } };

  const now = Date.now();
  const cached = storeCache.get(storeId);

  // Return cached if valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return { settings: cached.settings, cacheConfig: cached.cacheConfig };
  }

  // Fetch from database
  try {
    const store = await Store.findByPk(storeId, {
      attributes: ['settings']
    });

    const settings = store?.settings || {};
    const cacheSettings = settings.cache || {};
    const cacheConfig = {
      enabled: cacheSettings.enabled !== false,
      duration: cacheSettings.duration || 60
    };

    // Cache the result
    storeCache.set(storeId, {
      settings,
      cacheConfig,
      timestamp: now
    });

    return { settings, cacheConfig };
  } catch (error) {
    console.error('Error fetching store data:', error);
    return { settings: {}, cacheConfig: { enabled: true, duration: 60 } };
  }
}

/**
 * Get store settings with caching
 *
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Store settings object
 */
async function getStoreSettings(storeId) {
  const { settings } = await getStoreData(storeId);
  return settings;
}

/**
 * Get cache configuration for a store
 *
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} { enabled, duration }
 */
async function getCacheConfig(storeId) {
  const { cacheConfig } = await getStoreData(storeId);
  return cacheConfig;
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
  getStoreData,
  getStoreSettings,
  getCacheConfig,
  invalidateStore,
  clearCache,
  getCacheStats
};
