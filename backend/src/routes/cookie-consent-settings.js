const express = require('express');
const { body, validationResult } = require('express-validator');
const { CookieConsentSettings, Store } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/auth');
const translationService = require('../services/translation-service');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const {
  getCookieConsentSettingsWithTranslations,
  getCookieConsentSettingsById,
  createCookieConsentSettingsWithTranslations,
  updateCookieConsentSettingsWithTranslations,
  deleteCookieConsentSettings
} = require('../utils/cookieConsentHelpers');
const router = express.Router();

// Helper function to check store access (ownership or team membership)
const checkStoreAccess = async (storeId, userId, userRole) => {
  if (userRole === 'admin') return true;
  
  const { checkUserStoreAccess } = require('../utils/storeAccess');
  const access = await checkUserStoreAccess(userId, storeId);
  return access !== null;
};

// @route   GET /api/cookie-consent-settings
// @desc    Get cookie consent settings
// @access  Public/Private
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/cookie-consent-settings');
    const where = {};
    
    if (isPublicRequest) {
      // Public access - only return settings for specific store
      if (store_id) where.store_id = store_id;
    } else {
      // Authenticated access - check authentication
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }
      
      // Filter by store access (ownership + team membership)
      if (req.user.role !== 'admin') {
        const { getUserStoresForDropdown } = require('../utils/storeAccess');
        const accessibleStores = await getUserStoresForDropdown(req.user.id);
        const storeIds = accessibleStores.map(store => store.id);
        console.log(`GET cookie-consent-settings: User ${req.user.id} has access to stores:`, storeIds);
        console.log(`Requested store_id: ${store_id}`);
        console.log(`Store ${store_id} is accessible:`, storeIds.includes(store_id));
        where.store_id = { [Op.in]: storeIds };
      }

      if (store_id) {
        console.log(`Overriding where clause with specific store_id: ${store_id}`);
        where.store_id = store_id;
      }
    }

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Cookie Consent: Requesting language:', lang);

    const settings = await getCookieConsentSettingsWithTranslations(where, lang);

    console.log(`Found ${settings.length} cookie consent settings for query:`, where);

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(settings);
    } else {
      // Return wrapped response for authenticated requests
      res.json({
        success: true,
        data: settings
      });
    }
  } catch (error) {
    console.error('Get cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/cookie-consent-settings/:id
// @desc    Get cookie consent settings by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const lang = getLanguageFromRequest(req);
    const settings = await getCookieConsentSettingsById(req.params.id, lang);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Cookie consent settings not found'
      });
    }

    // Get store info for access check (still needed)
    const storeInfo = await Store.findByPk(settings.store_id, {
      attributes: ['id', 'name', 'user_id']
    });

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, settings.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/cookie-consent-settings
// @desc    Create or update cookie consent settings (upsert based on store_id)
// @access  Private
router.post('/', [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id } = req.body;

    // Check store access
    const hasAccess = await checkStoreAccess(store_id, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Extract translations from request body
    const { translations, ...settingsData } = req.body;

    // UPSERT: Check if settings already exist for this store
    const existingSettings = await CookieConsentSettings.findOne({
      where: { store_id }
    });

    let settings;
    let isNew = false;

    if (existingSettings) {
      // Update existing settings
      settings = await updateCookieConsentSettingsWithTranslations(
        existingSettings.id,
        settingsData,
        translations || {}
      );
      console.log(`Updated existing cookie consent settings for store ${store_id}, ID: ${settings.id}`);
    } else {
      // Create new settings
      settings = await createCookieConsentSettingsWithTranslations(settingsData, translations || {});
      isNew = true;
      console.log(`Created new cookie consent settings for store ${store_id}, ID: ${settings.id}`);
    }

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Cookie consent settings created successfully' : 'Cookie consent settings updated successfully',
      data: settings,
      isNew
    });
  } catch (error) {
    console.error('Create/update cookie consent settings error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      details: error.errors?.map(e => ({field: e.path, message: e.message})) || null
    });
  }
});

