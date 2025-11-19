/**
 * Payment Method Helpers for Normalized Translations
 *
 * These helpers fetch translations from the normalized payment_method_translations table
 * and merge them with payment method data.
 */

const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get payment methods with translations from normalized table
 *
 * @param {string} storeId - Store ID
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} Payment methods with translated fields
 */
async function getPaymentMethodsWithTranslations(storeId, where = {}, lang = 'en') {
  console.log('🔍 [Helper] getPaymentMethodsWithTranslations called with:', { storeId, where, lang });

  const tenantDb = await ConnectionManager.getStoreConnection(storeId);

  // Fetch payment methods
  let methodsQuery = tenantDb.from('payment_methods').select('*');

  // Apply where conditions
  for (const [key, value] of Object.entries(where)) {
    methodsQuery = methodsQuery.eq(key, value);
  }

  methodsQuery = methodsQuery.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

  const { data: methods, error: methodsError } = await methodsQuery;

  if (methodsError) {
    console.error('Error fetching payment_methods:', methodsError);
    throw methodsError;
  }

  if (!methods || methods.length === 0) {
    return [];
  }

  // Fetch translations
  const methodIds = methods.map(m => m.id);
  const { data: translations, error: transError } = await tenantDb
    .from('payment_method_translations')
    .select('*')
    .in('payment_method_id', methodIds)
    .in('language_code', [lang, 'en']);

  if (transError) {
    console.error('Error fetching payment_method_translations:', transError);
    throw transError;
  }

  // Build translation map
  const transMap = {};
  (translations || []).forEach(t => {
    if (!transMap[t.payment_method_id]) transMap[t.payment_method_id] = {};
    transMap[t.payment_method_id][t.language_code] = t;
  });

  // Merge methods with translations
  const results = methods.map(method => {
    const trans = transMap[method.id];
    const reqLang = trans?.[lang];
    const enLang = trans?.['en'];

    return {
      ...method,
      name: reqLang?.name || enLang?.name || method.name || method.code,
      description: reqLang?.description || enLang?.description || method.description || null
    };
  });

  console.log(`📦 [Helper] Query returned ${results.length} payment methods`);

  if (results.length > 0) {
    console.log('📝 [Helper] First payment method:', {
      id: results[0].id,
      code: results[0].code,
      name: results[0].name,
      lang: lang
    });
  }

  return results;
}

/**
 * Get single payment method with translations
 *
 * @param {string} id - Payment method ID
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Object|null>} Payment method with translated fields
 */
async function getPaymentMethodById(id, lang = 'en') {
  const query = `
    SELECT
      pm.id,
      pm.code,
      pm.type,
      pm.payment_flow,
      pm.is_active,
      pm.sort_order,
      pm.settings,
      pm.fee_type,
      pm.fee_amount,
      pm.min_amount,
      pm.max_amount,
      pm.availability,
      pm.countries,
      pm.conditions,
      pm.store_id,
      pm.created_at,
      pm.updated_at,
      COALESCE(pmt.name, pmt_en.name, pm.name) as name,
      COALESCE(pmt.description, pmt_en.description, pm.description) as description
    FROM payment_methods pm
    LEFT JOIN payment_method_translations pmt
      ON pm.id = pmt.payment_method_id AND pmt.language_code = :lang
    LEFT JOIN payment_method_translations pmt_en
      ON pm.id = pmt_en.payment_method_id AND pmt_en.language_code = 'en'
    WHERE pm.id = :id
  `;

  const results = await sequelize.query(query, {
    replacements: { id, lang },
    type: sequelize.QueryTypes.SELECT
  });

  return results[0] || null;
}

module.exports = {
  getPaymentMethodsWithTranslations,
  getPaymentMethodById
};
