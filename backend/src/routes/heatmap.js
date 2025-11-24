const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const options = {
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      interactionTypes: interaction_types ? interaction_types.split(',') : ['click', 'hover'],
      viewportWidth: parseInt(viewport_width),
      viewportHeight: parseInt(viewport_height),
      deviceTypes: device_types ? device_types.split(',') : ['desktop', 'tablet', 'mobile']
    };

    // Inline getHeatmapData logic with Supabase
    let query = tenantDb
      .from('heatmap_interactions')
      .select('x_coordinate, y_coordinate, viewport_width, viewport_height, interaction_type, device_type, time_on_element, timestamp_utc')
      .eq('store_id', storeId)
      .eq('page_url', page_url)
      .in('interaction_type', options.interactionTypes)
      .in('device_type', options.deviceTypes)
      .order('timestamp_utc', { ascending: false });

    if (options.startDate) {
      query = query.gte('timestamp_utc', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('timestamp_utc', options.endDate.toISOString());
    }

    const { data: interactions, error: interactionsError } = await query;

    if (interactionsError) {
      throw interactionsError;
    }

    // Normalize coordinates to target viewport
    const heatmapData = (interactions || []).map(interaction => {
      const scaleX = options.viewportWidth / interaction.viewport_width;
      const scaleY = options.viewportHeight / interaction.viewport_height;
      return {
        ...interaction,
        normalized_x: Math.round(interaction.x_coordinate * scaleX),
        normalized_y: Math.round(interaction.y_coordinate * scaleY)
      };
    });

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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const options = {
      startDate: start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: end_date ? new Date(end_date) : new Date(),
      deviceType: device_type || null
    };

    // Inline getSessionAnalytics logic with Supabase
    let sessionsQuery = tenantDb
      .from('heatmap_sessions')
      .select('id, bounce_session, conversion_session, total_duration, page_count, interaction_count, device_type')
      .eq('store_id', storeId)
      .gte('session_start', options.startDate.toISOString())
      .lte('session_start', options.endDate.toISOString());

    if (options.deviceType) {
      sessionsQuery = sessionsQuery.eq('device_type', options.deviceType);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      throw sessionsError;
    }

    // Aggregate in JavaScript
    const analytics = {
      total_sessions: sessions?.length || 0,
      bounce_sessions: sessions?.filter(s => s.bounce_session === true).length || 0,
      conversion_sessions: sessions?.filter(s => s.conversion_session === true).length || 0,
      avg_session_duration: sessions?.length > 0
        ? sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / sessions.length
        : 0,
      avg_pages_per_session: sessions?.length > 0
        ? sessions.reduce((sum, s) => sum + (s.page_count || 0), 0) / sessions.length
        : 0,
      avg_interactions_per_session: sessions?.length > 0
        ? sessions.reduce((sum, s) => sum + (s.interaction_count || 0), 0) / sessions.length
        : 0
    };

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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Fetch interactions and aggregate in JavaScript
    const { data: interactions, error: interactionsError } = await tenantDb
      .from('heatmap_interactions')
      .select('interaction_type, session_id')
      .eq('store_id', storeId)
      .gte('timestamp_utc', startTime.toISOString());

    if (interactionsError) {
      throw interactionsError;
    }

    // Group by interaction_type
    const grouped = {};
    (interactions || []).forEach(i => {
      if (!grouped[i.interaction_type]) {
        grouped[i.interaction_type] = {
          interaction_type: i.interaction_type,
          count: 0,
          sessions: new Set()
        };
      }
      grouped[i.interaction_type].count++;
      grouped[i.interaction_type].sessions.add(i.session_id);
    });

    const stats = Object.values(grouped).map(g => ({
      interaction_type: g.interaction_type,
      count: g.count,
      unique_sessions: g.sessions.size
    }));

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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const options = {
      startDate: start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: end_date ? new Date(end_date) : new Date(),
      groupBy: group_by
    };

    // Inline getHeatmapSummary logic - fetch and aggregate in JS
    const { data: interactions, error: summaryError } = await tenantDb
      .from('heatmap_interactions')
      .select(`${group_by}, interaction_type, session_id, time_on_element, device_type`)
      .eq('store_id', storeId)
      .gte('timestamp_utc', options.startDate.toISOString())
      .lte('timestamp_utc', options.endDate.toISOString());

    if (summaryError) {
      throw summaryError;
    }

    // Group and aggregate
    const grouped = {};
    (interactions || []).forEach(i => {
      const key = `${i[group_by]}:${i.interaction_type}`;
      if (!grouped[key]) {
        grouped[key] = {
          [group_by]: i[group_by],
          interaction_type: i.interaction_type,
          interaction_count: 0,
          sessions: new Set(),
          time_sum: 0,
          time_count: 0,
          desktop_count: 0,
          mobile_count: 0,
          tablet_count: 0
        };
      }
      grouped[key].interaction_count++;
      grouped[key].sessions.add(i.session_id);
      if (i.time_on_element) {
        grouped[key].time_sum += i.time_on_element;
        grouped[key].time_count++;
      }
      if (i.device_type === 'desktop') grouped[key].desktop_count++;
      if (i.device_type === 'mobile') grouped[key].mobile_count++;
      if (i.device_type === 'tablet') grouped[key].tablet_count++;
    });

    const summary = Object.values(grouped).map(g => ({
      [group_by]: g[group_by],
      interaction_type: g.interaction_type,
      interaction_count: g.interaction_count,
      unique_sessions: g.sessions.size,
      avg_time_on_element: g.time_count > 0 ? g.time_sum / g.time_count : null,
      desktop_count: g.desktop_count,
      mobile_count: g.mobile_count,
      tablet_count: g.tablet_count
    })).sort((a, b) => b.interaction_count - a.interaction_count);

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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const options = {
      startDate: start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: end_date ? new Date(end_date) : new Date(),
      limit: parseInt(limit)
    };

    // Inline getTopPages logic - fetch and aggregate in JS
    const { data: sessions, error: sessionsError } = await tenantDb
      .from('heatmap_sessions')
      .select('first_page_url, total_duration, page_count, bounce_session')
      .eq('store_id', storeId)
      .gte('session_start', options.startDate.toISOString())
      .lte('session_start', options.endDate.toISOString());

    if (sessionsError) {
      throw sessionsError;
    }

    // Group by first_page_url
    const grouped = {};
    (sessions || []).forEach(s => {
      const pageUrl = s.first_page_url;
      if (!grouped[pageUrl]) {
        grouped[pageUrl] = {
          page_url: pageUrl,
          sessions: 0,
          total_duration: 0,
          total_page_views: 0,
          bounces: 0
        };
      }
      grouped[pageUrl].sessions++;
      grouped[pageUrl].total_duration += s.total_duration || 0;
      grouped[pageUrl].total_page_views += s.page_count || 0;
      if (s.bounce_session) grouped[pageUrl].bounces++;
    });

    const topPages = Object.values(grouped)
      .map(g => ({
        page_url: g.page_url,
        sessions: g.sessions,
        avg_duration: g.sessions > 0 ? g.total_duration / g.sessions : 0,
        avg_page_views: g.sessions > 0 ? g.total_page_views / g.sessions : 0,
        bounces: g.bounces,
        bounce_rate: g.sessions > 0 ? Math.round((g.bounces * 100.0) / g.sessions * 100) / 100 : 0
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, options.limit);

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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Build query
    let query = tenantDb
      .from('heatmap_interactions')
      .select('*')
      .eq('store_id', storeId)
      .eq('page_url', page_url)
      .order('timestamp_utc', { ascending: false })
      .limit(parseInt(limit));

    if (x_coordinate && y_coordinate) {
      query = query.eq('x_coordinate', parseInt(x_coordinate));
      query = query.eq('y_coordinate', parseInt(y_coordinate));
    }

    if (interaction_type) {
      query = query.eq('interaction_type', interaction_type);
    }

    if (start_date && end_date) {
      query = query.gte('timestamp_utc', new Date(start_date).toISOString());
      query = query.lte('timestamp_utc', new Date(end_date).toISOString());
    }

    const { data: interactions, error: interactionsError } = await query;

    if (interactionsError) {
      throw interactionsError;
    }

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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Build query
    let query = tenantDb
      .from('heatmap_interactions')
      .select('element_selector, element_tag, element_id, element_class, element_text, session_id, x_coordinate, y_coordinate')
      .eq('store_id', storeId)
      .eq('page_url', page_url)
      .in('interaction_type', ['click', 'touch'])
      .not('element_selector', 'is', null);

    if (start_date && end_date) {
      query = query.gte('timestamp_utc', new Date(start_date).toISOString());
      query = query.lte('timestamp_utc', new Date(end_date).toISOString());
    }

    const { data: interactions, error: interactionsError } = await query;

    if (interactionsError) {
      throw interactionsError;
    }

    // Group and aggregate in JavaScript
    const grouped = {};
    (interactions || []).forEach(i => {
      const key = i.element_selector;
      if (!grouped[key]) {
        grouped[key] = {
          element_selector: i.element_selector,
          element_tag: i.element_tag,
          element_id: i.element_id,
          element_class: i.element_class,
          element_text: i.element_text,
          click_count: 0,
          sessions: new Set(),
          x_sum: 0,
          y_sum: 0
        };
      }
      grouped[key].click_count++;
      grouped[key].sessions.add(i.session_id);
      grouped[key].x_sum += i.x_coordinate || 0;
      grouped[key].y_sum += i.y_coordinate || 0;
    });

    const rankings = Object.values(grouped)
      .map(g => ({
        element_selector: g.element_selector,
        element_tag: g.element_tag,
        element_id: g.element_id,
        element_class: g.element_class,
        element_text: g.element_text,
        click_count: g.click_count,
        unique_users: g.sessions.size,
        avg_x: g.click_count > 0 ? g.x_sum / g.click_count : 0,
        avg_y: g.click_count > 0 ? g.y_sum / g.click_count : 0
      }))
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, parseInt(limit));

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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Build query
    let query = tenantDb
      .from('heatmap_interactions')
      .select('session_id, user_id, device_type, user_agent, timestamp_utc, page_url, interaction_type')
      .eq('store_id', storeId);

    if (page_url) {
      query = query.eq('page_url', page_url);
    }

    if (device_type && device_type !== 'all') {
      query = query.eq('device_type', device_type);
    }

    if (start_date && end_date) {
      query = query.gte('timestamp_utc', new Date(start_date).toISOString());
      query = query.lte('timestamp_utc', new Date(end_date).toISOString());
    }

    const { data: interactions, error: interactionsError } = await query;

    if (interactionsError) {
      throw interactionsError;
    }

    // Group by session_id and aggregate
    const grouped = {};
    (interactions || []).forEach(i => {
      const key = i.session_id;
      if (!grouped[key]) {
        grouped[key] = {
          session_id: i.session_id,
          user_id: i.user_id,
          device_type: i.device_type,
          user_agent: i.user_agent,
          timestamps: [],
          pages: new Set(),
          interaction_count: 0,
          click_count: 0,
          scroll_count: 0
        };
      }
      grouped[key].timestamps.push(new Date(i.timestamp_utc));
      grouped[key].pages.add(i.page_url);
      grouped[key].interaction_count++;
      if (i.interaction_type === 'click') grouped[key].click_count++;
      if (i.interaction_type === 'scroll') grouped[key].scroll_count++;
    });

    const sessions = Object.values(grouped).map(g => {
      const timestamps = g.timestamps.sort((a, b) => a - b);
      const session_start = timestamps[0];
      const session_end = timestamps[timestamps.length - 1];
      return {
        session_id: g.session_id,
        user_id: g.user_id,
        device_type: g.device_type,
        user_agent: g.user_agent,
        session_start: session_start.toISOString(),
        session_end: session_end.toISOString(),
        interaction_count: g.interaction_count,
        pages_visited: g.pages.size,
        click_count: g.click_count,
        scroll_count: g.scroll_count
      };
    }).sort((a, b) => new Date(b.session_start) - new Date(a.session_start));

    // Apply pagination
    const paginatedSessions = sessions.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Calculate session duration for each
    const sessionsWithDuration = paginatedSessions.map(session => ({
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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Get all interactions for this session
    const { data: interactions, error: interactionsError } = await tenantDb
      .from('heatmap_interactions')
      .select('*')
      .eq('store_id', storeId)
      .eq('session_id', sessionId)
      .order('timestamp_utc', { ascending: true });

    if (interactionsError) {
      throw interactionsError;
    }

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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Build query
    let query = tenantDb
      .from('heatmap_interactions')
      .select('session_id, timestamp_utc')
      .eq('store_id', storeId);

    if (start_date && end_date) {
      query = query.gte('timestamp_utc', new Date(start_date).toISOString());
      query = query.lte('timestamp_utc', new Date(end_date).toISOString());
    }

    const { data: interactions, error: interactionsError } = await query;

    if (interactionsError) {
      throw interactionsError;
    }

    // Group by session_id and find MIN/MAX timestamps
    const sessionGroups = {};
    (interactions || []).forEach(i => {
      if (!sessionGroups[i.session_id]) {
        sessionGroups[i.session_id] = {
          session_id: i.session_id,
          timestamps: []
        };
      }
      sessionGroups[i.session_id].timestamps.push(new Date(i.timestamp_utc));
    });

    const sessions = Object.values(sessionGroups)
      .filter(g => g.timestamps.length >= 1)
      .map(g => {
        const timestamps = g.timestamps.sort((a, b) => a - b);
        return {
          session_id: g.session_id,
          session_start: timestamps[0].toISOString(),
          session_end: timestamps[timestamps.length - 1].toISOString()
        };
      });

    // Filter for the specific page URL and calculate durations
    const pageSessions = [];

    for (const session of sessions) {
      // Check if this session has interactions on the target page
      const { data: pageInteractions, error: pageError } = await tenantDb
        .from('heatmap_interactions')
        .select('timestamp_utc')
        .eq('store_id', storeId)
        .eq('session_id', session.session_id)
        .eq('page_url', page_url)
        .order('timestamp_utc', { ascending: true });

      if (pageError) {
        throw pageError;
      }

      if (pageInteractions && pageInteractions.length > 0) {
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
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Build query
    let query = tenantDb
      .from('heatmap_interactions')
      .select('session_id, scroll_depth_percent')
      .eq('store_id', storeId)
      .eq('page_url', page_url)
      .eq('interaction_type', 'scroll')
      .not('scroll_depth_percent', 'is', null);

    if (start_date && end_date) {
      query = query.gte('timestamp_utc', new Date(start_date).toISOString());
      query = query.lte('timestamp_utc', new Date(end_date).toISOString());
    }

    // Get all scroll interactions
    const { data: scrollData, error: scrollError } = await query;

    if (scrollError) {
      throw scrollError;
    }

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
router.get('/screenshot-cache-stats', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {

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
router.post('/screenshot-cache-clear', authMiddleware, authorize(['admin']), async (req, res) => {
  try {

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
router.delete('/cleanup/:storeId', authMiddleware, authorize(['admin', 'store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { retention_days = 90 } = req.query;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const retentionDays = parseInt(retention_days);
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));

    // Delete old interactions
    const { error: interactionsError, count: deletedInteractions } = await tenantDb
      .from('heatmap_interactions')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
      .lt('timestamp_utc', cutoffDate.toISOString());

    if (interactionsError) {
      console.error('Error deleting interactions:', interactionsError);
    }

    // Delete old sessions
    const { error: sessionsError, count: deletedSessions } = await tenantDb
      .from('heatmap_sessions')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
      .lt('session_start', cutoffDate.toISOString());

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError);
    }

    console.log(`Cleaned up ${deletedInteractions || 0} interactions and ${deletedSessions || 0} sessions older than ${retentionDays} days`);

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