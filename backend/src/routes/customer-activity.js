const express = require('express');
const { CustomerActivity } = require('../models');
const { Op } = require('sequelize');
const { analyticsLimiter, publicReadLimiter } = require('../middleware/rateLimiters');
const { validateRequest, customerActivitySchema } = require('../validation/analyticsSchemas');
const eventBus = require('../services/analytics/EventBus');

// Initialize handlers
require('../services/analytics/handlers/CustomerActivityHandler');

const router = express.Router();

// @route   GET /api/customer-activity
// @desc    Get customer activities
// @access  Public (Rate Limited)
router.get('/', publicReadLimiter, async (req, res) => {
  try {
    const { 
      session_id, 
      store_id, 
      user_id, 
      activity_type, 
      page = 1, 
      limit = 50,
      start_date,
      end_date
    } = req.query;

    const whereClause = {};
    if (session_id) whereClause.session_id = session_id;
    if (store_id) whereClause.store_id = store_id;
    if (user_id) whereClause.user_id = user_id;
    if (activity_type) whereClause.activity_type = activity_type;

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const offset = (page - 1) * limit;

    const activities = await CustomerActivity.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: require('../models').Product,
          attributes: ['id', 'name', 'slug'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        activities: activities.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(activities.count / limit),
          total_items: activities.count,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get customer activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customer-activity
// @desc    Log customer activity (via unified event bus)
// @access  Public (Rate Limited + Validated)
router.post('/', analyticsLimiter, validateRequest(customerActivitySchema), async (req, res) => {
  try {
    const {
      session_id,
      store_id,
      activity_type,
      page_url,
      referrer,
      product_id,
      search_query,
      user_id,
      metadata
    } = req.body;

    // Publish event to unified event bus
    const result = await eventBus.publish('customer_activity', {
      session_id,
      store_id,
      user_id,
      activity_type,
      page_url,
      referrer,
      product_id,
      search_query,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip || req.connection.remoteAddress,
      metadata: metadata || {}
    }, {
      source: 'api',
      priority: activity_type === 'order_completed' ? 'high' : 'normal'
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    res.status(201).json({
      success: true,
      data: {
        event_id: result.eventId,
        correlation_id: result.correlationId,
        session_id,
        activity_type,
        duplicate: result.duplicate || false
      }
    });
  } catch (error) {
    // Log error with context for debugging
    console.error('[CUSTOMER ACTIVITY ERROR]', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      store_id: req.body?.store_id
    });

    res.status(500).json({
      success: false,
      message: 'Server error while logging activity',
      error: error.message
    });
  }
});

module.exports = router;