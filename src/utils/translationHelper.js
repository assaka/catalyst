/**
 * Translation helper for getting translated text
 * Used in React components that need runtime translations
 */

/**
 * Get translated text for a key
 * @param {string} key - Translation key (can be dotted like "common.save" or "order.your_orders")
 * @param {Object} settings - Store settings with ui_translations
 * @returns {string} - Translated text or fallback
 */
export function t(key, settings) {
  // Get current language from localStorage
  const currentLang = typeof localStorage !== 'undefined'
    ? localStorage.getItem('daino_language') || 'en'
    : 'en';

  // Get UI translations from settings
  const uiTranslations = settings?.ui_translations || {};

  // Helper function to navigate nested object with dotted key
  const getNestedValue = (obj, dottedKey) => {
    const keys = dottedKey.split('.');
    let current = obj;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }

    return current;
  };

  // Try current language first
  const currentLangValue = getNestedValue(uiTranslations[currentLang], key);
  if (currentLangValue) {
    return currentLangValue;
  }

  // Fallback to English
  const englishValue = getNestedValue(uiTranslations.en, key);
  if (englishValue) {
    return englishValue;
  }

  // Fallback to key itself (formatted)
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default { t };
