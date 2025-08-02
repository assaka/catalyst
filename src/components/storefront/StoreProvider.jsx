
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  StorefrontStore,
  StorefrontTax,
  StorefrontCategory,
  StorefrontProductLabel,
  StorefrontAttribute,
  StorefrontAttributeSet,
  StorefrontSeoTemplate,
  StorefrontCookieConsentSettings
} from '@/api/storefront-entities';
// Removed SeoSetting import as it's now dynamically imported within fetchStoreData

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

// EXTREME caching - 2 hour cache with localStorage persistence
const CACHE_DURATION = 7200000; // 2 hours
// Temporary: reduce cache for SEO settings during development
const SEO_CACHE_DURATION = 60000; // 1 minute for SEO settings
const apiCache = new Map();

// Load from localStorage on init
const loadCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem('storeProviderCache');
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
  return currencyMap[currencyCode] || '$';
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ultra-aggressive caching - return stale data immediately, refresh in background
const cachedApiCall = async (key, apiCall, ttl = CACHE_DURATION) => {
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
      console.log(`🔄 StoreProvider: Forcing fresh call for critical API with empty cache: ${key}`);
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
    console.error(`❌ StoreProvider: API call failed for ${key}:`, error);
    console.error(`❌ StoreProvider: Full error details:`, error.message, error.stack);
    
    // Don't cache empty results for critical API calls like products
    if (key.includes('featured-products') || key.includes('products-category')) {
      console.error(`🚨 StoreProvider: Not caching empty result for critical API: ${key}`);
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
  const [seoSettings, setSeoSettings] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    // Load from localStorage or default to 'US'
    return localStorage.getItem('selectedCountry') || 'US';
  });
  const location = useLocation();

  useEffect(() => {
    fetchStoreData();
  }, [location.pathname]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      
      // Check if we need to force refresh the cache (e.g., after admin settings changes)
      const forceRefresh = localStorage.getItem('forceRefreshStore');
      if (forceRefresh) {
        apiCache.clear();
        localStorage.removeItem('storeProviderCache');
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
      
      // Use public URL pattern first, then legacy patterns, then default to first store
      let storeCacheKey = 'first-store';
      let storeIdentifier = null;
      
      if (publicStoreSlug) {
        storeCacheKey = `store-slug-${publicStoreSlug}`;
        storeIdentifier = publicStoreSlug;
      } else if (storeSlug && storeSlug !== 'storefront' && storeSlug !== 'productdetail' && storeSlug !== 'cart' && storeSlug !== 'checkout' && storeSlug !== 'order-success') {
        storeCacheKey = `store-slug-${storeSlug}`;
        storeIdentifier = storeSlug;
      } else if (oldStoreSlug) {
        storeCacheKey = `store-slug-${oldStoreSlug}`;
        storeIdentifier = oldStoreSlug;
      }
      
      const stores = await cachedApiCall(storeCacheKey, async () => {
        if (storeIdentifier) {
          try {
            const result = await StorefrontStore.filter({ slug: storeIdentifier });
            return Array.isArray(result) ? result : [];
          } catch (error) {
            console.error(`❌ StoreProvider: StorefrontStore.filter failed for slug:`, error);
            return [];
          }
        } else {
          try {
            const result = await StorefrontStore.findAll({ limit: 1 });
            return Array.isArray(result) ? result : [];
          } catch (error) {
            console.error(`❌ StoreProvider: StorefrontStore.findAll failed:`, error);
            return [];
          }
        }
      });


      const selectedStore = stores?.[0];

      if (!selectedStore) {
        console.warn('⚠️ StoreProvider: No store found!');
        console.warn('Available stores:', stores);
        console.warn('Looking for slug:', storeIdentifier);
        console.warn('Cache key:', storeCacheKey);
        setLoading(false);
        return;
      }

      
      // Set store with merged settings
      const mergedSettings = {
        enable_inventory: true,
        enable_reviews: true,
        allow_guest_checkout: true,
        require_shipping_address: true,
        hide_currency_category: false,
        hide_currency_product: false,
        hide_header_cart: false,
        hide_header_checkout: false,
        hide_quantity_selector: false,
        hide_stock_quantity: false,
        show_stock_label: true,
        show_permanent_search: true,
        currency_code: selectedStore.currency || 'USD',
        currency_symbol: getCurrencySymbol(selectedStore.currency || 'USD'),
        show_category_in_breadcrumb: true,
        theme: {
          primary_button_color: '#007bff',
          secondary_button_color: '#6c757d',
          add_to_cart_button_color: '#28a745',
          view_cart_button_color: '#17a2b8',
          checkout_button_color: '#007bff',
          place_order_button_color: '#28a745',
          font_family: 'Inter'
        },
        cookie_consent: {
          enabled: false
        },
        // Merge store settings first, then set defaults only for missing properties
        ...(selectedStore.settings || {}),
        // Only set default allowed_countries if not already defined in store settings
        allowed_countries: (selectedStore.settings && selectedStore.settings.allowed_countries) 
          ? selectedStore.settings.allowed_countries 
          : ['US', 'CA', 'GB', 'DE', 'FR']
      };
      
      setStore({ ...selectedStore, settings: mergedSettings });
      
      
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

      // Load SEO settings separately and with priority
      try {
        const { StorefrontSeoSetting } = await import('@/api/storefront-entities');
        console.log('🔍 Loading SEO settings for store:', selectedStore.id);
        
        const seoSettingsData = await cachedApiCall(`seo-settings-${selectedStore.id}`, async () => {
          console.log('🔄 Fetching SEO settings from API...');
          const result = await StorefrontSeoSetting.filter({ store_id: selectedStore.id });
          console.log('📊 SEO settings API response:', result);
          return Array.isArray(result) ? result : [];
        });
        
        if (seoSettingsData && seoSettingsData.length > 0) {
          const loadedSeoSettings = seoSettingsData[0];
          console.log('🔍 Raw SEO settings from API:', loadedSeoSettings);
          setSeoSettings({
            ...loadedSeoSettings,
            // Ensure nested objects exist with defaults, but preserve boolean flags
            schema_settings: loadedSeoSettings.schema_settings || {
              enable_product_schema: true,
              enable_organization_schema: true,
              organization_name: '',
              organization_logo_url: '',
              social_profiles: []
            },
            open_graph_settings: loadedSeoSettings.open_graph_settings || {
              default_image_url: '',
              facebook_app_id: ''
            },
            twitter_card_settings: loadedSeoSettings.twitter_card_settings || {
              card_type: 'summary_large_image',
              site_username: ''
            },
            hreflang_settings: (() => {
              try {
                if (typeof loadedSeoSettings.hreflang_settings === 'string') {
                  return JSON.parse(loadedSeoSettings.hreflang_settings);
                }
                return Array.isArray(loadedSeoSettings.hreflang_settings) ? loadedSeoSettings.hreflang_settings : [];
              } catch (e) {
                console.warn('Failed to parse hreflang_settings:', e);
                return [];
              }
            })()
          });
        } else {
          setSeoSettings({
            store_id: selectedStore.id,
            enable_rich_snippets: true,
            enable_open_graph: true,
            enable_twitter_cards: true,
            schema_settings: {
              enable_product_schema: true,
              enable_organization_schema: true,
              organization_name: selectedStore.name || '',
              organization_logo_url: '',
              social_profiles: []
            },
            open_graph_settings: {
              default_image_url: '',
              facebook_app_id: ''
            },
            twitter_card_settings: {
              card_type: 'summary_large_image',
              site_username: ''
            },
            hreflang_settings: []
          });
        }
      } catch (error) {
        console.error('[StoreProvider] Error loading SEO settings:', error);
        setSeoSettings(null);
      }

      // Load cookie consent settings and update store settings
      try {
        const cookieConsentData = await cachedApiCall(`cookie-consent-${selectedStore.id}`, async () => {
          const result = await StorefrontCookieConsentSettings.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        });
        
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

      // Load other data with extreme caching - all in parallel with staggered delays
      const dataPromises = [
        cachedApiCall(`taxes-${selectedStore.id}`, async () => {
          const result = await StorefrontTax.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`categories-${selectedStore.id}`, async () => {
          const result = await StorefrontCategory.filter({ store_id: selectedStore.id, limit: 1000 });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`labels-${selectedStore.id}`, async () => {
          try {
            const result = await StorefrontProductLabel.filter({ store_id: selectedStore.id });
            const activeLabels = Array.isArray(result) ? result.filter(label => label.is_active !== false) : [];
            return activeLabels;
          } catch (error) {
            console.error('Error fetching product labels:', error);
            return [];
          }
        }),
        cachedApiCall(`attributes-${selectedStore.id}`, async () => {
          const result = await StorefrontAttribute.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`attr-sets-${selectedStore.id}`, async () => {
          const result = await StorefrontAttributeSet.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`seo-templates-${selectedStore.id}`, async () => {
          const result = await StorefrontSeoTemplate.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        })
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
      
      const filterableAttrs = attrData.filter(a => a?.is_filterable);
      setFilterableAttributes(filterableAttrs);
      
      setAttributeSets(results[4].status === 'fulfilled' ? (results[4].value || []) : []);
      setSeoTemplates(results[5].status === 'fulfilled' ? (results[5].value || []) : []);

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
      setSeoSettings(null);
    } finally {
      setLoading(false);
    }
  };

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
    seoSettings,
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
  console.log('🗑️ Cache cleared');
};

// Clear specific cache keys
const clearCacheKeys = (keys) => {
  try {
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (apiCache.has(key)) {
          apiCache.delete(key);
          console.log('🗑️ Cleared cache key:', key);
        }
      });
    }
    
    // Also clear the entire localStorage cache for SEO-related changes
    localStorage.removeItem('storeProviderCache');
    
    // Set force refresh flag with timestamp
    localStorage.setItem('forceRefreshStore', Date.now().toString());
    
    console.log('🧹 Cache keys cleared, localStorage cleared, and force refresh set');
  } catch (error) {
    console.warn('⚠️ Failed to clear specific cache keys:', error);
  }
};

// Make clearCache available globally for debugging
if (typeof window !== 'undefined') {
  window.clearCache = clearCache;
  window.clearCacheKeys = clearCacheKeys;
}

// Export the caching function for use in other components
export { cachedApiCall, clearCache, clearCacheKeys };
