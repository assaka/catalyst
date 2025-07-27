const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ProductTab = sequelize.define('ProductTab', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'product_tabs',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'slug']
    }
  ],
  hooks: {
    beforeCreate: (tab) => {
      if (!tab.slug && tab.name) {
        tab.slug = tab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    },
    beforeUpdate: (tab) => {
      if (tab.changed('name') && !tab.changed('slug')) {
        tab.slug = tab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    }
  }
});

module.exports = ProductTab;