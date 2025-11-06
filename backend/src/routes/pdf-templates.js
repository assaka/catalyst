const express = require('express');
const { body, validationResult } = require('express-validator');
const { PdfTemplate, PdfTemplateTranslation, Store } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const translationService = require('../services/translation-service');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/pdf-templates
 * Get all PDF templates for a store
 */
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const templates = await PdfTemplate.findAll({
      where: { store_id },
      include: [{
        model: PdfTemplateTranslation,
        as: 'translationsData'
      }],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    // Format translations as object for easier frontend consumption
    const formattedTemplates = templates.map(template => {
      const templateData = template.toJSON();
      const translations = {};

      // Add all language translations from translations table
      if (templateData.translationsData) {
        templateData.translationsData.forEach(trans => {
          translations[trans.language_code] = {
            html_template: trans.html_template
          };
        });
      }

      delete templateData.translationsData;
      templateData.translations = translations;

      return templateData;
    });

    res.json({
      success: true,
      data: formattedTemplates
    });
  } catch (error) {
    console.error('Get PDF templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * GET /api/pdf-templates/:id
 * Get single PDF template
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await PdfTemplate.findByPk(id, {
      include: [{
        model: PdfTemplateTranslation,
        as: 'translationsData'
      }]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'PDF template not found'
      });
    }

    // Check store access
    req.params.store_id = template.store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Format translations
    const templateData = template.toJSON();
    const translations = {};

    // Add all language translations from translations table
    if (templateData.translationsData) {
      templateData.translationsData.forEach(trans => {
        translations[trans.language_code] = {
          html_template: trans.html_template
        };
      });
    }

    delete templateData.translationsData;
    templateData.translations = translations;

    res.json({
      success: true,
      data: templateData
    });
  } catch (error) {
    console.error('Get PDF template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/pdf-templates/:id
 * Update PDF template
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { settings, is_active, translations } = req.body;

    const template = await PdfTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'PDF template not found'
      });
    }

    // Check store access
    req.params.store_id = template.store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Build update object (content is now stored only in translations table)
    const updateData = {};
    if (settings !== undefined) updateData.settings = settings;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update template
    await template.update(updateData);

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      for (const [lang_code, trans_data] of Object.entries(translations)) {
        // Only save translations that have html_template content
        if (trans_data && trans_data.html_template && trans_data.html_template.trim()) {
          await PdfTemplateTranslation.upsert({
            pdf_template_id: template.id,
            language_code: lang_code,
            html_template: trans_data.html_template
          });
        } else {
          // Delete translation if html_template is empty
          await PdfTemplateTranslation.destroy({
            where: {
              pdf_template_id: template.id,
              language_code: lang_code
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'PDF template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Update PDF template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * POST /api/pdf-templates/:id/restore-default
 * Restore system PDF template to default
 */
router.post('/:id/restore-default', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await PdfTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'PDF template not found'
      });
    }

    // Only system templates can be restored
    if (!template.is_system) {
      return res.status(400).json({
        success: false,
        message: 'Only system templates can be restored to default'
      });
    }

    // Check store access
    req.params.store_id = template.store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Delete all existing translations
    await PdfTemplateTranslation.destroy({
      where: { pdf_template_id: template.id }
    });

    // Restore English translation with default content
    await PdfTemplateTranslation.create({
      pdf_template_id: template.id,
      language_code: 'en',
      html_template: template.default_html_template
    });

    res.json({
      success: true,
      message: 'PDF template restored to default successfully',
      data: template
    });
  } catch (error) {
    console.error('Restore PDF template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * POST /api/pdf-templates/bulk-translate
 * Bulk translate PDF templates using AI
 */
router.post('/bulk-translate', [
  body('store_id').isUUID().withMessage('Valid store_id is required'),
  body('fromLang').notEmpty().withMessage('fromLang is required'),
  body('toLang').notEmpty().withMessage('toLang is required')
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
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get all templates for the store with source language translations
    const templates = await PdfTemplate.findAll({
      where: { store_id, is_active: true },
      include: [{
        model: PdfTemplateTranslation,
        as: 'translationsData',
        where: { language_code: fromLang },
        required: true // Only include templates that have source language
      }]
    });

    console.log(`📄 Bulk translating ${templates.length} PDF templates from ${fromLang} to ${toLang}`);

    let translated = 0;
    let skipped = 0;
    let failed = 0;
    const errors_list = [];

    for (const template of templates) {
      try {
        console.log(`🔄 Processing template: ${template.identifier} (${template.id})`);

        // Get source translation
        const sourceTranslation = template.translationsData[0]; // We know it exists due to required: true

        // Check if target translation already exists
        const existingTranslation = await PdfTemplateTranslation.findOne({
          where: {
            pdf_template_id: template.id,
            language_code: toLang
          }
        });

        if (existingTranslation) {
          console.log(`⏭️  Skipping ${template.identifier} - translation already exists`);
          skipped++;
          continue;
        }

        // Translate HTML template
        console.log(`🌐 Translating HTML template for ${template.identifier}...`);
        const translatedHtmlTemplate = await translationService.aiTranslate(
          sourceTranslation.html_template,
          fromLang,
          toLang
        );
        console.log(`✅ HTML template translated (${translatedHtmlTemplate.length} chars)`);

        // Create translation
        console.log(`💾 Saving translation for ${template.identifier} to database...`);
        const savedTranslation = await PdfTemplateTranslation.create({
          pdf_template_id: template.id,
          language_code: toLang,
          html_template: translatedHtmlTemplate
        });
        console.log(`✅ Translation saved with ID: ${savedTranslation.id}`);

        translated++;
      } catch (error) {
        console.error(`Failed to translate template ${template.id}:`, error.message);
        failed++;
        errors_list.push({
          template_id: template.id,
          identifier: template.identifier,
          error: error.message
        });
      }
    }

    console.log(`📊 Bulk translate complete: ${translated} translated, ${skipped} skipped, ${failed} failed`);

    res.json({
      success: true,
      data: {
        translated,
        skipped,
        failed,
        errors: errors_list
      }
    });
  } catch (error) {
    console.error('Bulk translate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
