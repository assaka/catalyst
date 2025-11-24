const ConnectionManager = require('./database/ConnectionManager');
const { v4: uuidv4 } = require('uuid');

/**
 * AttributeMappingService
 *
 * Handles attribute mapping, normalization, and deduplication across multiple import sources
 * (Shopify, Magento, Akeneo, WooCommerce, etc.)
 *
 * Features:
 * - Smart attribute matching to prevent duplicates
 * - Normalization (tv_size, size_tv, TV-Size all map to same attribute)
 * - Cross-platform attribute mapping
 * - Automatic attribute creation
 */
class AttributeMappingService {
  constructor(storeId, source = 'shopify') {
    this.storeId = storeId;
    this.source = source; // shopify, magento, akeneo, woocommerce, etc.
    this.attributeCache = new Map(); // Cache loaded attributes
    this.mappingCache = new Map(); // Cache loaded mappings from integration_attribute_mappings table
  }

  /**
   * Common attribute mappings across platforms
   * Maps various platform-specific attribute names to canonical names
   */
  static COMMON_MAPPINGS = {
    // Product type / category type
    'product_type': ['product_type', 'producttype', 'type', 'category_type', 'item_type'],
    'brand': ['brand', 'vendor', 'manufacturer', 'make'],
    'color': ['color', 'colour', 'colour_name', 'color_name'],
    'size': ['size', 'size_value', 'item_size'],
    'material': ['material', 'fabric', 'composition'],
    'weight': ['weight', 'weight_value', 'item_weight', 'weight_grams'],
    'length': ['length', 'item_length', 'length_value'],
    'width': ['width', 'item_width', 'width_value'],
    'height': ['height', 'item_height', 'height_value'],
    'sku': ['sku', 'item_code', 'product_code', 'article_number'],
    'barcode': ['barcode', 'ean', 'upc', 'gtin', 'isbn'],
    'tags': ['tags', 'keywords', 'labels']
  };

  /**
   * Normalize attribute key to canonical form
   * - Converts to lowercase
   * - Replaces hyphens/spaces with underscores
   * - Removes special characters
   * - Sorts words alphabetically for fuzzy matching
   */
  normalizeAttributeKey(key) {
    // Convert to lowercase and clean up
    let normalized = key
      .toLowerCase()
      .replace(/[- ]/g, '_')  // Replace hyphens and spaces with underscores
      .replace(/[^a-z0-9_]/g, ''); // Remove special characters

    // Split into words
    const words = normalized.split('_').filter(w => w.length > 0);

    // Create canonical version (sorted) for fuzzy matching
    const sortedWords = [...words].sort();

    return {
      canonical: sortedWords.join('_'),  // For matching: "size_tv"
      display: words.join('_'),          // For display: "tv_size"
      original: key                       // Original key
    };
  }

  /**
   * Find canonical attribute name from common mappings
   * Example: "vendor" -> "brand", "colour" -> "color"
   */
  findCanonicalMapping(attributeKey) {
    const normalized = attributeKey.toLowerCase().replace(/[- ]/g, '_');

    for (const [canonical, variations] of Object.entries(AttributeMappingService.COMMON_MAPPINGS)) {
      if (variations.includes(normalized)) {
        return canonical;
      }
    }

    return null;
  }

  /**
   * Load existing attribute mappings from integration_attribute_mappings table
   */
  async loadExistingMappings() {
    if (this.mappingCache.size > 0) {
      return; // Already loaded
    }

    const tenantDb = await ConnectionManager.getStoreConnection(this.storeId);

    const { data: mappings, error} = await tenantDb
      .from('integration_attribute_mappings')
      .select('*')
      .eq('store_id', this.storeId)
      .eq('integration_source', this.source)
      .eq('is_active', true);

    if (error) {
      console.error('Error loading attribute mappings:', error);
      return;
    }

    // Cache mappings by external attribute code
    (mappings || []).forEach(mapping => {
      this.mappingCache.set(mapping.external_attribute_code, mapping);
    });

    console.log(`🗺️  Loaded ${mappings?.length || 0} existing ${this.source} attribute mappings for store ${this.storeId}`);
  }

  /**
   * Load all existing attributes for this store and cache them
   */
  async loadExistingAttributes() {
    if (this.attributeCache.size > 0) {
      return; // Already loaded
    }

    const tenantDb = await ConnectionManager.getStoreConnection(this.storeId);

    const { data: attributes, error } = await tenantDb
      .from('attributes')
      .select('*')
      .eq('store_id', this.storeId);

    if (error) {
      console.error('Error loading attributes:', error);
      return;
    }

    // Cache attributes with their normalized keys
    (attributes || []).forEach(attr => {
      const normalized = this.normalizeAttributeKey(attr.code);
      this.attributeCache.set(normalized.canonical, attr);
      this.attributeCache.set(attr.code, attr); // Also cache by exact code
    });

    console.log(`📦 Loaded ${attributes?.length || 0} existing attributes for store ${this.storeId}`);
  }

