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