const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AkeneoSchedule = sequelize.define('AkeneoSchedule', {
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
  import_type: {
    type: DataTypes.ENUM('attributes', 'families', 'categories', 'products', 'all'),
    allowNull: false
  },
  schedule_type: {
    type: DataTypes.ENUM('once', 'daily', 'weekly', 'monthly'),
    allowNull: false,
    defaultValue: 'once'
  },
  schedule_time: {
    type: DataTypes.STRING, // Format: "HH:MM" for daily, "MON-09:00" for weekly, "1-09:00" for monthly
    allowNull: true
  },
  schedule_date: {
    type: DataTypes.DATE, // For one-time schedules
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_run: {
    type: DataTypes.DATE,
    allowNull: true
  },
  next_run: {
    type: DataTypes.DATE,
    allowNull: true
  },
  filters: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Filters for the import: {channels: [], families: [], attributes: {}, categories: []}'
  },
  options: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Import options: {locale: "en_US", dryRun: false, batchSize: 50}'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'running', 'completed', 'failed', 'paused'),
    defaultValue: 'scheduled'
  },
  last_result: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Result of last execution'
  }
}, {
  tableName: 'akeneo_schedules',
  indexes: [
    {
      fields: ['store_id']
    },
    {
      fields: ['next_run']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = AkeneoSchedule;