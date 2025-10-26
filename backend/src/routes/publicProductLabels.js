const express = require('express');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { getProductLabelsWithTranslations } = require('../utils/productLabelHelpers');

const router = express.Router();

// @route   GET /api/public/product-labels
// @desc    Get all active product labels for a store (public access)
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

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Product Labels (Public): Requesting language:', lang, 'Headers:', {
      'x-language': req.headers['x-language'],
      'accept-language': req.headers['accept-language'],
      'query-lang': req.query.lang
    });

    // Public access - only return active labels with current language translations
    const whereClause = {
      store_id,
      is_active: true
    };

    // Public requests only get current language translations
    const labels = await getProductLabelsWithTranslations(whereClause, lang, false); // false = only current language
    console.log('🏷️ Product Labels (Public): Retrieved', labels.length, 'labels for language:', lang, labels.slice(0, 2));

    // Return just the array for public requests (for compatibility with StorefrontBaseEntity)
    res.json(labels);
  } catch (error) {
    console.error('Get product labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
