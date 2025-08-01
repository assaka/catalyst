const express = require('express');
const { body, validationResult } = require('express-validator');
const { CmsBlock, Store } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const router = express.Router();

// @route   GET /api/public/cms-blocks
// @desc    Get active CMS blocks for public display (redirect to working endpoint)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    console.log('🔀 CMS Blocks API: Redirecting to working endpoint...');
    
    // Redirect to the working clean endpoint
    const { store_id } = req.query;
    const queryString = new URLSearchParams(req.query).toString();
    const redirectUrl = `/api/public-cms-blocks?${queryString}`;
    
    console.log('🔀 Redirecting to:', redirectUrl);
    
    // Internal redirect - make a request to our own working endpoint
    const axios = require('axios');
    const baseUrl = req.protocol + '://' + req.get('host');
    const fullUrl = `${baseUrl}${redirectUrl}`;
    
    console.log('🔀 Making internal request to:', fullUrl);
    
    const response = await axios.get(fullUrl);
    
    console.log('🔀 Internal request successful');
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

      console.log('🔍 Fallback: Using direct query...');
      
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
        ORDER BY sort_order ASC, title ASC
      `, {
        bind: [store_id],
        type: QueryTypes.SELECT
      });

      console.log('🔍 Fallback query successful, found blocks:', blocks.length);
      
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
    const { page = 1, limit = 10, store_id, search } = req.query;
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
      order: [['sort_order', 'ASC'], ['title', 'ASC']],
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
      if (typeof blockData.placement === 'string') {
        // Convert string to array
        blockData.placement = [blockData.placement];
      } else if (typeof blockData.placement === 'object' && blockData.placement.position) {
        // Handle complex object format from original form
        blockData.placement = Array.isArray(blockData.placement.position) 
          ? blockData.placement.position 
          : [blockData.placement.position];
      } else if (!Array.isArray(blockData.placement)) {
        // Default fallback
        blockData.placement = ['content'];
      }
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
      if (typeof updateData.placement === 'string') {
        // Convert string to array
        updateData.placement = [updateData.placement];
      } else if (typeof updateData.placement === 'object' && updateData.placement.position) {
        // Handle complex object format from original form
        updateData.placement = Array.isArray(updateData.placement.position) 
          ? updateData.placement.position 
          : [updateData.placement.position];
      } else if (!Array.isArray(updateData.placement)) {
        // Default fallback
        updateData.placement = ['content'];
      }
    }

    await block.update(updateData);

    res.json({
      success: true,
      message: 'CMS block updated successfully',
      data: block
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

module.exports = router;