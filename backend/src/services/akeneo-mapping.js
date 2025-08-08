const { v4: uuidv4 } = require('uuid');

class AkeneoMapping {
  constructor() {
    // Default mapping configurations
    this.categoryMapping = {
      // Akeneo field -> Catalyst field
      'code': 'name', // Use code as name if label not available
      'labels': 'name', // Preferred name source
      'parent': 'parent_id'
    };

    this.productMapping = {
      // Basic product fields
      'identifier': 'sku',
      'family': 'attribute_set_id',
      'categories': 'category_ids',
      'enabled': 'status',
      'values': 'attributes'
    };
  }

  /**
   * Transform Akeneo category to Catalyst category format
   */
  transformCategory(akeneoCategory, storeId, locale = 'en_US', settings = {}) {
    const categoryName = this.extractLocalizedValue(akeneoCategory.labels, locale) || akeneoCategory.code;
    
    // Determine what to use for slug generation
    let slugSource = categoryName;
    if (settings.akeneoUrlField) {
      let urlFieldValue = null;
      
      // Try different places where the URL field might be
      if (akeneoCategory.values && akeneoCategory.values[settings.akeneoUrlField]) {
        // For categories with values structure (some Akeneo setups)
        const rawValue = this.extractLocalizedValue(akeneoCategory.values[settings.akeneoUrlField], locale) ||
                        this.extractProductValue(akeneoCategory.values, settings.akeneoUrlField, locale);
        
        // Extract the actual data value if it's an object with data property
        if (rawValue && typeof rawValue === 'object' && rawValue.data) {
          urlFieldValue = rawValue.data;
        } else if (typeof rawValue === 'string') {
          urlFieldValue = rawValue;
        }
      } else if (akeneoCategory[settings.akeneoUrlField]) {
        // For direct field access
        urlFieldValue = akeneoCategory[settings.akeneoUrlField];
        if (typeof urlFieldValue === 'object' && urlFieldValue[locale]) {
          urlFieldValue = urlFieldValue[locale];
        }
      }
      
      if (urlFieldValue && typeof urlFieldValue === 'string' && urlFieldValue.trim()) {
        slugSource = urlFieldValue.trim();
      }
    }
    
    const catalystCategory = {
      store_id: storeId,
      name: categoryName,
      slug: this.generateSlug(slugSource),
      description: null,
      image_url: null,
      sort_order: 0,
      is_active: settings.setNewActive !== undefined ? settings.setNewActive : true,
      hide_in_menu: settings.hideFromMenu || false,
      meta_title: null,
      meta_description: null,
      meta_keywords: null,
      meta_robots_tag: 'index, follow',
      parent_id: null, // Will be resolved later
      level: 0, // Will be calculated
      path: null, // Will be calculated
      product_count: 0,
      // Keep original Akeneo data for reference (temporary fields, not saved to DB)
      _temp_akeneo_code: akeneoCategory.code,
      _temp_parent_akeneo_code: akeneoCategory.parent,
      // Store original slug for comparison
      _originalSlug: this.generateSlug(slugSource)
    };

    return catalystCategory;
  }

  /**
   * Transform Akeneo product to Catalyst product format
   */
  async transformProduct(akeneoProduct, storeId, locale = 'en_US', processedImages = null, customMappings = {}, settings = {}, akeneoClient = null) {
    const values = akeneoProduct.values || {};
    
    // Extract product name
    const productName = this.extractProductValue(values, 'name', locale) || 
                       this.extractProductValue(values, 'label', locale) || 
                       akeneoProduct.identifier;
    
    // Determine what to use for slug generation
    let slugSource = productName;
    if (settings.akeneoUrlField && values[settings.akeneoUrlField]) {
      // Try to extract the custom URL field value
      const urlFieldValue = this.extractProductValue(values, settings.akeneoUrlField, locale);
      if (urlFieldValue && typeof urlFieldValue === 'string' && urlFieldValue.trim()) {
        slugSource = urlFieldValue.trim();
      }
    }
    
    // Start with default product structure
    const catalystProduct = {
      store_id: storeId,
      name: productName,
      slug: this.generateSlug(slugSource),
      sku: akeneoProduct.identifier,
      barcode: this.extractProductValue(values, 'ean', locale) || 
               this.extractProductValue(values, 'barcode', locale),
      description: this.extractProductValue(values, 'description', locale),
      short_description: this.extractProductValue(values, 'short_description', locale),
      price: this.extractNumericValue(values, 'price', locale),
      sale_price: this.extractNumericValue(values, 'sale_price', locale) || 
                  this.extractNumericValue(values, 'special_price', locale) ||
                  this.extractNumericValue(values, 'discounted_price', locale),
      compare_price: this.extractNumericValue(values, 'compare_price', locale) || 
                     this.extractNumericValue(values, 'msrp', locale) ||
                     this.extractNumericValue(values, 'regular_price', locale),
      cost_price: this.extractNumericValue(values, 'cost_price', locale) || 
                  this.extractNumericValue(values, 'cost', locale) ||
                  this.extractNumericValue(values, 'wholesale_price', locale),
      weight: this.extractNumericValue(values, 'weight', locale) || 
              this.extractNumericValue(values, 'weight_kg', locale),
      dimensions: this.extractDimensions(values, locale),
      images: await this.extractImages(values, processedImages, settings.downloadImages !== false, settings.akeneoBaseUrl, storeId, akeneoClient, akeneoProduct.identifier),
      status: akeneoProduct.enabled ? 'active' : 'inactive',
      visibility: 'visible',
      manage_stock: this.extractBooleanValue(values, 'manage_stock', locale) ?? true,
      stock_quantity: this.extractStockQuantity(values, locale, akeneoProduct),
      allow_backorders: this.extractBooleanValue(values, 'allow_backorders', locale) || false,
      low_stock_threshold: this.extractNumericValue(values, 'low_stock_threshold', locale) || 5,
      infinite_stock: this.extractBooleanValue(values, 'infinite_stock', locale) || false,
      is_custom_option: false,
      is_coupon_eligible: true,
      featured: this.extractBooleanValue(values, 'featured', locale) || false,
      tags: [],
      attributes: this.extractAllAttributes(values, locale),
      seo: this.extractSeoData(values, locale),
      attribute_set_id: null, // Will be mapped from family
      category_ids: akeneoProduct.categories || [],
      related_product_ids: [],
      sort_order: 0,
      view_count: 0,
      purchase_count: 0,
      // Keep original Akeneo data for reference
      akeneo_uuid: akeneoProduct.uuid,
      akeneo_identifier: akeneoProduct.identifier,
      akeneo_family: akeneoProduct.family,
      akeneo_groups: akeneoProduct.groups || [],
      // Store original slug for comparison
      _originalSlug: this.generateSlug(slugSource)
    };

    // Apply comprehensive custom attribute mappings
    if (customMappings.attributes && Array.isArray(customMappings.attributes)) {
      const customAttributes = this.applyCustomAttributeMappings(akeneoProduct, customMappings.attributes, locale);
      Object.assign(catalystProduct, customAttributes);
    }

    // Extract common e-commerce attributes with enhanced fallbacks
    const commonAttributes = this.extractCommonAttributes(values, locale);
    
    // Merge common attributes without overwriting existing values
    Object.keys(commonAttributes).forEach(key => {
      if (catalystProduct[key] === null || catalystProduct[key] === undefined) {
        catalystProduct[key] = commonAttributes[key];
      }
    });

    // Apply custom image mappings
    if (customMappings.images && Array.isArray(customMappings.images)) {
      const customImages = [];
      customMappings.images.forEach(mapping => {
        if (mapping.enabled && mapping.akeneoField) {
          const imageData = values[mapping.akeneoField];
          if (imageData && Array.isArray(imageData)) {
            imageData.forEach(item => {
              if (item.data) {
                const imageUrl = typeof item.data === 'string' ? item.data : 
                               (item.data.url || item.data.path || item.data.href);
                
                if (imageUrl) {
                  customImages.push({
                    url: imageUrl,
                    alt: '',
                    sort_order: customImages.length,
                    variants: {
                      thumbnail: imageUrl,
                      medium: imageUrl,
                      large: imageUrl
                    },
                    metadata: {
                      attribute: mapping.akeneoField,
                      scope: item.scope,
                      locale: item.locale,
                      customMapping: true,
                      catalystField: mapping.catalystField
                    }
                  });
                }
              }
            });
          }
        }
      });
      
      // Replace or merge with existing images based on mapping configuration
      if (customImages.length > 0) {
        catalystProduct.images = [...catalystProduct.images, ...customImages];
      }
    }

    // Apply custom file mappings
    if (customMappings.files && Array.isArray(customMappings.files)) {
      const customFiles = [];
      customMappings.files.forEach(mapping => {
        if (mapping.enabled && mapping.akeneoField) {
          const fileData = values[mapping.akeneoField];
          if (fileData && Array.isArray(fileData)) {
            fileData.forEach(item => {
              if (item.data) {
                const fileUrl = typeof item.data === 'string' ? item.data : 
                               (item.data.url || item.data.path || item.data.href);
                
                if (fileUrl) {
                  customFiles.push({
                    url: fileUrl,
                    name: item.data.name || mapping.akeneoField,
                    type: item.data.extension || 'unknown',
                    size: item.data.size || null,
                    metadata: {
                      attribute: mapping.akeneoField,
                      scope: item.scope,
                      locale: item.locale,
                      customMapping: true,
                      catalystField: mapping.catalystField
                    }
                  });
                }
              }
            });
          }
        }
      });
      
      // Add custom files to product
      if (customFiles.length > 0) {
        catalystProduct.files = customFiles;
      }
    }

    return catalystProduct;
  }

