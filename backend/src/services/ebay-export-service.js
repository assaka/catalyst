const MarketplaceAIOptimizer = require('./marketplace-ai-optimizer');
const IntegrationConfig = require('../models/IntegrationConfig');
const Product = require('../models/Product');

/**
 * eBay Export Service
 * Simplified credential-based eBay integration
 */
class EbayExportService {
  constructor(storeId) {
    this.storeId = storeId;
    this.integration = null;
    this.aiOptimizer = new MarketplaceAIOptimizer();
  }

  async initialize() {
    this.integration = await IntegrationConfig.findByStoreAndType(this.storeId, 'ebay');

    if (!this.integration) {
      throw new Error('eBay integration not configured for this store');
    }

    const config = this.integration.config_data;

    // Validate required credentials
    const requiredFields = ['appId', 'certId', 'devId', 'authToken'];
    const missing = requiredFields.filter(field => !config[field]);

    if (missing.length > 0) {
      throw new Error(`Missing eBay credentials: ${missing.join(', ')}`);
    }

    return { success: true };
  }

  async exportProducts(productIds, options = {}) {
    const exportSettings = this.integration?.config_data?.exportSettings || {};
    const {
      useAIOptimization = exportSettings.use_ai_optimization || false,
      listingFormat = exportSettings.listing_format || 'FixedPrice',
      listingDuration = exportSettings.listing_duration || '30',
      progressCallback = null
    } = options;

    const products = await Product.findAll({
      where: {
        id: productIds,
        store_id: this.storeId
      }
    });

    const results = {
      total: products.length,
      successful: 0,
      failed: 0,
      listings: [],
      errors: []
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        if (progressCallback) {
          await progressCallback({
            stage: 'processing',
            current: i + 1,
            total: products.length,
            item: product.name
          });
        }

        let listing = this.transformToEbayListing(product, listingFormat, listingDuration);

        if (useAIOptimization) {
          const optimized = await this.aiOptimizer.optimizeForEbay(product, {
            listingFormat,
            listingDuration
          });

          if (optimized.success) {
            listing.title = optimized.optimizedTitle;
            listing.description = optimized.htmlDescription;
            listing.itemSpecifics = optimized.itemSpecifics;
          }
        }

        results.listings.push(listing);
        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          productId: product.id,
          error: error.message
        });
      }
    }

    // Update statistics
    const stats = this.integration.config_data.statistics || {};
    this.integration.config_data = {
      ...this.integration.config_data,
      statistics: {
        ...stats,
        total_exports: (stats.total_exports || 0) + 1,
        successful_exports: (stats.successful_exports || 0) + (results.successful > 0 ? 1 : 0),
        failed_exports: (stats.failed_exports || 0) + (results.failed > 0 ? 1 : 0),
        total_products_synced: (stats.total_products_synced || 0) + results.successful
      }
    };
    await this.integration.updateSyncStatus('success');

    return results;
  }

  transformToEbayListing(product, format, duration) {
    return {
      title: product.name.substring(0, 80),
      description: this.generateHTMLDescription(product),
      categoryId: this.mapCategory(product.category_name),
      listingFormat: format,
      duration: duration,
      startPrice: product.price,
      quantity: product.stock_quantity || 0,
      condition: product.condition || 'New',
      itemSpecifics: this.generateItemSpecifics(product),
      images: this.getProductImages(product),
      shippingDetails: {
        shippingType: 'Flat',
        shippingCost: 0
      }
    };
  }

  generateHTMLDescription(product) {
    return `
      <div style="font-family: Arial, sans-serif;">
        <h2>${product.name}</h2>
        <p>${product.description || ''}</p>
        ${product.features ? `<ul>${product.features.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
        <p><strong>Fast Shipping!</strong></p>
      </div>
    `;
  }

  generateItemSpecifics(product) {
    const specifics = [];
    if (product.brand) specifics.push({ name: 'Brand', value: product.brand });
    if (product.color) specifics.push({ name: 'Color', value: product.color });
    if (product.size) specifics.push({ name: 'Size', value: product.size });
    return specifics;
  }

  mapCategory(categoryName) {
    // Simplified category mapping - extend as needed
    const mapping = {
      'Electronics': '293',
      'Clothing': '11450',
      'Home & Garden': '11700'
    };
    return mapping[categoryName] || '0';
  }

  getProductImages(product) {
    const images = [];
    if (product.image_url) images.push(product.image_url);
    if (product.images) images.push(...product.images);
    return images.map(img => img.startsWith('http') ? img : `${process.env.STORAGE_URL}${img}`);
  }
}

module.exports = EbayExportService;
