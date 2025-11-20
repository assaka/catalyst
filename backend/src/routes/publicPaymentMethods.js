const express = require('express');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { getPaymentMethodsWithTranslations } = require('../utils/paymentMethodHelpers');
const { evaluateConditions } = require('../utils/conditionEvaluator');
const router = express.Router();

// @route   GET /api/public/payment-methods
// @desc    Get all active payment methods for a store (no authentication required)
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
      is_active: true  // Only show active payment methods
    };

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Public Payment Methods: Requesting language:', lang);

    // Get payment methods with translations from normalized table
    const paymentMethods = await getPaymentMethodsWithTranslations(store_id, where, lang);

    console.log(`📦 Found ${paymentMethods.length} payment methods`);
    if (paymentMethods.length > 0) {
      console.log('📝 First payment method:', {
        id: paymentMethods[0].id,
        name: paymentMethods[0].name,
        code: paymentMethods[0].code,
        lang: lang
      });
    }

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

    // Filter by conditions if product_ids provided
    if (product_ids) {
      // Parse product_ids (can be comma-separated string or array)
      const productIdArray = Array.isArray(product_ids)
        ? product_ids
        : product_ids.split(',').map(id => id.trim());

      // Evaluate conditions for each payment method
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

      console.log(`📊 Filtered to ${filteredMethods.length} methods based on conditions`);
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