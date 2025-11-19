/**
 * Translation Service
 *
 * RAG INTEGRATION:
 * This service uses RAG (Retrieval-Augmented Generation) to enhance AI translations
 * with translation-specific context from the database.
 *
 * HOW RAG IS USED:
 * When translating with AI (_translateWithClaude), the service fetches:
 * - Translation best practices (preserve formatting, cultural adaptation)
 * - E-commerce glossaries (common terms like "Cart", "Checkout", "SKU")
 * - Language-specific guidelines (RTL support, character encoding)
 *
 * WHY USE RAG:
 * - Consistent terminology across all translations
 * - Better handling of e-commerce specific terms
 * - Context-aware translations (button vs paragraph)
 * - Cultural adaptation guidelines
 *
 * See: backend/src/services/RAG_SYSTEM.md for full RAG documentation
 * See: backend/src/services/aiContextService.js for context fetching
 */

const ConnectionManager = require('./database/ConnectionManager');
const aiContextService = require('./aiContextService');
const creditService = require('./credit-service');
const ServiceCreditCost = require('../models/ServiceCreditCost');
const aiProvider = require('./ai-provider-service');

class TranslationService {
  constructor() {
    // AI provider is now managed centrally by ai-provider-service
  }

  /**
   * Get all UI labels for a specific language and store
   */
  async getUILabels(storeId, languageCode) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: translations, error } = await tenantDb
      .from('translations')
      .select('key, value, category, type')
      .eq('store_id', storeId)
      .eq('language_code', languageCode);

    if (error) {
      throw new Error(`Failed to fetch UI labels: ${error.message}`);
    }

    // Convert to nested object structure
    // e.g., "common.home" becomes { common: { home: "Home" } }
    const labels = {};
    const customKeys = [];

    translations.forEach(t => {
      // Track custom keys
      if (t.type === 'custom') {
        customKeys.push(t.key);
      }

      const keys = t.key.split('.');
      let current = labels;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];

        // If current[key] is a string, it means we have a conflict
        // (e.g., both "checkout" and "checkout.cart" exist)
        // In this case, skip nested keys and only keep the top-level string
        if (typeof current[key] === 'string') {
          console.warn(`Translation key conflict: "${t.key}" conflicts with existing key "${keys.slice(0, i + 1).join('.')}"`);
          return; // Skip this nested key
        }

        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }

      const lastKey = keys[keys.length - 1];

      // Only set if it won't overwrite an existing object with nested keys
      if (typeof current[lastKey] === 'object' && Object.keys(current[lastKey]).length > 0) {
        console.warn(`Translation key conflict: Cannot set "${t.key}" because it would overwrite nested keys`);
        return;
      }

      current[lastKey] = t.value;
    });

    return { labels, customKeys };
  }

  /**
   * Get UI labels for all languages for a specific store
   */
  async getAllUILabels(storeId) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: translations, error } = await tenantDb
      .from('translations')
      .select('key, language_code, value, category')
      .eq('store_id', storeId);

    if (error) {
      throw new Error(`Failed to fetch all UI labels: ${error.message}`);
    }

    // Group by key
    const result = {};
    translations.forEach(t => {
      if (!result[t.key]) {
        result[t.key] = {
          category: t.category,
          translations: {}
        };
      }
      result[t.key].translations[t.language_code] = t.value;
    });

    return result;
  }

  /**
   * Save or update a UI label translation for a specific store
   */
  async saveUILabel(storeId, key, languageCode, value, category = 'common', type = 'custom') {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const translationData = {
      store_id: storeId,
      key,
      language_code: languageCode,
      value,
      category,
      type
    };

    const { data, error } = await tenantDb
      .from('translations')
      .upsert(translationData, {
        onConflict: 'store_id,key,language_code'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save UI label: ${error.message}`);
    }

    return data;
  }

  /**
   * Save multiple UI labels at once for a specific store
   */
  async saveBulkUILabels(storeId, labels) {
    const promises = labels.map(({ key, language_code, value, category, type = 'custom' }) =>
      this.saveUILabel(storeId, key, language_code, value, category, type)
    );
    return await Promise.all(promises);
  }

  /**
   * Delete a UI label translation for a specific store
   */
  async deleteUILabel(storeId, key, languageCode) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { error } = await tenantDb
      .from('translations')
      .delete()
      .eq('store_id', storeId)
      .eq('key', key)
      .eq('language_code', languageCode);

    if (error) {
      throw new Error(`Failed to delete UI label: ${error.message}`);
    }

    return true;
  }

  /**
   * AI Translation using Anthropic Claude API
   * Falls back to returning original text if API key not configured
   */
  async aiTranslate(text, fromLang, toLang, context = {}) {
    // Check if any AI provider is available
    const provider = aiProvider.getFirstAvailableProvider();

    if (!provider) {
      console.warn('⚠️  No AI provider configured for translation');
      return text; // Return original text if no API key
    }

    try {
      // Use the first available provider (Anthropic preferred, then OpenAI, etc.)
      console.log(`   🤖 Using AI provider: ${provider}`);

      if (provider === 'anthropic' || provider === 'openai') {
        return await this._translateWithClaude(text, fromLang, toLang, context);
      } else if (provider === 'deepseek') {
        // Future: DeepSeek translation
        throw new Error('DeepSeek not yet implemented');
      } else if (provider === 'gemini') {
        // Future: Gemini translation
        throw new Error('Gemini not yet implemented');
      }

      return text;
    } catch (error) {
      console.error('AI translation error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Translate text using Claude AI with RAG context
   *
   * RAG USAGE:
   * This method ALWAYS fetches translation-specific context from the database
   * before translating. The context includes:
   * - Translation best practices (how to handle HTML, placeholders, etc.)
   * - E-commerce glossaries (standard translations for common terms)
   * - Language-specific guidelines (RTL, character limits, etc.)
   *
   * WHY THIS MATTERS:
   * - Ensures consistent terminology (e.g., "Shopping Cart" not "Basket")
   * - Preserves technical elements (HTML tags, {{variables}})
   * - Follows e-commerce conventions (prices, SKUs, etc.)
   *
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language code (e.g., 'en')
   * @param {string} toLang - Target language code (e.g., 'fr')
   * @param {Object} context - Translation context
   * @param {string} context.type - 'button' | 'heading' | 'label' | 'paragraph' | 'description'
   * @param {string} context.location - 'cart' | 'checkout' | 'product' | 'homepage'
   * @param {number} context.maxLength - Max character limit for translation
   *
   * @returns {Promise<string>} Translated text
   *
   * @example
   * const translated = await translationService._translateWithClaude(
   *   'Add to Cart',
   *   'en',
   *   'fr',
   *   { type: 'button', location: 'product', maxLength: 20 }
   * );
   */
  async _translateWithClaude(text, fromLang, toLang, context = {}) {
    // ⚡ RAG: Fetch translation-specific context from database
    // This includes: best practices, glossaries, language-specific guidelines
    // Limit to 3 documents since translations are simpler than plugin generation
    const ragContext = await aiContextService.getContextForQuery({
      mode: 'all',               // Both nocode and developer translations
      category: 'translations',  // Translation-specific context only
      query: `translate from ${fromLang} to ${toLang}`, // Language pair (future: vector search)
      limit: 3                   // Keep it light for fast translation
    });

    console.log(`      📝 Text to translate: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);

    try {
      // Use unified AI provider service
      const result = await aiProvider.translate(text, fromLang, toLang, {
        provider: 'anthropic',
        context,
        ragContext
      });

      console.log(`      📤 Translated text: "${result.translatedText.substring(0, 100)}${result.translatedText.length > 100 ? '...' : ''}"`);

      return result.translatedText;
    } catch (error) {
      console.error(`      ❌ Translation failed:`, error.message);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async _translateWithOpenAI(text, fromLang, toLang, context = {}) {
    try {
      // Use unified AI provider service
      const result = await aiProvider.translate(text, fromLang, toLang, {
        provider: 'openai',
        context
      });

      return result.translatedText;
    } catch (error) {
      console.error(`      ❌ OpenAI translation failed:`, error.message);
      throw new Error(`OpenAI translation failed: ${error.message}`);
    }
  }

  /**
   * Get entity translation (Product, Category, CmsPage, CmsBlock)
   */
  async getEntityTranslation(storeId, entityType, entityId, languageCode) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);
    const tableName = this._getEntityTableName(entityType);

    const { data: entity, error } = await tenantDb
      .from(tableName)
      .select('translations')
      .eq('id', entityId)
      .single();

    if (error || !entity || !entity.translations) {
      return null;
    }

    return entity.translations[languageCode] || null;
  }

  /**
   * Save entity translation (uses normalized tables for most entities)
   */
  async saveEntityTranslation(storeId, entityType, entityId, languageCode, translationData) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Products, Categories, Attributes, etc. use separate translation tables
    // Only CMS Pages/Blocks still use JSONB translations column

    if (entityType === 'product') {
      const { updateProductTranslations } = require('../utils/productHelpers');
      const translations = { [languageCode]: translationData };
      await updateProductTranslations(storeId, entityId, translations);

      const { data: product, error } = await tenantDb
        .from('products')
        .select('*')
        .eq('id', entityId)
        .single();

      if (error) throw new Error(`Failed to fetch product: ${error.message}`);
      return product;
    } else if (entityType === 'category') {
      const { updateCategoryWithTranslations } = require('../utils/categoryHelpers');
      await updateCategoryWithTranslations(storeId, entityId, {}, { [languageCode]: translationData });

      const { data: category, error } = await tenantDb
        .from('categories')
        .select('*')
        .eq('id', entityId)
        .single();

      if (error) throw new Error(`Failed to fetch category: ${error.message}`);
      return category;
    } else if (entityType === 'attribute') {
      const { saveAttributeTranslations } = require('../utils/attributeHelpers');
      await saveAttributeTranslations(storeId, entityId, { [languageCode]: translationData });

      const { data: attribute, error } = await tenantDb
        .from('attributes')
        .select('*')
        .eq('id', entityId)
        .single();

      if (error) throw new Error(`Failed to fetch attribute: ${error.message}`);
      return attribute;
    } else if (entityType === 'cms_page') {
      const { saveCMSPageTranslations } = require('../utils/cmsHelpers');
      await saveCMSPageTranslations(storeId, entityId, { [languageCode]: translationData });

      const { data: cmsPage, error } = await tenantDb
        .from('cms_pages')
        .select('*')
        .eq('id', entityId)
        .single();

      if (error) throw new Error(`Failed to fetch CMS page: ${error.message}`);
      return cmsPage;
    } else if (entityType === 'cms_block') {
      const { saveCMSBlockTranslations } = require('../utils/cmsHelpers');
      await saveCMSBlockTranslations(storeId, entityId, { [languageCode]: translationData });

      const { data: cmsBlock, error } = await tenantDb
        .from('cms_blocks')
        .select('*')
        .eq('id', entityId)
        .single();

      if (error) throw new Error(`Failed to fetch CMS block: ${error.message}`);
      return cmsBlock;
    }

    // Fallback for other entity types with JSONB translations column
    const tableName = this._getEntityTableName(entityType);
    const { data: entity, error: fetchError } = await tenantDb
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single();

    if (fetchError || !entity) {
      throw new Error(`${entityType} not found`);
    }

    const translations = entity.translations || {};
    translations[languageCode] = translationData;

    const { data: updatedEntity, error: updateError } = await tenantDb
      .from(tableName)
      .update({ translations })
      .eq('id', entityId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update ${entityType} translations: ${updateError.message}`);
    }

    return updatedEntity;
  }

  /**
   * Translate all fields of an entity using AI (with field-level merging)
   */
  async aiTranslateEntity(storeId, entityType, entityId, fromLang, toLang) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Load entity with translations from appropriate source
    let entity;

    if (entityType === 'product') {
      const { applyAllProductTranslations } = require('../utils/productHelpers');

      const { data: productRaw, error } = await tenantDb
        .from('products')
        .select('*')
        .eq('id', entityId)
        .single();

      if (error || !productRaw) throw new Error('Product not found');
      const [productWithTranslations] = await applyAllProductTranslations(storeId, [productRaw]);
      entity = productWithTranslations;
    } else if (entityType === 'category') {
      const { getCategoriesWithAllTranslations } = require('../utils/categoryHelpers');
      const categories = await getCategoriesWithAllTranslations(storeId, { id: entityId });
      entity = categories[0];
      if (!entity) throw new Error('Category not found');
    } else if (entityType === 'attribute') {
      const { getAttributesWithTranslations } = require('../utils/attributeHelpers');
      const attributes = await getAttributesWithTranslations(storeId, { id: entityId });
      entity = attributes[0];
      if (!entity) throw new Error('Attribute not found');
    } else if (entityType === 'cms_page') {
      const { getCMSPagesWithAllTranslations } = require('../utils/cmsHelpers');
      const pages = await getCMSPagesWithAllTranslations(storeId, { id: entityId });
      entity = pages[0];
      if (!entity) throw new Error('CMS page not found');
    } else if (entityType === 'cms_block') {
      const { getCMSBlocksWithAllTranslations } = require('../utils/cmsHelpers');
      const blocks = await getCMSBlocksWithAllTranslations(storeId, { id: entityId });
      entity = blocks[0];
      if (!entity) throw new Error('CMS block not found');
    } else {
      // Fallback for any other entity types
      const tableName = this._getEntityTableName(entityType);
      const { data: entityData, error } = await tenantDb
        .from(tableName)
        .select('*')
        .eq('id', entityId)
        .single();

      if (error || !entityData) throw new Error(`${entityType} not found`);
      entity = entityData;

      console.log(`   📦 Loaded ${entityType} from database:`, {
        id: entity.id,
        hasTranslations: !!entity.translations,
        translationsKeys: entity.translations ? Object.keys(entity.translations) : 'null/undefined',
        translations: entity.translations
      });
    }

    if (!entity.translations || !entity.translations[fromLang]) {
      console.error(`   ❌ Source translation not found for ${entityType} ${entityId}`);
      console.error(`   📋 translations object:`, entity.translations);
      console.error(`   📋 Looking for language:`, fromLang);
      throw new Error('Source translation not found');
    }

    const sourceTranslation = entity.translations[fromLang];
    const existingTargetTranslation = entity.translations[toLang] || {};
    const translatedData = { ...existingTargetTranslation }; // Start with existing target translation

    console.log(`   🔄 aiTranslateEntity: ${entityType} ${entityId} (${fromLang} → ${toLang})`);
    console.log(`   📋 Source fields (${fromLang}):`, Object.keys(sourceTranslation));
    console.log(`   📋 Source data:`, JSON.stringify(sourceTranslation, null, 2));
    console.log(`   📋 Existing target (${toLang}):`, JSON.stringify(existingTargetTranslation, null, 2));

    let fieldsTranslated = 0;

    // Translate each field only if target is empty
    for (const [key, value] of Object.entries(sourceTranslation)) {
      const targetValue = existingTargetTranslation[key];
      const targetHasContent = targetValue && typeof targetValue === 'string' && targetValue.trim().length > 0;

      console.log(`   🔍 Field "${key}": sourceValue="${value ? value.substring(0, 30) : '(empty)'}", targetValue="${targetValue ? targetValue.substring(0, 30) : '(empty)'}", targetHasContent=${targetHasContent}`);

      if (typeof value === 'string' && value.trim() && !targetHasContent) {
        console.log(`      🤖 Calling AI to translate field "${key}": "${value.substring(0, 50)}..."`);
        const translated = await this.aiTranslate(value, fromLang, toLang);
        console.log(`      ✨ AI returned: "${translated.substring(0, 50)}..."`);
        translatedData[key] = translated;
        fieldsTranslated++;
      } else if (targetHasContent) {
        console.log(`      ⏭️  Field "${key}" already has content, preserving`);
      } else {
        console.log(`      ⏭️  Field "${key}" is empty in source`);
        translatedData[key] = targetValue || ''; // Preserve or set empty
      }
    }

    console.log(`   💾 Final translated data (${toLang}):`, JSON.stringify(translatedData, null, 2));
    console.log(`   ✅ Translated ${fieldsTranslated} field(s) for ${entityType}`);

    // Save the translation
    return await this.saveEntityTranslation(storeId, entityType, entityId, toLang, translatedData);
  }

  /**
   * Get missing translations report
   */
  async getMissingTranslationsReport(storeId) {
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data: languages, error: langError } = await tenantDb
      .from('languages')
      .select('code, name')
      .eq('is_active', true);

    if (langError) {
      throw new Error(`Failed to fetch languages: ${langError.message}`);
    }

    const defaultLang = languages.find(l => l.code === 'en') || languages[0];

    const { data: uiLabels, error: labelsError } = await tenantDb
      .from('translations')
      .select('key')
      .eq('language_code', defaultLang.code)
      .eq('store_id', storeId);

    if (labelsError) {
      throw new Error(`Failed to fetch UI labels: ${labelsError.message}`);
    }

    const report = {
      ui_labels: {},
      entities: {}
    };

    // Check UI labels
    for (const label of uiLabels) {
      for (const lang of languages) {
        if (lang.code === defaultLang.code) continue;

        const { data: exists, error } = await tenantDb
          .from('translations')
          .select('id')
          .eq('key', label.key)
          .eq('language_code', lang.code)
          .eq('store_id', storeId)
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to check translation: ${error.message}`);
        }

        if (!exists) {
          if (!report.ui_labels[lang.code]) {
            report.ui_labels[lang.code] = [];
          }
          report.ui_labels[lang.code].push(label.key);
        }
      }
    }

    return report;
  }

  /**
   * Helper to get entity table name
   */
  _getEntityTableName(entityType) {
    const tableNames = {
      product: 'products',
      category: 'categories',
      attribute: 'attributes',
      cms_page: 'cms_pages',
      cms_block: 'cms_blocks',
      'email-template': 'email_templates',
      'pdf-template': 'pdf_templates'
    };

    const tableName = tableNames[entityType.toLowerCase()];
    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    return tableName;
  }

  /**
   * Get translation cost for an entity type
   * Maps entity types to service_credit_cost keys and retrieves the cost
   */
  async getTranslationCost(entityType) {
    // Map entity types to service keys
    const serviceKeyMap = {
      'standard': 'ai_translation',
      'product': 'ai_translation_product',
      'category': 'ai_translation_category',
      'attribute': 'ai_translation_attribute',
      'cms_page': 'ai_translation_cms_page',
      'cms_block': 'ai_translation_cms_block',
      'product_tab': 'ai_translation_product_tab',
      'product_label': 'ai_translation_product_label',
      'cookie_consent': 'ai_translation_cookie_consent',
      'attribute_value': 'ai_translation_attribute_value',
      'email-template': 'ai_translation_email_template',
      'pdf-template': 'ai_translation_pdf_template',
      'custom-option': 'ai_translation_custom_option',
      'custom_option': 'ai_translation_custom_option',
      'stock-label': 'ai_translation_stock_label',
      'stock_labels': 'ai_translation_stock_label',
      'ui-labels': 'ai_translation'
    };

    // Fallback costs (in credits) if not found in database
    const fallbackCosts = {
      'standard': 0.1,
      'product': 0.1,
      'category': 0.1,
      'attribute': 0.1,
      'cms_page': 0.5,
      'cms_block': 0.2,
      'product_tab': 0.1,
      'product_label': 0.1,
      'cookie_consent': 0.1,
      'attribute_value': 0.1,
      'email-template': 0.1,
      'pdf-template': 0.1,
      'custom-option': 0.1,
      'custom_option': 0.1,
      'stock-label': 0.1,
      'stock_labels': 0.1,
      'ui-labels': 0.1
    };

    const serviceKey = serviceKeyMap[entityType] || serviceKeyMap['standard'];

    try {
      const cost = await ServiceCreditCost.getCostByKey(serviceKey);
      return parseFloat(cost);
    } catch (error) {
      console.warn(`⚠️ Could not fetch cost for ${serviceKey}, using fallback:`, error.message);
      return fallbackCosts[entityType] || fallbackCosts['standard'];
    }
  }
}

module.exports = new TranslationService();
