const express = require('express');
const { body, validationResult } = require('express-validator');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const translationService = require('../services/translation-service');
const creditService = require('../services/credit-service');

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

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get all templates for the store
    const { data: templates, error: templatesError } = await tenantDb
      .from('pdf_templates')
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
        .from('pdf_template_translations')
        .select('*')
        .in('pdf_template_id', templateIds);

      if (translationsError) throw translationsError;
      translationsData = translations || [];
    }

    // Format translations as object for easier frontend consumption
    const formattedTemplates = templates.map(template => {
      const templateData = { ...template };
      const translations = {};

      // Add all language translations from translations table
      const templateTranslations = translationsData.filter(t => t.pdf_template_id === template.id);
      templateTranslations.forEach(trans => {
        translations[trans.language_code] = {
          html_template: trans.html_template
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
      .from('pdf_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        message: 'PDF template not found'
      });
    }

    // Get translations for this template
    const { data: translationsData, error: translationsError } = await tenantDb
      .from('pdf_template_translations')
      .select('*')
      .eq('pdf_template_id', id);

    if (translationsError) throw translationsError;

    // Format translations
    const templateData = { ...template };
    const translations = {};

    // Add all language translations from translations table
    if (translationsData) {
      translationsData.forEach(trans => {
        translations[trans.language_code] = {
          html_template: trans.html_template
        };
      });
    }

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
      .from('pdf_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        message: 'PDF template not found'
      });
    }

    // Build update object (content is now stored only in translations table)
    const updateData = {};
    if (settings !== undefined) updateData.settings = settings;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update template if there are changes
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await tenantDb
        .from('pdf_templates')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // Update translations if provided
    if (translations && typeof translations === 'object') {
      for (const [lang_code, trans_data] of Object.entries(translations)) {
        // Only save translations that have html_template content
        if (trans_data && trans_data.html_template && trans_data.html_template.trim()) {
          // Upsert translation (Supabase upsert syntax)
          const { error: upsertError } = await tenantDb
            .from('pdf_template_translations')
            .upsert({
              pdf_template_id: template.id,
              language_code: lang_code,
              html_template: trans_data.html_template
            }, {
              onConflict: 'pdf_template_id,language_code'
            });

          if (upsertError) throw upsertError;
        } else {
          // If translation is empty, delete it if it exists
          const { error: deleteError } = await tenantDb
            .from('pdf_template_translations')
            .delete()
            .eq('pdf_template_id', template.id)
            .eq('language_code', lang_code);

          if (deleteError) throw deleteError;
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
      .from('pdf_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
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

    // Delete all existing translations
    const { error: deleteError } = await tenantDb
      .from('pdf_template_translations')
      .delete()
      .eq('pdf_template_id', template.id);

    if (deleteError) throw deleteError;

    // Restore English translation with default content
    const { error: createError } = await tenantDb
      .from('pdf_template_translations')
      .insert({
        pdf_template_id: template.id,
        language_code: 'en',
        html_template: template.default_html_template
      });

    if (createError) throw createError;

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

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get all active templates for the store
    const { data: templates, error: templatesError } = await tenantDb
      .from('pdf_templates')
      .select('*')
      .eq('store_id', store_id)
      .eq('is_active', true);

    if (templatesError) throw templatesError;

    // Get all translations for these templates in the source language
    const templateIds = templates.map(t => t.id);
    const { data: sourceTranslations, error: sourceError } = await tenantDb
      .from('pdf_template_translations')
      .select('*')
      .in('pdf_template_id', templateIds)
      .eq('language_code', fromLang);

    if (sourceError) throw sourceError;

    // Filter templates to only those that have source language translations
    const templatesWithSource = templates.filter(t =>
      sourceTranslations.some(st => st.pdf_template_id === t.id)
    );

    console.log(`📄 Bulk translating ${templatesWithSource.length} PDF templates from ${fromLang} to ${toLang}`);

    let translated = 0;
    let skipped = 0;
    let failed = 0;
    const errors_list = [];

    for (const template of templatesWithSource) {
      try {
        console.log(`🔄 Processing template: ${template.identifier} (${template.id})`);

        // Get source translation
        const sourceTranslation = sourceTranslations.find(st => st.pdf_template_id === template.id);

        // Check if target translation already exists
        const { data: existingTranslation, error: existingError } = await tenantDb
          .from('pdf_template_translations')
          .select('*')
          .eq('pdf_template_id', template.id)
          .eq('language_code', toLang)
          .maybeSingle();

        if (existingError) throw existingError;

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
        const { data: savedTranslation, error: saveError } = await tenantDb
          .from('pdf_template_translations')
          .insert({
            pdf_template_id: template.id,
            language_code: toLang,
            html_template: translatedHtmlTemplate
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
      const costPerItem = await translationService.getTranslationCost('pdf-template');
      actualCost = totalItems * costPerItem;

      console.log(`💰 PDF template bulk translate - charging for ${totalItems} items × ${costPerItem} credits = ${actualCost} credits`);

      try {
        await creditService.deduct(
          req.user.id,
          store_id,
          actualCost,
          `Bulk PDF Template Translation (${fromLang} → ${toLang})`,
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
        console.log(`✅ Deducted ${actualCost} credits for ${totalItems} PDF templates`);
      } catch (deductError) {
        console.error('❌ CREDIT DEDUCTION FAILED (pdf-templates/bulk-translate):', deductError);
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

module.exports = router;
