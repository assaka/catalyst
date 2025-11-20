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

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build where clause
    let query = tenantDb
      .from('wishlists')
      .select(`
        *,
        products:product_id (
          id,
          price,
          images,
          slug
        )
      `)
      .eq('store_id', store_id)
      .order('added_at', { ascending: false });

    if (session_id) {
      query = query.eq('session_id', session_id);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: wishlist, error } = await query;

    if (error) {
      throw error;
    }

    // Get language and apply translations
    const lang = getLanguageFromRequest(req);
    const wishlistWithTranslations = await Promise.all(
      (wishlist || []).map(async (item) => {
        if (item.products) {
          const [productWithTranslation] = await applyProductTranslationsToMany([item.products], lang);
          item.products = productWithTranslation;
        }
        return item;
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

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if item already exists
    let checkQuery = tenantDb
      .from('wishlists')
      .select('*')
      .eq('product_id', product_id);

    if (user_id) {
      checkQuery = checkQuery.eq('user_id', user_id);
    } else {
      checkQuery = checkQuery.eq('session_id', session_id);
    }

    const { data: existing, error: checkError } = await checkQuery.single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Item already in wishlist'
      });
    }

    // Insert new wishlist item
    const { data: wishlistItem, error: insertError } = await tenantDb
      .from('wishlists')
      .insert({
        session_id,
        store_id,
        product_id,
        user_id
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

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

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if wishlist item exists
    const { data: wishlistItem, error: checkError } = await tenantDb
      .from('wishlists')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (checkError || !wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist item not found'
      });
    }

    // Delete the item
    const { error: deleteError } = await tenantDb
      .from('wishlists')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      throw deleteError;
    }

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

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Delete all items for session
    const { error } = await tenantDb
      .from('wishlists')
      .delete()
      .eq('session_id', session_id);

    if (error) {
      throw error;
    }

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
