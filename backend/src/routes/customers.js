const express = require('express');
const { Customer } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { storeOwnerOnly } = require('../middleware/auth');
const { enforceCustomerStoreBinding } = require('../middleware/customerStoreAuth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/customers
// @desc    Get all customers for a store
// @access  Private
router.get('/', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id, page = 1, limit = 20, search, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const offset = (page - 1) * limit;
    const whereClause = { store_id };

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const customers = await Customer.findAndCountAll({
      where: whereClause,
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Enhance customer data with last order addresses for guest customers
    const { Order } = require('../models');
    const enhancedCustomers = await Promise.all(customers.rows.map(async (customer) => {
      const customerData = customer.toJSON();

      // For guest customers (no password), fetch address from last order
      if (!customer.password) {
        const lastOrder = await Order.findOne({
          where: { customer_id: customer.id },
          order: [['created_at', 'DESC']],
          attributes: ['shipping_address', 'billing_address']
        });

        if (lastOrder) {
          customerData.address_data = {
            shipping_address: lastOrder.shipping_address,
            billing_address: lastOrder.billing_address
          };
        }
      }

      return customerData;
    }));

    res.json({
      success: true,
      data: {
        customers: enhancedCustomers,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(customers.count / limit),
          total_items: customers.count,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer
// @access  Private
router.get('/:id', authMiddleware, enforceCustomerStoreBinding, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // If this is a customer user, ensure they can only view their own profile
    if (req.user.role === 'customer' && customer.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    // If this is a customer user, verify the customer belongs to their store
    if (req.user.role === 'customer' && customer.store_id !== req.customerStoreId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer belongs to a different store.'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customers
// @desc    Create a new customer
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', authMiddleware, enforceCustomerStoreBinding, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // If this is a customer user, ensure they can only update their own profile
    if (req.user.role === 'customer' && customer.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    // If this is a customer user, verify the customer belongs to their store
    if (req.user.role === 'customer' && customer.store_id !== req.customerStoreId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer belongs to a different store.'
      });
    }

    // Prevent customers from changing their store_id
    if (req.user.role === 'customer' && req.body.store_id && req.body.store_id !== customer.store_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customers cannot change their store assignment.'
      });
    }

    await customer.update(req.body);
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.destroy();
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;