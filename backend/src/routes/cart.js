const express = require('express');
const { Cart, SlotConfiguration } = require('../models');
const { authMiddleware } = require('../middleware/auth');

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

    // Load slot configuration for cart layout if we have a store_id
    let slotConfiguration = null;
    if (cart.store_id) {
      try {
        const configurations = await SlotConfiguration.findAll({
          where: {
            store_id: cart.store_id,
            is_active: true
          },
          order: [['updated_at', 'DESC']]
        });
        
        // Filter for Cart page configuration
        const cartConfig = configurations.find(config => {
          const conf = config.configuration || {};
          return conf.page_name === 'Cart' && conf.slot_type === 'cart_layout';
        });
        
        if (cartConfig) {
          slotConfiguration = cartConfig.configuration;
        }
      } catch (error) {
        console.error('Error loading slot configuration for cart:', error);
        // Don't fail the cart request if slot config fails to load
      }
    }

    res.json({
      success: true,
      data: {
        ...cart,
        slotConfiguration
      }
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
    console.log('Cart POST - Full request body:', JSON.stringify(req.body));
    const { session_id, store_id, items, user_id, product_id, quantity, price, selected_attributes, selected_options } = req.body;
    console.log('Cart POST - Parsed fields:', { session_id, store_id, items, user_id, product_id, quantity, price });

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
      console.log('Cart POST - Adding individual item, existing cartItems:', JSON.stringify(cartItems));
      
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product_id,
        quantity: parseInt(quantity) || 1,
        price: parseFloat(price) || 0,
        selected_attributes: selected_attributes || {},
        selected_options: selected_options || []
      };

      console.log('Cart POST - New item to add:', JSON.stringify(newItem));

      // Check if item with same product_id and options already exists
      const existingItemIndex = cartItems.findIndex(item => 
        item.product_id === product_id && 
        JSON.stringify(item.selected_options) === JSON.stringify(selected_options)
      );

      console.log('Cart POST - Existing item index:', existingItemIndex);

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        cartItems[existingItemIndex].quantity += newItem.quantity;
        console.log('Cart POST - Updated existing item quantity');
      } else {
        // Add new item
        cartItems.push(newItem);
        console.log('Cart POST - Added new item, cartItems now:', JSON.stringify(cartItems));
      }
    } else if (items !== undefined && !product_id) {
      // Only use provided items array if no individual product is being added
      cartItems = Array.isArray(items) ? items : [];
      console.log('Cart POST - Using provided items array:', JSON.stringify(cartItems));
    }

    if (cart) {
      // Update existing cart - force JSON column update by setting to null first
      console.log('Cart POST - Updating existing cart with items:', JSON.stringify(cartItems));
      await cart.update({
        items: null,
        user_id: user_id || cart.user_id,
        store_id: store_id || cart.store_id
      });
      await cart.update({
        items: cartItems,
        user_id: user_id || cart.user_id,
        store_id: store_id || cart.store_id
      });
      await cart.reload();
      console.log('Cart POST - After reload, cart items:', JSON.stringify(cart.items));
    } else {
      // Create new cart
      console.log('Cart POST - Creating new cart with items:', JSON.stringify(cartItems));
      cart = await Cart.create({
        session_id,
        store_id,
        user_id,
        items: cartItems
      });
      console.log('Cart POST - After create, cart items:', JSON.stringify(cart.items));
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