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
  tab_type: {
    type: DataTypes.ENUM('text', 'description', 'attributes', 'attribute_sets'),
    defaultValue: 'text',
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attribute_ids: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  attribute_set_ids: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
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
      // Always generate slug if not provided
      if (!tab.slug && tab.name) {
        tab.slug = tab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      // Fallback: if still no slug, generate one from tab type
      if (!tab.slug) {
        tab.slug = `${tab.tab_type || 'tab'}-${Date.now()}`;
      }
    },
    beforeUpdate: (tab) => {
      if (tab.changed('name') && !tab.changed('slug')) {
        tab.slug = tab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      // Ensure slug is never null
      if (!tab.slug) {
        tab.slug = `${tab.tab_type || 'tab'}-${Date.now()}`;
      }
    },
    beforeValidate: (tab) => {
      // Final safety check before validation
      if (!tab.slug && tab.name) {
        tab.slug = tab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      if (!tab.slug) {
        tab.slug = `${tab.tab_type || 'tab'}-${Date.now()}`;
      }
    }
  }
});

module.exports = ProductTab;