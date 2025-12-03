/**
 * AI Studio Service
 *
 * RAG INTEGRATION:
 * This service uses RAG (Retrieval-Augmented Generation) to enhance AI Studio
 * conversations with relevant context from the database.
 *
 * HOW RAG IS USED:
 * When processing user messages (_buildSystemPrompt), the service fetches:
 * - AI Studio capabilities (what the AI can do: design, products, storefront)
 * - Feature-specific guidelines (design best practices, product management)
 * - UI/UX patterns and recommendations
 *
 * WHY USE RAG:
 * - AI knows what features are available in DainoStore
 * - Better design suggestions based on best practices
 * - Consistent product management recommendations
 * - Up-to-date capabilities without code changes
 *
 * CONTEXTS:
 * - 'design' - Theme, color schemes, layouts
 * - 'product' - Product management, catalog, inventory
 * - 'storefront' - Homepage builder, navigation, pages
 * - 'translation' - Localization features
 * - 'plugin' - Plugin management
 *
 * See: backend/src/services/RAG_SYSTEM.md for full RAG documentation
 * See: backend/src/services/aiContextService.js for context fetching
 */

const ConnectionManager = require('./database/ConnectionManager');
const translationService = require('./translation-service');
const aiContextService = require('./aiContextService');
const aiPrompts = require('../config/ai-prompts');

class AIStudioService {
  constructor() {
    this.conversationHistory = new Map(); // In-memory storage (will move to DB later)

    // Slot name mappings for natural language to slot ID conversion
    // This allows users to say "sku" instead of "product_sku"
    this.slotNameMappings = {
      product: {
        // Direct matches
        'sku': 'product_sku',
        'product sku': 'product_sku',
        'price': 'price_container',
        'product price': 'product_price',
        'main price': 'product_price',
        'original price': 'original_price',
        'compare price': 'original_price',
        'title': 'product_title',
        'product title': 'product_title',
        'name': 'product_title',
        'product name': 'product_title',
        'description': 'product_short_description',
        'short description': 'product_short_description',
        'stock': 'stock_status',
        'stock status': 'stock_status',
        'availability': 'stock_status',
        'gallery': 'product_gallery_container',
        'images': 'product_gallery_container',
        'product images': 'product_gallery_container',
        'add to cart': 'add_to_cart_button',
        'cart button': 'add_to_cart_button',
        'buy button': 'add_to_cart_button',
        'wishlist': 'wishlist_button',
        'wishlist button': 'wishlist_button',
        'quantity': 'quantity_selector',
        'qty': 'quantity_selector',
        'tabs': 'product_tabs',
        'product tabs': 'product_tabs',
        'breadcrumbs': 'breadcrumbs',
        'related products': 'related_products_container',
        'related': 'related_products_container',
        'options': 'options_container',
        'custom options': 'custom_options',
        'configurable options': 'configurable_product_selector'
      },
      category: {
        'filters': 'filters_container',
        'filter': 'filters_container',
        'layered navigation': 'layered_navigation',
        'sidebar': 'filters_container',
        'products': 'products_container',
        'product grid': 'product_items',
        'grid': 'product_items',
        'sorting': 'sorting_controls',
        'sort': 'sort_selector',
        'pagination': 'pagination_container',
        'category title': 'category_title',
        'title': 'category_title',
        'description': 'category_description',
        'product card': 'product_card_template',
        'card': 'product_card_template'
      },
      header: {
        'logo': 'store_logo',
        'search': 'search_bar',
        'search bar': 'search_bar',
        'navigation': 'navigation_bar',
        'nav': 'navigation_bar',
        'menu': 'navigation_bar',
        'cart': 'cart_icon',
        'cart icon': 'cart_icon',
        'user menu': 'user_account_menu',
        'account': 'user_account_menu',
        'sign in': 'user_account_menu',
        'wishlist': 'desktop_wishlist',
        'mobile menu': 'mobile_menu'
      }
    };
  }

