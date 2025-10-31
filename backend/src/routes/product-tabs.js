const express = require('express');
const { body, validationResult } = require('express-validator');
const { Store } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const translationService = require('../services/translation-service');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const {
  getProductTabsWithTranslations,
  getProductTabById,
  getProductTabWithAllTranslations,
  createProductTabWithTranslations,
  updateProductTabWithTranslations,
  deleteProductTab
} = require('../utils/productTabHelpers');
const router = express.Router();

// @route   GET /api/product-tabs
// @desc    Get product tabs for a store (authenticated)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { store_id, is_active } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Product Tabs (Admin): Requesting language:', lang, 'Headers:', {
      'x-language': req.headers['x-language'],
      'accept-language': req.headers['accept-language'],
      'query-lang': req.query.lang
    });

    // Build where clause
    const whereClause = { store_id };
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    // Authenticated requests get all translations
    const productTabs = await getProductTabsWithTranslations(whereClause, lang, true); // true = include all translations

    console.log('📋 Product Tabs (Admin): Retrieved', productTabs.length, 'tabs for language:', lang);
    if (productTabs.length > 0) {
      console.log('📝 Sample tab:', {
        id: productTabs[0].id,
        name: productTabs[0].name,
        content: productTabs[0].content?.substring(0, 50) + '...'
      });
    }

    // Return wrapped response for authenticated requests
    res.json({
      success: true,
      data: productTabs
    });
  } catch (error) {
    console.error('Get product tabs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/product-tabs/:id
// @desc    Get product tab by ID with all translations
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const productTab = await getProductTabWithAllTranslations(req.params.id);

    if (!productTab) {
      return res.status(404).json({
        success: false,
        message: 'Product tab not found'
      });
    }

    console.log('📝 Backend: Loaded product tab with translations:', {
      id: productTab.id,
      name: productTab.name,
      translations: productTab.translations,
      translationKeys: Object.keys(productTab.translations || {}),
      nlTranslation: productTab.translations?.nl
    });

    res.json({
      success: true,
      data: productTab
    });
  } catch (error) {
    console.error('Get product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/product-tabs
// @desc    Create new product tab
// @access  Private
router.post('/', authMiddleware, [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('tab_type').optional().isIn(['text', 'description', 'attributes', 'attribute_sets']).withMessage('Invalid tab type'),
  body('content').optional().isString(),
  body('attribute_ids').optional().isArray().withMessage('Attribute IDs must be an array'),
  body('attribute_set_ids').optional().isArray().withMessage('Attribute set IDs must be an array'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, name, tab_type, content, attribute_ids, attribute_set_ids, sort_order, is_active } = req.body;

    // Check store ownership
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);
      
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Ensure name is properly trimmed and not empty
    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Tab name cannot be empty'
      });
    }

    // Generate slug from name before creating
    const generatedSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const finalSlug = generatedSlug || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔧 Route: Creating ProductTab with explicit slug:', { name: trimmedName, slug: finalSlug });

    // Extract translations from request body
    const { translations, ...tabData } = req.body;

    const productTab = await createProductTabWithTranslations({
      store_id,
      name: trimmedName,
      slug: finalSlug,
      tab_type: tab_type || 'text',
      content: content || '',
      attribute_ids: attribute_ids || [],
      attribute_set_ids: attribute_set_ids || [],
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : true
    }, translations || {});

    res.status(201).json({
      success: true,
      message: 'Product tab created successfully',
      data: productTab
    });
  } catch (error) {
    console.error('Create product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/product-tabs/:id
// @desc    Update product tab
// @access  Private
router.put('/:id', authMiddleware, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('tab_type').optional().isIn(['text', 'description', 'attributes', 'attribute_sets']).withMessage('Invalid tab type'),
  body('content').optional().isString(),
  body('attribute_ids').optional().isArray().withMessage('Attribute IDs must be an array'),
  body('attribute_set_ids').optional().isArray().withMessage('Attribute set IDs must be an array'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if tab exists
    const existingTab = await getProductTabById(req.params.id);
    if (!existingTab) {
      return res.status(404).json({
        success: false,
        message: 'Product tab not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, existingTab.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    console.log('📝 Backend: Updating product tab:', {
      id: req.params.id,
      name: req.body.name,
      translations: req.body.translations,
      translationKeys: Object.keys(req.body.translations || {}),
      nlTranslation: req.body.translations?.nl
    });

    // Extract translations from request body
    const { translations, ...tabData } = req.body;

    const productTab = await updateProductTabWithTranslations(req.params.id, tabData, translations || {});

    console.log('✅ Backend: Product tab updated:', {
      id: productTab.id,
      name: productTab.name,
      content: productTab.content?.substring(0, 50) + '...'
    });

    res.json({
      success: true,
      message: 'Product tab updated successfully',
      data: productTab
    });
  } catch (error) {
    console.error('Update product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/product-tabs/:id
// @desc    Delete product tab
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const productTab = await getProductTabById(req.params.id);

    if (!productTab) {
      return res.status(404).json({
        success: false,
        message: 'Product tab not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, productTab.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await deleteProductTab(req.params.id);

    res.json({
      success: true,
      message: 'Product tab deleted successfully'
    });
  } catch (error) {
    console.error('Delete product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/product-tabs/:id/translate
// @desc    AI translate a single product tab to target language
// @access  Private
router.post('/:id/translate', authMiddleware, [
  body('fromLang').notEmpty().withMessage('Source language is required'),
  body('toLang').notEmpty().withMessage('Target language is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fromLang, toLang } = req.body;
    const productTab = await getProductTabById(req.params.id);

    if (!productTab) {
      return res.status(404).json({
        success: false,
        message: 'Product tab not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, productTab.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!productTab.translations || !productTab.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this product tab`
      });
    }

    // Get source translation
    const sourceTranslation = productTab.translations[fromLang];
    const translatedData = {};

    // Translate each field using AI
    for (const [key, value] of Object.entries(sourceTranslation)) {
      if (typeof value === 'string' && value.trim()) {
        translatedData[key] = await translationService.aiTranslate(value, fromLang, toLang);
      }
    }

    // Save the translation using normalized tables
    const translations = productTab.translations || {};
    translations[toLang] = translatedData;

    const updatedTab = await updateProductTabWithTranslations(
      req.params.id,
      {},
      translations
    );

    res.json({
      success: true,
      message: `Product tab translated to ${toLang} successfully`,
      data: updatedTab
    });
  } catch (error) {
    console.error('Translate product tab error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/product-tabs/bulk-translate
// @desc    AI translate all product tabs in a store to target language
// @access  Private
router.post('/bulk-translate', authMiddleware, [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
  body('fromLang').notEmpty().withMessage('Source language is required'),
  body('toLang').notEmpty().withMessage('Target language is required')
], async (req, res) => {
  try {
    console.log('🚀 BULK TRANSLATE PRODUCT TABS ENDPOINT CALLED');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, fromLang, toLang } = req.body;
    console.log(`📋 Parameters: store_id=${store_id}, fromLang=${fromLang}, toLang=${toLang}`);

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get all product tabs for this store
    const lang = getLanguageFromRequest(req);
    const tabs = await getProductTabsWithTranslations({ store_id }, lang);

    if (tabs.length === 0) {
      return res.json({
        success: true,
        message: 'No product tabs found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each tab
    const results = {
      total: tabs.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      skippedDetails: []
    };

    console.log(`🌐 Starting product tabs translation: ${fromLang} → ${toLang} (${tabs.length} tabs)`);

    for (const tab of tabs) {
      try {
        const tabName = tab.translations?.[fromLang]?.name || tab.name || `Tab ${tab.id}`;

        // Check if source translation exists
        if (!tab.translations || !tab.translations[fromLang]) {
          console.log(`⏭️  Skipping tab "${tabName}": No ${fromLang} translation`);
          results.skipped++;
          results.skippedDetails.push({
            tabId: tab.id,
            tabName,
            reason: `No ${fromLang} translation found`
          });
          continue;
        }

        // Check if target translation already exists
        if (tab.translations[toLang]) {
          console.log(`⏭️  Skipping tab "${tabName}": ${toLang} translation already exists`);
          results.skipped++;
          results.skippedDetails.push({
            tabId: tab.id,
            tabName,
            reason: `${toLang} translation already exists`
          });
          continue;
        }

        // Get source translation and translate each field
        console.log(`🔄 Translating tab "${tabName}"...`);
        const sourceTranslation = tab.translations[fromLang];
        const translatedData = {};

        for (const [key, value] of Object.entries(sourceTranslation)) {
          if (typeof value === 'string' && value.trim()) {
            translatedData[key] = await translationService.aiTranslate(value, fromLang, toLang);
          }
        }

        // Save the translation using normalized tables
        const translations = tab.translations || {};
        translations[toLang] = translatedData;

        await updateProductTabWithTranslations(tab.id, {}, translations);
        console.log(`✅ Successfully translated tab "${tabName}"`);
        results.translated++;
      } catch (error) {
        const tabName = tab.translations?.[fromLang]?.name || tab.name || `Tab ${tab.id}`;
        console.error(`❌ Error translating product tab "${tabName}":`, error);
        results.failed++;
        results.errors.push({
          tabId: tab.id,
          tabName,
          error: error.message
        });
      }
    }

    console.log(`✅ Product tabs translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk translate product tabs error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;