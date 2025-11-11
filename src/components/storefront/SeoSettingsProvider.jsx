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
      
      // Extract global SEO settings from default_meta_settings JSON
      const defaultMeta = rawSettings.default_meta_settings || {};

      seoSettings = {
        ...rawSettings,
        // Global SEO settings (extracted from JSON for easy access)
        site_title: defaultMeta.site_title || '',
        title_separator: defaultMeta.title_separator || '|',
        default_meta_description: defaultMeta.default_meta_description || defaultMeta.meta_description || '',
        meta_keywords: defaultMeta.meta_keywords || '',
        meta_robots: defaultMeta.meta_robots || 'index, follow',
        auto_generate_meta: defaultMeta.auto_generate_meta !== false,
        enable_sitemap: defaultMeta.enable_sitemap !== false,
        // Keep the full default_meta_settings for templates and other uses
        default_meta_settings: {
          site_title: defaultMeta.site_title || '',
          title_separator: defaultMeta.title_separator || '|',
          default_meta_description: defaultMeta.default_meta_description || defaultMeta.meta_description || '',
          meta_title: defaultMeta.meta_title || defaultMeta.site_title || '',
          meta_description: defaultMeta.meta_description || defaultMeta.default_meta_description || '',
          meta_keywords: defaultMeta.meta_keywords || '',
          meta_robots: defaultMeta.meta_robots || 'index, follow',
          auto_generate_meta: defaultMeta.auto_generate_meta !== false,
          enable_sitemap: defaultMeta.enable_sitemap !== false
        },
        // Social media settings (consolidated)
        social_media_settings: rawSettings.social_media_settings || {
          open_graph: {
            enabled: true,
            default_title: '',
            default_description: '',
            default_image_url: '',
            facebook_app_id: '',
            facebook_page_url: ''
          },
          twitter: {
            enabled: true,
            card_type: 'summary_large_image',
            default_title: '',
            default_description: '',
            site_username: '',
            creator_username: ''
          },
          social_profiles: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
            youtube: '',
            pinterest: '',
            tiktok: '',
            other: []
          },
          schema: {
            enable_product_schema: true,
            enable_organization_schema: true,
            enable_breadcrumb_schema: true,
            enable_social_profiles: true,
            organization_name: '',
            organization_logo_url: '',
            organization_description: '',
            contact_type: 'customer service',
            contact_telephone: '',
            contact_email: '',
            price_range: '',
            founded_year: '',
            founder_name: ''
          }
        },
        // Legacy fallbacks for backward compatibility
        schema_settings: rawSettings.schema_settings || rawSettings.social_media_settings?.schema || {
          enable_product_schema: true,
          enable_organization_schema: true,
          organization_name: '',
          organization_logo_url: '',
          social_profiles: []
        },
        open_graph_settings: rawSettings.open_graph_settings || rawSettings.social_media_settings?.open_graph || {
          default_image_url: '',
          facebook_app_id: ''
        },
        twitter_card_settings: rawSettings.twitter_card_settings || rawSettings.social_media_settings?.twitter || {
          card_type: 'summary_large_image',
          site_username: ''
        },
        // Canonical settings
        canonical_settings: rawSettings.canonical_settings || {
          base_url: '',
          auto_canonical_filtered_pages: true
        },
        // Hreflang settings
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
        })(),
        // Robots.txt content
        robots_txt_content: rawSettings.robots_txt_content || '',
        // Sitemap settings
        xml_sitemap_settings: rawSettings.xml_sitemap_settings || {
          enabled: true,
          include_products: true,
          include_categories: true,
          include_pages: true
        },
        html_sitemap_settings: rawSettings.html_sitemap_settings || {
          enabled: true,
          include_products: true,
          include_categories: true,
          include_pages: true
        }
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
  const { store, seoSettings: bootstrapSeoSettings } = useStore();
  const [seoSettings, setSeoSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Priority 1: Use bootstrap seoSettings if available (no API call!)
    if (bootstrapSeoSettings) {
      setSeoSettings(bootstrapSeoSettings);
      setLoading(false);
      return;
    }

    // Priority 2: Fetch from API (for admin or if bootstrap didn't provide)
    if (store?.id && !bootstrapSeoSettings) {
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
  }, [store?.id, bootstrapSeoSettings]);

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