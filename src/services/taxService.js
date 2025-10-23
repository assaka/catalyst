class TaxService {
  /**
   * Calculate tax for cart items based on store settings and tax rules
   * @param {Array} cartItems - Array of cart items with quantities
   * @param {Object} cartProducts - Map of product IDs to product data
   * @param {Object} store - Store object with settings
   * @param {Array} taxRules - Array of tax rules for the store
   * @param {Object} shippingAddress - Customer shipping address
   * @param {number} subtotal - Subtotal before tax
   * @param {number} discount - Discount amount
   * @returns {Object} - Tax calculation result
   */
  calculateTax(cartItems, cartProducts, store, taxRules, shippingAddress, subtotal, discount = 0) {
    try {
      // If no tax rules exist, return 0 tax
      if (!taxRules || taxRules.length === 0) {
        return {
          taxAmount: 0,
          taxDetails: [],
          effectiveRate: 0
        };
      }

      // Get store settings with defaults
      const settings = store?.settings || {};
      const calculateTaxAfterDiscount = settings.calculate_tax_after_discount !== false; // default to true
      const defaultTaxIncludedInPrices = settings.default_tax_included_in_prices || false;

      // Calculate the taxable amount
      let taxableAmount = subtotal;
      if (calculateTaxAfterDiscount) {
        taxableAmount = Math.max(0, subtotal - discount);
      }

      // Find applicable tax rule
      const applicableTaxRule = this.findApplicableTaxRule(taxRules, shippingAddress);
      
      if (!applicableTaxRule) {
        return {
          taxAmount: 0,
          taxDetails: [],
          effectiveRate: 0
        };
      }

      // Get tax rate for the shipping country
      const taxRate = this.getTaxRateForCountry(applicableTaxRule, shippingAddress?.country || 'US');

      if (taxRate === 0) {
        return {
          taxAmount: 0,
          taxDetails: [],
          effectiveRate: 0
        };
      }

      // Calculate tax amount
      let taxAmount = 0;
      
      if (defaultTaxIncludedInPrices) {
        // Tax is already included in prices, calculate the tax portion
        taxAmount = taxableAmount * (taxRate / (100 + taxRate));
      } else {
        // Tax is not included, add it on top
        taxAmount = taxableAmount * (taxRate / 100);
      }

      const result = {
        taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
        taxDetails: [{
          ruleName: applicableTaxRule.name,
          rate: taxRate,
          taxableAmount,
          amount: taxAmount
        }],
        effectiveRate: taxRate,
        taxIncludedInPrices: defaultTaxIncludedInPrices
      };

      return result;

    } catch (error) {
      console.error('❌ Error calculating tax:', error);
      return {
        taxAmount: 0,
        taxDetails: [],
        effectiveRate: 0,
        error: error.message
      };
    }
  }

  /**
   * Find the applicable tax rule for the given address
   * @param {Array} taxRules - Array of tax rules
   * @param {Object} shippingAddress - Customer shipping address
   * @returns {Object|null} - Applicable tax rule or null
   */
  findApplicableTaxRule(taxRules, shippingAddress) {
    const country = shippingAddress?.country || 'US';

    // First, try to find a rule that has rates for the specific country
    const rulesWithCountry = taxRules.filter(rule => 
      rule.is_active && 
      rule.country_rates && 
      rule.country_rates.some(rate => 
        rate.country && rate.country.toUpperCase() === country.toUpperCase()
      )
    );

    if (rulesWithCountry.length > 0) {
      // Prefer default rule if it has country rates
      const defaultRuleWithCountry = rulesWithCountry.find(rule => rule.is_default);
      if (defaultRuleWithCountry) {
        return defaultRuleWithCountry;
      }
      // Otherwise use the first rule with country rates
      return rulesWithCountry[0];
    }

    // Fallback: find the default tax rule
    const defaultRule = taxRules.find(rule => rule.is_default && rule.is_active);
    if (defaultRule) {
      return defaultRule;
    }

    // Final fallback: use the first active rule
    const firstActiveRule = taxRules.find(rule => rule.is_active);
    if (firstActiveRule) {
      return firstActiveRule;
    }

    return null;
  }

  /**
   * Get tax rate for a specific country from a tax rule
   * @param {Object} taxRule - Tax rule object
   * @param {string} country - Country code (e.g., 'US', 'GB')
   * @returns {number} - Tax rate percentage
   */
  getTaxRateForCountry(taxRule, country = 'US') {
    console.log('🔍 getTaxRateForCountry - looking for country:', country);
    console.log('🔍 Available country rates:', taxRule.country_rates);

    if (!taxRule.country_rates || !Array.isArray(taxRule.country_rates)) {
      console.log('❌ No country_rates found');
      return 0;
    }

    // Find rate for the specific country
    const countryRate = taxRule.country_rates.find(rate =>
      rate.country && rate.country.toUpperCase() === country.toUpperCase()
    );

    if (countryRate) {
      console.log('✅ Found country rate:', countryRate);
      return parseFloat(countryRate.rate) || 0;
    }

    console.log('⚠️ Country not found, falling back to US');

    // If country not found, try to find a default rate (US)
    const defaultRate = taxRule.country_rates.find(rate =>
      rate.country && rate.country.toUpperCase() === 'US'
    );

    return defaultRate ? (parseFloat(defaultRate.rate) || 0) : 0;
  }
}

// Export singleton instance
const taxService = new TaxService();
export default taxService;