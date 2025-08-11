class DummyImageService {
  constructor() {
    this.placeholderService = 'https://picsum.photos';
    this.localFallbacks = {
      product: '/assets/placeholder-product.jpg',
      category: '/assets/placeholder-category.jpg',
      logo: '/assets/placeholder-logo.svg',
      banner: '/assets/placeholder-banner.jpg',
      thumbnail: '/assets/placeholder-thumbnail.jpg'
    };
  }

  /**
   * Generate dummy image URL for a specific type and dimensions
   */
  generateDummyImage(type, width = 400, height = 400, seed = null) {
    // Use seed for consistent images per product/category
    const seedParam = seed ? `?random=${seed}` : `?random=${Math.floor(Math.random() * 1000)}`;
    
    switch (type) {
      case 'product':
        return `${this.placeholderService}/${width}/${height}${seedParam}`;
      case 'category':
        return `${this.placeholderService}/${width}/${height}${seedParam}`;
      case 'logo':
        return `${this.placeholderService}/${width}/${width}${seedParam}`;
      case 'banner':
        return `${this.placeholderService}/${width}/${Math.floor(height * 0.3)}${seedParam}`;
      case 'thumbnail':
        return `${this.placeholderService}/${width}/${width}${seedParam}`;
      default:
        return `${this.placeholderService}/${width}/${height}${seedParam}`;
    }
  }

  /**
   * Get fallback image URL when external service fails
   */
  getFallbackImage(type) {
    return this.localFallbacks[type] || this.localFallbacks.product;
  }

  /**
   * Generate product images array with dummy images
   */
  generateProductImages(productId, count = 3) {
    const images = [];
    for (let i = 0; i < count; i++) {
      images.push({
        id: `dummy-${productId}-${i}`,
        url: this.generateDummyImage('product', 800, 800, `${productId}-${i}`),
        alt: `Product image ${i + 1}`,
        is_primary: i === 0,
        sort_order: i,
        type: 'dummy'
      });
    }
    return images;
  }

  /**
   * Generate category image
   */
  generateCategoryImage(categoryId) {
    return {
      id: `dummy-category-${categoryId}`,
      url: this.generateDummyImage('category', 600, 400, categoryId),
      alt: 'Category image',
      type: 'dummy'
    };
  }

  /**
   * Generate store logo
   */
  generateStoreLogo(storeId) {
    return {
      id: `dummy-logo-${storeId}`,
      url: this.generateDummyImage('logo', 200, 200, storeId),
      alt: 'Store logo',
      type: 'dummy'
    };
  }

  /**
   * Generate store banner
   */
  generateStoreBanner(storeId) {
    return {
      id: `dummy-banner-${storeId}`,
      url: this.generateDummyImage('banner', 1200, 400, storeId),
      alt: 'Store banner',
      type: 'dummy'
    };
  }

  /**
   * Check if image URL is a dummy image
   */
  isDummyImage(url) {
    return url && (
      url.includes('picsum.photos') ||
      url.includes('/assets/placeholder-') ||
      url.includes('dummy-')
    );
  }

  /**
   * Replace dummy images with real ones when Supabase is connected
   */
  async replaceDummyImages(storeId, imageReplacements) {
    const supabaseIntegration = require('./supabase-integration');
    const connectionStatus = await supabaseIntegration.getConnectionStatus(storeId);
    
    if (!connectionStatus.connected) {
      return {
        success: false,
        message: 'Supabase not connected, cannot replace dummy images'
      };
    }

    // Process image replacements
    const results = [];
    for (const replacement of imageReplacements) {
      try {
        // Upload the real image to replace the dummy
        const uploadResult = await supabaseIntegration.uploadImage(
          storeId,
          replacement.file,
          replacement.path,
          replacement.options || {}
        );
        
        if (uploadResult.success) {
          results.push({
            dummy_url: replacement.dummy_url,
            real_url: uploadResult.url,
            success: true
          });
        } else {
          results.push({
            dummy_url: replacement.dummy_url,
            error: uploadResult.error,
            success: false
          });
        }
      } catch (error) {
        results.push({
          dummy_url: replacement.dummy_url,
          error: error.message,
          success: false
        });
      }
    }

    return {
      success: true,
      replacements: results,
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  /**
   * Generate complete dummy store data
   */
  generateDummyStoreData(storeId, storeName) {
    return {
      logo: this.generateStoreLogo(storeId),
      banner: this.generateStoreBanner(storeId),
      featured_products: Array.from({ length: 6 }, (_, i) => ({
        id: `dummy-product-${i + 1}`,
        name: `Sample Product ${i + 1}`,
        price: Math.floor(Math.random() * 100) + 10,
        images: this.generateProductImages(`product-${i + 1}`, 1)
      })),
      categories: Array.from({ length: 4 }, (_, i) => ({
        id: `dummy-category-${i + 1}`,
        name: `Category ${i + 1}`,
        image: this.generateCategoryImage(`category-${i + 1}`)
      }))
    };
  }
}

module.exports = new DummyImageService();