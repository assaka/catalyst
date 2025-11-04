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

    // Enhance customer data with addresses
    const { Order, Address } = require('../models');
    const enhancedCustomers = await Promise.all(customers.rows.map(async (customer) => {
      const customerData = customer.toJSON();

      // For registered customers, fetch from addresses table
      if (customer.customer_type === 'registered') {
        const addresses = await Address.findAll({
          where: { customer_id: customer.id }
        });

        if (addresses.length > 0) {
          const shippingAddr = addresses.find(a => a.type === 'shipping' || a.type === 'both');
          const billingAddr = addresses.find(a => a.type === 'billing' || a.type === 'both');

          customerData.address_data = {
            shipping_address: shippingAddr ? {
              street: shippingAddr.street,
              city: shippingAddr.city,
              state: shippingAddr.state,
              postal_code: shippingAddr.postal_code,
              country: shippingAddr.country
            } : null,
            billing_address: billingAddr ? {
              street: billingAddr.street,
              city: billingAddr.city,
              state: billingAddr.state,
              postal_code: billingAddr.postal_code,
              country: billingAddr.country
            } : null
          };
        }
      } else {
        // For guest customers (no password), fetch address from last order
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

    // Extract address_data before updating customer
    const { address_data, ...customerData } = req.body;

    // Update customer basic info
    await customer.update(customerData);

    // Handle address updates for registered customers only
    if (address_data && customer.customer_type === 'registered') {
      const { Address } = require('../models');

      // Update or create shipping address
      if (address_data.shipping_address) {
        const existingShipping = await Address.findOne({
          where: { customer_id: customer.id, type: 'shipping' }
        });

        if (existingShipping) {
          await existingShipping.update({
            ...address_data.shipping_address,
            full_name: `${customer.first_name} ${customer.last_name}`
          });
        } else {
          await Address.create({
            customer_id: customer.id,
            type: 'shipping',
            full_name: `${customer.first_name} ${customer.last_name}`,
            ...address_data.shipping_address
          });
        }
      }

      // Update or create billing address if provided
      if (address_data.billing_address) {
        const existingBilling = await Address.findOne({
          where: { customer_id: customer.id, type: 'billing' }
        });

        if (existingBilling) {
          await existingBilling.update({
            ...address_data.billing_address,
            full_name: `${customer.first_name} ${customer.last_name}`
          });
        } else {
          await Address.create({
            customer_id: customer.id,
            type: 'billing',
            full_name: `${customer.first_name} ${customer.last_name}`,
            ...address_data.billing_address
          });
        }
      }
    }

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

// @route   PUT /api/customers/:id/blacklist
// @desc    Blacklist or un-blacklist a customer
// @access  Private (Store Owner Only)
router.put('/:id/blacklist', storeOwnerOnly, async (req, res) => {
  try {
    const { is_blacklisted, blacklist_reason } = req.body;
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Verify customer belongs to the store
    const { store_id } = req.query;
    if (customer.store_id !== parseInt(store_id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer belongs to a different store.'
      });
    }

    // Update blacklist status
    await customer.update({
      is_blacklisted: is_blacklisted,
      blacklist_reason: is_blacklisted ? blacklist_reason : null,
      blacklisted_at: is_blacklisted ? new Date() : null
    });

    // Reload to get fresh data
    await customer.reload();

    res.json({
      success: true,
      data: customer,
      message: is_blacklisted ? 'Customer blacklisted successfully' : 'Customer removed from blacklist successfully'
    });
  } catch (error) {
    console.error('Blacklist customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;