
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  StorefrontStore,
  StorefrontTax,
  StorefrontCategory,
  StorefrontProductLabel,
  StorefrontAttribute,
  StorefrontAttributeSet,
  StorefrontSeoTemplate,
  StorefrontCookieConsentSettings,
  storefrontApiClient
} from '@/api/storefront-entities';
// Removed SeoSetting import as it's now dynamically imported within fetchStoreData

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

// Helper function to clean checkout layouts
const cleanCheckoutLayout = (layout) => {
  if (!layout) return layout;

  const cleanedLayout = {};
  Object.keys(layout).forEach(stepKey => {
    cleanedLayout[stepKey] = {};
    Object.keys(layout[stepKey]).forEach(columnKey => {
      let sections = layout[stepKey][columnKey] || [];

      // Replace old "Delivery Options" with "Delivery Settings"
      sections = sections.map(section =>
        section === 'Delivery Options' ? 'Delivery Settings' : section
      );

      // Remove "Account" section (deprecated)
      sections = sections.filter(section => section !== 'Account');

      // Remove duplicates while preserving order
      cleanedLayout[stepKey][columnKey] = [...new Set(sections)];
    });
  });
  return cleanedLayout;
};

// Balanced caching strategy
const CACHE_DURATION_LONG = 3600000; // 1 hour - for data that rarely changes (stores, cookie consent)
const CACHE_DURATION_MEDIUM = 300000; // 5 minutes - for semi-static data (categories, attributes)
const CACHE_DURATION_SHORT = 60000; // 1 minute - for frequently updated data (taxes, labels, templates)
const CACHE_VERSION = '2.0'; // Increment this to invalidate all cached data
const apiCache = new Map();

// Load from localStorage on init
const loadCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem('storeProviderCache');
    const storedVersion = localStorage.getItem('storeProviderCacheVersion');

    // Invalidate cache if version changed
    if (storedVersion !== CACHE_VERSION) {
      console.log('🔄 Cache version changed, clearing old cache');
      localStorage.removeItem('storeProviderCache');
      localStorage.setItem('storeProviderCacheVersion', CACHE_VERSION);
      return;
    }

    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        apiCache.set(key, value);
      });
    }
  } catch (e) {
    console.warn('Failed to load cache from storage');
  }
};

// Save to localStorage
const saveCacheToStorage = () => {
  try {
    const cacheObj = {};
    apiCache.forEach((value, key) => {
      cacheObj[key] = value;
    });
    localStorage.setItem('storeProviderCache', JSON.stringify(cacheObj));
  } catch (e) {
    console.warn('Failed to save cache to storage');
  }
};

// Initialize cache from storage
loadCacheFromStorage();

// Helper function to get currency symbol from currency code
const getCurrencySymbol = (currencyCode) => {
  const currencyMap = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'SEK': 'kr',
    'NOK': 'kr',
    'MXN': '$',
    'INR': '₹',
    'KRW': '₩',
    'SGD': 'S$',
    'HKD': 'HK$',
    'BRL': 'R$',
    'ZAR': 'R',
    'RUB': '₽',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RON': 'lei',
    'BGN': 'лв',
    'HRK': 'kn',
    'DKK': 'kr',
    'TRY': '₺'
  };
  return currencyMap[currencyCode] || 'Currency not found';
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ultra-aggressive caching - return stale data immediately, refresh in background
const cachedApiCall = async (key, apiCall, ttl = CACHE_DURATION_LONG) => {
  const now = Date.now();
  
  // Force fresh calls for critical product APIs after database reset
  const isCriticalProductCall = key.includes('featured-products') || key.includes('products-category');
  
  // Always check cache first (unless it's a critical product call)
  if (apiCache.has(key) && !isCriticalProductCall) {
    const { data, timestamp } = apiCache.get(key);
    
    // If data is fresh, return it
    if (now - timestamp < ttl) {
      return Promise.resolve(data);
    }
    
    // For critical product calls, don't return stale empty data
    if (isCriticalProductCall && Array.isArray(data) && data.length === 0) {
      // Don't return cached empty data, force fresh call below
    } else {
      // Data is stale but exists - return it immediately and refresh in background
      setTimeout(async () => {
        try {
          await delay(Math.random() * 5000 + 2000); // Random delay 2-7 seconds
          const freshData = await apiCall();
          apiCache.set(key, { data: freshData, timestamp: now });
          saveCacheToStorage();
        } catch (error) {
          console.warn(`Background refresh failed for ${key}:`, error);
        }
      }, 100);
      
      return data;
    }
  }
  
  // No cached data - must fetch fresh
  try {
    await delay(Math.random() * 3000 + 1000); // Random delay 1-4 seconds
    const result = await apiCall();
    apiCache.set(key, { data: result, timestamp: now });
    saveCacheToStorage();
    return result;
  } catch (error) {
    console.error(`StoreProvider: API call failed for ${key}:`, error);
    console.error(`StoreProvider: Full error details:`, error.message, error.stack);
    
    // Don't cache empty results for critical API calls like products
    if (key.includes('featured-products') || key.includes('products-category')) {
      console.error(`StoreProvider: Not caching empty result for critical API: ${key}`);
      throw error; // Let the component handle the error
    }
    
    // Return empty data for non-critical calls
    const emptyData = [];
    apiCache.set(key, { data: emptyData, timestamp: now });
    return emptyData;
  }
};

