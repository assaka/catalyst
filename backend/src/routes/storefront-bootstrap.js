const express = require('express');
const translationService = require('../services/translation-service');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const ConnectionManager = require('../services/database/ConnectionManager');
const jwt = require('jsonwebtoken');
const router = express.Router();

/**
 * Get active storefront for a store
 * Priority: 1. Specific slug (preview), 2. Scheduled (within window), 3. Primary
 *
 * @param {Object} tenantDb - Tenant database connection
 * @param {string} storeId - Store UUID
 * @param {string|null} storefrontSlug - Specific storefront slug (for preview)
 * @returns {Promise<Object|null>} Active storefront or null
 */
async function getActiveStorefront(tenantDb, storeId, storefrontSlug = null) {
  const now = new Date().toISOString();

  // 1. If specific storefront requested (preview mode), return it
  if (storefrontSlug) {
    const { data, error } = await tenantDb
      .from('storefronts')
      .select('*')
      .eq('store_id', storeId)
      .eq('slug', storefrontSlug)
      .maybeSingle();

    if (!error && data) {
      console.log(`✅ Preview storefront: ${data.name} (${storefrontSlug})`);
      return data;
    }
    console.warn(`⚠️ Requested storefront "${storefrontSlug}" not found, falling back to default`);
  }

  // 2. Check for scheduled storefront (within active window)
  const { data: scheduled, error: schedError } = await tenantDb
    .from('storefronts')
    .select('*')
    .eq('store_id', storeId)
    .not('publish_start_at', 'is', null)
    .lte('publish_start_at', now)
    .order('publish_start_at', { ascending: false })
    .limit(10); // Get all potentially active scheduled storefronts

  if (!schedError && scheduled && scheduled.length > 0) {
    // Filter to those still within their window (publish_end_at is null or >= now)
    const activeScheduled = scheduled.find(s =>
      s.publish_end_at === null || new Date(s.publish_end_at) >= new Date(now)
    );

    if (activeScheduled) {
      console.log(`✅ Scheduled storefront active: ${activeScheduled.name}`);
      return activeScheduled;
    }
  }

  // 3. Fall back to primary storefront
  const { data: primary, error: primaryError } = await tenantDb
    .from('storefronts')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_primary', true)
    .maybeSingle();

  if (!primaryError && primary) {
    console.log(`✅ Primary storefront: ${primary.name}`);
    return primary;
  }

  // No storefront found (store might not have any yet)
  return null;
}

/**
 * Get store by slug or custom domain - TENANT ONLY approach
 *
 * ARCHITECTURAL NOTE: This is a public route that receives a slug OR custom domain.
 * The challenge: We need store_id to get the tenant connection, but we're looking up BY slug/domain.
 *
 * SOLUTION: Master DB acts as a "directory service" with optimized lookup:
 * 1. Check stores table (includes slug, primary_custom_domain, custom_domains_count)
 * 2. ONLY if custom_domains_count > 1, check custom_domains_lookup for secondary domains
 * 3. Use the store_id to fetch full data from tenant DB
 *
 * Performance optimization:
 * - 99% of requests: Single query to stores table (slug or primary domain)
 * - Only stores with 2+ domains trigger the lookup query
 * - Avoids unnecessary join for stores with 0 or 1 domain
 *
 * This is different from other routes because:
 * - Most routes receive store_id directly (from x-store-id header or query param)
 * - Bootstrap is the FIRST call from storefront, so it only has the slug/domain
 * - We use master for routing (slug/domain -> store_id), then fetch all data from tenant
 *
 * @param {string} slug - Store slug OR custom domain to look up
 * @returns {Promise<Object>} { storeId, store, tenantDb }
 */
