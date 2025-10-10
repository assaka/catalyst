const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  parent_product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  variant_product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  attribute_values: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'JSON object mapping attribute codes to values for this variant (e.g., {"color": "red", "size": "M"})'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'product_variants',
  indexes: [
    {
      unique: true,
      fields: ['parent_product_id', 'variant_product_id']
    },
    {
      fields: ['parent_product_id']
    },
    {
      fields: ['variant_product_id']
    }
  ]
});

module.exports = ProductVariant;
