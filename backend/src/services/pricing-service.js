const { masterDbClient } = require('../database/masterConnection');

/**
 * Credit Pricing Service
 * Manages credit package pricing with Stripe Price IDs for different currencies
 * Uses Supabase (masterDbClient) for database operations
 */
class PricingService {
  /**
   * Get credit pricing for a specific currency
   * @param {string} currency - Currency code (usd, eur)
   * @returns {Array} - Array of pricing options
   */
  async getPricingForCurrency(currency = 'usd') {
    console.log(`💰 [PricingService] Getting pricing for currency: ${currency}`);

    try {
      const { data, error } = await masterDbClient
        .from('credit_pricing')
        .select('id, credits, amount, currency, stripe_price_id, popular, active, display_order')
        .eq('currency', currency.toLowerCase())
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('amount', { ascending: true });

      if (error) {
        console.error(`❌ [PricingService] Database error:`, error);
        throw new Error(`Failed to fetch pricing: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error(`❌ [PricingService] No pricing found in database for ${currency}`);
        throw new Error(`No pricing configured for currency: ${currency.toUpperCase()}`);
      }

      console.log(`✅ [PricingService] Loaded ${data.length} prices from database for ${currency}`);
      return data;

    } catch (error) {
      console.error(`❌ [PricingService] Error fetching pricing:`, error);
      throw error;
    }
  }

  /**
   * Get all available currencies
   * @returns {Array} - Array of currency codes
   */
  async getAvailableCurrencies() {
    try {
      const { data, error } = await masterDbClient
        .from('credit_pricing')
        .select('currency')
        .eq('active', true);

      if (error) {
        console.error(`❌ [PricingService] Database error:`, error);
        throw new Error(`Failed to fetch currencies: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No currencies configured in credit_pricing table');
      }

      // Get unique currencies
      const currencies = [...new Set(data.map(r => r.currency))].sort();
      return currencies;
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
      const { data, error } = await masterDbClient
        .from('credit_pricing')
        .select('id, credits, amount, currency, stripe_price_id, popular')
        .eq('stripe_price_id', stripePriceId)
        .eq('active', true)
        .single();

      if (error) {
        console.error(`❌ [PricingService] Error fetching price by Stripe ID:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`❌ [PricingService] Error fetching price by Stripe ID:`, error);
      return null;
    }
  }

  /**
   * Get default pricing (fallback if database is empty)
   */
  getDefaultPricing(currency = 'usd') {
    return [
      { credits: 100, amount: 10, currency, popular: false },
      { credits: 500, amount: 45, currency, popular: true },
      { credits: 1000, amount: 80, currency, popular: false }
    ];
  }
}

module.exports = new PricingService();
