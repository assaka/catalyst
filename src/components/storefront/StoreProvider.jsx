
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Store } from '@/api/entities';
import { Tax } from '@/api/entities';
import { Category } from '@/api/entities';
import { ProductLabel } from '@/api/entities';
import { Attribute } from '@/api/entities';
import { AttributeSet } from '@/api/entities';
import { SeoTemplate } from '@/api/entities';
// Removed SeoSetting import as it's now dynamically imported within fetchStoreData

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

// EXTREME caching - 2 hour cache with localStorage persistence
const CACHE_DURATION = 7200000; // 2 hours
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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ultra-aggressive caching - return stale data immediately, refresh in background
const cachedApiCall = async (key, apiCall, ttl = CACHE_DURATION) => {
  const now = Date.now();
  
  // Always check cache first
  if (apiCache.has(key)) {
    const { data, timestamp } = apiCache.get(key);
    
    // If data is fresh, return it
    if (now - timestamp < ttl) {
      return Promise.resolve(data);
    }
    
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
  
  // No cached data - must fetch fresh
  try {
    await delay(Math.random() * 3000 + 1000); // Random delay 1-4 seconds
    const result = await apiCall();
    apiCache.set(key, { data: result, timestamp: now });
    saveCacheToStorage();
    return result;
  } catch (error) {
    console.error(`API call failed for ${key}:`, error);
    // Return empty data instead of throwing
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
  const [selectedCountry, setSelectedCountry] = useState('US');
  const location = useLocation();

  useEffect(() => {
    fetchStoreData();
  }, [location.pathname]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      
      // Get store first with ultra-aggressive caching
      const path = location.pathname;
      const storeSlugMatch = path.match(/\/storefront\/([^\/]+)/);
      const storeSlug = storeSlugMatch ? storeSlugMatch[1] : null;
      
      const storeCacheKey = storeSlug ? `store-slug-${storeSlug}` : 'first-store';
      const stores = await cachedApiCall(storeCacheKey, async () => {
        if (storeSlug) {
          console.log(`🔍 StoreProvider: About to call Store.filter with slug:`, storeSlug);
          try {
            const result = await Store.filter({ slug: storeSlug });
            console.log(`🔍 StoreProvider: Store.filter returned:`, {
              resultType: typeof result,
              isArray: Array.isArray(result),
              resultLength: Array.isArray(result) ? result.length : 'N/A',
              result
            });
            return Array.isArray(result) ? result : [];
          } catch (error) {
            console.error(`❌ StoreProvider: Store.filter failed:`, error);
            return [];
          }
        } else {
          console.log(`🔍 StoreProvider: About to call Store.findAll with limit 1`);
          try {
            const result = await Store.findAll({ limit: 1 });
            console.log(`🔍 StoreProvider: Store.findAll returned:`, {
              resultType: typeof result,
              isArray: Array.isArray(result),
              resultLength: Array.isArray(result) ? result.length : 'N/A',
              result
            });
            return Array.isArray(result) ? result : [];
          } catch (error) {
            console.error(`❌ StoreProvider: Store.findAll failed:`, error);
            return [];
          }
        }
      });

      console.log(`🔍 StoreProvider: About to access stores[0]:`, {
        storesType: typeof stores,
        isArray: Array.isArray(stores),
        storesLength: Array.isArray(stores) ? stores.length : 'N/A',
        stores
      });

      const currentStore = stores?.[0];
      
      console.log(`🔍 StoreProvider: currentStore extracted:`, {
        currentStore,
        hasStore: !!currentStore
      });
      
      if (!currentStore) {
        console.warn('No store found');
        setLoading(false);
        return;
      }

      // Set store with merged settings
      const mergedSettings = {
        enable_inventory: true,
        enable_reviews: true,
        allow_guest_checkout: true,
        require_shipping_address: true,
        allowed_countries: ['US'],
        hide_currency_category: false,
        hide_currency_product: false,
        hide_header_cart: false,
        hide_header_checkout: false,
        hide_quantity_selector: false,
        show_permanent_search: true,
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
        ...(currentStore.settings || {})
      };
      
      console.log(`🔍 StoreProvider: About to set store:`, {
        currentStore,
        mergedSettings,
        allowedCountries: mergedSettings.allowed_countries,
        allowedCountriesType: typeof mergedSettings.allowed_countries,
        isAllowedCountriesArray: Array.isArray(mergedSettings.allowed_countries)
      });
      
      setStore({ ...currentStore, settings: mergedSettings });
      
      console.log(`🔍 StoreProvider: About to setSelectedCountry:`, {
        allowedCountries: mergedSettings.allowed_countries,
        firstCountry: mergedSettings.allowed_countries?.[0],
        fallback: 'US'
      });
      
      setSelectedCountry(mergedSettings.allowed_countries?.[0] || 'US');

      // Load SEO settings separately and with priority
      try {
        const { SeoSetting } = await import('@/api/entities');
        const seoSettingsData = await cachedApiCall(`seo-settings-${currentStore.id}`, async () => {
          const result = await SeoSetting.filter({ store_id: currentStore.id });
          return Array.isArray(result) ? result : [];
        });
        
        if (seoSettingsData && seoSettingsData.length > 0) {
          const loadedSeoSettings = seoSettingsData[0];
          console.log('[StoreProvider] Loaded SEO settings:', loadedSeoSettings);
          setSeoSettings({
            ...loadedSeoSettings,
            // Ensure nested objects exist with defaults
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
            hreflang_settings: Array.isArray(loadedSeoSettings.hreflang_settings) ? loadedSeoSettings.hreflang_settings : []
          });
        } else {
          console.log('[StoreProvider] No SEO settings found, using defaults');
          setSeoSettings({
            store_id: currentStore.id,
            enable_rich_snippets: true,
            enable_open_graph: true,
            enable_twitter_cards: true,
            schema_settings: {
              enable_product_schema: true,
              enable_organization_schema: true,
              organization_name: currentStore.name || '',
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

      // Load other data with extreme caching - all in parallel with staggered delays
      const dataPromises = [
        cachedApiCall(`taxes-${currentStore.id}`, async () => {
          const result = await Tax.filter({ store_id: currentStore.id });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`categories-${currentStore.id}`, async () => {
          const result = await Category.filter({ store_id: currentStore.id });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`labels-${currentStore.id}`, async () => {
          const result = await ProductLabel.filter({ store_id: currentStore.id, is_active: true });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`attributes-${currentStore.id}`, async () => {
          const result = await Attribute.filter({ store_id: currentStore.id });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`attr-sets-${currentStore.id}`, async () => {
          const result = await AttributeSet.filter({ store_id: currentStore.id });
          return Array.isArray(result) ? result : [];
        }),
        cachedApiCall(`seo-templates-${currentStore.id}`, async () => {
          const result = await SeoTemplate.filter({ store_id: currentStore.id });
          return Array.isArray(result) ? result : [];
        })
      ];
      
      // Process all results
      const results = await Promise.allSettled(dataPromises);
      
      setTaxes(results[0].status === 'fulfilled' ? (results[0].value || []) : []);
      setCategories(results[1].status === 'fulfilled' ? (results[1].value || []) : []);
      setProductLabels(results[2].status === 'fulfilled' ? (results[2].value || []) : []);
      
      const attrData = results[3].status === 'fulfilled' ? (results[3].value || []) : [];
      setAttributes(attrData);
      setFilterableAttributes(attrData.filter(a => a?.is_filterable));
      
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
    setSelectedCountry,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

// Export the caching function for use in other components
export { cachedApiCall };
