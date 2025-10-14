/**
 * Translation helper for getting translated text
 * Used in React components that need runtime translations
 */

/**
 * Get translated text for a key
 * @param {string} key - Translation key
 * @param {Object} settings - Store settings with ui_translations
 * @returns {string} - Translated text or fallback
 */
export function t(key, settings) {
  // Get current language from localStorage
  const currentLang = typeof localStorage !== 'undefined'
    ? localStorage.getItem('catalyst_language') || 'en'
    : 'en';

  // Get UI translations from settings
  const uiTranslations = settings?.ui_translations || {};

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Translation lookup:', {
      key,
      currentLang,
      hasUiTranslations: !!settings?.ui_translations,
      hasCurrentLang: !!(uiTranslations[currentLang]),
      hasKey: !!(uiTranslations[currentLang]?.[key]),
      value: uiTranslations[currentLang]?.[key]
    });
  }

  // Try current language first
  if (uiTranslations[currentLang] && uiTranslations[currentLang][key]) {
    return uiTranslations[currentLang][key];
  }

  // Fallback to English
  if (uiTranslations.en && uiTranslations.en[key]) {
    return uiTranslations.en[key];
  }

  // Fallback to key itself (formatted)
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default { t };
