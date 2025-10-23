const express = require('express');
const { PaymentMethod, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// @route   GET /api/public/payment-methods
// @desc    Get all active payment methods for a store (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id, country } = req.query;
    
    if (!store_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'store_id is required' 
      });
    }

    const where = {
      store_id: store_id,
      is_active: true  // Only show active payment methods
    };

    const paymentMethods = await PaymentMethod.findAll({
      where,
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: [
        'id',
        'code',
        'name',
        'description',
        'fee_type',
        'fee_amount',
        'countries',
        'sort_order',
        'translations'
      ]
    });
    
    // Filter by country if provided
    let filteredMethods = paymentMethods;
    if (country) {
      filteredMethods = paymentMethods.filter(method => {
        // If no countries specified, available everywhere
        if (!method.countries || method.countries.length === 0) return true;
        // Otherwise check if country is in the list
        return method.countries.includes(country);
      });
    }

    res.json({ 
      success: true, 
      data: filteredMethods 
    });
    
  } catch (error) {
    console.error('❌ Public payment methods route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;