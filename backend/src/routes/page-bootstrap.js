const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { applyProductTranslationsToMany } = require('../utils/productHelpers');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const router = express.Router();

/**
 * @route   GET /api/public/page-bootstrap
 * @desc    Get page-specific data in one request
 * @access  Public
 * @cache   5 minutes (Redis) - Page-specific data
 * @query   {string} page_type - Page type: product, category, checkout, homepage
 * @query   {string} store_id - Store ID (required)
 * @query   {string} lang - Language code (optional)
 */
router.get('/', cacheMiddleware({
  prefix: 'page-bootstrap',
  ttl: 300, // 5 minutes
  keyGenerator: (req) => {
    const pageType = req.query.page_type || 'default';
    const storeId = req.query.store_id || 'default';
    const lang = req.query.lang || 'en';
    return `page-bootstrap:${pageType}:${storeId}:${lang}`;
  }
}), async (req, res) => {
  try {
    const { page_type, store_id, lang } = req.query;
    const language = lang || 'en';

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!page_type) {
      return res.status(400).json({
        success: false,
        message: 'Page type is required'
      });
    }

    // Get tenant connection
    const connection = await ConnectionManager.getStoreConnection(store_id);
    const {
      Product,
      Attribute,
      AttributeSet,
      ProductLabel,
      ProductTab,
      Tax,
      ShippingMethod,
      PaymentMethod,
      DeliverySettings,
      CmsBlock
    } = connection.models;

    let pageData = {};

    switch (page_type) {
      case 'product':
        // Product page needs: attributes, attribute sets, labels, tabs
        const [attributes, attributeSets, productLabels, productTabs] = await Promise.all([
          Attribute.findAll({
            where: { store_id },
            order: [['name', 'ASC']]
          }),
          AttributeSet.findAll({
            where: { store_id },
            order: [['name', 'ASC']]
          }),
          ProductLabel.findAll({
            where: { store_id, is_active: true },
            order: [['name', 'ASC']]
          }),
          ProductTab.findAll({
            where: { store_id, is_active: true },
            order: [['sort_order', 'ASC']]
          })
        ]);

        pageData = {
          attributes: attributes || [],
          attributeSets: attributeSets || [],
          productLabels: productLabels || [],
          productTabs: productTabs || []
        };
        break;

      case 'category':
        // Category page needs: filterable attributes, labels
        const [filterableAttributes, categoryLabels] = await Promise.all([
          Attribute.findAll({
            where: { store_id, is_filterable: true },
            order: [['name', 'ASC']]
          }),
          ProductLabel.findAll({
            where: { store_id, is_active: true },
            order: [['name', 'ASC']]
          })
        ]);

        pageData = {
          filterableAttributes: filterableAttributes || [],
          productLabels: categoryLabels || []
        };
        break;

      case 'cart':
        // Cart page needs: cart slot config, taxes
        try {
          const [cartSlotConfig, cartTaxes] = await Promise.all([
            SlotConfiguration.findLatestPublished(store_id, 'cart').catch(() => null),
            Tax.findAll({
              where: { store_id, is_active: true },
              order: [['name', 'ASC']]
            })
          ]);

          pageData = {
            cartSlotConfig: cartSlotConfig,
            taxes: cartTaxes || []
          };
        } catch (cartError) {
          console.error('Cart bootstrap error:', cartError);
          pageData = {
            cartSlotConfig: null,
            taxes: []
          };
        }
        break;

      case 'checkout':
        // Checkout page needs: taxes, shipping, payment, delivery settings
        const [taxes, shippingMethods, paymentMethods, deliverySettings] = await Promise.all([
          Tax.findAll({
            where: { store_id, is_active: true },
            order: [['name', 'ASC']]
          }),
          ShippingMethod.findAll({
            where: { store_id, is_active: true },
            order: [['sort_order', 'ASC']]
          }),
          PaymentMethod.findAll({
            where: { store_id, is_active: true },
            order: [['sort_order', 'ASC']]
          }),
          DeliverySettings.findAll({
            where: { store_id }
            // Note: DeliverySettings doesn't have sort_order column
          })
        ]);

        pageData = {
          taxes: taxes || [],
          shippingMethods: shippingMethods || [],
          paymentMethods: paymentMethods || [],
          deliverySettings: deliverySettings || []
        };
        break;

      case 'homepage':
        // Homepage needs: featured products, CMS blocks
        try {
          const [featuredProducts, cmsBlocks] = await Promise.all([
            Product.findAll({
              where: { store_id, is_featured: true, is_active: true },
              limit: 12,
              order: [['created_at', 'DESC']]
            }),
            CmsBlock.findAll({
              where: { store_id, is_active: true },
              order: [['sort_order', 'ASC']]
            })
          ]);

          // Apply translations if products exist
          const translatedProducts = featuredProducts && featuredProducts.length > 0
            ? await applyProductTranslationsToMany(featuredProducts, language)
            : [];

          pageData = {
            featuredProducts: translatedProducts,
            cmsBlocks: cmsBlocks || []
          };
        } catch (homepageError) {
          console.error('Homepage bootstrap error:', homepageError);
          // Return empty data instead of failing
          pageData = {
            featuredProducts: [],
            cmsBlocks: []
          };
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Invalid page_type: ${page_type}`
        });
    }

    res.json({
      success: true,
      data: pageData,
      meta: {
        page_type,
        store_id,
        language,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Page bootstrap error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      pageType: req.query.page_type,
      storeId: req.query.store_id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to load page data',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
