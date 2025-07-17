const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const DeliverySettings = sequelize.define('DeliverySettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  enable_delivery_date: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  enable_comments: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  offset_days: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  max_advance_days: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  blocked_dates: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  blocked_weekdays: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  out_of_office_start: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  out_of_office_end: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  delivery_time_slots: {
    type: DataTypes.JSON,
    defaultValue: [
      { start_time: '09:00', end_time: '12:00', is_active: true },
      { start_time: '13:00', end_time: '17:00', is_active: true }
    ]
  },
  // Foreign keys
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  }
}, {
  tableName: 'delivery_settings'
});

module.exports = DeliverySettings;