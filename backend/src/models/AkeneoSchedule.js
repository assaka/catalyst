const { DataTypes } = require('sequelize');
const { masterSequelize } = require('../database/masterConnection');

const AkeneoSchedule = masterSequelize.define('AkeneoSchedule', {
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
    type: DataTypes.ENUM('once', 'hourly', 'daily', 'weekly', 'monthly'),
    allowNull: false,
    defaultValue: 'once'
  },
  schedule_time: {
    type: DataTypes.STRING, // Format: ":MM" for hourly, "HH:MM" for daily, "MON-09:00" for weekly, "1-09:00" for monthly
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
  },
  credit_cost: {
    type: DataTypes.DECIMAL(5, 3),
    allowNull: false,
    defaultValue: 0.1,
    comment: 'Cost in credits per execution'
  },
  last_credit_usage: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'credit_usage',
      key: 'id'
    },
    comment: 'Reference to the last credit usage record'
  }
}, {
  tableName: 'akeneo_schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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

// Class methods for credit management
AkeneoSchedule.prototype.checkCreditsBeforeExecution = async function(userId) {
  const CreditService = require('../services/credit-service');
  const requiredCredits = parseFloat(this.credit_cost) || 0.1;

  return await CreditService.hasEnoughCredits(userId, this.store_id, requiredCredits);
};

AkeneoSchedule.prototype.deductCreditsForExecution = async function(userId) {
  const CreditService = require('../services/credit-service');

  const requiredCredits = parseFloat(this.credit_cost) || 0.1;

  try {
    // Use credit-service to deduct credits (handles users.credits update and usage logging)
    const result = await CreditService.deduct(
      userId,
      this.store_id,
      requiredCredits,
      `Akeneo scheduled ${this.import_type} import`,
      {
        import_type: this.import_type,
        schedule_type: this.schedule_type,
        filters: this.filters,
        options: this.options
      },
      this.id,
      'akeneo_schedule'
    );

    // Update the schedule with the credit usage reference
    await this.update({
      last_credit_usage: result.usage_id
    });

    return {
      success: true,
      usage_id: result.usage_id,
      credits_deducted: requiredCredits
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

AkeneoSchedule.getSchedulesNeedingCredits = async function(userId, storeId) {
  const CreditService = require('../services/credit-service');
  const currentBalance = await CreditService.getBalance(userId, storeId);

  // Get active schedules for the store
  const activeSchedules = await this.findAll({
    where: {
      store_id: storeId,
      is_active: true
    }
  });

  // Filter schedules that can't run due to insufficient credits
  const schedulesNeedingCredits = activeSchedules.filter(schedule => {
    const requiredCredits = parseFloat(schedule.credit_cost) || 0.1;
    return currentBalance < requiredCredits;
  });

  return {
    current_balance: currentBalance,
    active_schedules: activeSchedules.length,
    schedules_needing_credits: schedulesNeedingCredits.length,
    schedules: schedulesNeedingCredits
  };
};

module.exports = AkeneoSchedule;
