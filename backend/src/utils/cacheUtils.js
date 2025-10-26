const { getCacheConfig } = require('./storeCache');

/**
 * Apply HTTP cache headers based on store settings (uses cache)
 * @param {Response} res - Express response object
 * @param {string} store_id - Store UUID
 * @returns {Promise<void>}
 */
const applyCacheHeaders = async (res, store_id) => {
  try {
    const { enabled, duration } = await getCacheConfig(store_id);

    if (enabled && duration > 0) {
      // Apply cache with configured duration
      const staleWhileRevalidate = Math.min(duration * 3, 600); // Max 10 minutes
      res.set({
        'Cache-Control': `public, max-age=${duration}, stale-while-revalidate=${staleWhileRevalidate}`,
        'Vary': 'X-Language'
      });
    } else {
      // Cache disabled or duration = 0
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Vary': 'X-Language'
      });
    }
  } catch (error) {
    // Fallback to default cache if store lookup fails
    console.warn('Failed to load cache settings for store:', store_id, error.message);
    res.set({
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=180',
      'Vary': 'X-Language'
    });
  }
};

/**
 * Get cache settings for a store (without applying to response)
 * Useful for checking cache configuration programmatically
 * @param {string} store_id - Store UUID
 * @returns {Promise<Object>} Cache settings object
 */
const getCacheSettings = async (store_id) => {
  return await getCacheConfig(store_id);
};

module.exports = {
  applyCacheHeaders,
  getCacheSettings
};
