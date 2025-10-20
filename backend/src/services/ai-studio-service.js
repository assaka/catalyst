const { Product, Category, CmsPage, CmsBlock, Language, Store } = require('../models');
const translationService = require('./translation-service');
const aiContextService = require('./aiContextService');
const aiPrompts = require('../config/ai-prompts');

class AIStudioService {
  constructor() {
    this.conversationHistory = new Map(); // In-memory storage (will move to DB later)
  }

  /**
   * Process AI chat message with context awareness
   */
  async processMessage({ message, context, history, capabilities, userId }) {
    // Build context-aware system prompt with RAG
    const systemPrompt = await this._buildSystemPrompt(context, capabilities, message);

    // Detect intent from message
    const intent = await this._detectIntent(message, context);

    // Route to appropriate handler
    let response;
    switch (intent.type) {
      case 'translate':
        response = await this._handleTranslation(message, intent, userId);
        break;
      case 'design':
        response = await this._handleDesign(message, intent, userId);
        break;
      case 'product':
        response = await this._handleProduct(message, intent, userId);
        break;
      case 'plugin':
        response = await this._handlePlugin(message, intent, userId);
        break;
      case 'storefront':
        response = await this._handleStorefront(message, intent, userId);
        break;
      default:
        response = await this._handleGeneral(message, history, systemPrompt);
    }

    // Store conversation
    this._addToHistory(userId, context, { role: 'user', content: message });
    this._addToHistory(userId, context, { role: 'assistant', content: response.message });

    return response;
  }

  /**
   * Build context-aware system prompt with RAG
   */
  async _buildSystemPrompt(context, capabilities, query = '') {
    // Fetch relevant context from database
    const ragContext = await aiContextService.getContextForQuery({
      mode: 'all',
      category: 'ai-studio',
      query: `${context} ${query}`,
      limit: 5
    });

    const basePrompt = aiPrompts.BASE_SYSTEM_PROMPT || 'You are Catalyst AI Studio, an intelligent e-commerce assistant.';
    const contextPrompt = aiPrompts.CONTEXT_PROMPTS?.[context] || '';

    return `${basePrompt}

${ragContext}

${contextPrompt}

Available capabilities:
${capabilities ? capabilities.map(c => `- ${c}`).join('\n') : 'General assistance'}`;
  }

  /**
   * Detect user intent from message
   */
  async _detectIntent(message, context) {
    const lowerMessage = message.toLowerCase();

    // Translation intents
    if (lowerMessage.includes('translate') || lowerMessage.includes('language') ||
        lowerMessage.includes('localize') || lowerMessage.includes('rtl')) {
      return { type: 'translate', action: this._parseTranslationIntent(message) };
    }

    // Design intents
    if (lowerMessage.includes('design') || lowerMessage.includes('theme') ||
        lowerMessage.includes('color') || lowerMessage.includes('layout')) {
      return { type: 'design', action: this._parseDesignIntent(message) };
    }

    // Product intents
    if (lowerMessage.includes('product') || lowerMessage.includes('catalog') ||
        lowerMessage.includes('inventory') || lowerMessage.includes('price')) {
      return { type: 'product', action: this._parseProductIntent(message) };
    }

    // Plugin intents
    if (lowerMessage.includes('plugin') || lowerMessage.includes('integration') ||
        lowerMessage.includes('payment') || lowerMessage.includes('shipping')) {
      return { type: 'plugin', action: this._parsePluginIntent(message) };
    }

    // Storefront intents
    if (lowerMessage.includes('storefront') || lowerMessage.includes('checkout') ||
        lowerMessage.includes('cart') || lowerMessage.includes('customer')) {
      return { type: 'storefront', action: this._parseStorefrontIntent(message) };
    }

    return { type: 'general', action: null };
  }

  /**
   * Handle translation requests
   */
  async _handleTranslation(message, intent, userId) {
    const action = intent.action;

    try {
      if (action.scope === 'all') {
        // Translate entire store
        const targetLanguages = action.languages;
        const results = {
          products: 0,
          categories: 0,
          pages: 0,
          blocks: 0,
          labels: 0
        };

        for (const lang of targetLanguages) {
          // Translate products
          const products = await Product.findAll({ attributes: ['id', 'translations'] });
          for (const product of products) {
            if (!product.translations[lang]) {
              await translationService.aiTranslateEntity('product', product.id, 'en', lang);
              results.products++;
            }
          }

          // Translate categories
          const categories = await Category.findAll({ attributes: ['id', 'translations'] });
          for (const category of categories) {
            if (!category.translations[lang]) {
              await translationService.aiTranslateEntity('category', category.id, 'en', lang);
              results.categories++;
            }
          }

          // Translate CMS pages
          const pages = await CmsPage.findAll({ attributes: ['id', 'translations'] });
          for (const page of pages) {
            if (!page.translations[lang]) {
              await translationService.aiTranslateEntity('cms_page', page.id, 'en', lang);
              results.pages++;
            }
          }

          // Translate CMS blocks
          const blocks = await CmsBlock.findAll({ attributes: ['id', 'translations'] });
          for (const block of blocks) {
            if (!block.translations[lang]) {
              await translationService.aiTranslateEntity('cms_block', block.id, 'en', lang);
              results.blocks++;
            }
          }
        }

        return {
          message: `Successfully translated your store to ${targetLanguages.join(', ')}!\n\n` +
                   `- ${results.products} products\n` +
                   `- ${results.categories} categories\n` +
                   `- ${results.pages} CMS pages\n` +
                   `- ${results.blocks} CMS blocks\n\n` +
                   `Your store is now multilingual! Customers can switch languages using the language selector.`,
          actions: [
            { type: 'refresh_data', target: 'translations' }
          ],
          data: results
        };
      } else if (action.scope === 'entity') {
        // Translate specific entity
        const result = await translationService.aiTranslateEntity(
          action.entityType,
          action.entityId,
          action.fromLang || 'en',
          action.toLang
        );

        return {
          message: `Successfully translated ${action.entityType} to ${action.toLang}!`,
          actions: [
            { type: 'refresh_entity', entityType: action.entityType, entityId: action.entityId }
          ],
          data: result
        };
      }
    } catch (error) {
      return {
        message: `Translation failed: ${error.message}. Please try again or check your AI API configuration.`,
        error: true
      };
    }
  }

