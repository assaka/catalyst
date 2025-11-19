const express = require('express');
const translationService = require('../services/translation-service');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const ConnectionManager = require('../services/database/ConnectionManager');
const jwt = require('jsonwebtoken');
const router = express.Router();

/**
 * Get store by slug - TENANT ONLY approach
 *
 * ARCHITECTURAL NOTE: This is a public route that receives a slug, not a store_id.
 * The challenge: We need store_id to get the tenant connection, but we're looking up BY slug.
 *
 * SOLUTION: Master DB stores table acts as a "directory service" - it only contains the
 * minimal routing info (id, slug, is_active) to route requests to the correct tenant DB.
 * The full store data still lives in tenant DB.
 *
 * This is different from other routes because:
 * - Most routes receive store_id directly (from x-store-id header or query param)
 * - Bootstrap is the FIRST call from storefront, so it only has the slug
 * - We use master for routing (slug -> store_id), then fetch all data from tenant
 *
 * @param {string} slug - Store slug to look up
 * @returns {Promise<Object>} { storeId, store, tenantDb }
 */
async function getStoreBySlug(slug) {
  const { masterSupabaseClient } = require('../database/masterConnection');

  // Step 1: Use master DB as directory service to get store_id for routing
  // Master stores table contains: id, slug, is_active, user_id (minimal routing info)
  const { data: masterStore, error: masterError } = await masterSupabaseClient
    .from('stores')
    .select('id, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (masterError || !masterStore) {
    throw new Error(`Store not found with slug: ${slug}`);
  }

  console.log(`✅ Resolved slug "${slug}" to store_id: ${masterStore.id}`);

  // Step 2: Get tenant connection using store_id
  const tenantDb = await ConnectionManager.getStoreConnection(masterStore.id);

  // Step 3: Fetch full store data from tenant DB (authoritative source)
  const { data: store, error: tenantError } = await tenantDb
    .from('stores')
    .select('*')
    .eq('id', masterStore.id)
    .eq('slug', slug)
    .maybeSingle();

  if (tenantError || !store) {
    throw new Error(`Store data not found in tenant DB for store_id: ${masterStore.id}`);
  }

  console.log(`✅ Loaded full store data from tenant DB:`, store.name);

  return { storeId: masterStore.id, store, tenantDb };
}

/**
 * @route   GET /api/public/storefront/bootstrap
 * @desc    Get all storefront initialization data in one request
 * @access  Public
 * @cache   5 minutes (Redis) - Critical optimization for initial page load
 * @query   {string} slug - Store slug (required)
 * @query   {string} lang - Language code (optional, defaults to 'en')
 * @query   {string} session_id - Guest session ID for wishlist (optional)
 * @query   {string} user_id - User ID for wishlist (optional)
 * @header  {string} Authorization - Bearer token for user authentication (optional)
 *
 * @returns {Object} Combined response containing:
 *   - store: Store configuration
 *   - languages: Available languages
 *   - translations: UI translations for the specified language
 *   - categories: Category tree for navigation
 *   - wishlist: User's wishlist items (if session_id/user_id/auth provided)
 *   - user: Current user data (if authenticated)
 *   - headerSlotConfig: Header layout configuration
 *   - seoSettings: Store SEO settings
 *   - seoTemplates: Active SEO templates
 */
