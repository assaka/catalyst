const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const creditService = require('../services/credit-service');

// Middleware to extract storeId and add it to req
const storeAuth = (req, res, next) => {
  const storeId = req.headers['x-store-id'] || 
                  req.body.store_id || 
                  req.query.store_id ||
                  req.params.store_id;
  
  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: 'Store ID is required. Please provide store_id in headers (x-store-id), body, or query parameters.'
    });
  }
  
  req.params.store_id = storeId;
  
  checkStoreOwnership(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    req.storeId = req.store?.id || storeId;
    
    if (!req.storeId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine store ID from request'
      });
    }
    
    next();
  });
};

/**
 * Get credit balance and information
 * GET /api/credits/balance
 */
router.get('/balance', authMiddleware, storeAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.storeId;

    const creditInfo = await creditService.getCreditInfo(userId, storeId);

    res.json({
      success: true,
      ...creditInfo
    });
  } catch (error) {
    console.error('Error getting credit balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit balance',
      error: error.message
    });
  }
});

/**
 * Check if user can run specific Akeneo schedule
 * GET /api/credits/check-schedule/:scheduleId
 */
router.get('/check-schedule/:scheduleId', authMiddleware, storeAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.storeId;
    const { scheduleId } = req.params;

    const canRun = await creditService.canRunAkeneoSchedule(userId, storeId, scheduleId);

    res.json({
      success: true,
      ...canRun
    });
  } catch (error) {
    console.error('Error checking schedule credits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check schedule credits',
      error: error.message
    });
  }
});

/**
 * Get credit pricing options
 * GET /api/credits/pricing
 */
router.get('/pricing', authMiddleware, (req, res) => {
  try {
    const pricing = creditService.getCreditPricing();

    res.json({
      success: true,
      pricing,
      currency: 'USD',
      note: 'Prices shown are in US Dollars. Credits are used for Akeneo integration operations.'
    });
  } catch (error) {
    console.error('Error getting credit pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit pricing',
      error: error.message
    });
  }
});

/**
 * Get usage analytics
 * GET /api/credits/analytics
 */
router.get('/analytics', authMiddleware, storeAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.storeId;
    const days = parseInt(req.query.days) || 30;

    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days parameter must be between 1 and 365'
      });
    }

    const analytics = await creditService.getUsageAnalytics(userId, storeId, days);

    res.json({
      success: true,
      ...analytics
    });
  } catch (error) {
    console.error('Error getting usage analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage analytics',
      error: error.message
    });
  }
});

/**
 * Create credit purchase intent (for Stripe integration)
 * POST /api/credits/create-purchase
 */
router.post('/create-purchase', authMiddleware, 
  storeAuth,
  body('amount_usd').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('credits_amount').isFloat({ min: 1 }).withMessage('Credits amount must be at least 1'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const storeId = req.storeId;
      const { amount_usd, credits_amount } = req.body;

      // Validate pricing (basic check)
      const expectedCredits = Math.floor(amount_usd * 10); // Base rate: $1 = 10 credits
      if (credits_amount > expectedCredits * 1.5) { // Allow up to 50% bonus
        return res.status(400).json({
          success: false,
          message: 'Invalid credit amount for the specified price'
        });
      }

      const transaction = await creditService.createPurchaseTransaction(
        userId,
        storeId,
        amount_usd,
        credits_amount
      );

      res.json({
        success: true,
        message: 'Purchase transaction created',
        transaction: {
          id: transaction.id,
          amount_usd: transaction.amount_usd,
          credits_amount: transaction.credits_purchased,
          status: transaction.status
        }
      });
    } catch (error) {
      console.error('Error creating purchase:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create purchase',
        error: error.message
      });
    }
  }
);

/**
 * Complete a credit purchase (webhook handler)
 * POST /api/credits/complete-purchase
 */
router.post('/complete-purchase',
  body('transaction_id').isUUID().withMessage('Valid transaction ID is required'),
  body('stripe_charge_id').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { transaction_id, stripe_charge_id } = req.body;

      const transaction = await creditService.completePurchaseTransaction(
        transaction_id,
        stripe_charge_id
      );

      res.json({
        success: true,
        message: 'Purchase completed successfully',
        transaction: {
          id: transaction.id,
          status: transaction.status,
          credits_purchased: transaction.credits_purchased
        }
      });
    } catch (error) {
      console.error('Error completing purchase:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete purchase',
        error: error.message
      });
    }
  }
);

/**
 * Fail a credit purchase (webhook handler)
 * POST /api/credits/fail-purchase
 */
router.post('/fail-purchase',
  body('transaction_id').isUUID().withMessage('Valid transaction ID is required'),
  body('reason').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { transaction_id, reason } = req.body;

      const transaction = await creditService.failPurchaseTransaction(
        transaction_id,
        reason
      );

      res.json({
        success: true,
        message: 'Purchase marked as failed',
        transaction: {
          id: transaction.id,
          status: transaction.status
        }
      });
    } catch (error) {
      console.error('Error failing purchase:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update purchase status',
        error: error.message
      });
    }
  }
);

