const { XMLBuilder } = require('fast-xml-parser');

/**
 * Amazon Feed Generator
 *
 * Generates Amazon MWS-compatible XML feeds using fast-xml-parser
 * More future-proof and performant than xmlbuilder2
 */
class AmazonFeedGenerator {
  constructor(sellerId, marketplaceId = 'ATVPDKIKX0DER') {
    this.sellerId = sellerId;
    this.marketplaceId = marketplaceId;
    this.merchantIdentifier = sellerId;

    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      indentBy: '  ',
      suppressEmptyNode: true,
      attributeNamePrefix: '@_'
    });
  }

  /**
   * Generate Product Feed
   */
  generateProductFeed(products, options = {}) {
    const messages = products.map((product, index) => this.buildProductMessage(product, index + 1));

    const feed = {
      '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
      AmazonEnvelope: {
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xsi:noNamespaceSchemaLocation': 'amzn-envelope.xsd',
        Header: {
          DocumentVersion: '1.01',
          MerchantIdentifier: this.merchantIdentifier
        },
        MessageType: options.messageType || 'Product',
        ...(options.purgeAndReplace && { PurgeAndReplace: 'true' }),
        Message: messages
      }
    };

    return this.xmlBuilder.build(feed);
  }

  buildProductMessage(product, messageId) {
    const productData = {
      SKU: this.sanitizeSKU(product.sku)
    };

    // Standard Product ID
    if (product.asin) {
      productData.StandardProductID = { Type: 'ASIN', Value: product.asin };
    } else if (product.upc) {
      productData.StandardProductID = { Type: 'UPC', Value: product.upc };
    } else if (product.ean) {
      productData.StandardProductID = { Type: 'EAN', Value: product.ean };
    }

    // Description Data
    productData.DescriptionData = {
      Title: this.truncate(product.title, 200),
      ...(product.brand && { Brand: this.truncate(product.brand, 50) }),
      ...(product.description && { Description: this.truncate(product.description, 2000) }),
      ...(product.manufacturer && { Manufacturer: this.truncate(product.manufacturer, 50) })
    };

    // Bullet Points
    if (product.bulletPoints && product.bulletPoints.length > 0) {
      productData.DescriptionData.BulletPoint = product.bulletPoints
        .slice(0, 5)
        .map(bp => this.truncate(bp, 500));
    }

    // Search Terms
    if (product.searchTerms && product.searchTerms.length > 0) {
      productData.DescriptionData.SearchTerms = product.searchTerms
        .slice(0, 5)
        .map(term => this.truncate(term, 50));
    }

    // Product Data (category-specific)
    if (product.productType) {
      productData.ProductData = {
        [product.productType]: {
          ...(product.color && { Color: product.color }),
          ...(product.size && { Size: product.size }),
          ...(product.material && { MaterialType: product.material })
        }
      };
    }

    return {
      MessageID: String(messageId),
      OperationType: product.operation || 'Update',
      Product: productData
    };
  }

  /**
   * Generate Inventory Feed
   */
  generateInventoryFeed(inventoryItems) {
    const messages = inventoryItems.map((item, index) => ({
      MessageID: String(index + 1),
      OperationType: 'Update',
      Inventory: {
        SKU: this.sanitizeSKU(item.sku),
        Quantity: String(item.quantity || 0),
        ...(item.fulfillmentLatency && { FulfillmentLatency: String(item.fulfillmentLatency) })
      }
    }));

    const feed = {
      '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
      AmazonEnvelope: {
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xsi:noNamespaceSchemaLocation': 'amzn-envelope.xsd',
        Header: {
          DocumentVersion: '1.01',
          MerchantIdentifier: this.merchantIdentifier
        },
        MessageType: 'Inventory',
        Message: messages
      }
    };

    return this.xmlBuilder.build(feed);
  }

  /**
   * Generate Price Feed
   */
  generatePriceFeed(priceItems) {
    const messages = priceItems.map((item, index) => ({
      MessageID: String(index + 1),
      Price: {
        SKU: this.sanitizeSKU(item.sku),
        StandardPrice: {
          '@_currency': item.currency || 'USD',
          '#text': String(item.price.toFixed(2))
        },
        ...(item.salePrice && {
          Sale: {
            StartDate: item.saleStartDate || new Date().toISOString(),
            EndDate: item.saleEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            SalePrice: {
              '@_currency': item.currency || 'USD',
              '#text': String(item.salePrice.toFixed(2))
            }
          }
        })
      }
    }));

    const feed = {
      '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
      AmazonEnvelope: {
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xsi:noNamespaceSchemaLocation': 'amzn-envelope.xsd',
        Header: {
          DocumentVersion: '1.01',
          MerchantIdentifier: this.merchantIdentifier
        },
        MessageType: 'Price',
        Message: messages
      }
    };

    return this.xmlBuilder.build(feed);
  }

  /**
   * Generate Image Feed
   */
  generateImageFeed(imageItems) {
    const messages = imageItems.map((item, index) => ({
      MessageID: String(index + 1),
      OperationType: 'Update',
      ProductImage: {
        SKU: this.sanitizeSKU(item.sku),
        ImageType: item.imageType || 'Main',
        ImageLocation: item.imageUrl
      }
    }));

    const feed = {
      '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
      AmazonEnvelope: {
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@_xsi:noNamespaceSchemaLocation': 'amzn-envelope.xsd',
        Header: {
          DocumentVersion: '1.01',
          MerchantIdentifier: this.merchantIdentifier
        },
        MessageType: 'ProductImage',
        Message: messages
      }
    };

    return this.xmlBuilder.build(feed);
  }

  /**
   * Sanitize SKU
   */
  sanitizeSKU(sku) {
    if (!sku) return 'SKU-MISSING';
    return String(sku).replace(/[^a-zA-Z0-9\-_.:]/g, '-').substring(0, 40);
  }

  /**
   * Truncate string
   */
  truncate(str, maxLength) {
    if (!str) return '';
    const cleaned = String(str).trim();
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength - 3) + '...' : cleaned;
  }

  /**
   * Validate product
   */
  validateProduct(product) {
    const errors = [];

    if (!product.sku) errors.push('SKU is required');
    if (!product.title) errors.push('Title is required');
    if (!product.upc && !product.ean && !product.isbn && !product.asin) {
      errors.push('At least one product identifier (UPC, EAN, ISBN, or ASIN) is required');
    }
    if (product.title && product.title.length > 200) {
      errors.push('Title exceeds maximum length of 200 characters');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Batch validate products
   */
  validateProducts(products) {
    const results = products.map((product, index) => ({
      index,
      sku: product.sku,
      ...this.validateProduct(product)
    }));

    return {
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      total: products.length,
      errors: results.filter(r => !r.valid)
    };
  }
}

module.exports = AmazonFeedGenerator;
