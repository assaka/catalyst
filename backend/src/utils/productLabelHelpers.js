/**
 * Product Label Helpers using JSONB translations column
 *
 * Translations are stored directly in the product_labels.translations JSONB column
 * Format: { "en": { "name": "...", "text": "..." }, "nl": { ... } }
 */

/**
 * Get product labels with translations from JSONB column
 *
 * @param {Object} tenantDb - Tenant database connection (Supabase client)
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en') - ignored if allTranslations is true
 * @param {boolean} allTranslations - If true, returns all translations for all languages
 * @returns {Promise<Array>} Product labels with translated fields
 */
async function getProductLabelsWithTranslations(tenantDb, where = {}, lang = 'en', allTranslations = false) {
  if (!tenantDb) {
    throw new Error('tenantDb connection required');
  }

  // Fetch product labels
  let labelsQuery = tenantDb.from('product_labels').select('*');

  // Apply where conditions
  Object.entries(where).forEach(([key, value]) => {
    labelsQuery = labelsQuery.eq(key, value);
  });

  labelsQuery = labelsQuery.order('sort_order', { ascending: true }).order('priority', { ascending: false });

  const { data: labels, error: labelsError } = await labelsQuery;

  if (labelsError) throw labelsError;
  if (!labels || labels.length === 0) return [];

  // If allTranslations is true, return labels with translations object as-is
  if (allTranslations) {
    return labels.map(label => ({
      ...label,
      translations: label.translations || {}
    }));
  }

  // Single language mode - merge translation into label fields
  return labels.map(label => {
    const trans = label.translations || {};
    const reqLang = trans[lang];
    const enLang = trans['en'];

    return {
      ...label,
      name: reqLang?.name || enLang?.name || label.name,
      text: reqLang?.text || enLang?.text || label.text
    };
  });
}

/**
 * Get single product label with translations
 *
 * @param {Object} tenantDb - Tenant database connection
 * @param {string} id - Product label ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} Product label with translated fields
 */
async function getProductLabelById(tenantDb, id, lang = 'en') {
  const labels = await getProductLabelsWithTranslations(tenantDb, { id }, lang, false);
  return labels[0] || null;
}

/**
 * Get single product label with ALL translations
 * Returns format: { id, name, text, ..., translations: {en: {name, text}, nl: {...}} }
 *
 * @param {Object} tenantDb - Tenant database connection
 * @param {string} id - Product label ID
 * @returns {Promise<Object|null>} Product label with all translations
 */
async function getProductLabelWithAllTranslations(tenantDb, id) {
  const labels = await getProductLabelsWithTranslations(tenantDb, { id }, 'en', true);
  return labels[0] || null;
}

module.exports = {
  getProductLabelsWithTranslations,
  getProductLabelById,
  getProductLabelWithAllTranslations
};
