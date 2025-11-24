/**
 * CreditTransaction Model
 * Uses masterDbClient (Supabase) for database operations
 */

const { masterDbClient } = require('../database/masterConnection');
const { v4: uuidv4 } = require('uuid');

const CreditTransaction = {
  tableName: 'credit_transactions',

  async create(data) {
    const record = {
      id: data.id || uuidv4(),
      user_id: data.user_id,
      store_id: data.store_id,
      transaction_type: data.transaction_type,
      amount_usd: data.amount_usd,
      credits_amount: data.credits_amount,
      currency: data.currency || 'usd',
      stripe_payment_intent_id: data.stripe_payment_intent_id || null,
      stripe_charge_id: data.stripe_charge_id || null,
      status: data.status || 'pending',
      description: data.description || null,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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

    return result;
  },

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

    return data;
  },

  async update(updateData, options) {
    const { where } = options;

    const { data, error } = await masterDbClient
      .from(this.tableName)
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', where.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating credit transaction:', error);
      throw new Error(`Failed to update credit transaction: ${error.message}`);
    }

    return [1, [data]];
  },

  async createPurchase(userId, storeId, amountUsd, creditsAmount, paymentIntentId = null) {
    return await this.create({
      user_id: userId,
      store_id: storeId,
      transaction_type: 'purchase',
      amount_usd: amountUsd,
      credits_amount: creditsAmount,
      stripe_payment_intent_id: paymentIntentId,
      status: 'pending',
      description: `Credit purchase: ${creditsAmount} credits for $${amountUsd}`
    });
  },

  async createBonus(userId, storeId, creditsAmount, description = null) {
    return await this.create({
      user_id: userId,
      store_id: storeId,
      transaction_type: 'bonus',
      amount_usd: 0,
      credits_amount: creditsAmount,
      status: 'completed',
      description: description || `Bonus: ${creditsAmount} credits`
    });
  },

  async markCompleted(transactionId, stripeChargeId = null) {
    const transaction = await this.findByPk(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const updateData = { status: 'completed' };
    if (stripeChargeId) {
      updateData.stripe_charge_id = stripeChargeId;
    }

    const { data, error } = await masterDbClient
      .from(this.tableName)
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark transaction completed: ${error.message}`);
    }

    return data;
  },

  async markFailed(transactionId, reason = null) {
    const transaction = await this.findByPk(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const { data, error } = await masterDbClient
      .from(this.tableName)
      .update({
        status: 'failed',
        metadata: { ...transaction.metadata, failure_reason: reason },
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark transaction failed: ${error.message}`);
    }

    return data;
  },

  async getUserTransactions(userId, storeId = null, limit = 50) {
    let query = masterDbClient
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting user transactions:', error);
      throw new Error(`Failed to get user transactions: ${error.message}`);
    }

    return data || [];
  }
};

module.exports = CreditTransaction;