  /**
   * Apply custom field mapping to catalyst product
   */
  applyCustomMapping(catalystProduct, catalystField, akeneoValue, akeneoField) {
    // Handle different types of catalyst fields
    switch (catalystField) {
      case 'product_name':
      case 'name':
        catalystProduct.name = akeneoValue;
        catalystProduct.slug = this.generateSlug(akeneoValue);
        break;
      
      case 'description':
        catalystProduct.description = akeneoValue;
        break;
      
      case 'short_description':
        catalystProduct.short_description = akeneoValue;
        break;
      
      case 'price':
        const numericPrice = parseFloat(akeneoValue);
        if (!isNaN(numericPrice)) {
          catalystProduct.price = numericPrice;
        }
        break;
      
      case 'compare_price':
      case 'msrp':
        const numericComparePrice = parseFloat(akeneoValue);
        if (!isNaN(numericComparePrice)) {
          catalystProduct.compare_price = numericComparePrice;
        }
        break;
      
      case 'cost_price':
        const numericCostPrice = parseFloat(akeneoValue);
        if (!isNaN(numericCostPrice)) {
          catalystProduct.cost_price = numericCostPrice;
        }
        break;
      
      case 'weight':
        const numericWeight = parseFloat(akeneoValue);
        if (!isNaN(numericWeight)) {
          catalystProduct.weight = numericWeight;
        }
        break;
      
      case 'sku':
        catalystProduct.sku = akeneoValue;
        break;
      
      case 'barcode':
      case 'ean':
        catalystProduct.barcode = akeneoValue;
        break;
      
      case 'meta_title':
        if (!catalystProduct.seo) catalystProduct.seo = {};
        catalystProduct.seo.meta_title = akeneoValue;
        break;
      
      case 'meta_description':
        if (!catalystProduct.seo) catalystProduct.seo = {};
        catalystProduct.seo.meta_description = akeneoValue;
        break;
      
      case 'meta_keywords':
        if (!catalystProduct.seo) catalystProduct.seo = {};
        catalystProduct.seo.meta_keywords = akeneoValue;
        break;
      
      case 'featured':
        catalystProduct.featured = Boolean(akeneoValue);
        break;
      
      case 'status':
        // Map various status values
        if (typeof akeneoValue === 'boolean') {
          catalystProduct.status = akeneoValue ? 'active' : 'inactive';
        } else if (typeof akeneoValue === 'string') {
          const statusValue = akeneoValue.toLowerCase();
          if (['active', 'enabled', 'true', '1', 'yes'].includes(statusValue)) {
            catalystProduct.status = 'active';
          } else if (['inactive', 'disabled', 'false', '0', 'no'].includes(statusValue)) {
            catalystProduct.status = 'inactive';
          }
        }
        break;
      
      case 'stock_quantity':
        const numericStock = parseFloat(akeneoValue);
        if (!isNaN(numericStock)) {
          catalystProduct.stock_quantity = Math.max(0, Math.floor(numericStock));
        }
        break;
      
      case 'manage_stock':
        catalystProduct.manage_stock = Boolean(akeneoValue);
        break;
      
      case 'infinite_stock':
        catalystProduct.infinite_stock = Boolean(akeneoValue);
        break;
      
      case 'low_stock_threshold':
        const numericThreshold = parseFloat(akeneoValue);
        if (!isNaN(numericThreshold)) {
          catalystProduct.low_stock_threshold = Math.max(0, Math.floor(numericThreshold));
        }
        break;
      
      default:
        // For any other custom fields, add to attributes object
        if (!catalystProduct.custom_attributes) {
          catalystProduct.custom_attributes = {};
        }
        catalystProduct.custom_attributes[catalystField] = akeneoValue;
        
        // Also add to the main attributes object for backward compatibility
        catalystProduct.attributes[akeneoField] = akeneoValue;
        break;
    }
  }