  /**
   * Handle design requests
   */
  async _handleDesign(message, intent, userId) {
    // TODO: Implement design handling (colors, themes, layouts)
    return {
      message: `Design customization is coming soon! For now, you can:\n\n` +
               `- Edit theme settings in the Design section\n` +
               `- Customize colors and fonts\n` +
               `- Upload custom CSS\n\n` +
               `What specific design change would you like to make?`,
      actions: []
    };
  }

  /**
   * Handle product requests
   */
  async _handleProduct(message, intent, userId) {
    const action = intent.action;

    if (action.type === 'generate_descriptions') {
      // TODO: Generate AI product descriptions
      return {
        message: `AI product description generation is coming soon! This will help you create:\n\n` +
                 `- SEO-optimized product titles\n` +
                 `- Compelling product descriptions\n` +
                 `- Feature highlights\n` +
                 `- Benefit-focused copy`,
        actions: []
      };
    }

    return {
      message: `I can help you with products! What would you like to do?\n\n` +
               `- Add new products\n` +
               `- Update product information\n` +
               `- Manage inventory\n` +
               `- Organize categories`,
      actions: []
    };
  }

  /**
   * Handle plugin requests
   */
  async _handlePlugin(message, intent, userId) {
    return {
      message: `Plugin system is coming soon! You'll be able to:\n\n` +
               `- Install payment gateways (Stripe, PayPal, etc.)\n` +
               `- Add shipping integrations\n` +
               `- Connect marketing tools\n` +
               `- Extend store functionality\n\n` +
               `Stay tuned!`,
      actions: []
    };
  }

  /**
   * Handle storefront requests
   */
  async _handleStorefront(message, intent, userId) {
    return {
      message: `I can help optimize your storefront! Common improvements:\n\n` +
               `- Simplify checkout process\n` +
               `- Improve product discovery\n` +
               `- Optimize for mobile\n` +
               `- Add trust signals\n\n` +
               `What aspect would you like to improve?`,
      actions: []
    };
  }

  /**
   * Handle general queries
   */
  async _handleGeneral(message, history, systemPrompt) {
    // For general queries, provide helpful guidance
    return {
      message: `I'm here to help you build and manage your online store! I can assist with:\n\n` +
               `🌍 **Translations** - Translate your store to multiple languages\n` +
               `🎨 **Design** - Customize your store's appearance\n` +
               `📦 **Products** - Manage your catalog\n` +
               `🔌 **Plugins** - Extend functionality\n` +
               `🛒 **Storefront** - Optimize customer experience\n\n` +
               `What would you like to work on?`,
      actions: []
    };
  }

  /**
   * Parse translation intent details
   */
  _parseTranslationIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Use language codes from AI prompts config
    const languageMap = aiPrompts.LANGUAGE_CODES;

    const languages = [];
    for (const [name, code] of Object.entries(languageMap)) {
      if (lowerMessage.includes(name)) {
        languages.push(code);
      }
    }

    // Detect scope
    const scope = lowerMessage.includes('all') || lowerMessage.includes('everything') ||
                  lowerMessage.includes('entire') || lowerMessage.includes('whole')
      ? 'all'
      : 'entity';

    return {
      scope,
      languages: languages.length > 0 ? languages : ['es'], // Default to Spanish
      fromLang: 'en'
    };
  }

  /**
   * Parse design intent details
   */
  _parseDesignIntent(message) {
    return { type: 'general' };
  }

  /**
   * Parse product intent details
   */
  _parseProductIntent(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('description') || lowerMessage.includes('generate')) {
      return { type: 'generate_descriptions' };
    }

    return { type: 'general' };
  }

  /**
   * Parse plugin intent details
   */
  _parsePluginIntent(message) {
    return { type: 'general' };
  }

  /**
   * Parse storefront intent details
   */
  _parseStorefrontIntent(message) {
    return { type: 'general' };
  }

  /**
   * Execute AI-generated actions
   */
  async executeAction(action, params, userId) {
    switch (action) {
      case 'refresh_data':
        return { success: true, message: 'Data refreshed' };
      case 'refresh_entity':
        return { success: true, message: 'Entity refreshed' };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(userId, context, limit = 50) {
    const key = `${userId}:${context || 'general'}`;
    const history = this.conversationHistory.get(key) || [];
    return history.slice(-limit);
  }

  /**
   * Clear conversation history
   */
  async clearHistory(userId, context) {
    const key = `${userId}:${context || 'general'}`;
    this.conversationHistory.delete(key);
  }

  /**
   * Get context-aware suggestions
   */
  async getSuggestions(context) {
    return aiPrompts.EXAMPLE_PROMPTS[context] || aiPrompts.EXAMPLE_PROMPTS.general;
  }

  /**
   * Add message to history
   */
  _addToHistory(userId, context, message) {
    const key = `${userId}:${context || 'general'}`;

    if (!this.conversationHistory.has(key)) {
      this.conversationHistory.set(key, []);
    }

    const history = this.conversationHistory.get(key);
    history.push({
      ...message,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 messages
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }
}

module.exports = new AIStudioService();
