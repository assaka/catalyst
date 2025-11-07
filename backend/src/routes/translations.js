const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');
const { Translation, Language, Product, Category, CmsPage, CmsBlock, ProductTab, ProductLabel, CookieConsentSettings, Attribute, AttributeValue, Store, EmailTemplate, PdfTemplate } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const translationService = require('../services/translation-service');
const creditService = require('../services/credit-service');
const ServiceCreditCost = require('../models/ServiceCreditCost');

const router = express.Router();

// ============================================
// UI LABELS ROUTES
// ============================================

// @route   GET /api/translations/ui-labels
// @desc    Get all UI labels for a specific language and store
// @access  Public
router.get('/ui-labels', async (req, res) => {
  try {
    const { store_id, lang = 'en' } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const result = await translationService.getUILabels(store_id, lang);

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
// @desc    Get all UI labels for all languages for a specific store (for admin)
// @access  Private
router.get('/ui-labels/all', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const labels = await translationService.getAllUILabels(store_id);

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
// @desc    Save or update a UI label translation for a specific store
// @access  Private
router.post('/ui-labels', authMiddleware, async (req, res) => {
  try {
    const { store_id, key, language_code, value, category, type = 'custom' } = req.body;

    if (!store_id || !key || !language_code || !value) {
      return res.status(400).json({
        success: false,
        message: 'store_id, key, language_code, and value are required'
      });
    }

    const translation = await translationService.saveUILabel(
      store_id,
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
// @desc    Save multiple UI labels at once for a specific store
// @access  Private
router.post('/ui-labels/bulk', authMiddleware, async (req, res) => {
  try {
    const { store_id, labels } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!Array.isArray(labels)) {
      return res.status(400).json({
        success: false,
        message: 'Labels must be an array'
      });
    }

    const saved = await translationService.saveBulkUILabels(store_id, labels);

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
// @desc    Delete a UI label translation for a specific store
// @access  Private
router.delete('/ui-labels/:key/:languageCode', authMiddleware, async (req, res) => {
  try {
    const { key, languageCode } = req.params;
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    await translationService.deleteUILabel(store_id, key, languageCode);

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
    const { text, fromLang = 'en', toLang, storeId, entityType } = req.body;
    const userId = req.user.id;

    if (!text || !toLang) {
      return res.status(400).json({
        success: false,
        message: 'Text and toLang are required'
      });
    }

    // Get translation cost based on entity type (defaults to 'standard' if not provided)
    const costType = entityType || 'standard';
    const translationCost = await translationService.getTranslationCost(costType);

    // Check if user has enough credits
    const hasCredits = await creditService.hasEnoughCredits(userId, storeId, translationCost);
    if (!hasCredits) {
      const balance = await creditService.getBalance(userId);
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Required: ${translationCost}, Available: ${balance}`,
        required: translationCost,
        available: balance
      });
    }

    // Perform translation
    const translatedText = await translationService.aiTranslate(text, fromLang, toLang);

    // Deduct credits after successful translation
    await creditService.deduct(
      userId,
      storeId,
      translationCost,
      `AI Translation${entityType ? ` (${entityType})` : ''}: ${fromLang} → ${toLang}`,
      {
        entityType: entityType || 'standard',
        fromLang,
        toLang,
        textLength: text.length,
        translatedLength: translatedText.length
      },
      null,
      'ai_translation'
    );

    res.json({
      success: true,
      data: {
        original: text,
        translated: translatedText,
        fromLang,
        toLang
      },
      creditsDeducted: translationCost
    });
  } catch (error) {
    console.error('AI translate error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI translation failed'
    });
  }
});

// @route   POST /api/translations/ai-translate-entity
// @desc    Translate all fields of an entity using AI
// @access  Private
router.post('/ai-translate-entity', authMiddleware, async (req, res) => {
  try {
    const { entityType, entityId, fromLang = 'en', toLang, storeId } = req.body;
    const userId = req.user.id;

    if (!entityType || !entityId || !toLang) {
      return res.status(400).json({
        success: false,
        message: 'entityType, entityId, and toLang are required'
      });
    }

    // Get the entity to count translatable fields
    const Model = translationService._getEntityModel(entityType);
    const entityData = await Model.findByPk(entityId);

    if (!entityData || !entityData.translations || !entityData.translations[fromLang]) {
      return res.status(404).json({
        success: false,
        message: 'Source translation not found'
      });
    }

    // Count translatable fields
    const sourceTranslation = entityData.translations[fromLang];
    const translatableFields = Object.values(sourceTranslation).filter(
      value => typeof value === 'string' && value.trim()
    );
    const fieldCount = translatableFields.length;

    // Get cost based on entity type (0.1 for standard, 0.2 for cms_block, 0.5 for cms_page)
    const totalCost = await translationService.getTranslationCost(entityType);

    // Check if user has enough credits
    const hasCredits = await creditService.hasEnoughCredits(userId, storeId, totalCost);
    if (!hasCredits) {
      const balance = await creditService.getBalance(userId);
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Required: ${totalCost}, Available: ${balance}`,
        required: totalCost,
        available: balance,
        fieldCount
      });
    }

    // Perform translation
    const entity = await translationService.aiTranslateEntity(
      entityType,
      entityId,
      fromLang,
      toLang
    );

    // Deduct credits after successful translation
    await creditService.deduct(
      userId,
      storeId,
      totalCost,
      `AI Entity Translation: ${entityType} ${fromLang} → ${toLang}`,
      {
        entityType,
        entityId,
        fromLang,
        toLang,
        fieldCount
      },
      entityId,
      'ai_translation'
    );

    res.json({
      success: true,
      data: entity,
      message: `${entityType} translated successfully`,
      creditsDeducted: totalCost,
      fieldsTranslated: fieldCount
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
// @desc    Automatically translate a UI label to all active languages for a specific store
// @access  Private
router.post('/auto-translate-ui-label', authMiddleware, async (req, res) => {
  try {
    const { store_id, key, value, category = 'common', fromLang = 'en' } = req.body;

    if (!store_id || !key || !value) {
      return res.status(400).json({
        success: false,
        message: 'store_id, key, and value are required'
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
    await translationService.saveUILabel(store_id, key, fromLang, value, category);
    results.push({ language_code: fromLang, value, status: 'saved' });

    // Translate to all other active languages
    for (const lang of languages) {
      if (lang.code === fromLang) continue;

      try {
        // Translate using AI
        const translatedValue = await translationService.aiTranslate(value, fromLang, lang.code);

        // Save the translation
        await translationService.saveUILabel(store_id, key, lang.code, translatedValue, category);

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

// @route   POST /api/translations/ui-labels/translate-batch
// @desc    AI translate a batch of specific UI label keys for a specific store (for progress tracking)
// @access  Private
router.post('/ui-labels/translate-batch', authMiddleware, async (req, res) => {
  try {
    const { store_id, keys, fromLang, toLang } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'keys array is required'
      });
    }

    if (!fromLang || !toLang) {
      return res.status(400).json({
        success: false,
        message: 'fromLang and toLang are required'
      });
    }

    const sourceLabels = await translationService.getUILabels(store_id, fromLang);
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
    const flatSourceLabels = flattenLabels(sourceLabels.labels || {});

    const results = {
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    // Translate each key in the batch (in parallel for speed)
    await Promise.all(keys.map(async (key) => {
      try {
        const sourceValue = flatSourceLabels[key];
        if (!sourceValue || typeof sourceValue !== 'string') {
          results.skipped++;
          return;
        }

        const translatedValue = await translationService.aiTranslate(sourceValue, fromLang, toLang);
        const category = key.split('.')[0] || 'common';
        await translationService.saveUILabel(store_id, key, toLang, translatedValue, category, 'system');
        results.translated++;
      } catch (error) {
        results.failed++;
        results.errors.push({ key, error: error.message });
      }
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Translate batch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// Background translation function
async function performUILabelsBulkTranslation(userId, userEmail, storeId, fromLang, toLang) {
  try {
    // Get all labels in the source language
    const sourceLabels = await translationService.getUILabels(storeId, fromLang);

    if (!sourceLabels || !sourceLabels.labels) {
      console.log('⚠️ No labels found to translate');
      return;
    }

    // Get existing labels in target language to avoid re-translating
    const targetLabels = await translationService.getUILabels(storeId, toLang);
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

    const results = {
      total: Object.keys(flatSourceLabels).length,
      translated: 0,
      skipped: Object.keys(flatSourceLabels).length - keysToTranslate.length,
      failed: 0,
      errors: []
    };

    console.log(`🌐 Starting UI labels bulk translation: ${fromLang} → ${toLang}`);
    console.log(`📊 Total labels: ${results.total}, To translate: ${keysToTranslate.length}, Already translated: ${results.skipped}`);

    if (keysToTranslate.length === 0) {
      console.log('⚠️ No missing translations found');
      return;
    }

    // Process translations in parallel batches with rate limit protection
    const BATCH_SIZE = 10; // Process 10 labels at a time to avoid Anthropic rate limits
    const BATCH_DELAY_MS = 3000; // 3 second delay between batches to respect rate limits
    const batches = [];
    for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
      batches.push(keysToTranslate.slice(i, i + BATCH_SIZE));
    }

    console.log(`🚀 Processing ${keysToTranslate.length} labels in ${batches.length} batches of ${BATCH_SIZE} (with ${BATCH_DELAY_MS}ms delays)`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} labels)`);

      // Translate batch in parallel
      const batchPromises = batch.map(async (key) => {
        try {
          const sourceValue = flatSourceLabels[key];
          if (!sourceValue || typeof sourceValue !== 'string') {
            results.skipped++;
            return { key, status: 'skipped' };
          }

          // Translate using AI with retry on rate limit
          let translatedValue;
          let retries = 0;
          const MAX_RETRIES = 2;

          while (retries <= MAX_RETRIES) {
            try {
              translatedValue = await translationService.aiTranslate(sourceValue, fromLang, toLang);
              break; // Success, exit retry loop
            } catch (aiError) {
              if (aiError.message?.includes('rate_limit') && retries < MAX_RETRIES) {
                retries++;
                const waitTime = retries * 5000; // 5s, 10s
                console.log(`⏳ Rate limit hit for ${key}, waiting ${waitTime}ms before retry ${retries}/${MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              } else {
                throw aiError; // Re-throw if not rate limit or out of retries
              }
            }
          }

          // Determine category from key
          const category = key.split('.')[0] || 'common';

          // Save the translation
          await translationService.saveUILabel(storeId, key, toLang, translatedValue, category, 'system');

          results.translated++;
          return { key, status: 'success' };
        } catch (error) {
          console.error(`❌ Error translating UI label ${key}:`, error.message);
          results.failed++;
          results.errors.push({
            key,
            error: error.message
          });
          return { key, status: 'failed', error: error.message };
        }
      });

      await Promise.all(batchPromises);
      console.log(`✅ Batch ${batchIndex + 1} complete - Progress: ${results.translated}/${keysToTranslate.length} translated`);

      // Add delay between batches to respect Anthropic rate limits (except after last batch)
      if (batchIndex < batches.length - 1) {
        console.log(`⏸️  Waiting ${BATCH_DELAY_MS}ms before next batch to respect rate limits...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(`✅ UI labels translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    // Deduct credits for ALL labels (including skipped)
    const totalItems = Object.keys(flatSourceLabels).length;
    let actualCost = 0;

    if (totalItems > 0) {
      const costPerItem = await translationService.getTranslationCost('standard');
      actualCost = totalItems * costPerItem;

      console.log(`💰 UI Labels bulk translate - charging for ${totalItems} items × ${costPerItem} credits = ${actualCost} credits`);

      try {
        await creditService.deduct(
          userId,
          storeId, // UI labels are now store-specific
          actualCost,
          `Bulk UI Labels Translation (${fromLang} → ${toLang})`,
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
        console.log(`✅ Deducted ${actualCost} credits for ${totalItems} UI labels`);
      } catch (deductError) {
        console.error(`❌ CREDIT DEDUCTION FAILED (ui-labels-bulk-translate):`, deductError);
        actualCost = 0;
      }
    }

    // Send email notification
    try {
      const axios = require('axios');
      const User = require('../models/User');

      // Get user details
      const user = await User.findByPk(userId);

      if (user && user.email) {
        console.log(`📧 Sending email notification to ${user.email}`);

        // Try to get Brevo API key from environment or configuration
        const brevoApiKey = process.env.BREVO_API_KEY;

        if (brevoApiKey) {
          // Send actual email via Brevo API
          const emailData = {
            sender: {
              name: 'Catalyst Platform',
              email: process.env.BREVO_SENDER_EMAIL || 'noreply@catalyst.com'
            },
            to: [
              {
                email: user.email,
                name: user.name || user.email
              }
            ],
            subject: 'UI Labels Translation Complete',
            htmlContent: `
              <h2>UI Labels Translation Complete</h2>
              <p>Your bulk translation of UI labels from <strong>${fromLang}</strong> to <strong>${toLang}</strong> has been completed.</p>
              <h3>Results:</h3>
              <ul>
                <li>✅ Translated: ${results.translated}</li>
                <li>⏭️ Skipped: ${results.skipped}</li>
                <li>❌ Failed: ${results.failed}</li>
              </ul>
              <p>You can now view the translated labels in your admin panel.</p>
            `
          };

          await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
            headers: {
              'api-key': brevoApiKey,
              'Content-Type': 'application/json'
            }
          });

          console.log(`✅ Email sent successfully to ${user.email}`);
        } else {
          // Fallback: just log (no Brevo configured)
          console.log(`⚠️ Brevo not configured - email would be sent to: ${user.email}`);
          console.log(`📧 Subject: UI Labels Translation Complete`);
          console.log(`📧 Results: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);
        }
      }
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError.message);
      // Don't fail the entire process if email fails
    }

  } catch (error) {
    console.error('❌ Background UI labels bulk translation error:', error);
  }
}

// @route   POST /api/translations/ui-labels/bulk-translate
// @desc    AI translate all UI labels from one language to another (runs in background)
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

    // Check if user has enough credits before starting
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
    const totalItems = Object.keys(flatSourceLabels).length;
    const costPerItem = await translationService.getTranslationCost('standard');
    const estimatedCost = totalItems * costPerItem;

    // Check if user has enough credits
    const hasCredits = await creditService.hasEnoughCredits(req.user.id, null, estimatedCost);
    if (!hasCredits) {
      const balance = await creditService.getBalance(req.user.id);
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Required: ${estimatedCost.toFixed(2)}, Available: ${balance.toFixed(2)}`,
        required: estimatedCost,
        available: balance
      });
    }

    // Start background translation process
    console.log(`🚀 Starting background UI labels translation: ${fromLang} → ${toLang}`);
    setImmediate(() => {
      performUILabelsBulkTranslation(req.user.id, req.user.email, fromLang, toLang);
    });

    // Return immediately
    res.json({
      success: true,
      message: 'Translation started in background. You will receive an email notification when complete (approximately 10 minutes).',
      data: {
        estimatedItems: totalItems,
        estimatedCost: estimatedCost,
        estimatedMinutes: Math.ceil(totalItems / 10 * 3 / 60) // Rough estimate based on batch size and delays
      }
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

    console.log('📊 Entity stats request - store_id:', store_id, 'type:', typeof store_id);

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

    console.log('📊 Active languages found:', languages.length, languages.map(l => l.code));

    // If no active languages found, use 'en' as default
    const languageCodes = languages.length > 0
      ? languages.map(l => l.code)
      : ['en'];

    // If no active languages, add default EN to languages array for response
    if (languages.length === 0) {
      languages.push({
        code: 'en',
        name: 'English',
        native_name: 'English'
      });
      console.log('⚠️ No active languages found, using EN as default');
    }

    // Define entity types to check
    const entityTypes = [
      { type: 'category', model: Category, icon: '📁', name: 'Categories' },
      { type: 'product', model: Product, icon: '📦', name: 'Products' },
      { type: 'attribute', model: Attribute, icon: '🏷', name: 'Attributes' },
      { type: 'cms_page', model: CmsPage, icon: '📄', name: 'CMS Pages' },
      { type: 'cms_block', model: CmsBlock, icon: '📝', name: 'CMS Blocks' },
      { type: 'product_tab', model: ProductTab, icon: '📑', name: 'Product Tabs' },
      { type: 'product_label', model: ProductLabel, icon: '🏷️', name: 'Product Labels' },
      { type: 'cookie_consent', model: CookieConsentSettings, icon: '🍪', name: 'Cookie Consent' },
      { type: 'email-template', model: EmailTemplate, icon: '📧', name: 'Email Templates' },
      { type: 'pdf-template', model: PdfTemplate, icon: '📑', name: 'PDF Templates' }
    ];

    const stats = [];

    for (const entityType of entityTypes) {
      try {
        // Get total count of entities for this store
        const totalItems = await entityType.model.count({
          where: { store_id }
        });

        if (totalItems === 0) {
          stats.push({
            type: entityType.type,
            name: entityType.name,
            icon: entityType.icon,
            totalItems: 0,
            translatedItems: 0,
            completionPercentage: 0,
            missingLanguages: []
          });
          continue;
        }

        // Map entity types to their translation table names
        const translationTableMap = {
          category: 'category_translations',
          product: 'product_translations',
          attribute: 'attribute_translations',
          cms_page: 'cms_page_translations',
          cms_block: 'cms_block_translations',
          product_tab: 'product_tab_translations',
          product_label: 'product_label_translations',
          cookie_consent: 'cookie_consent_settings_translations',
          'email-template': 'email_template_translations',
          'pdf-template': 'pdf_template_translations'
        };

        // Map entity types to their ID column names in translation tables
        const entityIdColumnMap = {
          category: 'category_id',
          product: 'product_id',
          attribute: 'attribute_id',
          cms_page: 'cms_page_id',
          cms_block: 'cms_block_id',
          product_tab: 'product_tab_id',
          product_label: 'product_label_id',
          cookie_consent: 'cookie_consent_settings_id',  // Special case: doesn't follow standard pattern
          'email-template': 'email_template_id',
          'pdf-template': 'pdf_template_id'
        };

        const translationTable = translationTableMap[entityType.type];
        const entityIdColumn = entityIdColumnMap[entityType.type];

        if (!translationTable) {
          throw new Error(`No translation table mapping for ${entityType.type}`);
        }

        // Get entities with all language translations using raw SQL for performance
        // Check for actual content, not just row existence
        // Each entity type has different primary translation columns
        const contentCheckMap = {
          product_tab: `AND t.name IS NOT NULL AND t.name != ''`,
          product: `AND t.name IS NOT NULL AND t.name != ''`,
          category: `AND t.name IS NOT NULL AND t.name != ''`,
          attribute: `AND t.label IS NOT NULL AND t.label != ''`,  // Attributes use 'label', not 'name'
          cms_page: `AND t.title IS NOT NULL AND t.title != ''`,   // CMS Pages use 'title', not 'name'
          cms_block: `AND t.title IS NOT NULL AND t.title != ''`,  // CMS Blocks use 'title', not 'name'
          product_label: `AND t.text IS NOT NULL AND t.text != ''`, // Product Labels use 'text'
          cookie_consent: `AND t.banner_text IS NOT NULL AND t.banner_text != ''`, // Cookie consent uses 'banner_text'
          'email-template': `AND t.subject IS NOT NULL AND t.subject != ''`, // Email templates use 'subject'
          'pdf-template': `AND t.html_template IS NOT NULL AND t.html_template != ''` // PDF templates use 'html_template'
        };

        const contentCheck = contentCheckMap[entityType.type] || `AND t.name IS NOT NULL AND t.name != ''`;

        const query = `
          SELECT e.id
          FROM ${entityType.model.tableName} e
          WHERE e.store_id = :storeId
          AND (
            SELECT COUNT(DISTINCT t.language_code)
            FROM ${translationTable} t
            WHERE t.${entityIdColumn} = e.id
            AND t.language_code IN (:languageCodes)
            ${contentCheck}
          ) = :languageCount
        `;

        let translatedCount = 0;
        try {
          const [translatedEntities] = await sequelize.query(query, {
            replacements: {
              storeId: store_id,
              languageCodes: languageCodes,
              languageCount: languageCodes.length
            }
          });

          translatedCount = translatedEntities.length;
        } catch (queryError) {
          console.error(`   ❌ Error querying translated entities for ${entityType.type}:`, queryError.message);
          console.error(`   📋 Query was:`, query);
          // Continue with translatedCount = 0
        }

        // Find which languages are missing across all entities (with actual content)
        const missingLanguages = [];
        for (const langCode of languageCodes) {
          const [result] = await sequelize.query(`
            SELECT COUNT(*) as missing_count
            FROM ${entityType.model.tableName} e
            WHERE e.store_id = :storeId
            AND NOT EXISTS (
              SELECT 1
              FROM ${translationTable} t
              WHERE t.${entityIdColumn} = e.id
              AND t.language_code = :langCode
              ${contentCheck}
            )
          `, {
            replacements: {
              storeId: store_id,
              langCode: langCode
            }
          });

          if (parseInt(result[0].missing_count) > 0) {
            missingLanguages.push(langCode);
          }
        }

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
          missingLanguages: missingLanguages.map(code => {
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
      // Get all attributes for this store
      const attributes = await Attribute.findAll({
        where: { store_id },
        attributes: ['id']
      });

      const attributeIds = attributes.map(attr => attr.id);

      if (attributeIds.length === 0) {
        stats.push({
          type: 'attribute_value',
          name: 'Attribute Values',
          icon: '🔖',
          totalItems: 0,
          translatedItems: 0,
          completionPercentage: 100,
          missingLanguages: []
        });
      } else {
        // Get total count of attribute values
        const [countResult] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM attribute_values
          WHERE attribute_id IN (:attributeIds)
        `, {
          replacements: { attributeIds }
        });

        const totalItems = parseInt(countResult[0].count);

        // Get count of attribute values with all translations
        const [translatedResult] = await sequelize.query(`
          SELECT COUNT(DISTINCT av.id) as count
          FROM attribute_values av
          WHERE av.attribute_id IN (:attributeIds)
          AND (
            SELECT COUNT(DISTINCT t.language_code)
            FROM attribute_value_translations t
            WHERE t.attribute_value_id = av.id
            AND t.language_code IN (:languageCodes)
          ) = :languageCount
        `, {
          replacements: {
            attributeIds,
            languageCodes: languageCodes,
            languageCount: languageCodes.length
          }
        });

        const translatedCount = parseInt(translatedResult[0].count);

        // Find missing languages for attribute values
        const missingLanguages = [];
        for (const langCode of languageCodes) {
          const [result] = await sequelize.query(`
            SELECT COUNT(*) as missing_count
            FROM attribute_values av
            WHERE av.attribute_id IN (:attributeIds)
            AND NOT EXISTS (
              SELECT 1
              FROM attribute_value_translations t
              WHERE t.attribute_value_id = av.id
              AND t.language_code = :langCode
            )
          `, {
            replacements: {
              attributeIds,
              langCode: langCode
            }
          });

          if (parseInt(result[0].missing_count) > 0) {
            missingLanguages.push(langCode);
          }
        }

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
          missingLanguages: missingLanguages.map(code => {
            const lang = languages.find(l => l.code === code);
            return {
              code,
              name: lang?.name || code,
              native_name: lang?.native_name || code
            };
          })
        });
      }
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

    // Handle Custom Options separately (uses JSON translations, not normalized tables)
    try {
      const [customOptions] = await sequelize.query(`
        SELECT id, translations
        FROM custom_option_rules
        WHERE store_id = :storeId
      `, {
        replacements: { storeId: store_id }
      });

      const totalItems = customOptions.length;
      let translatedCount = 0;
      const missingLanguages = new Set();

      // Check translation completeness for JSON-based translations
      customOptions.forEach(option => {
        const translations = option.translations || {};
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
        type: 'custom_option',
        name: 'Custom Options',
        icon: '⚙️',
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
      console.error('Error getting stats for custom_option:', error);
      stats.push({
        type: 'custom_option',
        name: 'Custom Options',
        icon: '⚙️',
        totalItems: 0,
        translatedItems: 0,
        completionPercentage: 0,
        missingLanguages: [],
        error: error.message
      });
    }

    // Handle Stock Labels separately (stored in store.settings.stock_settings.translations)
    try {
      const store = await Store.findByPk(store_id, {
        attributes: ['id', 'settings']
      });

      const stockSettings = store?.settings?.stock_settings || {};
      const translations = stockSettings.translations || {};

      // Stock labels is always 1 item (the settings themselves)
      const totalItems = 1;
      let translatedCount = 0;
      const missingLanguages = [];

      // Check if translations exist for all active languages with actual content
      let hasAllTranslations = true;
      for (const langCode of languageCodes) {
        const langTranslation = translations[langCode];

        // Check if translation exists and has at least one non-empty field
        const hasContent = langTranslation &&
          Object.values(langTranslation).some(val =>
            typeof val === 'string' && val.trim().length > 0
          );

        if (!hasContent) {
          missingLanguages.push(langCode);
          hasAllTranslations = false;
        }
      }

      if (hasAllTranslations) {
        translatedCount = 1;
      }

      const completionPercentage = translatedCount === 1 ? 100 : 0;

      stats.push({
        type: 'stock_labels',
        name: 'Stock Labels',
        icon: '📊',
        totalItems,
        translatedItems: translatedCount,
        completionPercentage,
        missingLanguages: missingLanguages.map(code => {
          const lang = languages.find(l => l.code === code);
          return {
            code,
            name: lang?.name || code,
            native_name: lang?.native_name || code
          };
        })
      });
    } catch (error) {
      console.error('Error getting stats for stock_labels:', error);
      stats.push({
        type: 'stock_labels',
        name: 'Stock Labels',
        icon: '📊',
        totalItems: 1,
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
    const userId = req.user.id;

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

    const entityTypeMap = {
      category: { model: Category, name: 'Categories' },
      product: { model: Product, name: 'Products' },
      attribute: { model: Attribute, name: 'Attributes' },
      cms_page: { model: CmsPage, name: 'CMS Pages' },
      cms_block: { model: CmsBlock, name: 'CMS Blocks' },
      product_tab: { model: ProductTab, name: 'Product Tabs' },
      product_label: { model: ProductLabel, name: 'Product Labels' },
      cookie_consent: { model: CookieConsentSettings, name: 'Cookie Consent' },
      attribute_value: { model: AttributeValue, name: 'Attribute Values', special: true },
      'email-template': { model: EmailTemplate, name: 'Email Templates' },
      'pdf-template': { model: PdfTemplate, name: 'PDF Templates' },
      custom_option: { name: 'Custom Options', special: true, useJsonTranslations: true },
      stock_labels: { name: 'Stock Labels', special: true, storeSettings: true }
    };

    // Pre-calculate estimated cost and check credits BEFORE translating
    let estimatedCost = 0;
    const entityCounts = {};

    console.log(`💰 Calculating cost for bulk translation: ${entity_types.join(', ')}`);

    for (const entityType of entity_types) {
      const entityConfig = entityTypeMap[entityType];
      if (!entityConfig || entityConfig.special) {
        console.log(`⏭️ Skipping ${entityType} (special or not found)`);
        continue;
      }

      try {
        const count = await entityConfig.model.count({ where: { store_id } });
        entityCounts[entityType] = count;
        const costPerItem = await translationService.getTranslationCost(entityType);
        const typeCost = count * costPerItem;
        estimatedCost += typeCost;
        console.log(`📊 ${entityType}: ${count} items × ${costPerItem} credits = ${typeCost.toFixed(2)} credits`);
      } catch (error) {
        console.error(`❌ Error counting ${entityType}:`, error);
      }
    }

    console.log(`💰 Total estimated cost: ${estimatedCost.toFixed(2)} credits`);

    // Check if user has enough credits
    const balance = await creditService.getBalance(userId);
    console.log(`👤 User balance: ${balance} credits`);

    const hasCredits = await creditService.hasEnoughCredits(userId, store_id, estimatedCost);
    if (!hasCredits) {
      console.log(`❌ Insufficient credits: need ${estimatedCost.toFixed(2)}, have ${balance}`);
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Required: ${estimatedCost.toFixed(2)}, Available: ${balance.toFixed(2)}`,
        required: estimatedCost,
        available: balance
      });
    }

    console.log(`✅ Sufficient credits available, proceeding with translation`);

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
        } else if (entityConfig.special && entityType === 'custom_option') {
          // Handle Custom Options with raw query (no model defined)
          const [customOptions] = await sequelize.query(`
            SELECT id, translations
            FROM custom_option_rules
            WHERE store_id = :storeId
          `, {
            replacements: { storeId: store_id }
          });
          entities = customOptions;
        } else if (entityConfig.special && entityType === 'stock_labels') {
          // Handle Stock Labels (stored in store.settings.stock_settings)
          const store = await Store.findByPk(store_id, {
            attributes: ['id', 'settings']
          });
          const stockSettings = store?.settings?.stock_settings || {};
          // Create a pseudo-entity with translations
          entities = [{
            id: 'stock_labels',
            translations: stockSettings.translations || {}
          }];
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

    // Deduct credits based on entity counts (ALL items selected, regardless of skip/translate)
    // Use the pre-calculated estimatedCost instead of counting results
    let actualCost = estimatedCost;

    console.log(`💳 Preparing to deduct credits: ${actualCost.toFixed(2)} credits`);

    if (actualCost > 0) {
      try {
        console.log(`📤 Calling creditService.deduct with:`, {
          userId,
          storeId: store_id,
          amount: actualCost,
          entityTypes: entity_types
        });

        const deductionResult = await creditService.deduct(
          userId,
          store_id,
          actualCost,
          `Bulk Multi-Entity Translation: ${entity_types.join(', ')} (${fromLang} → ${toLang})`,
          {
            entity_types,
            fromLang,
            toLang,
            itemsSelected: Object.values(entityCounts).reduce((sum, count) => sum + count, 0),
            translationsCompleted: allResults.translated,
            failed: allResults.failed,
            skipped: allResults.skipped,
            byEntity: allResults.byEntity,
            note: 'Charged for all items in selection (including skipped)'
          },
          null,
          'ai_translation'
        );
        console.log(`✅ Successfully deducted ${actualCost} credits for all selected items`);
        console.log(`📊 Breakdown: ${allResults.translated} translated, ${allResults.skipped} skipped, ${allResults.failed} failed`);
        console.log(`💰 Deduction result:`, deductionResult);
      } catch (deductError) {
        console.error('❌ CREDIT DEDUCTION FAILED:', deductError);
        console.error('❌ Error details:', {
          message: deductError.message,
          stack: deductError.stack,
          userId,
          storeId: store_id,
          amount: actualCost
        });
        // Don't fail the entire operation if credit deduction fails
        // The translations were already done
        // But set actualCost to 0 so frontend doesn't show false info
        actualCost = 0;
      }
    } else {
      console.log(`⏭️ No credits to deduct (actualCost = 0)`);
    }

    res.json({
      success: true,
      message: `Multi-entity bulk translation completed. Total: ${allResults.total}, Translated: ${allResults.translated}, Skipped: ${allResults.skipped}, Failed: ${allResults.failed}`,
      data: allResults,
      creditsDeducted: actualCost
    });
  } catch (error) {
    console.error('Bulk translate entities error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// ============================================
// TRANSLATION WIZARD ROUTES
// ============================================

// @route   POST /api/translations/preview
// @desc    Get preview of what will be translated (for wizard)
// @access  Private
router.post('/preview', authMiddleware, async (req, res) => {
  try {
    const { store_id, what, fromLang, toLanguages, specificItems, singleField } = req.body;

    if (!what || !fromLang || !toLanguages || toLanguages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'what, fromLang, and toLanguages are required'
      });
    }

    const entityTypeMap = {
      product: { model: Product, name: 'Products', icon: '📦' },
      category: { model: Category, name: 'Categories', icon: '📁' },
      attribute: { model: Attribute, name: 'Attributes', icon: '🏷' },
      cms_page: { model: CmsPage, name: 'CMS Pages', icon: '📄' },
      cms_block: { model: CmsBlock, name: 'CMS Blocks', icon: '📝' },
      product_tab: { model: ProductTab, name: 'Product Tabs', icon: '📑' },
      product_label: { model: ProductLabel, name: 'Product Labels', icon: '🏷️' },
      cookie_consent: { model: CookieConsentSettings, name: 'Cookie Consent', icon: '🍪' },
      'email-template': { model: EmailTemplate, name: 'Email Templates', icon: '📧' },
      'pdf-template': { model: PdfTemplate, name: 'PDF Templates', icon: '📑' },
      'custom-option': { name: 'Custom Options', icon: '⚙️', special: true },
      'stock-label': { name: 'Stock Labels', icon: '🏷️', special: true }
    };

    const stats = {
      totalItems: 0,
      toTranslate: 0,
      alreadyTranslated: 0,
      byEntityType: {},
      estimatedMinutes: 0
    };

    // Handle UI labels
    if (what === 'all' || what === 'ui-labels') {
      const sourceLabels = await translationService.getUILabels(fromLang);
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

      const flatSourceLabels = flattenLabels(sourceLabels.labels || {});
      let uiToTranslate = 0;
      let uiAlreadyTranslated = 0;

      for (const toLang of toLanguages) {
        const targetLabels = await translationService.getUILabels(toLang);
        const existingKeys = new Set(Object.keys(targetLabels.labels || {}));

        const missing = Object.keys(flatSourceLabels).filter(key => !existingKeys.has(key));
        uiToTranslate += missing.length;
        uiAlreadyTranslated += existingKeys.size;
      }

      stats.byEntityType['ui-labels'] = {
        name: 'UI Labels',
        icon: '🔤',
        totalItems: Object.keys(flatSourceLabels).length,
        toTranslate: uiToTranslate,
        alreadyTranslated: uiAlreadyTranslated
      };

      stats.totalItems += Object.keys(flatSourceLabels).length * toLanguages.length;
      stats.toTranslate += uiToTranslate;
      stats.alreadyTranslated += uiAlreadyTranslated;
    }

    // Handle entities
    const entityTypes = what === 'all'
      ? Object.keys(entityTypeMap)
      : [what].filter(t => t !== 'ui-labels' && t !== 'single-field' && t !== 'cms');

    // Special case for 'cms' - includes both pages and blocks
    if (what === 'cms') {
      entityTypes.push('cms_page', 'cms_block');
    }

    for (const entityType of entityTypes) {
      if (!entityTypeMap[entityType]) continue;

      try {
        const config = entityTypeMap[entityType];
        const whereClause = store_id ? { store_id } : {};

        let entityCount;

        // Handle special entity types
        if (entityType === 'attribute_value') {
          if (!store_id) continue;
          const attributes = await Attribute.findAll({
            where: { store_id },
            attributes: ['id']
          });
          const attributeIds = attributes.map(attr => attr.id);
          entityCount = await AttributeValue.count({
            where: { attribute_id: { [Op.in]: attributeIds } }
          });
        } else if (entityType === 'custom-option') {
          if (!store_id) continue;
          const [customOptions] = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM custom_option_rules
            WHERE store_id = :storeId
          `, {
            replacements: { storeId: store_id }
          });
          entityCount = parseInt(customOptions[0].count);
        } else if (entityType === 'stock-label') {
          // Stock labels is always 1 item (the settings themselves)
          entityCount = 1;
        } else if (config.special) {
          // Skip other special types that don't have a model
          continue;
        } else {
          entityCount = await config.model.count({
            where: whereClause
          });
        }

        // Simplified estimation: assume all items need translation to all languages
        // Actual translation endpoint will skip already-translated items
        const typeToTranslate = entityCount * toLanguages.length;
        const typeAlreadyTranslated = 0; // We'll skip already translated during actual execution

        stats.byEntityType[entityType] = {
          name: config.name,
          icon: config.icon,
          totalItems: entityCount,
          toTranslate: typeToTranslate,
          alreadyTranslated: typeAlreadyTranslated
        };

        stats.totalItems += entityCount * toLanguages.length;
        stats.toTranslate += typeToTranslate;
        stats.alreadyTranslated += typeAlreadyTranslated;
      } catch (entityError) {
        console.error(`Error processing ${entityType} for preview:`, entityError.message);
        // Skip this entity type if there's an error
        continue;
      }
    }

    // Estimate time (rough: 1 item = 2 seconds)
    stats.estimatedMinutes = Math.ceil((stats.toTranslate * 2) / 60);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/translations/wizard-execute
// @desc    Execute translation from wizard
// @access  Private
router.post('/wizard-execute', authMiddleware, async (req, res) => {
  try {
    const { store_id, what, fromLang, toLanguages, specificItems, singleField } = req.body;
    const userId = req.user.id;
    const storeId = store_id;

    if (!what || !fromLang || !toLanguages || toLanguages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'what, fromLang, and toLanguages are required'
      });
    }

    // Note: Token-based cost will be calculated at the end based on actual text translated
    // We'll just check if user has some credits available
    const balance = await creditService.getBalance(userId);
    if (balance < 1) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. You need at least 1 credit to start translation. Available: ${balance}`,
        required: 1,
        available: balance
      });
    }

    const results = {
      total: 0,
      translated: 0,
      skipped: 0,
      failed: 0,
      byEntity: {},
      errors: []
    };

    // Helper function for single field translation
    const translateEntityField = async (entity, entityType, field, fromLang, toLang) => {
      if (!entity.translations || !entity.translations[fromLang] || !entity.translations[fromLang][field]) {
        return false; // Skip
      }

      if (entity.translations[toLang] && entity.translations[toLang][field]) {
        return false; // Already translated
      }

      const sourceValue = entity.translations[fromLang][field];
      const context = {
        type: field === 'name' || field === 'title' ? 'heading' : 'description',
        location: entityType
      };

      const translatedValue = await translationService.aiTranslate(sourceValue, fromLang, toLang, context);

      const translations = entity.translations || {};
      if (!translations[toLang]) {
        translations[toLang] = {};
      }
      translations[toLang][field] = translatedValue;

      entity.translations = translations;
      entity.changed('translations', true);
      await entity.save();

      // Track text length for cost calculation
      results.totalTextLength += sourceValue.length;

      return true; // Translated
    };

    // Translate UI labels
    if (what === 'all' || what === 'ui-labels') {
      for (const toLang of toLanguages) {
        try {
          // Use existing bulk translate endpoint logic
          const sourceLabels = await translationService.getUILabels(fromLang);
          const targetLabels = await translationService.getUILabels(toLang);

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

          const flatSourceLabels = flattenLabels(sourceLabels.labels || {});
          const existingKeys = new Set(Object.keys(targetLabels.labels || {}));
          const keysToTranslate = Object.keys(flatSourceLabels).filter(key => !existingKeys.has(key));

          let langTranslated = 0;
          let langFailed = 0;

          for (const key of keysToTranslate) {
            try {
              const sourceValue = flatSourceLabels[key];
              if (!sourceValue || typeof sourceValue !== 'string') continue;

              const translatedValue = await translationService.aiTranslate(sourceValue, fromLang, toLang);
              const category = key.split('.')[0] || 'common';
              await translationService.saveUILabel(key, toLang, translatedValue, category, 'system');

              // Track text length for cost calculation
              if (sourceValue && typeof sourceValue === 'string') {
                results.totalTextLength += sourceValue.length;
              }

              langTranslated++;
            } catch (error) {
              langFailed++;
              results.errors.push({ key, error: error.message });
            }
          }

          if (!results.byEntity['ui-labels']) {
            results.byEntity['ui-labels'] = {
              name: 'UI Labels',
              total: 0,
              translated: 0,
              failed: 0
            };
          }

          results.byEntity['ui-labels'].total += keysToTranslate.length;
          results.byEntity['ui-labels'].translated += langTranslated;
          results.byEntity['ui-labels'].failed += langFailed;
          results.translated += langTranslated;
          results.failed += langFailed;
          results.total += keysToTranslate.length;

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error translating UI labels to ${toLang}:`, error);
          results.errors.push({ entity: 'ui-labels', language: toLang, error: error.message });
        }
      }
    }

    // Translate entities
    const entityTypeMap = {
      product: { model: Product, name: 'Products' },
      category: { model: Category, name: 'Categories' },
      cms_page: { model: CmsPage, name: 'CMS Pages' },
      cms_block: { model: CmsBlock, name: 'CMS Blocks' },
      product_tab: { model: ProductTab, name: 'Product Tabs' },
      product_label: { model: ProductLabel, name: 'Product Labels' },
      attribute: { model: Attribute, name: 'Attributes' },
      'email-template': { model: EmailTemplate, name: 'Email Templates' },
      'pdf-template': { model: PdfTemplate, name: 'PDF Templates' },
      'custom-option': { name: 'Custom Options', special: true },
      'stock-label': { name: 'Stock Labels', special: true }
    };

    const entityTypes = what === 'all'
      ? Object.keys(entityTypeMap)
      : [what].filter(t => entityTypeMap[t]);

    if (what === 'cms') {
      entityTypes.push('cms_page', 'cms_block');
    }

    for (const entityType of entityTypes) {
      if (!entityTypeMap[entityType]) continue;

      const config = entityTypeMap[entityType];
      const whereClause = store_id ? { store_id } : {};

      try {
        let entities;

        // Handle special entity types
        if (entityType === 'custom-option') {
          if (!store_id) continue;
          const [customOptions] = await sequelize.query(`
            SELECT id, translations
            FROM custom_option_rules
            WHERE store_id = :storeId
          `, {
            replacements: { storeId: store_id }
          });
          entities = customOptions;
        } else if (entityType === 'stock-label') {
          if (!store_id) continue;
          const store = await Store.findByPk(store_id, {
            attributes: ['id', 'settings']
          });
          const stockSettings = store?.settings?.stock_settings || {};
          // Create a pseudo-entity with translations
          entities = [{
            id: 'stock_labels',
            translations: stockSettings.translations || {}
          }];
        } else if (config.special) {
          // Skip other special types without models
          continue;
        } else {
          entities = await config.model.findAll({ where: whereClause });
        }

        let typeTranslated = 0;
        let typeSkipped = 0;
        let typeFailed = 0;

        for (const entity of entities) {
          for (const toLang of toLanguages) {
            try {
              if (singleField) {
                // Translate single field
                const translated = await translateEntityField(entity, entityType, singleField, fromLang, toLang);
                if (translated) {
                  typeTranslated++;
                } else {
                  typeSkipped++;
                }
              } else {
                // Translate entire entity
                if (!entity.translations || !entity.translations[fromLang]) {
                  typeSkipped++;
                  continue;
                }

                if (entity.translations[toLang]) {
                  typeSkipped++;
                  continue;
                }

                // Calculate text length before translation
                if (entity.translations[fromLang]) {
                  const fieldValues = Object.values(entity.translations[fromLang]);
                  const textToTranslate = fieldValues
                    .filter(v => typeof v === 'string' && v.trim())
                    .join(' ');
                  results.totalTextLength += textToTranslate.length;
                }

                await translationService.aiTranslateEntity(entityType, entity.id, fromLang, toLang);
                typeTranslated++;
              }

              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              typeFailed++;
              results.errors.push({
                entity: entityType,
                id: entity.id,
                language: toLang,
                error: error.message
              });
            }
          }
        }

        results.byEntity[entityType] = {
          name: config.name,
          total: entities.length * toLanguages.length,
          translated: typeTranslated,
          skipped: typeSkipped,
          failed: typeFailed
        };

        results.total += entities.length * toLanguages.length;
        results.translated += typeTranslated;
        results.skipped += typeSkipped;
        results.failed += typeFailed;
      } catch (error) {
        console.error(`Error translating ${entityType}:`, error);
        results.errors.push({ entity: entityType, error: error.message });
      }
    }

    // Deduct credits for ALL items processed (including skipped ones)
    let actualCost = 0;

    console.log(`💰 Calculating wizard translation cost for ${results.total} total items`);

    if (results.total > 0) {
      // Calculate cost based on ALL items processed (translated + skipped)
      for (const [entityType, entityData] of Object.entries(results.byEntity)) {
        if (entityData.total > 0) {
          const costPerItem = await translationService.getTranslationCost(entityType);
          const typeCost = entityData.total * costPerItem;
          actualCost += typeCost;
          console.log(`📊 ${entityType}: ${entityData.total} items × ${costPerItem} credits = ${typeCost.toFixed(2)} credits`);
        }
      }

      console.log(`💰 Total cost to deduct: ${actualCost.toFixed(2)} credits`);
      console.log(`👤 User: ${userId}, Store: ${storeId}`);

      try {
        const deductionResult = await creditService.deduct(
          userId,
          storeId,
          actualCost,
          `Bulk Translation Wizard: ${what} (${fromLang} → ${toLanguages.join(', ')})`,
          {
            what,
            fromLang,
            toLanguages,
            itemsProcessed: results.total,
            translationsCompleted: results.translated,
            failed: results.failed,
            skipped: results.skipped,
            byEntity: results.byEntity,
            note: 'Charged for all items including skipped'
          },
          null,
          'ai_translation'
        );
        console.log(`✅ Successfully deducted ${actualCost} credits for ${results.total} items (${results.translated} translated, ${results.skipped} skipped)`);
        console.log(`💰 Deduction result:`, deductionResult);
      } catch (deductError) {
        console.error('❌ CREDIT DEDUCTION FAILED (wizard-execute):', deductError);
        console.error('❌ Error details:', {
          message: deductError.message,
          stack: deductError.stack,
          userId,
          storeId,
          amount: actualCost
        });
        // Don't fail the entire operation if credit deduction fails
        // The translations were already done
        // But set actualCost to 0 so frontend doesn't show false info
        actualCost = 0;
      }
    } else {
      console.log(`⏭️ No items to charge for (results.total = 0)`);
    }

    res.json({
      success: true,
      message: `Translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results,
      creditsDeducted: actualCost
    });
  } catch (error) {
    console.error('Wizard execute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;
