const { DataTypes } = require('sequelize');
const { masterSequelize } = require('../database/masterConnection');

const CreditTransaction = masterSequelize.define('CreditTransaction', {
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
  transaction_type: {
    type: DataTypes.ENUM('purchase', 'bonus', 'refund'),
    allowNull: false
  },
  amount_usd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  credits_purchased: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  stripe_payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stripe_charge_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'credit_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['stripe_payment_intent_id']
    }
  ]
});

// Class methods for credit transaction management
CreditTransaction.createPurchase = async function(userId, storeId, amountUsd, creditsAmount, paymentIntentId = null) {
  return await this.create({
    user_id: userId,
    store_id: storeId,
    transaction_type: 'purchase',
    amount_usd: amountUsd,
    credits_purchased: creditsAmount,
    stripe_payment_intent_id: paymentIntentId,
    status: 'pending'
  });
};

CreditTransaction.createBonus = async function(userId, storeId, creditsAmount, description = null) {
  return await this.create({
    user_id: userId,
    store_id: storeId,
    transaction_type: 'bonus',
    amount_usd: 0.00,
    credits_purchased: creditsAmount,
    status: 'completed',
    metadata: { description: description || 'Bonus credits' }
  });
};

CreditTransaction.markCompleted = async function(transactionId, stripeChargeId = null) {
  const transaction = await this.findByPk(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const updateData = { status: 'completed' };
  if (stripeChargeId) {
    updateData.stripe_charge_id = stripeChargeId;
  }

  await transaction.update(updateData);
  return transaction;
};

CreditTransaction.markFailed = async function(transactionId, reason = null) {
  const transaction = await this.findByPk(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  await transaction.update({
    status: 'failed',
    metadata: {
      ...transaction.metadata,
      failure_reason: reason
    }
  });

  return transaction;
};

CreditTransaction.getUserTransactions = async function(userId, storeId = null, limit = 50) {
  const where = { user_id: userId };
  if (storeId) {
    where.store_id = storeId;
  }

  return await this.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit
  });
};

module.exports = CreditTransaction;
