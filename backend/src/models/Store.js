const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  owner_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  banner_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  theme_color: {
    type: DataTypes.STRING,
    defaultValue: '#3B82F6'
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  // Contact information
  contact_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Address
  address_line1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address_line2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postal_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Social media
  website_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  facebook_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitter_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  instagram_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // SEO
  meta_title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meta_keywords: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'stores',
  hooks: {
    beforeCreate: (store) => {
      if (!store.slug && store.name) {
        store.slug = store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    },
    beforeUpdate: (store) => {
      if (store.changed('name') && !store.changed('slug')) {
        store.slug = store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    }
  }
});

module.exports = Store;