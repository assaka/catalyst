const CloudflareImageService = require('./cloudflare-image-service');
const { v4: uuidv4 } = require('uuid');

class AkeneoImageProcessor {
  constructor(config = {}) {
    this.cloudflareService = new CloudflareImageService(config.cloudflare);
    this.imageAttributeNames = config.imageAttributeNames || [
      'image', 'images', 'picture', 'pictures', 'photo', 'photos',
      'main_image', 'product_image', 'gallery', 'thumbnail',
      'media', 'assets', 'attachments'
    ];
    this.processingEnabled = config.processingEnabled !== false;
    
    console.log('🖼️ AkeneoImageProcessor initialized');
    console.log('  Processing enabled:', this.processingEnabled);
    console.log('  Watching attributes:', this.imageAttributeNames);
  }

  /**
   * Extract all image URLs from Akeneo product values
   */
  extractImageUrls(akeneoProduct, baseUrl = null) {
    const imageUrls = [];
    const values = akeneoProduct.values || {};
    
    console.log(`🔍 Extracting images for product: ${akeneoProduct.identifier || akeneoProduct.uuid}`);
    
    // Search through all specified image attribute names
    this.imageAttributeNames.forEach(attrName => {
      const attribute = values[attrName];
      
      if (attribute && Array.isArray(attribute)) {
        attribute.forEach((item, index) => {
          const imageUrl = this.extractImageUrl(item, baseUrl);
          if (imageUrl) {
            imageUrls.push({
              url: imageUrl,
              attribute: attrName,
              scope: item.scope || null,
              locale: item.locale || null,
              index: index,
              metadata: {
                sku: akeneoProduct.identifier,
                uuid: akeneoProduct.uuid,
                family: akeneoProduct.family,
                attribute_name: attrName
              }
            });
          }
        });
      }
    });

    // Also check for any attribute that might contain image data
    Object.keys(values).forEach(attrName => {
      // Skip if already processed
      if (this.imageAttributeNames.includes(attrName)) return;
      
      const attribute = values[attrName];
      if (attribute && Array.isArray(attribute)) {
        attribute.forEach((item, index) => {
          // Check if this looks like an image URL or file reference
          if (this.looksLikeImageData(item)) {
            const imageUrl = this.extractImageUrl(item, baseUrl);
            if (imageUrl) {
              imageUrls.push({
                url: imageUrl,
                attribute: attrName,
                scope: item.scope || null,
                locale: item.locale || null,
                index: index,
                metadata: {
                  sku: akeneoProduct.identifier,
                  uuid: akeneoProduct.uuid,
                  family: akeneoProduct.family,
                  attribute_name: attrName,
                  discovered: true // Mark as discovered vs explicitly configured
                }
              });
            }
          }
        });
      }
    });

    console.log(`📊 Found ${imageUrls.length} images for product ${akeneoProduct.identifier}`);
    return imageUrls;
  }

  /**
   * Extract image URL from Akeneo attribute item
   */
  extractImageUrl(item, baseUrl = null) {
    if (!item || !item.data) return null;
    
    let imageUrl = item.data;
    
    // Handle different formats of image data
    if (typeof imageUrl === 'object') {
      // Handle object with URL property
      imageUrl = imageUrl.url || imageUrl.path || imageUrl.href || null;
    }
    
    if (typeof imageUrl !== 'string') return null;
    
    // Make URL absolute if it's relative
    if (baseUrl && imageUrl.startsWith('/')) {
      imageUrl = `${baseUrl.replace(/\/$/, '')}${imageUrl}`;
    }
    
    // Validate URL format
    try {
      new URL(imageUrl);
      return imageUrl;
    } catch (error) {
      console.warn(`⚠️ Invalid image URL: ${imageUrl}`);
      return null;
    }
  }

