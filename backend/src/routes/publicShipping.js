const express = require('express');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { evaluateConditions } = require('../utils/conditionEvaluator');
const ConnectionManager = require('../services/database/ConnectionManager');
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

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);
    const lang = getLanguageFromRequest(req);

    // Get shipping methods with translations
    const { data: shippingMethods, error } = await tenantDb
      .from('shipping_methods')
      .select(`
        shipping_methods.id,
        shipping_methods.store_id,
        shipping_methods.is_active,
        shipping_methods.type,
        shipping_methods.flat_rate_cost,
        shipping_methods.free_shipping_min_order,
        shipping_methods.weight_ranges,
        shipping_methods.price_ranges,
        shipping_methods.availability,
        shipping_methods.countries,
        shipping_methods.conditions,
        shipping_methods.min_delivery_days,
        shipping_methods.max_delivery_days,
        shipping_methods.sort_order,
        shipping_methods.created_at,
        shipping_methods.updated_at,
        COALESCE(smt.name, shipping_methods.name) as name,
        COALESCE(smt.description, shipping_methods.description) as description
      `)
      .leftJoin(
        'shipping_method_translations as smt',
        'shipping_methods.id',
        'smt.shipping_method_id'
      )
      .where('shipping_methods.store_id', '=', store_id)
      .where('shipping_methods.is_active', '=', true)
      .where((builder) => {
        builder.where('smt.language_code', '=', lang).orWhereNull('smt.language_code');
      })
      .order('shipping_methods.sort_order', { ascending: true })
      .order('shipping_methods.name', { ascending: true });

    if (error) {
      console.error('Error fetching shipping methods:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch shipping methods',
        error: error.message
      });
    }
    
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