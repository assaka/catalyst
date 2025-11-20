/**
 * Custom Analytics Events API Routes
 * Manage custom dataLayer events and tracking configurations
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get all custom events for a store (public - needed for frontend)
 * GET /api/custom-analytics-events/:storeId
 */
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { enabled_only } = req.query;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    let query = tenantDb
      .from('custom_analytics_events')
      .select('*')
      .eq('store_id', storeId)
      .order('priority', { ascending: false })
      .order('event_category', { ascending: true })
      .order('created_at', { ascending: true });

    if (enabled_only === 'true') {
      query = query.eq('enabled', true);
    }

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: events || []
    });
  } catch (error) {
    console.error('[CUSTOM EVENTS] Error getting events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get events by trigger type (public - for frontend optimization)
 * GET /api/custom-analytics-events/:storeId/by-trigger/:triggerType
 */
router.get('/:storeId/by-trigger/:triggerType', async (req, res) => {
  try {
    const { storeId, triggerType } = req.params;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: events, error } = await tenantDb
      .from('custom_analytics_events')
      .select('*')
      .eq('store_id', storeId)
      .eq('trigger_type', triggerType)
      .eq('enabled', true)
      .order('priority', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: events || []
    });
  } catch (error) {
    console.error('[CUSTOM EVENTS] Error getting events by trigger:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create custom event (admin only)
 * POST /api/custom-analytics-events/:storeId
 */
router.post('/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      event_name,
      display_name,
      description,
      event_category,
      trigger_type,
      trigger_selector,
      trigger_condition,
      event_parameters,
      enabled,
      priority,
      fire_once_per_session,
      send_to_backend,
      metadata
    } = req.body;

    // Validate required fields
    if (!event_name || !display_name || !trigger_type) {
      return res.status(400).json({
        success: false,
        error: 'event_name, display_name, and trigger_type are required'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: event, error } = await tenantDb
      .from('custom_analytics_events')
      .insert({
        store_id: storeId,
        event_name,
        display_name,
        description,
        event_category: event_category || 'custom',
        trigger_type,
        trigger_selector,
        trigger_condition,
        event_parameters: event_parameters || {},
        enabled: enabled !== undefined ? enabled : true,
        priority: priority || 10,
        is_system: false,
        fire_once_per_session: fire_once_per_session || false,
        send_to_backend: send_to_backend !== undefined ? send_to_backend : true,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('[CUSTOM EVENTS] Error creating event:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update custom event (admin only)
 * PUT /api/custom-analytics-events/:storeId/:eventId
 */
router.put('/:storeId/:eventId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, eventId } = req.params;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: event, error: checkError } = await tenantDb
      .from('custom_analytics_events')
      .select('*')
      .eq('id', eventId)
      .eq('store_id', storeId)
      .single();

    if (checkError || !event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Prevent modifying system events (except enabled flag)
    if (event.is_system && req.body.event_name) {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify system event configuration. You can only enable/disable it.'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'event_name', 'display_name', 'description', 'event_category',
      'trigger_type', 'trigger_selector', 'trigger_condition',
      'event_parameters', 'enabled', 'priority',
      'fire_once_per_session', 'send_to_backend', 'metadata'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const { data: updatedEvent, error } = await tenantDb
      .from('custom_analytics_events')
      .update(updateData)
      .eq('id', eventId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('[CUSTOM EVENTS] Error updating event:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete custom event (admin only)
 * DELETE /api/custom-analytics-events/:storeId/:eventId
 */
router.delete('/:storeId/:eventId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, eventId } = req.params;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: event, error: checkError } = await tenantDb
      .from('custom_analytics_events')
      .select('*')
      .eq('id', eventId)
      .eq('store_id', storeId)
      .single();

    if (checkError || !event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Prevent deleting system events
    if (event.is_system) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete system event. Disable it instead.'
      });
    }

    const { error } = await tenantDb
      .from('custom_analytics_events')
      .delete()
      .eq('id', eventId)
      .eq('store_id', storeId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('[CUSTOM EVENTS] Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get event templates
 * GET /api/custom-analytics-events/templates/list
 */
router.get('/templates/list', async (req, res) => {
  try {
    const templates = [
      {
        id: 'add_to_wishlist',
        display_name: 'Add to Wishlist',
        description: 'Track when users add products to wishlist',
        event_category: 'engagement',
        trigger_type: 'click',
        trigger_selector: '.wishlist-button, [data-wishlist-btn]',
        event_parameters: {
          item_id: '{{product_id}}',
          item_name: '{{product_name}}',
          category: '{{category_name}}',
          price: '{{price}}'
        },
        send_to_backend: true
      },
      {
        id: 'newsletter_signup',
        display_name: 'Newsletter Signup',
        description: 'Track newsletter subscription submissions',
        event_category: 'conversion',
        trigger_type: 'form_submit',
        trigger_selector: '#newsletter-form, .newsletter-form',
        event_parameters: {
          form_location: '{{page_url}}',
          newsletter_type: 'general'
        },
        send_to_backend: true
      },
      {
        id: 'scroll_depth',
        display_name: 'Scroll Depth',
        description: 'Track how far users scroll on pages',
        event_category: 'engagement',
        trigger_type: 'scroll',
        trigger_condition: {
          scroll_depths: [25, 50, 75, 100]
        },
        event_parameters: {
          scroll_depth: '{{scroll_percent}}',
          page_url: '{{page_url}}'
        },
        send_to_backend: false
      },
      {
        id: 'video_engagement',
        display_name: 'Video Engagement',
        description: 'Track video plays, pauses, and completions',
        event_category: 'engagement',
        trigger_type: 'custom',
        event_parameters: {
          video_title: '{{video_title}}',
          video_duration: '{{duration}}',
          video_percent: '{{percent_watched}}'
        },
        send_to_backend: true
      },
      {
        id: 'product_filter_used',
        display_name: 'Product Filter Used',
        description: 'Track when users apply filters on category pages',
        event_category: 'engagement',
        trigger_type: 'click',
        trigger_selector: '.filter-button, [data-filter]',
        event_parameters: {
          filter_type: '{{filter_type}}',
          filter_value: '{{filter_value}}',
          category: '{{category_name}}'
        },
        send_to_backend: true
      },
      {
        id: 'promo_banner_click',
        display_name: 'Promo Banner Click',
        description: 'Track clicks on promotional banners',
        event_category: 'engagement',
        trigger_type: 'click',
        trigger_selector: '.promo-banner, [data-promo]',
        event_parameters: {
          banner_title: '{{banner_title}}',
          banner_position: '{{position}}',
          destination_url: '{{href}}'
        },
        send_to_backend: true
      },
      {
        id: 'quick_view',
        display_name: 'Product Quick View',
        description: 'Track when users open product quick view modal',
        event_category: 'engagement',
        trigger_type: 'click',
        trigger_selector: '.quick-view-btn, [data-quick-view]',
        event_parameters: {
          item_id: '{{product_id}}',
          item_name: '{{product_name}}',
          source_page: '{{page_type}}'
        },
        send_to_backend: true
      },
      {
        id: 'coupon_applied',
        display_name: 'Coupon Applied',
        description: 'Track when users successfully apply coupon codes',
        event_category: 'conversion',
        trigger_type: 'custom',
        event_parameters: {
          coupon_code: '{{coupon_code}}',
          discount_amount: '{{discount}}',
          cart_value: '{{cart_total}}'
        },
        send_to_backend: true
      },
      {
        id: 'chat_opened',
        display_name: 'Live Chat Opened',
        description: 'Track when users open live chat widget',
        event_category: 'engagement',
        trigger_type: 'click',
        trigger_selector: '.chat-widget, [data-chat]',
        event_parameters: {
          page_url: '{{page_url}}',
          page_type: '{{page_type}}'
        },
        send_to_backend: true
      },
      {
        id: 'size_guide_viewed',
        display_name: 'Size Guide Viewed',
        description: 'Track when users view size guide',
        event_category: 'engagement',
        trigger_type: 'click',
        trigger_selector: '.size-guide-btn, [data-size-guide]',
        event_parameters: {
          product_id: '{{product_id}}',
          product_category: '{{category_name}}'
        },
        send_to_backend: true
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('[CUSTOM EVENTS] Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
