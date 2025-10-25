const express = require('express');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { getShippingMethodsWithTranslations } = require('../utils/shippingMethodHelpers');
const { evaluateConditions } = require('../utils/conditionEvaluator');
const router = express.Router();

// @route   GET /api/public/shipping
// @desc    Get all active shipping methods for a store (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id, country, product_ids } = req.query;
    
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

    const lang = getLanguageFromRequest(req);
    const shippingMethods = await getShippingMethodsWithTranslations(where, { lang });
    
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

    // Filter by conditions if product_ids provided
    if (product_ids) {
      // Parse product_ids (can be comma-separated string or array)
      const productIdArray = Array.isArray(product_ids)
        ? product_ids
        : product_ids.split(',').map(id => id.trim());

      // Evaluate conditions for each shipping method
      const methodsWithConditions = await Promise.all(
        filteredMethods.map(async (method) => {
          const meetsConditions = await evaluateConditions(method.conditions, productIdArray);
          return { method, meetsConditions };
        })
      );

      // Filter to only methods that meet conditions
      filteredMethods = methodsWithConditions
        .filter(({ meetsConditions }) => meetsConditions)
        .map(({ method }) => method);

      console.log(`📊 Filtered to ${filteredMethods.length} shipping methods based on conditions`);
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