const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/auth');
const { storeOwnerOnly } = require('../middleware/auth');
const { enforceCustomerStoreBinding } = require('../middleware/customerStoreAuth');

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
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build base query
    let query = tenantDb
      .from('customers')
      .select('*')
      .eq('store_id', store_id);

    // Add search functionality
    if (search) {
      query = tenantDb
        .from('customers')
        .select('*')
        .eq('store_id', store_id)
        .or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sort_by, { ascending: sort_order.toUpperCase() === 'ASC' })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching customers',
        error: error.message
      });
    }

    // Get total count
    const countQuery = search
      ? tenantDb
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store_id)
          .or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
      : tenantDb
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store_id);

    const { count: totalCount } = await countQuery;

    // Enhance customer data with addresses
    const enhancedCustomers = await Promise.all(customers.map(async (customer) => {
      const customerData = { ...customer };

      // For registered customers, fetch from customer_addresses table
      if (customer.customer_type === 'registered') {
        const { data: addresses } = await tenantDb
          .from('customer_addresses')
          .select('*')
          .eq('customer_id', customer.id);

        if (addresses && addresses.length > 0) {
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
        const { data: lastOrder } = await tenantDb
          .from('sales_orders')
          .select('shipping_address, billing_address')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

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
          total_pages: Math.ceil((totalCount || 0) / limit),
          total_items: totalCount || 0,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer
// @access  Private
router.get('/:id', authMiddleware, enforceCustomerStoreBinding, async (req, res) => {
  try {
    const store_id = req.query.store_id || req.headers['x-store-id'] || req.customerStoreId;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: customer, error } = await tenantDb
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !customer) {
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
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/customers
// @desc    Create a new customer
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { store_id, ...customerData } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: customer, error } = await tenantDb
      .from('customers')
      .insert({
        ...customerData,
        store_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating customer',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', authMiddleware, enforceCustomerStoreBinding, async (req, res) => {
  try {
    const store_id = req.query.store_id || req.headers['x-store-id'] || req.customerStoreId;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if customer exists
    const { data: customer, error: checkError } = await tenantDb
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (checkError || !customer) {
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
    const { address_data, ...updateData } = req.body;

    // Update customer basic info
    const { data: updatedCustomer, error: updateError } = await tenantDb
      .from('customers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating customer:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating customer',
        error: updateError.message
      });
    }

    // Handle address updates for registered customers only
    if (address_data && customer.customer_type === 'registered') {
      // Update or create shipping address
      if (address_data.shipping_address) {
        const { data: existingShipping } = await tenantDb
          .from('customer_addresses')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('type', 'shipping')
          .maybeSingle();

        if (existingShipping) {
          await tenantDb
            .from('customer_addresses')
            .update({
              ...address_data.shipping_address,
              full_name: `${customer.first_name} ${customer.last_name}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingShipping.id);
        } else {
          await tenantDb
            .from('customer_addresses')
            .insert({
              customer_id: customer.id,
              type: 'shipping',
              full_name: `${customer.first_name} ${customer.last_name}`,
              ...address_data.shipping_address,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }

      // Update or create billing address if provided
      if (address_data.billing_address) {
        const { data: existingBilling } = await tenantDb
          .from('customer_addresses')
          .select('*')
          .eq('customer_id', customer.id)
          .eq('type', 'billing')
          .maybeSingle();

        if (existingBilling) {
          await tenantDb
            .from('customer_addresses')
            .update({
              ...address_data.billing_address,
              full_name: `${customer.first_name} ${customer.last_name}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBilling.id);
        } else {
          await tenantDb
            .from('customer_addresses')
            .insert({
              customer_id: customer.id,
              type: 'billing',
              full_name: `${customer.first_name} ${customer.last_name}`,
              ...address_data.billing_address,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }
    }

    res.json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const store_id = req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if customer exists
    const { data: customer, error: checkError } = await tenantDb
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (checkError || !customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const { error } = await tenantDb
      .from('customers')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Error deleting customer:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting customer',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/customers/:id/blacklist
// @desc    Blacklist or un-blacklist a customer
// @access  Private (Store Owner Only)
router.put('/:id/blacklist', storeOwnerOnly, async (req, res) => {
  try {
    const { is_blacklisted, blacklist_reason } = req.body;
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get customer
    const { data: customer, error: checkError } = await tenantDb
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (checkError || !customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Verify customer belongs to the store
    if (customer.store_id !== store_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer belongs to a different store.'
      });
    }

    // Update blacklist status
    const { data: updatedCustomer, error: updateError } = await tenantDb
      .from('customers')
      .update({
        is_blacklisted: is_blacklisted,
        blacklist_reason: is_blacklisted ? blacklist_reason : null,
        blacklisted_at: is_blacklisted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating blacklist status:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating blacklist status',
        error: updateError.message
      });
    }

    // Also add/remove email from blacklist_emails table
    if (is_blacklisted && customer.email) {
      // Add email to blacklist (upsert)
      await tenantDb
        .from('blacklist_emails')
        .upsert({
          store_id: store_id,
          email: customer.email.toLowerCase(),
          reason: blacklist_reason || 'Customer blacklisted',
          created_by: req.user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'store_id,email'
        });
    } else if (!is_blacklisted && customer.email) {
      // Remove email from blacklist
      await tenantDb
        .from('blacklist_emails')
        .delete()
        .eq('store_id', store_id)
        .eq('email', customer.email.toLowerCase());
    }

    res.json({
      success: true,
      data: updatedCustomer,
      message: is_blacklisted ? 'Customer blacklisted successfully' : 'Customer removed from blacklist successfully'
    });
  } catch (error) {
    console.error('Blacklist customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
