const express = require('express');
const { Category, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// @route   GET /api/public/categories
// @desc    Get all active categories (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, parent_id, search } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('🔍 Public Categories API called with params:', req.query);
    console.log('🔍 Request URL:', req.originalUrl);

    const where = {
      is_active: true,  // Only show active categories
      hide_in_menu: false  // Only show categories not hidden in menu
    };
    
    if (store_id) where.store_id = store_id;
    if (parent_id !== undefined) where.parent_id = parent_id;
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Category.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']] // Removed sort_order which might not exist
    });

    console.log('✅ Public Categories query result:', rows.length, 'categories found');
    console.log('📊 WHERE conditions:', where);
    if (rows.length > 0) {
      console.log('🎯 Sample category:', JSON.stringify(rows[0], null, 2));
    }
    
    // Return just the array for public requests (for compatibility)
    res.json(rows);
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/public/categories/:id
// @desc    Get single category by ID (no authentication required)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category || !category.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get public category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;