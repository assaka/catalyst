const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Subscription = sequelize.define('Subscription', {
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
  plan_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['free', 'starter', 'professional', 'enterprise']]
    }
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'trial',
    validate: {
      isIn: [['active', 'trial', 'cancelled', 'expired', 'suspended']]
    }
  },
  price_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  price_annual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  billing_cycle: {
    type: DataTypes.STRING(20),
    defaultValue: 'monthly',
    validate: {
      isIn: [['monthly', 'annual']]
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  // Resource limits
  max_products: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  max_orders_per_month: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  max_storage_gb: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  max_api_calls_per_month: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  max_admin_users: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  // Dates
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  trial_ends_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  current_period_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'subscriptions',
  indexes: [
    { fields: ['store_id'] },
    { fields: ['status'] }
  ]
});

// Instance methods
Subscription.prototype.isActive = function() {
  return this.status === 'active';
};

Subscription.prototype.isInTrial = function() {
  return this.status === 'trial' && this.trial_ends_at && new Date() < new Date(this.trial_ends_at);
};

Subscription.prototype.hasExpired = function() {
  return this.status === 'expired' || (this.current_period_end && new Date() > new Date(this.current_period_end));
};

Subscription.prototype.canUpgrade = function() {
  const planOrder = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(this.plan_name);
  return currentIndex < planOrder.length - 1;
};

Subscription.prototype.getNextPlan = function() {
  const planOrder = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(this.plan_name);
  return planOrder[currentIndex + 1] || null;
};

module.exports = Subscription;
