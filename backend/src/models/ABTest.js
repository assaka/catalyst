/**
 * A/B Test Model
 * Manages experiments and variant testing
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ABTest = sequelize.define('ABTest', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hypothesis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'running', 'paused', 'completed', 'archived'),
    defaultValue: 'draft'
  },
  variants: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of variant objects: [{id, name, description, weight, config}]'
  },
  traffic_allocation: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    validate: {
      min: 0.0,
      max: 1.0
    },
    comment: 'Percentage of traffic to include in test (0.0 to 1.0)'
  },
  targeting_rules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Rules for including users: {devices, locations, segments, etc.}'
  },
  primary_metric: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Primary success metric (conversion_rate, revenue, etc.)'
  },
  secondary_metrics: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Additional metrics to track'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  min_sample_size: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: 'Minimum participants per variant before results are significant'
  },
  confidence_level: {
    type: DataTypes.FLOAT,
    defaultValue: 0.95,
    comment: 'Required statistical confidence (0.95 = 95%)'
  },
  winner_variant_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID of winning variant (when test completes)'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'ab_tests',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['status'] },
    { fields: ['start_date'] },
    { fields: ['end_date'] }
  ]
});

module.exports = ABTest;
