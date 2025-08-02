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
  transformCategory(akeneoCategory, storeId, locale = 'en_US') {
    const catalystCategory = {
      store_id: storeId,
      name: this.extractLocalizedValue(akeneoCategory.labels, locale) || akeneoCategory.code,
      slug: this.generateSlug(this.extractLocalizedValue(akeneoCategory.labels, locale) || akeneoCategory.code),
      description: null,
      image_url: null,
      sort_order: 0,
      is_active: true,
      hide_in_menu: false,
      meta_title: null,
      meta_description: null,
      meta_keywords: null,
      meta_robots_tag: 'index, follow',
      parent_id: null, // Will be resolved later
      level: 0, // Will be calculated
      path: null, // Will be calculated
      product_count: 0,
      // Keep original Akeneo data for reference
      akeneo_code: akeneoCategory.code,
      akeneo_parent: akeneoCategory.parent
    };

    return catalystCategory;
  }

  /**
   * Transform Akeneo product to Catalyst product format
   */
  transformProduct(akeneoProduct, storeId, locale = 'en_US') {
    const values = akeneoProduct.values || {};
    
    const catalystProduct = {
      store_id: storeId,
      name: this.extractProductValue(values, 'name', locale) || 
            this.extractProductValue(values, 'label', locale) || 
            akeneoProduct.identifier,
      slug: this.generateSlug(
        this.extractProductValue(values, 'name', locale) || 
        this.extractProductValue(values, 'label', locale) || 
        akeneoProduct.identifier
      ),
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
      images: this.extractImages(values),
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
      akeneo_identifier: akeneoProduct.identifier,
      akeneo_family: akeneoProduct.family,
      akeneo_groups: akeneoProduct.groups || []
    };

    return catalystProduct;
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
   * Extract images from product attributes
   */
  extractImages(values) {
    const images = [];
    
    // Check common image attribute names
    const imageAttributes = ['image', 'images', 'picture', 'pictures', 'photo', 'photos'];
    
    imageAttributes.forEach(attrName => {
      const imageData = values[attrName];
      if (imageData && Array.isArray(imageData)) {
        imageData.forEach(item => {
          if (item.data) {
            images.push({
              url: item.data,
              alt: '',
              sort_order: images.length
            });
          }
        });
      }
    });

    return images;
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
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Build category hierarchy from flat Akeneo categories
   */
  buildCategoryHierarchy(akeneoCategories, catalystCategories) {
    // Create a map of Akeneo codes to Catalyst categories
    const codeToCategory = {};
    catalystCategories.forEach(category => {
      codeToCategory[category.akeneo_code] = category;
    });

    // Set parent relationships and calculate levels
    // Note: parent_id will be resolved after database insertion
    catalystCategories.forEach(category => {
      if (category.akeneo_parent) {
        const parentCategory = codeToCategory[category.akeneo_parent];
        if (parentCategory) {
          // Mark for later parent resolution
          category._temp_parent_akeneo_code = category.akeneo_parent;
          category.level = (parentCategory.level || 0) + 1;
          category.path = parentCategory.path ? 
            `${parentCategory.path}/${category.akeneo_code}` : 
            category.akeneo_code;
        }
      } else {
        category.level = 0;
        category.path = category.akeneo_code;
      }
    });

    return catalystCategories;
  }

  /**
   * Map Akeneo category codes to Catalyst category IDs
   */
  mapCategoryIds(akeneoCategoryCodes, categoryMapping) {
    return akeneoCategoryCodes
      .map(code => categoryMapping[code])
      .filter(id => id); // Remove undefined mappings
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