router.get('/', cacheMiddleware({
  prefix: 'bootstrap',
  ttl: 300, // 5 minutes - balance between freshness and performance
  keyGenerator: (req) => {
    const slug = req.query.slug || 'default';
    const lang = req.query.lang || 'en';
    // Don't include session_id/user_id in cache key for better hit rate
    // User-specific data (wishlist) is small and can be fetched separately
    return `bootstrap:${slug}:${lang}`;
  },
  // Skip caching if user is authenticated (personalized data)
  condition: (req) => !req.headers.authorization
}), async (req, res) => {
  try {
    const { slug, lang, session_id, user_id } = req.query;
    const authHeader = req.headers.authorization;

    // Validate required parameters
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Store slug is required'
      });
    }

    const language = lang || 'en';

    // Try to extract user from JWT token if provided
    let authenticatedUser = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Lookup user in master DB (users are platform-level data)
        const { masterSupabaseClient } = require('../database/masterConnection');
        const { data: user, error: userError } = await masterSupabaseClient
          .from('users')
          .select('*')
          .eq('id', decoded.id)
          .maybeSingle();

        if (!userError && user) {
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          authenticatedUser = userWithoutPassword;
        }
      } catch (err) {
        // Invalid token - continue without auth
        console.warn('Invalid auth token in bootstrap request:', err.message);
      }
    }

    // Get store by slug - uses master for routing, tenant for data
    console.log('🔍 Looking up store by slug:', slug);
    let storeId, store, tenantDb;

    try {
      const result = await getStoreBySlug(slug);
      storeId = result.storeId;
      store = result.store;
      tenantDb = result.tenantDb;
    } catch (err) {
      console.log('❌ Store not found for slug:', slug, err.message);
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Execute all other queries in parallel using tenantDb connection
    const [
      languagesResult,
      translationsResult,
      categoriesResult,
      wishlistResult,
      headerSlotConfigResult,
      seoSettingsResult,
      seoTemplatesResult
    ] = await Promise.all([
      // 1. Get all active languages from tenant DB
      (async () => {
        try {
          const { data, error } = await tenantDb
            .from('languages')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true });
          if (error) throw error;
          return data || [];
        } catch (err) {
          console.error('❌ Bootstrap: Failed to fetch languages:', err.message);
          return [];
        }
      })(),

      // 2. Get UI translations using store.id
      (async () => {
        try {
          return await translationService.getUILabels(store.id, language);
        } catch (err) {
          console.error('❌ Bootstrap: Failed to fetch translations:', err.message);
          return {};
        }
      })(),

      // 3. Get categories with translations using tenantDb
      (async () => {
        try {
          // Since getCategoriesWithTranslations uses old sequelize connection,
          // we need to fetch categories directly from tenantDb
          const { data: categories, error: catError } = await tenantDb
            .from('categories')
            .select('*')
            .eq('store_id', store.id)
            .eq('is_active', true)
            .eq('hide_in_menu', false)
            .order('sort_order', { ascending: true })
            .limit(1000);

          if (catError) throw catError;

          if (!categories || categories.length === 0) {
            return { rows: [], count: 0 };
          }

          // Get category translations
          const categoryIds = categories.map(c => c.id);
          const { data: translations, error: transError } = await tenantDb
            .from('category_translations')
            .select('*')
            .in('category_id', categoryIds)
            .in('language_code', [language, 'en']);

          if (transError) {
            console.warn('⚠️ Failed to fetch category translations:', transError.message);
          }

          // Build translation map
          const translationMap = {};
          (translations || []).forEach(t => {
            if (!translationMap[t.category_id]) {
              translationMap[t.category_id] = {};
            }
            translationMap[t.category_id][t.language_code] = t;
          });

          // Apply translations to categories
          const categoriesWithTranslations = categories.map(cat => {
            const trans = translationMap[cat.id];
            const requestedLang = trans?.[language];
            const englishLang = trans?.['en'];

            return {
              ...cat,
              name: requestedLang?.name || englishLang?.name || cat.slug,
              description: requestedLang?.description || englishLang?.description || null
            };
          });

          return { rows: categoriesWithTranslations, count: categoriesWithTranslations.length };
        } catch (err) {
          console.error('❌ Bootstrap: Failed to fetch categories:', err.message);
          return { rows: [], count: 0 };
        }
      })(),

      // 4. Get wishlist (if session_id, user_id, or auth provided)
      (async () => {
        const effectiveUserId = authenticatedUser?.id || user_id;
        const effectiveSessionId = session_id;

        if (!effectiveUserId && !effectiveSessionId) {
          return [];
        }

        try {
          // Build query for wishlist
          let wishlistQuery = tenantDb
            .from('wishlists')
            .select('*')
            .order('added_at', { ascending: false });

          if (effectiveUserId && effectiveSessionId) {
            wishlistQuery = wishlistQuery.or(`user_id.eq.${effectiveUserId},session_id.eq.${effectiveSessionId}`);
          } else if (effectiveUserId) {
            wishlistQuery = wishlistQuery.eq('user_id', effectiveUserId);
          } else if (effectiveSessionId) {
            wishlistQuery = wishlistQuery.eq('session_id', effectiveSessionId);
          }

          const { data: wishlistItems, error: wishlistError } = await wishlistQuery;

          if (wishlistError) throw wishlistError;
          if (!wishlistItems || wishlistItems.length === 0) return [];

          // Get products for wishlist items
          const productIds = wishlistItems.map(w => w.product_id);
          const { data: products, error: productsError } = await tenantDb
            .from('products')
            .select('id, price, images, slug, name')
            .in('id', productIds);

          if (productsError) {
            console.warn('⚠️ Failed to fetch wishlist products:', productsError.message);
            return wishlistItems.map(w => ({ ...w, Product: null }));
          }

          // Get product translations
          const { data: productTranslations, error: transError } = await tenantDb
            .from('product_translations')
            .select('*')
            .in('product_id', productIds)
            .in('language_code', [language, 'en']);

          if (transError) {
            console.warn('⚠️ Failed to fetch product translations:', transError.message);
          }

          // Build translation map
          const transMap = {};
          (productTranslations || []).forEach(t => {
            if (!transMap[t.product_id]) {
              transMap[t.product_id] = {};
            }
            transMap[t.product_id][t.language_code] = t;
          });

          // Apply translations to products
          const productsWithTrans = products.map(p => {
            const trans = transMap[p.id];
            const requestedLang = trans?.[language];
            const englishLang = trans?.['en'];

            return {
              ...p,
              name: requestedLang?.name || englishLang?.name || '',
              description: requestedLang?.description || englishLang?.description || '',
              short_description: requestedLang?.short_description || englishLang?.short_description || ''
            };
          });

          // Build product map
          const productMap = {};
          productsWithTrans.forEach(p => {
            productMap[p.id] = p;
          });

          // Combine wishlist items with products
          return wishlistItems.map(item => ({
            ...item,
            Product: productMap[item.product_id] || null
          }));
        } catch (error) {
          console.error('❌ Bootstrap: Error fetching wishlist:', error.message);
          return [];
        }
      })(),

      // 5. Get header slot configuration from tenantDb
      (async () => {
        try {
          // First try to find published version
          const { data: publishedConfig, error: pubError } = await tenantDb
            .from('slot_configurations')
            .select('*')
            .eq('store_id', store.id)
            .eq('page_type', 'header')
            .eq('status', 'published')
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pubError && pubError.code !== 'PGRST116') {
            console.warn('⚠️ Error fetching published header config:', pubError.message);
          }

          if (publishedConfig) {
            return publishedConfig;
          }

          // If no published version, try to find draft
          const { data: draftConfig, error: draftError } = await tenantDb
            .from('slot_configurations')
            .select('*')
            .eq('store_id', store.id)
            .eq('page_type', 'header')
            .eq('status', 'draft')
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (draftError && draftError.code !== 'PGRST116') {
            console.warn('⚠️ Error fetching draft header config:', draftError.message);
          }

          return draftConfig || null;
        } catch (error) {
          console.error('❌ Bootstrap: Error fetching header slot config:', error.message);
          return null;
        }
      })(),

      // 6. Get SEO settings from tenantDb
      (async () => {
        try {
          const { data, error } = await tenantDb
            .from('seo_settings')
            .select('*')
            .eq('store_id', store.id)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.warn('⚠️ Error fetching SEO settings:', error.message);
            return null;
          }

          return data || null;
        } catch (error) {
          console.error('❌ Bootstrap: Error fetching SEO settings:', error.message);
          return null;
        }
      })(),

      // 7. Get active SEO templates from tenantDb
      (async () => {
        try {
          const { data, error } = await tenantDb
            .from('seo_templates')
            .select('*')
            .eq('store_id', store.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('type', { ascending: true });

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('❌ Bootstrap: Error fetching SEO templates:', error.message);
          return [];
        }
      })()
    ]);

    // Build category tree for navigation
    const categoriesFlat = categoriesResult.rows || [];
    const categoryTree = buildCategoryTree(categoriesFlat);

    // Apply cache headers based on store settings
    await applyCacheHeaders(res, store.id);

    // Return combined response
    res.json({
      success: true,
      data: {
        store: store,
        languages: languagesResult || [],
        translations: {
          language: language,
          labels: translationsResult.labels || {},
          customKeys: translationsResult.customKeys || []
        },
        categories: categoryTree,
        wishlist: wishlistResult || [],
        user: authenticatedUser || null,
        headerSlotConfig: headerSlotConfigResult || null,
        seoSettings: seoSettingsResult || null,
        seoTemplates: seoTemplatesResult || [],
        meta: {
          categoriesCount: categoriesResult.count || 0,
          wishlistCount: wishlistResult?.length || 0,
          authenticated: !!authenticatedUser,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Storefront bootstrap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load storefront data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Build a hierarchical category tree from flat category list
 * @param {Array} categories - Flat array of categories
 * @returns {Array} Hierarchical category tree
 */
function buildCategoryTree(categories) {
  // Create a map for quick lookup
  const categoryMap = new Map();
  const tree = [];

  // First pass: create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category.toJSON ? category.toJSON() : category,
      children: []
    });
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    const node = categoryMap.get(category.id);
    if (category.parent_id === null || category.parent_id === undefined) {
      // Root level category
      tree.push(node);
    } else {
      // Child category - add to parent
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found (might be inactive), add as root
        tree.push(node);
      }
    }
  });

  return tree;
}

module.exports = router;
