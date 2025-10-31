const express = require('express');
const { body, validationResult } = require('express-validator');
const { CmsBlock, Store } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');
const translationService = require('../services/translation-service');
const router = express.Router();

// @route   GET /api/public/cms-blocks
// @desc    Get active CMS blocks for public display (redirect to working endpoint)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    
    // Redirect to the working clean endpoint
    const { store_id } = req.query;
    const queryString = new URLSearchParams(req.query).toString();
    const redirectUrl = `/api/public-cms-blocks?${queryString}`;
    
    // Internal redirect - make a request to our own working endpoint
    const axios = require('axios');
    const baseUrl = req.protocol + '://' + req.get('host');
    const fullUrl = `${baseUrl}${redirectUrl}`;
    
    const response = await axios.get(fullUrl);

    res.json(response.data);
    
  } catch (error) {
    console.error('🚨 Redirect failed, falling back to direct query:', error.message);
    
    // Fallback: execute the query directly if redirect fails
    try {
      const { store_id } = req.query;
      
      if (!store_id) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }
      
      const blocks = await sequelize.query(`
        SELECT 
          id::text as id,
          title,
          identifier,
          content,
          placement,
          sort_order,
          is_active
        FROM cms_blocks 
        WHERE store_id::text = $1
        AND is_active = true
        ORDER BY sort_order ASC, identifier ASC
      `, {
        bind: [store_id],
        type: QueryTypes.SELECT
      });
      
      res.json({
        success: true,
        data: blocks
      });
      
    } catch (fallbackError) {
      console.error('🚨 Fallback also failed:', fallbackError);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? fallbackError.message : 'Internal server error'
      });
    }
  }
});

// Helper function to check store ownership or team membership
const checkStoreAccess = async (storeId, userId, userRole) => {
  if (userRole === 'admin') return true;
  
  const { checkUserStoreAccess } = require('../utils/storeAccess');
  const access = await checkUserStoreAccess(userId, storeId);
  return !!access;
};