  /**
   * Resolve natural language slot name to actual slot ID
   * @param {string} name - Natural language slot name (e.g., "sku", "price")
   * @param {string} pageType - Page type context (product, category, header)
   * @returns {string|null} - Actual slot ID or null if not found
   */
  resolveSlotName(name, pageType = 'product') {
    if (!name) return null;

    const lowerName = name.toLowerCase().trim();

    // Check direct slot ID match first (e.g., user said "product_sku")
    if (lowerName.includes('_') || lowerName.includes('-')) {
      return lowerName.replace(/-/g, '_');
    }

    // Check page-specific mappings
    const pageMappings = this.slotNameMappings[pageType] || {};
    if (pageMappings[lowerName]) {
      return pageMappings[lowerName];
    }

    // Check all page mappings as fallback
    for (const [page, mappings] of Object.entries(this.slotNameMappings)) {
      if (mappings[lowerName]) {
        return mappings[lowerName];
      }
    }

    // Fuzzy match - check if any mapping contains the name
    for (const [page, mappings] of Object.entries(this.slotNameMappings)) {
      for (const [key, slotId] of Object.entries(mappings)) {
        if (key.includes(lowerName) || lowerName.includes(key)) {
          return slotId;
        }
      }
    }

    return null;
  }

  /**
   * Extract slot references from natural language message
   * @param {string} message - User message
   * @param {string} pageType - Page type context
   * @returns {Object} - { sourceSlot, targetSlot, position }
   */
  extractSlotReferences(message, pageType = 'product') {
    const lowerMessage = message.toLowerCase();

    // Patterns to detect slot references
    // "move X above/below/before/after Y"
    const movePattern = /(?:move|put|place)\s+(?:the\s+)?(.+?)\s+(?:above|before|on top of)\s+(?:the\s+)?(.+?)(?:\s|$|\.)/i;
    const moveAfterPattern = /(?:move|put|place)\s+(?:the\s+)?(.+?)\s+(?:below|after|under)\s+(?:the\s+)?(.+?)(?:\s|$|\.)/i;

    let sourceSlot = null;
    let targetSlot = null;
    let position = 'before'; // default

    let match = message.match(movePattern);
    if (match) {
      sourceSlot = this.resolveSlotName(match[1].trim(), pageType);
      targetSlot = this.resolveSlotName(match[2].trim(), pageType);
      position = 'before';
    } else {
      match = message.match(moveAfterPattern);
      if (match) {
        sourceSlot = this.resolveSlotName(match[1].trim(), pageType);
        targetSlot = this.resolveSlotName(match[2].trim(), pageType);
        position = 'after';
      }
    }

    return { sourceSlot, targetSlot, position };
  }

  /**
   * Process AI chat message with context awareness
   *
   * RAG USAGE:
   * Every message is processed with RAG context via _buildSystemPrompt().
   * The AI has knowledge about what DainoStore can do and how to help users.
   *
   * @param {Object} params - Message parameters
   * @param {string} params.message - User's message
   * @param {string} params.context - Current context ('design', 'product', 'storefront', etc.)
   * @param {Array} params.history - Conversation history
   * @param {Array} params.capabilities - Available AI capabilities
   * @param {number} params.userId - User ID
   * @param {string} params.storeId - Store ID
   *
   * @returns {Promise<Object>} Response with message and metadata
   */
  async processMessage({ message, context, history, capabilities, userId, storeId }) {
    // ⚡ RAG: Build context-aware system prompt with database knowledge
    const systemPrompt = await this._buildSystemPrompt(context, capabilities, message);

    // Detect intent from message
    const intent = await this._detectIntent(message, context);

    // Route to appropriate handler
    let response;
    switch (intent.type) {
      case 'translate':
        response = await this._handleTranslation(message, intent, userId, storeId);
        break;
      case 'layout':
        response = await this._handleLayout(message, intent, userId, storeId, context);
        break;
      case 'design':
        response = await this._handleDesign(message, intent, userId, storeId);
        break;
      case 'product':
        response = await this._handleProduct(message, intent, userId, storeId);
        break;
      case 'plugin':
        response = await this._handlePlugin(message, intent, userId, storeId);
        break;
      case 'storefront':
        response = await this._handleStorefront(message, intent, userId, storeId);
        break;
      default:
        response = await this._handleGeneral(message, history, systemPrompt);
    }

    // Store conversation
    this._addToHistory(userId, storeId, context, { role: 'user', content: message });
    this._addToHistory(userId, storeId, context, { role: 'assistant', content: response.message });

    return response;
  }

