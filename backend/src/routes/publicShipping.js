const express = require('express');
const { getShippingMethodsWithTranslations } = require('../utils/shippingMethodHelpers');
const router = express.Router();

// @route   GET /api/public/shipping
// @desc    Get all active shipping methods for a store (no authentication required)
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
      is_active: true  // Only show active shipping methods
    };

    const shippingMethods = await getShippingMethodsWithTranslations(where);
    
    // Filter by country if provided
    let filteredMethods = shippingMethods;
    if (country) {
      filteredMethods = shippingMethods.filter(method => {
        if (method.availability === 'all') return true;
        if (method.availability === 'specific_countries' && method.countries) {
          return method.countries.includes(country);
        }
        return false;
      });
    }

    res.json({ 
      success: true, 
      data: filteredMethods 
    });
    
  } catch (error) {
    console.error('❌ Public shipping route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;