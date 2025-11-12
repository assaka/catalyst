const { sequelize } = require('../database/connection');

/**
 * Credit Pricing Service
 * Manages credit package pricing with Stripe Price IDs for different currencies
 */
class PricingService {
  constructor() {
    // Pricing is now managed entirely in the database (credit_pricing table)
  }

  /**
   * Get credit pricing for a specific currency
   * @param {string} currency - Currency code (usd, eur)
   * @returns {Array} - Array of pricing options
   */
  async getPricingForCurrency(currency = 'usd') {
    console.log(`💰 [PricingService] Getting pricing for currency: ${currency}`);

    try {
      // Get pricing from database
      const dbPricing = await this.getPricingFromDatabase(currency);

      if (!dbPricing || dbPricing.length === 0) {
        console.error(`❌ [PricingService] No pricing found in database for ${currency}`);
        throw new Error(`No pricing configured for currency: ${currency.toUpperCase()}`);
      }

      console.log(`✅ [PricingService] Loaded ${dbPricing.length} prices from database for ${currency}`);
      return dbPricing;

    } catch (error) {
      console.error(`❌ [PricingService] Error fetching pricing:`, error);
      throw error;
    }
  }

  /**
   * Get pricing from database
   * @param {string} currency - Currency code
   * @returns {Array} - Array of pricing options from database
   */
  async getPricingFromDatabase(currency) {
    const result = await sequelize.query(`
      SELECT
        id,
        credits,
        amount,
        currency,
        stripe_price_id,
        popular,
        active,
        display_order
      FROM credit_pricing
      WHERE currency = $1 AND active = true
      ORDER BY display_order ASC, amount ASC
    `, {
      bind: [currency.toLowerCase()],
      type: sequelize.QueryTypes.SELECT
    });

    return result;
  }

  /**
   * Get all available currencies
   * @returns {Array} - Array of currency codes
   */
  async getAvailableCurrencies() {
    try {
      const result = await sequelize.query(`
        SELECT DISTINCT currency
        FROM credit_pricing
        WHERE active = true
        ORDER BY currency ASC
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      if (!result || result.length === 0) {
        throw new Error('No currencies configured in credit_pricing table');
      }

      return result.map(r => r.currency);
    } catch (error) {
      console.error(`❌ [PricingService] Error fetching currencies:`, error);
      throw error;
    }
  }

  /**
   * Get price details by Stripe Price ID
   * @param {string} stripePriceId - Stripe Price ID
   * @returns {object} - Price details
   */
  async getPriceByStripeId(stripePriceId) {
    try {
      const [result] = await sequelize.query(`
        SELECT
          id,
          credits,
          amount,
          currency,
          stripe_price_id,
          popular
        FROM credit_pricing
        WHERE stripe_price_id = $1 AND active = true
      `, {
        bind: [stripePriceId],
        type: sequelize.QueryTypes.SELECT
      });

      return result;
    } catch (error) {
      console.error(`❌ [PricingService] Error fetching price by Stripe ID:`, error);
      return null;
    }
  }

  /**
   * Sync pricing from Stripe (for future implementation)
   * This would fetch all Stripe prices and update the database
   */
  async syncPricingFromStripe() {
    // TODO: Implement Stripe price syncing
    console.log('⚠️ [PricingService] Stripe price syncing not yet implemented');
  }
}

module.exports = new PricingService();
