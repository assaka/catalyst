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

module.exports = router;
