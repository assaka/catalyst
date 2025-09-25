
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

// Balanced caching strategy
const CACHE_DURATION_LONG = 3600000; // 1 hour - for data that rarely changes (stores, cookie consent)
const CACHE_DURATION_MEDIUM = 300000; // 5 minutes - for semi-static data (categories, attributes)
const CACHE_DURATION_SHORT = 60000; // 1 minute - for frequently updated data (taxes, labels, templates)
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
    fetchStoreData();
  }, [location.pathname]);

  const fetchStoreData = async () => {
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
        // DON'T remove forceRefreshStore flag yet - need it for SEO settings
      } else {
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
            console.error(`StoreProvider: StorefrontStore.filter failed for slug:`, error);
            return [];
          }
        } else {
          try {
            const result = await StorefrontStore.findAll({ limit: 1 });
            return Array.isArray(result) ? result : [];
          } catch (error) {
            console.error(`StoreProvider: StorefrontStore.findAll failed:`, error);
            return [];
          }
        }
      });


      const selectedStore = stores?.[0];

      if (!selectedStore) {
        console.warn('StoreProvider: No store found!');
        console.warn('Available stores:', stores);
        console.warn('Looking for slug:', storeIdentifier);
        console.warn('Cache key:', storeCacheKey);
        setLoading(false);
        return;
      }
      
      // Set store with merged settings
      // IMPORTANT: Spread store settings FIRST, then apply defaults only for missing properties
      console.log('StoreProvider - Original store settings:', selectedStore.settings);
      console.log('StoreProvider - Original product_grid:', selectedStore.settings?.product_grid);

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
        
        // Currency settings
        currency_code: selectedStore.settings?.currency_code || selectedStore.currency || 'USD',
        currency_symbol: selectedStore.settings?.currency_symbol || getCurrencySymbol(selectedStore.currency || 'USD'),
        
        // Theme defaults (only if not already defined)
        theme: selectedStore.settings?.theme || {
          primary_button_color: '#007bff',
          secondary_button_color: '#6c757d',
          add_to_cart_button_color: '#28a745',
          view_cart_button_color: '#17a2b8',
          checkout_button_color: '#007bff',
          place_order_button_color: '#28a745',
          font_family: 'Inter'
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
          customBreakpoints: selectedStore.settings?.product_grid?.customBreakpoints || []
        },

        // Ensure boolean values for navigation settings are properly handled
        excludeRootFromMenu: selectedStore.settings?.excludeRootFromMenu === true,
        expandAllMenuItems: selectedStore.settings?.expandAllMenuItems === true,
        
        // Only set default allowed_countries if not already defined in store settings
        allowed_countries: (selectedStore.settings && selectedStore.settings.allowed_countries) 
          ? selectedStore.settings.allowed_countries 
          : ['US', 'CA', 'GB', 'DE', 'FR']
      };
      
      setStore({ ...selectedStore, settings: mergedSettings });

      // Debug: Log the final merged settings
      console.log('StoreProvider - Final merged settings:', mergedSettings);
      console.log('StoreProvider - Product grid config:', mergedSettings.product_grid);

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

      // Load other data with balanced caching - all in parallel with appropriate cache durations
      const dataPromises = [
        // SHORT cache (1 minute) - frequently updated by admin
        cachedApiCall(`taxes-${selectedStore.id}`, async () => {
          const result = await StorefrontTax.filter({ store_id: selectedStore.id });
          return Array.isArray(result) ? result : [];
        }, CACHE_DURATION_SHORT),
        
        // MEDIUM cache (5 minutes) - semi-static data
        cachedApiCall(`categories-${selectedStore.id}`, async () => {
          const result = await StorefrontCategory.filter({ store_id: selectedStore.id, limit: 1000 });
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
