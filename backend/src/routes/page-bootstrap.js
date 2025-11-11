const express = require('express');
const {
  Product,
  Attribute,
  AttributeSet,
  ProductLabel,
  CustomOptionRule,
  ProductTab,
  Tax,
  ShippingMethod,
  PaymentMethod,
  DeliverySettings,
  CmsBlock
} = require('../models');
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

    let pageData = {};

    switch (page_type) {
      case 'product':
        // Product page needs: attributes, attribute sets, labels, custom options, tabs
        const [attributes, attributeSets, productLabels, customOptionRules, productTabs] = await Promise.all([
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
          CustomOptionRule.findAll({
            where: { store_id },
            order: [['sort_order', 'ASC']]
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
          customOptionRules: customOptionRules || [],
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
            where: { store_id },
            order: [['sort_order', 'ASC']]
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
        const [featuredProducts, cmsBlocks] = await Promise.all([
          Product.findAll({
            where: { store_id, is_featured: true, is_active: true },
            limit: 12,
            order: [['created_at', 'DESC']]
          }).then(products => applyProductTranslationsToMany(products, language)),
          CmsBlock.findAll({
            where: { store_id, is_active: true },
            order: [['sort_order', 'ASC']]
          })
        ]);

        pageData = {
          featuredProducts: featuredProducts || [],
          cmsBlocks: cmsBlocks || []
        };
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
    res.status(500).json({
      success: false,
      message: 'Failed to load page data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
