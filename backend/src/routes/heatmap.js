const express = require('express');
const router = express.Router();
const heatmapTrackingService = require('../services/heatmap-tracking');
const HeatmapInteraction = require('../models/HeatmapInteraction');
const HeatmapSession = require('../models/HeatmapSession');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const { heatmapLimiter, publicReadLimiter } = require('../middleware/rateLimiters');
const { validateRequest, heatmapInteractionSchema, heatmapBatchSchema } = require('../validation/analyticsSchemas');
const eventBus = require('../services/analytics/EventBus');

// Initialize handlers
require('../services/analytics/handlers/HeatmapHandler');

// Track individual interaction (Public - Rate Limited + Validated)
router.post('/track', heatmapLimiter, validateRequest(heatmapInteractionSchema), async (req, res) => {
  try {
    const {
      session_id,
      store_id,
      page_url,
      page_title,
      viewport_width,
      viewport_height,
      interaction_type,
      x_coordinate,
      y_coordinate,
      element_selector,
      element_tag,
      element_id,
      element_class,
      element_text,
      scroll_position,
      scroll_depth_percent,
      time_on_element,
      user_id,
      metadata = {}
    } = req.body;

    // Publish event to unified event bus
    const result = await eventBus.publish('heatmap_interaction', {
      session_id,
      store_id,
      user_id,
      page_url,
      page_title,
      viewport_width,
      viewport_height,
      interaction_type,
      x_coordinate,
      y_coordinate,
      element_selector,
      element_tag,
      element_id,
      element_class,
      element_text,
      scroll_position,
      scroll_depth_percent,
      time_on_element,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip || req.connection.remoteAddress,
      metadata
    }, {
      source: 'api',
      priority: 'low' // Heatmap data is lower priority
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      event_id: result.eventId,
      correlation_id: result.correlationId,
      duplicate: result.duplicate || false
    });
  } catch (error) {
    console.error('[HEATMAP ERROR]', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      store_id: req.body?.store_id
    });
    res.status(500).json({ success: false, error: 'Server error while tracking interaction' });
  }
});

// Track batch of interactions (Public - Rate Limited + Validated)
router.post('/track-batch', heatmapLimiter, validateRequest(heatmapBatchSchema), async (req, res) => {
  try {
    const { interactions } = req.body;

    // Publish each interaction to event bus
    const results = await Promise.all(
      interactions.map(interaction =>
        eventBus.publish('heatmap_interaction', {
          ...interaction,
          user_agent: req.get('User-Agent'),
          ip_address: req.ip || req.connection.remoteAddress
        }, {
          source: 'api_batch',
          priority: 'low'
        })
      )
    );

    const successCount = results.filter(r => r.success).length;
    const duplicateCount = results.filter(r => r.duplicate).length;

    res.json({
      success: true,
      processed: successCount,
      duplicates: duplicateCount,
      total: interactions.length
    });
  } catch (error) {
    console.error('[HEATMAP BATCH ERROR]', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      batch_size: req.body?.interactions?.length
    });
    res.status(500).json({ success: false, error: 'Server error while tracking batch' });
  }
});

// Get heatmap data for visualization (requires authentication)
router.get('/data/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      page_url,
      start_date,
      end_date,
      interaction_types,
      viewport_width = 1920,
      viewport_height = 1080,
      device_types
    } = req.query;

    if (!page_url) {
      return res.status(400).json({
        success: false,
        error: 'page_url parameter is required'
      });
    }

    const options = {
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      interactionTypes: interaction_types ? interaction_types.split(',') : ['click', 'hover'],
      viewportWidth: parseInt(viewport_width),
      viewportHeight: parseInt(viewport_height),
      deviceTypes: device_types ? device_types.split(',') : ['desktop', 'tablet', 'mobile']
    };

    const heatmapData = await heatmapTrackingService.getHeatmapData(storeId, page_url, options);

    res.json({
      success: true,
      data: heatmapData,
      meta: {
        page_url,
        viewport: { width: options.viewportWidth, height: options.viewportHeight },
        filters: options
      }
    });
  } catch (error) {
    console.error('Error getting heatmap data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session analytics (requires authentication)
router.get('/analytics/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      start_date,
      end_date,
      device_type
    } = req.query;

    const options = {
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      deviceType: device_type || null
    };

    const analytics = await heatmapTrackingService.getSessionAnalytics(storeId, options);

    res.json({
      success: true,
      data: analytics,
      meta: {
        store_id: storeId,
        filters: options
      }
    });
  } catch (error) {
    console.error('Error getting session analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get real-time stats (requires authentication)
router.get('/realtime/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { time_window = 300000 } = req.query; // 5 minutes default

    const stats = await heatmapTrackingService.getRealTimeStats(storeId, parseInt(time_window));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting real-time heatmap stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get interaction summary (requires authentication)
router.get('/summary/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      start_date,
      end_date,
      group_by = 'page_url'
    } = req.query;

    const options = {
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      groupBy: group_by
    };

    const summary = await HeatmapInteraction.getHeatmapSummary(storeId, options);

    res.json({
      success: true,
      data: summary,
      meta: {
        store_id: storeId,
        group_by,
        filters: options
      }
    });
  } catch (error) {
    console.error('Error getting heatmap summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top pages by interactions (requires authentication)
router.get('/top-pages/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      start_date,
      end_date,
      limit = 10
    } = req.query;

    const options = {
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      limit: parseInt(limit)
    };

    const topPages = await HeatmapSession.getTopPages(storeId, options);

    res.json({
      success: true,
      data: topPages,
      meta: {
        store_id: storeId,
        limit: options.limit,
        filters: options
      }
    });
  } catch (error) {
    console.error('Error getting top pages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get interaction details for specific coordinates (requires authentication)
router.get('/interactions/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      page_url,
      x_coordinate,
      y_coordinate,
      start_date,
      end_date,
      interaction_type,
      limit = 50
    } = req.query;

    if (!page_url) {
      return res.status(400).json({
        success: false,
        error: 'page_url parameter is required'
      });
    }

    const whereClause = {
      store_id: storeId,
      page_url
    };

    if (x_coordinate && y_coordinate) {
      whereClause.x_coordinate = parseInt(x_coordinate);
      whereClause.y_coordinate = parseInt(y_coordinate);
    }

    if (interaction_type) {
      whereClause.interaction_type = interaction_type;
    }

    if (start_date && end_date) {
      whereClause.timestamp_utc = {
        [HeatmapInteraction.sequelize.Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const interactions = await HeatmapInteraction.findAll({
      where: whereClause,
      order: [['timestamp_utc', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: interactions,
      meta: {
        store_id: storeId,
        page_url,
        count: interactions.length
      }
    });
  } catch (error) {
    console.error('Error getting interaction details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clean up old data (admin only)
router.delete('/cleanup/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { retention_days = 90 } = req.query;

    // Additional check - only allow store owners to cleanup their own data
    if (req.user.role !== 'admin' && req.user.role !== 'store_owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions for data cleanup'
      });
    }

    const result = await heatmapTrackingService.cleanupOldData(parseInt(retention_days));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error cleaning up heatmap data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;