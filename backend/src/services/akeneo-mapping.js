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
  async transformProduct(akeneoProduct, storeId, locale = 'en_US', processedImages = null, customMappings = {}, settings = {}) {
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
      price: this.extractNumericValue(values, 'price', locale) || 0,
      compare_price: this.extractNumericValue(values, 'compare_price', locale) || 
                     this.extractNumericValue(values, 'msrp', locale),
      cost_price: this.extractNumericValue(values, 'cost_price', locale) || 
                  this.extractNumericValue(values, 'cost', locale),
      weight: this.extractNumericValue(values, 'weight', locale) || 
              this.extractNumericValue(values, 'weight_kg', locale),
      dimensions: this.extractDimensions(values, locale),
      images: await this.extractImages(values, processedImages, settings.downloadImages !== false, settings.akeneoBaseUrl),
      status: akeneoProduct.enabled ? 'active' : 'inactive',
      visibility: 'visible',
      manage_stock: true,
      stock_quantity: 0, // Will need separate inventory import
      allow_backorders: false,
      low_stock_threshold: 5,
      infinite_stock: false,
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

    // Apply custom attribute mappings
    if (customMappings.attributes && Array.isArray(customMappings.attributes)) {
      customMappings.attributes.forEach(mapping => {
        if (mapping.enabled && mapping.akeneoField && mapping.catalystField) {
          const akeneoValue = this.extractProductValue(values, mapping.akeneoField, locale);
          if (akeneoValue !== null && akeneoValue !== undefined) {
            // Map to the specified Catalyst field
            this.applyCustomMapping(catalystProduct, mapping.catalystField, akeneoValue, mapping.akeneoField);
          }
        }
      });
    }

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
   * Extract numeric value from product attributes
   */
  extractNumericValue(values, attributeCode, locale = 'en_US') {
    const value = this.extractProductValue(values, attributeCode, locale);
    if (value === null || value === undefined) return null;
    
    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? null : numericValue;
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
  async extractImages(values, processedImages = null, downloadImages = true, baseUrl = null) {
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
    
    // Check common image attribute names
    const imageAttributes = ['image', 'images', 'picture', 'pictures', 'photo', 'photos', 'main_image', 'product_image'];
    
    for (const attrName of imageAttributes) {
      const imageData = values[attrName];
      if (imageData && Array.isArray(imageData)) {
        for (const item of imageData) {
          if (item.data) {
            let imageUrl = typeof item.data === 'string' ? item.data : 
                          (item.data.url || item.data.path || item.data.href);
            
            if (imageUrl) {
              // Make sure URL is absolute
              if (!imageUrl.startsWith('http') && baseUrl) {
                imageUrl = `${baseUrl.replace(/\/+$/, '')}/${imageUrl.replace(/^\/+/, '')}`;
              }
              
              // Download and upload image if enabled
              if (downloadImages && imageUrl.startsWith('http')) {
                try {
                  const uploadedImage = await this.downloadAndUploadImage(imageUrl, item, storeId);
                  if (uploadedImage) {
                    imageUrl = uploadedImage.url;
                  }
                } catch (error) {
                  console.warn(`⚠️ Failed to download image ${imageUrl}:`, error.message);
                  // Continue with original URL as fallback
                }
              }
              
              images.push({
                url: imageUrl,
                alt: item.data.alt || '',
                sort_order: images.length,
                variants: {
                  thumbnail: imageUrl,
                  medium: imageUrl, 
                  large: imageUrl
                },
                metadata: {
                  attribute: attrName,
                  scope: item.scope,
                  locale: item.locale,
                  original_url: typeof item.data === 'string' ? item.data : 
                               (item.data.url || item.data.path || item.data.href),
                  downloaded: downloadImages
                }
              });
            }
          }
        }
      }
    }

    return images;
  }

  /**
   * Download image from Akeneo and upload to storage system
   */
  async downloadAndUploadImage(imageUrl, imageItem, storeId = null) {
    const fetch = require('node-fetch');
    const storageManager = require('./storage-manager');
    
    try {
      console.log(`📥 Downloading image from Akeneo: ${imageUrl}`);
      
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the image content type and determine file extension
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const extension = contentType.split('/')[1] || 'jpg';
      
      // Get image buffer
      const buffer = await response.buffer();
      console.log(`💾 Downloaded image: ${buffer.length} bytes, type: ${contentType}`);
      
      // Create mock file object for storage upload
      const fileName = `akeneo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
      const mockFile = {
        originalname: fileName,
        mimetype: contentType,
        buffer: buffer,
        size: buffer.length
      };

      // Upload using unified storage manager (will handle provider selection and fallbacks)
      if (storeId) {
        try {
          console.log(`☁️ Uploading via storage manager for store: ${storeId}`);
          const uploadResult = await storageManager.uploadImage(storeId, mockFile, {
            folder: 'akeneo-imports',
            public: true
          });
          
          if (uploadResult.success) {
            console.log(`✅ Image uploaded via ${uploadResult.provider}: ${uploadResult.url}`);
            return {
              url: uploadResult.url,
              originalUrl: imageUrl,
              filename: uploadResult.filename,
              size: buffer.length,
              contentType: contentType,
              uploadedTo: uploadResult.provider,
              fallbackUsed: uploadResult.fallbackUsed || false
            };
          }
        } catch (storageError) {
          console.log(`⚠️ Storage manager upload failed, trying local fallback: ${storageError.message}`);
        }
      }

      // Last resort fallback to local upload via API if storage manager fails
      const FormData = require('form-data');
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      // Create temporary file for fallback
      const tempFilePath = path.join(os.tmpdir(), fileName);
      fs.writeFileSync(tempFilePath, buffer);
      
      // Create form data for local upload
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFilePath), {
        filename: fileName,
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
}

module.exports = AkeneoMapping;