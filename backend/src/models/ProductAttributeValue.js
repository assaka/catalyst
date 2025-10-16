const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ProductAttributeValue = sequelize.define('ProductAttributeValue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  attribute_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'attributes',
      key: 'id'
    }
  },
  value_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'attribute_values',
      key: 'id'
    },
    comment: 'For select/multiselect attributes'
  },
  text_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'For text attributes'
  },
  number_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'For number attributes'
  },
  date_value: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'For date attributes'
  },
  boolean_value: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'For boolean attributes'
  }
}, {
  tableName: 'product_attribute_values',
  underscored: true,
  indexes: [
    {
      fields: ['product_id']
    },
    {
      fields: ['attribute_id']
    },
    {
      fields: ['value_id']
    }
  ]
});

module.exports = ProductAttributeValue;
