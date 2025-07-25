const express = require('express');
const { Cart } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Debug endpoint - can be removed in production
router.get('/debug', async (req, res) => {
  try {
    const cartCount = await Cart.count();
    const { Store } = require('../models');
    const stores = await Store.findAll({ 
      attributes: ['id', 'name', 'slug'],
      limit: 5 
    });

    res.json({
      success: true,
      cartCount,
      stores: stores.map(s => ({ id: s.id, name: s.name, slug: s.slug }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
      console.log('Cart GET - No cart found, returning empty cart');
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
    } else {
      console.log('Cart GET - found cart:', {
        id: cart.id,
        session_id: cart.session_id,
        user_id: cart.user_id,
        items: cart.items,
        itemsType: typeof cart.items,
        itemsLength: cart.items ? cart.items.length : 0,
        rawItems: JSON.stringify(cart.items)
      });
    }

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
    const { session_id, store_id, items, user_id, product_id, quantity, price, selected_attributes, selected_options } = req.body;

    if ((!session_id && !user_id) || !store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id and either session_id or user_id are required'
      });
    }

    let cart;
    if (user_id) {
      cart = await Cart.findOne({ where: { user_id } });
    } else {
      cart = await Cart.findOne({ where: { session_id } });
    }

    let cartItems = [];

    if (cart) {
      // Get existing items
      cartItems = Array.isArray(cart.items) ? cart.items : [];
    }

    // If individual item fields are provided, add as new item
    if (product_id && quantity) {
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
      } else {
        // Add new item
        cartItems.push(newItem);
      }
    } else if (items) {
      // Use provided items array
      cartItems = items;
    }

    if (cart) {
      // Update existing cart - ensure items is properly set as JSON
      const updateData = {
        items: JSON.parse(JSON.stringify(cartItems)), // Ensure proper JSON serialization
        user_id: user_id || cart.user_id,
        store_id: store_id || cart.store_id
      };
      
      await cart.update(updateData);
      await cart.reload();
    } else {
      // Create new cart
      cart = await Cart.create({
        session_id,
        store_id,
        user_id,
        items: JSON.parse(JSON.stringify(cartItems)) // Ensure proper JSON serialization
      });
    }

    // Additional logging to debug data persistence
    console.log('Cart after save - ID:', cart.id);
    console.log('Cart after save - Items:', JSON.stringify(cart.items));
    console.log('Cart after save - Items length:', cart.items ? cart.items.length : 0);

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Cart POST error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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