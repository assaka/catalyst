// Utility functions for safe price formatting and calculations

// Store context - will be set by useStore hook
let _storeContext = null;

/**
 * Internal function to set store context
 * This should be called by a React component using useStore()
 * @param {Object} context - The store context from useStore()
 */
export const _setStoreContext = (context) => {
    _storeContext = context;
};

/**
 * Internal function to get store context
 * @returns {Object} - The store context
 */
const _getStoreContext = () => {
    if (!_storeContext) {
        console.error('❌ Price utils: Store context not initialized! Make sure PriceUtilsProvider wraps your app.');
        return null;
    }
    return _storeContext;
};

/**
 * Safely converts a value to a number, returning 0 if invalid
 * @param {any} value - The value to convert
 * @returns {number} - The parsed number or 0
 */
export const formatPrice = (value) => {
    // Handle null, undefined, empty string, or invalid types
    if (value === null || value === undefined || value === '' || typeof value === 'object') {
        return 0;
    }
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
 * IMPORTANT: This function should ALWAYS receive a currency symbol from settings
 * If you see an error, it means the currency symbol is not being passed correctly
 * @param {any} value - The price value
 * @param {string} symbol - Currency symbol (REQUIRED - should come from settings)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - The formatted price with currency symbol
 */
export const formatCurrency = (value, symbol, decimals = 2) => {
    if (!symbol) {
        console.error('❌ formatCurrency called without currency symbol!', new Error().stack);
        symbol = '❌'; // Show error symbol so it's obvious something is wrong
    }
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
    if (price <= 0) {
        return 0;
    }

    // Handle missing store or settings gracefully
    const settings = store?.settings || {};
    const displayTaxInclusive = settings.display_tax_inclusive_prices || false;
    const defaultTaxIncludedInPrices = settings.default_tax_included_in_prices || false;

    // If tax display setting is same as input setting, no calculation needed
    if (displayTaxInclusive === defaultTaxIncludedInPrices) {
        return price;
    }

    // Handle missing or invalid tax rules
    if (!Array.isArray(taxRules)) {
        return price;
    }

    // Find applicable tax rate
    const taxRate = getApplicableTaxRate(taxRules, country);

    if (taxRate === 0) {
        return price;
    }

    let calculatedPrice = price;

    if (displayTaxInclusive && !defaultTaxIncludedInPrices) {
        // Show tax-inclusive price when products don't include tax
        calculatedPrice = price * (1 + taxRate / 100);
    } else if (!displayTaxInclusive && defaultTaxIncludedInPrices) {
        // Show tax-exclusive price when products include tax
        calculatedPrice = price / (1 + taxRate / 100);
    }

    return calculatedPrice;
};

/**
 * Get applicable tax rate for a country
 * @param {Array} taxRules - Array of tax rules
 * @param {string} country - Country code
 * @returns {number} - Tax rate percentage
 */
export const getApplicableTaxRate = (taxRules, country = 'US') => {

    if (!taxRules || taxRules.length === 0) {
        return 0;
    }

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
        
        const rate = parseFloat(countryRate?.rate) || 0;
        return rate;
    }

    // Fallback to default rule
    const defaultRule = taxRules.find(rule => rule.is_default && rule.is_active);

    if (defaultRule && defaultRule.country_rates) {
        const usRate = defaultRule.country_rates.find(rate => 
            rate.country && rate.country.toUpperCase() === 'US'
        );
        const rate = parseFloat(usRate?.rate) || 0;
        return rate;
    }

    return 0;
};

/**
 * Format price with tax consideration for display (CONTEXT-AWARE VERSION)
 * This function automatically gets currency symbol and store from context
 * @param {number} basePrice - Base price
 * @param {Array} taxRules - Tax rules (optional, defaults to context taxes)
 * @param {string} country - Country code (optional, defaults to context selectedCountry)
 * @returns {string} - Formatted price string
 */
export const formatDisplayPrice = (basePrice, taxRules = null, country = null) => {
    // Handle invalid basePrice input
    if (basePrice === null || basePrice === undefined || basePrice === '') {
        console.warn('⚠️ formatDisplayPrice: Invalid basePrice received:', basePrice);
        // Still need context for currency symbol even for zero price
        const context = _getStoreContext();
        if (!context) return '❌0.00';
        const currencySymbol = context.settings?.currency_symbol || '❌';
        return formatCurrency(0, currencySymbol);
    }

    // Get store context
    const context = _getStoreContext();
    if (!context) {
        console.error('❌ formatDisplayPrice: No store context available!');
        return `❌${basePrice.toFixed(2)}`;
    }

    // Extract values from context
    const currencySymbol = context.settings?.currency_symbol;
    const store = context.store;
    const contextTaxes = context.taxes || [];
    const contextCountry = context.selectedCountry || 'US';

    // Use provided values or fall back to context
    const finalTaxRules = taxRules !== null ? taxRules : contextTaxes;
    const finalCountry = country !== null ? country : contextCountry;

    // Validate currency symbol
    if (!currencySymbol) {
        console.error('❌ formatDisplayPrice: currency_symbol not found in context!', {
            hasContext: !!context,
            hasSettings: !!context.settings,
            settingsKeys: context.settings ? Object.keys(context.settings) : []
        });
    }

    const displayPrice = calculateDisplayPrice(basePrice, store, finalTaxRules, finalCountry);
    const formattedPrice = formatCurrency(displayPrice, currencySymbol || '❌');

    return formattedPrice;
};

/**
 * Legacy version of formatDisplayPrice for backward compatibility
 * This accepts all parameters explicitly (non-context version)
 * @deprecated Use the context-aware version instead
 * @param {number} basePrice - Base price
 * @param {string} currencySymbol - Currency symbol
 * @param {Object} store - Store object
 * @param {Array} taxRules - Tax rules
 * @param {string} country - Country code
 * @returns {string} - Formatted price string
 */
export const formatDisplayPriceLegacy = (basePrice, currencySymbol, store, taxRules = [], country = 'US') => {
    // Handle invalid basePrice input
    if (basePrice === null || basePrice === undefined || basePrice === '') {
        console.warn('⚠️ formatDisplayPrice: Invalid basePrice received:', basePrice);
        return formatCurrency(0, currencySymbol);
    }

    // Validate currency symbol is provided
    if (!currencySymbol) {
        console.error('❌ formatDisplayPrice called without currency symbol!', new Error().stack);
        console.error('❌ This should come from settings.currency_symbol');
        currencySymbol = '❌';
    }

    const displayPrice = calculateDisplayPrice(basePrice, store, taxRules, country);
    const formattedPrice = formatCurrency(displayPrice, currencySymbol);

    return formattedPrice;
};