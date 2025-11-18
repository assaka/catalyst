const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { applyProductTranslationsToMany } = require('../utils/productHelpers');

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get wishlist by session_id
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { session_id, user_id, store_id } = req.query;

    if (!session_id && !user_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id or user_id is required'
      });
    }

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getConnection(store_id);
    const { Wishlist, Product } = connection.models;

    const whereClause = {};
    if (session_id) whereClause.session_id = session_id;
    if (user_id) whereClause.user_id = user_id;

    const wishlist = await Wishlist.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          attributes: ['id', 'price', 'images', 'slug']
        }
      ],
      order: [['added_at', 'DESC']]
    });

    // Get language and apply translations
    const lang = getLanguageFromRequest(req);
    const wishlistWithTranslations = await Promise.all(
      wishlist.map(async (item) => {
        const itemData = item.toJSON();
        if (itemData.Product) {
          const [productWithTranslation] = await applyProductTranslationsToMany([itemData.Product], lang);
          itemData.Product = productWithTranslation;
        }
        return itemData;
      })
    );

    res.json({
      success: true,
      data: wishlistWithTranslations
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { session_id, store_id, product_id, user_id } = req.body;

    if ((!session_id && !user_id) || !store_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id, product_id, and either session_id or user_id are required'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getConnection(store_id);
    const { Wishlist } = connection.models;

    // Check if item already exists
    const whereClause = { product_id };
    if (user_id) {
      whereClause.user_id = user_id;
    } else {
      whereClause.session_id = session_id;
    }

    const existing = await Wishlist.findOne({ where: whereClause });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Item already in wishlist'
      });
    }

    const wishlistItem = await Wishlist.create({
      session_id,
      store_id,
      product_id,
      user_id
    });

    res.status(201).json({
      success: true,
      data: wishlistItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/wishlist/:id
// @desc    Remove item from wishlist
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getConnection(store_id);
    const { Wishlist } = connection.models;

    const wishlistItem = await Wishlist.findByPk(req.params.id);

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist item not found'
      });
    }

    await wishlistItem.destroy();

    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/wishlist
// @desc    Clear wishlist by session_id
// @access  Public
router.delete('/', async (req, res) => {
  try {
    const { session_id, store_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id is required'
      });
    }

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getConnection(store_id);
    const { Wishlist } = connection.models;

    await Wishlist.destroy({ where: { session_id } });

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;