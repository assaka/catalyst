const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ProductLabel = sequelize.define('ProductLabel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#000000'
  },
  background_color: {
    type: DataTypes.STRING,
    defaultValue: '#FFFFFF'
  },
  position: {
    type: DataTypes.ENUM('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'),
    defaultValue: 'top-left'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  conditions: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'product_labels',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'slug']
    }
  ]
});

module.exports = ProductLabel;