  /**
   * Find existing attribute with smart matching
   * Priority order:
   * 1. Check integration_attribute_mappings table (highest priority - user/auto configured)
   * 2. Try exact code match
   * 3. Try canonical (sorted) match
   * 4. Try common mapping match (COMMON_MAPPINGS)
   */
  async findExistingAttribute(attributeKey) {
    await this.loadExistingMappings(); // Load mappings first
    await this.loadExistingAttributes();

    const normalized = this.normalizeAttributeKey(attributeKey);

    // 1. HIGHEST PRIORITY: Check if mapping exists in integration_attribute_mappings table
    if (this.mappingCache.has(attributeKey)) {
      const mapping = this.mappingCache.get(attributeKey);
      const attribute = this.attributeCache.get(mapping.internal_attribute_code);
      if (attribute) {
        console.log(`🗺️  Mapped "${attributeKey}" (${this.source}) → "${attribute.code}" via mapping table`);

        // Update usage stats
        this.updateMappingUsage(mapping.id).catch(err => console.error('Failed to update mapping usage:', err));

        return attribute;
      }
    }

    // 2. Try exact match
    if (this.attributeCache.has(attributeKey)) {
      return this.attributeCache.get(attributeKey);
    }

    // 3. Try display name match
    if (this.attributeCache.has(normalized.display)) {
      return this.attributeCache.get(normalized.display);
    }

    // 4. Try canonical (sorted) match
    if (this.attributeCache.has(normalized.canonical)) {
      const match = this.attributeCache.get(normalized.canonical);
      console.log(`📎 Fuzzy matched "${attributeKey}" to existing attribute "${match.code}"`);
      return match;
    }

    // 5. Try common mapping match (fallback to hardcoded COMMON_MAPPINGS)
    const canonical = this.findCanonicalMapping(attributeKey);
    if (canonical && this.attributeCache.has(canonical)) {
      const match = this.attributeCache.get(canonical);
      console.log(`📎 Canonical mapped "${attributeKey}" to existing attribute "${match.code}"`);
      return match;
    }

    return null;
  }

