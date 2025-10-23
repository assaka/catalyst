const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CanonicalUrl = sequelize.define('CanonicalUrl', {
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
  page_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'The page URL (source) that needs a custom canonical URL'
  },
  canonical_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'The canonical URL (target) that should be used'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional notes about why this canonical URL was created'
  }
}, {
  tableName: 'canonical_urls',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'page_url']
    }
  ]
});

// Define associations
CanonicalUrl.associate = (models) => {
  CanonicalUrl.belongsTo(models.Store, {
    foreignKey: 'store_id',
    as: 'store'
  });

  CanonicalUrl.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = CanonicalUrl;