// @route   PUT /api/cookie-consent-settings/:id
// @desc    Update cookie consent settings
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    // First check if settings exist
    const existingSettings = await CookieConsentSettings.findByPk(req.params.id);

    if (!existingSettings) {
      return res.status(404).json({
        success: false,
        message: 'Cookie consent settings not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, existingSettings.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Extract translations from request body
    const { translations, ...settingsData } = req.body;

    // Update using helper
    const settings = await updateCookieConsentSettingsWithTranslations(
      req.params.id,
      settingsData,
      translations || {}
    );

    res.json({
      success: true,
      message: 'Cookie consent settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/cookie-consent-settings/:id
// @desc    Delete cookie consent settings
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const settings = await CookieConsentSettings.findByPk(req.params.id);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Cookie consent settings not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, settings.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await deleteCookieConsentSettings(req.params.id);

    res.json({
      success: true,
      message: 'Cookie consent settings deleted successfully'
    });
  } catch (error) {
    console.error('Delete cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/cookie-consent-settings/:id/translate
// @desc    AI translate cookie consent settings to target language
// @access  Private
router.post('/:id/translate', [
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
    const settings = await CookieConsentSettings.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Cookie consent settings not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, settings.Store.id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!settings.translations || !settings.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for cookie consent settings`
      });
    }

    // Translate the settings
    const updatedSettings = await translationService.aiTranslateEntity('cookie_consent', req.params.id, fromLang, toLang);

    res.json({
      success: true,
      message: `Cookie consent settings translated to ${toLang} successfully`,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Translate cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/cookie-consent-settings/bulk-translate
// @desc    AI translate all cookie consent settings in a store to target language
// @access  Private
router.post('/bulk-translate', authMiddleware, [
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

    // Get cookie consent settings for this store with ALL translations
    const lang = getLanguageFromRequest(req);
    const settingsRecords = await getCookieConsentSettingsWithTranslations({ store_id }, lang);

    if (settingsRecords.length === 0) {
      return res.json({
        success: true,
        message: 'No cookie consent settings found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each settings record
    const results = {
      total: settingsRecords.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      skippedDetails: []
    };

    console.log(`🌐 Starting cookie consent settings translation: ${fromLang} → ${toLang} (${settingsRecords.length} settings)`);

    for (const settings of settingsRecords) {
      try {
        const settingsName = settings.translations?.[fromLang]?.banner_title || `Settings ${settings.id}`;

        // Check if source translation exists
        if (!settings.translations || !settings.translations[fromLang]) {
          console.log(`⏭️  Skipping settings "${settingsName}": No ${fromLang} translation`);
          results.skipped++;
          results.skippedDetails.push({
            settingsId: settings.id,
            settingsName,
            reason: `No ${fromLang} translation found`
          });
          continue;
        }

        // Check if target translation already exists
        const hasTargetTranslation = settings.translations[toLang] &&
          Object.values(settings.translations[toLang]).some(val =>
            typeof val === 'string' && val.trim().length > 0
          );

        if (hasTargetTranslation) {
          console.log(`⏭️  Skipping settings "${settingsName}": ${toLang} translation already exists`);
          results.skipped++;
          results.skippedDetails.push({
            settingsId: settings.id,
            settingsName,
            reason: `${toLang} translation already exists`
          });
          continue;
        }

        // Translate the settings
        console.log(`🔄 Translating settings "${settingsName}"...`);
        await translationService.aiTranslateEntity('cookie_consent', settings.id, fromLang, toLang);
        console.log(`✅ Successfully translated settings "${settingsName}"`);
        results.translated++;
      } catch (error) {
        const settingsName = settings.translations?.[fromLang]?.banner_title || `Settings ${settings.id}`;
        console.error(`❌ Error translating cookie consent settings "${settingsName}":`, error);
        results.failed++;
        results.errors.push({
          settingsId: settings.id,
          settingsName,
          error: error.message
        });
      }
    }

    console.log(`✅ Cookie consent settings translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk translate cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;