const Credit = require('../models/Credit');
const CreditTransaction = require('../models/CreditTransaction');
const CreditUsage = require('../models/CreditUsage');
const AkeneoSchedule = require('../models/AkeneoSchedule');
const ServiceCreditCost = require('../models/ServiceCreditCost');
const { sequelize } = require('../database/connection');

class CreditService {
  constructor() {
    // No hardcoded costs - any feature can specify its own cost
  }

  /**
   * Get credit balance for a user (single source of truth: users.credits)
   * Note: storeId parameter kept for backward compatibility but not used
   */
  async getBalance(userId, storeId = null) {
    const [result] = await sequelize.query(`
      SELECT credits FROM users WHERE id = $1
    `, {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    return result ? parseFloat(result.credits || 0) : 0;
  }

  /**
   * Check if user has enough credits for a specific operation
   * Note: storeId parameter kept for backward compatibility but not used
   */
  async hasEnoughCredits(userId, storeId = null, requiredCredits) {
    const balance = await this.getBalance(userId);
    return balance >= requiredCredits;
  }

  /**
   * Universal credit deduction method - any feature can use this
   * @param {string} userId - User ID
   * @param {string} storeId - Store ID (kept for usage tracking only)
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
      const balance = await this.getBalance(userId);
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${balance}`);
    }

    // Deduct from users.credits (single source of truth)
    await sequelize.query(`
      UPDATE users
      SET credits = credits - $1,
          updated_at = NOW()
      WHERE id = $2
    `, {
      bind: [amount, userId],
      type: sequelize.QueryTypes.UPDATE
    });

    // Record usage for tracking (store_id kept for analytics)
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
      remaining_balance: await this.getBalance(userId),
      description: description
    };
  }

  /**
   * Get comprehensive credit information for a user/store
   * Note: Now uses users.credits as single source of truth
   */
  async getCreditInfo(userId, storeId) {
    // Get user's current balance from users.credits
    const balance = await this.getBalance(userId);

    // Get recent transactions (purchases)
    const recentTransactions = await CreditTransaction.getUserTransactions(userId, storeId, 10);

    // Get recent usage
    const recentUsage = await CreditUsage.getUsageHistory(userId, storeId, 20);

    // Calculate totals from transaction/usage history
    const [totals] = await sequelize.query(`
      SELECT
        COALESCE(SUM(ct.credits_purchased), 0) as total_purchased,
        COALESCE(SUM(cu.credits_used), 0) as total_used
      FROM users u
      LEFT JOIN credit_transactions ct ON u.id = ct.user_id
      LEFT JOIN credit_usage cu ON u.id = cu.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    // Get usage stats for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await CreditUsage.getUsageStats(userId, storeId, startOfMonth);

    // Check schedules that need credits
    const scheduleInfo = await AkeneoSchedule.getSchedulesNeedingCredits(userId, storeId);

    return {
      balance: parseFloat(balance),
      total_purchased: totals ? parseFloat(totals.total_purchased || 0) : 0,
      total_used: totals ? parseFloat(totals.total_used || 0) : 0,
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
   * Charge daily fee for custom domain
   */
  async chargeDailyCustomDomainFee(userId, domainId, domainName) {
    // Get the daily custom domain cost from service_credit_costs table
    let dailyCost = 0.5; // Fallback default (0.5 credits per day)
    try {
      dailyCost = await ServiceCreditCost.getCostByKey('custom_domain_daily');
    } catch (error) {
      console.warn('⚠️ Could not fetch custom_domain_daily cost, using fallback:', error.message);
    }

    // Check if domain is still active
    const CustomDomain = require('../models/CustomDomain');
    const domain = await CustomDomain.findByPk(domainId);

    if (!domain || !domain.is_active || domain.verification_status !== 'verified') {
      return {
        success: false,
        message: 'Domain is not active, skipping daily charge'
      };
    }

    // Get balance before deduction
    const balanceBefore = await this.getBalance(userId);

    // Check if user has enough credits
    if (balanceBefore < dailyCost) {
      // Deactivate domain if insufficient credits
      await domain.update({
        is_active: false,
        metadata: {
          ...domain.metadata,
          deactivated_reason: 'insufficient_credits',
          deactivated_at: new Date().toISOString()
        }
      });

      return {
        success: false,
        message: 'Insufficient credits - domain deactivated',
        credits_deducted: 0,
        remaining_balance: balanceBefore,
        domain_deactivated: true
      };
    }

    // Deduct credits
    const deductResult = await this.deduct(
      userId,
      domain.store_id,
      dailyCost,
      `Custom domain - daily charge (${domainName})`,
      {
        charge_type: 'daily',
        domain_id: domainId,
        domain_name: domainName,
        charge_date: new Date().toISOString()
      },
      domainId,
      'custom_domain'
    );

    return {
      success: true,
      credits_deducted: dailyCost,
      remaining_balance: deductResult.remaining_balance,
      message: `Daily charge applied for ${domainName}`
    };
  }

  /**
   * Record daily credit charge for published store
   */
  async chargeDailyPublishingFee(userId, storeId) {
    // Get the daily publishing cost from service_credit_costs table
    let dailyCost = 1.0; // Fallback default
    try {
      dailyCost = await ServiceCreditCost.getCostByKey('store_daily_publishing');
    } catch (error) {
      console.warn('⚠️ Could not fetch store_daily_publishing cost, using fallback:', error.message);
    }

    // Check if store is still published
    const Store = require('../models/Store');
    const store = await Store.findByPk(storeId);

    if (!store || !store.published) {
      return {
        success: false,
        message: 'Store is not published, skipping daily charge'
      };
    }

    // Get balance before deduction
    const balanceBefore = await this.getBalance(userId);

    // Deduct credits
    const deductResult = await this.deduct(
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

    // Log to store_uptime table
    try {
      await sequelize.query(`
        INSERT INTO store_uptime (
          id,
          store_id,
          user_id,
          charged_date,
          credits_charged,
          user_balance_before,
          user_balance_after,
          store_name,
          metadata,
          created_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          CURRENT_DATE,
          $3,
          $4,
          $5,
          $6,
          $7,
          NOW()
        )
        ON CONFLICT (store_id, charged_date) DO UPDATE SET
          credits_charged = EXCLUDED.credits_charged,
          user_balance_after = EXCLUDED.user_balance_after,
          metadata = EXCLUDED.metadata
      `, {
        bind: [
          storeId,
          userId,
          dailyCost,
          balanceBefore,
          deductResult.remaining_balance,
          store.name,
          JSON.stringify({
            charge_type: 'daily',
            deduction_time: new Date().toISOString()
          })
        ],
        type: sequelize.QueryTypes.INSERT
      });
    } catch (uptimeError) {
      console.error('❌ Failed to log to store_uptime:', uptimeError);
      // Don't fail the deduction if uptime logging fails
    }

    return deductResult;
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
   * Mark a purchase transaction as completed and add credits to user
   */
  async completePurchaseTransaction(transactionId, stripeChargeId = null) {
    const transaction = await CreditTransaction.findByPk(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Add credits to users.credits (single source of truth)
    await sequelize.query(`
      UPDATE users
      SET credits = COALESCE(credits, 0) + $1,
          updated_at = NOW()
      WHERE id = $2
    `, {
      bind: [transaction.credits_purchased, transaction.user_id],
      type: sequelize.QueryTypes.UPDATE
    });

    // Mark transaction as completed
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
    // Add credits to users.credits (single source of truth)
    await sequelize.query(`
      UPDATE users
      SET credits = COALESCE(credits, 0) + $1,
          updated_at = NOW()
      WHERE id = $2
    `, {
      bind: [creditsAmount, userId],
      type: sequelize.QueryTypes.UPDATE
    });

    // Create bonus transaction record
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