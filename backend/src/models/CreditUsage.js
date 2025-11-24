const { DataTypes, Op } = require('sequelize');
const { masterSequelize } = require('../database/masterConnection');

const CreditUsage = masterSequelize.define('CreditUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
  credits_used: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.001 // Minimum 0.001 credits
    }
  },
  usage_type: {
    type: DataTypes.ENUM('akeneo_schedule', 'akeneo_manual', 'other'),
    allowNull: false
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'credit_usage',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'store_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['reference_id', 'reference_type']
    },
    {
      fields: ['usage_type']
    }
  ]
  // Note: Hooks removed - credit balance updates now handled by credit-service.js
  // which updates users.credits (single source of truth) when usage is recorded
});

// Class methods for credit usage tracking
CreditUsage.recordAkeneoScheduleUsage = async function(userId, storeId, scheduleId, creditsUsed = 0.1, metadata = {}) {
  return await this.create({
    user_id: userId,
    store_id: storeId,
    credits_used: creditsUsed,
    usage_type: 'akeneo_schedule',
    reference_id: scheduleId,
    reference_type: 'akeneo_schedule',
    description: `Akeneo scheduled import execution (${creditsUsed} credits)`,
    metadata: {
      schedule_id: scheduleId,
      execution_time: new Date().toISOString(),
      ...metadata
    }
  });
};

CreditUsage.recordAkeneoManualUsage = async function(userId, storeId, importType, creditsUsed = 0.1, metadata = {}) {
  return await this.create({
    user_id: userId,
    store_id: storeId,
    credits_used: creditsUsed,
    usage_type: 'akeneo_manual',
    reference_type: 'manual_import',
    description: `Manual Akeneo ${importType} import (${creditsUsed} credits)`,
    metadata: {
      import_type: importType,
      execution_time: new Date().toISOString(),
      ...metadata
    }
  });
};

CreditUsage.getUsageHistory = async function(userId, storeId = null, limit = 100, usageType = null) {
  const where = { user_id: userId };
  if (storeId) {
    where.store_id = storeId;
  }
  if (usageType) {
    where.usage_type = usageType;
  }

  return await this.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit
  });
};

CreditUsage.getUsageStats = async function(userId, storeId, startDate = null, endDate = null) {
  const where = { user_id: userId, store_id: storeId };

  if (startDate) {
    where.created_at = where.created_at || {};
    where.created_at[Op.gte] = startDate;
  }

  if (endDate) {
    where.created_at = where.created_at || {};
    where.created_at[Op.lte] = endDate;
  }

  const stats = await this.findAll({
    where,
    attributes: [
      'usage_type',
      [masterSequelize.fn('COUNT', masterSequelize.col('id')), 'usage_count'],
      [masterSequelize.fn('SUM', masterSequelize.col('credits_used')), 'total_credits_used'],
      [masterSequelize.fn('AVG', masterSequelize.col('credits_used')), 'avg_credits_per_usage']
    ],
    group: ['usage_type']
  });

  return stats.reduce((acc, stat) => {
    acc[stat.usage_type] = {
      usage_count: parseInt(stat.get('usage_count')),
      total_credits_used: parseFloat(stat.get('total_credits_used')),
      avg_credits_per_usage: parseFloat(stat.get('avg_credits_per_usage'))
    };
    return acc;
  }, {});
};

module.exports = CreditUsage;
