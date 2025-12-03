const { v4: uuidv4 } = require('uuid');

/**
 * Akeneo Mapping Service
 * Handles mapping between Akeneo data structures and DainoStore entities
 */
class AkeneoMapping {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Map Akeneo product to DainoStore product
   */
  async mapProduct(akeneoProduct, options = {}) {
    const { locale = 'en_US', storeId, preventUrlKeyOverride = false } = options;

    try {
      // Extract localized values
      const getName = (values) => this.extractLocalizedValue(values?.name, locale) || akeneoProduct.identifier;
      const getDescription = (values) => this.extractLocalizedValue(values?.description, locale) || '';
      const getShortDescription = (values) => this.extractLocalizedValue(values?.short_description, locale) || '';

      // Build base product data
      const productData = {
        id: uuidv4(),
        akeneo_identifier: akeneoProduct.identifier,
        name: getName(akeneoProduct.values),
        description: getDescription(akeneoProduct.values),
        short_description: getShortDescription(akeneoProduct.values),
        sku: akeneoProduct.identifier,
        status: this.mapProductStatus(akeneoProduct.enabled),
        store_id: storeId,
        type: 'simple', // TODO: Handle different product types
        weight: this.extractNumericValue(akeneoProduct.values?.weight, locale),
        price: this.extractNumericValue(akeneoProduct.values?.price, locale),
        special_price: this.extractNumericValue(akeneoProduct.values?.special_price, locale),
        meta_title: this.extractLocalizedValue(akeneoProduct.values?.meta_title, locale),
        meta_description: this.extractLocalizedValue(akeneoProduct.values?.meta_description, locale),
        meta_keywords: this.extractLocalizedValue(akeneoProduct.values?.meta_keywords, locale),
        created_at: akeneoProduct.created ? new Date(akeneoProduct.created) : new Date(),
        updated_at: akeneoProduct.updated ? new Date(akeneoProduct.updated) : new Date()
      };

      // Handle URL key/slug generation
      if (!preventUrlKeyOverride) {
        productData.slug = this.generateSlug(productData.name);
        productData.url_key = productData.slug;
      }

      // Map categories
      if (akeneoProduct.categories && akeneoProduct.categories.length > 0) {
        productData.category_ids = await this.mapProductCategories(akeneoProduct.categories, storeId);
      }

      // Map attributes
      if (akeneoProduct.values) {
        productData.attributes = await this.mapProductAttributes(akeneoProduct.values, locale);
      }

      // Map images
      if (akeneoProduct.values) {
        productData.images = this.mapProductImages(akeneoProduct.values, locale);
      }

      return productData;
    } catch (error) {
      throw new Error(`Failed to map product ${akeneoProduct.identifier}: ${error.message}`);
    }
  }