export const StoreProvider = ({ children }) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productLabels, setProductLabels] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [filterableAttributes, setFilterableAttributes] = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);
  const [seoTemplates, setSeoTemplates] = useState([]);
  // Removed seoSettings from provider state - will be loaded independently like CMS blocks
  const [selectedCountry, setSelectedCountry] = useState(() => {
    // Load from localStorage or default to 'US'
    return localStorage.getItem('selectedCountry') || 'US';
  });
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 StoreProvider: Location pathname changed:', location.pathname);
    fetchStoreData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Listen for store selection changes from admin
  useEffect(() => {
    const handleStoreChange = (event) => {
      console.log('🔄 StoreProvider: Detected store selection change:', event.detail?.store);
      console.log('🧹 StoreProvider: Clearing caches for store change');
      // Clear cache when store changes
      apiCache.clear();
      localStorage.removeItem('storeProviderCache');
      sessionStorage.removeItem('storeProviderCache');
      // Refetch store data with the new selection
      fetchStoreData();
    };

    window.addEventListener('storeSelectionChanged', handleStoreChange);
    return () => window.removeEventListener('storeSelectionChanged', handleStoreChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event) => {
      console.log('🌍 StoreProvider: Detected language change:', event.detail?.language);
      console.log('🧹 StoreProvider: Clearing all caches for language change');
      // Clear cache when language changes
      apiCache.clear();
      localStorage.removeItem('storeProviderCache');
      sessionStorage.removeItem('storeProviderCache');
      console.log('🔄 StoreProvider: Refetching store data with new language');
      // Refetch store data with the new language
      fetchStoreData();
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for cache clear broadcasts from admin
  useEffect(() => {
    try {
      const storeChannel = new BroadcastChannel('store_settings_update');
      storeChannel.onmessage = (event) => {
        if (event.data.type === 'clear_cache') {
          // Clear all caches
          apiCache.clear();
          localStorage.removeItem('storeProviderCache');
          sessionStorage.removeItem('storeProviderCache');

          // Force reload the page after a short delay to see the messages
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      };

      // Listen for translation updates
      const translationsChannel = new BroadcastChannel('translations_update');
      translationsChannel.onmessage = (event) => {
        if (event.data.type === 'clear_translations_cache') {
          const language = event.data.language;

          // Clear the translations cache for the updated language from memory
          const translationsCacheKey = `ui-translations-${language}`;
          apiCache.delete(translationsCacheKey);

          // Clear from localStorage cache as well
          try {
            const stored = localStorage.getItem('storeProviderCache');
            if (stored) {
              const parsed = JSON.parse(stored);
              delete parsed[translationsCacheKey];
              localStorage.setItem('storeProviderCache', JSON.stringify(parsed));
            }
          } catch (e) {
            console.warn('Failed to clear localStorage cache:', e);
          }

          // Force hard reload to bypass any browser cache
          window.location.reload(true);
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

  const fetchStoreData = useCallback(async () => {
    try {
      setLoading(true);
      
      // EXTENSIVE DEBUG: Check localStorage state
      
      // Check URL parameters for SEO refresh (bypasses localStorage isolation)
      const urlParams = new URLSearchParams(window.location.search);
      const seoRefreshParam = urlParams.get('_seo_refresh');
      
      // Check if we need to force refresh the cache (localStorage OR URL parameter)
      const forceRefresh = localStorage.getItem('forceRefreshStore') || seoRefreshParam;
      
      if (forceRefresh) {
        apiCache.clear();
        localStorage.removeItem('storeProviderCache');
        // Clear the force refresh flag after using it
        localStorage.removeItem('forceRefreshStore');
      }
      
      // Get store first with ultra-aggressive caching
      const path = location.pathname;
      
      // Check for new public URL pattern: /public/{storeCode}/...
      const publicUrlMatch = path.match(/^\/public\/([^\/]+)/);
      const publicStoreSlug = publicUrlMatch ? publicUrlMatch[1] : null;
      
      // Check for legacy store slug pattern: /:storeSlug/... (keep for backward compatibility)
      const storeSlugMatch = path.match(/^\/([^\/]+)\/(storefront|productdetail|cart|checkout|order-success)/);
      const storeSlug = storeSlugMatch ? storeSlugMatch[1] : null;
      
      // Check for old pattern: /storefront/:slug (keep for backward compatibility)
      const oldStoreSlugMatch = path.match(/\/storefront\/([^\/]+)/);
      const oldStoreSlug = oldStoreSlugMatch ? oldStoreSlugMatch[1] : null;
      
      // Use public URL pattern first, then legacy patterns, then admin selected store, then default to first store
      let storeCacheKey = 'first-store';
      let storeIdentifier = null;
      let storeId = null;

      if (publicStoreSlug) {
        storeCacheKey = `store-slug-${publicStoreSlug}`;
        storeIdentifier = publicStoreSlug;
      } else if (storeSlug && storeSlug !== 'storefront' && storeSlug !== 'productdetail' && storeSlug !== 'cart' && storeSlug !== 'checkout' && storeSlug !== 'order-success') {
        storeCacheKey = `store-slug-${storeSlug}`;
        storeIdentifier = storeSlug;
      } else if (oldStoreSlug) {
        storeCacheKey = `store-slug-${oldStoreSlug}`;
        storeIdentifier = oldStoreSlug;
      } else {
        // No URL slug found - check if we're in admin/editor context with a selected store
        const selectedStoreId = localStorage.getItem('selectedStoreId');
        console.log('🔍 StoreProvider: Checking localStorage for selectedStoreId:', selectedStoreId);
        if (selectedStoreId) {
          storeCacheKey = `store-id-${selectedStoreId}`;
          storeId = selectedStoreId;
          console.log('✅ StoreProvider: Using store ID from localStorage:', storeId);
        }
      }

      let stores;
      if (storeIdentifier) {
        try {
          const result = await StorefrontStore.filter({ slug: storeIdentifier });
          stores = Array.isArray(result) ? result : [];
        } catch (error) {
          console.error(`StoreProvider: StorefrontStore.filter failed for slug:`, error);
          stores = [];
        }
      } else if (storeId) {
        try {
          console.log('🔎 StoreProvider: Fetching store by ID:', storeId);
          const result = await StorefrontStore.filter({ id: storeId });
          console.log('📦 StoreProvider: API returned stores:', result?.map(s => ({ id: s.id, name: s.name })));
          stores = Array.isArray(result) ? result : [];
        } catch (error) {
          console.error(`StoreProvider: StorefrontStore.filter failed for id:`, error);
          stores = [];
        }
      } else {
        try {
          const result = await StorefrontStore.findAll({ limit: 1 });
          stores = Array.isArray(result) ? result : [];
        } catch (error) {
          console.error(`StoreProvider: StorefrontStore.findAll failed:`, error);
          stores = [];
        }
      }


      const selectedStore = stores?.[0];

      if (!selectedStore) {
        setLoading(false);
        return;
      }

      console.log('🏪 StoreProvider: Raw store data from API:', {
        id: selectedStore.id,
        name: selectedStore.name,
        currency: selectedStore.currency,
        hasCurrency: !!selectedStore.currency,
        settingsCurrencyCode: selectedStore.settings?.currency_code,
        allKeys: Object.keys(selectedStore)
      });

      // Set store with merged settings
      // IMPORTANT: Spread store settings FIRST, then apply defaults only for missing properties
      const mergedSettings = {
        // Spread existing store settings first to preserve saved values
        ...(selectedStore.settings || {}),
        
        // Then set defaults ONLY for properties that don't exist in store settings
        // Stock settings - preserve saved values
        enable_inventory: selectedStore.settings?.enable_inventory !== undefined 
          ? selectedStore.settings.enable_inventory 
          : true,
        display_out_of_stock: selectedStore.settings?.display_out_of_stock !== undefined
          ? selectedStore.settings.display_out_of_stock
          : true,
        hide_stock_quantity: selectedStore.settings?.hide_stock_quantity !== undefined
          ? selectedStore.settings.hide_stock_quantity
          : false,
        display_low_stock_threshold: selectedStore.settings?.display_low_stock_threshold !== undefined
          ? selectedStore.settings.display_low_stock_threshold
          : 0,
        show_stock_label: selectedStore.settings?.stock_settings?.show_stock_label !== undefined
          ? selectedStore.settings.stock_settings.show_stock_label
          : true,
        
        // Other settings with proper defaults
        enable_reviews: selectedStore.settings?.enable_reviews !== undefined 
          ? selectedStore.settings.enable_reviews 
          : true,
        allow_guest_checkout: selectedStore.settings?.allow_guest_checkout !== undefined
          ? selectedStore.settings.allow_guest_checkout
          : true,
        require_shipping_address: selectedStore.settings?.require_shipping_address !== undefined
          ? selectedStore.settings.require_shipping_address
          : true,
        hide_currency_category: selectedStore.settings?.hide_currency_category !== undefined
          ? selectedStore.settings.hide_currency_category
          : false,
        hide_currency_product: selectedStore.settings?.hide_currency_product !== undefined
          ? selectedStore.settings.hide_currency_product
          : false,
        hide_header_cart: selectedStore.settings?.hide_header_cart !== undefined
          ? selectedStore.settings.hide_header_cart
          : false,
        hide_header_checkout: selectedStore.settings?.hide_header_checkout !== undefined
          ? selectedStore.settings.hide_header_checkout
          : false,
        hide_quantity_selector: selectedStore.settings?.hide_quantity_selector !== undefined
          ? selectedStore.settings.hide_quantity_selector
          : false,
        show_permanent_search: selectedStore.settings?.show_permanent_search !== undefined
          ? selectedStore.settings.show_permanent_search
          : true,
        show_category_in_breadcrumb: selectedStore.settings?.show_category_in_breadcrumb !== undefined
          ? selectedStore.settings.show_category_in_breadcrumb
          : true,
        
        // Currency settings - ensure we use the store's currency setting
        currency_code: selectedStore.currency || selectedStore.settings?.currency_code || 'No Currency',
        currency_symbol: (() => {
          const currencyCode = selectedStore.currency || selectedStore.settings?.currency_code || 'No Currency';
          const symbol = getCurrencySymbol(currencyCode);
          return symbol;
        })(),
        
        // Theme defaults (merge with existing theme settings)
        theme: {
          // Default theme values
          primary_button_color: '#007bff',
          secondary_button_color: '#6c757d',
          add_to_cart_button_color: '#28a745',
          view_cart_button_color: '#17a2b8',
          checkout_button_color: '#007bff',
          place_order_button_color: '#28a745',
          font_family: 'Inter',
          // Product Tabs defaults
          product_tabs_title_color: '#DC2626',
          product_tabs_title_size: '1.875rem',
          product_tabs_content_bg: '#EFF6FF',
          product_tabs_attribute_label_color: '#16A34A',
          product_tabs_active_bg: 'transparent',
          product_tabs_inactive_color: '#6B7280',
          product_tabs_inactive_bg: 'transparent',
          product_tabs_hover_color: '#111827',
          product_tabs_hover_bg: '#F3F4F6',
          product_tabs_font_weight: '500',
          product_tabs_border_radius: '0.5rem',
          product_tabs_border_color: '#E5E7EB',
          product_tabs_text_decoration: 'none',
          // Breadcrumb defaults
          breadcrumb_show_home_icon: true,
          breadcrumb_item_text_color: '#6B7280',
          breadcrumb_item_hover_color: '#374151',
          breadcrumb_active_item_color: '#111827',
          breadcrumb_separator_color: '#9CA3AF',
          breadcrumb_font_size: '0.875rem',
          breadcrumb_mobile_font_size: '0.75rem',
          breadcrumb_font_weight: '400',
          // Merge with existing settings (existing values take precedence)
          ...(selectedStore.settings?.theme || {})
        },
        
        // Cookie consent defaults (only if not already defined)
        cookie_consent: selectedStore.settings?.cookie_consent || {
          enabled: false
        },

        // Product grid - merge with defaults properly
        product_grid: {
          breakpoints: {
            default: selectedStore.settings?.product_grid?.breakpoints?.default ?? 1,
            sm: selectedStore.settings?.product_grid?.breakpoints?.sm ?? 2,
            md: selectedStore.settings?.product_grid?.breakpoints?.md ?? 0,
            lg: selectedStore.settings?.product_grid?.breakpoints?.lg ?? 2,
            xl: selectedStore.settings?.product_grid?.breakpoints?.xl ?? 0,
            '2xl': selectedStore.settings?.product_grid?.breakpoints?.['2xl'] ?? 0
          },
          customBreakpoints: selectedStore.settings?.product_grid?.customBreakpoints || [],
          rows: selectedStore.settings?.product_grid?.rows ?? 4
        },

        // Checkout page settings - preserve saved values with defaults
        checkout_steps_count: selectedStore.settings?.checkout_steps_count ?? 3,
        // Step names for 2-step checkout
        checkout_2step_step1_name: selectedStore.settings?.checkout_2step_step1_name || 'Information',
        checkout_2step_step2_name: selectedStore.settings?.checkout_2step_step2_name || 'Payment',
        // Step names for 3-step checkout
        checkout_3step_step1_name: selectedStore.settings?.checkout_3step_step1_name || 'Information',
        checkout_3step_step2_name: selectedStore.settings?.checkout_3step_step2_name || 'Shipping',
        checkout_3step_step3_name: selectedStore.settings?.checkout_3step_step3_name || 'Payment',
        checkout_step_indicator_active_color: selectedStore.settings?.checkout_step_indicator_active_color || '#007bff',
        checkout_step_indicator_inactive_color: selectedStore.settings?.checkout_step_indicator_inactive_color || '#D1D5DB',
        checkout_step_indicator_completed_color: selectedStore.settings?.checkout_step_indicator_completed_color || '#10B981',
        checkout_step_indicator_style: selectedStore.settings?.checkout_step_indicator_style || 'circles',
        checkout_section_title_color: selectedStore.settings?.checkout_section_title_color || '#111827',
        checkout_section_title_size: selectedStore.settings?.checkout_section_title_size || '1.25rem',
        checkout_section_bg_color: selectedStore.settings?.checkout_section_bg_color || '#FFFFFF',
        checkout_section_border_color: selectedStore.settings?.checkout_section_border_color || '#E5E7EB',
        // Checkout Layout Configuration
        checkout_1step_columns: selectedStore.settings?.checkout_1step_columns ?? 3,
        checkout_2step_columns: selectedStore.settings?.checkout_2step_columns ?? 2,
        checkout_3step_columns: selectedStore.settings?.checkout_3step_columns ?? 2,
        checkout_1step_layout: cleanCheckoutLayout(selectedStore.settings?.checkout_1step_layout) || {
          step1: {
            column1: ['Shipping Address', 'Shipping Method', 'Billing Address'],
            column2: ['Delivery Settings', 'Payment Method'],
            column3: ['Coupon', 'Order Summary']
          }
        },
        checkout_2step_layout: cleanCheckoutLayout(selectedStore.settings?.checkout_2step_layout) || {
          step1: {
            column1: ['Shipping Address', 'Billing Address'],
            column2: ['Shipping Method', 'Delivery Settings']
          },
          step2: {
            column1: ['Summary', 'Payment Method'],
            column2: ['Coupon', 'Order Summary']
          }
        },
        checkout_3step_layout: cleanCheckoutLayout(selectedStore.settings?.checkout_3step_layout) || {
          step1: {
            column1: ['Shipping Address', 'Billing Address'],
            column2: []
          },
          step2: {
            column1: ['Shipping Method', 'Delivery Settings'],
            column2: []
          },
          step3: {
            column1: ['Summary', 'Payment Method'],
            column2: ['Coupon', 'Order Summary']
          }
        },

        // Product gallery layout settings - preserve saved values with defaults
        product_gallery_layout: selectedStore.settings?.product_gallery_layout !== undefined
          ? selectedStore.settings.product_gallery_layout
          : 'horizontal',
        vertical_gallery_position: selectedStore.settings?.vertical_gallery_position !== undefined
          ? selectedStore.settings.vertical_gallery_position
          : 'left',

        // Ensure boolean values for navigation settings are properly handled
        excludeRootFromMenu: selectedStore.settings?.excludeRootFromMenu === true,
        expandAllMenuItems: selectedStore.settings?.expandAllMenuItems === true,
        
        // Only set default allowed_countries if not already defined in store settings
        allowed_countries: (selectedStore.settings && selectedStore.settings.allowed_countries) 
          ? selectedStore.settings.allowed_countries 
          : ['US', 'CA', 'GB', 'DE', 'FR']
      };
      
      setStore({ ...selectedStore, settings: mergedSettings });

      // Initialize language based on store settings
      const savedLang = localStorage.getItem('catalyst_language');
      if (!savedLang) {
        // No language saved, set to store's default language
        const defaultLang = mergedSettings.default_language || 'en';
        localStorage.setItem('catalyst_language', defaultLang);
      } else {
        // Check if saved language is in active languages
        const activeLanguages = mergedSettings.active_languages || ['en'];
        if (!activeLanguages.includes(savedLang)) {
          // Saved language is not active, reset to default
          const defaultLang = mergedSettings.default_language || 'en';
          localStorage.setItem('catalyst_language', defaultLang);
        }
      }

      // Set the store context in the storefront API client
      storefrontApiClient.setStoreContext(selectedStore.slug);

      // Only set country if user hasn't selected one, or if current selection is not in allowed countries
      const currentSelectedCountry = localStorage.getItem('selectedCountry') || 'US';
      const allowedCountries = mergedSettings.allowed_countries || ['US'];
      
      if (!allowedCountries.includes(currentSelectedCountry)) {
        // Current selection is not allowed, set to first allowed country
        const newCountry = allowedCountries[0] || 'US';
        setSelectedCountry(newCountry);
        localStorage.setItem('selectedCountry', newCountry);
      } else {
        // Current selection is valid, keep it
        setSelectedCountry(currentSelectedCountry);
      }

      // SEO settings removed from StoreProvider - will be loaded independently like CMS blocks

      // Load cookie consent settings and update store settings
      try {
        const cookieConsentData = await cachedApiCall(`cookie-consent-${selectedStore.id}`, async () => {
          const result = await StorefrontCookieConsentSettings.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }, CACHE_DURATION_LONG);
        
        if (cookieConsentData && cookieConsentData.length > 0) {
          const cookieSettings = cookieConsentData[0];
          
          // Map backend cookie settings to frontend format
          const frontendCookieSettings = {
            enabled: cookieSettings.is_enabled || false,
            gdpr_mode: cookieSettings.gdpr_mode ?? true,
            auto_detect_country: cookieSettings.auto_detect_country ?? true,
            banner_message: cookieSettings.banner_text || "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
            accept_all_text: cookieSettings.accept_button_text || "Accept All",
            reject_all_text: cookieSettings.reject_button_text || "Reject All",
            manage_preferences_text: cookieSettings.settings_button_text || "Cookie Settings",
            privacy_policy_text: cookieSettings.privacy_policy_text || "Privacy Policy",
            privacy_policy_url: cookieSettings.privacy_policy_url || "/privacy-policy",
            banner_position: cookieSettings.banner_position || "bottom",
            show_close_button: cookieSettings.show_close_button ?? true,
            consent_expiry_days: cookieSettings.consent_expiry_days || 365,
            accept_button_bg_color: cookieSettings.accept_button_bg_color || '#2563eb',
            accept_button_text_color: cookieSettings.accept_button_text_color || '#ffffff',
            reject_button_bg_color: cookieSettings.reject_button_bg_color || '#ffffff',
            reject_button_text_color: cookieSettings.reject_button_text_color || '#374151',
            save_preferences_button_bg_color: cookieSettings.save_preferences_button_bg_color || '#16a34a',
            save_preferences_button_text_color: cookieSettings.save_preferences_button_text_color || '#ffffff',
            translations: cookieSettings.translations || {}, // IMPORTANT: Include translations for multilingual support
            categories: cookieSettings.categories || [
              {
                id: "necessary",
                name: "Necessary Cookies",
                description: "These cookies are necessary for the website to function and cannot be switched off.",
                required: true,
                default_enabled: true
              },
              {
                id: "analytics",
                name: "Analytics Cookies",
                description: "These cookies help us understand how visitors interact with our website.",
                required: false,
                default_enabled: cookieSettings.analytics_cookies || false
              },
              {
                id: "marketing",
                name: "Marketing Cookies",
                description: "These cookies are used to deliver personalized advertisements.",
                required: false,
                default_enabled: cookieSettings.marketing_cookies || false
              },
              {
                id: "functional",
                name: "Functional Cookies",
                description: "These cookies enable enhanced functionality and personalization.",
                required: false,
                default_enabled: cookieSettings.functional_cookies || false
              }
            ],
            gdpr_countries: cookieSettings.gdpr_countries || ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"],
            custom_css: cookieSettings.custom_css || ""
          };
          
          // Update the store settings with loaded cookie consent settings
          mergedSettings.cookie_consent = frontendCookieSettings;
          setStore({ ...selectedStore, settings: mergedSettings });
        } else {
        }
      } catch (error) {
        console.error('[StoreProvider] Error loading cookie consent settings:', error);
      }

      // Load UI translations for the storefront
      try {
        const currentLang = localStorage.getItem('catalyst_language') || mergedSettings.default_language || 'en';
        const translationsCacheKey = `ui-translations-${currentLang}`;

        // Check if we should bypass cache (after translation update)
        const translationsCacheCleared = sessionStorage.getItem('translations_cache_cleared');
        if (translationsCacheCleared) {
          // Remove from both memory and localStorage cache
          apiCache.delete(translationsCacheKey);
          try {
            const stored = localStorage.getItem('storeProviderCache');
            if (stored) {
              const parsed = JSON.parse(stored);
              delete parsed[translationsCacheKey];
              localStorage.setItem('storeProviderCache', JSON.stringify(parsed));
            }
          } catch (e) {
            console.warn('Failed to clear localStorage cache:', e);
          }
          sessionStorage.removeItem('translations_cache_cleared');
        }

        const translationsData = await cachedApiCall(translationsCacheKey, async () => {
          // Add cache-busting timestamp to force fresh data
          const cacheBuster = Date.now();
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com'}/api/translations/ui-labels?lang=${currentLang}&_=${cacheBuster}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          if (!response.ok) throw new Error('Failed to fetch translations');
          const result = await response.json();
          return result.data?.labels || {};
        }, CACHE_DURATION_MEDIUM);

        // Merge translations into settings
        if (!mergedSettings.ui_translations) {
          mergedSettings.ui_translations = {};
        }
        mergedSettings.ui_translations[currentLang] = translationsData;

        // Update the store with translations
        setStore({ ...selectedStore, settings: mergedSettings });
      } catch (error) {
        console.error('[StoreProvider] Error loading UI translations:', error);
      }

      // Load other data with balanced caching - all in parallel with appropriate cache durations
      const dataPromises = [
        // SHORT cache (1 minute) - frequently updated by admin
        cachedApiCall(`taxes-${selectedStore.id}`, async () => {
          const result = await StorefrontTax.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }, CACHE_DURATION_SHORT),
        
        // MEDIUM cache (5 minutes) - semi-static data
        // Include language in cache key to ensure proper translation switching
        cachedApiCall(`categories-${selectedStore.id}-${localStorage.getItem('catalyst_language') || 'en'}`, async () => {
          console.log('🔍 Frontend: Fetching categories for store:', selectedStore.id, 'language:', localStorage.getItem('catalyst_language'));
          const result = await StorefrontCategory.filter({ store_id: selectedStore.id, limit: 1000 });
          console.log('📥 Frontend: Received categories:', result?.length || 0);
          if (result && result.length > 0) {
            console.log('📝 Frontend: First category:', JSON.stringify({
              id: result[0].id,
              name: result[0].name,
              slug: result[0].slug,
              has_name: !!result[0].name,
              name_value: result[0].name,
              name_type: typeof result[0].name
            }, null, 2));
          } else {
            console.log('⚠️ Frontend: NO CATEGORIES RECEIVED FROM API');
          }
          return Array.isArray(result) ? result : [];
        }, CACHE_DURATION_MEDIUM),
        
        // SHORT cache (1 minute) - frequently updated by admin
        cachedApiCall(`labels-${selectedStore.id}`, async () => {
          try {
            const result = await StorefrontProductLabel.filter({ store_id: selectedStore.id });
            const activeLabels = Array.isArray(result) ? result.filter(label => label.is_active !== false) : [];
            return activeLabels;
          } catch (error) {
            console.error('Error fetching product labels:', error);
            return [];
          }
        }, CACHE_DURATION_SHORT),
        
        // MEDIUM cache (5 minutes) - semi-static data
        cachedApiCall(`attributes-${selectedStore.id}`, async () => {
          const result = await StorefrontAttribute.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }, CACHE_DURATION_MEDIUM),

        // MEDIUM cache (5 minutes) - filterable attributes only (is_filterable = true)
        cachedApiCall(`filterable-attributes-${selectedStore.id}`, async () => {
          const result = await StorefrontAttribute.filter({
            store_id: selectedStore.id,
            is_filterable: true
          });
          return Array.isArray(result) ? result : [];
        }, CACHE_DURATION_MEDIUM),
        
        // MEDIUM cache (5 minutes) - semi-static data
        cachedApiCall(`attr-sets-${selectedStore.id}`, async () => {
          const result = await StorefrontAttributeSet.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }, CACHE_DURATION_MEDIUM),
        
        // SHORT cache (1 minute) - frequently updated by admin
        cachedApiCall(`seo-templates-${selectedStore.id}`, async () => {
          const result = await StorefrontSeoTemplate.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }, CACHE_DURATION_SHORT)
      ];
      
      // Process all results
      const results = await Promise.allSettled(dataPromises);
      
      setTaxes(results[0].status === 'fulfilled' ? (results[0].value || []) : []);
      
      const categoriesResult = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
      
      // Handle the case where API returns nested structure like {categories: [...], pagination: {...}}
      let processedCategories = categoriesResult;
      if (categoriesResult.length === 1 && categoriesResult[0]?.categories && Array.isArray(categoriesResult[0].categories)) {
        processedCategories = categoriesResult[0].categories;
      }
      setCategories(processedCategories);
      
      const productLabelsData = results[2].status === 'fulfilled' ? (results[2].value || []) : [];
      setProductLabels(productLabelsData);
      
      const attrData = results[3].status === 'fulfilled' ? (results[3].value || []) : [];
      setAttributes(attrData);

      const filterableAttrs = results[4].status === 'fulfilled' ? (results[4].value || []) : [];
      setFilterableAttributes(filterableAttrs);

      setAttributeSets(results[5].status === 'fulfilled' ? (results[5].value || []) : []);
      setSeoTemplates(results[6].status === 'fulfilled' ? (results[6].value || []) : []);

    } catch (error) {
      console.error("StoreProvider: Failed to fetch data:", error);
      // Don't crash the app
      setTaxes([]);
      setCategories([]);
      setProductLabels([]);
      setAttributes([]);
      setFilterableAttributes([]);
      setAttributeSets([]);
      setSeoTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [location]);

  // Wrapper function to persist country selection to localStorage
  const handleSetSelectedCountry = (country) => {
    setSelectedCountry(country);
    localStorage.setItem('selectedCountry', country);
  };

  const value = {
    store,
    settings: store?.settings || {},
    loading,
    taxes,
    categories,
    productLabels,
    attributes,
    filterableAttributes,
    attributeSets,
    seoTemplates,
    selectedCountry,
    setSelectedCountry: handleSetSelectedCountry,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

// Clear cache function for debugging
const clearCache = () => {
  apiCache.clear();
  localStorage.removeItem('storeProviderCache');
};

// Clear specific cache keys
const clearCacheKeys = (keys) => {
  try {
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (apiCache.has(key)) {
          apiCache.delete(key);
        }
      });
    }
    
    // Also clear the entire localStorage cache for SEO-related changes
    localStorage.removeItem('storeProviderCache');
    
    // Set force refresh flag with timestamp
    localStorage.setItem('forceRefreshStore', Date.now().toString());
    
    // Trigger immediate page reload to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
  } catch (error) {
    console.warn('Failed to clear specific cache keys:', error);
  }
};

// Make clearCache available globally for debugging
if (typeof window !== 'undefined') {
  window.clearCache = clearCache;
  window.clearCacheKeys = clearCacheKeys;
  
  // Debug function to manually test force refresh
  window.testForceRefresh = () => {
    localStorage.setItem('forceRefreshStore', Date.now().toString());
    window.location.reload();
  };
  
  // Debug function to manually set the flag as string (like admin does)
  window.testStringFlag = () => {
    localStorage.setItem('forceRefreshStore', 'true');
    window.location.reload();
  };

}

// Export the caching function for use in other components
export { cachedApiCall, clearCache, clearCacheKeys };
