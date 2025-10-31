const BaseJobHandler = require('./BaseJobHandler');
const Store = require('../../models/Store');
const User = require('../../models/User');
const CustomDomain = require('../../models/CustomDomain');
const creditService = require('../../services/credit-service');

/**
 * Daily Credit Deduction Job
 * Deducts credits daily for:
 * - Published stores (cost configured in service_credit_costs table)
 * - Active custom domains (cost configured in service_credit_costs table)
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

      // Process custom domains
      console.log('\n🌐 Processing custom domain charges...');

      const activeCustomDomains = await CustomDomain.findAll({
        where: {
          is_active: true,
          verification_status: 'verified'
        },
        include: [{
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'user_id']
        }]
      });

      console.log(`📊 Found ${activeCustomDomains.length} active custom domains`);

      const domainResults = {
        processed: 0,
        successful: 0,
        failed: 0,
        domains: [],
        errors: []
      };

      for (const domain of activeCustomDomains) {
        domainResults.processed++;

        try {
          console.log(`💰 Charging for custom domain: ${domain.domain}`);

          if (!domain.store) {
            console.warn(`⚠️ Store not found for domain ${domain.domain}`);
            domainResults.failed++;
            continue;
          }

          const chargeResult = await creditService.chargeDailyCustomDomainFee(
            domain.store.user_id,
            domain.id,
            domain.domain
          );

          if (chargeResult.success) {
            console.log(`✅ Successfully charged ${chargeResult.credits_deducted} credit(s) for domain: ${domain.domain}`);
            domainResults.successful++;
            domainResults.domains.push({
              domain_id: domain.id,
              domain_name: domain.domain,
              store_id: domain.store_id,
              store_name: domain.store.name,
              owner_id: domain.store.user_id,
              credits_deducted: chargeResult.credits_deducted,
              remaining_balance: chargeResult.remaining_balance,
              status: 'success'
            });
          } else {
            console.warn(`⚠️ Failed to charge domain ${domain.domain}: ${chargeResult.message}`);
            domainResults.failed++;
            domainResults.errors.push({
              domain_id: domain.id,
              domain_name: domain.domain,
              error: chargeResult.message,
              domain_deactivated: chargeResult.domain_deactivated || false
            });
          }

        } catch (domainError) {
          console.error(`❌ Error processing domain ${domain.domain}:`, domainError.message);
          domainResults.failed++;
          domainResults.errors.push({
            domain_id: domain.id,
            domain_name: domain.domain,
            error: domainError.message
          });
        }
      }

      // Log summary
      console.log(`\n📈 Daily credit deduction completed:`);
      console.log(`   Stores Processed: ${results.processed}, Successful: ${results.successful}, Failed: ${results.failed}`);
      console.log(`   Domains Processed: ${domainResults.processed}, Successful: ${domainResults.successful}, Failed: ${domainResults.failed}`);

      // If all charges failed, consider this a job failure
      if (results.failed > 0 && results.successful === 0 && domainResults.successful === 0) {
        throw new Error(`All charges failed: ${results.failed} stores + ${domainResults.failed} domains`);
      }

      return {
        success: true,
        message: `Daily credit deduction completed: ${results.successful}/${results.processed} stores, ${domainResults.successful}/${domainResults.processed} domains`,
        stores: results,
        custom_domains: domainResults,
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
    return 'Daily credit deduction for published stores and active custom domains';
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