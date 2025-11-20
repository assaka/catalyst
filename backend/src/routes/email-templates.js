const express = require('express');
const { body, validationResult } = require('express-validator');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const emailService = require('../services/email-service');
const { getVariablesForTemplate } = require('../services/email-template-variables');
const translationService = require('../services/translation-service');
const creditService = require('../services/credit-service');

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

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get all templates for the store
    const { data: templates, error: templatesError } = await tenantDb
      .from('email_templates')
      .select('*')
      .eq('store_id', store_id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (templatesError) throw templatesError;

    // Get all translations for these templates
    const templateIds = templates.map(t => t.id);
    let translationsData = [];

    if (templateIds.length > 0) {
      const { data: translations, error: translationsError } = await tenantDb
        .from('email_template_translations')
        .select('*')
        .in('email_template_id', templateIds);

      if (translationsError) throw translationsError;
      translationsData = translations || [];
    }

    // Format translations as object for easier frontend consumption
    const formattedTemplates = templates.map(template => {
      const templateData = { ...template };
      const translations = {};

      // Add all language translations from translations table
      const templateTranslations = translationsData.filter(t => t.email_template_id === template.id);
      templateTranslations.forEach(trans => {
        translations[trans.language_code] = {
          subject: trans.subject,
          template_content: trans.template_content,
          html_content: trans.html_content
        };
      });

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
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access first
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get the template
    const { data: template, error: templateError } = await tenantDb
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Get translations for this template
    const { data: translationsData, error: translationsError } = await tenantDb
      .from('email_template_translations')
      .select('*')
      .eq('email_template_id', id);

    if (translationsError) throw translationsError;

    // Format translations
    const templateData = { ...template };
    const translations = {};

    // Add all language translations from translations table
    if (translationsData) {
      translationsData.forEach(trans => {
        translations[trans.language_code] = {
          subject: trans.subject,
          template_content: trans.template_content,
          html_content: trans.html_content
        };
      });
    }

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
  body('content_type').isIn(['template', 'html', 'both']).withMessage('Invalid content_type'),
  body('translations').notEmpty().withMessage('translations object is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, identifier, content_type, is_active, sort_order, attachment_enabled, attachment_config, translations } = req.body;

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

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get available variables for this template type
    const variables = getVariablesForTemplate(identifier);

    // Create template (content is stored in translations table)
    const { data: template, error: templateError } = await tenantDb
      .from('email_templates')
      .insert({
        store_id,
        identifier,
        content_type,
        variables,
        is_active: is_active !== undefined ? is_active : true,
        is_system: false,
        sort_order: sort_order || 0,
        attachment_enabled: attachment_enabled || false,
        attachment_config: attachment_config || {}
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Create translations if provided
    if (translations && typeof translations === 'object') {
      const translationsToInsert = [];

      for (const [lang_code, trans_data] of Object.entries(translations)) {
        // Only save translations that have at least a subject
        if (trans_data && trans_data.subject && trans_data.subject.trim()) {
          translationsToInsert.push({
            email_template_id: template.id,
            language_code: lang_code,
            subject: trans_data.subject,
            template_content: trans_data.template_content || null,
            html_content: trans_data.html_content || null
          });
        }
      }

      if (translationsToInsert.length > 0) {
        const { error: translationsError } = await tenantDb
          .from('email_template_translations')
          .insert(translationsToInsert);

        if (translationsError) throw translationsError;
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
    const { identifier, content_type, is_active, sort_order, attachment_enabled, attachment_config, translations } = req.body;
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access first
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get the template
    const { data: template, error: templateError } = await tenantDb
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Prevent changing identifier for system templates
    if (template.is_system && identifier && identifier !== template.identifier) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change identifier for system templates'
      });
    }

    // Build update object (content is now stored only in translations table)
    const updateData = {};
    if (content_type !== undefined) updateData.content_type = content_type;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (attachment_enabled !== undefined) updateData.attachment_enabled = attachment_enabled;
    if (attachment_config !== undefined) updateData.attachment_config = attachment_config;

    // Only allow identifier change for non-system templates
    if (!template.is_system && identifier) {
      updateData.identifier = identifier;
    }

    // Update template if there are changes
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await tenantDb
        .from('email_templates')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      for (const [lang_code, trans_data] of Object.entries(translations)) {
        // Only save translations that have at least a subject
        if (trans_data && trans_data.subject && trans_data.subject.trim()) {
          // Upsert translation (Supabase upsert syntax)
          const { error: upsertError } = await tenantDb
            .from('email_template_translations')
            .upsert({
              email_template_id: template.id,
              language_code: lang_code,
              subject: trans_data.subject,
              template_content: trans_data.template_content || null,
              html_content: trans_data.html_content || null
            }, {
              onConflict: 'email_template_id,language_code'
            });

          if (upsertError) throw upsertError;
        } else {
          // If translation is empty, delete it if it exists
          const { error: deleteError } = await tenantDb
            .from('email_template_translations')
            .delete()
            .eq('email_template_id', template.id)
            .eq('language_code', lang_code);

          if (deleteError) throw deleteError;
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
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access first
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get the template
    const { data: template, error: templateError } = await tenantDb
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
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

    // Delete the template (cascade will delete translations)
    const { error: deleteError } = await tenantDb
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

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
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access first
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get the template
    const { data: template, error: templateError } = await tenantDb
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

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

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get all active templates for the store
    const { data: templates, error: templatesError } = await tenantDb
      .from('email_templates')
      .select('*')
      .eq('store_id', store_id)
      .eq('is_active', true);

    if (templatesError) throw templatesError;

    // Get all translations for these templates in the source language
    const templateIds = templates.map(t => t.id);
    const { data: sourceTranslations, error: sourceError } = await tenantDb
      .from('email_template_translations')
      .select('*')
      .in('email_template_id', templateIds)
      .eq('language_code', fromLang);

    if (sourceError) throw sourceError;

    // Filter templates to only those that have source language translations
    const templatesWithSource = templates.filter(t =>
      sourceTranslations.some(st => st.email_template_id === t.id)
    );

    console.log(`📧 Bulk translating ${templatesWithSource.length} email templates from ${fromLang} to ${toLang}`);

    let translated = 0;
    let skipped = 0;
    let failed = 0;
    const errors_list = [];

    for (const template of templatesWithSource) {
      try {
        console.log(`🔄 Processing template: ${template.identifier} (${template.id})`);

        // Get source translation
        const sourceTranslation = sourceTranslations.find(st => st.email_template_id === template.id);

        // Check if target translation already exists
        const { data: existingTranslation, error: existingError } = await tenantDb
          .from('email_template_translations')
          .select('*')
          .eq('email_template_id', template.id)
          .eq('language_code', toLang)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existingTranslation) {
          console.log(`⏭️  Skipping ${template.identifier} - translation already exists`);
          skipped++;
          continue;
        }

        // Translate subject
        console.log(`🌐 Translating subject for ${template.identifier}...`);
        const translatedSubject = await translationService.aiTranslate(
          sourceTranslation.subject,
          fromLang,
          toLang
        );
        console.log(`✅ Subject translated: ${translatedSubject}`);

        // Translate content
        let translatedTemplateContent = null;
        let translatedHtmlContent = null;

        if (sourceTranslation.template_content) {
          translatedTemplateContent = await translationService.aiTranslate(
            sourceTranslation.template_content,
            fromLang,
            toLang
          );
        }

        if (sourceTranslation.html_content) {
          translatedHtmlContent = await translationService.aiTranslate(
            sourceTranslation.html_content,
            fromLang,
            toLang
          );
        }

        // Create translation
        console.log(`💾 Saving translation for ${template.identifier} to database...`);
        const { data: savedTranslation, error: saveError } = await tenantDb
          .from('email_template_translations')
          .insert({
            email_template_id: template.id,
            language_code: toLang,
            subject: translatedSubject,
            template_content: translatedTemplateContent,
            html_content: translatedHtmlContent
          })
          .select()
          .single();

        if (saveError) throw saveError;
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

    // Deduct credits for ALL templates (including skipped)
    const totalItems = templates.length;
    let actualCost = 0;

    if (totalItems > 0) {
      const costPerItem = await translationService.getTranslationCost('email-template');
      actualCost = totalItems * costPerItem;

      console.log(`💰 Email template bulk translate - charging for ${totalItems} items × ${costPerItem} credits = ${actualCost} credits`);

      try {
        await creditService.deduct(
          req.user.id,
          store_id,
          actualCost,
          `Bulk Email Template Translation (${fromLang} → ${toLang})`,
          {
            fromLang,
            toLang,
            totalItems,
            translated,
            skipped,
            failed,
            note: 'Charged for all items including skipped'
          },
          null,
          'ai_translation'
        );
        console.log(`✅ Deducted ${actualCost} credits for ${totalItems} email templates`);
      } catch (deductError) {
        console.error('❌ CREDIT DEDUCTION FAILED (email-templates/bulk-translate):', deductError);
        actualCost = 0; // Don't show false info in frontend
      }
    }

    res.json({
      success: true,
      data: {
        translated,
        skipped,
        failed,
        errors: errors_list
      },
      creditsDeducted: actualCost
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
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access first
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get the template
    const { data: template, error: templateError } = await tenantDb
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
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

    // Delete all existing translations
    const { error: deleteError } = await tenantDb
      .from('email_template_translations')
      .delete()
      .eq('email_template_id', template.id);

    if (deleteError) throw deleteError;

    // Restore English translation with default content
    const { error: createError } = await tenantDb
      .from('email_template_translations')
      .insert({
        email_template_id: template.id,
        language_code: 'en',
        subject: template.default_subject,
        template_content: template.default_template_content,
        html_content: template.default_html_content
      });

    if (createError) throw createError;

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
