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

const { Translation, Language, Product, Category, Attribute, CmsPage, CmsBlock } = require('../models');
const { Op } = require('sequelize');
const aiContextService = require('./aiContextService');
const creditService = require('./credit-service');
const ServiceCreditCost = require('../models/ServiceCreditCost');
const Anthropic = require('@anthropic-ai/sdk');

class TranslationService {
  constructor() {
    this.anthropicClient = null;
  }

  /**
   * Initialize AI provider client (similar to AIService)
   * Currently supports Anthropic, but designed for easy extension to other providers
   */
  initAnthropicClient() {
    if (!this.anthropicClient && process.env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    return this.anthropicClient;
  }

  /**
   * Get all UI labels for a specific language
   */
  async getUILabels(languageCode) {
    const translations = await Translation.findAll({
      where: { language_code: languageCode },
      attributes: ['key', 'value', 'category', 'type']
    });

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
   * Get UI labels for all languages
   */
  async getAllUILabels() {
    const translations = await Translation.findAll({
      attributes: ['key', 'language_code', 'value', 'category']
    });

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
   * Save or update a UI label translation
   */
  async saveUILabel(key, languageCode, value, category = 'common', type = 'custom') {
    const [translation, created] = await Translation.findOrCreate({
      where: { key, language_code: languageCode },
      defaults: { key, language_code: languageCode, value, category, type }
    });

    if (!created) {
      translation.value = value;
      if (category) translation.category = category;
      if (type) translation.type = type;
      await translation.save();
    }

    return translation;
  }

  /**
   * Save multiple UI labels at once
   */
  async saveBulkUILabels(labels) {
    const promises = labels.map(({ key, language_code, value, category, type = 'custom' }) =>
      this.saveUILabel(key, language_code, value, category, type)
    );
    return await Promise.all(promises);
  }

  /**
   * Delete a UI label translation
   */
  async deleteUILabel(key, languageCode) {
    return await Translation.destroy({
      where: { key, language_code: languageCode }
    });
  }

  /**
   * AI Translation using Anthropic Claude API
   * Falls back to returning original text if API key not configured
   */
  async aiTranslate(text, fromLang, toLang) {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('No AI API key configured for translation');
      return text; // Return original text if no API key
    }

    try {
      // Use Anthropic Claude API
      if (process.env.ANTHROPIC_API_KEY) {
        return await this._translateWithClaude(text, fromLang, toLang);
      }

      // Use OpenAI API as fallback
      if (process.env.OPENAI_API_KEY) {
        return await this._translateWithOpenAI(text, fromLang, toLang);
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
    // Initialize Anthropic client (same pattern as AIService)
    const client = this.initAnthropicClient();

    if (!client) {
      throw new Error('Anthropic client not available. Check ANTHROPIC_API_KEY configuration.');
    }

    // ⚡ RAG: Fetch translation-specific context from database
    // This includes: best practices, glossaries, language-specific guidelines
    // Limit to 3 documents since translations are simpler than plugin generation
    const ragContext = await aiContextService.getContextForQuery({
      mode: 'all',               // Both nocode and developer translations
      category: 'translations',  // Translation-specific context only
      query: `translate from ${fromLang} to ${toLang}`, // Language pair (future: vector search)
      limit: 3                   // Keep it light for fast translation
    });

    const { type = 'general', location = 'unknown', maxLength } = context;

    // ⚡ RAG INJECTION: The ragContext is injected into the system prompt
    // This gives the AI knowledge about translation conventions and glossaries
    const systemPrompt = `You are a professional translator specializing in e-commerce localization.

${ragContext}

Guidelines:
- Preserve HTML tags, placeholders {{variables}}, and special characters
- Maintain the tone and formality of the original
- Use natural, idiomatic expressions
- Follow e-commerce terminology conventions
- Consider cultural adaptation where appropriate`;

    const userPrompt = `Translate from ${fromLang} to ${toLang}.

Context:
- Type: ${type} (button, heading, label, paragraph, description)
- Location: ${location} (cart, checkout, product, homepage)
${maxLength ? `- Max length: ${maxLength} characters` : ''}

Text to translate:
${text}

Return ONLY the translated text, no explanations or notes.`;

    try {
      // Use Anthropic SDK (same as AIService) - makes it consistent with AI Studio
      console.log(`      🌍 ANTHROPIC API CALL: Translating ${fromLang} → ${toLang}`);
      console.log(`      📝 Text to translate: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
      console.log(`      🤖 Model: claude-3-haiku-20240307`);

      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });

      const translatedText = response.content[0].text.trim();
      console.log(`      ✅ ANTHROPIC API RESPONSE received`);
      console.log(`      📤 Translated text: "${translatedText.substring(0, 100)}${translatedText.length > 100 ? '...' : ''}"`);
      console.log(`      📊 Tokens used: input=${response.usage.input_tokens}, output=${response.usage.output_tokens}`);

      // Extract translated text from response
      return translatedText;
    } catch (error) {
      // SDK handles errors properly, just re-throw with context
      console.error(`      ❌ ANTHROPIC API ERROR:`, error.message);
      throw new Error(`Anthropic translation failed: ${error.message}`);
    }
  }

  async _translateWithOpenAI(text, fromLang, toLang) {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translated text, no explanations:\n\n${text}`
        }],
        temperature: 0.3
      })
    });

    const data = await response.json();

    // Check for API errors
    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || `API request failed with status ${response.status}`;
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    return data.choices[0].message.content.trim();
  }

