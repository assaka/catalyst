/**
 * CreditTransaction Model
 * Uses masterDbClient (Supabase) for database operations
 *
 * Table schema:
 * - id, store_id, amount, transaction_type, payment_method, payment_provider_id,
 * - payment_status, description, reference_id, processed_by, notes, created_at
 */

const { masterDbClient } = require('../database/masterConnection');
const { v4: uuidv4 } = require('uuid');

const CreditTransaction = {
  tableName: 'credit_transactions',

  /**
   * Create a new credit transaction
   */
  async create(data) {
    const record = {
      id: data.id || uuidv4(),
      store_id: data.store_id,
      amount: data.amount || data.amount_usd || data.credits_purchased || 0,
      transaction_type: data.transaction_type,
      payment_method: data.payment_method || 'stripe',
      payment_provider_id: data.payment_provider_id || data.stripe_payment_intent_id || null,
      payment_status: data.payment_status || data.status || 'pending',
      description: data.description || null,
      reference_id: data.reference_id || null,
      processed_by: data.processed_by || data.user_id || null,
      notes: data.notes || null,
      created_at: new Date().toISOString()
    };

    const { data: result, error } = await masterDbClient
      .from(this.tableName)
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Error creating credit transaction:', error);
      throw new Error(`Failed to create credit transaction: ${error.message}`);
    }

    // Return with aliased fields for backwards compatibility
    return {
      ...result,
      user_id: result.processed_by,
      credits_purchased: result.amount,
      status: result.payment_status,
      stripe_payment_intent_id: result.payment_provider_id
    };
  },

  /**
   * Find transaction by primary key
   */
  async findByPk(id) {
    const { data, error } = await masterDbClient
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error finding credit transaction:', error);
      throw new Error(`Failed to find credit transaction: ${error.message}`);
    }

    if (!data) return null;

    // Return with aliased fields for backwards compatibility
    return {
      ...data,
      user_id: data.processed_by,
      credits_purchased: data.amount,
      status: data.payment_status,
      stripe_payment_intent_id: data.payment_provider_id
    };
  },

  /**
   * Update a transaction
   */
  async update(updateData, options) {
    const { where } = options;

    // Map aliased fields to actual column names
    const mappedData = {};
    if (updateData.status !== undefined) mappedData.payment_status = updateData.status;
    if (updateData.payment_status !== undefined) mappedData.payment_status = updateData.payment_status;
    if (updateData.stripe_charge_id !== undefined) mappedData.notes = `Stripe charge: ${updateData.stripe_charge_id}`;
    if (updateData.metadata !== undefined) mappedData.notes = JSON.stringify(updateData.metadata);
    if (updateData.description !== undefined) mappedData.description = updateData.description;
    if (updateData.payment_provider_id !== undefined) mappedData.payment_provider_id = updateData.payment_provider_id;

    const { data, error } = await masterDbClient
      .from(this.tableName)
      .update(mappedData)
      .eq('id', where.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating credit transaction:', error);
      throw new Error(`Failed to update credit transaction: ${error.message}`);
    }

    return [1, [data]]; // Sequelize-compatible return format
  },

  /**
   * Create a purchase transaction
   */
  async createPurchase(userId, storeId, amountUsd, creditsAmount, paymentIntentId = null) {
    return await this.create({
      store_id: storeId,
      amount: creditsAmount, // Store credits amount
      transaction_type: 'purchase',
      payment_method: 'stripe',
      payment_provider_id: paymentIntentId,
      payment_status: 'pending',
      description: `Credit purchase: ${creditsAmount} credits for $${amountUsd}`,
      processed_by: userId
    });
  },

  /**
   * Create a bonus transaction
   */
  async createBonus(userId, storeId, creditsAmount, description = null) {
    return await this.create({
      store_id: storeId,
      amount: creditsAmount,
      transaction_type: 'bonus',
      payment_method: null,
      payment_status: 'completed',
      description: description || `Bonus credits: ${creditsAmount}`,
      processed_by: userId
    });
  },

  /**
   * Mark transaction as completed
   */
  async markCompleted(transactionId, stripeChargeId = null) {
    const transaction = await this.findByPk(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const updateData = {
      payment_status: 'completed'
    };
    if (stripeChargeId) {
      updateData.notes = `Stripe charge ID: ${stripeChargeId}`;
    }

    const { data, error } = await masterDbClient
      .from(this.tableName)
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark transaction completed: ${error.message}`);
    }

    return {
      ...data,
      user_id: data.processed_by,
      credits_purchased: data.amount,
      status: data.payment_status,
      stripe_charge_id: stripeChargeId
    };
  },

  /**
   * Mark transaction as failed
   */
  async markFailed(transactionId, reason = null) {
    const transaction = await this.findByPk(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const { data, error } = await masterDbClient
      .from(this.tableName)
      .update({
        payment_status: 'failed',
        notes: reason ? `Failure reason: ${reason}` : null
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark transaction failed: ${error.message}`);
    }

    return {
      ...data,
      user_id: data.processed_by,
      credits_purchased: data.amount,
      status: data.payment_status
    };
  },

  /**
   * Get user transactions (by store)
   */
  async getUserTransactions(userId, storeId = null, limit = 50) {
    let query = masterDbClient
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    // If userId provided, filter by processed_by
    if (userId) {
      query = query.eq('processed_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting user transactions:', error);
      throw new Error(`Failed to get user transactions: ${error.message}`);
    }

    // Map to backwards-compatible format
    return (data || []).map(tx => ({
      ...tx,
      user_id: tx.processed_by,
      credits_purchased: tx.amount,
      status: tx.payment_status,
      stripe_payment_intent_id: tx.payment_provider_id
    }));
  }
};

module.exports = CreditTransaction;