  /**
   * Extract localized value from Akeneo labels/values
   */
  extractLocalizedValue(labels, locale = 'en_US', fallbackLocale = 'en_US') {
    if (!labels) return null;
    
    // Try exact locale match
    if (labels[locale]) return labels[locale];
    
    // Try fallback locale
    if (labels[fallbackLocale]) return labels[fallbackLocale];
    
    // Try first available locale
    const firstKey = Object.keys(labels)[0];
    return firstKey ? labels[firstKey] : null;
  }

  /**
   * Extract product attribute value considering scope and locale
   */
  extractProductValue(values, attributeCode, locale = 'en_US', scope = null) {
    const attribute = values[attributeCode];
    if (!attribute || !Array.isArray(attribute)) return null;

    // Find value that matches locale and scope criteria
    const matchingValue = attribute.find(item => {
      const localeMatch = !item.locale || item.locale === locale;
      const scopeMatch = !scope || !item.scope || item.scope === scope;
      return localeMatch && scopeMatch;
    });

    return matchingValue ? matchingValue.data : null;
  }

  /**
   * Extract stock quantity from Akeneo product data
   * Handles various Akeneo inventory structures and fallbacks
   */
  extractStockQuantity(values, locale = 'en_US', akeneoProduct = {}) {
    // Try common Akeneo inventory attribute names
    const stockAttributes = [
      'stock_quantity', 'quantity', 'inventory', 'stock', 
      'available_quantity', 'qty', 'in_stock_quantity',
      'warehouse_quantity', 'on_hand_quantity'
    ];
    
    // First, try to extract from product values (attribute-based inventory)
    for (const attrName of stockAttributes) {
      const stockValue = this.extractNumericValue(values, attrName, locale);
      if (stockValue !== null && stockValue >= 0) {
        console.log(`📦 Found stock from attribute '${attrName}': ${stockValue}`);
        return Math.floor(stockValue); // Ensure integer
      }
    }
    
    // Check if there's quantified associations (Akeneo Enterprise feature)
    if (akeneoProduct.quantified_associations) {
      let totalQuantity = 0;
      Object.values(akeneoProduct.quantified_associations).forEach(association => {
        if (association.products) {
          association.products.forEach(product => {
            if (product.quantity && typeof product.quantity === 'number') {
              totalQuantity += product.quantity;
            }
          });
        }
      });
      
      if (totalQuantity > 0) {
        console.log(`📦 Found stock from quantified associations: ${totalQuantity}`);
        return Math.floor(totalQuantity);
      }
    }
    
    // Check product completeness data (might contain inventory flags)
    if (akeneoProduct.completeness) {
      // Some Akeneo setups use completeness to track availability
      const hasCompleteInventory = Object.values(akeneoProduct.completeness).some(
        channel => channel.data && channel.data.inventory_complete === true
      );
      
      if (hasCompleteInventory) {
        // Default to 1 if inventory is marked as complete but no quantity found
        console.log(`📦 Product marked as inventory complete, defaulting to stock: 1`);
        return 1;
      }
    }
    
    // Check if product is enabled - if disabled, assume out of stock
    if (!akeneoProduct.enabled) {
      console.log(`📦 Product disabled in Akeneo, setting stock to: 0`);
      return 0;
    }
    
    // Final fallback: check boolean stock status attributes
    const inStockValue = this.extractBooleanValue(values, 'in_stock', locale) || 
                        this.extractBooleanValue(values, 'is_in_stock', locale) ||
                        this.extractBooleanValue(values, 'available', locale);
    
    if (inStockValue === true) {
      console.log(`📦 Product marked as in stock, defaulting to stock: 10`);
      return 10; // Default available quantity
    } else if (inStockValue === false) {
      console.log(`📦 Product marked as out of stock: 0`);
      return 0;
    }
    
    // Ultimate fallback for enabled products with no inventory data
    console.log(`📦 No inventory data found, using default stock for enabled product: 5`);
    return 5; // Conservative default for enabled products
  }

  /**
   * Extract numeric value from product attributes
   */
  extractNumericValue(values, attributeCode, locale = 'en_US') {
    const value = this.extractProductValue(values, attributeCode, locale);
    if (value === null || value === undefined) return null;
    
    // Handle Akeneo price collection format: [{ amount: "29.99", currency: "USD" }]
    if (Array.isArray(value) && value.length > 0) {
      // For price collections, get the first price's amount
      const firstPrice = value[0];
      if (firstPrice && typeof firstPrice === 'object' && firstPrice.amount !== undefined) {
        const numericValue = parseFloat(firstPrice.amount);
        return isNaN(numericValue) ? null : numericValue;
      }
    }
    
    // Handle simple numeric values (string or number)
    if (typeof value === 'string' || typeof value === 'number') {
      const numericValue = parseFloat(value);
      return isNaN(numericValue) ? null : numericValue;
    }
    
    return null;
  }

  /**
   * Extract boolean value from product attributes
   */
  extractBooleanValue(values, attributeCode, locale = 'en_US') {
    const value = this.extractProductValue(values, attributeCode, locale);
    if (value === null || value === undefined) return false;
    
    return Boolean(value);
  }

  /**
   * Extract dimensions object from product attributes
   */
  extractDimensions(values, locale = 'en_US') {
    const length = this.extractNumericValue(values, 'length', locale);
    const width = this.extractNumericValue(values, 'width', locale);
    const height = this.extractNumericValue(values, 'height', locale);

    if (!length && !width && !height) return null;

    return {
      length: length || 0,
      width: width || 0,
      height: height || 0,
      unit: 'cm' // Default unit, could be configurable
    };
  }

