const { Product } = require('../models'); // Tenant DB model

/**
 * Evaluate whether a method's conditions match the given products
 * @param {Object} conditions - The conditions object from payment/shipping method
 * @param {Array} productIds - Array of product IDs in the cart
 * @returns {Promise<boolean>} - Whether conditions are met
 */
async function evaluateConditions(conditions, productIds) {
  // If no conditions are specified or conditions is empty, method is always available
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  // Parse conditions if it's a string
  if (typeof conditions === 'string') {
    try {
      conditions = JSON.parse(conditions);
    } catch (e) {
      console.error('Error parsing conditions:', e);
      return true; // If parsing fails, allow the method
    }
  }

  const { categories, attribute_sets, skus, attribute_conditions } = conditions;

  // If all condition arrays are empty, method is always available
  const hasAnyConditions =
    (categories && categories.length > 0) ||
    (attribute_sets && attribute_sets.length > 0) ||
    (skus && skus.length > 0) ||
    (attribute_conditions && attribute_conditions.length > 0);

  if (!hasAnyConditions) {
    return true;
  }

  // If no products provided, cannot evaluate conditions
  if (!productIds || productIds.length === 0) {
    return true; // Allow by default if we can't evaluate
  }

  // Fetch all products in the cart
  const products = await Product.findAll({
    where: {
      id: productIds
    }
  });

  if (!products || products.length === 0) {
    return true; // Allow by default if products not found
  }

  // Evaluate conditions with OR logic (any match = available)
  for (const product of products) {
    // Check SKU conditions
    if (skus && skus.length > 0 && skus.includes(product.sku)) {
      return true;
    }

    // Check category conditions
    if (categories && categories.length > 0 && product.category_ids && product.category_ids.length > 0) {
      const hasMatchingCategory = categories.some(catId =>
        product.category_ids.includes(catId)
      );
      if (hasMatchingCategory) {
        return true;
      }
    }

    // Check attribute set conditions
    if (attribute_sets && attribute_sets.length > 0 && product.attribute_set_id) {
      if (attribute_sets.includes(product.attribute_set_id)) {
        return true;
      }
    }

    // Check attribute conditions
    if (attribute_conditions && attribute_conditions.length > 0) {
      for (const condition of attribute_conditions) {
        const { attribute_code, attribute_value } = condition;
        if (attribute_code && attribute_value && product[attribute_code] === attribute_value) {
          return true;
        }
      }
    }
  }

  // No conditions matched
  return false;
}

module.exports = {
  evaluateConditions
};