// @route   GET /api/cms-blocks
// @desc    Get CMS blocks
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id, search, include_all_translations } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Filter by store ownership and team membership
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;

    // If include_all_translations is requested, use helper function
    if (include_all_translations === 'true') {
      const { getCMSBlocksWithAllTranslations } = require('../utils/cmsHelpers');

      // Build where clause for helper
      const helperWhere = {};
      if (store_id) helperWhere.store_id = store_id;

      const blocks = await getCMSBlocksWithAllTranslations(helperWhere);

      console.log(`🔍 CMS Blocks route - Fetched ${blocks.length} blocks with all translations`);

      // Apply search filter in memory if needed
      let filteredBlocks = blocks;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredBlocks = blocks.filter(block => {
          // Search in English translations
          const enTitle = block.translations?.en?.title || '';
          const enContent = block.translations?.en?.content || '';
          const identifier = block.identifier || '';

          return enTitle.toLowerCase().includes(searchLower) ||
                 enContent.toLowerCase().includes(searchLower) ||
                 identifier.toLowerCase().includes(searchLower);
        });
      }

      // Apply pagination
      const total = filteredBlocks.length;
      const paginatedBlocks = filteredBlocks.slice(offset, offset + parseInt(limit));

      return res.json({
        success: true,
        data: {
          blocks: paginatedBlocks,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: total,
            total_pages: Math.ceil(total / limit)
          }
        }
      });
    }

    // Standard query without all translations
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { identifier: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await CmsBlock.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sort_order', 'ASC'], ['identifier', 'ASC']],
      include: [{
        model: Store,
        attributes: ['id', 'name']
      }]
    });

    res.json({
      success: true,
      data: {
        blocks: rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get CMS blocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/cms-blocks/:id
// @desc    Get CMS block by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { include_all_translations } = req.query;

    // If include_all_translations is requested, use helper function
    if (include_all_translations === 'true') {
      const { getCMSBlockWithAllTranslations } = require('../utils/cmsHelpers');

      const block = await getCMSBlockWithAllTranslations(req.params.id);

      if (!block) {
        return res.status(404).json({
          success: false,
          message: 'CMS block not found'
        });
      }

      console.log(`🔍 CMS Block by ID - Fetched block ${req.params.id} with all translations:`, {
        blockId: block.id,
        identifier: block.identifier,
        translationKeys: Object.keys(block.translations || {})
      });

      // Check ownership - fetch store separately for access check
      const storeBlock = await CmsBlock.findByPk(req.params.id, {
        include: [{
          model: Store,
          attributes: ['id', 'name', 'user_id']
        }]
      });

      if (req.user.role !== 'admin') {
        const hasAccess = await checkStoreAccess(storeBlock.Store.id, req.user.id, req.user.role);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      return res.json({
        success: true,
        data: block
      });
    }

    // Standard query without all translations
    const block = await CmsBlock.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'CMS block not found'
      });
    }

    // Check ownership or team membership
    if (req.user.role !== 'admin') {
      const hasAccess = await checkStoreAccess(block.Store.id, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('Get CMS block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/cms-blocks
// @desc    Create new CMS block
// @access  Private
router.post('/', [
  body('title').notEmpty().withMessage('Block title is required'),
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

    // Process placement field - ensure it's an array
    const blockData = { ...req.body };
    
    if (blockData.placement) {
      // Handle over-serialized JSON strings
      let placement = blockData.placement;
      
      // If it's a string, try to parse it multiple times to handle over-serialization
      if (typeof placement === 'string') {
        try {
          // Keep parsing until we get a proper array or can't parse anymore
          while (typeof placement === 'string' && (placement.startsWith('[') || placement.startsWith('"'))) {
            placement = JSON.parse(placement);
          }
          // If after parsing we still have a string, convert to array
          if (typeof placement === 'string') {
            placement = [placement];
          }
        } catch (e) {
          console.error('Failed to parse placement string:', e);
          placement = [blockData.placement]; // Use original string as single item
        }
      }
      
      // Handle arrays that contain nested serialized strings
      if (Array.isArray(placement)) {
        const cleanedPlacement = [];
        for (const item of placement) {
          if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('"'))) {
            try {
              // Try to parse nested serialized arrays
              let parsed = item;
              while (typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('"'))) {
                parsed = JSON.parse(parsed);
              }
              // If we got an array, spread it; if string, add it
              if (Array.isArray(parsed)) {
                cleanedPlacement.push(...parsed);
              } else if (typeof parsed === 'string') {
                cleanedPlacement.push(parsed);
              }
            } catch (e) {
              // If parsing fails, use the original item
              cleanedPlacement.push(item);
            }
          } else {
            cleanedPlacement.push(item);
          }
        }
        placement = cleanedPlacement;
      }
      
      // Handle complex object format from original form
      if (typeof placement === 'object' && placement.position) {
        placement = Array.isArray(placement.position) 
          ? placement.position 
          : [placement.position];
      }
      
      // Ensure we have an array
      if (!Array.isArray(placement)) {
        placement = ['content']; // Default fallback
      }
      
      blockData.placement = placement;
      console.log('✅ Processed placement data (CREATE):', blockData.placement);
    } else {
      blockData.placement = ['content']; // Default fallback
    }

    const block = await CmsBlock.create(blockData);

    res.status(201).json({
      success: true,
      message: 'CMS block created successfully',
      data: block
    });
  } catch (error) {
    console.error('Create CMS block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/cms-blocks/:id
// @desc    Update CMS block
// @access  Private
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('Block title cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const block = await CmsBlock.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });
    
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'CMS block not found'
      });
    }

    // Check ownership or team membership
    if (req.user.role !== 'admin') {
      const hasAccess = await checkStoreAccess(block.Store.id, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Process placement field - ensure it's an array
    const updateData = { ...req.body };
    
    if (updateData.placement) {
      // Handle over-serialized JSON strings
      let placement = updateData.placement;
      
      // If it's a string, try to parse it multiple times to handle over-serialization
      if (typeof placement === 'string') {
        try {
          // Keep parsing until we get a proper array or can't parse anymore
          while (typeof placement === 'string' && (placement.startsWith('[') || placement.startsWith('"'))) {
            placement = JSON.parse(placement);
          }
          // If after parsing we still have a string, convert to array
          if (typeof placement === 'string') {
            placement = [placement];
          }
        } catch (e) {
          console.error('Failed to parse placement string:', e);
          placement = [updateData.placement]; // Use original string as single item
        }
      }
      
      // Handle arrays that contain nested serialized strings
      if (Array.isArray(placement)) {
        const cleanedPlacement = [];
        for (const item of placement) {
          if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('"'))) {
            try {
              // Try to parse nested serialized arrays
              let parsed = item;
              while (typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('"'))) {
                parsed = JSON.parse(parsed);
              }
              // If we got an array, spread it; if string, add it
              if (Array.isArray(parsed)) {
                cleanedPlacement.push(...parsed);
              } else if (typeof parsed === 'string') {
                cleanedPlacement.push(parsed);
              }
            } catch (e) {
              // If parsing fails, use the original item
              cleanedPlacement.push(item);
            }
          } else {
            cleanedPlacement.push(item);
          }
        }
        placement = cleanedPlacement;
      }
      
      // Handle complex object format from original form
      if (typeof placement === 'object' && placement.position) {
        placement = Array.isArray(placement.position) 
          ? placement.position 
          : [placement.position];
      }
      
      // Ensure we have an array
      if (!Array.isArray(placement)) {
        placement = ['content']; // Default fallback
      }
      
      updateData.placement = placement;
      console.log('✅ Processed placement data:', updateData.placement);
    }

    // Handle translations if provided
    const { translations, ...blockData } = updateData;

    // Update main block fields (excluding translations)
    await block.update(blockData);

    // Save translations to normalized table if provided
    if (translations && typeof translations === 'object') {
      const { saveCMSBlockTranslations } = require('../utils/cmsHelpers');
      await saveCMSBlockTranslations(block.id, translations);
      console.log(`✅ CMS block ${block.id} translations saved to normalized table`);
    }

    // Fetch updated block with all translations
    const { getCMSBlockWithAllTranslations } = require('../utils/cmsHelpers');
    const updatedBlock = await getCMSBlockWithAllTranslations(block.id);

    res.json({
      success: true,
      message: 'CMS block updated successfully',
      data: updatedBlock
    });
  } catch (error) {
    console.error('Update CMS block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/cms-blocks/:id
// @desc    Delete CMS block
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const block = await CmsBlock.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });
    
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'CMS block not found'
      });
    }

    // Check ownership or team membership
    if (req.user.role !== 'admin') {
      const hasAccess = await checkStoreAccess(block.Store.id, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await block.destroy();

    res.json({
      success: true,
      message: 'CMS block deleted successfully'
    });
  } catch (error) {
    console.error('Delete CMS block error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/cms-blocks/:id/translate
// @desc    AI translate a single CMS block to target language
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
    const block = await CmsBlock.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'CMS block not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const hasAccess = await checkStoreAccess(block.Store.id, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!block.translations || !block.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this block`
      });
    }

    // Translate the block
    const updatedBlock = await translationService.aiTranslateEntity('cms_block', req.params.id, fromLang, toLang);

    res.json({
      success: true,
      message: `CMS block translated to ${toLang} successfully`,
      data: updatedBlock
    });
  } catch (error) {
    console.error('Translate CMS block error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/cms-blocks/bulk-translate
// @desc    AI translate all CMS blocks in a store to target language
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
      const hasAccess = await checkStoreAccess(store_id, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get all blocks for this store with all translations
    const { getCMSBlocksWithAllTranslations } = require('../utils/cmsHelpers');
    const blocks = await getCMSBlocksWithAllTranslations({ store_id });

    if (blocks.length === 0) {
      return res.json({
        success: true,
        message: 'No CMS blocks found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each block
    const results = {
      total: blocks.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      skippedDetails: []
    };

    console.log(`🌐 Starting CMS blocks translation: ${fromLang} → ${toLang} (${blocks.length} blocks)`);

    for (const block of blocks) {
      try {
        const blockTitle = block.translations?.[fromLang]?.title || block.title || block.identifier;

        // Check if source translation exists
        if (!block.translations || !block.translations[fromLang]) {
          console.log(`⏭️  Skipping block "${blockTitle}": No ${fromLang} translation`);
          results.skipped++;
          results.skippedDetails.push({
            blockId: block.id,
            blockTitle,
            reason: `No ${fromLang} translation found`
          });
          continue;
        }

        // Check if ALL target fields have content (field-level check)
        const sourceFields = Object.entries(block.translations[fromLang] || {});
        const targetTranslation = block.translations[toLang] || {};

        const allFieldsTranslated = sourceFields.every(([key, value]) => {
          if (!value || typeof value !== 'string' || !value.trim()) return true; // Ignore empty source fields
          const targetValue = targetTranslation[key];
          return targetValue && typeof targetValue === 'string' && targetValue.trim().length > 0;
        });

        if (allFieldsTranslated && sourceFields.length > 0) {
          console.log(`⏭️  Skipping block "${blockTitle}": All fields already translated`);
          results.skipped++;
          results.skippedDetails.push({
            blockId: block.id,
            blockTitle,
            reason: `All fields already translated`
          });
          continue;
        }

        // Translate the block
        console.log(`🔄 Translating block "${blockTitle}"...`);
        await translationService.aiTranslateEntity('cms_block', block.id, fromLang, toLang);
        console.log(`✅ Successfully translated block "${blockTitle}"`);
        results.translated++;
      } catch (error) {
        const blockTitle = block.translations?.[fromLang]?.title || block.title || block.identifier;
        console.error(`❌ Error translating CMS block "${blockTitle}":`, error);
        results.failed++;
        results.errors.push({
          blockId: block.id,
          blockTitle,
          error: error.message
        });
      }
    }

    console.log(`✅ CMS blocks translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk translate CMS blocks error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;