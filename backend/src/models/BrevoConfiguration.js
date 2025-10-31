const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const BrevoConfiguration = sequelize.define('BrevoConfiguration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Encrypted OAuth access token from Brevo'
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Encrypted OAuth refresh token for token renewal'
  },
  token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sender_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  sender_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'brevo_configurations',
  indexes: [
    {
      unique: true,
      fields: ['store_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = BrevoConfiguration;
