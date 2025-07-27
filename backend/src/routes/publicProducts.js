const express = require('express');
const { Product, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// @route   GET /api/public/products
// @desc    Get all active products (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, category_id, status = 'active', search, slug, sku, id, featured } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      status: 'active' // Only show active products publicly
    };
    
    if (store_id) where.store_id = store_id;
    if (category_id) where.category_id = category_id;
    if (featured === 'true' || featured === true) where.is_featured = true;
    if (slug) where.slug = slug;
    if (sku) where.sku = sku;
    if (id) where.id = id;
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    // Return just the array for public requests (for compatibility)
    res.json(rows);
  } catch (error) {
    console.error('Get public products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/public/products/:id
// @desc    Get single product by ID (no authentication required)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'slug']
      }]
    });
    
    if (!product || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get public product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;