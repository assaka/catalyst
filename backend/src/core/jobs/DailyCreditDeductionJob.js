const BaseJobHandler = require('./BaseJobHandler');
const { masterSequelize } = require('../../database/masterConnection');
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
    try {
      // Query published stores from master DB
      const publishedStores = await masterSequelize.query(`
        SELECT id, user_id, name, slug, published
        FROM stores
        WHERE published = true
        ORDER BY created_at DESC
      `, {
        type: masterSequelize.QueryTypes.SELECT
      });

      if (publishedStores.length === 0) {
        return {
          success: true,
          message: 'No published stores found',
          processed: 0,
          successful: 0,
          failed: 0,
          timestamp: new Date().toISOString()
        };
      }

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        stores: [],
        errors: []
      };

      for (const store of publishedStores) {
        results.processed++;

        try {
          // Query user from master DB
          const [owner] = await masterSequelize.query(`
            SELECT id, email
            FROM users
            WHERE id = $1
          `, {
            bind: [store.user_id],
            type: masterSequelize.QueryTypes.SELECT
          });

          if (!owner) {
            results.failed++;
            results.errors.push({
              store_id: store.id,
              store_name: store.name,
              error: 'Store owner not found'
            });
            continue;
          }

          const chargeResult = await creditService.chargeDailyPublishingFee(store.user_id, store.id);

          if (chargeResult.success) {
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
            results.failed++;
            results.errors.push({
              store_id: store.id,
              store_name: store.name,
              error: chargeResult.message || 'Unknown error'
            });
          }
        } catch (storeError) {
          results.failed++;
          results.errors.push({
            store_id: store.id,
            store_name: store.name,
            error: storeError.message
          });
        }
      }

      // Process custom domains - query from master DB
      const activeCustomDomains = await masterSequelize.query(`
        SELECT id, store_id, domain, is_active, verification_status
        FROM custom_domains
        WHERE is_active = true
          AND verification_status = 'verified'
        ORDER BY created_at DESC
      `, {
        type: masterSequelize.QueryTypes.SELECT
      });

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
          // Query store from master DB
          const [store] = await masterSequelize.query(`
            SELECT id, name, slug, user_id
            FROM stores
            WHERE id = $1
          `, {
            bind: [domain.store_id],
            type: masterSequelize.QueryTypes.SELECT
          });

          if (!store) {
            domainResults.failed++;
            domainResults.errors.push({
              domain_id: domain.id,
              domain_name: domain.domain,
              error: 'Store not found'
            });
            continue;
          }

          const chargeResult = await creditService.chargeDailyCustomDomainFee(
            store.user_id,
            domain.id,
            domain.domain
          );

          if (chargeResult.success) {
            domainResults.successful++;
            domainResults.domains.push({
              domain_id: domain.id,
              domain_name: domain.domain,
              store_id: domain.store_id,
              store_name: store.name,
              store_slug: store.slug,
              owner_id: store.user_id,
              credits_deducted: chargeResult.credits_deducted,
              remaining_balance: chargeResult.remaining_balance,
              status: 'success'
            });
          } else {
            domainResults.failed++;
            domainResults.errors.push({
              domain_id: domain.id,
              domain_name: domain.domain,
              store_name: store.name,
              error: chargeResult.message,
              domain_deactivated: chargeResult.domain_deactivated || false
            });
          }
        } catch (domainError) {
          domainResults.failed++;
          domainResults.errors.push({
            domain_id: domain.id,
            domain_name: domain.domain,
            error: domainError.message
          });
        }
      }

      if (results.failed > 0 && results.successful === 0 && domainResults.successful === 0) {
        throw new Error(`All charges failed: ${results.failed} stores + ${domainResults.failed} domains`);
      }

      return {
        success: true,
        message: `Completed: ${results.successful}/${results.processed} stores, ${domainResults.successful}/${domainResults.processed} domains`,
        stores: results,
        custom_domains: domainResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
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