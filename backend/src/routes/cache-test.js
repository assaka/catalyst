const express = require('express');
const router = express.Router();
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

/**
 * Test endpoint to verify cache middleware is working
 */
router.get('/test', cacheMiddleware({
  prefix: 'test',
  ttl: 60
}), (req, res) => {
  res.json({
    success: true,
    message: 'Cache test endpoint',
    timestamp: new Date().toISOString(),
    random: Math.random(),
    note: 'If X-Cache header appears, caching is working!'
  });
});

/**
 * Clear cache for a specific store's bootstrap
 * GET /api/cache-test/clear-bootstrap/:slug
 */
router.get('/clear-bootstrap/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { deletePattern } = require('../utils/cacheManager');

    const deletedCount = await deletePattern(`bootstrap:${slug}:*`);

    res.json({
      success: true,
      message: `Bootstrap cache cleared for store: ${slug}`,
      slug: slug,
      deletedKeys: deletedCount
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

module.exports = router;
