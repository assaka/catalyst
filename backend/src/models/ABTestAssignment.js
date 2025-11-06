/**
 * A/B Test Assignment Model
 * Tracks user/session assignments to test variants
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ABTestAssignment = sequelize.define('ABTestAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  test_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ab_tests',
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
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Session ID for anonymous users'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User ID for logged-in users'
  },
  variant_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ID of assigned variant'
  },
  variant_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  converted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this user achieved the primary metric'
  },
  converted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  conversion_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Value of conversion (e.g., order total)'
  },
  metrics: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Custom metrics tracked for this assignment'
  },
  device_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'ab_test_assignments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['test_id'] },
    { fields: ['store_id'] },
    { fields: ['session_id'] },
    { fields: ['user_id'] },
    { fields: ['variant_id'] },
    { fields: ['converted'] },
    { fields: ['assigned_at'] },
    { unique: true, fields: ['test_id', 'session_id'], name: 'unique_test_session' }
  ]
});

/**
 * Mark assignment as converted
 */
ABTestAssignment.prototype.markConverted = async function(value = null) {
  this.converted = true;
  this.converted_at = new Date();
  if (value !== null) {
    this.conversion_value = value;
  }
  return this.save();
};

/**
 * Update metrics for this assignment
 */
ABTestAssignment.prototype.updateMetrics = async function(metrics) {
  this.metrics = {
    ...this.metrics,
    ...metrics
  };
  return this.save();
};

module.exports = ABTestAssignment;