/**
 * Award bonus credits (admin only)
 * POST /api/credits/award-bonus
 */
router.post('/award-bonus', authMiddleware,
  storeAuth,
  body('credits_amount').isFloat({ min: 0.1 }).withMessage('Credits amount must be at least 0.1'),
  body('description').optional().isString(),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can award bonus credits'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const storeId = req.storeId;
      const { credits_amount, description } = req.body;

      const bonusTransaction = await creditService.awardBonusCredits(
        userId,
        storeId,
        credits_amount,
        description
      );

      res.json({
        success: true,
        message: 'Bonus credits awarded successfully',
        transaction: {
          id: bonusTransaction.id,
          credits_awarded: bonusTransaction.credits_purchased,
          description: bonusTransaction.metadata.description
        }
      });
    } catch (error) {
      console.error('Error awarding bonus credits:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to award bonus credits',
        error: error.message
      });
    }
  }
);

/**
 * Get transaction history
 * GET /api/credits/transactions
 */
router.get('/transactions', authMiddleware, storeAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.storeId;
    const limit = parseInt(req.query.limit) || 50;

    if (limit < 1 || limit > 200) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 200'
      });
    }

    const CreditTransaction = require('../models/CreditTransaction');
    const transactions = await CreditTransaction.getUserTransactions(userId, storeId, limit);

    res.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        transaction_type: tx.transaction_type,
        amount_usd: parseFloat(tx.amount_usd),
        credits_purchased: parseFloat(tx.credits_purchased),
        status: tx.status,
        created_at: tx.createdAt,
        metadata: tx.metadata
      })),
      total: transactions.length
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
});

/**
 * Manually trigger daily credit deduction (admin only)
 * POST /api/credits/trigger-daily-deduction
 */
router.post('/trigger-daily-deduction', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can trigger daily deductions'
      });
    }

    console.log('📊 Manual daily credit deduction triggered by:', req.user.email);

    // Import and execute the deduction script
    const runDailyDeduction = require('../../scripts/run-daily-credit-deduction');

    // Run in background to avoid timeout
    runDailyDeduction()
      .then(() => {
        console.log('✅ Manual daily deduction completed');
      })
      .catch((error) => {
        console.error('❌ Manual daily deduction failed:', error);
      });

    // Return immediately
    res.json({
      success: true,
      message: 'Daily credit deduction started. Check server logs for results.',
      triggered_at: new Date().toISOString(),
      triggered_by: req.user.email
    });

  } catch (error) {
    console.error('Error triggering daily deduction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger daily deduction',
      error: error.message
    });
  }
});

/**
 * Get store uptime report
 * GET /api/credits/uptime-report
 */
router.get('/uptime-report', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30, store_id } = req.query;
    const { sequelize } = require('../database/connection');

    // Build query conditions
    let whereCondition = 'WHERE su.user_id = $1';
    const bindings = [userId];

    if (store_id) {
      whereCondition += ' AND su.store_id = $2';
      bindings.push(store_id);
    }

    // Get uptime records
    const uptimeRecords = await sequelize.query(`
      SELECT
        su.id,
        su.store_id,
        su.store_name,
        su.charged_date,
        su.credits_charged,
        su.user_balance_before,
        su.user_balance_after,
        su.created_at,
        s.published as currently_published
      FROM store_uptime su
      LEFT JOIN stores s ON su.store_id = s.id
      ${whereCondition}
      ORDER BY su.charged_date DESC, su.created_at DESC
      LIMIT $${bindings.length + 1}
    `, {
      bind: [...bindings, parseInt(days) * 10], // Fetch more records than days for safety
      type: sequelize.QueryTypes.SELECT
    });

    // Get summary statistics
    const [summary] = await sequelize.query(`
      SELECT
        COUNT(DISTINCT su.store_id) as total_stores,
        COUNT(*) as total_days,
        SUM(su.credits_charged) as total_credits_charged,
        MIN(su.charged_date) as first_charge_date,
        MAX(su.charged_date) as last_charge_date
      FROM store_uptime su
      ${whereCondition}
    `, {
      bind: bindings,
      type: sequelize.QueryTypes.SELECT
    });

    // Get per-store summary
    const storeBreakdown = await sequelize.query(`
      SELECT
        su.store_id,
        su.store_name,
        COUNT(*) as days_running,
        SUM(su.credits_charged) as total_credits,
        MIN(su.charged_date) as first_charge,
        MAX(su.charged_date) as last_charge,
        s.published as currently_published
      FROM store_uptime su
      LEFT JOIN stores s ON su.store_id = s.id
      ${whereCondition}
      GROUP BY su.store_id, su.store_name, s.published
      ORDER BY total_credits DESC
    `, {
      bind: bindings,
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      records: uptimeRecords,
      summary: summary || {
        total_stores: 0,
        total_days: 0,
        total_credits_charged: 0
      },
      store_breakdown: storeBreakdown,
      period_days: parseInt(days)
    });

  } catch (error) {
    console.error('Error getting uptime report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get uptime report',
      error: error.message
    });
  }
});

module.exports = router;