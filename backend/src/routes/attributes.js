const express = require('express');
const { body, validationResult } = require('express-validator');
const { Attribute, AttributeValue, Store, AttributeSet } = require('../models');
const { Op } = require('sequelize');
const translationService = require('../services/translation-service');
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
    const { page = 1, limit = 100, store_id, search, attribute_set_id, exclude_assigned, is_filterable } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Authenticated access
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;

    // Filter by is_filterable if provided
    if (is_filterable !== undefined) {
      where.is_filterable = is_filterable === 'true' || is_filterable === true;
    }

    // Add search functionality
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add attribute set filtering
    if (attribute_set_id) {
      // Find the attribute set and filter by its attribute_ids
      const attributeSet = await AttributeSet.findByPk(attribute_set_id);
      if (attributeSet && Array.isArray(attributeSet.attribute_ids) && attributeSet.attribute_ids.length > 0) {
        where.id = { [Op.in]: attributeSet.attribute_ids };
      } else {
        // If attribute set has no attributes, return empty result
        where.id = { [Op.in]: [] };
      }
    } else if (exclude_assigned === 'true') {
      // Get all assigned attribute IDs from all attribute sets in this store
      const attributeSets = await AttributeSet.findAll({
        where: { store_id: where.store_id || store_id },
        attributes: ['attribute_ids']
      });
      
      const assignedIds = [];
      attributeSets.forEach(set => {
        if (Array.isArray(set.attribute_ids)) {
          assignedIds.push(...set.attribute_ids);
        }
      });
      
      // Remove duplicates
      const uniqueAssignedIds = [...new Set(assignedIds)];
      
      if (uniqueAssignedIds.length > 0) {
        where.id = { [Op.notIn]: uniqueAssignedIds };
      }
      // If no attributes are assigned to any set, show all attributes (no additional filter)
    }

    const { count, rows } = await Attribute.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
      attributes: { exclude: ['translations'] }, // Exclude translations JSON column - using normalized table
      include: [{ model: Store, attributes: ['id', 'name'] }]
    });

    // Get attribute IDs for translation lookup
    const attributeIds = rows.map(attr => attr.id);

    // Fetch translations from normalized tables
    const attributesWithTranslations = attributeIds.length > 0
      ? await getAttributesWithTranslations({ id: { [Op.in]: attributeIds } })
      : [];

    // Create a map for quick lookup
    const translationsMap = new Map(
      attributesWithTranslations.map(attr => [attr.id, attr.translations])
    );

    // Fetch attribute values for select/multiselect attributes
    // For filterable attributes, always include all values (no limit)
    const attributesWithValues = await Promise.all(rows.map(async (attr) => {
      const attrData = attr.toJSON();

      // Replace translations with normalized data
      attrData.translations = translationsMap.get(attr.id) || {};

      if (attr.type === 'select' || attr.type === 'multiselect') {
        const values = await AttributeValue.findAll({
          where: { attribute_id: attr.id },
          order: [['sort_order', 'ASC'], ['code', 'ASC']],
          attributes: { exclude: ['translations'] } // Exclude translations JSON column - using normalized table
          // No limit - authenticated requests get all values
        });

        // Get value IDs for translation lookup
        const valueIds = values.map(v => v.id);
        const valuesWithTranslations = valueIds.length > 0
          ? await getAttributeValuesWithTranslations({ id: { [Op.in]: valueIds } })
          : [];

        // Create translation map for values
        const valueTranslationsMap = new Map(
          valuesWithTranslations.map(val => [val.id, val.translations])
        );

        // Merge translations into values
        attrData.values = values.map(v => {
          const valData = v.toJSON();
          valData.translations = valueTranslationsMap.get(v.id) || {};
          return valData;
        });
      }
      return attrData;
    }));

    // Return wrapped response for authenticated requests
    res.json({
      success: true,
      data: {
        attributes: attributesWithValues,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
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

    // Fetch translations from normalized tables
    const attributeWithTranslations = await getAttributeWithValues(attribute.id);

    if (!attributeWithTranslations) {
      return res.status(404).json({ success: false, message: 'Attribute not found' });
    }

    // Merge with Sequelize data to include Store
    const attributeData = {
      ...attributeWithTranslations,
      Store: attribute.Store
    };

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

    // Get all attributes for this store
    const attributes = await Attribute.findAll({
      where: { store_id },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

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

        // Check if target translation already exists
        if (attribute.translations[toLang]) {
          console.log(`⏭️  Skipping attribute "${attributeName}": ${toLang} translation already exists`);
          results.skipped++;
          results.skippedDetails.push({
            attributeId: attribute.id,
            attributeName,
            reason: `${toLang} translation already exists`
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

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
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
        if (value.translations[toLang]) {
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

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
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