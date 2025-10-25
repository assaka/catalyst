/**
 * Utility functions for working with attributes and their translations
 */

/**
 * Get the translated label for an attribute
 * Falls back to base name if translation not available
 *
 * @param {Object} attribute - The attribute object
 * @param {string} lang - Language code (e.g., 'en', 'nl')
 * @returns {string} Translated label or base name
 */
export function getAttributeLabel(attribute, lang = 'en') {
  if (!attribute) return '';

  // Try to get translated label
  const translatedLabel = attribute.translations?.[lang]?.label;

  // Fall back to base name
  return translatedLabel || attribute.name || attribute.code || '';
}

/**
 * Get the translated label for an attribute value
 * Falls back to code if translation not available
 *
 * @param {Object} attributeValue - The attribute value object
 * @param {string} lang - Language code (e.g., 'en', 'nl')
 * @returns {string} Translated label or code
 */
export function getAttributeValueLabel(attributeValue, lang = 'en') {
  if (!attributeValue) return '';

  // Try to get translated label
  const translatedLabel = attributeValue.translations?.[lang]?.label;

  // Fall back to code
  return translatedLabel || attributeValue.code || '';
}

/**
 * Get all attribute values with their translated labels
 *
 * @param {Object} attribute - The attribute object with values
 * @param {string} lang - Language code (e.g., 'en', 'nl')
 * @returns {Array} Array of value objects with translated labels
 */
export function getAttributeValuesWithLabels(attribute, lang = 'en') {
  if (!attribute?.values) return [];

  return attribute.values.map(value => ({
    ...value,
    label: getAttributeValueLabel(value, lang)
  }));
}
