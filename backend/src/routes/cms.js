const express = require('express');
const { body, validationResult } = require('express-validator');
const { CmsPage, Store } = require('../models');
const { Op } = require('sequelize');
const translationService = require('../services/translation-service');
const router = express.Router();

// Basic CRUD operations for CMS pages
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;

    const { count, rows } = await CmsPage.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sort_order', 'ASC'], ['title', 'ASC']],
    });

    res.json({ success: true, data: { pages: rows, pagination: { current_page: parseInt(page), per_page: parseInt(limit), total: count, total_pages: Math.ceil(count / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
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

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { store_id } = req.body;
    const store = await Store.findByPk(store_id);
    
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);
      
      if (!access) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const page = await CmsPage.create(req.body);
    res.status(201).json({ success: true, message: 'Page created successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
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

    await page.update(req.body);
    res.json({ success: true, message: 'Page updated successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
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

    // Get all pages for this store
    const pages = await CmsPage.findAll({
      where: { store_id },
      order: [['sort_order', 'ASC'], ['title', 'ASC']]
    });

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
      errors: []
    };

    for (const page of pages) {
      try {
        // Check if source translation exists
        if (!page.translations || !page.translations[fromLang]) {
          results.skipped++;
          continue;
        }

        // Check if target translation already exists
        if (page.translations[toLang]) {
          results.skipped++;
          continue;
        }

        // Translate the page
        await translationService.aiTranslateEntity('cms_page', page.id, fromLang, toLang);
        results.translated++;
      } catch (error) {
        console.error(`Error translating CMS page ${page.id}:`, error);
        results.failed++;
        results.errors.push({
          pageId: page.id,
          pageTitle: page.translations?.[fromLang]?.title || page.title,
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
    console.error('Bulk translate CMS pages error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;