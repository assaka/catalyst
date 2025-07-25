const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ConsentLog = sequelize.define('ConsentLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consent_given: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  categories_accepted: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  country_code: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  consent_method: {
    type: DataTypes.ENUM('accept_all', 'reject_all', 'custom'),
    allowNull: false
  },
  page_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'consent_logs',
  timestamps: false
});

module.exports = ConsentLog;