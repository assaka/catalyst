// backend/src/services/AIService.js
const ConnectionManager = require('./database/ConnectionManager');
const { masterDbClient } = require('../database/masterConnection');
const aiContextService = require('./aiContextService'); // RAG system
const aiProvider = require('./ai-provider-service'); // Unified AI provider
const ServiceCreditCost = require('../models/ServiceCreditCost');
const AIModel = require('../models/AIModel');
const aiModelsService = require('./AIModelsService'); // Centralized model config

/**
 * Centralized AI Service
 * Handles AI model interactions, credit management, and usage tracking
 * Integrates with RAG (Retrieval-Augmented Generation) for better context
 * Now uses unified AIProviderService for all provider management
 *
 * Model configurations are fetched from ai_models database table via AIModelsService
 */
class AIService {
  constructor() {
    // Map operation types to service keys in service_credit_costs table
    this.serviceKeyMap = {
      'plugin-generation': 'custom_plugin_creation',
      'plugin-modification': 'ai_code_patch',
      'translation': 'ai_translation',
      'layout-generation': 'ai_layout_generation',
      'code-patch': 'ai_code_patch',
      'general': 'ai_chat'
    };

    // Fallback costs for operation types (not model-specific)
    this.operationFallbackCosts = {
      'plugin-generation': 50,
      'plugin-modification': 30,
      'translation': 20,
      'layout-generation': 40,
      'code-patch': 25,
      'general': 10
    };

    // Initialize models service on first use
    this._initialized = false;
  }

  /**
   * Ensure AIModelsService is initialized
   */
  async _ensureInitialized() {
    if (!this._initialized) {
      await aiModelsService.initialize();
      this._initialized = true;
    }
  }

  /**
   * Get default model from database
   */
  async getDefaultModel() {
    await this._ensureInitialized();
    return await aiModelsService.getDefaultModel('anthropic');
  }

  /**
   * Get model configuration from model ID
   * Fetches from ai_models database table via AIModelsService
   */
  async getModelConfigFromDb(modelId) {
    await this._ensureInitialized();
    return await aiModelsService.getModelConfig(modelId);
  }

  /**
   * Get model configuration from model ID (sync version using cache)
   */
  getModelConfig(modelId) {
    return aiModelsService.getModelConfigSync(modelId);
  }

  /**
   * Get cost for an operation type from the service_credit_costs table
   * @param {string} operationType - Operation type (e.g., 'general', 'plugin-generation')
   * @param {string} serviceKey - Optional explicit service key (e.g., 'ai_chat_claude_sonnet')
   * @param {string} modelId - Optional model ID for model-specific pricing
   */
  async getOperationCost(operationType, serviceKey = null, modelId = null) {
    await this._ensureInitialized();

    // If explicit serviceKey is provided, use it directly
    let resolvedServiceKey = serviceKey;

    // If modelId is provided, get service key from database
    if (!resolvedServiceKey && modelId) {
      resolvedServiceKey = await aiModelsService.getServiceKey(modelId);
    }

    // Fall back to operation type service key
    if (!resolvedServiceKey) {
      resolvedServiceKey = this.serviceKeyMap[operationType];
    }

    if (!resolvedServiceKey) {
      console.warn(`⚠️ Unknown operation type: ${operationType}, using fallback cost`);
      const modelCost = modelId ? await aiModelsService.getFallbackCost(modelId) : null;
      return modelCost || this.operationFallbackCosts[operationType] || this.operationFallbackCosts.general;
    }

    try {
      const cost = await ServiceCreditCost.getCostByKey(resolvedServiceKey);
      console.log(`💰 Cost lookup: ${resolvedServiceKey} = ${cost} credits`);
      return parseFloat(cost);
    } catch (error) {
      console.warn(`⚠️ Could not fetch cost for ${resolvedServiceKey}, using fallback:`, error.message);
      const modelCost = modelId ? await aiModelsService.getFallbackCost(modelId) : null;
      return modelCost || this.operationFallbackCosts[operationType] || this.operationFallbackCosts.general;
    }
  }

  /**
   * Check if user has sufficient credits
   */
  async checkCredits(userId, operationType, serviceKey = null, modelId = null) {
    const cost = await this.getOperationCost(operationType, serviceKey, modelId);

    // Query master DB for user credits
    const { data: user, error } = await masterDbClient
      .from('users')
      .select('credits')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user || user.credits < cost) {
      return {
        hasCredits: false,
        required: cost,
        available: user?.credits || 0
      };
    }

