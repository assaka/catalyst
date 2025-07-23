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
  page_type: {
    type: DataTypes.ENUM('home', 'product', 'category', 'cms', 'search', 'cart', 'checkout'),
    allowNull: false
  },
  title_template: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description_template: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keywords_template: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  og_title_template: {
    type: DataTypes.STRING,
    allowNull: true
  },
  og_description_template: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  twitter_title_template: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitter_description_template: {
    type: DataTypes.TEXT,
    allowNull: true
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
      fields: ['store_id', 'page_type']
    }
  ]
});

module.exports = SeoTemplate;