  /**
   * Check if attribute item looks like image data
   */
  looksLikeImageData(item) {
    if (!item || !item.data) return false;
    
    const data = item.data;
    
    // Check if data is a string that looks like a URL
    if (typeof data === 'string') {
      return /\\.(jpg|jpeg|png|gif|webp|svg)$/i.test(data) || 
             data.includes('/media/') || 
             data.includes('/image/') ||
             data.includes('.jpg') ||
             data.includes('.png');
    }
    
    // Check if data is an object with URL-like properties
    if (typeof data === 'object') {
      return !!(data.url || data.path || data.href);
    }
    
    return false;
  }

  /**
   * Process images for a single product
   */
  async processProductImages(akeneoProduct, baseUrl = null, options = {}) {
    if (!this.processingEnabled) {
      console.log('🚫 Image processing is disabled');
      return this.extractImagesWithoutProcessing(akeneoProduct, baseUrl);
    }

    try {
      console.log(`🖼️ Processing images for product: ${akeneoProduct.identifier}`);
      
      // Extract all image URLs
      const imageData = this.extractImageUrls(akeneoProduct, baseUrl);
      
      if (imageData.length === 0) {
        console.log(`📭 No images found for product: ${akeneoProduct.identifier}`);
        return [];
      }

      // Process images through Cloudflare
      const processedImages = [];
      const concurrency = options.concurrency || 3;
      
      // Group images by priority (main images first)
      const prioritizedImages = this.prioritizeImages(imageData);
      
      for (let i = 0; i < prioritizedImages.length; i += concurrency) {
        const batch = prioritizedImages.slice(i, i + concurrency);
        
        const batchPromises = batch.map(async (imageItem) => {
          try {
            const result = await this.cloudflareService.processImage(
              imageItem.url,
              {
                ...imageItem.metadata,
                alt: this.generateAltText(akeneoProduct, imageItem),
                scope: imageItem.scope,
                locale: imageItem.locale
              }
            );
            
            return {
              ...result,
              ...this.cloudflareService.generateImageVariants(result),
              sort_order: imageItem.index,
              attribute: imageItem.attribute,
              scope: imageItem.scope,
              locale: imageItem.locale,
              alt: this.generateAltText(akeneoProduct, imageItem)
            };
          } catch (error) {
            console.error(`❌ Failed to process image ${imageItem.url}:`, error.message);
            return {
              original_url: imageItem.url,
              primary_url: imageItem.url,
              error: error.message,
              fallback: true,
              sort_order: imageItem.index,
              attribute: imageItem.attribute,
              alt: this.generateAltText(akeneoProduct, imageItem)
            };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            processedImages.push(result.value);
          }
        });
        
        // Small delay between batches
        if (i + concurrency < prioritizedImages.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`✅ Processed ${processedImages.length} images for product ${akeneoProduct.identifier}`);
      return processedImages;
      
    } catch (error) {
      console.error(`❌ Image processing failed for product ${akeneoProduct.identifier}:`, error.message);
      // Fallback to original URLs
      return this.extractImagesWithoutProcessing(akeneoProduct, baseUrl);
    }
  }

  /**
   * Extract images without Cloudflare processing (fallback)
   */
  extractImagesWithoutProcessing(akeneoProduct, baseUrl = null) {
    const imageData = this.extractImageUrls(akeneoProduct, baseUrl);
    
    return imageData.map((imageItem, index) => ({
      original_url: imageItem.url,
      primary_url: imageItem.url,
      thumbnail: imageItem.url,
      medium: imageItem.url,
      large: imageItem.url,
      sort_order: index,
      attribute: imageItem.attribute,
      scope: imageItem.scope,
      locale: imageItem.locale,
      alt: this.generateAltText(akeneoProduct, imageItem),
      fallback: true,
      processed_at: new Date().toISOString()
    }));
  }

  /**
   * Prioritize images (main images first, then others)
   */
  prioritizeImages(imageData) {
    const mainImageAttributes = ['image', 'main_image', 'product_image'];
    
    return imageData.sort((a, b) => {
      // Main images first
      const aIsMain = mainImageAttributes.includes(a.attribute);
      const bIsMain = mainImageAttributes.includes(b.attribute);
      
      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;
      
      // Then by index within attribute
      return a.index - b.index;
    });
  }

  /**
   * Generate alt text for image
   */
  generateAltText(akeneoProduct, imageItem) {
    const productName = this.extractProductName(akeneoProduct);
    const baseAlt = productName || akeneoProduct.identifier || 'Product Image';
    
    // Add context if multiple images
    if (imageItem.index > 0) {
      return `${baseAlt} - Image ${imageItem.index + 1}`;
    }
    
    return baseAlt;
  }

  /**
   * Extract product name from Akeneo product
   */
  extractProductName(akeneoProduct) {
    const values = akeneoProduct.values || {};
    
    // Common name attributes to check
    const nameAttributes = ['name', 'label', 'title', 'product_name'];
    
    for (const attr of nameAttributes) {
      if (values[attr] && Array.isArray(values[attr])) {
        const nameItem = values[attr].find(item => item.data);
        if (nameItem) {
          return nameItem.data;
        }
      }
    }
    
    return null;
  }

  /**
   * Process images for multiple products
   */
  async processMultipleProducts(akeneoProducts, baseUrl = null, options = {}) {
    console.log(`🔄 Processing images for ${akeneoProducts.length} products`);
    
    const results = [];
    const productConcurrency = options.productConcurrency || 2;
    
    for (let i = 0; i < akeneoProducts.length; i += productConcurrency) {
      const batch = akeneoProducts.slice(i, i + productConcurrency);
      
      const batchPromises = batch.map(async (product) => {
        try {
          const processedImages = await this.processProductImages(product, baseUrl, options);
          return {
            product_identifier: product.identifier,
            product_uuid: product.uuid,
            images: processedImages,
            processed_at: new Date().toISOString()
          };
        } catch (error) {
          console.error(`❌ Failed to process images for product ${product.identifier}:`, error.message);
          return {
            product_identifier: product.identifier,
            product_uuid: product.uuid,
            images: [],
            error: error.message,
            processed_at: new Date().toISOString()
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
      
      console.log(`📊 Processed batch ${Math.ceil((i + productConcurrency) / productConcurrency)} of ${Math.ceil(akeneoProducts.length / productConcurrency)}`);
      
      // Delay between batches to avoid overwhelming services
      if (i + productConcurrency < akeneoProducts.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`✅ Completed image processing for ${results.length} products`);
    return results;
  }

  /**
   * Convert processed images to DainoStore format
   */
  convertToDainoStoreFormat(processedImages) {
    return processedImages.map((img, index) => ({
      url: img.primary_url,
      alt: img.alt || '',
      sort_order: img.sort_order || index,
      variants: {
        thumbnail: img.thumbnail,
        medium: img.medium,
        large: img.large,
        original: img.original
      },
      metadata: {
        cloudflare_id: img.services?.cloudflare_images?.id,
        r2_key: img.services?.cloudflare_r2?.key,
        processed_at: img.processed_at,
        fallback: img.fallback || false,
        attribute: img.attribute,
        scope: img.scope,
        locale: img.locale
      }
    }));
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      processing_enabled: this.processingEnabled,
      image_attributes: this.imageAttributeNames,
      cloudflare_config: {
        images_enabled: this.cloudflareService.useCloudflareImages,
        r2_enabled: this.cloudflareService.useR2Storage,
        domain: this.cloudflareService.imageDomain
      }
    };
  }

  /**
   * Test image processing pipeline
   */
  async testProcessing(testImageUrl) {
    try {
      console.log(`🧪 Testing image processing with: ${testImageUrl}`);
      
      const result = await this.cloudflareService.processImage(testImageUrl, {
        sku: 'TEST_SKU',
        alt: 'Test Image'
      });
      
      return {
        success: true,
        result: result,
        variants: this.cloudflareService.generateImageVariants(result)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AkeneoImageProcessor;