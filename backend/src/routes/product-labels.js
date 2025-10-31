const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const translationService = require('../services/translation-service');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const {
  getProductLabelsWithTranslations,
  getProductLabelById,
  getProductLabelWithAllTranslations,
  createProductLabelWithTranslations,
  updateProductLabelWithTranslations,
  deleteProductLabel
} = require('../utils/productLabelHelpers');

const router = express.Router();

// @route   GET /api/product-labels
// @desc    Get all product labels for a store (authenticated)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { store_id, is_active } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const whereClause = { store_id };

    // Authenticated access - filter by is_active if provided
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Product Labels (Admin): Requesting language:', lang, 'Headers:', {
      'x-language': req.headers['x-language'],
      'accept-language': req.headers['accept-language'],
      'query-lang': req.query.lang
    });

    // Authenticated requests get all translations
    const labels = await getProductLabelsWithTranslations(whereClause, lang, true); // true = include all translations
    console.log('🏷️ Product Labels (Admin): Retrieved', labels.length, 'labels for language:', lang, labels.slice(0, 2));

    // Return wrapped response for authenticated requests
    res.json({
      success: true,
      data: { product_labels: labels }
    });
  } catch (error) {
    console.error('Get product labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/product-labels/:id
// @desc    Get single product label with all translations
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const label = await getProductLabelWithAllTranslations(req.params.id);

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    console.log('📝 Backend: Loaded product label with translations:', {
      id: label.id,
      name: label.name,
      text: label.text,
      translations: label.translations,
      translationKeys: Object.keys(label.translations || {}),
      fullTranslations: JSON.stringify(label.translations, null, 2)
    });

    res.json({
      success: true,
      data: label
    });
  } catch (error) {
    console.error('Get product label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/product-labels/test
// @desc    Create a test product label for debugging
// @access  Private
router.post('/test', authMiddleware, async (req, res) => {
  try {
    console.log('🧪 Creating test product label...');

    const testLabelData = {
      store_id: req.body.store_id || req.query.store_id,
      name: 'Test Label - Debug',
      slug: 'test-label-debug',
      text: 'TEST',
      background_color: '#FF0000',
      color: '#FFFFFF',
      position: 'top-right',
      is_active: true,
      conditions: {}
    };

    console.log('🧪 Test label data:', testLabelData);

    const label = await createProductLabelWithTranslations(testLabelData, {});
    console.log('✅ Test label created successfully:', label);

    res.status(201).json({
      success: true,
      data: label,
      message: 'Test label created successfully'
    });
  } catch (error) {
    console.error('❌ Create test label error:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error: error.name
    });
  }
});

// @route   POST /api/product-labels
// @desc    Create a new product label
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Creating product label with data:', req.body);
    console.log('🔍 Priority field debug (backend):', {
      priority: req.body.priority,
      priorityType: typeof req.body.priority,
      sort_order: req.body.sort_order,
      sortOrderType: typeof req.body.sort_order
    });

    // Extract translations from request body
    const { translations, ...labelData } = req.body;

    console.log('🌍 Translations received from frontend:', {
      translations,
      translationKeys: Object.keys(translations || {}),
      translationValues: translations
    });

    // Ensure slug is generated if not provided (fallback for hook issues)
    if (!labelData.slug && labelData.name) {
      labelData.slug = labelData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      console.log('🔧 Fallback slug generation:', labelData.slug);
    }

    const label = await createProductLabelWithTranslations(labelData, translations || {});
    console.log('✅ Product label created successfully:', label);
    console.log('✅ Created label priority field:', {
      priority: label.priority,
      sort_order: label.sort_order
    });
    res.status(201).json({
      success: true,
      data: label
    });
  } catch (error) {
    console.error('❌ Create product label error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error: error.name
    });
  }
});

