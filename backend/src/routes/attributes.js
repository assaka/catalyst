const express = require('express');
const { body, validationResult } = require('express-validator');
const ConnectionManager = require('../services/database/ConnectionManager');
const translationService = require('../services/translation-service');
const creditService = require('../services/credit-service');
const {
  getAttributesWithTranslations,
  getAttributeValuesWithTranslations,
  getAttributeWithValues,
  saveAttributeTranslations,
  saveAttributeValueTranslations
} = require('../utils/attributeHelpers');
const router = express.Router();

// Import auth middleware
const { authMiddleware, authorize } = require('../middleware/auth');

// Basic CRUD operations for attributes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const { page = 1, limit = 100, search, attribute_set_id, exclude_assigned, is_filterable } = req.query;
    const offset = (page - 1) * limit;

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build Supabase query
    let query = tenantDb.from('attributes').select('*', { count: 'exact' }).eq('store_id', store_id);

    // Filter by is_filterable
    if (is_filterable !== undefined) {
      query = query.eq('is_filterable', is_filterable === 'true' || is_filterable === true);
    }

    // Search functionality (simplified - searches name and code)
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    // TODO: Implement attribute_set_id and exclude_assigned filters
    // These require additional queries to attribute_sets table

    // Apply pagination and ordering
    query = query
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: rows, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Simplified response - TODO: Add translation and value lookups
    // For now, return basic attributes data
    res.json({
      success: true,
      data: {
        attributes: rows || [],
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Attributes API error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({ success: false, message: 'store_id is required' });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: attribute, error } = await tenantDb
      .from('attributes')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !attribute) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    // TODO: Add translation and value lookups
    const attributeData = attribute;

    console.log('📝 Backend: Loaded attribute with translations:', {
      id: attributeData.id,
      name: attributeData.name,
      code: attributeData.code,
      translations: attributeData.translations,
      translationKeys: Object.keys(attributeData.translations || {})
    });

    res.json({ success: true, data: attributeData });
  } catch (error) {
    console.error('❌ Get attribute error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { store_id } = req.body;
    const store = await Store.findByPk(store_id);
    
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const attribute = await Attribute.create(req.body);
    res.status(201).json({ success: true, message: 'Attribute created successfully', data: attribute });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Extract translations from request body
    const { translations, ...attributeData } = req.body;

    // Update attribute fields (excluding translations)
    await attribute.update(attributeData);

    // Save translations to normalized table if provided
    if (translations && typeof translations === 'object') {
      await saveAttributeTranslations(req.params.id, translations);
    }

    // Fetch updated attribute with translations
    const updatedAttribute = await getAttributeWithValues(req.params.id);

    res.json({ success: true, message: 'Attribute updated successfully', data: updatedAttribute });
  } catch (error) {
    console.error('❌ Update attribute error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) return res.status(404).json({ success: false, message: 'Attribute not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await attribute.destroy();
    res.json({ success: true, message: 'Attribute deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== ATTRIBUTE VALUES ROUTES ==========

// Get all values for an attribute
router.get('/:attributeId/values', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.attributeId, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) {
      return res.status(404).json({ success: false, error: 'Attribute not found' });
    }

    // Check access if authenticated request
    if (req.user && req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const values = await AttributeValue.findAll({
      where: { attribute_id: req.params.attributeId },
      order: [['sort_order', 'ASC'], ['code', 'ASC']]
    });

    res.json({ success: true, data: values });
  } catch (error) {
    console.error('❌ Get attribute values error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create attribute value
router.post('/:attributeId/values', async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.attributeId, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) {
      return res.status(404).json({ success: false, error: 'Attribute not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const { code, translations, metadata, sort_order } = req.body;

    const value = await AttributeValue.create({
      attribute_id: req.params.attributeId,
      code,
      translations: translations || {},
      metadata: metadata || {},
      sort_order: sort_order || 0
    });

    res.json({ success: true, data: value });
  } catch (error) {
    console.error('❌ Create attribute value error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update attribute value
router.put('/:attributeId/values/:valueId', async (req, res) => {
  try {
    const value = await AttributeValue.findByPk(req.params.valueId, {
      include: [{
        model: Attribute,
        include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
      }]
    });

    if (!value) {
      return res.status(404).json({ success: false, error: 'Value not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, value.Attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    // Extract translations from request body
    const { translations, ...valueData } = req.body;

    // Update value fields (excluding translations)
    await value.update(valueData);

    // Save translations to normalized table if provided
    if (translations && typeof translations === 'object') {
      await saveAttributeValueTranslations(req.params.valueId, translations);
    }

    // Fetch updated value with translations
    const updatedValues = await getAttributeValuesWithTranslations({ id: req.params.valueId });
    const updatedValue = updatedValues[0] || value;

    res.json({ success: true, data: updatedValue });
  } catch (error) {
    console.error('❌ Update attribute value error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete attribute value
router.delete('/:attributeId/values/:valueId', async (req, res) => {
  try {
    const value = await AttributeValue.findByPk(req.params.valueId, {
      include: [{
        model: Attribute,
        include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
      }]
    });

    if (!value) {
      return res.status(404).json({ success: false, error: 'Value not found' });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, value.Attribute.Store.id);

      if (!access) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    await value.destroy();
    res.json({ success: true, message: 'Value deleted' });
  } catch (error) {
    console.error('❌ Delete attribute value error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/attributes/:id/translate
// @desc    AI translate a single attribute to target language
// @access  Private
router.post('/:id/translate', authMiddleware, authorize(['admin', 'store_owner']), [
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
    const attribute = await Attribute.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
    });

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, attribute.Store.id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!attribute.translations || !attribute.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this attribute`
      });
    }

    // Translate the attribute
    const updatedAttribute = await translationService.aiTranslateEntity('attribute', req.params.id, fromLang, toLang);

    res.json({
      success: true,
      message: `Attribute translated to ${toLang} successfully`,
      data: updatedAttribute
    });
  } catch (error) {
    console.error('Translate attribute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/attributes/bulk-translate
// @desc    AI translate all attributes in a store to target language
// @access  Private
router.post('/bulk-translate', authMiddleware, authorize(['admin', 'store_owner']), [
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

    // Get all attributes for this store with all translations
    const attributes = await getAttributesWithTranslations({ store_id });

    if (attributes.length === 0) {
      return res.json({
        success: true,
        message: 'No attributes found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each attribute
    const results = {
      total: attributes.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      skippedDetails: []
    };

    console.log(`🌐 Starting attribute translation: ${fromLang} → ${toLang} (${attributes.length} attributes)`);

    for (const attribute of attributes) {
      try {
        const attributeName = attribute.translations?.[fromLang]?.name || attribute.name || `Attribute ${attribute.id}`;

        // Check if source translation exists
        if (!attribute.translations || !attribute.translations[fromLang]) {
          console.log(`⏭️  Skipping attribute "${attributeName}": No ${fromLang} translation`);
          results.skipped++;
          results.skippedDetails.push({
            attributeId: attribute.id,
            attributeName,
            reason: `No ${fromLang} translation found`
          });
          continue;
        }

        // Check if ALL target fields have content (field-level check)
        const sourceFields = Object.entries(attribute.translations[fromLang] || {});
        const targetTranslation = attribute.translations[toLang] || {};

        const allFieldsTranslated = sourceFields.every(([key, value]) => {
          if (!value || typeof value !== 'string' || !value.trim()) return true; // Ignore empty source fields
          const targetValue = targetTranslation[key];
          return targetValue && typeof targetValue === 'string' && targetValue.trim().length > 0;
        });

        if (allFieldsTranslated && sourceFields.length > 0) {
          console.log(`⏭️  Skipping attribute "${attributeName}": All fields already translated`);
          results.skipped++;
          results.skippedDetails.push({
            attributeId: attribute.id,
            attributeName,
            reason: `All fields already translated`
          });
          continue;
        }

        // Translate the attribute
        console.log(`🔄 Translating attribute "${attributeName}"...`);
        await translationService.aiTranslateEntity('attribute', attribute.id, fromLang, toLang);
        console.log(`✅ Successfully translated attribute "${attributeName}"`);
        results.translated++;
      } catch (error) {
        const attributeName = attribute.translations?.[fromLang]?.name || attribute.name || `Attribute ${attribute.id}`;
        console.error(`❌ Error translating attribute "${attributeName}":`, error);
        results.failed++;
        results.errors.push({
          attributeId: attribute.id,
          attributeName,
          error: error.message
        });
      }
    }

    console.log(`✅ Attribute translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    // Deduct credits for ALL items (including skipped)
    const totalItems = attributes.length;
    let actualCost = 0;

    if (totalItems > 0) {
      const costPerItem = await translationService.getTranslationCost('attribute');
      actualCost = totalItems * costPerItem;

      console.log(`💰 Attribute bulk translate - charging for ${totalItems} items × ${costPerItem} credits = ${actualCost} credits`);

      try {
        await creditService.deduct(
          req.user.id,
          store_id,
          actualCost,
          `Bulk Attribute Translation (${fromLang} → ${toLang})`,
          {
            fromLang,
            toLang,
            totalItems,
            translated: results.translated,
            skipped: results.skipped,
            failed: results.failed,
            note: 'Charged for all items including skipped'
          },
          null,
          'ai_translation'
        );
        console.log(`✅ Deducted ${actualCost} credits for ${totalItems} attributes`);
      } catch (deductError) {
        console.error(`❌ CREDIT DEDUCTION FAILED (attribute-bulk-translate):`, deductError);
        actualCost = 0;
      }
    }

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: { ...results, creditsDeducted: actualCost }
    });
  } catch (error) {
    console.error('Bulk translate attributes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// ========== ATTRIBUTE VALUE TRANSLATION ROUTES ==========

// @route   POST /api/attributes/values/:valueId/translate
// @desc    AI translate a single attribute value to target language
// @access  Private
router.post('/values/:valueId/translate', authMiddleware, authorize(['admin', 'store_owner']), [
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
    const value = await AttributeValue.findByPk(req.params.valueId, {
      include: [{
        model: Attribute,
        include: [{ model: Store, attributes: ['id', 'name', 'user_id'] }]
      }]
    });

    if (!value) {
      return res.status(404).json({
        success: false,
        message: 'Attribute value not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, value.Attribute.Store.id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!value.translations || !value.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this attribute value`
      });
    }

    // Translate the attribute value
    const updatedValue = await translationService.aiTranslateEntity('attribute_value', req.params.valueId, fromLang, toLang);

    res.json({
      success: true,
      message: `Attribute value translated to ${toLang} successfully`,
      data: updatedValue
    });
  } catch (error) {
    console.error('Translate attribute value error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/attributes/values/bulk-translate
// @desc    AI translate all attribute values in a store to target language
// @access  Private
router.post('/values/bulk-translate', authMiddleware, authorize(['admin', 'store_owner']), [
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

    // Get all attribute values for attributes belonging to this store
    const attributes = await Attribute.findAll({
      where: { store_id },
      attributes: ['id']
    });

    if (attributes.length === 0) {
      return res.json({
        success: true,
        message: 'No attributes found for this store',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    const attributeIds = attributes.map(attr => attr.id);
    const values = await AttributeValue.findAll({
      where: { attribute_id: { [Op.in]: attributeIds } },
      order: [['sort_order', 'ASC'], ['code', 'ASC']]
    });

    if (values.length === 0) {
      return res.json({
        success: true,
        message: 'No attribute values found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each value
    const results = {
      total: values.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const value of values) {
      try {
        // Check if source translation exists
        if (!value.translations || !value.translations[fromLang]) {
          results.skipped++;
          continue;
        }

        // Check if target translation already exists
        const hasTargetTranslation = value.translations[toLang] &&
          Object.values(value.translations[toLang]).some(val =>
            typeof val === 'string' && val.trim().length > 0
          );

        if (hasTargetTranslation) {
          results.skipped++;
          continue;
        }

        // Translate the value
        await translationService.aiTranslateEntity('attribute_value', value.id, fromLang, toLang);
        results.translated++;
      } catch (error) {
        console.error(`Error translating attribute value ${value.id}:`, error);
        results.failed++;
        results.errors.push({
          valueId: value.id,
          valueCode: value.code,
          error: error.message
        });
      }
    }

    // Deduct credits for ALL items (including skipped)
    const totalItems = values.length;
    let actualCost = 0;

    if (totalItems > 0) {
      const costPerItem = await translationService.getTranslationCost('attribute_value');
      actualCost = totalItems * costPerItem;

      console.log(`💰 Attribute Value bulk translate - charging for ${totalItems} items × ${costPerItem} credits = ${actualCost} credits`);

      try {
        await creditService.deduct(
          req.user.id,
          store_id,
          actualCost,
          `Bulk Attribute Value Translation (${fromLang} → ${toLang})`,
          {
            fromLang,
            toLang,
            totalItems,
            translated: results.translated,
            skipped: results.skipped,
            failed: results.failed,
            note: 'Charged for all items including skipped'
          },
          null,
          'ai_translation'
        );
        console.log(`✅ Deducted ${actualCost} credits for ${totalItems} attribute values`);
      } catch (deductError) {
        console.error(`❌ CREDIT DEDUCTION FAILED (attribute-value-bulk-translate):`, deductError);
        actualCost = 0;
      }
    }

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: { ...results, creditsDeducted: actualCost }
    });
  } catch (error) {
    console.error('Bulk translate attribute values error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;