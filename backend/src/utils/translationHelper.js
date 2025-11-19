const { Translation } = require('../models'); // Tenant DB model

/**
 * Get translation by key and language code
 * Falls back to English if translation not found for the language
 * Falls back to the key itself if no translation found at all
 */
async function getTranslation(key, languageCode = 'en') {
  try {
    // Try to get translation for requested language
    let translation = await Translation.findOne({
      where: { key, language_code: languageCode }
    });

    // Fallback to English if not found
    if (!translation && languageCode !== 'en') {
      translation = await Translation.findOne({
        where: { key, language_code: 'en' }
      });
    }

    return translation ? translation.value : key;
  } catch (error) {
    console.error('Translation error:', error);
    return key;
  }
}

module.exports = { getTranslation };