  /**
   * Extract images from product attributes (enhanced)
   */
  async extractImages(values, processedImages = null, downloadImages = true, baseUrl = null, storeId = null, akeneoClient = null, productIdentifier = null) {
    // If we have processed images from Cloudflare, use those
    if (processedImages && processedImages.length > 0) {
      return processedImages.map((img, index) => ({
        url: img.primary_url || img.url,
        alt: img.alt || '',
        sort_order: img.sort_order || index,
        variants: img.variants || {
          thumbnail: img.thumbnail || img.url,
          medium: img.medium || img.url,
          large: img.large || img.url
        },
        metadata: img.metadata || {}
      }));
    }
    
    // Fallback to original extraction logic
    const images = [];
    let foundImageCount = 0;
    
    // Enhanced list of common Akeneo image attribute names
    const imageAttributes = [
      'image', 'images', 'picture', 'pictures', 'photo', 'photos',
      'main_image', 'product_image', 'product_images', 'gallery',
      'gallery_image', 'gallery_images', 'base_image', 'small_image',
      'thumbnail', 'thumbnail_image', 'media_gallery', 'media_image',
      // Akeneo-specific attribute patterns
      'pim_catalog_image', 'catalog_image', 'asset_image', 'variation_image',
      // Additional Akeneo asset/media patterns
      'assets', 'media', 'media_files', 'product_media'
    ];
    
    console.log(`\n🖼️ ===== EXTRACTING IMAGES FROM AKENEO PRODUCT =====`);
    console.log(`📊 Settings:`);
    console.log(`  - Download images: ${downloadImages}`);
    console.log(`  - AkeneoClient available: ${!!akeneoClient}`);
    console.log(`  - Store ID: ${storeId}`);
    console.log(`  - Base URL: ${baseUrl}`);
    console.log(`\n🔍 Product values structure:`);
    console.log(`  - Total attributes: ${Object.keys(values).length}`);
    console.log(`  - Attribute names: ${Object.keys(values).join(', ')}`);
    
    // Debug: Check if ANY attributes contain potential image data
    console.log(`\n🔎 Scanning ALL attributes for potential image data...`);
    let potentialImageAttrs = [];
    for (const [key, value] of Object.entries(values)) {
      if (value && Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        if (firstItem && firstItem.data) {
          const dataType = typeof firstItem.data;
          const dataPreview = dataType === 'string' 
            ? firstItem.data.substring(0, 100) 
            : JSON.stringify(firstItem.data).substring(0, 100);
          
          // Check if this could be an image attribute
          if (dataType === 'string') {
            const data = firstItem.data;
            const looksLikeImage = data.includes('.jpg') || data.includes('.png') || 
                                  data.includes('.jpeg') || data.includes('.gif') || 
                                  data.includes('.webp') || data.includes('image') ||
                                  data.includes('media') || data.includes('asset') ||
                                  (!data.includes('/') && !data.startsWith('http') && data.length < 50);
            
            if (looksLikeImage) {
              potentialImageAttrs.push(key);
              console.log(`  📌 "${key}": ${value.length} item(s), data type: ${dataType}`);
              console.log(`     Preview: ${dataPreview}${dataPreview.length >= 100 ? '...' : ''}`);
              if (!imageAttributes.includes(key)) {
                console.log(`     ⚠️ POTENTIAL IMAGE ATTRIBUTE NOT IN LIST!`);
              }
            }
          }
        }
      }
    }
    
    if (potentialImageAttrs.length === 0) {
      console.log(`  ❌ No potential image attributes found in product data!`);
    } else {
      console.log(`  ✅ Found ${potentialImageAttrs.length} potential image attributes: ${potentialImageAttrs.join(', ')}`);
    }
    
    console.log(`\n🔍 Checking known image attributes...`);
    for (const key of Object.keys(values)) {
      if (imageAttributes.includes(key)) {
        console.log(`📊 Found known image attribute '${key}':`, JSON.stringify(values[key], null, 2));
      }
    }
    
    console.log(`\n🔄 Processing image attributes...`);
    for (const attrName of imageAttributes) {
      const imageData = values[attrName];
      if (imageData && Array.isArray(imageData)) {
        console.log(`\n📸 Found attribute '${attrName}' with ${imageData.length} item(s)`);
        console.log(`  Full data:`, JSON.stringify(imageData, null, 2));
        
        for (let i = 0; i < imageData.length; i++) {
          const item = imageData[i];
          console.log(`\n  🔍 Processing item ${i + 1}/${imageData.length}:`, JSON.stringify(item, null, 2));
          if (item && item.data) {
            let imageUrl = null;
            let isMediaCode = false;
            let isAssetCode = false;
            
            // Handle different Akeneo image data structures
            if (typeof item.data === 'string') {
              // Check if it's a media file code or path
              // Media file paths look like: e/b/2/c/eb2c09153411547fcdf9918e23c4593313ab8f16_04w0485_8525.webp
              // These are NOT URLs but media file codes that need API access
              const isAkeneoMediaPath = item.data.match(/^[a-f0-9]\/[a-f0-9]\/[a-f0-9]\/[a-f0-9]\/.+$/i);
              const isHttpUrl = item.data.startsWith('http://') || item.data.startsWith('https://');
              const isSingleCode = !item.data.includes('/') && !item.data.includes('.');
              
              if ((isAkeneoMediaPath || isSingleCode) && !isHttpUrl) {
                // This is a media file code/path that needs API access
                console.log(`🔑 Detected media file code/path: ${item.data}`);
                
                // Try to fetch media file or asset details
                if (akeneoClient) {
                  try {
                    // First try as media file
                    console.log(`📂 Attempting to fetch media file: ${item.data}`);
                    const mediaFile = await akeneoClient.getMediaFile(item.data);
                    if (mediaFile && mediaFile._links?.download?.href) {
                      imageUrl = mediaFile._links.download.href;
                      isMediaCode = true;
                      console.log(`✅ Found media file download URL: ${imageUrl}`);
                    }
                  } catch (mediaError) {
                    console.log(`❌ Not a media file: ${mediaError.message}`);
                    
                    // Try as asset (only for single codes, not paths)
                    if (isSingleCode) {
                      try {
                        console.log(`📦 Attempting to fetch asset: ${item.data}`);
                        const asset = await akeneoClient.getAsset(item.data);
                        if (asset && asset.reference_files && asset.reference_files.length > 0) {
                          // Get the first reference file
                          const refFile = asset.reference_files[0];
                          if (refFile._links?.download?.href) {
                            imageUrl = refFile._links.download.href;
                            isAssetCode = true;
                            console.log(`✅ Found asset download URL: ${imageUrl}`);
                          }
                        }
                      } catch (assetError) {
                        console.log(`❌ Not an asset either: ${assetError.message}`);
                        // For media paths, we can't use them as direct URLs
                        if (isAkeneoMediaPath) {
                          console.log(`⚠️ Media file path cannot be used as direct URL, skipping`);
                          imageUrl = null;
                        } else {
                          imageUrl = item.data;
                        }
                      }
                    } else if (isAkeneoMediaPath) {
                      // For media paths that failed API lookup, we can't use them as URLs
                      console.log(`⚠️ Media file path cannot be used as direct URL, skipping`);
                      imageUrl = null;
                    } else {
                      imageUrl = item.data;
                    }
                  }
                } else {
                  // No client available
                  if (isAkeneoMediaPath) {
                    console.log(`⚠️ No Akeneo client available to fetch media file, skipping`);
                    imageUrl = null;
                  } else {
                    imageUrl = item.data;
                  }
                }
              } else {
                // It's already a URL or a regular path
                imageUrl = item.data;
              }
            } else if (typeof item.data === 'object') {
              // Handle asset or reference structure
              imageUrl = item.data.url || item.data.path || item.data.href || 
                        item.data.download_link || item.data.reference_files?.[0]?.download_link;
              
              // Handle Akeneo asset structure
              if (item.data._links?.download?.href) {
                imageUrl = item.data._links.download.href;
              }
            }
            
            if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
              imageUrl = imageUrl.trim();
              console.log(`📷 Processing image URL: ${imageUrl}`);
              
              // Make sure URL is absolute (but only if it's not already a full URL)
              if (!imageUrl.startsWith('http') && baseUrl) {
                // Check if it's an API path that needs the base URL
                if (imageUrl.startsWith('/api/')) {
                  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
                  imageUrl = `${cleanBaseUrl}${imageUrl}`;
                  console.log(`🔗 Constructed API URL: ${imageUrl}`);
                } else if (!isMediaCode && !isAssetCode) {
                  // Only construct URLs for non-media/asset paths
                  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
                  const cleanImageUrl = imageUrl.replace(/^\/+/, '');
                  imageUrl = `${cleanBaseUrl}/${cleanImageUrl}`;
                  console.log(`🔗 Constructed absolute URL: ${imageUrl}`);
                }
              }
              
              let finalImageUrl = imageUrl;
              let uploadResult = null;
              
              // Download and upload image if enabled
              if (downloadImages && imageUrl.startsWith('http')) {
                try {
                  console.log(`⬇️ Attempting to download image: ${imageUrl}`);
                  // Use authenticated download for media files and assets
                  const needsAuth = isMediaCode || isAssetCode || imageUrl.includes('/api/rest/');
                  uploadResult = await this.downloadAndUploadImage(imageUrl, item, storeId, needsAuth ? akeneoClient : null, productIdentifier);
                  if (uploadResult && uploadResult.url) {
                    finalImageUrl = uploadResult.url;
                    console.log(`✅ Image uploaded successfully to Supabase!`);
                    console.log(`   Original Akeneo URL: ${imageUrl}`);
                    console.log(`   New Supabase URL: ${finalImageUrl}`);
                    console.log(`   Upload provider: ${uploadResult.uploadedTo || 'unknown'}`);
                  } else {
                    console.warn(`⚠️ Upload result missing URL, keeping original: ${imageUrl}`);
                  }
                } catch (error) {
                  console.warn(`⚠️ Failed to download/upload image ${imageUrl}:`, error.message);
                  console.warn(`📋 Error details:`, error.stack);
                  // Continue with original URL as fallback
                }
              }
              
              // Extract alt text from various sources
              const altText = (item.data && typeof item.data === 'object' ? item.data.alt : '') ||
                            (item.alt) ||
                            (item.data?.title) ||
                            (item.data?.name) ||
                            '';
              
              const imageObject = {
                url: finalImageUrl,
                alt: altText,
                sort_order: images.length,
                variants: {
                  thumbnail: finalImageUrl,
                  medium: finalImageUrl, 
                  large: finalImageUrl
                },
                metadata: {
                  attribute: attrName,
                  scope: item.scope,
                  locale: item.locale,
                  original_url: imageUrl,
                  downloaded: !!uploadResult,
                  is_media_code: isMediaCode,
                  is_asset_code: isAssetCode,
                  upload_result: uploadResult ? {
                    provider: uploadResult.uploadedTo,
                    filename: uploadResult.filename,
                    size: uploadResult.size,
                    fallback_used: uploadResult.fallbackUsed
                  } : null
                }
              };
              
              images.push(imageObject);
              foundImageCount++;
              console.log(`📁 Added image ${foundImageCount}:`);
              console.log(`   Final URL being saved: ${finalImageUrl}`);
              console.log(`   Is Supabase URL: ${finalImageUrl.includes('supabase.co')}`);
              console.log(`   Is Akeneo URL: ${finalImageUrl.includes('akeneo')}`);
              console.log(`   Was downloaded/uploaded: ${!!uploadResult}`);
            }
          }
        }
      }
    }

