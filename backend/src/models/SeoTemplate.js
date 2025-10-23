const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SeoTemplate = sequelize.define('SeoTemplate', {
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
  type: {
    type: DataTypes.ENUM('product', 'category', 'cms', 'brand'),
    allowNull: false
  },
  meta_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_keywords: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  og_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  og_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  conditions: {
    type: DataTypes.JSON,
    defaultValue: {
      categories: [],
      attribute_sets: []
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'seo_templates',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'name']
    }
  ]
});

module.exports = SeoTemplate;