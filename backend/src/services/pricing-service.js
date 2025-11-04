const { sequelize } = require('../database/connection');

/**
 * Credit Pricing Service
 * Manages credit package pricing with Stripe Price IDs for different currencies
 */
class PricingService {
  constructor() {
    // Default pricing configuration
    // These should be replaced with actual Stripe Price IDs from your Stripe dashboard
    this.defaultPricing = {
      usd: [
        {
          credits: 100,
          amount: 10,
          currency: 'usd',
          stripe_price_id: null, // TODO: Replace with actual Stripe Price ID (e.g., 'price_xxx')
          popular: false
        },
        {
          credits: 550,
          amount: 50,
          currency: 'usd',
          stripe_price_id: null, // TODO: Replace with actual Stripe Price ID
          popular: true
        },
        {
          credits: 1200,
          amount: 100,
          currency: 'usd',
          stripe_price_id: null, // TODO: Replace with actual Stripe Price ID
          popular: false
        }
      ],
      eur: [
        {
          credits: 100,
          amount: 9,
          currency: 'eur',
          stripe_price_id: null, // TODO: Replace with actual Stripe Price ID
          popular: false
        },
        {
          credits: 550,
          amount: 46,
          currency: 'eur',
          stripe_price_id: null, // TODO: Replace with actual Stripe Price ID
          popular: true
        },
        {
          credits: 1200,
          amount: 92,
          currency: 'eur',
          stripe_price_id: null, // TODO: Replace with actual Stripe Price ID
          popular: false
        }
      ]
    };
  }

  /**
   * Get credit pricing for a specific currency
   * @param {string} currency - Currency code (usd, eur)
   * @returns {Array} - Array of pricing options
   */
  async getPricingForCurrency(currency = 'usd') {
    console.log(`💰 [PricingService] Getting pricing for currency: ${currency}`);

    try {
      // Try to get pricing from database
      const dbPricing = await this.getPricingFromDatabase(currency);

      if (dbPricing && dbPricing.length > 0) {
        console.log(`✅ [PricingService] Loaded ${dbPricing.length} prices from database for ${currency}`);
        return dbPricing;
      }

      // Fallback to default pricing
      console.log(`⚠️ [PricingService] No database pricing found, using defaults for ${currency}`);
      return this.defaultPricing[currency.toLowerCase()] || this.defaultPricing.usd;

    } catch (error) {
      console.error(`❌ [PricingService] Error fetching pricing:`, error);
      // Return default pricing on error
      return this.defaultPricing[currency.toLowerCase()] || this.defaultPricing.usd;
    }
  }

  /**
   * Get pricing from database
   * @param {string} currency - Currency code
   * @returns {Array} - Array of pricing options from database
   */
  async getPricingFromDatabase(currency) {
    try {
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
    } catch (error) {
      // Table might not exist yet
      if (error.message.includes('does not exist')) {
        console.log(`ℹ️ [PricingService] credit_pricing table does not exist, using defaults`);
        return [];
      }
      throw error;
    }
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

      if (result && result.length > 0) {
        return result.map(r => r.currency);
      }

      // Default currencies if no database
      return ['usd', 'eur'];
    } catch (error) {
      console.error(`❌ [PricingService] Error fetching currencies:`, error);
      return ['usd', 'eur'];
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
