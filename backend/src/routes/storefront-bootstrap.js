const express = require('express');
const { Store, Language, Category, Wishlist, User, SeoSettings, SeoTemplate } = require('../models');
const SlotConfiguration = require('../models/SlotConfiguration');
const translationService = require('../services/translation-service');
const { getCategoriesWithTranslations } = require('../utils/categoryHelpers');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const { applyProductTranslationsToMany } = require('../utils/productHelpers');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { masterSupabaseClient } = require('../database/masterConnection');
const ConnectionManager = require('../services/database/ConnectionManager');
const jwt = require('jsonwebtoken');
const router = express.Router();

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
        authenticatedUser = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });
      } catch (err) {
        // Invalid token - continue without auth
        console.warn('Invalid auth token in bootstrap request:', err.message);
      }
    }

    // CRITICAL FIX: Fetch store from master DB by slug, then get tenant DB connection
    console.log('🔍 Looking up store by slug in master DB:', slug);
    const { data: masterStore, error: masterError } = await masterSupabaseClient
      .from('stores')
      .select('id, slug, status, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (masterError || !masterStore) {
      console.log('❌ Store not found in master DB for slug:', slug);
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    console.log('✅ Found store in master DB:', masterStore.id);

    // Get full store data from tenant DB
    const tenantDb = await ConnectionManager.getStoreConnection(masterStore.id);
    const { data: store, error: tenantError } = await tenantDb
      .from('stores')
      .select('*')
      .eq('id', masterStore.id)
      .single();

    if (tenantError || !store) {
      console.error('❌ Failed to get store from tenant DB:', tenantError?.message);
      return res.status(500).json({
        success: false,
        message: 'Store configuration error'
      });
    }

    console.log('✅ Loaded store from tenant DB:', store.name);

    // Execute all other queries in parallel using store.id (NO more store queries!)
    const [
      languages,
      translationsResult,
      categoriesResult,
      wishlistResult,
      headerSlotConfigResult,
      seoSettingsResult,
      seoTemplatesResult
    ] = await Promise.all([
      // 1. Get all active languages
      Language.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      }),

      // 2. Get UI translations using store.id (no duplicate query!)
      translationService.getUILabels(store.id, language),

      // 3. Get categories using store.id (no duplicate query!)
      getCategoriesWithTranslations(
        {
          store_id: store.id,
          is_active: true,
          hide_in_menu: false
        },
        language,
        { limit: 1000, offset: 0 }
      ),

      // 5. Get wishlist (if session_id, user_id, or auth provided)
      (async () => {
        const effectiveUserId = authenticatedUser?.id || user_id;
        const effectiveSessionId = session_id;

        if (!effectiveUserId && !effectiveSessionId) {
          return [];
        }

        try {
          const whereClause = {};
          if (effectiveUserId) whereClause.user_id = effectiveUserId;
          if (effectiveSessionId) whereClause.session_id = effectiveSessionId;

          const wishlist = await Wishlist.findAll({
            where: whereClause,
            include: [
              {
                model: require('../models').Product,
                attributes: ['id', 'price', 'images', 'slug', 'name']
              }
            ],
            order: [['added_at', 'DESC']]
          });

          // Apply translations to products in wishlist
          const wishlistWithTranslations = await Promise.all(
            wishlist.map(async (item) => {
              const itemData = item.toJSON();
              if (itemData.Product) {
                const [productWithTranslation] = await applyProductTranslationsToMany([itemData.Product], language);
                itemData.Product = productWithTranslation;
              }
              return itemData;
            })
          );

          return wishlistWithTranslations;
        } catch (error) {
          console.error('Error fetching wishlist in bootstrap:', error);
          return [];
        }
      })(),

      // 4. Get header slot configuration using store.id (no duplicate query!)
      (async () => {
        try {
          // First try to find published version
          let configuration = await SlotConfiguration.findLatestPublished(store.id, 'header');

          // If no published version, try to find draft
          if (!configuration) {
            configuration = await SlotConfiguration.findOne({
              where: {
                store_id: store.id,
                status: 'draft',
                page_type: 'header'
              },
              order: [['version_number', 'DESC']]
            });
          }

          return configuration;
        } catch (error) {
          console.error('Error fetching header slot config in bootstrap:', error);
          return null;
        }
      })(),

      // 5. Get SEO settings using store.id (no duplicate query!)
      (async () => {
        try {
          const seoSettings = await SeoSettings.findOne({
            where: { store_id: store.id }
          });
          return seoSettings;
        } catch (error) {
          console.error('Error fetching SEO settings in bootstrap:', error);
          return null;
        }
      })(),

      // 6. Get active SEO templates using store.id (no duplicate query!)
      (async () => {
        try {
          const templates = await SeoTemplate.findAll({
            where: {
              store_id: store.id,
              is_active: true
            },
            order: [['sort_order', 'ASC'], ['type', 'ASC']]
          });
          return templates;
        } catch (error) {
          console.error('Error fetching SEO templates in bootstrap:', error);
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
        languages: languages,
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
