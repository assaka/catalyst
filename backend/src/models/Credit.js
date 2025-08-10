const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Credit = sequelize.define('Credit', {
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
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  total_purchased: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  total_used: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  tableName: 'credits',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'store_id']
    }
  ]
});

// Class methods
Credit.getBalance = async function(userId, storeId) {
  const credit = await this.findOne({
    where: { user_id: userId, store_id: storeId }
  });
  
  return credit ? parseFloat(credit.balance) : 0.00;
};

Credit.hasEnoughCredits = async function(userId, storeId, requiredCredits) {
  const balance = await this.getBalance(userId, storeId);
  return balance >= requiredCredits;
};

Credit.deductCredits = async function(userId, storeId, creditsToDeduct, usageType, referenceId = null, referenceType = null, description = null) {
  // Check if user has enough credits
  const hasEnough = await this.hasEnoughCredits(userId, storeId, creditsToDeduct);
  if (!hasEnough) {
    throw new Error(`Insufficient credits. Required: ${creditsToDeduct}, Available: ${await this.getBalance(userId, storeId)}`);
  }

  // Record the usage - the trigger will automatically update the balance
  const CreditUsage = require('./CreditUsage');
  const usage = await CreditUsage.create({
    user_id: userId,
    store_id: storeId,
    credits_used: creditsToDeduct,
    usage_type: usageType,
    reference_id: referenceId,
    reference_type: referenceType,
    description: description
  });

  return {
    success: true,
    usage_id: usage.id,
    credits_deducted: creditsToDeduct,
    remaining_balance: await this.getBalance(userId, storeId)
  };
};

Credit.initializeBalance = async function(userId, storeId) {
  const [credit, created] = await this.findOrCreate({
    where: { user_id: userId, store_id: storeId },
    defaults: {
      user_id: userId,
      store_id: storeId,
      balance: 0.00,
      total_purchased: 0.00,
      total_used: 0.00
    }
  });
  
  return credit;
};

module.exports = Credit;