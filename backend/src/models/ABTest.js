/**
 * A/B Test Model
 * Manages experiments and variant testing
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

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

// Static Methods

/**
 * Find all tests for a store with optional status filter
 */
ABTest.findByStore = async function(storeId, status = null) {
  const where = { store_id: storeId };
  if (status) {
    where.status = status;
  }
  return this.findAll({
    where,
    order: [['created_at', 'DESC']]
  });
};

/**
 * Find all running tests for a store
 */
ABTest.findRunning = async function(storeId) {
  const now = new Date();
  return this.findAll({
    where: {
      store_id: storeId,
      status: 'running',
      start_date: { [require('sequelize').Op.lte]: now },
      [require('sequelize').Op.or]: [
        { end_date: null },
        { end_date: { [require('sequelize').Op.gte]: now } }
      ]
    }
  });
};

/**
 * Find active tests that apply to a specific page type
 */
ABTest.findActiveForPage = async function(storeId, pageType) {
  const runningTests = await this.findRunning(storeId);
  return runningTests.filter(test => {
    const targetingRules = test.targeting_rules || {};
    const pages = targetingRules.pages || [];
    return pages.length === 0 || pages.includes(pageType);
  });
};

/**
 * Start a test (transition from draft to running)
 */
ABTest.prototype.start = async function() {
  if (this.status !== 'draft' && this.status !== 'paused') {
    throw new Error(`Cannot start test with status: ${this.status}`);
  }
  this.status = 'running';
  this.start_date = this.start_date || new Date();
  return this.save();
};

/**
 * Pause a running test
 */
ABTest.prototype.pause = async function() {
  if (this.status !== 'running') {
    throw new Error(`Cannot pause test with status: ${this.status}`);
  }
  this.status = 'paused';
  return this.save();
};

/**
 * Complete a test and optionally declare a winner
 */
ABTest.prototype.complete = async function(winnerVariantId = null) {
  if (this.status !== 'running' && this.status !== 'paused') {
    throw new Error(`Cannot complete test with status: ${this.status}`);
  }
  this.status = 'completed';
  this.end_date = this.end_date || new Date();
  if (winnerVariantId) {
    this.winner_variant_id = winnerVariantId;
  }
  return this.save();
};

/**
 * Archive a test
 */
ABTest.prototype.archive = async function() {
  this.status = 'archived';
  return this.save();
};

/**
 * Get variant by ID from this test
 */
ABTest.prototype.getVariant = function(variantId) {
  return this.variants.find(v => v.id === variantId);
};

/**
 * Get control variant
 */
ABTest.prototype.getControlVariant = function() {
  return this.variants.find(v => v.is_control === true) || this.variants[0];
};

/**
 * Check if test is currently active
 */
ABTest.prototype.isActive = function() {
  if (this.status !== 'running') return false;

  const now = new Date();
  if (this.start_date && this.start_date > now) return false;
  if (this.end_date && this.end_date < now) return false;

  return true;
};

module.exports = ABTest;
