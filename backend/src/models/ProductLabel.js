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
    type: DataTypes.ENUM('top-left', 'top-right', 'top-center', 'center-left', 'center-right', 'bottom-left', 'bottom-right', 'bottom-center'),
    defaultValue: 'top-right'
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
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  translations: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Multilingual translations: {"en": {"text": "..."}, "nl": {...}}'
  }
}, {
  tableName: 'product_labels',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'slug']
    }
  ],
  hooks: {
    beforeCreate: (label) => {
      console.log('🔍 ProductLabel beforeCreate hook - label data:', {
        name: label.name,
        slug: label.slug,
        text: label.text
      });
      if (!label.slug && label.name) {
        label.slug = label.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        console.log('✅ Generated slug:', label.slug);
      } else {
        console.log('❌ Slug not generated - slug exists or name missing');
      }
    },
    beforeUpdate: (label) => {
      console.log('🔍 ProductLabel beforeUpdate hook - label data:', {
        name: label.name,
        slug: label.slug,
        changed_name: label.changed('name'),
        changed_slug: label.changed('slug')
      });
      if (label.changed('name') && !label.changed('slug')) {
        label.slug = label.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        console.log('✅ Updated slug:', label.slug);
      }
    }
  }
});

module.exports = ProductLabel;