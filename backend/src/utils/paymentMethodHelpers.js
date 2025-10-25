/**
 * Payment Method Helpers for Normalized Translations
 *
 * These helpers fetch translations from the normalized payment_method_translations table
 * and merge them with payment method data.
 */

const { sequelize } = require('../database/connection');

/**
 * Get payment methods with translations from normalized table
 *
 * @param {Object} where - WHERE clause conditions
 * @param {string} lang - Language code (default: 'en')
 * @returns {Promise<Array>} Payment methods with translated fields
 */
async function getPaymentMethodsWithTranslations(where = {}, lang = 'en') {
  console.log('🔍 [Helper] getPaymentMethodsWithTranslations called with:', { where, lang });

  const whereConditions = Object.entries(where)
    .map(([key, value]) => {
      if (value === true || value === false) {
        return `pm.${key} = ${value}`;
      }
      if (Array.isArray(value)) {
        return `pm.${key} IN (${value.map(v => `'${v}'`).join(', ')})`;
      }
      return `pm.${key} = '${value}'`;
    })
    .join(' AND ');

  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';

  const query = `
    SELECT
      pm.id,
      pm.code,
      pm.type,
      pm.is_active,
      pm.sort_order,
      pm.settings,
      pm.fee_type,
      pm.fee_amount,
      pm.min_amount,
      pm.max_amount,
      pm.availability,
      pm.countries,
      pm.store_id,
      pm.created_at,
      pm.updated_at,
      pm.name as pm_name,
      pmt.name as pmt_name,
      pmt_en.name as pmt_en_name,
      COALESCE(pmt.name, pmt_en.name, pm.name) as name,
      COALESCE(pmt.description, pmt_en.description, pm.description) as description
    FROM payment_methods pm
    LEFT JOIN payment_method_translations pmt
      ON pm.id = pmt.payment_method_id AND pmt.language_code = :lang
    LEFT JOIN payment_method_translations pmt_en
      ON pm.id = pmt_en.payment_method_id AND pmt_en.language_code = 'en'
    ${whereClause}
    ORDER BY pm.sort_order ASC, pm.created_at DESC
  `;

  console.log('📋 [Helper] Executing SQL query with lang:', lang);

  const results = await sequelize.query(query, {
    replacements: { lang },
    type: sequelize.QueryTypes.SELECT
  });

  console.log(`📦 [Helper] Query returned ${results.length} payment methods`);

  if (results.length > 0) {
    console.log('📝 [Helper] First payment method details:', {
      id: results[0].id,
      code: results[0].code,
      pm_name: results[0].pm_name,
      pmt_name: results[0].pmt_name,
      pmt_en_name: results[0].pmt_en_name,
      final_name: results[0].name,
      lang: lang
    });
  }

  // Remove debug fields before returning
  const cleanResults = results.map(({ pm_name, pmt_name, pmt_en_name, ...rest }) => rest);

  return cleanResults;
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
      pm.is_active,
      pm.sort_order,
      pm.settings,
      pm.fee_type,
      pm.fee_amount,
      pm.min_amount,
      pm.max_amount,
      pm.availability,
      pm.countries,
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
