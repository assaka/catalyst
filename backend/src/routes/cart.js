const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const router = express.Router();

/**
 * CART ROUTES - Pure Supabase, No Sequelize
 *
 * Cart data is stored in tenant database (per-store)
 * Uses ConnectionManager.getStoreConnection() which returns DatabaseAdapter
 */

// @route   GET /api/cart
// @desc    Get cart by session_id or user_id
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { session_id, user_id, store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query based on session or user
    let query = tenantDb.from('carts').select('*');

    if (user_id && session_id) {
      // Check both user and session
      query = query.or(`user_id.eq.${user_id},session_id.eq.${session_id}`);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (session_id) {
      query = query.eq('session_id', session_id);
    } else {
      return res.status(400).json({
        success: false,
        message: 'session_id or user_id is required'
      });
    }

    const { data: carts, error } = await query;

    if (error) {
      console.error('Error fetching cart:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch cart'
      });
    }

    // Return first cart or empty cart
    const cart = carts && carts.length > 0 ? carts[0] : { items: [], store_id };

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart or update cart
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { session_id, user_id, store_id, items } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!session_id && !user_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id or user_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Find existing cart
    let query = tenantDb.from('carts').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    } else {
      query = query.eq('session_id', session_id);
    }

    const { data: existingCarts, error: fetchError } = await query;

    let cart;
    if (existingCarts && existingCarts.length > 0) {
      // Update existing cart
      cart = existingCarts[0];

      const { data: updatedCart, error: updateError } = await tenantDb
        .from('carts')
        .update({
          items: items || cart.items,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating cart:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update cart'
        });
      }

      cart = updatedCart;
    } else {
      // Create new cart
      const newCartData = {
        session_id,
        user_id,
        store_id,
        items: items || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newCart, error: createError } = await tenantDb
        .from('carts')
        .insert(newCartData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating cart:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create cart'
        });
      }

      cart = newCart;
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/cart
// @desc    Clear cart by session_id
// @access  Public
router.delete('/', async (req, res) => {
  try {
    const { session_id, store_id } = req.query;

    if (!store_id || !session_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id and session_id are required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { error } = await tenantDb
      .from('carts')
      .delete()
      .eq('session_id', session_id);

    if (error) {
      console.error('Error deleting cart:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete cart'
      });
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Delete cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
