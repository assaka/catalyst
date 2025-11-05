const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'partially_paid', 'refunded', 'failed'),
    defaultValue: 'pending'
  },
  fulfillment_status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  // Customer information
  customer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  customer_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Billing address
  billing_address: {
    type: DataTypes.JSON,
    allowNull: false
  },
  // Shipping address
  shipping_address: {
    type: DataTypes.JSON,
    allowNull: false
  },
  // Financial information
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  shipping_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  payment_fee_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USD'
  },
  // Delivery information
  delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivery_time_slot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  delivery_instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Payment information
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Shipping information
  shipping_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Coupon information
  coupon_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Notes
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Email tracking
  confirmation_email_sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when order confirmation email was sent (prevents duplicates)'
  },
  // Foreign keys
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  // Timestamps
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  hooks: {
    beforeCreate: (order) => {
      if (!order.order_number) {
        order.order_number = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      }
    },
    afterCreate: async (order) => {
      // If this is a guest order (no customer_id), create a customer record
      if (!order.customer_id && order.customer_email && order.store_id) {
        try {
          const Customer = require('./Customer');
          
          // Parse name from billing/shipping address - try multiple field name variations
          let firstName = 'Guest';
          let lastName = 'Customer';

          // Try to get full name from various field names
          const fullName = order.billing_address?.full_name ||
                          order.billing_address?.name ||
                          order.shipping_address?.full_name ||
                          order.shipping_address?.name ||
                          '';

          if (fullName && fullName.trim()) {
            const nameParts = fullName.trim().split(' ');
            if (nameParts.length > 0) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ') || 'Customer';
            }
          }

          console.log('📝 Creating/updating customer with name:', firstName, lastName, 'from full_name:', fullName);
          
          // Check if customer already exists
          const existingCustomer = await Customer.findOne({
            where: {
              store_id: order.store_id,
              email: order.customer_email
            }
          });
          
          if (!existingCustomer) {
            // Create new customer record with placeholder password for guest customers
            // Guest customers can set a real password later if they create an account
            const newCustomer = await Customer.create({
              store_id: order.store_id,
              email: order.customer_email,
              password: null, // Will be set when/if they create an account
              first_name: firstName,
              last_name: lastName,
              phone: order.customer_phone,
              total_spent: order.total_amount || 0,
              total_orders: 1,
              last_order_date: new Date(),
              notes: 'Auto-created from guest order'
            });
            
            // Update the order with the new customer_id
            await order.update({ customer_id: newCustomer.id });
          } else {
            // Update existing customer stats
            const newTotalSpent = parseFloat(existingCustomer.total_spent || 0) + parseFloat(order.total_amount || 0);
            const newTotalOrders = (existingCustomer.total_orders || 0) + 1;
            
            await existingCustomer.update({
              total_spent: newTotalSpent,
              total_orders: newTotalOrders,
              last_order_date: new Date()
            });
            
            // Update the order with the existing customer_id
            await order.update({ customer_id: existingCustomer.id });
          }
        } catch (error) {
          console.error('Error creating/updating customer for order:', error);
          // Don't fail the order creation if customer creation fails
        }
      }
    }
  }
});

module.exports = Order;