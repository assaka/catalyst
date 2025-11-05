const express = require('express');
const { body, validationResult } = require('express-validator');
const { EmailTemplate, EmailTemplateTranslation, Store } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const emailService = require('../services/email-service');
const { getVariablesForTemplate } = require('../services/email-template-variables');
const translationService = require('../services/translation-service');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/email-templates
 * Get all email templates for a store
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

    const templates = await EmailTemplate.findAll({
      where: { store_id },
      include: [{
        model: EmailTemplateTranslation,
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
            subject: trans.subject,
            template_content: trans.template_content,
            html_content: trans.html_content
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
    console.error('Get email templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * GET /api/email-templates/:id
 * Get single email template with translations
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await EmailTemplate.findByPk(id, {
      include: [{
        model: EmailTemplateTranslation,
        as: 'translationsData'
      }]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
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
          subject: trans.subject,
          template_content: trans.template_content,
          html_content: trans.html_content
        };
      });
    }

    delete templateData.translationsData;
    templateData.translations = translations;

    // Add available variables
    templateData.availableVariables = getVariablesForTemplate(template.identifier);

    res.json({
      success: true,
      data: templateData
    });
  } catch (error) {
    console.error('Get email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * POST /api/email-templates
 * Create new custom email template (system templates are pre-created)
 */
router.post('/', [
  body('store_id').isUUID().withMessage('Valid store_id is required'),
  body('identifier').notEmpty().withMessage('identifier is required'),
  body('subject').notEmpty().withMessage('subject is required'),
  body('content_type').isIn(['template', 'html', 'both']).withMessage('Invalid content_type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, identifier, subject, content_type, template_content, html_content, is_active, sort_order, attachment_enabled, attachment_config, translations } = req.body;

    // Prevent creating system template identifiers
    const systemIdentifiers = ['signup_email', 'email_verification', 'order_success_email'];
    if (systemIdentifiers.includes(identifier)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create template with system identifier. System templates are pre-created.'
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

    // Get available variables for this template type
    const variables = getVariablesForTemplate(identifier);

    // Create template (is_system will be false by default)
    const template = await EmailTemplate.create({
      store_id,
      identifier,
      subject,
      content_type,
      template_content,
      html_content,
      variables,
      is_active: is_active !== undefined ? is_active : true,
      is_system: false,
      sort_order: sort_order || 0,
      attachment_enabled: attachment_enabled || false,
      attachment_config: attachment_config || {}
    });

    // Create translations if provided
    if (translations && typeof translations === 'object') {
      for (const [lang_code, trans_data] of Object.entries(translations)) {
        // Only save translations that have at least a subject
        if (trans_data && trans_data.subject && trans_data.subject.trim()) {
          await EmailTemplateTranslation.create({
            email_template_id: template.id,
            language_code: lang_code,
            subject: trans_data.subject,
            template_content: trans_data.template_content || null,
            html_content: trans_data.html_content || null
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Email template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * PUT /api/email-templates/:id
 * Update email template
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { identifier, subject, content_type, template_content, html_content, is_active, sort_order, attachment_enabled, attachment_config, translations } = req.body;

    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
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

    // Prevent changing identifier for system templates
    if (template.is_system && identifier && identifier !== template.identifier) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change identifier for system templates'
      });
    }

    // Build update object
    const updateData = {
      subject,
      content_type,
      template_content,
      html_content,
      is_active,
      sort_order,
      attachment_enabled,
      attachment_config
    };

    // Only allow identifier change for non-system templates
    if (!template.is_system && identifier) {
      updateData.identifier = identifier;
    }

    // Update template
    await template.update(updateData);

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      for (const [lang_code, trans_data] of Object.entries(translations)) {
        // Only save translations that have at least a subject
        if (trans_data && trans_data.subject && trans_data.subject.trim()) {
          await EmailTemplateTranslation.upsert({
            email_template_id: template.id,
            language_code: lang_code,
            subject: trans_data.subject,
            template_content: trans_data.template_content || null,
            html_content: trans_data.html_content || null
          });
        } else {
          // If translation is empty, delete it if it exists
          await EmailTemplateTranslation.destroy({
            where: {
              email_template_id: template.id,
              language_code: lang_code
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Email template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * DELETE /api/email-templates/:id
 * Delete email template (cannot delete system templates)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Prevent deleting system templates
    if (template.is_system) {
      return res.status(400).json({
        success: false,
        message: 'System templates cannot be deleted. You can deactivate them instead.'
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

    await template.destroy();

    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    console.error('Delete email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * POST /api/email-templates/:id/test
 * Send test email
 */
router.post('/:id/test', [
  body('test_email').isEmail().withMessage('Valid test email is required'),
  body('language_code').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { test_email, language_code = 'en' } = req.body;

    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
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

    // Send test email
    const result = await emailService.sendTestEmail(
      template.store_id,
      template.identifier,
      test_email,
      language_code
    );

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

/**
 * POST /api/email-templates/bulk-translate
 * Bulk translate email templates using AI
 */
router.post('/bulk-translate', [
  body('store_id').isUUID().withMessage('Valid store_id is required'),
  body('from_lang').notEmpty().withMessage('from_lang is required'),
  body('to_lang').notEmpty().withMessage('to_lang is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, from_lang, to_lang } = req.body;

    // Check store access
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get all templates for the store
    const templates = await EmailTemplate.findAll({
      where: { store_id, is_active: true }
    });

    let translated = 0;
    let skipped = 0;
    let failed = 0;
    const errors_list = [];

    for (const template of templates) {
      try {
        // Check if translation already exists
        const existingTranslation = await EmailTemplateTranslation.findOne({
          where: {
            email_template_id: template.id,
            language_code: to_lang
          }
        });

        if (existingTranslation) {
          skipped++;
          continue;
        }

        // Translate subject
        const translatedSubject = await translationService.translateText(
          template.subject,
          from_lang,
          to_lang
        );

        // Translate content
        let translatedTemplateContent = null;
        let translatedHtmlContent = null;

        if (template.template_content) {
          translatedTemplateContent = await translationService.translateText(
            template.template_content,
            from_lang,
            to_lang
          );
        }

        if (template.html_content) {
          translatedHtmlContent = await translationService.translateText(
            template.html_content,
            from_lang,
            to_lang
          );
        }

        // Create translation
        await EmailTemplateTranslation.create({
          email_template_id: template.id,
          language_code: to_lang,
          subject: translatedSubject,
          template_content: translatedTemplateContent,
          html_content: translatedHtmlContent
        });

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

/**
 * POST /api/email-templates/:id/restore-default
 * Restore system template to default content
 */
router.post('/:id/restore-default', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await EmailTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
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

    // Restore to default content
    await template.update({
      subject: template.default_subject || template.subject,
      template_content: template.default_template_content || template.template_content,
      html_content: template.default_html_content || template.html_content
    });

    // Also delete all translations to restore them to default
    await EmailTemplateTranslation.destroy({
      where: { email_template_id: template.id }
    });

    res.json({
      success: true,
      message: 'Email template restored to default successfully',
      data: template
    });
  } catch (error) {
    console.error('Restore template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
