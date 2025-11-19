const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Get translation by key and language code
 * Falls back to English if translation not found for the language
 * Falls back to the key itself if no translation found at all
 * @param {string} key - Translation key
 * @param {string} languageCode - Language code (default: 'en')
 * @param {string} storeId - Store ID for tenant database access
 */
async function getTranslation(key, languageCode = 'en', storeId) {
  if (!storeId) {
    console.error('translationHelper: storeId is required');
    return key;
  }

  try {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Try to get translation for requested language
    let { data: translation, error } = await tenantDb
      .from('translations')
      .select('value')
      .eq('key', key)
      .eq('language_code', languageCode)
      .maybeSingle();

    if (error) {
      console.error('Translation query error:', error);
    }

    // Fallback to English if not found
    if (!translation && languageCode !== 'en') {
      const { data: enTranslation } = await tenantDb
        .from('translations')
        .select('value')
        .eq('key', key)
        .eq('language_code', 'en')
        .maybeSingle();

      translation = enTranslation;
    }

    return translation ? translation.value : key;
  } catch (error) {
    console.error('Translation error:', error);
    return key;
  }
}

module.exports = { getTranslation };
