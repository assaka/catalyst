const express = require('express');
const { Translation, Language, Product, Category, CmsPage, CmsBlock } = require('../models');
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

    const labels = await translationService.getUILabels(lang);

    res.json({
      success: true,
      data: {
        language: lang,
        labels
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
    const { key, language_code, value, category } = req.body;

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
      category
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

module.exports = router;
