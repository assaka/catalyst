import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const TranslationContext = createContext();

/**
 * Translation Provider Component
 *
 * Manages translation state and provides translation functions
 * throughout the application.
 */
export function TranslationProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(false);

  /**
   * Load available languages from API
   */
  const loadAvailableLanguages = useCallback(async () => {
    try {
      const response = await api.get('/languages');

      if (response && response.success && response.data) {
        // Handle data structure: response.data.languages or response.data
        const languagesData = response.data.languages || response.data || [];
        const languages = Array.isArray(languagesData)
          ? languagesData.filter(lang => lang.is_active)
          : [];

        if (languages.length > 0) {
          setAvailableLanguages(languages);

          // Set RTL status based on current language
          const current = languages.find(lang => lang.code === currentLanguage);
          if (current) {
            setIsRTL(current.is_rtl || false);
          }
        } else {
          // No active languages found, use English fallback
          setAvailableLanguages([
            { code: 'en', name: 'English', native_name: 'English', is_active: true, is_rtl: false }
          ]);
        }
      } else {
        // Invalid response, use English fallback
        setAvailableLanguages([
          { code: 'en', name: 'English', native_name: 'English', is_active: true, is_rtl: false }
        ]);
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
      // Fallback to English only
      setAvailableLanguages([
        { code: 'en', name: 'English', native_name: 'English', is_active: true, is_rtl: false }
      ]);
    }
  }, [currentLanguage]);

  /**
   * Load UI translations for current language
   */
  const loadTranslations = useCallback(async (lang) => {
    try {
      setLoading(true);
      const response = await api.get(`/translations/ui-labels?lang=${lang}`);

      // API client returns the full backend response for translations endpoints
      // Backend response structure: { success: true, data: { language: 'nl', labels: {...} } }
      if (response && response.success && response.data && response.data.labels) {
        setTranslations(response.data.labels);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      setTranslations({});
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Change current language
   */
  const changeLanguage = useCallback(async (langCode) => {
    // Save to localStorage
    localStorage.setItem('catalyst_language', langCode);

    // Update state
    setCurrentLanguage(langCode);

    // Update RTL status
    const language = availableLanguages.find(lang => lang.code === langCode);
    if (language) {
      setIsRTL(language.is_rtl || false);

      // Update HTML dir attribute for RTL
      document.documentElement.dir = language.is_rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = langCode;
    }

    // Load translations for new language
    await loadTranslations(langCode);
  }, [availableLanguages, loadTranslations]);

  /**
   * Get translated text by key
   */
  const t = useCallback((key, defaultValue = '') => {
    // Support nested keys with dot notation (e.g., "common.button.submit")
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }

    return typeof value === 'string' ? value : defaultValue || key;
  }, [translations]);

  /**
   * Get entity translation (for products, categories, etc.)
   */
  const getEntityTranslation = useCallback((entity, field, fallbackLang = 'en') => {
    if (!entity || !entity.translations) {
      return '';
    }

    // Try current language first
    if (entity.translations[currentLanguage] && entity.translations[currentLanguage][field]) {
      return entity.translations[currentLanguage][field];
    }

    // Fallback to specified language
    if (entity.translations[fallbackLang] && entity.translations[fallbackLang][field]) {
      return entity.translations[fallbackLang][field];
    }

    // Return empty string if not found
    return '';
  }, [currentLanguage]);

  /**
   * Format number according to current locale
   */
  const formatNumber = useCallback((number, options = {}) => {
    try {
      return new Intl.NumberFormat(currentLanguage, options).format(number);
    } catch (error) {
      return number.toString();
    }
  }, [currentLanguage]);

  /**
   * Format currency according to current locale
   */
  const formatCurrency = useCallback((amount, currency = 'USD') => {
    try {
      return new Intl.NumberFormat(currentLanguage, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }, [currentLanguage]);

  /**
   * Format date according to current locale
   */
  const formatDate = useCallback((date, options = {}) => {
    try {
      return new Intl.DateTimeFormat(currentLanguage, options).format(new Date(date));
    } catch (error) {
      return date.toString();
    }
  }, [currentLanguage]);

  /**
   * Initialize translations
   */
  useEffect(() => {
    const initializeTranslations = async () => {
      // Load available languages
      await loadAvailableLanguages();

      // Check for saved language preference
      const savedLang = localStorage.getItem('catalyst_language');
      const initialLang = savedLang || navigator.language?.split('-')[0] || 'en';

      // Set initial language
      setCurrentLanguage(initialLang);

      // Update HTML attributes
      document.documentElement.lang = initialLang;

      // Load translations
      await loadTranslations(initialLang);
    };

    initializeTranslations();
  }, []); // Run once on mount

  const value = {
    // State
    currentLanguage,
    availableLanguages,
    translations,
    loading,
    isRTL,

    // Functions
    changeLanguage,
    t,
    getEntityTranslation,
    formatNumber,
    formatCurrency,
    formatDate,
    loadTranslations,
    loadAvailableLanguages
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * useTranslation Hook
 *
 * Access translation context in functional components
 *
 * @example
 * const { t, currentLanguage, changeLanguage } = useTranslation();
 *
 * return (
 *   <div>
 *     <h1>{t('common.welcome')}</h1>
 *     <button onClick={() => changeLanguage('es')}>Español</button>
 *   </div>
 * );
 */
export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }

  return context;
}

/**
 * withTranslation HOC
 *
 * Inject translation props into class components
 *
 * @example
 * class MyComponent extends React.Component {
 *   render() {
 *     const { t } = this.props;
 *     return <h1>{t('common.welcome')}</h1>;
 *   }
 * }
 *
 * export default withTranslation(MyComponent);
 */
export function withTranslation(Component) {
  return function TranslatedComponent(props) {
    const translation = useTranslation();
    return <Component {...props} {...translation} />;
  };
}

export default TranslationContext;
