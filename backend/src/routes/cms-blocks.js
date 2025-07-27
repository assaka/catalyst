const express = require('express');
const { body, validationResult } = require('express-validator');
const { CmsBlock, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// @route   GET /api/public/cms-blocks
// @desc    Get active CMS blocks for public display
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const blocks = await CmsBlock.findAll({
      where: { 
        store_id,
        is_active: true
      },
      order: [['sort_order', 'ASC'], ['title', 'ASC']],
      attributes: ['id', 'title', 'identifier', 'content', 'placement', 'sort_order', 'is_active']
    });

    res.json({
      success: true,
      data: blocks
    });
  } catch (error) {
    console.error('Get public CMS blocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to check store ownership
const checkStoreOwnership = async (storeId, userEmail, userRole) => {
  if (userRole === 'admin') return true;
  
  const store = await Store.findByPk(storeId);
  return store && store.owner_email === userEmail;
};

// @route   GET /api/cms-blocks
// @desc    Get CMS blocks
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Filter by store ownership
    if (req.user.role !== 'admin') {
      const userStores = await Store.findAll({
        where: { owner_email: req.user.email },
        attributes: ['id']
      });
      const storeIds = userStores.map(store => store.id);
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
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'CMS block not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && block.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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

    // Check store ownership
    const hasAccess = await checkStoreOwnership(store_id, req.user.email, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const block = await CmsBlock.create(req.body);

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
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'CMS block not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && block.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await block.update(req.body);

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
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'CMS block not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && block.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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