    return {
      hasCredits: true,
      required: cost,
      available: user.credits
    };
  }

  /**
   * Deduct credits from user account
   */
  async deductCredits(userId, operationType, metadata = {}) {
    const cost = await this.getOperationCost(operationType, metadata.serviceKey, metadata.modelId);

    // Get store_id - try to get user's active store if not provided
    let storeId = metadata.storeId;
    if (!storeId) {
      // Get first active store owned by this user (not just any store in DB)
      const { data: store } = await masterDbClient
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      storeId = store?.id || '00000000-0000-0000-0000-000000000000'; // Fallback UUID
    }

    // Deduct credits from master DB - first get current credits, then update
    const { data: userData, error: fetchError } = await masterDbClient
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch user credits: ${fetchError.message}`);
    }

    const currentCredits = userData?.credits || 0;
    const newCredits = Math.max(0, currentCredits - cost);

    const { error: updateError } = await masterDbClient
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to deduct credits: ${updateError.message}`);
    }

    console.log(`💳 Credits deducted: ${cost} for ${operationType} (user: ${userId}, store: ${storeId})`);

    // Log credit usage to tenant DB
    if (storeId) {
      try {
        const tenantDb = await ConnectionManager.getStoreConnection(storeId);

        // Map operation types to usage_type values
        const usageTypeMap = {
          'plugin-generation': 'ai_plugin_generation',
          'plugin-modification': 'ai_plugin_modification',
          'translation': 'ai_translation',
          'layout-generation': 'ai_layout',
          'code-patch': 'ai_code_patch',
          'general': 'ai_chat'
        };
        const usageType = usageTypeMap[operationType] || 'other';

        const { error: insertError } = await tenantDb
          .from('credit_usage')
          .insert({
            id: require('uuid').v4(),
            user_id: userId,
            store_id: storeId,
            credits_used: cost,
            usage_type: usageType,
            description: `AI Studio: ${operationType}`,
            metadata: metadata,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.warn('Failed to log credit usage to tenant DB:', insertError.message);
          // Don't throw - logging failure shouldn't break the operation
        }
      } catch (connectionError) {
        console.warn('Failed to connect to tenant DB for credit logging:', connectionError.message);
        // Don't throw - logging failure shouldn't break the operation
      }
    }

    return cost;
  }

  /**
   * Log AI usage for analytics (tenant data)
   */
  async logUsage(userId, operationType, metadata = {}) {
    // Get storeId from metadata - don't fallback to first store (could be inactive)
    const storeId = metadata.storeId;

    if (!storeId) {
      console.warn('No storeId in metadata for AI usage logging, skipping tenant logging');
      return;
    }

    try {
      // Get tenant connection for AI usage logs
      const connection = await ConnectionManager.getStoreConnection(storeId);

      const { error } = await connection
        .from('ai_usage_logs')
        .insert({
          user_id: userId,
          operation_type: operationType,
          model_used: metadata.model || this.defaultModel,
          tokens_input: metadata.tokensInput || 0,
          tokens_output: metadata.tokensOutput || 0,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log AI usage:', error);
        // Don't throw - logging failure shouldn't break the operation
      }
    } catch (connectionError) {
      console.warn('Failed to connect to tenant DB for AI usage logging:', connectionError.message);
      // Don't throw - logging failure shouldn't break the operation
    }
  }

  /**
   * Generate AI response with credit deduction
   */
  async generate(options) {
    await this._ensureInitialized();

    // Get default model from database
    const defaultModel = await this.getDefaultModel();

    const {
      userId,
      operationType,
      prompt,
      systemPrompt = '',
      model = defaultModel,
      modelId = null, // User-selected model ID (e.g., 'claude-sonnet')
      serviceKey = null, // Explicit service key for cost lookup
      maxTokens = 4096,
      temperature = 0.7,
      metadata = {},
      images = null // Array of { base64, type } for vision support
    } = options;

    // Get model configuration if modelId provided (from database)
    const modelConfig = modelId ? await aiModelsService.getModelConfig(modelId) : null;
    const provider = modelConfig?.provider || 'anthropic';
    const actualModel = modelConfig?.model || model;

    console.log(`🤖 AI Generate: modelId=${modelId}, provider=${provider}, model=${actualModel}`);

    // Validate user has credits (with model-specific pricing)
    const creditCheck = await this.checkCredits(userId, operationType, serviceKey, modelId);
    console.log(`💳 Credit check: userId=${userId}, required=${creditCheck.required}, available=${creditCheck.available}, hasCredits=${creditCheck.hasCredits}`);

    if (!creditCheck.hasCredits) {
      console.log(`❌ Insufficient credits for user ${userId}. Required: ${creditCheck.required}, Available: ${creditCheck.available}`);
      throw new Error(
        `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`
      );
    }

    try {
      // Prepare messages
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];

      // Use unified AI provider service with selected model
      const response = await aiProvider.chat(messages, {
        provider,
        model: actualModel,
        maxTokens,
        temperature,
        systemPrompt,
        images // Pass images for vision support
      });

      // Extract response
      const content = response.content;
      const usage = {
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        model: response.model
      };

      // Deduct credits (with model-specific pricing)
      await this.deductCredits(userId, operationType, {
        ...metadata,
        ...usage,
        modelId,
        serviceKey
      });

      // Log usage
      await this.logUsage(userId, operationType, {
        ...metadata,
        ...usage,
        modelId,
        provider
      });

      const cost = await this.getOperationCost(operationType, serviceKey, modelId);

      return {
        success: true,
        content,
        usage,
        creditsDeducted: cost
      };

    } catch (error) {
      console.error('AI Generation Error:', error);

      // Log error but don't deduct credits
      await this.logUsage(userId, operationType, {
        ...metadata,
        error: error.message,
        failed: true
      });

      throw error;
    }
  }

  /**
   * Stream AI response with credit deduction
   */
  async *generateStream(options) {
    await this._ensureInitialized();

    // Get default model from database
    const defaultModel = await this.getDefaultModel();

    const {
      userId,
      operationType,
      prompt,
      systemPrompt = '',
      model = defaultModel,
      modelId = null,
      maxTokens = 4096,
      temperature = 0.7,
      metadata = {}
    } = options;

    // Get model configuration if modelId provided (from database)
    const modelConfig = modelId ? await aiModelsService.getModelConfig(modelId) : null;
    const provider = modelConfig?.provider || 'anthropic';
    const actualModel = modelConfig?.model || model;

    // Validate user has credits
    const creditCheck = await this.checkCredits(userId, operationType, null, modelId);
    if (!creditCheck.hasCredits) {
      throw new Error(
        `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`
      );
    }

    try {
      // Prepare messages
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];

      // Use unified AI provider service for streaming
      const stream = await aiProvider.streamWithThinking(messages, {
        model: actualModel,
        maxTokens,
        temperature,
        systemPrompt
      });

      let fullContent = '';
      let usage = {
        tokensInput: 0,
        tokensOutput: 0,
        model: actualModel
      };

      // Yield chunks as they arrive
      for await (const event of stream) {
        if (event.type === 'text') {
          fullContent += event.text;
          yield event.text;
        }

        if (event.type === 'done' && event.usage) {
          usage.tokensInput = event.usage.input_tokens;
          usage.tokensOutput = event.usage.output_tokens;
        }
      }

      // Deduct credits after stream completes
      await this.deductCredits(userId, operationType, {
        ...metadata,
        ...usage
      });

      // Log usage
      await this.logUsage(userId, operationType, {
        ...metadata,
        ...usage
      });

    } catch (error) {
      console.error('AI Stream Error:', error);

      await this.logUsage(userId, operationType, {
        ...metadata,
        error: error.message,
        failed: true
      });

      throw error;
    }
  }

  /**
   * Get user's remaining credits
   */
  async getRemainingCredits(userId) {
    const { data: user, error } = await masterDbClient
      .from('users')
      .select('credits')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch user credits:', error);
      return 0;
    }

    return user?.credits || 0;
  }


  /**
   * Get user's AI usage history (tenant data)
   */
  async getUserUsageHistory(userId, limit = 50, storeId = null) {
    // Get storeId if not provided
    if (!storeId) {
      const { data: store } = await masterDbClient
        .from('stores')
        .select('id')
        .limit(1)
        .maybeSingle();
      storeId = store?.id;
    }

    if (!storeId) {
      console.warn('No store found for AI usage history');
      return [];
    }

    // Get tenant connection for AI usage logs
    const connection = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await connection.client
      .from('ai_usage_logs')
      .select('operation_type, model_used, tokens_input, tokens_output, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch AI usage history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * ========================================
   * SPECIALIZED OPERATION METHODS
   * ========================================
   */

  /**
   * Generate plugin with RAG context
   * Uses existing plugin architecture knowledge from database
   */
  async generatePlugin(userId, prompt, metadata = {}) {
    // Fetch RAG context for plugin generation
    const ragContext = await aiContextService.getContextForQuery({
      mode: 'developer',
      category: metadata.category || 'general',
      query: prompt,
      storeId: metadata.storeId,
      limit: 13 // 5 docs + 3 examples + 5 patterns
    });

    const systemPrompt = `You are an expert plugin developer for the DainoStore e-commerce platform.

${ragContext || '# DainoStore Plugin Architecture\n\nPlugins are JavaScript classes that extend the base Plugin class with hooks, events, and controllers.'}

Generate a complete, production-ready plugin based on the user's description.

CRITICAL: Follow this EXACT structure for ALL plugins:

UNIFORM CODE STRUCTURE:
1. Always use ES6 class syntax
2. Always extend base Plugin class
3. Use consistent naming: camelCase for methods, PascalCase for classes
4. Include proper JSDoc comments
5. Use modern JavaScript (ES6+)
6. Include error handling
7. Use template literals for HTML
8. Escape user input to prevent XSS

CRITICAL: CATALYST USES DATABASE-DRIVEN PLUGIN SYSTEM!

REQUIRED DIRECTORY STRUCTURE:
\`\`\`
plugin-name/
├── manifest.json          # Plugin metadata (saved to plugin_registry.manifest)
├── README.md              # Documentation
└── src/
    ├── components/        # Reusable UI components (saved to plugin_scripts)
    │   └── AlertBox.js
    ├── services/          # Business logic modules (saved to plugin_scripts)
    │   └── AlertService.js
    ├── utils/             # Helper functions (saved to plugin_scripts)
    │   └── helpers.js
    ├── controllers/       # API controllers (saved to plugin_scripts)
    │   └── AlertController.js
    └── entities/          # Database models (saved to plugin_scripts)
        └── AlertConfig.js
\`\`\`

IMPORTANT: NO index.js!
- Hooks are stored as INLINE FUNCTIONS in plugin_hooks table
- Components are standalone modules in plugin_scripts table
- Registration is done through database tables, NOT through index.js

HOW THE SYSTEM WORKS:
1. Plugin metadata → plugin_registry.manifest (JSON)
2. Hook functions → plugin_hooks.handler_function (inline code)
3. Component files → plugin_scripts (one row per file)
4. Hooks can require() components: require('./components/AlertBox')
\`\`\`

HOOK STORAGE (Stored in plugin_hooks table as INLINE FUNCTIONS):

Hooks are NOT stored in files! They're stored as inline JavaScript code in plugin_hooks table.

Example hook (cart.processLoadedItems):
\`\`\`javascript
function(items, context) {
  // Load component if needed
  const AlertBox = require('./components/AlertBox');

  // Hook logic
  if (items.length === 0) {
    const html = AlertBox({ message: 'Your cart is empty!' });
    // Inject HTML into page
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // IMPORTANT: Hooks MUST return the value (they're filters)
  return items;
}
\`\`\`

THIS HOOK GETS STORED IN DATABASE:
- Table: plugin_hooks
- Column: handler_function (the inline code above)
- Column: hook_name ('cart.processLoadedItems')
- Column: plugin_id (UUID reference)
\`\`\`

COMPONENT EXAMPLE (components/AlertBox.jsx):
\`\`\`javascript
/**
 * AlertBox Component
 * Displays an alert message
 */
const AlertBox = ({ message, context }) => {
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return \`
    <div class="alert-box" style="padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 10px 0;">
      <strong>⚠️ Alert:</strong>
      <p style="margin: 5px 0 0 0;">\${escapeHtml(message)}</p>
    </div>
  \`;
};

module.exports = AlertBox;
\`\`\`

SERVICE EXAMPLE (services/AlertService.js):
\`\`\`javascript
/**
 * AlertService
 * Handles business logic for alerts
 */
class AlertService {
  constructor(config = {}) {
    this.config = config;
  }

  async createTables() {
    // Create database tables if needed
    console.log('Creating alert configuration table...');
  }

  async getAlertMessage() {
    // Fetch from database or return default
    return this.config.message || 'Default alert';
  }
}

module.exports = AlertService;
\`\`\`

EVENT EXAMPLE (events/onCartUpdate.js):
\`\`\`javascript
/**
 * Cart Update Event Handler
 */
const onCartUpdate = (eventData, config) => {
  console.log('Cart updated:', eventData);
  // Handle cart update logic
  if (eventData.total > 100) {
    // Trigger special alert for large orders
    console.log('Large order alert triggered');
  }
};

module.exports = onCartUpdate;
\`\`\`

RESPONSE FORMAT - Return ONLY valid JSON (no markdown, no explanations):
{
  "name": "Cart Alert Plugin",
  "slug": "cart-alert-plugin",
  "description": "Displays alerts in the shopping cart",
  "category": "commerce",
  "version": "1.0.0",
  "author": "AI Generated",
  "tags": ["cart", "alert", "notification", "ai-generated"],
  "features": ["Cart alerts", "Custom messages", "Configurable styling"],
  "generatedFiles": [
    {
      "name": "components/AlertBox.js",
      "code": "// AlertBox component - standalone module"
    },
    {
      "name": "services/AlertService.js",
      "code": "// AlertService - business logic"
    },
    {
      "name": "utils/helpers.js",
      "code": "// Utility functions (only if needed)"
    }
  ],
  "hooks": [
    {
      "name": "cart.processLoadedItems",
      "priority": 10,
      "code": "function(items, context) { /* Hook implementation */ return items; }"
    }
  ],
  "events": [
    {
      "name": "cart.viewed",
      "priority": 10,
      "code": "function(eventData, context) { /* Event handler */ }"
    }
  ],
  "config_schema": {
    "fields": [
      {
        "name": "message",
        "type": "text",
        "label": "Alert Message",
        "default": "Special offer available!"
      }
    ]
  },
  "manifest": {
    "name": "Cart Alert Plugin",
    "slug": "cart-alert-plugin",
    "version": "1.0.0",
    "hooks": ["cart.processLoadedItems"],
    "events": ["cart.viewed"],
    "adminNavigation": {
      "enabled": false,
      "label": "Cart Alert",
      "icon": "ShoppingCart",
      "route": "/admin/plugins/cart-alert",
      "order": 100,
      "parentKey": null,
      "category": "commerce",
      "description": "Manage cart alert messages"
    }
  },
  "explanation": "This plugin displays customizable alert messages in the shopping cart to inform customers about special offers or important information."
}

CRITICAL RULES:
1. ❌ NEVER create manifest.json in generatedFiles - it's auto-generated!
2. ❌ NEVER create README.md in generatedFiles - it's auto-generated!
3. ❌ NEVER create index.js - system is database-driven!
4. ✅ ONLY create components/, services/, utils/, controllers/, entities/ files
5. ✅ ALWAYS include hooks array with inline function code
6. ✅ ALWAYS include tags array with relevant keywords
7. ✅ ALWAYS include at least:
   - components/ (at least 1 component if UI needed)
   - services/ (business logic if complex)
   - utils/ (helper functions only if needed)
8. Each file in generatedFiles MUST be standalone module with module.exports
9. Hooks are inline functions stored in hooks array, NOT in files
10. Hooks can require('./components/AlertBox') to use components
11. Include JSDoc comments in all files
12. Include error handling in all hook functions
13. Use template literals for HTML in components
14. File paths MUST include subdirectories (e.g., "components/AlertBox.js")
15. Hooks MUST return values (they are filters, not void functions)
16. Components export a single function: module.exports = AlertBox;
17. If adminNavigation is needed, include full structure with: enabled, label, icon, route, order, parentKey, category, description

REMEMBER: generatedFiles should ONLY contain src/ directory files!
Example generatedFiles:
- ✅ "components/AlertBox.js"
- ✅ "services/AlertService.js"
- ✅ "utils/helpers.js"
- ❌ "manifest.json" (NEVER!)
- ❌ "README.md" (NEVER!)
- ❌ "index.js" (NEVER!)`;

    const result = await this.generate({
      userId,
      operationType: 'plugin-generation',
      modelId: metadata.modelId, // Use user-selected model if provided
      serviceKey: metadata.serviceKey,
      prompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.7,
      metadata
    });

    // Parse the JSON response
    try {
      let content = result.content;

      // Strategy 1: Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
      // Strategy 2: Try to extract JSON object (find first { and last matching })
      else {
        const firstBrace = content.indexOf('{');
        if (firstBrace !== -1) {
          // Find the matching closing brace
          let braceCount = 0;
          let lastBrace = firstBrace;

          for (let i = firstBrace; i < content.length; i++) {
            if (content[i] === '{') braceCount++;
            if (content[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastBrace = i;
                break;
              }
            }
          }

          content = content.substring(firstBrace, lastBrace + 1);
        }
      }

      const pluginData = JSON.parse(content);

      return {
        ...result,
        pluginData
      };
    } catch (error) {
      console.error('❌ JSON Parse Error:', error.message);
      console.error('📄 Full AI response:', result.content);
      console.error('📝 Extracted content:', content);
      console.error('🔍 Parse error at position:', error.message.match(/position (\d+)/)?.[1]);

      // Log the problematic area
      if (error.message.includes('position')) {
        const pos = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
        const start = Math.max(0, pos - 50);
        const end = Math.min(content.length, pos + 50);
        console.error('📍 Error context:', content.substring(start, end));
      }

      throw new Error(`Failed to parse plugin data: ${error.message}. Check Render logs for full response.`);
    }
  }

  /**
   * Save generated plugin to database (call this separately when user wants to create)
   */
  async savePluginToDatabase(pluginData, userId, metadata = {}) {
    try {
      const { randomUUID } = require('crypto');
      const pluginId = randomUUID();
      const slug = pluginData.slug || pluginData.name.toLowerCase().replace(/\s+/g, '-');

      // Validate userId is a proper UUID or null
      if (userId && typeof userId !== 'string') {
        throw new Error('Invalid userId format');
      }

      // Get storeId from metadata or use first store
      let storeId = metadata.storeId;
      if (!storeId) {
        const { data: store } = await masterDbClient
          .from('stores')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }

      if (!storeId) {
        throw new Error('No store found for plugin creation');
      }

      // Build clean manifest matching starter template structure EXACTLY
      const cleanManifest = {
        name: pluginData.name,
        tags: pluginData.tags || [
          pluginData.category || 'utility',
          'ai-generated'
        ],
        author: pluginData.author || 'AI Generated',
        version: pluginData.version || '1.0.0',
        category: pluginData.category || 'utility',
        homepage: pluginData.homepage || null,
        repository: pluginData.repository || null,
        description: pluginData.description || '',
        permissions: pluginData.permissions || [],
        adminNavigation: pluginData.manifest?.adminNavigation ? {
          icon: pluginData.manifest.adminNavigation.icon || 'Package',
          label: pluginData.manifest.adminNavigation.label || pluginData.name,
          order: pluginData.manifest.adminNavigation.order || 100,
          route: pluginData.manifest.adminNavigation.route || `/admin/plugins/${slug}`,
          enabled: pluginData.manifest.adminNavigation.enabled !== false,
          parentKey: pluginData.manifest.adminNavigation.parentKey || null,
          category: pluginData.manifest.adminNavigation.category || pluginData.category || 'utility',
          description: pluginData.manifest.adminNavigation.description || pluginData.description
        } : null
      };

      // Get tenant connection for plugin data
      const connection = await ConnectionManager.getStoreConnection(storeId);

      // Insert into plugin_registry (tenant DB)
      const { error: insertError } = await connection.client
        .from('plugin_registry')
        .insert({
          id: pluginId,
          name: pluginData.name,
          slug: slug,
          version: pluginData.version || '1.0.0',
          description: pluginData.description || '',
          author: pluginData.author || 'AI Generated',
          category: pluginData.category || 'utility',
          status: 'active',
          type: 'ai-generated',
          framework: 'react',
          manifest: cleanManifest,
          creator_id: userId || null,
          is_installed: true,
          is_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        throw new Error(`Failed to insert plugin: ${insertError.message}`);
      }

      console.log(`✅ Plugin saved to registry: ${pluginData.name} (${pluginId})`);
      console.log(`  📋 Manifest stored in plugin_registry.manifest column`);

      // Generate README.md content
      const readmeContent = `# ${pluginData.name}

${pluginData.description || 'AI-generated plugin for DainoStore e-commerce platform'}

## Features

${pluginData.features ? pluginData.features.map(f => `- ${f}`).join('\n') : '- Custom functionality'}

## Installation

This plugin was generated by AI and installed automatically.

## Configuration

${pluginData.config_schema?.fields ?
  'Configure this plugin in the admin panel:\n\n' +
  pluginData.config_schema.fields.map(f => `- **${f.label}**: ${f.type}`).join('\n')
  : 'No configuration required.'}

## Usage

${pluginData.explanation || 'This plugin is ready to use.'}

## Hooks

${pluginData.hooks && pluginData.hooks.length > 0 ?
  pluginData.hooks.map(h => `- \`${h.name || h}\``).join('\n')
  : 'No hooks registered.'}

## Version

- **Version**: ${pluginData.version || '1.0.0'}
- **Author**: ${pluginData.author || 'AI Generated'}
- **Category**: ${pluginData.category || 'utility'}
- **Generated**: ${new Date().toISOString()}

## Support

For issues or questions, please contact the platform administrator.
`;

      // Save README.md to plugin_docs (for file tree display)
      const { error: docsError } = await connection.client
        .from('plugin_docs')
        .insert({
          plugin_id: pluginId,
          doc_type: 'readme',
          file_name: 'README.md',
          content: readmeContent,
          format: 'markdown',
          is_visible: true,
          display_order: 1,
          title: pluginData.name,
          description: pluginData.description || ''
        });

      if (docsError) {
        console.warn('Failed to save README.md:', docsError);
      } else {
        console.log(`  📄 Saved README.md to plugin_docs`);
      }

      // Save generated files to plugin_scripts table with proper directory structure
      if (pluginData.generatedFiles && pluginData.generatedFiles.length > 0) {
        console.log(`  📦 Processing ${pluginData.generatedFiles.length} generated files...`);

        for (const file of pluginData.generatedFiles) {
          let fileName = file.name || file.filename || 'unknown.js';
          const fileContent = file.code || file.content || '';

          console.log(`  🔍 Checking file: ${fileName}`);

          // Skip if AI generated manifest.json or README.md (we create our own)
          const baseFileName = fileName.split('/').pop().toLowerCase();
          if (baseFileName === 'manifest.json' || baseFileName === 'readme.md') {
            console.log(`  ⏭️  SKIPPED ${fileName} (auto-generated by system)`);
            continue;
          }

          // Skip index.js if AI generated it (we don't use index.js)
          if (baseFileName === 'index.js' && !fileName.includes('components/')) {
            console.log(`  ⏭️  SKIPPED ${fileName} (database-driven system doesn't use index.js)`);
            continue;
          }

          // Ensure proper directory structure
          // If file doesn't have a path prefix, add 'src/'
          if (!fileName.includes('/') && !fileName.includes('\\')) {
            fileName = `src/${fileName}`;
          }

          if (fileContent) {
            const { error: scriptError } = await connection.client
              .from('plugin_scripts')
              .insert({
                plugin_id: pluginId,
                file_name: fileName,
                file_content: fileContent,
                script_type: 'js',
                scope: 'frontend',
                load_priority: 0,
                is_enabled: true
              });

            if (scriptError) {
              console.warn(`Failed to save script ${fileName}:`, scriptError);
            } else {
              console.log(`  📄 Saved script: ${fileName}`);
            }
          }
        }
      }

      // Save hooks to plugin_hooks table (from hooks array with inline code)
      const hooks = pluginData.hooks || [];
      if (hooks && hooks.length > 0) {
        for (const hook of hooks) {
          const hookName = hook.name || hook;
          const hookCode = hook.code || `function(value, context) { return value; }`;
          const priority = hook.priority || 10;

          const { error: hookError } = await connection.client
            .from('plugin_hooks')
            .insert({
              plugin_id: pluginId,
              hook_name: hookName,
              handler_function: hookCode,
              priority: priority,
              is_enabled: true
            });

          if (hookError) {
            console.warn(`Failed to register hook ${hookName}:`, hookError);
          } else {
            console.log(`  🪝 Registered hook: ${hookName}`);
          }
        }
      }

      // Save events to plugin_events table (from events array with inline code)
      const events = pluginData.events || [];
      if (events && events.length > 0) {
        for (const event of events) {
          const eventName = event.name || event;
          const eventCode = event.code || `function(eventData, context) { console.log('Event triggered'); }`;
          const priority = event.priority || 10;

          const { error: eventError } = await connection.client
            .from('plugin_events')
            .insert({
              plugin_id: pluginId,
              event_name: eventName,
              listener_function: eventCode,
              priority: priority,
              is_enabled: true
            });

          if (eventError) {
            console.warn(`Failed to register event ${eventName}:`, eventError);
          } else {
            console.log(`  📡 Registered event: ${eventName}`);
          }
        }
      }

      // Return plugin ID and slug
      return { pluginId, slug, storeId };
    } catch (error) {
      console.error('❌ Error saving plugin to database:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        userId,
        pluginName: pluginData.name
      });
      // Throw the error so the route handler can catch it
      throw new Error(`Failed to save plugin to database: ${error.message}`);
    }
  }

  /**
   * Modify existing plugin
   */
  async modifyPlugin(userId, prompt, existingCode, metadata = {}) {
    const systemPrompt = `You are an expert plugin developer. Modify the existing plugin code according to the user's request.

Existing Plugin Code:
\`\`\`javascript
${existingCode}
\`\`\`

Return the modified plugin in the same JSON format as plugin generation.`;

    const result = await this.generate({
      userId,
      operationType: 'plugin-modification',
      modelId: metadata.modelId, // Use user-selected model if provided
      serviceKey: metadata.serviceKey,
      prompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.7,
      metadata
    });

    try {
      let content = result.content;

      // Strategy 1: Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
      // Strategy 2: Try to extract JSON object (find first { and last matching })
      else {
        const firstBrace = content.indexOf('{');
        if (firstBrace !== -1) {
          // Find the matching closing brace
          let braceCount = 0;
          let lastBrace = firstBrace;

          for (let i = firstBrace; i < content.length; i++) {
            if (content[i] === '{') braceCount++;
            if (content[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastBrace = i;
                break;
              }
            }
          }

          content = content.substring(firstBrace, lastBrace + 1);
        }
      }

      const pluginData = JSON.parse(content);
      return {
        ...result,
        pluginData
      };
    } catch (error) {
      console.error('Failed to parse AI response:', result.content);
      throw new Error(`Failed to parse modified plugin data. AI returned: ${result.content.substring(0, 200)}...`);
    }
  }

  /**
   * Generate layout config
   */
  async generateLayout(userId, prompt, configType, metadata = {}) {
    const systemPrompt = `You are an expert frontend developer. Generate a ${configType} layout configuration.

Return a JSON object representing the layout config following the project's structure.`;

    return await this.generate({
      userId,
      operationType: 'layout-generation',
      prompt,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.7,
      metadata: { ...metadata, configType }
    });
  }

  /**
   * Translate content
   */
  async translateContent(userId, content, targetLanguages, metadata = {}) {
    const systemPrompt = 'You are an expert translator. Provide accurate, culturally appropriate translations.';
    const prompt = `Translate the following content to ${targetLanguages.join(', ')}:\n\n${content}`;

    return await this.generate({
      userId,
      operationType: 'translation',
      prompt,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.3,
      metadata: { ...metadata, targetLanguages }
    });
  }

  /**
   * Generate code patch (RFC 6902)
   */
  async generateCodePatch(userId, prompt, sourceCode, filePath, metadata = {}) {
    const systemPrompt = `You are an expert code editor. Generate RFC 6902 JSON patches for safe code modifications.

File: ${filePath}

Source Code:
\`\`\`javascript
${sourceCode}
\`\`\`

Generate a JSON patch that safely modifies the code according to the request.`;

    return await this.generate({
      userId,
      operationType: 'code-patch',
      prompt,
      systemPrompt,
      maxTokens: 2048,
      temperature: 0.5,
      metadata: { ...metadata, filePath }
    });
  }
}

module.exports = new AIService();
