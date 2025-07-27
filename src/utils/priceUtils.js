// Utility functions for safe price formatting and calculations

/**
 * Safely converts a value to a number, returning 0 if invalid
 * @param {any} value - The value to convert
 * @returns {number} - The parsed number or 0
 */
export const formatPrice = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

/**
 * Safely formats a price value with toFixed, preventing toFixed errors
 * @param {any} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - The formatted price string
 */
export const safeToFixed = (value, decimals = 2) => {
    const num = formatPrice(value);
    return num.toFixed(decimals);
};

/**
 * Formats a price with currency symbol
 * @param {any} value - The price value
 * @param {string} symbol - Currency symbol (default: '$')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - The formatted price with currency symbol
 */
export const formatCurrency = (value, symbol = '$', decimals = 2) => {
    return `${symbol}${safeToFixed(value, decimals)}`;
};

/**
 * Calculates total price for an item including options
 * @param {Object} item - Cart item
 * @param {Object} product - Product details
 * @returns {number} - Total price for the item
 */
export const calculateItemTotal = (item, product) => {
    if (!item || !product) return 0;

    let basePrice = formatPrice(item.price);
    if (basePrice <= 0) {
        basePrice = formatPrice(product.sale_price || product.price);
    }
    
    let optionsPrice = 0;
    if (item.selected_options && Array.isArray(item.selected_options)) {
        optionsPrice = item.selected_options.reduce((sum, option) => sum + formatPrice(option.price), 0);
    }
    
    return (basePrice + optionsPrice) * (formatPrice(item.quantity) || 1);
};

/**
 * Calculates display price considering tax-inclusive settings
 * @param {number} basePrice - The base price of the product
 * @param {Object} store - Store object with settings
 * @param {Array} taxRules - Array of tax rules
 * @param {string} country - Country code for tax calculation (default: 'US')
 * @returns {number} - Price adjusted for tax-inclusive display
 */
export const calculateDisplayPrice = (basePrice, store, taxRules = [], country = 'US') => {
    const price = formatPrice(basePrice);
    if (price <= 0) return 0;

    const settings = store?.settings || {};
    const displayTaxInclusive = settings.display_tax_inclusive_prices || false;
    const defaultTaxIncludedInPrices = settings.default_tax_included_in_prices || false;

    // If tax display setting is same as input setting, no calculation needed
    if (displayTaxInclusive === defaultTaxIncludedInPrices) {
        return price;
    }

    // Find applicable tax rate
    const taxRate = getApplicableTaxRate(taxRules, country);
    if (taxRate === 0) {
        return price;
    }

    if (displayTaxInclusive && !defaultTaxIncludedInPrices) {
        // Show tax-inclusive price when products don't include tax
        return price * (1 + taxRate / 100);
    } else if (!displayTaxInclusive && defaultTaxIncludedInPrices) {
        // Show tax-exclusive price when products include tax
        return price / (1 + taxRate / 100);
    }

    return price;
};

/**
 * Get applicable tax rate for a country
 * @param {Array} taxRules - Array of tax rules
 * @param {string} country - Country code
 * @returns {number} - Tax rate percentage
 */
export const getApplicableTaxRate = (taxRules, country = 'US') => {
    if (!taxRules || taxRules.length === 0) return 0;

    // Find rules with country rates
    const rulesWithCountry = taxRules.filter(rule => 
        rule.is_active && 
        rule.country_rates && 
        rule.country_rates.some(rate => 
            rate.country && rate.country.toUpperCase() === country.toUpperCase()
        )
    );

    if (rulesWithCountry.length > 0) {
        const rule = rulesWithCountry.find(r => r.is_default) || rulesWithCountry[0];
        const countryRate = rule.country_rates.find(rate => 
            rate.country && rate.country.toUpperCase() === country.toUpperCase()
        );
        return parseFloat(countryRate?.rate) || 0;
    }

    // Fallback to default rule
    const defaultRule = taxRules.find(rule => rule.is_default && rule.is_active);
    if (defaultRule && defaultRule.country_rates) {
        const usRate = defaultRule.country_rates.find(rate => 
            rate.country && rate.country.toUpperCase() === 'US'
        );
        return parseFloat(usRate?.rate) || 0;
    }

    return 0;
};

/**
 * Format price with tax consideration for display
 * @param {number} basePrice - Base price
 * @param {string} currencySymbol - Currency symbol
 * @param {Object} store - Store object
 * @param {Array} taxRules - Tax rules
 * @param {string} country - Country code
 * @returns {string} - Formatted price string
 */
export const formatDisplayPrice = (basePrice, currencySymbol = '$', store, taxRules = [], country = 'US') => {
    const displayPrice = calculateDisplayPrice(basePrice, store, taxRules, country);
    return formatCurrency(displayPrice, currencySymbol);
};