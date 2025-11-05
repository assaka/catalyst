const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  // Product information (snapshot at time of order)
  product_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  product_sku: {
    type: DataTypes.STRING,
    allowNull: false
  },
  product_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  product_attributes: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  selected_options: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Price before any discounts'
  },
  // Foreign keys
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'sales_orders',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  }
}, {
  tableName: 'order_items',
  hooks: {
    afterCreate: async (orderItem) => {
      // Reduce product stock when an order item is created
      try {
        const Product = require('./Product');

        // Helper function to reduce stock for a single product
        const reduceProductStock = async (productId, quantity, productLabel = 'product') => {
          const product = await Product.findByPk(productId);

          if (!product) {
            console.warn(`${productLabel} ${productId} not found for stock deduction`);
            return;
          }

          // Only reduce stock if stock management is enabled and infinite stock is disabled
          if (product.manage_stock && !product.infinite_stock) {
            const newStockQuantity = product.stock_quantity - quantity;

            // Prevent negative stock unless backorders are allowed
            if (newStockQuantity < 0 && !product.allow_backorders) {
              console.warn(`Insufficient stock for ${productLabel} ${product.sku}: requested ${quantity}, available ${product.stock_quantity}`);
              // Still create the order item but log the warning
              // In a production system, you might want to handle this differently
            }

            await product.update({
              stock_quantity: Math.max(0, newStockQuantity),
              purchase_count: product.purchase_count + 1
            });

            console.log(`✅ Stock reduced for ${productLabel} ${product.sku}: ${product.stock_quantity} -> ${newStockQuantity}`);
          } else if (product.infinite_stock) {
            // Still update purchase count for infinite stock products
            await product.update({
              purchase_count: product.purchase_count + 1
            });
            console.log(`✅ Purchase count updated for infinite stock ${productLabel} ${product.sku}`);
          }
        };

        // Reduce stock for the main product
        await reduceProductStock(orderItem.product_id, orderItem.quantity, 'main product');

        // Reduce stock for custom option products (if any)
        if (orderItem.selected_options && Array.isArray(orderItem.selected_options)) {
          for (const option of orderItem.selected_options) {
            if (option.product_id) {
              // Custom options use the same quantity as the parent product
              await reduceProductStock(option.product_id, orderItem.quantity, 'custom option');
            }
          }
        }
      } catch (error) {
        console.error('Error reducing stock for order item:', error);
        // Don't fail the order item creation if stock reduction fails
      }
    }
  }
});

module.exports = OrderItem;