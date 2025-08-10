/**
 * Data validation utilities for preventing common data integrity issues
 */

/**
 * Validates and sanitizes numeric fields to prevent [object Object] database errors
 * @param {Object} product - Product object to validate
 * @param {Array<string>} numericFields - Array of field names that should contain numeric values
 * @returns {Object} - Sanitized product object
 */
function sanitizeNumericFields(product, numericFields = ['price', 'compare_price', 'cost_price', 'weight']) {
  if (!product || typeof product !== 'object') {
    return product;
  }

  // Create a copy to avoid mutating the original object
  const sanitizedProduct = { ...product };

  // CRITICAL SAFETY CHECK: Prevent [object Object] in numeric fields at model level
  numericFields.forEach(field => {
    if (sanitizedProduct[field] !== null && sanitizedProduct[field] !== undefined) {
      const stringValue = String(sanitizedProduct[field]);
      if (stringValue === '[object Object]' || stringValue.includes('[object Object]')) {
        console.error(`🚨 MODEL SAFETY: Preventing [object Object] in ${field} for product ${sanitizedProduct.sku || 'unknown'}`);
        console.error(`   Original value:`, sanitizedProduct[field]);
        console.error(`   String representation: "${stringValue}"`);
        sanitizedProduct[field] = null; // Set to null to prevent database error
      }
    }
  });

  return sanitizedProduct;
}

/**
 * Validates numeric field value and converts to appropriate type
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for logging
 * @param {string} context - Context for logging (e.g., product SKU)
 * @returns {number|null} - Validated numeric value or null
 */
function validateNumericField(value, fieldName = 'unknown', context = 'unknown') {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Check for object injection
  const stringValue = String(value);
  if (stringValue === '[object Object]' || stringValue.includes('[object Object]')) {
    console.error(`🚨 VALIDATION: [object Object] detected in ${fieldName} for ${context}`);
    console.error(`   Original value:`, value);
    console.error(`   String representation: "${stringValue}"`);
    return null;
  }

  // Try to convert to number
  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    console.warn(`⚠️ VALIDATION: Invalid numeric value in ${fieldName} for ${context}: "${value}"`);
    return null;
  }

  return numericValue;
}

/**
 * Sanitizes an array of products to prevent data integrity issues
 * @param {Array<Object>} products - Array of products to sanitize
 * @param {Array<string>} numericFields - Array of field names that should contain numeric values
 * @returns {Array<Object>} - Array of sanitized products
 */
function sanitizeProducts(products, numericFields = ['price', 'compare_price', 'cost_price', 'weight']) {
  if (!Array.isArray(products)) {
    return products;
  }

  return products.map(product => sanitizeNumericFields(product, numericFields));
}

/**
 * Validates and sanitizes product data specifically for Akeneo imports
 * @param {Object} product - Product object from Akeneo transformation
 * @returns {Object} - Sanitized product object safe for database operations
 */
function sanitizeAkeneoProduct(product) {
  const akeneoNumericFields = [
    'price', 'sale_price', 'compare_price', 'cost_price', 'special_price',
    'weight', 'stock_quantity', 'low_stock_threshold'
  ];
  
  return sanitizeNumericFields(product, akeneoNumericFields);
}

module.exports = {
  sanitizeNumericFields,
  validateNumericField,
  sanitizeProducts,
  sanitizeAkeneoProduct
};