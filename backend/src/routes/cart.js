const express = require('express');
const { Cart, SlotConfiguration, Product } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Helper function to check if product is out of stock
const isProductOutOfStock = (product) => {
  // Infinite stock products are never out of stock
  if (product.infinite_stock) return false;

  // If not managing stock, never out of stock
  if (!product.manage_stock) return false;

  // Check if stock is depleted
  if (product.stock_quantity <= 0) {
    // Allow if backorders are enabled
    return !product.allow_backorders;
  }

  return false;
};

// Helper function to get available stock quantity
const getAvailableQuantity = (product) => {
  // Infinite stock
  if (product.infinite_stock) return Infinity;

  // Not managing stock
  if (!product.manage_stock) return Infinity;

  // Allow backorders
  if (product.allow_backorders) return Infinity;

  // Return actual stock
  return Math.max(0, product.stock_quantity);
};

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
// @desc    Get cart by session_id or user_id, optionally filtered by store_id
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

    let cart = null;

    // CRITICAL: When both session_id and user_id are provided, check for cart merging FIRST
    // This handles the case where a user logs in while having items in their guest cart
    if (session_id && user_id) {
      try {
        const { Op } = require('sequelize');

        console.log('🔄 Cart GET: Starting cart merge logic', { session_id, user_id, store_id });

        // Look for both guest cart (by session_id) and user cart (by user_id)
        const bothWhere = {
          [Op.or]: [
            { session_id: session_id },
            { user_id: user_id }
          ]
        };

        if (store_id) {
          bothWhere.store_id = store_id;
        }

        const allCarts = await Cart.findAll({ where: bothWhere });
        console.log('🔄 Cart GET: Found carts for merge', {
          totalCarts: allCarts.length,
          cartDetails: allCarts.map(c => ({
            id: c.id,
            session_id: c.session_id,
            user_id: c.user_id,
            itemCount: Array.isArray(c.items) ? c.items.length : 0
          }))
        });

        const guestCart = allCarts.find(c => c.session_id === session_id && !c.user_id);
        const userCart = allCarts.find(c => c.user_id === user_id);

        console.log('🔄 Cart GET: Cart merge candidates', {
          hasGuestCart: !!guestCart,
          hasUserCart: !!userCart,
          guestCartId: guestCart?.id,
          userCartId: userCart?.id
        });

        if (guestCart && userCart) {
          // Both carts exist - merge guest cart items into user cart
          const guestItems = Array.isArray(guestCart.items) ? guestCart.items : [];
          const userItems = Array.isArray(userCart.items) ? userCart.items : [];

          console.log('🔄 Cart GET: Merging both carts', {
            guestItemCount: guestItems.length,
            userItemCount: userItems.length
          });

          // Merge items - add guest items to user cart (avoiding duplicates based on product_id and options)
          for (const guestItem of guestItems) {
            const existingIndex = userItems.findIndex(item =>
              item.product_id === guestItem.product_id &&
              JSON.stringify(item.selected_options) === JSON.stringify(guestItem.selected_options)
            );

            if (existingIndex >= 0) {
              // Item exists, increase quantity
              userItems[existingIndex].quantity += guestItem.quantity;
            } else {
              // New item, add to cart
              userItems.push(guestItem);
            }
          }

          // Update user cart with merged items
          userCart.items = userItems;
          userCart.changed('items', true);
          await userCart.save();
          await userCart.reload();

          // Delete guest cart as it's now merged
          await guestCart.destroy();

          console.log(`✅ Cart merged: ${guestItems.length} items from guest cart merged into user cart (total now: ${userItems.length})`);
          cart = userCart;
        } else if (guestCart && !userCart) {
          // Only guest cart exists - keep it linked by session_id
          // NOTE: We don't set user_id because:
          // 1. Customer users are in a different table (foreign key constraint would fail)
          // 2. Session-based tracking works for both customers and guests
          console.log('🔄 Cart GET: Using guest cart (keeping session_id tracking)');
          cart = guestCart;
        } else if (userCart) {
          // Only user cart exists - use it
          console.log('🔄 Cart GET: Using existing user cart');
          cart = userCart;
        } else {
          console.log('⚠️ Cart GET: No carts found for merge');
        }
      } catch (mergeError) {
        console.error('❌ Cart GET: Cart merge failed', {
          error: mergeError.message,
          stack: mergeError.stack,
          session_id,
          user_id,
          store_id
        });
        // Don't fail the request, just return empty cart
        cart = null;
      }
    }

    // If cart not found yet (merge didn't run or didn't find anything), try simple query
    if (!cart) {
      const whereClause = {};

      if (user_id) {
        whereClause.user_id = user_id;
      } else if (session_id) {
        whereClause.session_id = session_id;
      }

      // CRITICAL: Filter by store_id if provided (fixes multi-store cart issue)
      if (store_id) {
        whereClause.store_id = store_id;
      }

      if (Object.keys(whereClause).length > 0) {
        cart = await Cart.findOne({ where: whereClause });
        if (cart) {
          console.log('🔄 Cart GET: Found cart via simple query', {
            cartId: cart.id,
            user_id: cart.user_id,
            session_id: cart.session_id
          });
        }
      }
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
    } else {
      // Additional debug: directly query from DB to ensure we're getting latest data
      try {
        const freshCart = await Cart.findByPk(cart.id);
      } catch (debugError) {
        console.error('Cart GET - Debug query failed:', debugError);
      }
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

    // Ensure clean response structure - extract dataValues if it's a Sequelize instance
    const cleanCart = cart.dataValues || cart;

    res.json({
      success: true,
      data: {
        ...cleanCart,
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
    const { session_id, store_id, items, user_id, product_id, quantity, price, selected_attributes, selected_options } = req.body;

    if ((!session_id && !user_id) || !store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id and either session_id or user_id are required'
      });
    }

    // Build where clause to find existing cart - CRITICAL: include store_id
    const whereClause = {};
    if (user_id) {
      whereClause.user_id = user_id;
    } else {
      whereClause.session_id = session_id;
    }

    // CRITICAL: Always filter by store_id to prevent mixing carts from different stores
    whereClause.store_id = store_id;

    let cart = await Cart.findOne({ where: whereClause });

    let cartItems = [];

    if (cart) {
      // Get existing items
      cartItems = Array.isArray(cart.items) ? cart.items : [];
    }

    // If individual item fields are provided, add as new item
    if (product_id && quantity) {
      // Validate product stock before adding to cart
      const product = await Product.findByPk(product_id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if product is out of stock
      if (isProductOutOfStock(product)) {
        return res.status(400).json({
          success: false,
          message: 'This product is currently out of stock',
          outOfStock: true
        });
      }

      const requestedQty = parseInt(quantity) || 1;
      const availableQty = getAvailableQuantity(product);

      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(item =>
        item.product_id === product_id &&
        JSON.stringify(item.selected_options) === JSON.stringify(selected_options)
      );

      // Calculate total quantity (existing + new)
      const existingQty = existingItemIndex >= 0 ? cartItems[existingItemIndex].quantity : 0;
      const totalQty = existingQty + requestedQty;

      // Check if total quantity exceeds available stock
      if (availableQty !== Infinity && totalQty > availableQty) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableQty} items available in stock. You currently have ${existingQty} in cart.`,
          insufficientStock: true,
          availableQuantity: availableQty,
          currentCartQuantity: existingQty
        });
      }

      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product_id,
        quantity: requestedQty,
        price: parseFloat(price) || 0,
        selected_attributes: selected_attributes || {},
        selected_options: selected_options || []
      };

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        cartItems[existingItemIndex].quantity += newItem.quantity;
      } else {
        // Add new item
        cartItems.push(newItem);
      }
    } else if (items !== undefined && !product_id) {
      // Only use provided items array if no individual product is being added
      cartItems = Array.isArray(items) ? items : [];
    }

    if (cart) {
      // Update existing cart - use changed() to force JSON column update
      cart.items = cartItems;
      cart.user_id = user_id || cart.user_id;
      cart.store_id = store_id || cart.store_id;
      cart.changed('items', true); // Force Sequelize to recognize JSON change
      await cart.save();
      await cart.reload();
    } else {
      // Create new cart with upsert to handle race conditions
      try {
        cart = await Cart.create({
          session_id,
          store_id,
          user_id,
          items: cartItems
        });
      } catch (createError) {
        // Handle duplicate session_id error by fetching the existing cart
        if (createError.name === 'SequelizeUniqueConstraintError' && createError.fields?.session_id) {
          cart = await Cart.findOne({ where: { session_id } });
          if (cart) {
            // Update the existing cart
            cart.items = cartItems;
            cart.user_id = user_id || cart.user_id;
            cart.store_id = store_id || cart.store_id;
            cart.changed('items', true);
            await cart.save();
            await cart.reload();
          } else {
            // If still not found, re-throw the error
            throw createError;
          }
        } else {
          // Re-throw other errors
          throw createError;
        }
      }
    }

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

module.exports = router;