  /**
   * Create new attribute in database
   */
  async createAttribute(attributeData) {
    const tenantDb = await ConnectionManager.getStoreConnection(this.storeId);

    const { data, error } = await tenantDb
      .from('attributes')
      .insert({
        id: uuidv4(),
        code: attributeData.code,
        name: attributeData.name,
        type: attributeData.type || 'text',
        is_required: false,
        is_filterable: attributeData.is_filterable || false,
        is_searchable: attributeData.is_searchable || true,
        sort_order: attributeData.sort_order || 100,
        store_id: this.storeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attribute:', error);
      throw error;
    }

    // Create English translation for the attribute
    try {
      await tenantDb
        .from('attribute_translations')
        .insert({
          attribute_id: data.id,
          language_code: 'en',
          label: attributeData.name,
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      console.log(`✅ Created English translation for attribute: ${data.code}`);
    } catch (translationError) {
      console.error(`⚠️ Failed to create translation for ${data.code}:`, translationError);
      // Don't throw - attribute is created, translation can be added later
    }

    // Add to cache
    const normalized = this.normalizeAttributeKey(data.code);
    this.attributeCache.set(normalized.canonical, data);
    this.attributeCache.set(data.code, data);

    console.log(`✅ Created new attribute: ${data.code} (${attributeData.name})`);
    return data;
  }

  /**
   * Process product attributes from any import source
   * Returns normalized attributes ready to store in product.attributes JSONB
   * Auto-creates mappings in integration_attribute_mappings table for future imports
   */
  async processProductAttributes(rawAttributes) {
    const processedAttributes = {};
    const createdAttributes = [];
    const createdMappings = [];

    for (const [key, value] of Object.entries(rawAttributes)) {
      if (!value || value === '') continue;

      // Find or create attribute
      let attribute = await this.findExistingAttribute(key);
      let mappingSource = 'auto';
      let confidenceScore = 1.00;

      if (!attribute) {
        // Create new attribute
        const normalized = this.normalizeAttributeKey(key);

        // Try to use canonical mapping for the code
        const canonical = this.findCanonicalMapping(key);
        const attributeCode = canonical || normalized.display;

        attribute = await this.createAttribute({
          code: attributeCode,
          name: this.formatAttributeName(attributeCode),
          type: this.inferAttributeType(value),
          is_filterable: this.shouldBeFilterable(attributeCode),
          is_searchable: true
        });

        createdAttributes.push(attribute);

        // If canonical mapping was used, mark high confidence
        if (canonical) {
          mappingSource = 'auto';
          confidenceScore = 1.00; // High confidence for canonical mappings
        } else {
          mappingSource = 'auto';
          confidenceScore = 0.85; // Medium confidence for normalized mappings
        }
      } else {
        // Attribute exists - determine how it was matched
        if (this.mappingCache.has(key)) {
          // Already has a mapping - skip creating new one
          mappingSource = null;
        } else {
          // Matched via fuzzy/canonical logic - create mapping with confidence
          const canonical = this.findCanonicalMapping(key);
          if (canonical) {
            mappingSource = 'auto';
            confidenceScore = 0.95; // High confidence for canonical match
          } else if (this.normalizeAttributeKey(key).canonical === this.normalizeAttributeKey(attribute.code).canonical) {
            mappingSource = 'auto';
            confidenceScore = 0.90; // Good confidence for fuzzy match
          } else {
            mappingSource = 'auto';
            confidenceScore = 0.80; // Lower confidence - may need review
          }
        }
      }

      // Create mapping if needed (and not already exists)
      if (mappingSource && !this.mappingCache.has(key)) {
        const mapping = await this.createMapping(key, attribute, mappingSource, confidenceScore);
        if (mapping) {
          createdMappings.push(mapping);
        }
      }

      // Store with the canonical attribute code
      processedAttributes[attribute.code] = value;
    }

    return {
      attributes: processedAttributes,
      createdAttributes,
      createdMappings
    };
  }

  /**
   * Format attribute code into human-readable name
   * Example: "tv_size" -> "TV Size", "product_type" -> "Product Type"
   */
  formatAttributeName(code) {
    return code
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Infer attribute type from value
   */
  inferAttributeType(value) {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'multiselect';
    if (typeof value === 'string') {
      // Check if it's a comma-separated list
      if (value.includes(',') && value.split(',').length > 1) {
        return 'multiselect';
      }
    }
    return 'text';
  }

  /**
   * Determine if attribute should be filterable
   */
  shouldBeFilterable(code) {
    const filterableAttributes = [
      'brand', 'vendor', 'manufacturer',
      'color', 'colour', 'size',
      'material', 'product_type', 'type'
    ];

    return filterableAttributes.some(attr => code.includes(attr));
  }

  /**
   * Create a new mapping in integration_attribute_mappings table
   */
  async createMapping(externalAttributeCode, internalAttribute, mappingSource = 'auto', confidenceScore = 1.00) {
    const tenantDb = await ConnectionManager.getStoreConnection(this.storeId);

    const { data, error } = await tenantDb
      .from('integration_attribute_mappings')
      .insert({
        id: uuidv4(),
        integration_source: this.source,
        external_attribute_code: externalAttributeCode,
        external_attribute_name: this.formatAttributeName(externalAttributeCode),
        internal_attribute_id: internalAttribute.id,
        internal_attribute_code: internalAttribute.code,
        is_active: true,
        mapping_direction: 'bidirectional',
        mapping_source: mappingSource,
        confidence_score: confidenceScore,
        store_id: this.storeId,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attribute mapping:', error);
      // Don't throw - mapping creation is not critical
      return null;
    }

    // Add to cache
    this.mappingCache.set(externalAttributeCode, data);

    console.log(`🗺️  Created mapping: ${this.source}."${externalAttributeCode}" → "${internalAttribute.code}" (source: ${mappingSource}, confidence: ${confidenceScore})`);
    return data;
  }

  /**
   * Update mapping usage statistics
   */
  async updateMappingUsage(mappingId) {
    const tenantDb = await ConnectionManager.getStoreConnection(this.storeId);

    // First get current usage_count
    const { data: currentMapping } = await tenantDb
      .from('integration_attribute_mappings')
      .select('usage_count')
      .eq('id', mappingId)
      .single();

    if (!currentMapping) return;

    // Then increment it
    await tenantDb
      .from('integration_attribute_mappings')
      .update({
        usage_count: (currentMapping.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', mappingId);
  }

  /**
   * Clear attribute and mapping caches (useful for testing or after bulk operations)
   */
  clearCache() {
    this.attributeCache.clear();
    this.mappingCache.clear();
  }
}

module.exports = AttributeMappingService;
