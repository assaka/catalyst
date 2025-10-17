const express = require('express');
const { Translation, Language, Product, Category, CmsPage, CmsBlock, ProductTab, ProductLabel, CookieConsentSettings, Attribute, AttributeValue } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const translationService = require('../services/translation-service');

const router = express.Router();

// ============================================
// UI LABELS ROUTES
// ============================================

// @route   GET /api/translations/ui-labels
// @desc    Get all UI labels for a specific language
// @access  Public
router.get('/ui-labels', async (req, res) => {
  try {
    const { lang = 'en' } = req.query;

    const result = await translationService.getUILabels(lang);

    res.json({
      success: true,
      data: {
        language: lang,
        labels: result.labels,
        customKeys: result.customKeys
      }
    });
  } catch (error) {
    console.error('Get UI labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/translations/ui-labels/all
// @desc    Get all UI labels for all languages (for admin)
// @access  Private
router.get('/ui-labels/all', authMiddleware, async (req, res) => {
  try {
    const labels = await translationService.getAllUILabels();

    res.json({
      success: true,
      data: labels
    });
  } catch (error) {
    console.error('Get all UI labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/translations/ui-labels
// @desc    Save or update a UI label translation
// @access  Private
router.post('/ui-labels', authMiddleware, async (req, res) => {
  try {
    const { key, language_code, value, category, type = 'custom' } = req.body;

    if (!key || !language_code || !value) {
      return res.status(400).json({
        success: false,
        message: 'Key, language_code, and value are required'
      });
    }

    const translation = await translationService.saveUILabel(
      key,
      language_code,
      value,
      category,
      type
    );

    res.json({
      success: true,
      data: translation
    });
  } catch (error) {
    console.error('Save UI label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/translations/ui-labels/bulk
// @desc    Save multiple UI labels at once
// @access  Private
router.post('/ui-labels/bulk', authMiddleware, async (req, res) => {
  try {
    const { labels } = req.body;

    if (!Array.isArray(labels)) {
      return res.status(400).json({
        success: false,
        message: 'Labels must be an array'
      });
    }

    const saved = await translationService.saveBulkUILabels(labels);

    res.json({
      success: true,
      data: {
        count: saved.length,
        labels: saved
      }
    });
  } catch (error) {
    console.error('Bulk save UI labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/translations/ui-labels/:key/:languageCode
// @desc    Delete a UI label translation
// @access  Private
router.delete('/ui-labels/:key/:languageCode', authMiddleware, async (req, res) => {
  try {
    const { key, languageCode } = req.params;

    await translationService.deleteUILabel(key, languageCode);

    res.json({
      success: true,
      message: 'Translation deleted successfully'
    });
  } catch (error) {
    console.error('Delete UI label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ============================================
// AI TRANSLATION ROUTES
// ============================================

// @route   POST /api/translations/ai-translate
// @desc    Translate text using AI
// @access  Private
router.post('/ai-translate', authMiddleware, async (req, res) => {
  try {
    const { text, fromLang = 'en', toLang } = req.body;

    if (!text || !toLang) {
      return res.status(400).json({
        success: false,
        message: 'Text and toLang are required'
      });
    }

    const translatedText = await translationService.aiTranslate(text, fromLang, toLang);

    res.json({
      success: true,
      data: {
        original: text,
        translated: translatedText,
        fromLang,
        toLang
      }
    });
  } catch (error) {
    console.error('AI translate error:', error);
    res.status(500).json({
      success: false,
      message: 'AI translation failed'
    });
  }
});

// @route   POST /api/translations/ai-translate-entity
// @desc    Translate all fields of an entity using AI
// @access  Private
router.post('/ai-translate-entity', authMiddleware, async (req, res) => {
  try {
    const { entityType, entityId, fromLang = 'en', toLang } = req.body;

    if (!entityType || !entityId || !toLang) {
      return res.status(400).json({
        success: false,
        message: 'entityType, entityId, and toLang are required'
      });
    }

    const entity = await translationService.aiTranslateEntity(
      entityType,
      entityId,
      fromLang,
      toLang
    );

    res.json({
      success: true,
      data: entity,
      message: `${entityType} translated successfully`
    });
  } catch (error) {
    console.error('AI translate entity error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI translation failed'
    });
  }
});

// @route   POST /api/translations/auto-translate-ui-label
// @desc    Automatically translate a UI label to all active languages
// @access  Private
router.post('/auto-translate-ui-label', authMiddleware, async (req, res) => {
  try {
    const { key, value, category = 'common', fromLang = 'en' } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required'
      });
    }

    // Get all active languages
    const languages = await Language.findAll({
      where: { is_active: true },
      attributes: ['code', 'name']
    });

    const results = [];
    const errors = [];

    // Save the source language first
    await translationService.saveUILabel(key, fromLang, value, category);
    results.push({ language_code: fromLang, value, status: 'saved' });

    // Translate to all other active languages
    for (const lang of languages) {
      if (lang.code === fromLang) continue;

      try {
        // Translate using AI
        const translatedValue = await translationService.aiTranslate(value, fromLang, lang.code);

        // Save the translation
        await translationService.saveUILabel(key, lang.code, translatedValue, category);

        results.push({
          language_code: lang.code,
          language_name: lang.name,
          value: translatedValue,
          status: 'translated'
        });
      } catch (error) {
        console.error(`Translation error for ${lang.code}:`, error);
        errors.push({
          language_code: lang.code,
          language_name: lang.name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        key,
        category,
        translations: results,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `UI label translated to ${results.length - 1} languages${errors.length > 0 ? ` (${errors.length} failed)` : ''}`
    });
  } catch (error) {
    console.error('Auto-translate UI label error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Auto-translation failed'
    });
  }
});

// @route   POST /api/translations/ui-labels/bulk-translate
// @desc    AI translate all UI labels from one language to another
// @access  Private
router.post('/ui-labels/bulk-translate', authMiddleware, async (req, res) => {
  try {
    const { fromLang, toLang } = req.body;

    if (!fromLang || !toLang) {
      return res.status(400).json({
        success: false,
        message: 'fromLang and toLang are required'
      });
    }

    if (fromLang === toLang) {
      return res.status(400).json({
        success: false,
        message: 'Source and target languages cannot be the same'
      });
    }

    // Get all labels in the source language
    const sourceLabels = await translationService.getUILabels(fromLang);

    if (!sourceLabels || !sourceLabels.labels) {
      return res.json({
        success: true,
        message: 'No labels found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Get existing labels in target language to avoid re-translating
    const targetLabels = await translationService.getUILabels(toLang);
    const existingKeys = new Set(Object.keys(targetLabels.labels || {}));

    // Flatten the source labels
    const flattenLabels = (obj, prefix = '') => {
      const result = {};
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(result, flattenLabels(value, fullKey));
        } else {
          result[fullKey] = value;
        }
      });
      return result;
    };

    const flatSourceLabels = flattenLabels(sourceLabels.labels);
    const keysToTranslate = Object.keys(flatSourceLabels).filter(key => !existingKeys.has(key));

    if (keysToTranslate.length === 0) {
      return res.json({
        success: true,
        message: 'No missing translations found',
        data: {
          total: Object.keys(flatSourceLabels).length,
          translated: 0,
          skipped: Object.keys(flatSourceLabels).length,
          failed: 0
        }
      });
    }

    const results = {
      total: Object.keys(flatSourceLabels).length,
      translated: 0,
      skipped: Object.keys(flatSourceLabels).length - keysToTranslate.length,
      failed: 0,
      errors: []
    };

    // Translate each label
    for (const key of keysToTranslate) {
      try {
        const sourceValue = flatSourceLabels[key];
        if (!sourceValue || typeof sourceValue !== 'string') {
          results.skipped++;
          continue;
        }

        // Translate using AI
        const translatedValue = await translationService.aiTranslate(sourceValue, fromLang, toLang);

        // Determine category from key
        const category = key.split('.')[0] || 'common';

        // Save the translation
        await translationService.saveUILabel(key, toLang, translatedValue, category, 'system');

        results.translated++;
      } catch (error) {
        console.error(`Error translating UI label ${key}:`, error);
        results.failed++;
        results.errors.push({
          key,
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
    console.error('Bulk translate UI labels error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// ============================================
// ENTITY TRANSLATION ROUTES
// ============================================

// @route   GET /api/translations/entity/:type/:id
// @desc    Get entity translations
// @access  Public
router.get('/entity/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { lang } = req.query;

    if (lang) {
      // Get specific language translation
      const translation = await translationService.getEntityTranslation(type, id, lang);

      res.json({
        success: true,
        data: translation
      });
    } else {
      // Get all translations for entity
      const Model = translationService._getEntityModel(type);
      const entity = await Model.findByPk(id, {
        attributes: ['id', 'translations']
      });

      if (!entity) {
        return res.status(404).json({
          success: false,
          message: `${type} not found`
        });
      }

      res.json({
        success: true,
        data: entity.translations || {}
      });
    }
  } catch (error) {
    console.error('Get entity translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/translations/entity/:type/:id
// @desc    Save entity translation
// @access  Private
router.put('/entity/:type/:id', authMiddleware, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { language_code, translations } = req.body;

    if (!language_code || !translations) {
      return res.status(400).json({
        success: false,
        message: 'language_code and translations are required'
      });
    }

    const entity = await translationService.saveEntityTranslation(
      type,
      id,
      language_code,
      translations
    );

    res.json({
      success: true,
      data: entity,
      message: 'Translation saved successfully'
    });
  } catch (error) {
    console.error('Save entity translation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// ============================================
// REPORTING ROUTES
// ============================================

// @route   GET /api/translations/missing-report
// @desc    Get missing translations report
// @access  Private
router.get('/missing-report', authMiddleware, async (req, res) => {
  try {
    const report = await translationService.getMissingTranslationsReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Missing report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/translations/entity-stats
// @desc    Get translation statistics for all entity types
// @access  Private
router.get('/entity-stats', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Get all active languages
    const languages = await Language.findAll({
      where: { is_active: true },
      attributes: ['code', 'name', 'native_name']
    });

    const languageCodes = languages.map(l => l.code);

    // Define entity types to check
    const entityTypes = [
      { type: 'category', model: Category, icon: '📁', name: 'Categories' },
      { type: 'product', model: Product, icon: '📦', name: 'Products' },
      { type: 'attribute', model: Attribute, icon: '🏷', name: 'Attributes' },
      { type: 'cms_page', model: CmsPage, icon: '📄', name: 'CMS Pages' },
      { type: 'cms_block', model: CmsBlock, icon: '📝', name: 'CMS Blocks' },
      { type: 'product_tab', model: ProductTab, icon: '📑', name: 'Product Tabs' },
      { type: 'product_label', model: ProductLabel, icon: '🏷️', name: 'Product Labels' },
      { type: 'cookie_consent', model: CookieConsentSettings, icon: '🍪', name: 'Cookie Consent' }
    ];

    const stats = [];

    for (const entityType of entityTypes) {
      try {
        // Get all entities for this store
        const entities = await entityType.model.findAll({
          where: { store_id },
          attributes: ['id', 'translations']
        });

        const totalItems = entities.length;
        let translatedCount = 0;
        const missingLanguages = new Set();

        // Check translation completeness
        entities.forEach(entity => {
          const translations = entity.translations || {};
          let hasAllTranslations = true;

          languageCodes.forEach(langCode => {
            if (!translations[langCode] || Object.keys(translations[langCode]).length === 0) {
              missingLanguages.add(langCode);
              hasAllTranslations = false;
            }
          });

          if (hasAllTranslations) {
            translatedCount++;
          }
        });

        const completionPercentage = totalItems > 0
          ? Math.round((translatedCount / totalItems) * 100)
          : 100;

        stats.push({
          type: entityType.type,
          name: entityType.name,
          icon: entityType.icon,
          totalItems,
          translatedItems: translatedCount,
          completionPercentage,
          missingLanguages: Array.from(missingLanguages).map(code => {
            const lang = languages.find(l => l.code === code);
            return {
              code,
              name: lang?.name || code,
              native_name: lang?.native_name || code
            };
          })
        });
      } catch (error) {
        console.error(`Error getting stats for ${entityType.type}:`, error);
        stats.push({
          type: entityType.type,
          name: entityType.name,
          icon: entityType.icon,
          totalItems: 0,
          translatedItems: 0,
          completionPercentage: 0,
          missingLanguages: [],
          error: error.message
        });
      }
    }

    // Handle AttributeValue separately (doesn't have direct store_id)
    try {
      const { Op } = require('sequelize');

      // Get all attributes for this store
      const attributes = await Attribute.findAll({
        where: { store_id },
        attributes: ['id']
      });

      const attributeIds = attributes.map(attr => attr.id);

      // Get all attribute values for these attributes
      const values = await AttributeValue.findAll({
        where: { attribute_id: { [Op.in]: attributeIds } },
        attributes: ['id', 'translations']
      });

      const totalItems = values.length;
      let translatedCount = 0;
      const missingLanguages = new Set();

      // Check translation completeness
      values.forEach(value => {
        const translations = value.translations || {};
        let hasAllTranslations = true;

        languageCodes.forEach(langCode => {
          if (!translations[langCode] || Object.keys(translations[langCode]).length === 0) {
            missingLanguages.add(langCode);
            hasAllTranslations = false;
          }
        });

        if (hasAllTranslations) {
          translatedCount++;
        }
      });

      const completionPercentage = totalItems > 0
        ? Math.round((translatedCount / totalItems) * 100)
        : 100;

      stats.push({
        type: 'attribute_value',
        name: 'Attribute Values',
        icon: '🔖',
        totalItems,
        translatedItems: translatedCount,
        completionPercentage,
        missingLanguages: Array.from(missingLanguages).map(code => {
          const lang = languages.find(l => l.code === code);
          return {
            code,
            name: lang?.name || code,
            native_name: lang?.native_name || code
          };
        })
      });
    } catch (error) {
      console.error('Error getting stats for attribute_value:', error);
      stats.push({
        type: 'attribute_value',
        name: 'Attribute Values',
        icon: '🔖',
        totalItems: 0,
        translatedItems: 0,
        completionPercentage: 0,
        missingLanguages: [],
        error: error.message
      });
    }

    res.json({
      success: true,
      data: {
        stats,
        languages: languages.map(l => ({
          code: l.code,
          name: l.name,
          native_name: l.native_name
        }))
      }
    });
  } catch (error) {
    console.error('Entity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/translations/bulk-translate-entities
// @desc    AI translate multiple entity types at once
// @access  Private
router.post('/bulk-translate-entities', authMiddleware, async (req, res) => {
  try {
    const { store_id, entity_types, fromLang, toLang } = req.body;

    if (!store_id || !entity_types || !Array.isArray(entity_types) || entity_types.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'store_id and entity_types array are required'
      });
    }

    if (!fromLang || !toLang) {
      return res.status(400).json({
        success: false,
        message: 'fromLang and toLang are required'
      });
    }

    if (fromLang === toLang) {
      return res.status(400).json({
        success: false,
        message: 'Source and target languages cannot be the same'
      });
    }

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

    const { Op } = require('sequelize');
    const entityTypeMap = {
      category: { model: Category, name: 'Categories' },
      product: { model: Product, name: 'Products' },
      attribute: { model: Attribute, name: 'Attributes' },
      cms_page: { model: CmsPage, name: 'CMS Pages' },
      cms_block: { model: CmsBlock, name: 'CMS Blocks' },
      product_tab: { model: ProductTab, name: 'Product Tabs' },
      product_label: { model: ProductLabel, name: 'Product Labels' },
      cookie_consent: { model: CookieConsentSettings, name: 'Cookie Consent' },
      attribute_value: { model: AttributeValue, name: 'Attribute Values', special: true }
    };

    const allResults = {
      total: 0,
      translated: 0,
      skipped: 0,
      failed: 0,
      byEntity: {}
    };

    // Translate each entity type
    for (const entityType of entity_types) {
      try {
        const entityConfig = entityTypeMap[entityType];
        if (!entityConfig) {
          allResults.byEntity[entityType] = {
            success: false,
            message: `Unknown entity type: ${entityType}`
          };
          continue;
        }

        let entities;

        // Handle AttributeValue specially (no direct store_id)
        if (entityConfig.special && entityType === 'attribute_value') {
          const attributes = await Attribute.findAll({
            where: { store_id },
            attributes: ['id']
          });
          const attributeIds = attributes.map(attr => attr.id);
          entities = await AttributeValue.findAll({
            where: { attribute_id: { [Op.in]: attributeIds } }
          });
        } else {
          entities = await entityConfig.model.findAll({
            where: { store_id }
          });
        }

        const results = {
          total: entities.length,
          translated: 0,
          skipped: 0,
          failed: 0,
          errors: []
        };

        // Translate each entity
        for (const entity of entities) {
          try {
            // Check if source translation exists
            if (!entity.translations || !entity.translations[fromLang]) {
              results.skipped++;
              continue;
            }

            // Check if target translation already exists
            if (entity.translations[toLang]) {
              results.skipped++;
              continue;
            }

            // Translate the entity
            await translationService.aiTranslateEntity(entityType, entity.id, fromLang, toLang);
            results.translated++;
          } catch (error) {
            console.error(`Error translating ${entityType} ${entity.id}:`, error);
            results.failed++;
            results.errors.push({
              id: entity.id,
              error: error.message
            });
          }
        }

        allResults.total += results.total;
        allResults.translated += results.translated;
        allResults.skipped += results.skipped;
        allResults.failed += results.failed;
        allResults.byEntity[entityType] = {
          name: entityConfig.name,
          ...results
        };
      } catch (error) {
        console.error(`Error processing entity type ${entityType}:`, error);
        allResults.byEntity[entityType] = {
          success: false,
          message: error.message
        };
      }
    }

    res.json({
      success: true,
      message: `Multi-entity bulk translation completed. Total: ${allResults.total}, Translated: ${allResults.translated}, Skipped: ${allResults.skipped}, Failed: ${allResults.failed}`,
      data: allResults
    });
  } catch (error) {
    console.error('Bulk translate entities error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
