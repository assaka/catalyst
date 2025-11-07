const axios = require('axios');

/**
 * Cloudflare CDN Configuration
 * Provides cache purge and image optimization capabilities
 */

const cloudflareConfig = {
  zoneId: process.env.CLOUDFLARE_ZONE_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  imagesEnabled: process.env.CLOUDFLARE_IMAGES_ENABLED === 'true',
  cdnDomain: process.env.CLOUDFLARE_CDN_DOMAIN || process.env.FRONTEND_URL,
};

/**
 * Check if Cloudflare is configured
 * @returns {boolean}
 */
function isCloudflareConfigured() {
  return !!(cloudflareConfig.zoneId && cloudflareConfig.apiToken);
}

/**
 * Get Cloudflare API headers
 * @returns {object}
 */
function getHeaders() {
  return {
    'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Purge cache for specific URLs
 * @param {string[]} urls - Array of URLs to purge
 * @returns {Promise<object>}
 */
async function purgeUrls(urls) {
  if (!isCloudflareConfigured()) {
    console.warn('Cloudflare: Not configured, skipping cache purge');
    return { success: false, message: 'Cloudflare not configured' };
  }

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${cloudflareConfig.zoneId}/purge_cache`,
      { files: urls },
      { headers: getHeaders() }
    );

    if (response.data.success) {
      console.log(`Cloudflare: Purged ${urls.length} URLs from cache`);
      return { success: true, purged: urls.length };
    } else {
      console.error('Cloudflare: Cache purge failed:', response.data.errors);
      return { success: false, errors: response.data.errors };
    }
  } catch (error) {
    console.error('Cloudflare: Cache purge error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Purge cache by tags
 * @param {string[]} tags - Array of cache tags to purge
 * @returns {Promise<object>}
 */
async function purgeTags(tags) {
  if (!isCloudflareConfigured()) {
    console.warn('Cloudflare: Not configured, skipping cache purge');
    return { success: false, message: 'Cloudflare not configured' };
  }

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${cloudflareConfig.zoneId}/purge_cache`,
      { tags },
      { headers: getHeaders() }
    );

    if (response.data.success) {
      console.log(`Cloudflare: Purged cache for tags: ${tags.join(', ')}`);
      return { success: true, tags };
    } else {
      console.error('Cloudflare: Tag purge failed:', response.data.errors);
      return { success: false, errors: response.data.errors };
    }
  } catch (error) {
    console.error('Cloudflare: Tag purge error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Purge everything in the zone
 * @returns {Promise<object>}
 */
async function purgeEverything() {
  if (!isCloudflareConfigured()) {
    console.warn('Cloudflare: Not configured, skipping cache purge');
    return { success: false, message: 'Cloudflare not configured' };
  }

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${cloudflareConfig.zoneId}/purge_cache`,
      { purge_everything: true },
      { headers: getHeaders() }
    );

    if (response.data.success) {
      console.log('Cloudflare: Purged all cache');
      return { success: true };
    } else {
      console.error('Cloudflare: Purge everything failed:', response.data.errors);
      return { success: false, errors: response.data.errors };
    }
  } catch (error) {
    console.error('Cloudflare: Purge everything error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Upload image to Cloudflare Images
 * @param {Buffer|string} imageData - Image buffer or URL
 * @param {string} id - Optional custom ID for the image
 * @param {object} metadata - Optional metadata
 * @returns {Promise<object>}
 */
async function uploadImage(imageData, id = null, metadata = {}) {
  if (!cloudflareConfig.imagesEnabled || !cloudflareConfig.accountId) {
    console.warn('Cloudflare Images: Not enabled or account ID missing');
    return { success: false, message: 'Cloudflare Images not configured' };
  }

  try {
    const FormData = require('form-data');
    const form = new FormData();

    if (Buffer.isBuffer(imageData)) {
      form.append('file', imageData, 'image');
    } else if (typeof imageData === 'string') {
      form.append('url', imageData);
    }

    if (id) {
      form.append('id', id);
    }

    if (Object.keys(metadata).length > 0) {
      form.append('metadata', JSON.stringify(metadata));
    }

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/images/v1`,
      form,
      {
        headers: {
          ...getHeaders(),
          ...form.getHeaders(),
        },
      }
    );

    if (response.data.success) {
      console.log('Cloudflare Images: Image uploaded successfully');
      return {
        success: true,
        id: response.data.result.id,
        url: response.data.result.variants[0],
        variants: response.data.result.variants,
      };
    } else {
      console.error('Cloudflare Images: Upload failed:', response.data.errors);
      return { success: false, errors: response.data.errors };
    }
  } catch (error) {
    console.error('Cloudflare Images: Upload error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Delete image from Cloudflare Images
 * @param {string} imageId - Image ID to delete
 * @returns {Promise<object>}
 */
async function deleteImage(imageId) {
  if (!cloudflareConfig.imagesEnabled || !cloudflareConfig.accountId) {
    console.warn('Cloudflare Images: Not enabled or account ID missing');
    return { success: false, message: 'Cloudflare Images not configured' };
  }

  try {
    const response = await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/images/v1/${imageId}`,
      { headers: getHeaders() }
    );

    if (response.data.success) {
      console.log(`Cloudflare Images: Image ${imageId} deleted`);
      return { success: true };
    } else {
      console.error('Cloudflare Images: Delete failed:', response.data.errors);
      return { success: false, errors: response.data.errors };
    }
  } catch (error) {
    console.error('Cloudflare Images: Delete error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Set CDN cache headers on response
 * @param {object} res - Express response object
 * @param {object} options - Cache options
 * @param {number} options.maxAge - Max age in seconds (default: 3600)
 * @param {number} options.sMaxAge - Shared max age (CDN) in seconds
 * @param {boolean} options.public - Cache publicly (default: true)
 * @param {boolean} options.staleWhileRevalidate - Stale while revalidate in seconds
 * @param {string[]} options.tags - Cache tags for purging
 */
function setCdnCacheHeaders(res, options = {}) {
  const {
    maxAge = 3600,
    sMaxAge = maxAge * 2,
    public: isPublic = true,
    staleWhileRevalidate = 86400, // 24 hours
    tags = [],
  } = options;

  const cacheControl = [
    isPublic ? 'public' : 'private',
    `max-age=${maxAge}`,
    `s-maxage=${sMaxAge}`,
    staleWhileRevalidate ? `stale-while-revalidate=${staleWhileRevalidate}` : null,
  ].filter(Boolean).join(', ');

  res.setHeader('Cache-Control', cacheControl);

  // Add cache tags for Cloudflare
  if (tags.length > 0) {
    res.setHeader('Cache-Tag', tags.join(','));
  }

  // Add vary header for proper caching
  res.setHeader('Vary', 'Accept-Encoding, Accept-Language');
}

/**
 * Middleware to set CDN cache headers
 * @param {object} options - Cache options
 * @returns {function} Express middleware
 */
function cdnCacheMiddleware(options = {}) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method === 'GET') {
      setCdnCacheHeaders(res, options);
    }
    next();
  };
}

/**
 * Invalidate product CDN cache
 * @param {number} storeId - Store ID
 * @param {number} productId - Product ID (optional)
 * @returns {Promise<void>}
 */
async function invalidateProductCache(storeId, productId = null) {
  const tags = [`store-${storeId}`, 'products'];
  if (productId) {
    tags.push(`product-${productId}`);
  }

  await purgeTags(tags);
}

/**
 * Invalidate category CDN cache
 * @param {number} storeId - Store ID
 * @returns {Promise<void>}
 */
async function invalidateCategoryCache(storeId) {
  await purgeTags([`store-${storeId}`, 'categories']);
}

module.exports = {
  // Configuration
  isCloudflareConfigured,
  cloudflareConfig,

  // Cache purge
  purgeUrls,
  purgeTags,
  purgeEverything,

  // Image management
  uploadImage,
  deleteImage,

  // Cache headers
  setCdnCacheHeaders,
  cdnCacheMiddleware,

  // Invalidation helpers
  invalidateProductCache,
  invalidateCategoryCache,
};
