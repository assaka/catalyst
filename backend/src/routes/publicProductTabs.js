const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const {
  getProductTabsWithTranslations,
  getProductTabWithAllTranslations
} = require('../utils/productTabHelpers');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const router = express.Router();

// @route   GET /api/public/product-tabs
// @desc    Get product tabs for a store (public access)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Product Tabs (Public): Requesting language:', lang, 'Headers:', {
      'x-language': req.headers['x-language'],
      'accept-language': req.headers['accept-language'],
      'query-lang': req.query.lang
    });

    // Public requests only get current language translations
    const productTabs = await getProductTabsWithTranslations(store_id, {
      store_id,
      is_active: true
    }, lang, false); // false = only current language

    console.log('📋 Product Tabs (Public): Retrieved', productTabs.length, 'tabs for language:', lang);
    if (productTabs.length > 0) {
      console.log('📝 Sample tab:', {
        id: productTabs[0].id,
        name: productTabs[0].name,
        content: productTabs[0].content?.substring(0, 50) + '...'
      });
    }

    // Apply cache headers based on store settings
    await applyCacheHeaders(res, store_id);

    // Return just the array for public requests (for compatibility with StorefrontBaseEntity)
    res.json(productTabs);
  } catch (error) {
    console.error('Get product tabs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/public/product-tabs/:id
// @desc    Get product tab by ID (public access, current language only)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const lang = getLanguageFromRequest(req);
    const productTab = await getProductTabWithAllTranslations(store_id, req.params.id);

    if (!productTab) {
      return res.status(404).json({
        success: false,
        message: 'Product tab not found'
      });
    }

    // For public access, only return the current language translation
    // Extract the relevant translation and merge with base fields
    const publicTab = {
      id: productTab.id,
      store_id: productTab.store_id,
      name: productTab.translations?.[lang]?.name || productTab.name,
      slug: productTab.slug,
      tab_type: productTab.tab_type,
      content: productTab.translations?.[lang]?.content || productTab.content,
      attribute_ids: productTab.attribute_ids,
      attribute_set_ids: productTab.attribute_set_ids,
      sort_order: productTab.sort_order,
      is_active: productTab.is_active
    };

    console.log('📝 Public Product Tab: Loaded tab for language:', lang, {
      id: publicTab.id,
      name: publicTab.name
    });

    res.json(publicTab);
  } catch (error) {
    console.error('Get product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