// @route   PUT /api/product-labels/:id
// @desc    Update product label
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Updating product label with data:', req.body);
    console.log('🔍 Priority field debug (backend update):', {
      priority: req.body.priority,
      priorityType: typeof req.body.priority,
      sort_order: req.body.sort_order,
      sortOrderType: typeof req.body.sort_order
    });

    // Check if label exists
    const existingLabel = await getProductLabelById(req.params.id);
    if (!existingLabel) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    // Extract translations from request body
    const { translations, ...labelData } = req.body;

    console.log('🌍 Translations received from frontend:', {
      translations,
      translationKeys: Object.keys(translations || {}),
      translationValues: translations
    });

    const label = await updateProductLabelWithTranslations(req.params.id, labelData, translations || {});
    console.log('✅ Updated label priority field:', {
      priority: label.priority,
      sort_order: label.sort_order
    });
    res.json({
      success: true,
      data: label
    });
  } catch (error) {
    console.error('Update product label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/product-labels/:id
// @desc    Delete product label
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const label = await getProductLabelById(req.params.id);

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    await deleteProductLabel(req.params.id);
    console.log(`✅ Product Labels translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    res.json({
      success: true,
      message: 'Product label deleted successfully'
    });
  } catch (error) {
    console.error('Delete product label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/product-labels/:id/translate
// @desc    AI translate a single product label to target language
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
    const lang = getLanguageFromRequest(req);
    const productLabel = await getProductLabelById(req.params.id, lang);

    if (!productLabel) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, productLabel.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!productLabel.translations || !productLabel.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this product label`
      });
    }

    // Get source translation
    const sourceTranslation = productLabel.translations[fromLang];
    const translatedData = {};

    // Translate each field using AI
    for (const [key, value] of Object.entries(sourceTranslation)) {
      if (typeof value === 'string' && value.trim()) {
        translatedData[key] = await translationService.aiTranslate(value, fromLang, toLang);
      }
    }

    // Save the translation using normalized tables
    const translations = productLabel.translations || {};
    translations[toLang] = translatedData;

    const updatedLabel = await updateProductLabelWithTranslations(
      req.params.id,
      {},
      translations
    );

    res.json({
      success: true,
      message: `Product label translated to ${toLang} successfully`,
      data: updatedLabel
    });
  } catch (error) {
    console.error('Translate product label error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/product-labels/bulk-translate
// @desc    AI translate all product labels in a store to target language
// @access  Private
router.post('/bulk-translate', authMiddleware, [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
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

    const { store_id, fromLang, toLang } = req.body;

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

    // Get all product labels for this store
    const lang = getLanguageFromRequest(req);
    const labels = await getProductLabelsWithTranslations({ store_id }, lang);

    if (labels.length === 0) {
      return res.json({
        success: true,
        message: 'No product labels found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each label
    const results = {
      total: labels.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      skippedDetails: []
    };

    console.log(`🌐 Starting Product Labels translation: ${fromLang} → ${toLang} (${labels.length} Product Labels)`);

    for (const label of labels) {
      try {
        const labelText = label.translations?.[fromLang]?.text || label.text || `Label ${label.id}`;

        // Check if source translation exists
        if (!label.translations || !label.translations[fromLang]) {
          console.log(`⏭️  Skipping label "${labelText}": No ${fromLang} translation`);
          results.skipped++;
          results.skippedDetails.push({
            labelId: label.id,
            labelText,
            reason: `No ${fromLang} translation found`
          });
          continue;
        }

        // Check if target translation already exists
        if (label.translations[toLang]) {
          console.log(`⏭️  Skipping label "${labelText}": ${toLang} translation already exists`);
          results.skipped++;
          results.skippedDetails.push({
            labelId: label.id,
            labelText,
            reason: `${toLang} translation already exists`
          });
          continue;
        }

        // Get source translation and translate each field
        console.log(`🔄 Translating label "${labelText}"...`);
        const sourceTranslation = label.translations[fromLang];
        const translatedData = {};

        for (const [key, value] of Object.entries(sourceTranslation)) {
          if (typeof value === 'string' && value.trim()) {
            translatedData[key] = await translationService.aiTranslate(value, fromLang, toLang);
          }
        }

        // Save the translation using normalized tables
        const translations = label.translations || {};
        translations[toLang] = translatedData;

        await updateProductLabelWithTranslations(label.id, {}, translations);
        console.log(`✅ Successfully translated label "${labelText}"`);
        results.translated++;
      } catch (error) {
        const labelText = label.translations?.[fromLang]?.text || label.text || `Label ${label.id}`;
        console.error(`❌ Error translating product label "${labelText}":`, error);
        results.failed++;
        results.errors.push({
          labelId: label.id,
          labelText,
          error: error.message
        });
      }
    }

    console.log(`✅ Product labels translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk translate product labels error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;