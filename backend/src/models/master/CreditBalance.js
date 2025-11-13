/**
 * CreditBalance Model (Master Database)
 *
 * Stores current credit balance per store (source of truth)
 * Synced to tenant DB cache for fast reads
 */

const { DataTypes } = require('sequelize');
const { masterSequelize } = require('../../database/masterConnection');

const CreditBalance = masterSequelize.define('CreditBalance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'stores',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    },
    comment: 'Current available balance'
  },
  reserved_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    },
    comment: 'Credits reserved for pending transactions'
  },
  lifetime_purchased: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Total credits purchased (all time)'
  },
  lifetime_spent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Total credits spent (all time)'
  },
  last_purchase_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_spent_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'credit_balances',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['store_id']
    }
  ]
});

// Instance Methods

/**
 * Add credits to balance
 * @param {number} amount - Amount to add
 * @returns {Promise<void>}
 */
CreditBalance.prototype.addCredits = async function(amount) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  this.balance = parseFloat(this.balance) + parseFloat(amount);
  this.lifetime_purchased = parseFloat(this.lifetime_purchased) + parseFloat(amount);
  this.last_purchase_at = new Date();

  await this.save();
};

/**
 * Deduct credits from balance
 * @param {number} amount - Amount to deduct
 * @throws {Error} If insufficient balance
 * @returns {Promise<void>}
 */
CreditBalance.prototype.deductCredits = async function(amount) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const availableBalance = parseFloat(this.balance) - parseFloat(this.reserved_balance);

  if (availableBalance < amount) {
    throw new Error(`Insufficient credits. Available: ${availableBalance}, Required: ${amount}`);
  }

  this.balance = parseFloat(this.balance) - parseFloat(amount);
  this.lifetime_spent = parseFloat(this.lifetime_spent) + parseFloat(amount);
  this.last_spent_at = new Date();

  await this.save();
};

/**
 * Reserve credits for pending transaction
 * @param {number} amount - Amount to reserve
 * @throws {Error} If insufficient balance
 * @returns {Promise<void>}
 */
CreditBalance.prototype.reserveCredits = async function(amount) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const availableBalance = parseFloat(this.balance) - parseFloat(this.reserved_balance);

  if (availableBalance < amount) {
    throw new Error(`Insufficient credits to reserve. Available: ${availableBalance}, Required: ${amount}`);
  }

  this.reserved_balance = parseFloat(this.reserved_balance) + parseFloat(amount);
  await this.save();
};

/**
 * Release reserved credits
 * @param {number} amount - Amount to release
 * @returns {Promise<void>}
 */
CreditBalance.prototype.releaseReservedCredits = async function(amount) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  this.reserved_balance = Math.max(0, parseFloat(this.reserved_balance) - parseFloat(amount));
  await this.save();
};

/**
 * Get available balance (total - reserved)
 * @returns {number}
 */
CreditBalance.prototype.getAvailableBalance = function() {
  return parseFloat(this.balance) - parseFloat(this.reserved_balance);
};

/**
 * Check if has sufficient balance
 * @param {number} amount - Amount to check
 * @returns {boolean}
 */
CreditBalance.prototype.hasSufficientBalance = function(amount) {
  return this.getAvailableBalance() >= amount;
};

// Class Methods

/**
 * Find or create balance for store
 * @param {string} storeId - Store UUID
 * @returns {Promise<CreditBalance>}
 */
CreditBalance.findOrCreateForStore = async function(storeId) {
  const [balance] = await this.findOrCreate({
    where: { store_id: storeId },
    defaults: {
      store_id: storeId,
      balance: 0.00,
      reserved_balance: 0.00,
      lifetime_purchased: 0.00,
      lifetime_spent: 0.00
    }
  });

  return balance;
};

/**
 * Get balance for store
 * @param {string} storeId - Store UUID
 * @returns {Promise<CreditBalance|null>}
 */
CreditBalance.findByStore = async function(storeId) {
  return this.findOne({
    where: { store_id: storeId }
  });
};

/**
 * Add credits to store
 * @param {string} storeId - Store UUID
 * @param {number} amount - Amount to add
 * @returns {Promise<CreditBalance>}
 */
CreditBalance.addToStore = async function(storeId, amount) {
  const balance = await this.findOrCreateForStore(storeId);
  await balance.addCredits(amount);
  return balance;
};

/**
 * Deduct credits from store
 * @param {string} storeId - Store UUID
 * @param {number} amount - Amount to deduct
 * @throws {Error} If insufficient balance
 * @returns {Promise<CreditBalance>}
 */
CreditBalance.deductFromStore = async function(storeId, amount) {
  const balance = await this.findOrCreateForStore(storeId);
  await balance.deductCredits(amount);
  return balance;
};

module.exports = CreditBalance;
