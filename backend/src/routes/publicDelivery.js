const express = require('express');
const { DeliverySettings, Store } = require('../models');
const router = express.Router();

// @route   GET /api/public/delivery
// @desc    Get delivery settings for a store (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    console.log('📦 Public Delivery API called with params:', req.query);
    
    if (!store_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'store_id is required' 
      });
    }

    const deliverySettings = await DeliverySettings.findAll({
      where: { store_id: store_id },
      attributes: [
        'id',
        'enable_delivery_date',
        'enable_comments', 
        'offset_days',
        'max_advance_days',
        'blocked_dates',
        'blocked_weekdays',
        'out_of_office_start',
        'out_of_office_end',
        'delivery_time_slots'
      ]
    });
    
    console.log(`✅ Found ${deliverySettings.length} delivery settings for store ${store_id}`);
    
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