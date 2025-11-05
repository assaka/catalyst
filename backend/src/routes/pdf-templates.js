const express = require('express');
const { body, validationResult } = require('express-validator');
const { PdfTemplate, PdfTemplateTranslation, Store } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

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
    const { html_template, settings, is_active, translations } = req.body;

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

    // Build update object
    const updateData = {};
    if (html_template !== undefined) updateData.html_template = html_template;
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

    // Restore to default template
    await template.update({
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

module.exports = router;
