const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ProductSeo = sequelize.define('ProductSeo', {
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'languages',
      key: 'code'
    }
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_keywords: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  meta_robots_tag: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'index, follow'
  },
  og_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  og_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  og_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  twitter_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  twitter_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  twitter_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  canonical_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'product_seo',
  underscored: true
});

module.exports = ProductSeo;