  /**
   * Get entity translation (Product, Category, CmsPage, CmsBlock)
   */
  async getEntityTranslation(entityType, entityId, languageCode) {
    const Model = this._getEntityModel(entityType);
    const entity = await Model.findByPk(entityId);

    if (!entity || !entity.translations) {
      return null;
    }

    return entity.translations[languageCode] || null;
  }

  /**
   * Save entity translation (uses normalized tables for most entities)
   */
  async saveEntityTranslation(entityType, entityId, languageCode, translationData) {
    // Products, Categories, Attributes, etc. use separate translation tables
    // Only CMS Pages/Blocks still use JSONB translations column

    if (entityType === 'product') {
      const { updateProductTranslations } = require('../utils/productHelpers');
      const translations = { [languageCode]: translationData };
      await updateProductTranslations(entityId, translations);
      const Product = this._getEntityModel(entityType);
      return await Product.findByPk(entityId);
    } else if (entityType === 'category') {
      const { updateCategoryWithTranslations } = require('../utils/categoryHelpers');
      const entity = await this._getEntityModel(entityType).findByPk(entityId);
      await updateCategoryWithTranslations(entityId, {}, { [languageCode]: translationData });
      return entity;
    } else if (entityType === 'attribute') {
      const { saveAttributeTranslations } = require('../utils/attributeHelpers');
      await saveAttributeTranslations(entityId, { [languageCode]: translationData });
      const Attribute = this._getEntityModel(entityType);
      return await Attribute.findByPk(entityId);
    }

    // For entities with JSONB translations column (cms_page, cms_block)
    const Model = this._getEntityModel(entityType);
    const entity = await Model.findByPk(entityId);

    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    const translations = entity.translations || {};
    translations[languageCode] = translationData;

    entity.translations = translations;
    entity.changed('translations', true); // Mark as changed for Sequelize
    await entity.save();

    return entity;
  }

  /**
   * Translate all fields of an entity using AI (with field-level merging)
   */
  async aiTranslateEntity(entityType, entityId, fromLang, toLang) {
    // Load entity with translations from appropriate source
    let entity;

    if (entityType === 'product') {
      const { applyAllProductTranslations } = require('../utils/productHelpers');
      const Model = this._getEntityModel(entityType);
      const productRaw = await Model.findByPk(entityId);
      if (!productRaw) throw new Error('Product not found');
      const [productWithTranslations] = await applyAllProductTranslations([productRaw]);
      entity = productWithTranslations;
    } else if (entityType === 'category') {
      const { getCategoriesWithAllTranslations } = require('../utils/categoryHelpers');
      const categories = await getCategoriesWithAllTranslations({ id: entityId });
      entity = categories[0];
      if (!entity) throw new Error('Category not found');
    } else if (entityType === 'attribute') {
      const { getAttributesWithTranslations } = require('../utils/attributeHelpers');
      const attributes = await getAttributesWithTranslations({ id: entityId });
      entity = attributes[0];
      if (!entity) throw new Error('Attribute not found');
    } else {
      // CMS pages/blocks use JSONB translations column
      const Model = this._getEntityModel(entityType);
      entity = await Model.findByPk(entityId);
      if (!entity) throw new Error(`${entityType} not found`);

      console.log(`   📦 Loaded ${entityType} from database:`, {
        id: entity.id,
        title: entity.title,
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
    return await this.saveEntityTranslation(entityType, entityId, toLang, translatedData);
  }

  /**
   * Get missing translations report
   */
  async getMissingTranslationsReport() {
    const languages = await Language.findAll({
      where: { is_active: true },
      attributes: ['code', 'name']
    });

    const defaultLang = languages.find(l => l.code === 'en') || languages[0];
    const uiLabels = await Translation.findAll({
      where: { language_code: defaultLang.code },
      attributes: ['key']
    });

    const report = {
      ui_labels: {},
      entities: {}
    };

    // Check UI labels
    for (const label of uiLabels) {
      for (const lang of languages) {
        if (lang.code === defaultLang.code) continue;

        const exists = await Translation.findOne({
          where: { key: label.key, language_code: lang.code }
        });

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
   * Helper to get entity model
   */
  _getEntityModel(entityType) {
    const models = {
      product: Product,
      category: Category,
      attribute: Attribute,
      cms_page: CmsPage,
      cms_block: CmsBlock
    };

    const Model = models[entityType.toLowerCase()];
    if (!Model) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    return Model;
  }
}

module.exports = new TranslationService();