  /**
   * Map Akeneo category to DainoStore category
   */
  async mapCategory(akeneoCategory, options = {}) {
    const { locale = 'en_US', storeId, preventUrlKeyOverride = false, akeneoUrlField = 'url_key' } = options;

    try {
      // Extract localized label
      const categoryName = this.extractLocalizedValue(akeneoCategory.labels, locale) || akeneoCategory.code;

      // Build base category data
      const categoryData = {
        id: uuidv4(),
        akeneo_code: akeneoCategory.code,
        name: categoryName,
        description: '',
        store_id: storeId,
        parent_id: null, // Will be resolved after all categories are imported
        akeneo_parent: akeneoCategory.parent,
        level: 0, // Will be calculated after hierarchy is built
        position: 0,
        is_active: true,
        include_in_menu: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Handle URL key/slug generation
      if (!preventUrlKeyOverride) {
        let slugSource = categoryName;
        
        // Check if custom URL field is specified and available
        if (akeneoUrlField && akeneoCategory.values && akeneoCategory.values[akeneoUrlField]) {
          const urlFieldValue = this.extractLocalizedValue(akeneoCategory.values[akeneoUrlField], locale);
          if (urlFieldValue && typeof urlFieldValue === 'string' && urlFieldValue.trim()) {
            slugSource = urlFieldValue.trim();
          }
        }
        
        categoryData.slug = this.generateSlug(slugSource);
        categoryData.url_key = categoryData.slug;
      }

      return categoryData;
    } catch (error) {
      throw new Error(`Failed to map category ${akeneoCategory.code}: ${error.message}`);
    }
  }

  /**
   * Map Akeneo attribute to DainoStore attribute
   */
  async mapAttribute(akeneoAttribute, options = {}) {
    const { locale = 'en_US', storeId } = options;

    try {
      // Extract localized label
      const attributeName = this.extractLocalizedValue(akeneoAttribute.labels, locale) || akeneoAttribute.code;

      // Build base attribute data
      const attributeData = {
        id: uuidv4(),
        akeneo_code: akeneoAttribute.code,
        name: attributeName,
        code: akeneoAttribute.code,
        type: this.mapAttributeType(akeneoAttribute.type),
        store_id: storeId,
        is_required: akeneoAttribute.required || false,
        is_unique: akeneoAttribute.unique || false,
        is_localizable: akeneoAttribute.localizable || false,
        is_scopable: akeneoAttribute.scopable || false,
        sort_order: akeneoAttribute.sort_order || 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Handle attribute options for select/multiselect types
      if (akeneoAttribute.type === 'pim_catalog_simpleselect' || akeneoAttribute.type === 'pim_catalog_multiselect') {
        attributeData.options = await this.mapAttributeOptions(akeneoAttribute.code, locale);
      }

      return attributeData;
    } catch (error) {
      throw new Error(`Failed to map attribute ${akeneoAttribute.code}: ${error.message}`);
    }
  }

  /**
   * Extract localized value from Akeneo data structure
   */
  extractLocalizedValue(localizedData, locale = 'en_US') {
    if (!localizedData) return null;

    if (typeof localizedData === 'string') {
      return localizedData;
    }

    if (Array.isArray(localizedData)) {
      const entry = localizedData.find(item => item.locale === locale);
      return entry ? entry.data : null;
    }

    if (typeof localizedData === 'object') {
      // Handle different Akeneo data structures
      if (localizedData[locale]) {
        return typeof localizedData[locale] === 'object' ? localizedData[locale].data : localizedData[locale];
      }

      // Fallback to first available locale
      const firstKey = Object.keys(localizedData)[0];
      if (firstKey) {
        return typeof localizedData[firstKey] === 'object' ? localizedData[firstKey].data : localizedData[firstKey];
      }
    }

    return null;
  }

  /**
   * Extract numeric value from Akeneo data
   */
  extractNumericValue(valueData, locale = 'en_US') {
    const rawValue = this.extractLocalizedValue(valueData, locale);
    if (rawValue === null || rawValue === undefined) return null;

    // Handle complex price objects from Akeneo
    if (typeof rawValue === 'object' && rawValue !== null) {
      // Handle price collection: [{ amount: "29.99", currency: "USD" }]
      if (Array.isArray(rawValue) && rawValue.length > 0 && rawValue[0].amount !== undefined) {
        const numericValue = parseFloat(rawValue[0].amount);
        return isNaN(numericValue) ? null : numericValue;
      }
      
      // Handle single price object: { amount: "29.99", currency: "USD" }
      if (rawValue.amount !== undefined) {
        const numericValue = parseFloat(rawValue.amount);
        return isNaN(numericValue) ? null : numericValue;
      }
      
      // If it's an object but not a price structure, return null to avoid [object Object] error
      console.warn('⚠️ Unexpected object structure in extractNumericValue:', JSON.stringify(rawValue));
      return null;
    }

    // Handle simple numeric strings
    const numericValue = parseFloat(rawValue);
    return isNaN(numericValue) ? null : numericValue;
  }

  /**
   * Generate URL-friendly slug
   */
  generateSlug(text) {
    if (!text || typeof text !== 'string') {
      return `slug-${Date.now()}`;
    }

    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Map Akeneo product status to DainoStore status
   */
  mapProductStatus(enabled) {
    return enabled ? 'active' : 'inactive';
  }

  /**
   * Map Akeneo attribute type to DainoStore attribute type
   */
  mapAttributeType(akeneoType) {
    const typeMapping = {
      'pim_catalog_text': 'text',
      'pim_catalog_textarea': 'textarea',
      'pim_catalog_number': 'number',
      'pim_catalog_price_collection': 'price',
      'pim_catalog_simpleselect': 'select',
      'pim_catalog_multiselect': 'multiselect',
      'pim_catalog_boolean': 'boolean',
      'pim_catalog_date': 'date',
      'pim_catalog_file': 'file',
      'pim_catalog_image': 'image',
      'pim_catalog_metric': 'metric',
      'pim_catalog_identifier': 'identifier'
    };

    return typeMapping[akeneoType] || 'text';
  }

  /**
   * Map product categories from Akeneo category codes
   */
  async mapProductCategories(akeneoCategoryCodes, storeId) {
    // TODO: Implement category mapping lookup
    // This should query the akeneo_mappings table to find corresponding DainoStore category IDs
    console.log(`📋 Mapping categories: ${akeneoCategoryCodes.join(', ')}`);
    return [];
  }

  /**
   * Map product attributes from Akeneo values
   */
  async mapProductAttributes(akeneoValues, locale) {
    const attributes = {};

    for (const [attributeCode, valueData] of Object.entries(akeneoValues)) {
      const value = this.extractLocalizedValue(valueData, locale);
      if (value !== null && value !== undefined) {
        attributes[attributeCode] = value;
      }
    }

    return attributes;
  }

  /**
   * Map product images from Akeneo values
   */
  mapProductImages(akeneoValues, locale) {
    const images = [];

    // Look for image attributes
    for (const [attributeCode, valueData] of Object.entries(akeneoValues)) {
      if (attributeCode.includes('image') || attributeCode.includes('picture') || attributeCode.includes('photo')) {
        const imageData = this.extractLocalizedValue(valueData, locale);
        if (imageData && typeof imageData === 'object' && imageData.data) {
          images.push({
            attribute_code: attributeCode,
            filename: imageData.data,
            url: imageData._links?.download?.href || null,
            position: images.length
          });
        }
      }
    }

    return images;
  }

  /**
   * Map attribute options for select/multiselect attributes
   */
  async mapAttributeOptions(attributeCode, locale) {
    // TODO: Implement attribute option mapping
    // This would need to fetch options from Akeneo API
    console.log(`📋 Mapping attribute options for: ${attributeCode}`);
    return [];
  }
}

module.exports = AkeneoMapping;