    console.log(`\n🎯 ===== IMAGE EXTRACTION COMPLETE =====`);
    console.log(`  Total images found: ${images.length}`);
    console.log(`  Found image count tracker: ${foundImageCount}`);
    if (images.length > 0) {
      console.log(`  Images extracted:`);
      images.forEach((img, idx) => {
        console.log(`    ${idx + 1}. URL: ${img.url}`);
        console.log(`       Original: ${img.metadata?.original_url || 'N/A'}`);
        console.log(`       Downloaded: ${img.metadata?.downloaded || false}`);
        console.log(`       From attribute: ${img.metadata?.attribute || 'unknown'}`);
      });
    } else {
      console.log(`  ❌ NO IMAGES EXTRACTED!`);
    }
    console.log(`========================================\n`);
    
    return images;
  }

  /**
   * Download image from Akeneo and upload to storage system
   */
  async downloadAndUploadImage(imageUrl, imageItem, storeId = null, akeneoClient = null, productIdentifier = null) {
    const storageManager = require('./storage-manager');
    const StoragePathUtility = require('./storage-path-utility');
    
    try {
      console.log(`📥 Downloading image from Akeneo: ${imageUrl}`);
      
      let buffer;
      let contentType = 'image/jpeg';
      
      // Check if we need authenticated download
      if (akeneoClient && (imageUrl.includes('/api/rest/') || imageUrl.includes('/media/'))) {
        console.log(`🔐 Using authenticated download for: ${imageUrl}`);
        try {
          // Use the authenticated download method
          buffer = await akeneoClient.downloadAuthenticatedFile(imageUrl);
          console.log(`✅ Authenticated download successful: ${buffer.length} bytes`);
          
          // Try to determine content type from URL or default to jpeg
          if (imageUrl.includes('.png')) contentType = 'image/png';
          else if (imageUrl.includes('.gif')) contentType = 'image/gif';
          else if (imageUrl.includes('.webp')) contentType = 'image/webp';
          else if (imageUrl.includes('.svg')) contentType = 'image/svg+xml';
        } catch (authError) {
          console.warn(`⚠️ Authenticated download failed, trying regular download: ${authError.message}`);
          // Fall back to regular download
          const fetch = (await import('node-fetch')).default;
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          buffer = await response.buffer();
          contentType = response.headers.get('content-type') || 'image/jpeg';
        }
      } else {
        // Regular download without authentication
        console.log(`📥 Using regular download for: ${imageUrl}`);
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        buffer = await response.buffer();
        contentType = response.headers.get('content-type') || 'image/jpeg';
      }
      
      // Get the file extension from content type
      const extension = contentType.split('/')[1]?.replace('+xml', '') || 'jpg';
      
      console.log(`💾 Downloaded image: ${buffer.length} bytes, type: ${contentType}`);
      
      // Extract original filename from URL and clean it
      let originalFileName = imageUrl.split('/').pop().split('?')[0];
      if (!originalFileName || originalFileName === '') {
        originalFileName = `image_${Date.now()}.${extension}`;
      }
      
      // Ensure proper extension
      if (!originalFileName.includes('.')) {
        originalFileName = `${originalFileName}.${extension}`;
      }
      
      // Add product identifier to filename to make it unique
      if (productIdentifier) {
        // Get the base name and extension
        const lastDotIndex = originalFileName.lastIndexOf('.');
        const baseName = lastDotIndex !== -1 ? originalFileName.substring(0, lastDotIndex) : originalFileName;
        const fileExt = lastDotIndex !== -1 ? originalFileName.substring(lastDotIndex) : `.${extension}`;
        
        // Create new filename with product identifier
        // Example: image.jpg becomes image_SKU123.jpg
        originalFileName = `${baseName}_${productIdentifier}${fileExt}`;
        console.log(`🏷️ Added product identifier to filename: ${originalFileName}`);
      }
      
      // Generate uniform path structure using StoragePathUtility
      const pathInfo = StoragePathUtility.generatePath(originalFileName, 'product');
      console.log(`🗂️  Generated uniform path: ${pathInfo.fullPath}`);
      
      // Create mock file object for storage upload
      const mockFile = {
        originalname: pathInfo.filename,
        mimetype: contentType,
        buffer: buffer,
        size: buffer.length
      };

      // Upload using unified storage manager with specific path
      if (storeId) {
        try {
          console.log(`☁️ [Akeneo] Uploading via storage manager for store: ${storeId}`);
          console.log(`[Akeneo] Upload options:`, {
            useOrganizedStructure: true,
            type: 'product',
            filename: pathInfo.filename,
            customPath: pathInfo.fullPath,
            public: true
          });
          
          const uploadResult = await storageManager.uploadFile(storeId, mockFile, {
            useOrganizedStructure: true,
            type: 'product',
            filename: pathInfo.filename,
            customPath: pathInfo.fullPath, // Use the uniform path structure
            public: true,
            metadata: {
              store_id: storeId,
              upload_type: 'akeneo_product_image',
              source: 'akeneo_import',
              original_url: imageUrl,
              relative_path: pathInfo.fullPath // Store relative path for database
            }
          });
          
          console.log(`[Akeneo] Upload result:`, uploadResult);
          
          if (uploadResult && (uploadResult.success || uploadResult.url)) {
            console.log(`✅ [Akeneo] Image uploaded via ${uploadResult.provider}: ${uploadResult.url}`);
            console.log(`📍 [Akeneo] Relative path: ${pathInfo.fullPath}`);
            
            return {
              url: uploadResult.url,
              originalUrl: imageUrl,
              filename: pathInfo.filename,
              relativePath: pathInfo.fullPath, // Add relative path for database storage
              size: buffer.length,
              contentType: contentType,
              uploadedTo: uploadResult.provider,
              fallbackUsed: uploadResult.fallbackUsed || false
            };
          } else {
            console.error(`❌ [Akeneo] Upload failed - no URL returned`);
            console.error(`[Akeneo] Full upload result:`, JSON.stringify(uploadResult, null, 2));
          }
        } catch (storageError) {
          console.log(`⚠️ Storage manager upload failed, trying local fallback: ${storageError.message}`);
        }
      }

      // Last resort fallback to local upload via API if storage manager fails
      const FormData = require('form-data');
      const fs = require('fs');
      const pathModule = require('path');
      const os = require('os');

      // Create temporary file for fallback
      const tempFilePath = pathModule.join(os.tmpdir(), pathInfo.filename);
      fs.writeFileSync(tempFilePath, buffer);
      
      // Create form data for local upload
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFilePath), {
        filename: pathInfo.filename,
        contentType: contentType
      });
      
      // Upload to local file service
      const uploadResponse = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkError) {
        console.warn(`⚠️ Failed to delete temp file ${tempFilePath}:`, unlinkError.message);
      }
      
      if (!uploadResponse.ok) {
        throw new Error(`Local upload failed: HTTP ${uploadResponse.status}`);
      }
      
      const uploadResult = await uploadResponse.json();
      console.log(`✅ Image uploaded locally via API: ${uploadResult.file_url}`);
      
      return {
        url: uploadResult.file_url,
        originalUrl: imageUrl,
        filename: uploadResult.filename || fileName,
        size: buffer.length,
        contentType: contentType,
        uploadedTo: 'local-api'
      };
      
    } catch (error) {
      console.error(`❌ Failed to download and upload image ${imageUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract all attributes for the attributes JSON field
   */
  extractAllAttributes(values, locale = 'en_US') {
    const attributes = {};
    
    Object.keys(values).forEach(attributeCode => {
      const value = this.extractProductValue(values, attributeCode, locale);
      if (value !== null && value !== undefined) {
        attributes[attributeCode] = value;
      }
    });

    return attributes;
  }

  /**
   * Extract SEO data from product attributes
   */
  extractSeoData(values, locale = 'en_US') {
    return {
      meta_title: this.extractProductValue(values, 'meta_title', locale),
      meta_description: this.extractProductValue(values, 'meta_description', locale),
      meta_keywords: this.extractProductValue(values, 'meta_keywords', locale)
    };
  }

  /**
   * Generate URL-friendly slug from text
   */
  generateSlug(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Build category hierarchy from flat Akeneo categories
   */
  buildCategoryHierarchy(akeneoCategories, catalystCategories) {
    // Create a map of Akeneo codes to original Akeneo categories to check hierarchy
    const akeneoCodeToCategory = {};
    akeneoCategories.forEach(akeneoCategory => {
      akeneoCodeToCategory[akeneoCategory.code] = akeneoCategory;
    });
    
    // Create a map of Akeneo codes to Catalyst categories
    const codeToCategory = {};
    catalystCategories.forEach(category => {
      codeToCategory[category._temp_akeneo_code] = category;
    });

    // Set parent relationships and calculate levels based on Akeneo hierarchy
    catalystCategories.forEach(category => {
      const akeneoCategory = akeneoCodeToCategory[category._temp_akeneo_code];
      
      if (!akeneoCategory) {
        console.warn(`⚠️ Akeneo category not found for code: ${category._temp_akeneo_code}`);
        // Default to root if Akeneo category not found
        category.level = 0;
        category.path = category._temp_akeneo_code;
        category.isRoot = true;
        category.parent_id = null;
        return;
      }

      // Check if this category has a parent in Akeneo
      if (akeneoCategory.parent && akeneoCategory.parent !== null) {
        const parentCategory = codeToCategory[akeneoCategory.parent];
        if (parentCategory) {
          // This category has a valid parent
          category._temp_parent_akeneo_code = akeneoCategory.parent;
          category.level = (parentCategory.level || 0) + 1;
          category.path = parentCategory.path ? 
            `${parentCategory.path}/${category._temp_akeneo_code}` : 
            category._temp_akeneo_code;
          category.isRoot = false;
          console.log(`📎 "${category.name}" (${category._temp_akeneo_code}) has parent: ${akeneoCategory.parent}`);
        } else {
          // Parent specified but not found in our import, make it root
          console.log(`⚠️ Parent "${akeneoCategory.parent}" not found for "${category.name}", making it a root category`);
          category.level = 0;
          category.path = category._temp_akeneo_code;
          category.isRoot = true;
          category.parent_id = null;
        }
      } else {
        // No parent specified in Akeneo, this is a root category
        console.log(`🌱 "${category.name}" (${category._temp_akeneo_code}) is a root category (no parent in Akeneo)`);
        category.level = 0;
        category.path = category._temp_akeneo_code;
        category.isRoot = true;
        category.parent_id = null;
      }
    });

    // Sort by level to ensure parents are processed before children
    catalystCategories.sort((a, b) => a.level - b.level);

    return catalystCategories;
  }

  /**
   * Map Akeneo category codes to Catalyst category IDs
   */
  mapCategoryIds(akeneoCategoryCodes, categoryMapping) {
    const mappedIds = [];
    const unmappedCodes = [];
    
    akeneoCategoryCodes.forEach(code => {
      const mappedId = categoryMapping[code];
      if (mappedId) {
        mappedIds.push(mappedId);
      } else {
        unmappedCodes.push(code);
      }
    });
    
    // Log unmapped categories for debugging (only in development or if there are issues)
    if (unmappedCodes.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Unmapped category codes: ${unmappedCodes.join(', ')}`);
    }
    
    return mappedIds;
  }

  /**
   * Validate transformed category
   */
  validateCategory(category) {
    const errors = [];
    
    if (!category.name || category.name.trim() === '') {
      errors.push('Category name is required');
    }
    
    if (!category.store_id) {
      errors.push('Store ID is required');
    }

    return errors;
  }

  /**
   * Transform Akeneo family to Catalyst AttributeSet format
   */
  transformFamily(akeneoFamily, storeId) {
    const catalystAttributeSet = {
      store_id: storeId,
      name: akeneoFamily.code, // Use code as name, can be enhanced with labels
      description: null,
      attribute_ids: [], // Will be populated after attributes are imported
      // Keep original Akeneo data for reference
      akeneo_code: akeneoFamily.code,
      akeneo_attribute_codes: akeneoFamily.attributes || []
    };

    return catalystAttributeSet;
  }

  /**
   * Transform Akeneo attribute to Catalyst Attribute format
   */
  transformAttribute(akeneoAttribute, storeId) {
    const catalystAttribute = {
      store_id: storeId,
      name: this.extractLocalizedValue(akeneoAttribute.labels) || akeneoAttribute.code,
      code: akeneoAttribute.code,
      type: this.mapAttributeType(akeneoAttribute.type),
      is_required: akeneoAttribute.required || false,
      is_filterable: akeneoAttribute.useable_as_grid_filter || false,
      is_searchable: akeneoAttribute.searchable || false,
      is_usable_in_conditions: akeneoAttribute.useable_as_grid_filter || false,
      filter_type: this.mapFilterType(akeneoAttribute.type),
      options: this.extractAttributeOptions(akeneoAttribute),
      file_settings: this.extractFileSettings(akeneoAttribute),
      sort_order: akeneoAttribute.sort_order || 0,
      // Keep original Akeneo data for reference
      akeneo_code: akeneoAttribute.code,
      akeneo_type: akeneoAttribute.type,
      akeneo_group: akeneoAttribute.group
    };

    return catalystAttribute;
  }

  /**
   * Map Akeneo attribute type to Catalyst attribute type
   */
  mapAttributeType(akeneoType) {
    const typeMapping = {
      'pim_catalog_text': 'text',
      'pim_catalog_textarea': 'text',
      'pim_catalog_number': 'number',
      'pim_catalog_price_collection': 'number',
      'pim_catalog_simpleselect': 'select',
      'pim_catalog_multiselect': 'multiselect',
      'pim_catalog_boolean': 'boolean',
      'pim_catalog_date': 'date',
      'pim_catalog_file': 'file',
      'pim_catalog_image': 'file',
      'pim_catalog_identifier': 'text'
    };

    return typeMapping[akeneoType] || 'text';
  }

  /**
   * Map Akeneo attribute type to filter type
   */
  mapFilterType(akeneoType) {
    const filterMapping = {
      'pim_catalog_simpleselect': 'select',
      'pim_catalog_multiselect': 'multiselect',
      'pim_catalog_number': 'slider',
      'pim_catalog_price_collection': 'slider'
    };

    return filterMapping[akeneoType] || null;
  }

  /**
   * Extract attribute options from Akeneo attribute
   */
  extractAttributeOptions(akeneoAttribute) {
    if (!akeneoAttribute.options) return [];

    return Object.keys(akeneoAttribute.options).map(optionCode => ({
      code: optionCode,
      label: this.extractLocalizedValue(akeneoAttribute.options[optionCode].labels) || optionCode,
      sort_order: akeneoAttribute.options[optionCode].sort_order || 0
    }));
  }

  /**
   * Extract file settings from Akeneo attribute
   */
  extractFileSettings(akeneoAttribute) {
    if (akeneoAttribute.type !== 'pim_catalog_file' && akeneoAttribute.type !== 'pim_catalog_image') {
      return {};
    }

    return {
      allowed_extensions: akeneoAttribute.allowed_extensions || [],
      max_file_size: akeneoAttribute.max_file_size || null
    };
  }

  /**
   * Validate transformed family
   */
  validateFamily(family) {
    const errors = [];
    
    if (!family.name || family.name.trim() === '') {
      errors.push('Family name is required');
    }
    
    if (!family.store_id) {
      errors.push('Store ID is required');
    }

    return errors;
  }

  /**
   * Validate transformed attribute
   */
  validateAttribute(attribute) {
    const errors = [];
    
    if (!attribute.name || attribute.name.trim() === '') {
      errors.push('Attribute name is required');
    }
    
    if (!attribute.code || attribute.code.trim() === '') {
      errors.push('Attribute code is required');
    }
    
    if (!attribute.store_id) {
      errors.push('Store ID is required');
    }

    return errors;
  }

  /**
   * Validate transformed product
   */
  validateProduct(product) {
    const errors = [];
    
    if (!product.name || product.name.trim() === '') {
      errors.push('Product name is required');
    }
    
    if (!product.sku || product.sku.trim() === '') {
      errors.push('Product SKU is required');
    }
    
    if (!product.store_id) {
      errors.push('Store ID is required');
    }
    
    if (product.price < 0) {
      errors.push('Product price cannot be negative');
    }

    return errors;
  }

  /**
   * Comprehensive attribute mapping system for any Akeneo attribute
   * Allows flexible mapping of Akeneo attributes to Catalyst product fields
   */
  mapAkeneoAttribute(akeneoProduct, attributeMapping, locale = 'en_US') {
    const { values } = akeneoProduct;
    const { 
      akeneoAttribute, 
      catalystField, 
      dataType = 'string', 
      fallbacks = [], 
      transform = null,
      defaultValue = null 
    } = attributeMapping;
    
    console.log(`🗺️ Mapping Akeneo attribute '${akeneoAttribute}' to Catalyst field '${catalystField}'`);
    
    // Try primary attribute first
    let value = this.extractProductValue(values, akeneoAttribute, locale);
    
    // Try fallback attributes if primary value is null/empty
    if ((value === null || value === undefined || value === '') && fallbacks.length > 0) {
      for (const fallbackAttr of fallbacks) {
        console.log(`🔄 Trying fallback attribute: ${fallbackAttr}`);
        value = this.extractProductValue(values, fallbackAttr, locale);
        if (value !== null && value !== undefined && value !== '') {
          console.log(`✅ Found value in fallback attribute '${fallbackAttr}': ${value}`);
          break;
        }
      }
    }
    
    // Apply data type conversion
    if (value !== null && value !== undefined && value !== '') {
      switch (dataType) {
        case 'number':
        case 'numeric':
          value = this.extractNumericValue(values, akeneoAttribute, locale);
          break;
        case 'boolean':
          value = this.extractBooleanValue(values, akeneoAttribute, locale);
          break;
        case 'array':
          if (!Array.isArray(value)) {
            value = [value];
          }
          break;
        case 'string':
        default:
          // Keep as string (already handled by extractProductValue)
          break;
      }
    }
    
    // Apply custom transformation function if provided
    if (transform && typeof transform === 'function') {
      try {
        value = transform(value, akeneoProduct, locale);
        console.log(`🔧 Applied custom transformation to '${akeneoAttribute}'`);
      } catch (transformError) {
        console.warn(`⚠️ Transform function failed for '${akeneoAttribute}':`, transformError.message);
      }
    }
    
    // Use default value if still null/empty
    if ((value === null || value === undefined || value === '') && defaultValue !== null) {
      value = defaultValue;
      console.log(`🎯 Using default value for '${catalystField}': ${defaultValue}`);
    }
    
    return { [catalystField]: value };
  }

  /**
   * Apply multiple attribute mappings to an Akeneo product
   */
  applyCustomAttributeMappings(akeneoProduct, mappings = [], locale = 'en_US') {
    const customAttributes = {};
    
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return customAttributes;
    }
    
    console.log(`🎯 Applying ${mappings.length} custom attribute mappings`);
    
    mappings.forEach(mapping => {
      if (!mapping.enabled || !mapping.akeneoAttribute || !mapping.catalystField) {
        return;
      }
      
      try {
        const mappedValue = this.mapAkeneoAttribute(akeneoProduct, mapping, locale);
        Object.assign(customAttributes, mappedValue);
        console.log(`✅ Mapped '${mapping.akeneoAttribute}' → '${mapping.catalystField}':`, mappedValue[mapping.catalystField]);
      } catch (mappingError) {
        console.error(`❌ Failed to map '${mapping.akeneoAttribute}' → '${mapping.catalystField}':`, mappingError.message);
      }
    });
    
    return customAttributes;
  }

  /**
   * Enhanced attribute extraction for common e-commerce fields
   */
  extractCommonAttributes(values, locale = 'en_US') {
    const commonAttributes = {};
    
    // Price-related attributes with multiple fallbacks
    commonAttributes.price = this.extractNumericValue(values, 'price', locale) ||
                             this.extractNumericValue(values, 'base_price', locale) ||
                             this.extractNumericValue(values, 'unit_price', locale);
    
    commonAttributes.sale_price = this.extractNumericValue(values, 'sale_price', locale) ||
                                  this.extractNumericValue(values, 'special_price', locale) ||
                                  this.extractNumericValue(values, 'discounted_price', locale) ||
                                  this.extractNumericValue(values, 'promo_price', locale);
    
    commonAttributes.compare_price = this.extractNumericValue(values, 'compare_price', locale) ||
                                     this.extractNumericValue(values, 'msrp', locale) ||
                                     this.extractNumericValue(values, 'regular_price', locale) ||
                                     this.extractNumericValue(values, 'list_price', locale);
    
    // Brand and manufacturer
    commonAttributes.brand = this.extractProductValue(values, 'brand', locale) ||
                            this.extractProductValue(values, 'manufacturer', locale) ||
                            this.extractProductValue(values, 'supplier', locale);
    
    // Material and composition
    commonAttributes.material = this.extractProductValue(values, 'material', locale) ||
                               this.extractProductValue(values, 'composition', locale) ||
                               this.extractProductValue(values, 'fabric', locale);
    
    // Color variations
    commonAttributes.color = this.extractProductValue(values, 'color', locale) ||
                            this.extractProductValue(values, 'colour', locale) ||
                            this.extractProductValue(values, 'main_color', locale);
    
    // Size information
    commonAttributes.size = this.extractProductValue(values, 'size', locale) ||
                           this.extractProductValue(values, 'clothing_size', locale) ||
                           this.extractProductValue(values, 'shoe_size', locale);
    
    // Warranty and care instructions
    commonAttributes.warranty = this.extractProductValue(values, 'warranty', locale) ||
                               this.extractProductValue(values, 'warranty_period', locale) ||
                               this.extractProductValue(values, 'guarantee', locale);
    
    commonAttributes.care_instructions = this.extractProductValue(values, 'care_instructions', locale) ||
                                         this.extractProductValue(values, 'care_guide', locale) ||
                                         this.extractProductValue(values, 'maintenance', locale);
    
    return commonAttributes;
  }
}

module.exports = AkeneoMapping;