/**
 * Analytics General Routes
 * Consent changes, session tracking, etc.
 */

const express = require('express');
const router = express.Router();
const eventBus = require('../services/analytics/EventBus');

/**
 * Track consent change
 * POST /api/analytics/consent-change
 */
router.post('/consent-change', async (req, res) => {
  try {
    const { categories_accepted, timestamp } = req.body;
    const sessionId = req.headers['x-session-id'] || req.session?.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
    }

    // Publish consent change event
    await eventBus.publish('consent_change', {
      session_id: sessionId,
      categories_accepted,
      timestamp: timestamp || new Date().toISOString(),
      user_agent: req.get('User-Agent'),
      ip_address: req.ip || req.connection.remoteAddress
    }, {
      source: 'consent_banner',
      priority: 'high' // High priority for compliance
    });

    res.json({
      success: true,
      message: 'Consent change tracked'
    });
  } catch (error) {
    console.error('[ANALYTICS] Consent change tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get event bus stats (admin only - add auth middleware as needed)
 * GET /api/analytics/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = eventBus.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[ANALYTICS] Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
