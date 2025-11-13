/**
 * CreditTransaction Model (Master Database)
 *
 * Records all credit purchases, adjustments, refunds
 * Immutable transaction log for audit trail
 */

const { DataTypes } = require('sequelize');
const { masterSequelize } = require('../../database/masterConnection');

const CreditTransaction = masterSequelize.define('CreditTransaction', {
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
    },
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Positive for purchases/additions, negative for deductions'
  },
  transaction_type: {
    type: DataTypes.ENUM(
      'purchase',      // User bought credits
      'adjustment',    // Manual admin adjustment
      'refund',       // Refund issued
      'bonus',        // Promotional credits
      'migration'     // Data migration credits
    ),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'stripe, paypal, bank_transfer, etc.'
  },
  payment_provider_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'External transaction/charge ID from payment provider'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'completed'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reference_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Related invoice/order/ticket ID'
  },
  processed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Admin user who processed (for manual adjustments)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes about transaction'
  }
}, {
  tableName: 'credit_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Immutable - no updates
  indexes: [
    {
      fields: ['store_id']
    },
    {
      fields: ['transaction_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['payment_provider_id']
    }
  ]
});

// Class Methods

/**
 * Record a credit purchase
 * @param {string} storeId - Store UUID
 * @param {number} amount - Amount purchased
 * @param {Object} options - Transaction options
 * @returns {Promise<CreditTransaction>}
 */
CreditTransaction.recordPurchase = async function(storeId, amount, options = {}) {
  return this.create({
    store_id: storeId,
    amount: Math.abs(amount), // Ensure positive
    transaction_type: 'purchase',
    payment_method: options.paymentMethod,
    payment_provider_id: options.paymentProviderId,
    payment_status: options.paymentStatus || 'completed',
    description: options.description || `Credit purchase: ${amount} credits`,
    reference_id: options.referenceId
  });
};

/**
 * Record a credit adjustment (admin)
 * @param {string} storeId - Store UUID
 * @param {number} amount - Amount to adjust (positive or negative)
 * @param {string} adminUserId - Admin user ID
 * @param {string} reason - Reason for adjustment
 * @returns {Promise<CreditTransaction>}
 */
CreditTransaction.recordAdjustment = async function(storeId, amount, adminUserId, reason) {
  return this.create({
    store_id: storeId,
    amount: amount,
    transaction_type: 'adjustment',
    payment_status: 'completed',
    description: reason,
    processed_by: adminUserId,
    notes: `Admin adjustment by ${adminUserId}`
  });
};

/**
 * Record a refund
 * @param {string} storeId - Store UUID
 * @param {number} amount - Amount to refund
 * @param {Object} options - Refund options
 * @returns {Promise<CreditTransaction>}
 */
CreditTransaction.recordRefund = async function(storeId, amount, options = {}) {
  return this.create({
    store_id: storeId,
    amount: Math.abs(amount), // Positive amount
    transaction_type: 'refund',
    payment_method: options.paymentMethod,
    payment_provider_id: options.paymentProviderId,
    payment_status: 'refunded',
    description: options.description || `Refund: ${amount} credits`,
    reference_id: options.referenceId,
    notes: options.notes
  });
};

/**
 * Record bonus credits
 * @param {string} storeId - Store UUID
 * @param {number} amount - Bonus amount
 * @param {string} reason - Reason for bonus
 * @returns {Promise<CreditTransaction>}
 */
CreditTransaction.recordBonus = async function(storeId, amount, reason) {
  return this.create({
    store_id: storeId,
    amount: Math.abs(amount),
    transaction_type: 'bonus',
    payment_status: 'completed',
    description: reason || `Bonus credits: ${amount}`
  });
};

/**
 * Get transaction history for store
 * @param {string} storeId - Store UUID
 * @param {Object} options - Query options
 * @returns {Promise<CreditTransaction[]>}
 */
CreditTransaction.getStoreHistory = async function(storeId, options = {}) {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  return this.findAll({
    where: { store_id: storeId },
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

/**
 * Get total purchased for store
 * @param {string} storeId - Store UUID
 * @returns {Promise<number>}
 */
CreditTransaction.getTotalPurchased = async function(storeId) {
  const result = await this.findOne({
    where: {
      store_id: storeId,
      transaction_type: 'purchase',
      payment_status: 'completed'
    },
    attributes: [
      [masterSequelize.fn('SUM', masterSequelize.col('amount')), 'total']
    ]
  });

  return parseFloat(result?.dataValues?.total || 0);
};

/**
 * Find transaction by payment provider ID
 * @param {string} paymentProviderId - External payment ID
 * @returns {Promise<CreditTransaction|null>}
 */
CreditTransaction.findByPaymentId = async function(paymentProviderId) {
  return this.findOne({
    where: { payment_provider_id: paymentProviderId }
  });
};

module.exports = CreditTransaction;
