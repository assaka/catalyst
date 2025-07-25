const express = require('express');
const { Cart } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get cart by session_id or user_id
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { session_id, user_id } = req.query;

    if (!session_id && !user_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id or user_id is required'
      });
    }

    let cart;
    if (user_id) {
      cart = await Cart.findOne({ where: { user_id } });
    } else {
      cart = await Cart.findOne({ where: { session_id } });
    }
    
    // If no cart found but both session_id and user_id were provided,
    // try finding by either field (for cases where cart was created with one but accessed with both)
    if (!cart && session_id && user_id) {
      const { Op } = require('sequelize');
      cart = await Cart.findOne({ 
        where: { 
          [Op.or]: [
            { session_id: session_id },
            { user_id: user_id }
          ]
        }
      });
    }

    if (!cart) {
      // Return empty cart structure
      cart = {
        session_id: session_id || null,
        user_id: user_id || null,
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      };
    }

    console.log('Cart GET - found cart:', {
      id: cart.id,
      session_id: cart.session_id,
      user_id: cart.user_id,
      items: cart.items,
      itemsLength: cart.items ? cart.items.length : 0
    });

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
    console.log('Cart POST - received request:', {
      body: req.body,
      sessionId: req.body.session_id,
      storeId: req.body.store_id,
      productId: req.body.product_id
    });

    const { session_id, store_id, items, user_id, product_id, quantity, price, selected_attributes, selected_options } = req.body;

    if (!session_id && !user_id) {
      console.log('Cart POST - validation failed:', {
        hasSessionId: !!session_id,
        hasUserId: !!user_id,
        hasStoreId: !!store_id
      });
      return res.status(400).json({
        success: false,
        message: 'Either session_id or user_id is required'
      });
    }

    let cart;
    if (user_id) {
      console.log('Cart POST - looking for user cart:', user_id);
      cart = await Cart.findOne({ where: { user_id } });
    } else {
      console.log('Cart POST - looking for session cart:', session_id);
      cart = await Cart.findOne({ where: { session_id } });
    }

    console.log('Cart POST - found existing cart:', !!cart);

    let cartItems = [];

    if (cart) {
      // Get existing items
      cartItems = Array.isArray(cart.items) ? cart.items : [];
      console.log('Cart POST - existing items count:', cartItems.length);
    }

    // If individual item fields are provided, add as new item
    if (product_id && quantity) {
      console.log('Cart POST - adding individual item:', { product_id, quantity });
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product_id,
        quantity: parseInt(quantity) || 1,
        price: parseFloat(price) || 0,
        selected_attributes: selected_attributes || {},
        selected_options: selected_options || []
      };

      // Check if item with same product_id and options already exists
      const existingItemIndex = cartItems.findIndex(item => 
        item.product_id === product_id && 
        JSON.stringify(item.selected_options) === JSON.stringify(selected_options)
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        cartItems[existingItemIndex].quantity += newItem.quantity;
        console.log('Cart POST - updated existing item quantity');
      } else {
        // Add new item
        cartItems.push(newItem);
        console.log('Cart POST - added new item');
      }
    } else if (items) {
      // Use provided items array
      cartItems = items;
      console.log('Cart POST - using provided items array, count:', items.length);
    }

    console.log('Cart POST - before save:', {
      cartId: cart?.id,
      itemsToSave: cartItems,
      itemsLength: cartItems.length,
      storeId: store_id
    });

    if (cart) {
      // Update existing cart
      console.log('Cart POST - updating existing cart');
      await cart.update({
        items: cartItems,
        user_id: user_id || cart.user_id,
        store_id: store_id || cart.store_id
      });
    } else {
      // Create new cart
      console.log('Cart POST - creating new cart');
      cart = await Cart.create({
        session_id,
        store_id,
        user_id,
        items: cartItems
      });
    }

    console.log('Cart POST - after save:', {
      cartId: cart.id,
      savedItems: cart.items,
      savedItemsLength: cart.items ? cart.items.length : 0
    });

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Cart POST - error occurred:', error);
    console.error('Cart POST - error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code
      } : undefined
    });
  }
});

// @route   PUT /api/cart/:id
// @desc    Update cart
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const cart = await Cart.findByPk(req.params.id);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.update(req.body);
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
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
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id is required'
      });
    }

    await Cart.destroy({ where: { session_id } });

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Debug route to check raw cart data
router.get('/debug/:id', async (req, res) => {
  try {
    const cart = await Cart.findByPk(req.params.id);
    console.log('DEBUG - Raw cart from DB:', JSON.stringify(cart, null, 2));
    res.json({
      success: true,
      data: cart,
      debug: {
        items: cart?.items,
        itemsType: typeof cart?.items,
        itemsLength: cart?.items ? cart.items.length : 0
      }
    });
  } catch (error) {
    console.error('Debug cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;