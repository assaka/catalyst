const express = require('express');
const { body, validationResult } = require('express-validator');
const { CmsPage, Store } = require('../models');
const { Op } = require('sequelize');
const translationService = require('../services/translation-service');
const {
  getCMSPagesWithAllTranslations,
  getCMSPageWithAllTranslations,
  saveCMSPageTranslations
} = require('../utils/cmsHelpers');
const router = express.Router();

// Basic CRUD operations for CMS pages
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id } = req.query;

    const where = {};
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;

    // Use helper to get pages with all translations
    const allPages = await getCMSPagesWithAllTranslations(where);

    // Manually paginate the results
    const offset = (page - 1) * limit;
    const paginatedPages = allPages.slice(offset, offset + parseInt(limit));
    const count = allPages.length;

    res.json({
      success: true,
      data: {
        pages: paginatedPages,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching CMS pages:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    // Use helper to get page with all translations
    const page = await getCMSPageWithAllTranslations(req.params.id);

    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, page.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching CMS page:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { store_id, translations, ...pageData } = req.body;
    const store = await Store.findByPk(store_id);

    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    console.log('Creating CMS page with data:', JSON.stringify({ ...pageData, store_id }, null, 2));

    // Create the page without translations
    const page = await CmsPage.create({ ...pageData, store_id });
    console.log('CMS page created successfully:', page.id);

    // Save translations to normalized table
    if (translations) {
      await saveCMSPageTranslations(page.id, translations);
      console.log('CMS page translations saved successfully');
    }

    // Fetch page with all translations to return
    const pageWithTranslations = await getCMSPageWithAllTranslations(page.id);

    res.status(201).json({ success: true, message: 'Page created successfully', data: pageWithTranslations });
  } catch (error) {
    console.error('Error creating CMS page:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const page = await CmsPage.findByPk(req.params.id);

    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, page.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const { translations, ...pageData } = req.body;

    console.log('Updating CMS page:', req.params.id, 'with data:', JSON.stringify(pageData, null, 2));

    // Update page without translations
    await page.update(pageData);
    console.log('CMS page updated successfully:', page.id);

    // Save translations to normalized table
    if (translations) {
      await saveCMSPageTranslations(page.id, translations);
      console.log('CMS page translations saved successfully');
    }

    // Fetch page with all translations to return
    const pageWithTranslations = await getCMSPageWithAllTranslations(page.id);

    res.json({ success: true, message: 'Page updated successfully', data: pageWithTranslations });
  } catch (error) {
    console.error('Error updating CMS page:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const page = await CmsPage.findByPk(req.params.id);

    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    // Prevent deletion of system pages
    if (page.is_system) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system pages. System pages like 404 are critical for site functionality.'
      });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, page.store_id);

      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await page.destroy();
    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/cms-pages/:id/translate
// @desc    AI translate a single CMS page to target language
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
    const page = await CmsPage.findByPk(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'CMS page not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, page.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!page.translations || !page.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this page`
      });
    }

    // Translate the page
    const updatedPage = await translationService.aiTranslateEntity('cms_page', req.params.id, fromLang, toLang);

    res.json({
      success: true,
      message: `CMS page translated to ${toLang} successfully`,
      data: updatedPage
    });
  } catch (error) {
    console.error('Translate CMS page error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/cms-pages/bulk-translate
// @desc    AI translate all CMS pages in a store to target language
// @access  Private
router.post('/bulk-translate', [
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

    // Get all pages for this store with all translations
    const pages = await getCMSPagesWithAllTranslations({ store_id });

    if (pages.length === 0) {
      return res.json({
        success: true,
        message: 'No CMS pages found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each page
    const results = {
      total: pages.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      skippedDetails: []
    };

    console.log(`🌐 Starting CMS page translation: ${fromLang} → ${toLang} (${pages.length} pages)`);

    for (const page of pages) {
      try {
        const pageTitle = page.translations?.[fromLang]?.title || page.title || page.slug || `Page ${page.id}`;

        // Check if source translation exists
        if (!page.translations || !page.translations[fromLang]) {
          console.log(`⏭️  Skipping page "${pageTitle}": No ${fromLang} translation`);
          results.skipped++;
          results.skippedDetails.push({
            pageId: page.id,
            pageTitle,
            reason: `No ${fromLang} translation found`
          });
          continue;
        }

        // Check if ALL target fields have content (field-level check)
        const sourceFields = Object.entries(page.translations[fromLang] || {});
        const targetTranslation = page.translations[toLang] || {};

        const allFieldsTranslated = sourceFields.every(([key, value]) => {
          if (!value || typeof value !== 'string' || !value.trim()) return true; // Ignore empty source fields
          const targetValue = targetTranslation[key];
          return targetValue && typeof targetValue === 'string' && targetValue.trim().length > 0;
        });

        if (allFieldsTranslated && sourceFields.length > 0) {
          console.log(`⏭️  Skipping page "${pageTitle}": All fields already translated`);
          results.skipped++;
          results.skippedDetails.push({
            pageId: page.id,
            pageTitle,
            reason: `All fields already translated`
          });
          continue;
        }

        // Translate the page
        console.log(`🔄 Translating page "${pageTitle}"...`);
        await translationService.aiTranslateEntity('cms_page', page.id, fromLang, toLang);
        console.log(`✅ Successfully translated page "${pageTitle}"`);
        results.translated++;
      } catch (error) {
        const pageTitle = page.translations?.[fromLang]?.title || page.title || page.slug || `Page ${page.id}`;
        console.error(`❌ Error translating CMS page "${pageTitle}":`, error);
        results.failed++;
        results.errors.push({
          pageId: page.id,
          pageTitle,
          error: error.message
        });
      }
    }

    console.log(`✅ CMS page translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk translate CMS pages error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/cms-pages/create-system-pages
// @desc    Create system pages (404, Privacy Policy) for a store
// @access  Private (requires store access)
router.post('/create-system-pages', async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
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

    // Get the store
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Create system pages using the utility function
    const { createSystemPages } = require('../utils/createSystemPages');
    const createdPages = await createSystemPages(store, CmsPage);

    res.json({
      success: true,
      message: `Created ${createdPages.length} system page(s)`,
      data: createdPages
    });
  } catch (error) {
    console.error('Error creating system pages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;