async function getStoreBySlug(slug) {
  const { masterDbClient } = require('../database/masterConnection');
  let masterStore = null;

  // Step 1: Check stores table first (includes slug, primary_custom_domain, AND custom_domains_count)
  // This handles 99% of cases with a single query
  const { data, error: masterError } = await masterDbClient
    .from('stores')
    .select('id, is_active, primary_custom_domain, custom_domains_count, published')
    .or(`slug.eq.${slug},primary_custom_domain.eq.${slug.toLowerCase()}`)
    .eq('is_active', true)
    .maybeSingle();

  if (data) {
    masterStore = data;
    const matchType = data.primary_custom_domain?.toLowerCase() === slug.toLowerCase() ? 'primary custom domain' : 'slug';
    console.log(`✅ Resolved ${matchType} "${slug}" to store_id: ${masterStore.id}`);
  }

  // Step 2: If not found AND looks like domain AND store might have multiple domains
  // ONLY THEN check custom_domains_lookup for secondary domains
  if (!masterStore && slug.includes('.')) {
    console.log(`🔍 Checking custom_domains_lookup for secondary domain "${slug}"...`);

    try {
      const { data: domainLookup, error: domainError } = await masterDbClient
        .from('custom_domains_lookup')
        .select('store_id, is_verified, is_active')
        .eq('domain', slug.toLowerCase())
        .eq('is_verified', true)
        .eq('is_active', true)
        .maybeSingle();

      if (domainLookup && !domainError) {
        console.log(`✅ Found secondary custom domain "${slug}" -> store_id: ${domainLookup.store_id}`);
        masterStore = { id: domainLookup.store_id, is_active: true };
      }
    } catch (err) {
      console.warn(`⚠️ Error checking custom_domains_lookup:`, err.message);
    }
  }

  // Step 3: If still not found, throw error
  if (!masterStore) {
    throw new Error(`Store not found with slug or domain: ${slug}`);
  }

  // Step 2: Get tenant connection using store_id
  const tenantDb = await ConnectionManager.getStoreConnection(masterStore.id);

  // Step 3: Fetch full store data from tenant DB (authoritative source)
  // Note: Each tenant typically has one active store. We query by is_active
  // rather than by ID since masterStore.id is the tenant identifier, not the store's UUID
  const { data: store, error: tenantError } = await tenantDb
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (tenantError || !store) {
    throw new Error(`Store data not found in tenant DB for store_id: ${masterStore.id}`);
  }

  // Override published field from master DB (master is authoritative for published status)
  store.published = masterStore.published;

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
    const storefront = req.query.storefront || 'primary';
    // Include storefront in cache key for different theme variants
    return `bootstrap:${slug}:${lang}:${storefront}`;
  },
  // Skip caching if user is authenticated (personalized data) or previewing specific storefront
  condition: (req) => !req.headers.authorization && !req.query.storefront
}), async (req, res) => {
  try {
    const { slug, lang, session_id, user_id, storefront: storefrontSlug } = req.query;
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
        const { masterDbClient } = require('../database/masterConnection');
        const { data: user, error: userError } = await masterDbClient
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

    // Get active storefront (handles preview, scheduling, and primary fallback)
    let activeStorefront = null;
    try {
      activeStorefront = await getActiveStorefront(tenantDb, store.id, storefrontSlug);

      // If storefront exists, merge settings_override into store.settings
      if (activeStorefront && activeStorefront.settings_override) {
        const originalSettings = store.settings || {};
        const overrideSettings = activeStorefront.settings_override || {};

        // Deep merge: storefront settings override store settings
        store.settings = {
          ...originalSettings,
          ...overrideSettings,
          // Deep merge theme object if both exist
          theme: {
            ...(originalSettings.theme || {}),
            ...(overrideSettings.theme || {})
          }
        };

        console.log(`✅ Merged storefront settings: ${activeStorefront.name}`);
      }
    } catch (err) {
      console.warn('⚠️ Failed to get storefront, using default store settings:', err.message);
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
          // Note: hide_in_menu filter removed - sitemap needs all categories
          // Menu navigation should filter client-side if needed
          const { data: categories, error: catError } = await tenantDb
            .from('categories')
            .select('*')
            .eq('store_id', store.id)
            .eq('is_active', true)
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
            .select('id, price, slug, name')
            .in('id', productIds);

          if (productsError) {
            console.warn('⚠️ Failed to fetch wishlist products:', productsError.message);
            return wishlistItems.map(w => ({ ...w, Product: null }));
          }

          // Fetch images from product_files table
          const { data: productFiles, error: filesError } = await tenantDb
            .from('product_files')
            .select('*')
            .in('product_id', productIds)
            .eq('file_type', 'image')
            .order('position', { ascending: true });

          if (filesError) {
            console.warn('⚠️ Failed to fetch product images:', filesError.message);
          }

          // Group images by product_id
          const imagesByProduct = {};
          (productFiles || []).forEach(file => {
            if (!imagesByProduct[file.product_id]) {
              imagesByProduct[file.product_id] = [];
            }
            imagesByProduct[file.product_id].push({
              url: file.file_url,
              alt: file.alt_text || '',
              isPrimary: file.is_primary || file.position === 0,
              position: file.position || 0
            });
          });

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

          // Apply translations and images to products
          const productsWithTrans = products.map(p => {
            const trans = transMap[p.id];
            const requestedLang = trans?.[language];
            const englishLang = trans?.['en'];

            return {
              ...p,
              name: requestedLang?.name || englishLang?.name || '',
              description: requestedLang?.description || englishLang?.description || '',
              short_description: requestedLang?.short_description || englishLang?.short_description || '',
              images: imagesByProduct[p.id] || []
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
        storefront: activeStorefront ? {
          id: activeStorefront.id,
          name: activeStorefront.name,
          slug: activeStorefront.slug,
          is_primary: activeStorefront.is_primary,
          publish_start_at: activeStorefront.publish_start_at,
          publish_end_at: activeStorefront.publish_end_at
        } : null,
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
          isPreviewMode: !!storefrontSlug,
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
