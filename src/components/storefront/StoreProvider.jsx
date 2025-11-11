/**
 * StoreProvider - Refactored for Clarity and Performance
 *
 * REFACTORED: Reduced from 934 lines to ~350 lines
 * - Extracted settings merging to utils/storeSettingsDefaults.js
 * - Extracted caching to utils/cacheUtils.js
 * - Uses useStoreBootstrap hook for Layer 1 data (eliminates duplicate API calls)
 * - Uses fetchAdditionalStoreData for Layer 3 data
 *
 * 3-Layer Architecture:
 * Layer 1 (Bootstrap): Global data loaded once - store, languages, translations, categories, SEO
 * Layer 2 (CMS): Page-specific content (future)
 * Layer 3 (Dynamic): Taxes, labels, attributes (frequently changing)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { storefrontApiClient } from '@/api/storefront-entities';

// New utilities and hooks
import { useStoreBootstrap, useStoreSlugById, determineStoreSlug } from '@/hooks/useStoreBootstrap';
import { fetchAdditionalStoreData, fetchCookieConsentSettings } from '@/hooks/useStoreData';
import { mergeStoreSettings } from '@/utils/storeSettingsDefaults';
import { clearCache, deleteCacheKey } from '@/utils/cacheUtils';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

// Re-export cachedApiCall for backward compatibility
export { cachedApiCall, clearCache, clearCacheKeys } from '@/utils/cacheUtils';

export const StoreProvider = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return localStorage.getItem('selectedCountry') || 'US';
  });

  // Step 1: Try to get store slug (use useState to prevent re-renders)
  const [resolvedSlug, setResolvedSlug] = useState(() => {
    const slug = determineStoreSlug(location);
    return slug;
  });

  const storeId = !resolvedSlug ? localStorage.getItem('selectedStoreId') : null;

  // DEBUG: Visual indicator
  document.title = `DEBUG: slug=${resolvedSlug || 'none'} id=${storeId || 'none'}`;

  // Step 2: If no slug but have ID, fetch slug first
  const { data: fetchedSlug, isLoading: slugLoading } = useStoreSlugById(storeId);

  // Use fetched slug if we had to look it up
  useEffect(() => {
    if (!resolvedSlug && fetchedSlug) {
      setResolvedSlug(fetchedSlug);
      localStorage.setItem('selectedStoreSlug', fetchedSlug);
    }
  }, [fetchedSlug, resolvedSlug]);

  const language = localStorage.getItem('catalyst_language') || 'en';

  // LAYER 1: Bootstrap data (global data - 1 API call)
  const { data: bootstrap, isLoading: bootstrapLoading, refetch: refetchBootstrap, error: bootstrapError } = useStoreBootstrap(resolvedSlug, language);

  // DEBUG: Show error if any
  if (bootstrapError) {
    document.title = `ERROR: ${bootstrapError.message}`;
  }

  // Main data loading effect
  useEffect(() => {
    // DEBUG: Show loading state in title
    if (slugLoading) {
      document.title = 'LOADING: Fetching slug...';
    } else if (bootstrapLoading) {
      document.title = 'LOADING: Fetching bootstrap...';
    } else if (!bootstrap) {
      document.title = 'WAITING: No bootstrap data';
    } else {
      document.title = 'LOADED: Processing data...';
    }

    if (slugLoading || bootstrapLoading || !bootstrap) {
      setLoading(true);
      return;
    }

    const loadStoreData = async () => {
      try {
        const store = bootstrap.store;

        if (!store) {
          setLoading(false);
          return;
        }

        // Merge settings with defaults
        const mergedSettings = mergeStoreSettings(store);

        // Set API client context
        storefrontApiClient.setStoreContext(store.slug);

        // Initialize language
        const savedLang = localStorage.getItem('catalyst_language');
        if (!savedLang) {
          const defaultLang = mergedSettings.default_language || 'en';
          localStorage.setItem('catalyst_language', defaultLang);
        } else {
          const activeLanguages = mergedSettings.active_languages || ['en'];
          if (!activeLanguages.includes(savedLang)) {
            const defaultLang = mergedSettings.default_language || 'en';
            localStorage.setItem('catalyst_language', defaultLang);
          }
        }

        // Handle country selection
        const currentSelectedCountry = localStorage.getItem('selectedCountry') || 'US';
        const allowedCountries = mergedSettings.allowed_countries || ['US'];

        if (!allowedCountries.includes(currentSelectedCountry)) {
          const newCountry = allowedCountries[0] || 'US';
          setSelectedCountry(newCountry);
          localStorage.setItem('selectedCountry', newCountry);
        } else {
          setSelectedCountry(currentSelectedCountry);
        }

        // LAYER 3: Fetch additional data NOT in bootstrap
        const [additionalData, cookieConsent] = await Promise.all([
          fetchAdditionalStoreData(store.id, language),
          fetchCookieConsentSettings(store.id)
        ]);

        // Merge cookie consent into settings
        if (cookieConsent) {
          mergedSettings.cookie_consent = cookieConsent;
        }

        // Load UI translations (from bootstrap)
        const currentLang = localStorage.getItem('catalyst_language') || mergedSettings.default_language || 'en';
        if (!mergedSettings.ui_translations) {
          mergedSettings.ui_translations = {};
        }
        mergedSettings.ui_translations[currentLang] = bootstrap.translations?.labels || {};

        // Set all data
        const finalStoreData = {
          // Layer 1 - From bootstrap
          store: { ...store, settings: mergedSettings },
          languages: bootstrap.languages || [],
          categories: bootstrap.categories || [],
          seoSettings: bootstrap.seoSettings || {},
          seoTemplates: bootstrap.seoTemplates || [],
          wishlist: bootstrap.wishlist || [],
          user: bootstrap.user || null,
          headerSlotConfig: bootstrap.headerSlotConfig || null,

          // Layer 3 - Additional data
          taxes: additionalData.taxes || [],
          productLabels: additionalData.productLabels || [],
          attributes: additionalData.attributes || [],
          filterableAttributes: additionalData.filterableAttributes || [],
          attributeSets: additionalData.attributeSets || [],
        };

        // Make available globally for debugging BEFORE setting state
        if (typeof window !== 'undefined') {
          window.__storeContext = finalStoreData;
          window.__bootstrapCategories = bootstrap.categories;
          window.__finalCategories = finalStoreData.categories;

          // Visual indicator that can't be stripped
          document.title = `CATS: ${bootstrap.categories?.length || 0} loaded`;
        }

        setStoreData(finalStoreData);

        setLoading(false);
      } catch (error) {
        console.error('StoreProvider: Failed to load store data:', error);
        setLoading(false);
      }
    };

    loadStoreData();
  }, [bootstrap, bootstrapLoading, slugLoading, language, location.pathname]);

  // Event Listener: Store selection changes
  useEffect(() => {
    const handleStoreChange = () => {
      clearCache();
      refetchBootstrap();
    };

    window.addEventListener('storeSelectionChanged', handleStoreChange);
    return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
  }, [refetchBootstrap]);

  // Event Listener: Language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      clearCache();
      refetchBootstrap();
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, [refetchBootstrap]);

  // Event Listener: Cache clear broadcasts (from admin)
  useEffect(() => {
    try {
      const storeChannel = new BroadcastChannel('store_settings_update');
      storeChannel.onmessage = (event) => {
        if (event.data.type === 'clear_cache') {
          clearCache();

          const isAdminPage = window.location.pathname.includes('/admin/');
          if (!isAdminPage) {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
      };

      // Translation updates
      const translationsChannel = new BroadcastChannel('translations_update');
      translationsChannel.onmessage = (event) => {
        if (event.data.type === 'clear_translations_cache') {
          const lang = event.data.language;
          const translationsCacheKey = `ui-translations-${lang}`;
          deleteCacheKey(translationsCacheKey);

          const isAdminPage = window.location.pathname.includes('/admin/');
          if (!isAdminPage) {
            window.location.reload(true);
          }
        }
      };

      return () => {
        storeChannel.close();
        translationsChannel.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
  }, []);

  // Country selection handler
  const handleSetSelectedCountry = useCallback((country) => {
    setSelectedCountry(country);
    localStorage.setItem('selectedCountry', country);
  }, []);

  // Context value
  const value = {
    store: storeData?.store,
    settings: storeData?.store?.settings || {},
    loading,

    // Layer 1 - Global data from bootstrap
    languages: storeData?.languages || [],
    categories: storeData?.categories || [],
    seoSettings: storeData?.seoSettings || {},
    seoTemplates: storeData?.seoTemplates || [],
    wishlist: storeData?.wishlist || [],
    user: storeData?.user,
    headerSlotConfig: storeData?.headerSlotConfig,

    // Layer 3 - Additional data
    taxes: storeData?.taxes || [],
    productLabels: storeData?.productLabels || [],
    attributes: storeData?.attributes || [],
    filterableAttributes: storeData?.filterableAttributes || [],
    attributeSets: storeData?.attributeSets || [],

    // Country selection
    selectedCountry,
    setSelectedCountry: handleSetSelectedCountry,
  };

  return (
    <StoreContext.Provider value={value}>
      {storeData?.languages ? (
        <TranslationProvider
          storeId={storeData.store.id}
          initialLanguages={storeData.languages}
          initialTranslations={storeData.translations}
        >
          {children}
        </TranslationProvider>
      ) : (
        // Show loading spinner while bootstrap data loads
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}
    </StoreContext.Provider>
  );
};
