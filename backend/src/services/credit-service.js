const Credit = require('../models/Credit');
const CreditTransaction = require('../models/CreditTransaction');
const CreditUsage = require('../models/CreditUsage');
const AkeneoSchedule = require('../models/AkeneoSchedule');

class CreditService {
  constructor() {
    // No hardcoded costs - any feature can specify its own cost
  }

  /**
   * Get credit balance for a user/store combination
   */
  async getBalance(userId, storeId) {
    return await Credit.getBalance(userId, storeId);
  }

  /**
   * Check if user has enough credits for a specific operation
   */
  async hasEnoughCredits(userId, storeId, requiredCredits) {
    return await Credit.hasEnoughCredits(userId, storeId, requiredCredits);
  }

  /**
   * Universal credit deduction method - any feature can use this
   * @param {string} userId - User ID
   * @param {string} storeId - Store ID  
   * @param {number} amount - Amount of credits to deduct
   * @param {string} description - Description of what the credits were used for
   * @param {object} metadata - Optional metadata object with additional info
   * @param {string} referenceId - Optional reference ID (e.g., schedule ID, product ID)
   * @param {string} referenceType - Optional reference type (e.g., 'akeneo_schedule', 'product_export')
   * @returns {object} - Deduction result with remaining balance
   */
  async deduct(userId, storeId, amount, description, metadata = {}, referenceId = null, referenceType = null) {
    // Check if user has enough credits
    const hasCredits = await this.hasEnoughCredits(userId, storeId, amount);
    if (!hasCredits) {
      const balance = await this.getBalance(userId, storeId);
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${balance}`);
    }

    // Record usage with generic type
    const usage = await CreditUsage.create({
      user_id: userId,
      store_id: storeId,
      credits_used: amount,
      usage_type: 'other', // Generic type - description tells the real story
      reference_id: referenceId,
      reference_type: referenceType,
      description: description,
      metadata: {
        deduction_time: new Date().toISOString(),
        ...metadata
      }
    });

    return {
      success: true,
      usage_id: usage.id,
      credits_deducted: amount,
      remaining_balance: await this.getBalance(userId, storeId),
      description: description
    };
  }

  /**
   * Get comprehensive credit information for a user/store
   */
  async getCreditInfo(userId, storeId) {
    // Initialize credit record if it doesn't exist
    await Credit.initializeBalance(userId, storeId);
    
    const credit = await Credit.findOne({
      where: { user_id: userId, store_id: storeId }
    });

    if (!credit) {
      throw new Error('Credit record not found');
    }

    // Get recent transactions
    const recentTransactions = await CreditTransaction.getUserTransactions(userId, storeId, 10);

    // Get recent usage
    const recentUsage = await CreditUsage.getUsageHistory(userId, storeId, 20);

    // Get usage stats for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyStats = await CreditUsage.getUsageStats(userId, storeId, startOfMonth);

    // Check schedules that need credits
    const scheduleInfo = await AkeneoSchedule.getSchedulesNeedingCredits(userId, storeId);

    return {
      balance: parseFloat(credit.balance),
      total_purchased: parseFloat(credit.total_purchased),
      total_used: parseFloat(credit.total_used),
      recent_transactions: recentTransactions,
      recent_usage: recentUsage,
      monthly_stats: monthlyStats,
      schedule_info: scheduleInfo
    };
  }

  /**
   * Check if an Akeneo schedule can run (has enough credits)
   */
  async canRunAkeneoSchedule(userId, storeId, scheduleId) {
    const schedule = await AkeneoSchedule.findOne({
      where: { id: scheduleId, store_id: storeId }
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const requiredCredits = parseFloat(schedule.credit_cost) || 0.1; // Default 0.1 credits
    const hasCredits = await this.hasEnoughCredits(userId, storeId, requiredCredits);

    return {
      can_run: hasCredits,
      required_credits: requiredCredits,
      current_balance: await this.getBalance(userId, storeId),
      schedule: {
        id: schedule.id,
        import_type: schedule.import_type,
        schedule_type: schedule.schedule_type
      }
    };
  }

  /**
   * Deduct credits for an Akeneo schedule execution
   */
  async deductCreditsForSchedule(userId, scheduleId) {
    const schedule = await AkeneoSchedule.findByPk(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    return await schedule.deductCreditsForExecution(userId);
  }

  /**
   * Record credit usage for manual Akeneo operations
   */
  async recordManualAkeneoUsage(userId, storeId, importType, metadata = {}) {
    const creditsUsed = 0.1; // Default cost for Akeneo operations
    
    return await this.deduct(
      userId, 
      storeId, 
      creditsUsed, 
      `Manual Akeneo ${importType} import`,
      { import_type: importType, ...metadata },
      null,
      'manual_import'
    );
  }

  /**
   * Check if user can publish store (has enough credits for daily cost)
   */
  async canPublishStore(userId, storeId) {
    const dailyCost = 1.0; // 1 credit per day
    const hasCredits = await this.hasEnoughCredits(userId, storeId, dailyCost);
    
    return {
      can_publish: hasCredits,
      required_credits: dailyCost,
      current_balance: await this.getBalance(userId, storeId),
      message: hasCredits ? 'Ready to publish' : 'Insufficient credits for publishing'
    };
  }

  /**
   * Start charging daily credits for published store
   */
  async startDailyCharging(userId, storeId) {
    const dailyCost = 1.0; // 1 credit per day
    
    return await this.deduct(
      userId,
      storeId,
      dailyCost,
      'Store publishing - daily charge',
      { 
        charge_type: 'daily',
        store_published: true,
        started_at: new Date().toISOString()
      },
      storeId,
      'store_publishing'
    );
  }

  /**
   * Record daily credit charge for published store
   */
  async chargeDailyPublishingFee(userId, storeId) {
    const dailyCost = 1.0; // 1 credit per day
    
    // Check if store is still published
    const Store = require('../models/Store');
    const store = await Store.findByPk(storeId);
    
    if (!store || !store.published) {
      return {
        success: false,
        message: 'Store is not published, skipping daily charge'
      };
    }
    
    return await this.deduct(
      userId,
      storeId,
      dailyCost,
      'Store publishing - daily charge',
      { 
        charge_type: 'daily',
        store_published: true,
        charge_date: new Date().toISOString()
      },
      storeId,
      'store_publishing'
    );
  }

  /**
   * Create a credit purchase transaction
   */
  async createPurchaseTransaction(userId, storeId, amountUsd, creditsAmount, paymentIntentId = null) {
    return await CreditTransaction.createPurchase(
      userId,
      storeId,
      amountUsd,
      creditsAmount,
      paymentIntentId
    );
  }

  /**
   * Mark a purchase transaction as completed
   */
  async completePurchaseTransaction(transactionId, stripeChargeId = null) {
    return await CreditTransaction.markCompleted(transactionId, stripeChargeId);
  }

  /**
   * Mark a purchase transaction as failed
   */
  async failPurchaseTransaction(transactionId, reason = null) {
    return await CreditTransaction.markFailed(transactionId, reason);
  }

  /**
   * Award bonus credits to a user
   */
  async awardBonusCredits(userId, storeId, creditsAmount, description = null) {
    return await CreditTransaction.createBonus(userId, storeId, creditsAmount, description);
  }

  /**
   * Calculate credit pricing (can be made configurable later)
   */
  getCreditPricing() {
    return [
      {
        amount_usd: 10.00,
        credits: 100,
        price_per_credit: 0.10,
        popular: false
      },
      {
        amount_usd: 25.00,
        credits: 275,
        price_per_credit: 0.091,
        popular: true,
        savings: '9% savings'
      },
      {
        amount_usd: 50.00,
        credits: 600,
        price_per_credit: 0.083,
        popular: false,
        savings: '17% savings'
      },
      {
        amount_usd: 100.00,
        credits: 1250,
        price_per_credit: 0.080,
        popular: false,
        savings: '20% savings'
      }
    ];
  }

  /**
   * Get usage analytics for a user/store
   */
  async getUsageAnalytics(userId, storeId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usageStats = await CreditUsage.getUsageStats(userId, storeId, startDate);
    
    // Get daily usage for charting
    const dailyUsage = await CreditUsage.findAll({
      where: {
        user_id: userId,
        store_id: storeId,
        createdAt: {
          [require('sequelize').Op.gte]: startDate
        }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('SUM', require('sequelize').col('credits_used')), 'credits_used'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usage_count']
      ],
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']]
    });

    return {
      period_days: days,
      usage_stats: usageStats,
      daily_usage: dailyUsage,
      total_credits_used: Object.values(usageStats).reduce((sum, stat) => sum + stat.total_credits_used, 0),
      total_operations: Object.values(usageStats).reduce((sum, stat) => sum + stat.usage_count, 0)
    };
  }
}

module.exports = new CreditService();