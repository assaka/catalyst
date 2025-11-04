import apiClient from '@/api/client';

/**
 * Frontend Pricing Service
 * Fetches credit pricing and currency information from backend
 */
class PricingService {
  /**
   * Get credit pricing for a specific currency
   * @param {string} currency - Currency code (usd, eur)
   * @returns {Promise<Array>} - Array of pricing options
   */
  async getPricing(currency = 'usd') {
    try {
      const response = await apiClient.get(`credits/pricing?currency=${currency}`);
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching pricing:', error);

      // Return default pricing as fallback
      return this.getDefaultPricing(currency);
    }
  }

  /**
   * Get available currencies
   * @returns {Promise<Array>} - Array of currency codes
   */
  async getCurrencies() {
    try {
      const response = await apiClient.get('credits/currencies');
      return response?.data || ['usd', 'eur'];
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return ['usd', 'eur'];
    }
  }

  /**
   * Get default pricing (fallback)
   * @param {string} currency - Currency code
   * @returns {Array} - Default pricing options
   */
  getDefaultPricing(currency = 'usd') {
    const defaultPricing = {
      usd: [
        { credits: 100, amount: 10, currency: 'usd', popular: false },
        { credits: 550, amount: 50, currency: 'usd', popular: true },
        { credits: 1200, amount: 100, currency: 'usd', popular: false }
      ],
      eur: [
        { credits: 100, amount: 9, currency: 'eur', popular: false },
        { credits: 550, amount: 46, currency: 'eur', popular: true },
        { credits: 1200, amount: 92, currency: 'eur', popular: false }
      ]
    };

    return defaultPricing[currency.toLowerCase()] || defaultPricing.usd;
  }

  /**
   * Format price with currency symbol
   * @param {number} amount - Price amount
   * @param {string} currency - Currency code
   * @returns {string} - Formatted price (e.g., "$10" or "€9")
   */
  formatPrice(amount, currency) {
    const symbol = currency === 'eur' ? '€' : '$';
    return `${symbol}${amount}`;
  }

  /**
   * Get currency symbol
   * @param {string} currency - Currency code
   * @returns {string} - Currency symbol
   */
  getCurrencySymbol(currency) {
    const symbols = {
      usd: '$',
      eur: '€',
      gbp: '£'
    };

    return symbols[currency.toLowerCase()] || '$';
  }
}

export default new PricingService();
