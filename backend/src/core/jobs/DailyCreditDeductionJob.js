const BaseJobHandler = require('./BaseJobHandler');
const Store = require('../../models/Store');
const User = require('../../models/User');
const creditService = require('../../services/credit-service');

/**
 * Daily Credit Deduction Job
 * Deducts credits per store per day for published stores (cost configured in service_credit_costs table)
 */
class DailyCreditDeductionJob extends BaseJobHandler {
  constructor(job) {
    super(job);
  }

  async execute() {
    console.log('🏪 Starting daily credit deduction for all published stores...');
    
    try {
      // Get all published stores
      const publishedStores = await Store.findPublishedStores();
      
      if (publishedStores.length === 0) {
        console.log('ℹ️ No published stores found, skipping credit deduction');
        return {
          success: true,
          message: 'No published stores found',
          processed: 0,
          successful: 0,
          failed: 0,
          timestamp: new Date().toISOString()
        };
      }

      console.log(`📊 Found ${publishedStores.length} published stores`);
      
      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        stores: [],
        errors: []
      };

      // Process each published store
      for (const store of publishedStores) {
        results.processed++;
        
        try {
          console.log(`💰 Processing daily charge for store: ${store.name} (${store.id})`);
          
          // Get the store owner
          const owner = await User.findByPk(store.user_id);
          if (!owner) {
            console.warn(`⚠️ Store owner not found for store ${store.name} (${store.id})`);
            results.failed++;
            results.errors.push({
              store_id: store.id,
              store_name: store.name,
              error: 'Store owner not found'
            });
            continue;
          }

          // Charge daily publishing fee
          const chargeResult = await creditService.chargeDailyPublishingFee(
            store.user_id,
            store.id
          );

          if (chargeResult.success) {
            console.log(`✅ Successfully charged ${chargeResult.credits_deducted || 'daily'} credit(s) for store: ${store.name}`);
            results.successful++;
            results.stores.push({
              store_id: store.id,
              store_name: store.name,
              owner_id: store.user_id,
              credits_deducted: chargeResult.credits_deducted || 1,
              remaining_balance: chargeResult.remaining_balance,
              status: 'success'
            });
          } else {
            console.warn(`⚠️ Failed to charge store ${store.name}: ${chargeResult.message}`);
            results.failed++;
            results.errors.push({
              store_id: store.id,
              store_name: store.name,
              error: chargeResult.message || 'Unknown error'
            });
          }

        } catch (storeError) {
          console.error(`❌ Error processing store ${store.name} (${store.id}):`, storeError.message);
          results.failed++;
          results.errors.push({
            store_id: store.id,
            store_name: store.name,
            error: storeError.message
          });
        }
      }

      // Log summary
      console.log(`📈 Daily credit deduction completed:`);
      console.log(`   Processed: ${results.processed} stores`);
      console.log(`   Successful: ${results.successful} charges`);
      console.log(`   Failed: ${results.failed} charges`);

      // If all stores failed, consider this a job failure
      if (results.failed > 0 && results.successful === 0) {
        throw new Error(`All ${results.failed} store charges failed`);
      }

      return {
        success: true,
        message: `Daily credit deduction completed: ${results.successful}/${results.processed} successful`,
        ...results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Daily credit deduction job failed:', error.message);
      throw error;
    }
  }

  /**
   * Get job type identifier
   */
  static getJobType() {
    return 'system:daily_credit_deduction';
  }

  /**
   * Get job description for logging
   */
  getDescription() {
    return 'Daily credit deduction for published stores';
  }

  /**
   * Validate job payload (none required for this job)
   */
  validatePayload() {
    // No specific payload validation needed for daily credit deduction
    return true;
  }
}

module.exports = DailyCreditDeductionJob;