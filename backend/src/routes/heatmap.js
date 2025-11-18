const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const { heatmapLimiter, publicReadLimiter } = require('../middleware/rateLimiters');
const { validateRequest, heatmapInteractionSchema, heatmapBatchSchema } = require('../validation/analyticsSchemas');
const { attachConsentInfo, sanitizeEventData } = require('../middleware/consentMiddleware');
const eventBus = require('../services/analytics/EventBus');
const screenshotService = require('../services/screenshot-service');

// Initialize handlers
require('../services/analytics/handlers/HeatmapHandler');

// Apply consent middleware to all routes
router.use(attachConsentInfo);

// Track individual interaction (Public - Rate Limited + Validated + Consent-aware)
router.post('/track', heatmapLimiter, validateRequest(heatmapInteractionSchema), sanitizeEventData, async (req, res) => {
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

// Track batch of interactions (Public - Rate Limited + Validated + Consent-aware)
router.post('/track-batch', heatmapLimiter, validateRequest(heatmapBatchSchema), sanitizeEventData, async (req, res) => {
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

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

    const options = {
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      interactionTypes: interaction_types ? interaction_types.split(',') : ['click', 'hover'],
      viewportWidth: parseInt(viewport_width),
      viewportHeight: parseInt(viewport_height),
      deviceTypes: device_types ? device_types.split(',') : ['desktop', 'tablet', 'mobile']
    };

    const heatmapData = await HeatmapInteraction.getHeatmapData(storeId, page_url, options);

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

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapSession } = connection.models;

    const options = {
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      deviceType: device_type || null
    };

    const analytics = await HeatmapSession.getSessionAnalytics(storeId, options);

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
    const timeWindow = parseInt(time_window);

    const startTime = new Date(Date.now() - timeWindow);

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

    const stats = await HeatmapInteraction.findAll({
      where: {
        store_id: storeId,
        timestamp_utc: {
          [Op.gte]: startTime
        }
      },
      attributes: [
        'interaction_type',
        [HeatmapInteraction.sequelize.fn('COUNT', '*'), 'count'],
        [HeatmapInteraction.sequelize.fn('COUNT', HeatmapInteraction.sequelize.fn('DISTINCT', HeatmapInteraction.sequelize.col('session_id'))), 'unique_sessions']
      ],
      group: ['interaction_type'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        time_window: timeWindow,
        start_time: startTime,
        stats
      }
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

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

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

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapSession } = connection.models;

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

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

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
        [Op.between]: [new Date(start_date), new Date(end_date)]
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

// Get element click rankings (requires authentication)
router.get('/element-rankings/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      page_url,
      start_date,
      end_date,
      limit = 20
    } = req.query;

    if (!page_url) {
      return res.status(400).json({
        success: false,
        error: 'page_url parameter is required'
      });
    }

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

    const whereClause = {
      store_id: storeId,
      page_url,
      interaction_type: ['click', 'touch'], // Focus on click/touch interactions
      element_selector: {
        [Op.ne]: null // Only include elements with selectors
      }
    };

    if (start_date && end_date) {
      whereClause.timestamp_utc = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const rankings = await HeatmapInteraction.findAll({
      where: whereClause,
      attributes: [
        'element_selector',
        'element_tag',
        'element_id',
        'element_class',
        'element_text',
        [HeatmapInteraction.sequelize.fn('COUNT', '*'), 'click_count'],
        [HeatmapInteraction.sequelize.fn('COUNT', HeatmapInteraction.sequelize.fn('DISTINCT', HeatmapInteraction.sequelize.col('session_id'))), 'unique_users'],
        [HeatmapInteraction.sequelize.fn('AVG', HeatmapInteraction.sequelize.col('x_coordinate')), 'avg_x'],
        [HeatmapInteraction.sequelize.fn('AVG', HeatmapInteraction.sequelize.col('y_coordinate')), 'avg_y']
      ],
      group: ['element_selector', 'element_tag', 'element_id', 'element_class', 'element_text'],
      order: [[HeatmapInteraction.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: parseInt(limit),
      raw: true
    });

    res.json({
      success: true,
      data: rankings,
      meta: {
        store_id: storeId,
        page_url,
        count: rankings.length
      }
    });
  } catch (error) {
    console.error('Error getting element rankings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session list with details (requires authentication)
router.get('/sessions/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      page_url,
      start_date,
      end_date,
      device_type,
      limit = 50,
      offset = 0
    } = req.query;

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

    const whereClause = {
      store_id: storeId
    };

    if (page_url) {
      whereClause.page_url = page_url;
    }

    if (device_type && device_type !== 'all') {
      whereClause.device_type = device_type;
    }

    if (start_date && end_date) {
      whereClause.timestamp_utc = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // Get unique sessions with aggregated data
    const sessions = await HeatmapInteraction.findAll({
      where: whereClause,
      attributes: [
        'session_id',
        'user_id',
        'device_type',
        'user_agent',
        [HeatmapInteraction.sequelize.fn('MIN', HeatmapInteraction.sequelize.col('timestamp_utc')), 'session_start'],
        [HeatmapInteraction.sequelize.fn('MAX', HeatmapInteraction.sequelize.col('timestamp_utc')), 'session_end'],
        [HeatmapInteraction.sequelize.fn('COUNT', '*'), 'interaction_count'],
        [HeatmapInteraction.sequelize.fn('COUNT', HeatmapInteraction.sequelize.fn('DISTINCT', HeatmapInteraction.sequelize.col('page_url'))), 'pages_visited'],
        [HeatmapInteraction.sequelize.fn('COUNT', HeatmapInteraction.sequelize.literal("CASE WHEN interaction_type = 'click' THEN 1 END")), 'click_count'],
        [HeatmapInteraction.sequelize.fn('COUNT', HeatmapInteraction.sequelize.literal("CASE WHEN interaction_type = 'scroll' THEN 1 END")), 'scroll_count']
      ],
      group: ['session_id', 'user_id', 'device_type', 'user_agent'],
      order: [[HeatmapInteraction.sequelize.fn('MIN', HeatmapInteraction.sequelize.col('timestamp_utc')), 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      raw: true
    });

    // Calculate session duration for each
    const sessionsWithDuration = sessions.map(session => ({
      ...session,
      duration_ms: new Date(session.session_end) - new Date(session.session_start),
      duration_seconds: Math.round((new Date(session.session_end) - new Date(session.session_start)) / 1000)
    }));

    res.json({
      success: true,
      data: sessionsWithDuration,
      meta: {
        store_id: storeId,
        count: sessionsWithDuration.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session details and timeline (requires authentication)
router.get('/sessions/:storeId/:sessionId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, sessionId } = req.params;

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

    // Get all interactions for this session
    const interactions = await HeatmapInteraction.findAll({
      where: {
        store_id: storeId,
        session_id: sessionId
      },
      order: [['timestamp_utc', 'ASC']],
      raw: true
    });

    if (interactions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Group by page URL to show page flow
    const pageFlow = [];
    const pageMap = {};

    interactions.forEach(interaction => {
      if (!pageMap[interaction.page_url]) {
        pageMap[interaction.page_url] = {
          page_url: interaction.page_url,
          page_title: interaction.page_title,
          first_visit: interaction.timestamp_utc,
          last_visit: interaction.timestamp_utc,
          interactions: []
        };
        pageFlow.push(pageMap[interaction.page_url]);
      }

      pageMap[interaction.page_url].interactions.push(interaction);
      pageMap[interaction.page_url].last_visit = interaction.timestamp_utc;
    });

    // Calculate time on each page
    pageFlow.forEach((page, index) => {
      if (index < pageFlow.length - 1) {
        page.time_on_page_ms = new Date(pageFlow[index + 1].first_visit) - new Date(page.first_visit);
      } else {
        page.time_on_page_ms = new Date(page.last_visit) - new Date(page.first_visit);
      }
      page.time_on_page_seconds = Math.round(page.time_on_page_ms / 1000);
    });

    const sessionSummary = {
      session_id: sessionId,
      start_time: interactions[0].timestamp_utc,
      end_time: interactions[interactions.length - 1].timestamp_utc,
      duration_ms: new Date(interactions[interactions.length - 1].timestamp_utc) - new Date(interactions[0].timestamp_utc),
      total_interactions: interactions.length,
      pages_visited: pageFlow.length,
      device_type: interactions[0].device_type,
      user_agent: interactions[0].user_agent,
      user_id: interactions[0].user_id
    };

    res.json({
      success: true,
      data: {
        summary: sessionSummary,
        pageFlow: pageFlow,
        interactions: interactions
      }
    });
  } catch (error) {
    console.error('Error getting session details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get time-on-page analytics (requires authentication)
router.get('/time-on-page/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      page_url,
      start_date,
      end_date
    } = req.query;

    if (!page_url) {
      return res.status(400).json({
        success: false,
        error: 'page_url parameter is required'
      });
    }

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

    const whereClause = {
      store_id: storeId
    };

    if (start_date && end_date) {
      whereClause.timestamp_utc = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // Get all sessions for this page with their durations
    const sessions = await HeatmapInteraction.findAll({
      where: whereClause,
      attributes: [
        'session_id',
        [HeatmapInteraction.sequelize.fn('MIN', HeatmapInteraction.sequelize.col('timestamp_utc')), 'session_start'],
        [HeatmapInteraction.sequelize.fn('MAX', HeatmapInteraction.sequelize.col('timestamp_utc')), 'session_end']
      ],
      group: ['session_id'],
      having: HeatmapInteraction.sequelize.where(
        HeatmapInteraction.sequelize.fn('COUNT', HeatmapInteraction.sequelize.col('page_url')),
        {
          [Op.gte]: 1
        }
      ),
      raw: true
    });

    // Filter for the specific page URL and calculate durations
    const pageSessions = [];

    for (const session of sessions) {
      // Check if this session has interactions on the target page
      const pageInteractions = await HeatmapInteraction.findAll({
        where: {
          store_id: storeId,
          session_id: session.session_id,
          page_url: page_url
        },
        attributes: ['timestamp_utc'],
        order: [['timestamp_utc', 'ASC']],
        raw: true
      });

      if (pageInteractions.length > 0) {
        const firstInteraction = new Date(pageInteractions[0].timestamp_utc);
        const lastInteraction = new Date(pageInteractions[pageInteractions.length - 1].timestamp_utc);
        const durationSeconds = (lastInteraction - firstInteraction) / 1000;

        // Only include sessions with reasonable durations (> 0 and < 1 hour)
        if (durationSeconds > 0 && durationSeconds < 3600) {
          pageSessions.push({
            session_id: session.session_id,
            duration_seconds: durationSeconds
          });
        }
      }
    }

    if (pageSessions.length === 0) {
      return res.json({
        success: true,
        data: {
          total_sessions: 0,
          avg_time_seconds: 0,
          median_time_seconds: 0,
          max_time_seconds: 0,
          min_time_seconds: 0,
          time_buckets: []
        }
      });
    }

    // Calculate statistics
    const durations = pageSessions.map(s => s.duration_seconds).sort((a, b) => a - b);
    const totalSessions = durations.length;
    const avgTime = durations.reduce((a, b) => a + b, 0) / totalSessions;
    const medianTime = durations[Math.floor(totalSessions / 2)];
    const maxTime = Math.max(...durations);
    const minTime = Math.min(...durations);

    // Create time buckets
    const timeBuckets = [
      { label: '0-10 seconds', min: 0, max: 10, count: 0 },
      { label: '10-30 seconds', min: 10, max: 30, count: 0 },
      { label: '30-60 seconds', min: 30, max: 60, count: 0 },
      { label: '1-2 minutes', min: 60, max: 120, count: 0 },
      { label: '2-5 minutes', min: 120, max: 300, count: 0 },
      { label: '5+ minutes', min: 300, max: Infinity, count: 0 }
    ];

    durations.forEach(duration => {
      const bucket = timeBuckets.find(b => duration >= b.min && duration < b.max);
      if (bucket) bucket.count++;
    });

    // Calculate percentages
    timeBuckets.forEach(bucket => {
      bucket.percentage = (bucket.count / totalSessions) * 100;
    });

    res.json({
      success: true,
      data: {
        total_sessions: totalSessions,
        avg_time_seconds: Math.round(avgTime * 10) / 10,
        median_time_seconds: Math.round(medianTime * 10) / 10,
        max_time_seconds: Math.round(maxTime * 10) / 10,
        min_time_seconds: Math.round(minTime * 10) / 10,
        time_buckets: timeBuckets.filter(b => b.count > 0)
      },
      meta: {
        store_id: storeId,
        page_url
      }
    });
  } catch (error) {
    console.error('Error getting time-on-page analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scroll depth analytics (requires authentication)
router.get('/scroll-depth/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      page_url,
      start_date,
      end_date,
      bucket_size = 10 // Group by 10% buckets
    } = req.query;

    if (!page_url) {
      return res.status(400).json({
        success: false,
        error: 'page_url parameter is required'
      });
    }

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction } = connection.models;

    const whereClause = {
      store_id: storeId,
      page_url,
      interaction_type: 'scroll',
      scroll_depth_percent: {
        [Op.ne]: null
      }
    };

    if (start_date && end_date) {
      whereClause.timestamp_utc = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // Get all scroll interactions
    const scrollData = await HeatmapInteraction.findAll({
      where: whereClause,
      attributes: ['session_id', 'scroll_depth_percent'],
      raw: true
    });

    if (scrollData.length === 0) {
      return res.json({
        success: true,
        data: [],
        meta: {
          store_id: storeId,
          page_url,
          total_sessions: 0,
          bucket_size: parseInt(bucket_size),
          message: 'No scroll interactions found for this page'
        }
      });
    }

    // Group sessions by maximum scroll depth reached
    const sessionMaxDepths = {};
    scrollData.forEach(record => {
      const sessionId = record.session_id;
      const depth = parseFloat(record.scroll_depth_percent);

      if (!sessionMaxDepths[sessionId] || depth > sessionMaxDepths[sessionId]) {
        sessionMaxDepths[sessionId] = depth;
      }
    });

    // Create buckets
    const bucketSize = parseInt(bucket_size);
    const buckets = {};
    const totalSessions = Object.keys(sessionMaxDepths).length;

    // Initialize buckets
    for (let i = 0; i < 100; i += bucketSize) {
      buckets[i] = 0;
    }

    // Count sessions in each bucket
    Object.values(sessionMaxDepths).forEach(maxDepth => {
      const bucketKey = Math.floor(maxDepth / bucketSize) * bucketSize;
      if (buckets.hasOwnProperty(bucketKey)) {
        buckets[bucketKey]++;
      } else {
        buckets[Math.max(...Object.keys(buckets).map(Number))] = (buckets[Math.max(...Object.keys(buckets).map(Number))] || 0) + 1;
      }
    });

    // Calculate cumulative percentages (what % of users scrolled to at least this depth)
    const result = [];
    let cumulativeCount = totalSessions;

    Object.keys(buckets).sort((a, b) => parseInt(a) - parseInt(b)).forEach(bucket => {
      const depth = parseInt(bucket);
      const percentage = totalSessions > 0 ? (cumulativeCount / totalSessions) * 100 : 0;

      result.push({
        depth_percent: depth,
        depth_range: `${depth}-${depth + bucketSize}%`,
        users_reached: cumulativeCount,
        percentage: Math.round(percentage * 100) / 100
      });

      cumulativeCount -= buckets[bucket];
    });

    res.json({
      success: true,
      data: result,
      meta: {
        store_id: storeId,
        page_url,
        total_sessions: totalSessions,
        bucket_size: bucketSize
      }
    });
  } catch (error) {
    console.error('Error getting scroll depth analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to check if screenshot service is reachable (requires authentication)
router.get('/screenshot-test', authMiddleware, async (req, res) => {
  try {
    console.log('📸 Screenshot test endpoint called');

    // Test if we can reach the PDF service
    const pdfServiceUrl = process.env.PDF_SERVICE_URL || 'http://localhost:3001';
    console.log(`📸 PDF_SERVICE_URL is: ${pdfServiceUrl}`);

    const axios = require('axios');
    const healthCheck = await axios.get(`${pdfServiceUrl}/health`);

    res.json({
      success: true,
      pdfServiceUrl,
      pdfServiceStatus: healthCheck.data,
      message: 'Screenshot service is reachable'
    });
  } catch (error) {
    console.error('❌ Screenshot test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      pdfServiceUrl: process.env.PDF_SERVICE_URL
    });
  }
});

// Get screenshot for heatmap visualization (requires authentication)
router.post('/screenshot/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      url,
      viewportWidth = 1920,
      viewportHeight = 1080,
      fullPage = true
    } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }

    console.log(`📸 Screenshot request for store ${storeId}: ${url}`);
    console.log(`📸 PDF_SERVICE_URL: ${process.env.PDF_SERVICE_URL}`);

    const screenshot = await screenshotService.getScreenshot(url, {
      viewportWidth: parseInt(viewportWidth),
      viewportHeight: parseInt(viewportHeight),
      fullPage
    });

    // Return screenshot as base64 data URL
    const dataUrl = `data:image/${screenshot.format};base64,${screenshot.buffer.toString('base64')}`;

    res.json({
      success: true,
      screenshot: dataUrl,
      format: screenshot.format,
      viewport: screenshot.viewport,
      size: screenshot.size
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get screenshot cache stats (admin only)
router.get('/screenshot-cache-stats', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'store_owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    const stats = screenshotService.getCacheStats();

    res.json({
      success: true,
      cache: stats
    });
  } catch (error) {
    console.error('Error getting screenshot cache stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear screenshot cache (admin only)
router.post('/screenshot-cache-clear', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    screenshotService.clearCache();

    res.json({
      success: true,
      message: 'Screenshot cache cleared'
    });
  } catch (error) {
    console.error('Error clearing screenshot cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { HeatmapInteraction, HeatmapSession } = connection.models;

    const retentionDays = parseInt(retention_days);
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));

    const deletedInteractions = await HeatmapInteraction.destroy({
      where: {
        store_id: storeId,
        timestamp_utc: {
          [Op.lt]: cutoffDate
        }
      }
    });

    const deletedSessions = await HeatmapSession.destroy({
      where: {
        store_id: storeId,
        session_start: {
          [Op.lt]: cutoffDate
        }
      }
    });

    console.log(`Cleaned up ${deletedInteractions} interactions and ${deletedSessions} sessions older than ${retentionDays} days`);

    res.json({
      success: true,
      data: {
        deletedInteractions,
        deletedSessions,
        cutoffDate
      }
    });
  } catch (error) {
    console.error('Error cleaning up heatmap data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;