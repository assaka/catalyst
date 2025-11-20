const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const router = express.Router();

// @route   GET /api/public/delivery
// @desc    Get delivery settings for a store (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: deliverySettings, error } = await tenantDb
      .from('delivery_settings')
      .select(`
        id,
        enable_delivery_date,
        enable_comments,
        offset_days,
        max_advance_days,
        blocked_dates,
        blocked_weekdays,
        out_of_office_start,
        out_of_office_end,
        delivery_time_slots
      `)
      .eq('store_id', store_id);

    if (error) {
      console.error('Error fetching delivery settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery settings',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: deliverySettings
    });

  } catch (error) {
    console.error('❌ Public delivery route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
