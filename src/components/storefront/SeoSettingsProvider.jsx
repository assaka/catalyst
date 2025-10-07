import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from './StoreProvider';

const SeoSettingsContext = createContext(null);
export const useSeoSettings = () => useContext(SeoSettingsContext);

// Simple cache like CMS blocks - no ultra-aggressive caching
const seoSettingsCache = new Map();

const loadSeoSettingsWithSimpleCache = async (storeId) => {
  const cacheKey = `store_${storeId}`;
  
  // Check cache first - but no localStorage persistence, no 2-hour duration
  if (seoSettingsCache.has(cacheKey)) {
    return seoSettingsCache.get(cacheKey);
  }

  try {
    const { StorefrontSeoSetting } = await import('@/api/storefront-entities');
    const result = await StorefrontSeoSetting.filter({ store_id: storeId });
    
    let seoSettings = null;
    if (result && result.length > 0) {
      const rawSettings = result[0];
      
      seoSettings = {
        ...rawSettings,
        schema_settings: rawSettings.schema_settings || {
          enable_product_schema: true,
          enable_organization_schema: true,
          organization_name: '',
          organization_logo_url: '',
          social_profiles: []
        },
        open_graph_settings: rawSettings.open_graph_settings || {
          default_image_url: '',
          facebook_app_id: ''
        },
        twitter_card_settings: rawSettings.twitter_card_settings || {
          card_type: 'summary_large_image',
          site_username: ''
        },
        hreflang_settings: (() => {
          try {
            if (typeof rawSettings.hreflang_settings === 'string') {
              return JSON.parse(rawSettings.hreflang_settings);
            }
            return Array.isArray(rawSettings.hreflang_settings) ? rawSettings.hreflang_settings : [];
          } catch (e) {
            console.warn('Failed to parse hreflang_settings:', e);
            return [];
          }
        })()
      };
    }
    
    // Cache the result - simple cache, no localStorage
    seoSettingsCache.set(cacheKey, seoSettings);
    return seoSettings;
  } catch (error) {
    console.warn('SeoSettingsProvider: Failed to load SEO settings:', error.message);
    return null;
  }
};

export const SeoSettingsProvider = ({ children }) => {
  const { store } = useStore();
  const [seoSettings, setSeoSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store?.id) {
      loadSeoSettingsWithSimpleCache(store.id)
        .then(settings => {
          setSeoSettings(settings);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading SEO settings:', error);
          setSeoSettings(null);
          setLoading(false);
        });
    }
  }, [store?.id]);

  // Clear cache function - simple like CMS blocks
  const clearSeoCache = () => {
    seoSettingsCache.clear();
    if (store?.id) {
      // Reload immediately
      setLoading(true);
      loadSeoSettingsWithSimpleCache(store.id)
        .then(settings => {
          setSeoSettings(settings);
          setLoading(false);
        });
    }
  };

  const value = {
    seoSettings,
    loading,
    clearSeoCache
  };

  return (
    <SeoSettingsContext.Provider value={value}>
      {children}
    </SeoSettingsContext.Provider>
  );
};