  /**
   * Build context-aware system prompt with RAG context
   *
   * RAG USAGE:
   * This method ALWAYS fetches AI Studio context from the database before
   * building the system prompt. The context includes:
   * - AI Studio capabilities (design, product management, storefront builder)
   * - Feature-specific guidelines and best practices
   * - UI/UX patterns and recommendations
   *
   * WHY THIS MATTERS:
   * - AI knows what DainoStore can actually do (no hallucination)
   * - Suggestions are based on documented best practices
   * - Features can be added/updated in database without code changes
   * - Consistent recommendations across all AI Studio contexts
   *
   * @param {string} context - Current AI Studio context ('design', 'product', 'storefront', etc.)
   * @param {Array} capabilities - Available AI capabilities in current context
   * @param {string} query - User's query (helps find relevant context)
   *
   * @returns {Promise<string>} Complete system prompt with RAG context
   *
   * PROMPT STRUCTURE:
   * 1. Base prompt (who the AI is)
   * 2. RAG context (capabilities, guidelines, patterns)
   * 3. Context-specific prompt (design/product/storefront specific)
   * 4. Available capabilities list
   *
   * @example
   * const prompt = await aiWorkspaceService._buildSystemPrompt(
   *   'design',
   *   ['Generate color schemes', 'Create layouts'],
   *   'help me design a modern homepage'
   * );
   */
  async _buildSystemPrompt(context, capabilities, query = '') {
    // ⚡ RAG: Fetch AI Studio context from database
    // This includes: capabilities documentation, best practices, UI patterns
    // Limit to 5 documents for conversational contexts
    const ragContext = await aiContextService.getContextForQuery({
      mode: 'all',                   // AI Studio serves all user types
      category: 'ai-studio',         // AI Studio specific context
      query: `${context} ${query}`,  // Current context + user query (future: vector search)
      limit: 5                       // Keep context focused for chat
    });

    const basePrompt = aiPrompts.BASE_SYSTEM_PROMPT || 'You are DainoStore AI Studio, an intelligent e-commerce assistant.';
    const contextPrompt = aiPrompts.CONTEXT_PROMPTS?.[context] || '';

    // ⚡ RAG INJECTION: Insert fetched context between base prompt and context prompt
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

    // Layout/Slot intents (for AI Workspace - must come before design)
    if (lowerMessage.includes('slot') || lowerMessage.includes('add slot') ||
        lowerMessage.includes('remove slot') || lowerMessage.includes('resize') ||
        lowerMessage.includes('add banner') || lowerMessage.includes('add section') ||
        lowerMessage.includes('move') || lowerMessage.includes('reorder') ||
        (lowerMessage.includes('layout') && (lowerMessage.includes('change') || lowerMessage.includes('modify')))) {
      return { type: 'layout', action: this._parseLayoutIntent(message) };
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
  async _handleTranslation(message, intent, userId, storeId) {
    const action = intent.action;

    try {
      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

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
          const { data: products } = await tenantDb
            .from('products')
            .select('id, translations')
            .eq('store_id', storeId);

          for (const product of (products || [])) {
            if (!product.translations[lang]) {
              await translationService.aiTranslateEntity('product', product.id, 'en', lang, storeId);
              results.products++;
            }
          }

          // Translate categories
          const { data: categories } = await tenantDb
            .from('categories')
            .select('id, translations')
            .eq('store_id', storeId);

          for (const category of (categories || [])) {
            if (!category.translations[lang]) {
              await translationService.aiTranslateEntity('category', category.id, 'en', lang, storeId);
              results.categories++;
            }
          }

          // Translate CMS pages
          const { data: pages } = await tenantDb
            .from('cms_pages')
            .select('id, translations')
            .eq('store_id', storeId);
          for (const page of pages) {
            if (!page.translations[lang]) {
              await translationService.aiTranslateEntity('cms_page', page.id, 'en', lang, storeId);
              results.pages++;
            }
          }

          // Translate CMS blocks
          const { data: blocks } = await tenantDb
            .from('cms_blocks')
            .select('id, translations')
            .eq('store_id', storeId);

          for (const block of (blocks || [])) {
            if (!block.translations[lang]) {
              await translationService.aiTranslateEntity('cms_block', block.id, 'en', lang, storeId);
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
          action.toLang,
          storeId
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
  async _handleDesign(message, intent, userId, storeId) {
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
  async _handleProduct(message, intent, userId, storeId) {
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
  async _handlePlugin(message, intent, userId, storeId) {
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
  async _handleStorefront(message, intent, userId, storeId) {
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
   * Handle layout/slot modification requests for AI Workspace
   * Generates slot commands that the frontend can execute
   */
  async _handleLayout(message, intent, userId, storeId, context) {
    const action = intent.action;

    // Build slot commands based on the parsed action
    const commands = [];

    switch (action.operation) {
      case 'add':
        commands.push({
          operation: 'add',
          pageType: context || 'product',
          targetSlot: {
            parentId: action.parentId || 'main_layout'
          },
          payload: {
            type: action.slotType || 'text',
            content: action.content || '',
            className: action.className || 'p-4',
            colSpan: action.colSpan || 12,
            rowSpan: action.rowSpan || 1,
            position: action.position || { col: 1, row: 1 },
            metadata: action.metadata || {}
          }
        });
        break;

      case 'modify':
        commands.push({
          operation: 'modify',
          pageType: context || 'product',
          targetSlot: {
            id: action.slotId
          },
          payload: {
            ...(action.content !== undefined && { content: action.content }),
            ...(action.className !== undefined && { className: action.className }),
            ...(action.styles !== undefined && { styles: action.styles }),
            ...(action.colSpan !== undefined && { colSpan: action.colSpan }),
            ...(action.rowSpan !== undefined && { rowSpan: action.rowSpan })
          }
        });
        break;

      case 'remove':
        commands.push({
          operation: 'remove',
          pageType: context || 'product',
          targetSlot: {
            id: action.slotId
          }
        });
        break;

      case 'resize':
        commands.push({
          operation: 'resize',
          pageType: context || 'product',
          targetSlot: {
            id: action.slotId
          },
          payload: {
            colSpan: action.colSpan,
            rowSpan: action.rowSpan
          }
        });
        break;

      case 'move':
        // Check if we need clarification
        if (action.needsClarification) {
          return {
            message: action.clarificationPrompt,
            actions: [],
            commands: [],
            needsClarification: true,
            suggestions: [
              'Move the SKU above the price',
              'Move stock status below description',
              'Move add to cart button to the top'
            ]
          };
        }

        commands.push({
          operation: 'move',
          pageType: context || 'product',
          targetSlot: {
            id: action.slotId
          },
          payload: {
            targetSlotId: action.targetSlotId, // The slot to move relative to
            targetContainerId: action.targetContainerId,
            position: action.position || 'before'
          }
        });
        break;

      case 'reorder':
        commands.push({
          operation: 'reorder',
          pageType: context || 'product',
          targetSlot: {
            id: action.slotId
          },
          payload: {
            newIndex: action.newIndex
          }
        });
        break;

      default:
        // Provide helpful guidance for unclear requests
        return {
          message: `I can help you modify the page layout! Here's what I can do:\n\n` +
                   `**Add elements:**\n` +
                   `- "Add a banner at the top"\n` +
                   `- "Add a text section"\n` +
                   `- "Add a new button"\n\n` +
                   `**Modify elements:**\n` +
                   `- "Make the header larger"\n` +
                   `- "Change the banner text to..."\n\n` +
                   `**Resize elements:**\n` +
                   `- "Make the sidebar narrower (4 columns)"\n` +
                   `- "Expand this section to full width"\n\n` +
                   `**Remove elements:**\n` +
                   `- "Remove the sidebar"\n` +
                   `- "Delete the promotional banner"\n\n` +
                   `What would you like to change?`,
          actions: [],
          commands: []
        };
    }

    // Generate human-readable response
    const positionWord = action.position === 'before' ? 'above' : 'below';
    const operationMessages = {
      add: `I'll add a new ${action.slotType || 'element'} to the page.`,
      modify: `I'll update the ${action.slotId || 'element'} with your changes.`,
      remove: `I'll remove ${action.slotId || 'that element'} from the page.`,
      resize: `I'll resize ${action.slotId || 'the element'} to ${action.colSpan || 12} columns.`,
      move: action.targetSlotId
        ? `I'll move **${action.slotId}** ${positionWord} **${action.targetSlotId}**.`
        : `I'll move ${action.slotId || 'the element'} to its new location.`,
      reorder: `I'll reorder ${action.slotId || 'the element'} to position ${action.newIndex}.`
    };

    return {
      message: operationMessages[action.operation] || 'Processing your layout change...',
      actions: [
        { type: 'execute_slot_commands', commands }
      ],
      commands,
      data: {
        operation: action.operation,
        affectedSlots: commands.map(c => c.targetSlot?.id || 'new_slot')
      }
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
   * Parse layout intent details for AI Workspace slot commands
   * Extracts operation type, target slot, and parameters from message
   */
  _parseLayoutIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Detect ADD operations
    if (lowerMessage.includes('add') || lowerMessage.includes('create') || lowerMessage.includes('insert')) {
      // Detect slot type
      let slotType = 'text';
      if (lowerMessage.includes('button')) slotType = 'button';
      else if (lowerMessage.includes('image') || lowerMessage.includes('picture')) slotType = 'image';
      else if (lowerMessage.includes('banner')) slotType = 'text';
      else if (lowerMessage.includes('section') || lowerMessage.includes('container')) slotType = 'container';
      else if (lowerMessage.includes('grid')) slotType = 'grid';
      else if (lowerMessage.includes('html') || lowerMessage.includes('code')) slotType = 'html';

      // Detect position hints
      let position = { col: 1, row: 1 };
      if (lowerMessage.includes('top') || lowerMessage.includes('beginning')) {
        position = { col: 1, row: 0 };
      } else if (lowerMessage.includes('bottom') || lowerMessage.includes('end')) {
        position = { col: 1, row: 999 }; // Will be adjusted by frontend
      }

      // Detect size hints
      let colSpan = 12;
      const colMatch = lowerMessage.match(/(\d+)\s*(column|col)/);
      if (colMatch) {
        colSpan = Math.min(12, Math.max(1, parseInt(colMatch[1])));
      } else if (lowerMessage.includes('half')) {
        colSpan = 6;
      } else if (lowerMessage.includes('third')) {
        colSpan = 4;
      } else if (lowerMessage.includes('quarter')) {
        colSpan = 3;
      }

      // Extract content if quoted
      const contentMatch = message.match(/["']([^"']+)["']/);
      const content = contentMatch ? contentMatch[1] : '';

      return {
        operation: 'add',
        slotType,
        content,
        colSpan,
        position,
        className: slotType === 'button' ? 'bg-blue-600 text-white px-4 py-2 rounded' : 'p-4'
      };
    }

    // Detect REMOVE operations
    if (lowerMessage.includes('remove') || lowerMessage.includes('delete') ||
        lowerMessage.includes('get rid of') || lowerMessage.includes('hide')) {
      // Try to extract slot identifier
      const slotMatch = message.match(/slot[_-]?(\w+)|#(\w+)|"([^"]+)"|'([^']+)'/i);
      const slotId = slotMatch ? (slotMatch[1] || slotMatch[2] || slotMatch[3] || slotMatch[4]) : null;

      return {
        operation: 'remove',
        slotId
      };
    }

    // Detect RESIZE operations
    if (lowerMessage.includes('resize') || lowerMessage.includes('wider') ||
        lowerMessage.includes('narrower') || lowerMessage.includes('expand') ||
        lowerMessage.includes('shrink') || lowerMessage.match(/(\d+)\s*(column|col)/)) {

      let colSpan = null;
      const colMatch = lowerMessage.match(/(\d+)\s*(column|col)/);
      if (colMatch) {
        colSpan = Math.min(12, Math.max(1, parseInt(colMatch[1])));
      } else if (lowerMessage.includes('full width') || lowerMessage.includes('expand')) {
        colSpan = 12;
      } else if (lowerMessage.includes('half')) {
        colSpan = 6;
      } else if (lowerMessage.includes('narrower') || lowerMessage.includes('smaller')) {
        colSpan = 4; // Default narrow
      }

      const slotMatch = message.match(/slot[_-]?(\w+)|#(\w+)|"([^"]+)"|'([^']+)'/i);
      const slotId = slotMatch ? (slotMatch[1] || slotMatch[2] || slotMatch[3] || slotMatch[4]) : null;

      return {
        operation: 'resize',
        slotId,
        colSpan
      };
    }

    // Detect MOVE operations - use smart slot reference extraction
    if (lowerMessage.includes('move') || lowerMessage.includes('relocate') ||
        lowerMessage.includes('put') || lowerMessage.includes('place')) {

      // Try to extract slot references using natural language processing
      const slotRefs = this.extractSlotReferences(message, 'product');

      if (slotRefs.sourceSlot && slotRefs.targetSlot) {
        // Successfully parsed "move X above/below Y" pattern
        return {
          operation: 'move',
          slotId: slotRefs.sourceSlot,
          targetSlotId: slotRefs.targetSlot,
          position: slotRefs.position
        };
      }

      // Fallback to old regex pattern for direct slot IDs
      const slotMatch = message.match(/slot[_-]?(\w+)|#(\w+)|"([^"]+)"|'([^']+)'/i);
      let slotId = slotMatch ? (slotMatch[1] || slotMatch[2] || slotMatch[3] || slotMatch[4]) : null;

      // Try to resolve slot name if regex didn't find slot ID format
      if (!slotId) {
        // Extract words that might be slot names
        const words = message.toLowerCase().split(/\s+/);
        for (const word of words) {
          const resolved = this.resolveSlotName(word, 'product');
          if (resolved) {
            slotId = resolved;
            break;
          }
        }
      }

      // Try to detect target
      let position = 'inside';
      if (lowerMessage.includes('before') || lowerMessage.includes('above')) {
        position = 'before';
      } else if (lowerMessage.includes('after') || lowerMessage.includes('below')) {
        position = 'after';
      }

      // If we couldn't identify slots, return with needsClarification flag
      if (!slotId) {
        return {
          operation: 'move',
          slotId: null,
          position,
          needsClarification: true,
          clarificationPrompt: 'I want to help you move elements, but I need more details. Which element would you like to move? For example:\n' +
            '- "Move the SKU above the price"\n' +
            '- "Move stock status below description"\n' +
            '- "Move add to cart button to the top"'
        };
      }

      return {
        operation: 'move',
        slotId,
        position
      };
    }

    // Detect REORDER operations
    if (lowerMessage.includes('reorder') || lowerMessage.includes('swap') ||
        lowerMessage.includes('first') || lowerMessage.includes('last')) {

      // Try to extract slot name from message
      let slotId = null;
      const slotMatch = message.match(/slot[_-]?(\w+)|#(\w+)|"([^"]+)"|'([^']+)'/i);
      if (slotMatch) {
        slotId = slotMatch[1] || slotMatch[2] || slotMatch[3] || slotMatch[4];
      } else {
        // Try natural language slot resolution
        const words = message.toLowerCase().split(/\s+/);
        for (const word of words) {
          const resolved = this.resolveSlotName(word, 'product');
          if (resolved) {
            slotId = resolved;
            break;
          }
        }
      }

      let newIndex = 0;
      if (lowerMessage.includes('last') || lowerMessage.includes('end')) {
        newIndex = 999; // Will be adjusted by frontend
      } else if (lowerMessage.includes('first') || lowerMessage.includes('beginning')) {
        newIndex = 0;
      }

      return {
        operation: 'reorder',
        slotId,
        newIndex
      };
    }

    // Detect MODIFY operations (default for layout context)
    const slotMatch = message.match(/slot[_-]?(\w+)|#(\w+)|"([^"]+)"|'([^']+)'/i);
    const slotId = slotMatch ? (slotMatch[1] || slotMatch[2] || slotMatch[3] || slotMatch[4]) : null;

    // Extract content if quoted
    const contentMatch = message.match(/(?:text|content|say|to)\s*["']([^"']+)["']/i);
    const content = contentMatch ? contentMatch[1] : undefined;

    return {
      operation: 'modify',
      slotId,
      content
    };
  }

  /**
   * Execute AI-generated actions
   */
  async executeAction(action, params, userId, storeId) {
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
  async getHistory(userId, storeId, context, limit = 50) {
    const key = `${userId}:${storeId}:${context || 'general'}`;
    const history = this.conversationHistory.get(key) || [];
    return history.slice(-limit);
  }

  /**
   * Clear conversation history
   */
  async clearHistory(userId, storeId, context) {
    const key = `${userId}:${storeId}:${context || 'general'}`;
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
  _addToHistory(userId, storeId, context, message) {
    const key = `${userId}:${storeId}:${context || 'general'}`;

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
