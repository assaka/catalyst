/**
 * Analytics Dashboard API Routes
 * Provides aggregated analytics data for dashboards
 */

const express = require('express');
const router = express.Router();
const { CustomerActivity } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

/**
 * Get real-time users online (last 5 minutes)
 * GET /api/analytics-dashboard/:storeId/realtime
 */
router.get('/:storeId/realtime', async (req, res) => {
  try {
    const { storeId } = req.params;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Get unique sessions in last 5 minutes
    const recentActivities = await CustomerActivity.findAll({
      where: {
        store_id: storeId,
        created_at: {
          [Op.gte]: fiveMinutesAgo
        }
      },
      attributes: ['session_id', 'user_id', 'page_url', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    // Get unique sessions
    const uniqueSessions = new Set(recentActivities.map(a => a.session_id));
    const uniqueUsers = new Set(recentActivities.filter(a => a.user_id).map(a => a.user_id));

    // Get current pages (latest activity per session)
    const sessionPages = {};
    recentActivities.forEach(activity => {
      if (!sessionPages[activity.session_id]) {
        sessionPages[activity.session_id] = activity.page_url;
      }
    });

    res.json({
      success: true,
      data: {
        users_online: uniqueSessions.size,
        logged_in_users: uniqueUsers.size,
        guest_users: uniqueSessions.size - uniqueUsers.size,
        active_pages: Object.values(sessionPages),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[ANALYTICS DASHBOARD] Real-time error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get session analytics with demographics
 * GET /api/analytics-dashboard/:storeId/sessions
 */
router.get('/:storeId/sessions', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { start_date, end_date } = req.query;

    const whereClause = { store_id: storeId };

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else {
      // Default to last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      whereClause.created_at = {
        [Op.gte]: sevenDaysAgo
      };
    }

    const activities = await CustomerActivity.findAll({
      where: whereClause,
      attributes: ['session_id', 'user_agent', 'created_at', 'metadata'],
      order: [['created_at', 'ASC']]
    });

    // Calculate session metrics
    const sessions = {};

    activities.forEach(activity => {
      const sid = activity.session_id;

      if (!sessions[sid]) {
        sessions[sid] = {
          session_id: sid,
          start_time: activity.created_at,
          end_time: activity.created_at,
          events_count: 0,
          user_agent: activity.user_agent,
          device_type: null,
          browser: null,
          os: null
        };
      }

      sessions[sid].events_count++;
      sessions[sid].end_time = activity.created_at;

      // Parse user agent for demographics (simple parsing)
      if (activity.user_agent && !sessions[sid].device_type) {
        const ua = activity.user_agent.toLowerCase();

        // Device type
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          sessions[sid].device_type = 'mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
          sessions[sid].device_type = 'tablet';
        } else {
          sessions[sid].device_type = 'desktop';
        }

        // Browser
        if (ua.includes('chrome')) sessions[sid].browser = 'Chrome';
        else if (ua.includes('firefox')) sessions[sid].browser = 'Firefox';
        else if (ua.includes('safari')) sessions[sid].browser = 'Safari';
        else if (ua.includes('edge')) sessions[sid].browser = 'Edge';
        else sessions[sid].browser = 'Other';

        // OS
        if (ua.includes('windows')) sessions[sid].os = 'Windows';
        else if (ua.includes('mac')) sessions[sid].os = 'macOS';
        else if (ua.includes('linux')) sessions[sid].os = 'Linux';
        else if (ua.includes('android')) sessions[sid].os = 'Android';
        else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) sessions[sid].os = 'iOS';
        else sessions[sid].os = 'Other';
      }
    });

    // Calculate session durations
    const sessionsList = Object.values(sessions).map(session => {
      const duration = (new Date(session.end_time) - new Date(session.start_time)) / 1000; // seconds
      return {
        ...session,
        duration_seconds: duration
      };
    });

    // Aggregate demographics
    const deviceBreakdown = {};
    const browserBreakdown = {};
    const osBreakdown = {};

    sessionsList.forEach(session => {
      deviceBreakdown[session.device_type] = (deviceBreakdown[session.device_type] || 0) + 1;
      browserBreakdown[session.browser] = (browserBreakdown[session.browser] || 0) + 1;
      osBreakdown[session.os] = (osBreakdown[session.os] || 0) + 1;
    });

    // Calculate averages
    const totalSessions = sessionsList.length;
    const avgDuration = totalSessions > 0
      ? sessionsList.reduce((sum, s) => sum + s.duration_seconds, 0) / totalSessions
      : 0;
    const avgEventsPerSession = totalSessions > 0
      ? sessionsList.reduce((sum, s) => sum + s.events_count, 0) / totalSessions
      : 0;

    res.json({
      success: true,
      data: {
        total_sessions: totalSessions,
        avg_session_duration: avgDuration,
        avg_events_per_session: avgEventsPerSession,
        device_breakdown: deviceBreakdown,
        browser_breakdown: browserBreakdown,
        os_breakdown: osBreakdown,
        sessions: sessionsList
      }
    });
  } catch (error) {
    console.error('[ANALYTICS DASHBOARD] Sessions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get time-series data for charts
 * GET /api/analytics-dashboard/:storeId/timeseries
 */
router.get('/:storeId/timeseries', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { start_date, end_date, interval = 'hour' } = req.query;

    const whereClause = { store_id: storeId };

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else {
      // Default to last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      whereClause.created_at = {
        [Op.gte]: twentyFourHoursAgo
      };
    }

    const activities = await CustomerActivity.findAll({
      where: whereClause,
      attributes: ['created_at', 'session_id', 'activity_type'],
      order: [['created_at', 'ASC']]
    });

    // Group by time interval
    const timeSeriesData = {};
    const sessionsByTime = {};

    activities.forEach(activity => {
      const date = new Date(activity.created_at);
      let timeKey;

      if (interval === 'hour') {
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      } else if (interval === 'day') {
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else {
        // minute
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      }

      if (!timeSeriesData[timeKey]) {
        timeSeriesData[timeKey] = {
          timestamp: timeKey,
          events: 0,
          page_views: 0,
          product_views: 0,
          add_to_cart: 0,
          orders: 0
        };
        sessionsByTime[timeKey] = new Set();
      }

      timeSeriesData[timeKey].events++;
      sessionsByTime[timeKey].add(activity.session_id);

      if (activity.activity_type === 'page_view') timeSeriesData[timeKey].page_views++;
      if (activity.activity_type === 'product_view') timeSeriesData[timeKey].product_views++;
      if (activity.activity_type === 'add_to_cart') timeSeriesData[timeKey].add_to_cart++;
      if (activity.activity_type === 'order_completed') timeSeriesData[timeKey].orders++;
    });

    // Add session counts
    const timeSeriesArray = Object.keys(timeSeriesData).map(key => ({
      ...timeSeriesData[key],
      unique_sessions: sessionsByTime[key].size
    })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    res.json({
      success: true,
      data: timeSeriesArray
    });
  } catch (error) {
    console.error('[ANALYTICS DASHBOARD] Timeseries error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get top performing products
 * GET /api/analytics-dashboard/:storeId/top-products
 */
router.get('/:storeId/top-products', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { start_date, end_date, metric = 'views', limit = 10 } = req.query;

    const whereClause = { store_id: storeId };

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // Get product views or add_to_cart events
    const activityType = metric === 'cart' ? 'add_to_cart' : 'product_view';

    const activities = await CustomerActivity.findAll({
      where: {
        ...whereClause,
        activity_type: activityType,
        product_id: { [Op.ne]: null }
      },
      attributes: ['product_id', 'metadata'],
      raw: true
    });

    // Aggregate by product
    const productStats = {};

    activities.forEach(activity => {
      const pid = activity.product_id;
      if (!productStats[pid]) {
        productStats[pid] = {
          product_id: pid,
          product_name: activity.metadata?.product_name || 'Unknown',
          product_sku: activity.metadata?.product_sku || 'N/A',
          count: 0,
          total_quantity: 0,
          total_value: 0
        };
      }

      productStats[pid].count++;

      if (metric === 'cart') {
        productStats[pid].total_quantity += parseInt(activity.metadata?.quantity || 1);
        productStats[pid].total_value += parseFloat(activity.metadata?.cart_value || 0);
      }
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('[ANALYTICS DASHBOARD] Top products error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
