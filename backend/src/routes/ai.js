// backend/src/routes/ai.js
const express = require('express');
const router = express.Router();
const aiService = require('../services/AIService');
const aiEntityService = require('../services/aiEntityService');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * POST /api/ai/generate
 * Generate AI response with credit deduction
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const {
      operationType,
      prompt,
      systemPrompt,
      model,
      maxTokens,
      temperature,
      metadata
    } = req.body;

    const userId = req.user.id;

    if (!operationType || !prompt) {
      return res.status(400).json({
        success: false,
        message: 'operationType and prompt are required'
      });
    }

    // Generate AI response
    const result = await aiService.generate({
      userId,
      operationType,
      prompt,
      systemPrompt,
      model,
      maxTokens,
      temperature,
      metadata
    });

    // Get remaining credits
    const creditsRemaining = await aiService.getRemainingCredits(userId);

    res.json({
      success: true,
      content: result.content,
      usage: result.usage,
      creditsDeducted: result.creditsDeducted,
      creditsRemaining
    });

  } catch (error) {
    console.error('AI Generate Error:', error);

    // Handle insufficient credits error
    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: error.message,
        required: error.required,
        available: error.available
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'AI generation failed'
    });
  }
});

/**
 * POST /api/ai/generate/stream
 * Stream AI response with credit deduction
 */
router.post('/generate/stream', authMiddleware, async (req, res) => {
  try {
    const {
      operationType,
      prompt,
      systemPrompt,
      model,
      maxTokens,
      temperature,
      metadata
    } = req.body;

    const userId = req.user.id;

    if (!operationType || !prompt) {
      return res.status(400).json({
        success: false,
        message: 'operationType and prompt are required'
      });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream AI response
    const stream = aiService.generateStream({
      userId,
      operationType,
      prompt,
      systemPrompt,
      model,
      maxTokens,
      temperature,
      metadata
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    // Send completion and usage stats
    const creditsRemaining = await aiService.getRemainingCredits(userId);
    res.write(`data: ${JSON.stringify({
      usage: { creditsRemaining },
      done: true
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('AI Stream Error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || 'AI streaming failed'
      });
    }
  }
});

/**
 * GET /api/ai/cost/:operationType
 * Get cost for an operation type
 */
router.get('/cost/:operationType', authMiddleware, async (req, res) => {
  try {
    const { operationType } = req.params;
    const cost = aiService.getOperationCost(operationType);

    res.json({
      success: true,
      operationType,
      cost
    });
  } catch (error) {
    console.error('Error fetching cost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch operation cost'
    });
  }
});

/**
 * GET /api/ai/credits
 * Get user's remaining credits
 */
router.get('/credits', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await aiService.getRemainingCredits(userId);

    res.json({
      success: true,
      credits
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credits'
    });
  }
});

/**
 * POST /api/ai/check-credits
 * Check if user has sufficient credits for an operation
 */
router.post('/check-credits', authMiddleware, async (req, res) => {
  try {
    const { operationType } = req.body;
    const userId = req.user.id;

    if (!operationType) {
      return res.status(400).json({
        success: false,
        message: 'operationType is required'
      });
    }

    const result = await aiService.checkCredits(userId, operationType);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error checking credits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check credits'
    });
  }
});

/**
 * GET /api/ai/usage-history
 * Get user's AI usage history
 */
router.get('/usage-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const history = await aiService.getUserUsageHistory(userId, limit);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage history'
    });
  }
});

/**
 * ========================================
 * SPECIALIZED OPERATION ENDPOINTS
 * ========================================
 */

/**
 * POST /api/ai/plugin/generate
 * Generate a plugin with RAG context
 */
router.post('/plugin/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt, category, storeId } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'prompt is required'
      });
    }

    const result = await aiService.generatePlugin(userId, prompt, {
      category,
      storeId
    });

    res.json({
      success: true,
      plugin: result.pluginData,
      usage: result.usage,
      creditsDeducted: result.creditsDeducted
    });

  } catch (error) {
    console.error('Plugin Generation Error:', error);

    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Plugin generation failed'
    });
  }
});

/**
 * POST /api/ai/plugin/create
 * Save generated plugin to database (plugin_registry, plugin_scripts, plugin_hooks)
 */
router.post('/plugin/create', authMiddleware, async (req, res) => {
  try {
    const { pluginData } = req.body;

    // Debug logging
    console.log('🔍 Plugin Create Request:');
    console.log('  - req.user:', req.user);
    console.log('  - req.user?.id:', req.user?.id);
    console.log('  - pluginData.name:', pluginData?.name);

    const userId = req.user?.id;

    if (!pluginData) {
      return res.status(400).json({
        success: false,
        message: 'pluginData is required'
      });
    }

    if (!userId) {
      console.error('❌ User not authenticated - req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Please log in.',
        debug: {
          hasUser: !!req.user,
          userId: req.user?.id,
          userKeys: req.user ? Object.keys(req.user) : []
        }
      });
    }

    console.log(`✅ Creating plugin for user: ${userId}`);

    // Check if user has 50 credits for plugin creation
    const creditCheck = await aiService.checkCredits(userId, 'plugin-generation');
    if (!creditCheck.hasCredits) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`,
        required: creditCheck.required,
        available: creditCheck.available
      });
    }

    // Deduct 50 credits for plugin creation
    await aiService.deductCredits(userId, 'plugin-generation', {
      pluginName: pluginData.name,
      action: 'create-plugin'
    });

    console.log(`💰 Deducted 50 credits for plugin creation`);

    // Save plugin to database using aiService instance
    const result = await aiService.savePluginToDatabase(pluginData, userId);

    console.log(`✅ Plugin created:`, result);

    // Get remaining credits
    const creditsRemaining = await aiService.getRemainingCredits(userId);

    res.json({
      success: true,
      message: 'Plugin created successfully',
      pluginId: result.pluginId,
      plugin: {
        ...pluginData,
        id: result.pluginId,
        slug: result.slug
      },
      creditsDeducted: 50,
      creditsRemaining
    });

  } catch (error) {
    console.error('❌ Plugin Creation Error:', error);
    console.error('Error stack:', error.stack);

    // Return detailed error for debugging
    res.status(500).json({
      success: false,
      message: error.message || 'Plugin creation failed',
      error: error.message,
      details: {
        hasUser: !!req.user,
        userId: req.user?.id,
        errorType: error.name
      }
    });
  }
});

/**
 * POST /api/ai/plugin/modify
 * Modify an existing plugin
 */
router.post('/plugin/modify', authMiddleware, async (req, res) => {
  try {
    const { prompt, existingCode, pluginSlug } = req.body;
    const userId = req.user.id;

    if (!prompt || !existingCode) {
      return res.status(400).json({
        success: false,
        message: 'prompt and existingCode are required'
      });
    }

    const result = await aiService.modifyPlugin(userId, prompt, existingCode, {
      pluginSlug
    });

    res.json({
      success: true,
      plugin: result.pluginData,
      usage: result.usage,
      creditsDeducted: result.creditsDeducted
    });

  } catch (error) {
    console.error('Plugin Modification Error:', error);

    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Plugin modification failed'
    });
  }
});

/**
 * POST /api/ai/layout/generate
 * Generate layout config
 */
router.post('/layout/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt, configType } = req.body;
    const userId = req.user.id;

    if (!prompt || !configType) {
      return res.status(400).json({
        success: false,
        message: 'prompt and configType are required'
      });
    }

    const result = await aiService.generateLayout(userId, prompt, configType, {
      configType
    });

    res.json({
      success: true,
      config: result.content,
      usage: result.usage,
      creditsDeducted: result.creditsDeducted
    });

  } catch (error) {
    console.error('Layout Generation Error:', error);

    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Layout generation failed'
    });
  }
});

/**
 * POST /api/ai/translate
 * Translate content
 */
router.post('/translate', authMiddleware, async (req, res) => {
  try {
    const { content, targetLanguages } = req.body;
    const userId = req.user.id;

    if (!content || !targetLanguages || !Array.isArray(targetLanguages)) {
      return res.status(400).json({
        success: false,
        message: 'content and targetLanguages (array) are required'
      });
    }

    const result = await aiService.translateContent(userId, content, targetLanguages, {
      sourceLanguage: req.body.sourceLanguage || 'auto'
    });

    res.json({
      success: true,
      translations: result.content,
      usage: result.usage,
      creditsDeducted: result.creditsDeducted
    });

  } catch (error) {
    console.error('Translation Error:', error);

    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Translation failed'
    });
  }
});

/**
 * POST /api/ai/translate-entities
 * Translate entities (products, categories, CMS, etc.) using natural language
 * Example: "Translate all products to French and German"
 */
router.post('/translate-entities', authMiddleware, async (req, res) => {
  try {
    const { prompt, storeId } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'prompt is required'
      });
    }

    // Use AI to parse the prompt and determine what to translate
    const parseResult = await aiService.generate({
      userId,
      operationType: 'translation',
      prompt: `Parse this translation request and return a JSON object with:
{
  "entities": ["products", "categories", "cms_pages", etc.],
  "targetLanguages": ["fr", "de", "es", etc.],
  "filters": {any specific filters mentioned}
}

User request: ${prompt}`,
      systemPrompt: 'You are a translation assistant. Parse the user request and return ONLY valid JSON.',
      maxTokens: 512,
      temperature: 0.3,
      metadata: { type: 'parse-translation-request' }
    });

    let translationRequest;
    try {
      translationRequest = JSON.parse(parseResult.content);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Could not understand translation request. Please be more specific.'
      });
    }

    // TODO: Implement actual entity translation logic
    // This would:
    // 1. Fetch entities from database based on translationRequest.entities
    // 2. Translate each entity to translationRequest.targetLanguages
    // 3. Save translations back to database
    // 4. Return summary

    // For now, return mock result
    const details = translationRequest.entities.map(entityType => ({
      entityType: entityType.charAt(0).toUpperCase() + entityType.slice(1),
      count: 0, // TODO: Get actual count from database
      languages: translationRequest.targetLanguages
    }));

    res.json({
      success: true,
      data: {
        summary: `Translated ${translationRequest.entities.join(', ')} to ${translationRequest.targetLanguages.join(', ')}`,
        details,
        totalEntities: 0,
        totalTranslations: 0
      },
      creditsDeducted: parseResult.creditsDeducted
    });

  } catch (error) {
    console.error('Entity Translation Error:', error);

    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Entity translation failed'
    });
  }
});

/**
 * POST /api/ai/chat
 * Conversational AI interface - determines intent and executes
 * Like Bolt, Lovable, v0 - user chats naturally
 */
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory, storeId } = req.body;
    const userId = req.user.id;

    // Resolve store_id from various sources (header takes priority)
    const resolvedStoreId = req.headers['x-store-id'] || req.query.store_id || req.body.store_id || req.body.storeId;

    // Debug: Log ALL store_id sources at start of request
    console.log('🔍 AI Chat - Request started. Store ID sources:', {
      header: req.headers['x-store-id'],
      query: req.query.store_id,
      body_snake: req.body.store_id,
      body_camel: req.body.storeId,
      user_store_id: req.user?.store_id,
      resolved: resolvedStoreId
    });

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }

    // Check for confirmation BEFORE intent detection
    // This prevents "yes" from being classified as a new translation intent
    const isConfirmation = /^(yes|yeah|yep|sure|ok|okay|do it|update|apply|confirm|proceed|publish)/i.test(message.trim());

    if (isConfirmation && conversationHistory && conversationHistory.length > 0) {
      console.log('🔍 Confirmation detected, checking conversation history...');
      console.log('📝 History length:', conversationHistory.length);
      console.log('📝 Last 2 messages:', JSON.stringify(conversationHistory.slice(-2), null, 2));

      // Find the last assistant message with pending action (translation or styling)
      const lastAssistantMessage = [...conversationHistory]
        .reverse()
        .find(msg => msg.role === 'assistant' && (msg.data?.type === 'translation_preview' || msg.data?.type === 'styling_preview'));

      console.log('🤖 Found pending action?', !!lastAssistantMessage);
      console.log('🎯 Action type:', lastAssistantMessage?.data?.action);

      // Handle styling confirmation
      if (lastAssistantMessage?.data?.action === 'publish_styling') {
        const { configId, pageType, slotId, change } = lastAssistantMessage.data;
        const ConnectionManager = require('../services/database/ConnectionManager');

        if (!resolvedStoreId) {
          return res.status(400).json({
            success: false,
            message: 'store_id is required for publishing styling changes'
          });
        }

        const tenantDb = await ConnectionManager.getStoreConnection(resolvedStoreId);

        // Publish the draft configuration
        const { error: publishError } = await tenantDb
          .from('slot_configurations')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            published_by: userId,
            has_unpublished_changes: false
          })
          .eq('id', configId);

        if (publishError) {
          console.error('Failed to publish styling change:', publishError);
          return res.status(500).json({
            success: false,
            message: 'Failed to publish styling change: ' + publishError.message
          });
        }

        // Deactivate the old published version
        await tenantDb
          .from('slot_configurations')
          .update({ is_active: false })
          .eq('store_id', resolvedStoreId)
          .eq('page_type', pageType)
          .eq('status', 'published')
          .neq('id', configId);

        return res.json({
          success: true,
          message: `✅ Published! The ${change?.property || 'styling'} change for "${slotId}" on the ${pageType} page is now live.\n\nRefresh your storefront to see the changes.`,
          data: {
            type: 'styling_applied',
            configId,
            pageType,
            slotId
          },
          creditsDeducted: 0
        });
      }

      if (lastAssistantMessage?.data?.action === 'update_labels') {
        // User confirmed - update the translations
        const { translations, matchingKeys, original } = lastAssistantMessage.data;
        const ConnectionManager = require('../services/database/ConnectionManager');
        const store_id = req.headers['x-store-id'] || req.query.store_id || req.body.store_id || req.body.storeId;

        if (!store_id) {
          return res.status(400).json({
            success: false,
            message: 'store_id is required for updating translations'
          });
        }

        const tenantDb = await ConnectionManager.getStoreConnection(store_id);
        let updatedCount = 0;
        const updates = [];

        for (const [key, langData] of Object.entries(matchingKeys)) {
          for (const targetLang of Object.keys(translations)) {
            try {
              // Check if translation exists using Supabase
              const { data: existing, error: checkError } = await tenantDb
                .from('translations')
                .select('*')
                .eq('key', key)
                .eq('language_code', targetLang)
                .maybeSingle();

              if (existing) {
                // Update existing
                await tenantDb
                  .from('translations')
                  .update({ value: translations[targetLang], updated_at: new Date().toISOString() })
                  .eq('id', existing.id);
              } else {
                // Create new translation
                await tenantDb
                  .from('translations')
                  .insert({
                    key,
                    language_code: targetLang,
                    value: translations[targetLang],
                    category: 'common',
                    type: 'system',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });
              }
              updatedCount++;
              updates.push(`${key} (${targetLang}): ${translations[targetLang]}`);
            } catch (error) {
              console.error(`Failed to update ${key} for ${targetLang}:`, error);
            }
          }
        }

        return res.json({
          success: true,
          message: `✅ Updated ${updatedCount} translation(s)!\n\n${updates.join('\n')}\n\nThe changes are now live on your store. Refresh your pages to see the updates.`,
          data: {
            type: 'translation_applied',
            updatedCount,
            updates
          },
          creditsDeducted: 0 // No AI call needed for confirmation
        });
      }
    }

    // Determine intent from conversation
    const intentPrompt = `You are the AI for Catalyst, a SLOT-BASED e-commerce website builder.

CONTEXT: Pages are built from configurable SLOTS (components like product_sku, price_container, product_title).
Changes are made by updating slot configurations - NOT by editing HTML/CSS files.

User message: "${message}"

Previous conversation: ${JSON.stringify(conversationHistory?.slice(-3) || [])}

Classify the intent - users may request MULTIPLE actions in one message.

INTENTS:
- styling: Change appearance (colors, fonts, sizes) of existing slots
- layout_modify: Move/swap/reorder existing slots
- layout: Create entirely new page sections
- plugin: Add new interactive behavior/functionality
- translation: Translate text to other languages
- admin_entity: Configure store settings, products, coupons
- chat: General questions (use sparingly - prefer action intents)

IMPORTANT:
- "make sku red" = styling (not chat!)
- "move price above title" = layout_modify (not chat!)
- If user wants to change how something looks → styling
- If user wants to move/reorder things → layout_modify
- Only use "chat" for actual questions that don't involve changes

Respond with JSON:
{
  "intent": "styling|layout_modify|layout|plugin|translation|admin_entity|chat",
  "action": "modify|generate|chat",
  "details": {
    "pageType": "product|category|cart|checkout|homepage",
    "element": "slot name user referenced",
    "property": "what to change",
    "value": "new value"
  }
}

For multiple actions:
{
  "intents": [
    { "intent": "layout_modify", "details": { "action": "move", "sourceElement": "sku", "targetElement": "price", "position": "before" } },
    { "intent": "styling", "details": { "element": "sku", "property": "color", "value": "red" } }
  ]
}

Return ONLY valid JSON.`;

    // Track all AI conversations for transparency
    const globalAiConversations = [];

    const intentSystemPrompt = 'You are an intent classifier. Return ONLY valid JSON.';
    const intentResult = await aiService.generate({
      userId,
      operationType: 'general',
      prompt: intentPrompt,
      systemPrompt: intentSystemPrompt,
      maxTokens: 512,
      temperature: 0.3,
      metadata: { type: 'intent-detection', storeId: resolvedStoreId }
    });

    // Track intent detection conversation
    globalAiConversations.push({
      step: 'intent-detection',
      provider: 'anthropic',
      model: intentResult.usage?.model || 'claude-3-haiku',
      prompt: intentPrompt,
      systemPrompt: intentSystemPrompt,
      response: intentResult.content,
      tokens: intentResult.usage
    });

    let parsedIntent;
    try {
      const jsonMatch = intentResult.content.match(/\{[\s\S]*\}/);
      parsedIntent = JSON.parse(jsonMatch ? jsonMatch[0] : intentResult.content);
    } catch (error) {
      // Default to chat if can't parse
      parsedIntent = { intent: 'chat', action: 'chat' };
    }

    // Handle MULTIPLE intents if AI detected them
    if (parsedIntent.intents && Array.isArray(parsedIntent.intents) && parsedIntent.intents.length > 1) {
      console.log('[AI Chat] Detected MULTIPLE intents:', parsedIntent.intents.length);

      const results = [];
      let totalCredits = intentResult.creditsDeducted;
      const ConnectionManager = require('../services/database/ConnectionManager');

      if (!resolvedStoreId) {
        return res.status(400).json({
          success: false,
          message: 'store_id is required for multi-intent operations'
        });
      }

      const tenantDb = await ConnectionManager.getStoreConnection(resolvedStoreId);

      // Get the page type (use first intent that specifies it, default to 'product')
      const pageType = parsedIntent.intents.find(i => i.details?.pageType)?.details?.pageType || 'product';

      // Fetch current slot configuration once for all operations
      let { data: slotConfig, error: fetchError } = await tenantDb
        .from('slot_configurations')
        .select('*')
        .eq('store_id', resolvedStoreId)
        .eq('page_type', pageType)
        .eq('status', 'draft')
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!slotConfig && !fetchError) {
        const { data: publishedConfig } = await tenantDb
          .from('slot_configurations')
          .select('*')
          .eq('store_id', resolvedStoreId)
          .eq('page_type', pageType)
          .eq('status', 'published')
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle();
        slotConfig = publishedConfig;
      }

      if (!slotConfig) {
        return res.json({
          success: true,
          message: `I couldn't find a layout configuration for the ${pageType} page. Please save a layout in the Editor first.`,
          data: { type: 'multi_intent_error', reason: 'no_config_found' },
          creditsDeducted: totalCredits
        });
      }

      // Work with a copy of the configuration
      let workingConfig = JSON.parse(JSON.stringify(slotConfig.configuration || {}));
      let slots = workingConfig.slots || {};

      console.log('[AI Chat Multi] Slots count:', Object.keys(slots).length);

      // Auto-recover empty slots from default config
      if (Object.keys(slots).length === 0) {
        console.log('[AI Chat Multi] Empty slots, attempting auto-recovery...');
        try {
          const path = require('path');
          const configsDir = path.resolve(__dirname, '../../../src/components/editor/slot/configs');
          const configMap = {
            'product': { file: 'product-config.js', export: 'productConfig' },
            'category': { file: 'category-config.js', export: 'categoryConfig' },
            'cart': { file: 'cart-config.js', export: 'cartConfig' },
            'checkout': { file: 'checkout-config.js', export: 'checkoutConfig' },
            'header': { file: 'header-config.js', export: 'headerConfig' }
          };

          const configInfo = configMap[pageType] || { file: `${pageType}-config.js`, export: `${pageType}Config` };
          const configPath = path.join(configsDir, configInfo.file);
          const configModule = await import(configPath);
          const defaultConfig = configModule[configInfo.export];

          if (defaultConfig?.slots) {
            console.log(`[AI Chat Multi] Loaded ${Object.keys(defaultConfig.slots).length} slots from ${configInfo.file}`);
            slots = defaultConfig.slots;
            workingConfig.slots = slots;

            // Save recovered slots to database
            await tenantDb
              .from('slot_configurations')
              .update({ configuration: workingConfig, updated_at: new Date().toISOString() })
              .eq('id', slotConfig.id);
          }
        } catch (err) {
          console.error('[AI Chat Multi] Auto-recovery failed:', err.message);
        }
      }

      console.log('[AI Chat Multi] Available slots:', Object.keys(slots).slice(0, 10));

      // Get list of available slot names for AI
      const availableSlots = Object.keys(slots);
      console.log('[AI Chat Multi] Available slots:', availableSlots);

      // AI-driven slot resolution - let AI figure out what user means
      const resolveSlotIdWithAI = async (userTerm) => {
        if (!userTerm) return null;
        const lower = userTerm.toLowerCase().trim();

        // 1. Direct match first (exact or with underscores)
        if (slots[userTerm]) return userTerm;
        if (slots[lower]) return lower;
        if (slots[lower.replace(/\s+/g, '_')]) return lower.replace(/\s+/g, '_');

        // 2. Simple contains match
        for (const slotId of availableSlots) {
          if (slotId.toLowerCase().includes(lower) || lower.includes(slotId.toLowerCase().replace(/_/g, ''))) {
            return slotId;
          }
        }

        // 3. AI-driven matching for ambiguous terms
        console.log(`[AI Chat Multi] Using AI to resolve "${userTerm}" from slots:`, availableSlots.slice(0, 15));
        const matchPrompt = `Available slots: ${availableSlots.join(', ')}

User said: "${userTerm}"

Which slot matches? Reply with JUST the slot ID, nothing else. If no match, reply "none".`;

        try {
          const matchResult = await aiService.generate({
            userId,
            operationType: 'general',
            prompt: matchPrompt,
            systemPrompt: 'Reply with only the matching slot ID. Nothing else.',
            maxTokens: 30,
            temperature: 0,
            metadata: { type: 'slot-matching', storeId: resolvedStoreId }
          });
          totalCredits += matchResult.creditsDeducted;

          const matched = matchResult.content.trim().toLowerCase();
          console.log(`[AI Chat Multi] AI matched "${userTerm}" to:`, matched);

          // Find the actual slot ID (case-insensitive)
          const actualSlot = availableSlots.find(s => s.toLowerCase() === matched);
          if (actualSlot && slots[actualSlot]) return actualSlot;
        } catch (e) {
          console.error('[AI Chat Multi] AI slot matching failed:', e.message);
        }

        return null;
      };

      // Sync wrapper for simple cases, async for AI
      const resolveSlotId = (name) => {
        if (!name) return null;
        const lower = name.toLowerCase().trim();

        // Quick direct matches
        if (slots[name]) return name;
        if (slots[lower]) return lower;
        if (slots[lower.replace(/\s+/g, '_')]) return lower.replace(/\s+/g, '_');

        // Simple contains
        for (const slotId of availableSlots) {
          if (slotId.toLowerCase().includes(lower) || lower.includes(slotId.toLowerCase().replace(/_/g, ''))) {
            return slotId;
          }
        }

        return null; // Will use AI fallback
      };

      // Get friendly name for slot
      const getFriendlyName = (slotId) => {
        const slot = slots[slotId];
        return slot?.metadata?.displayName || slotId.replace(/_/g, ' ');
      };

      // Find suggestions for unmatched element
      const getSuggestions = (name) => {
        if (!name) return [];
        const lower = name.toLowerCase();
        return availableSlots
          .filter(s => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase().replace(/_/g, '')))
          .slice(0, 3)
          .map(s => getFriendlyName(s));
      };

      // Process each intent
      for (const singleIntent of parsedIntent.intents) {
        console.log('[AI Chat] Processing multi-intent:', singleIntent.intent, singleIntent.details);
        let subResult = { success: false, message: '', data: null };

        try {
          // Handle layout_modify intent
          if (singleIntent.intent === 'layout_modify') {
            const sourceElement = singleIntent.details?.sourceElement;
            const targetElement = singleIntent.details?.targetElement;
            const position = singleIntent.details?.position || 'before';

            // Use AI-driven resolution for both elements
            const sourceSlotId = resolveSlotId(sourceElement) || await resolveSlotIdWithAI(sourceElement);
            const targetSlotId = resolveSlotId(targetElement) || await resolveSlotIdWithAI(targetElement);

            if (sourceSlotId && targetSlotId && slots[sourceSlotId] && slots[targetSlotId]) {
              const sourceSlot = slots[sourceSlotId];
              const targetSlot = slots[targetSlotId];

              if (sourceSlot.parentId === targetSlot.parentId) {
                // Get siblings and reorder
                const parentId = sourceSlot.parentId;
                const siblingSlots = Object.entries(slots)
                  .filter(([id, slot]) => slot.parentId === parentId)
                  .sort((a, b) => (a[1].position?.row ?? 999) - (b[1].position?.row ?? 999));

                const currentOrder = siblingSlots.map(([id]) => id);
                const sourceIndex = currentOrder.indexOf(sourceSlotId);
                const targetIndex = currentOrder.indexOf(targetSlotId);

                if (sourceIndex !== -1 && targetIndex !== -1) {
                  currentOrder.splice(sourceIndex, 1);
                  let newTargetIndex = currentOrder.indexOf(targetSlotId);
                  if (position === 'after') newTargetIndex += 1;
                  currentOrder.splice(newTargetIndex, 0, sourceSlotId);

                  // Update row positions
                  currentOrder.forEach((slotId, index) => {
                    if (slots[slotId] && slots[slotId].position) {
                      slots[slotId].position.row = index + 1;
                    }
                  });

                  subResult = {
                    success: true,
                    message: `Moved ${sourceElement} ${position} ${targetElement}`,
                    data: { type: 'layout_modify', action: 'move', source: sourceSlotId, target: targetSlotId }
                  };
                }
              } else {
                subResult = {
                  success: false,
                  message: `I can't move ${sourceElement} next to ${targetElement} because they're in different sections.`,
                  needsClarification: true,
                  element: sourceElement
                };
              }
            } else {
              // Find which element(s) couldn't be found
              const notFound = [];
              if (!sourceSlotId || !slots[sourceSlotId]) notFound.push({ name: sourceElement, suggestions: getSuggestions(sourceElement) });
              if (!targetSlotId || !slots[targetSlotId]) notFound.push({ name: targetElement, suggestions: getSuggestions(targetElement) });

              subResult = {
                success: false,
                notFound,
                needsClarification: true
              };
            }
          }
          // Handle styling intent
          else if (singleIntent.intent === 'styling') {
            const element = singleIntent.details?.element;
            let property = singleIntent.details?.property || '';
            let value = singleIntent.details?.value || '';

            console.log('[AI Chat Multi] Styling intent:', { element, property, value });

            // Smart detection: if value looks like a color and no property, assume color
            const colorNames = ['red', 'blue', 'green', 'orange', 'yellow', 'purple', 'pink', 'gray', 'black', 'white'];
            if (!property && value && colorNames.includes(value.toLowerCase())) {
              property = 'color';
            }
            // If property is the color name, swap them
            if (colorNames.includes(property?.toLowerCase()) && !value) {
              value = property;
              property = 'color';
            }

            // Use AI-driven resolution for element
            const targetSlotId = resolveSlotId(element) || await resolveSlotIdWithAI(element);
            console.log('[AI Chat Multi] Resolved slot:', targetSlotId, 'from element:', element);

            if (targetSlotId && slots[targetSlotId]) {
              const slot = slots[targetSlotId];
              const propLower = property?.toLowerCase() || 'color'; // Default to color
              const friendlyName = getFriendlyName(targetSlotId);

              // Initialize styles if needed
              if (!slot.styles) slot.styles = {};

              // Handle color properties
              if (propLower.includes('color') && !propLower.includes('background')) {
                const colorValue = value?.toLowerCase().replace(/\s+/g, '');
                if (colorValue) {
                  const tailwindColors = {
                    'red': 'text-red-500', 'blue': 'text-blue-500', 'green': 'text-green-500',
                    'orange': 'text-orange-500', 'yellow': 'text-yellow-500', 'purple': 'text-purple-500',
                    'pink': 'text-pink-500', 'gray': 'text-gray-500', 'black': 'text-black', 'white': 'text-white'
                  };
                  const tailwindClass = tailwindColors[colorValue];
                  if (tailwindClass) {
                    const existingClasses = (slot.className || '').split(' ');
                    const filteredClasses = existingClasses.filter(c => !c.match(/^text-(red|blue|green|orange|yellow|purple|pink|gray|black|white)(-\d+)?$/));
                    slot.className = [...filteredClasses, tailwindClass].join(' ').trim();
                    console.log('[AI Chat Multi] Applied tailwind class:', tailwindClass);
                  } else {
                    slot.styles.color = value;
                  }
                  subResult = { success: true, message: `${friendlyName} is now ${value}`, data: { type: 'styling', element: targetSlotId, property: 'color', value } };
                } else {
                  subResult = { success: false, message: `No color value specified for ${element}`, needsClarification: true };
                }
              } else if (propLower.includes('background')) {
                slot.styles.backgroundColor = value;
                subResult = { success: true, message: `Changed ${friendlyName} background to ${value}`, data: { type: 'styling', element: targetSlotId, property: 'backgroundColor', value } };
              } else if (propLower.includes('size') || propLower.includes('font')) {
                slot.styles.fontSize = value;
                subResult = { success: true, message: `Changed ${friendlyName} font size to ${value}`, data: { type: 'styling', element: targetSlotId, property: 'fontSize', value } };
              } else {
                slot.styles[property] = value;
                subResult = { success: true, message: `Updated ${friendlyName} ${property} to ${value}`, data: { type: 'styling', element: targetSlotId, property, value } };
              }
            } else {
              const suggestions = getSuggestions(element);
              subResult = {
                success: false,
                notFound: [{ name: element, suggestions }],
                needsClarification: true
              };
            }
          }
          // Other intents
          else {
            subResult = { success: false, message: `I'll need to handle "${singleIntent.intent}" separately.`, data: null };
          }

          results.push(subResult);
        } catch (err) {
          console.error('[AI Chat] Error processing sub-intent:', err);
          results.push({ success: false, message: `Something went wrong with that change.`, error: err.message });
        }
      }

      // Update configuration with successful changes
      const successfulChanges = results.filter(r => r.success);
      if (successfulChanges.length > 0) {
        workingConfig.slots = slots;
        workingConfig.metadata = {
          ...workingConfig.metadata,
          lastModified: new Date().toISOString(),
          lastModifiedBy: 'AI Assistant',
          lastChanges: successfulChanges.map(r => r.message)
        };

        const { error: updateError } = await tenantDb
          .from('slot_configurations')
          .update({
            configuration: workingConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', slotConfig.id);

        if (updateError) {
          console.error('[AI Chat] Failed to save multi-intent changes:', updateError);
        }
      }

      // Let AI generate varied, natural response
      const successCount = successfulChanges.length;
      const needsClarification = results.filter(r => r.needsClarification);
      const allNotFound = needsClarification.flatMap(r => r.notFound || []);

      // Build context for AI
      const whatWasDone = successfulChanges.map(r => r.message).join('; ');
      const whatFailed = allNotFound.map(nf =>
        `couldn't find "${nf.name}"${nf.suggestions?.length ? ` (maybe ${nf.suggestions[0]}?)` : ''}`
      ).join('; ');

      const responsePrompt = `Changes made: ${whatWasDone || 'none'}
${whatFailed ? `Failed: ${whatFailed}` : ''}

Confirm in 1 sentence. MUST mention the specific changes (e.g. "sku above title", "title green").
Keep it casual. No "Great/I've/Let me know/Feel free".`;

      const responseResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: responsePrompt,
        systemPrompt: 'Mention the SPECIFIC changes made. One casual sentence.',
        maxTokens: 40,
        temperature: 0.8,
        metadata: { type: 'response', storeId: resolvedStoreId }
      });
      totalCredits += responseResult.creditsDeducted;

      return res.json({
        success: successCount > 0,
        message: responseResult.content,
        data: {
          type: 'multi_intent',
          intents: parsedIntent.intents,
          results: results,
          successCount,
          needsClarification: needsClarification.length
        },
        creditsDeducted: totalCredits
      });
    }

    // Single intent processing (existing behavior)
    const intent = parsedIntent;
    console.log('[AI Chat] Detected intent:', JSON.stringify(intent));
    console.log('[AI Chat] Store ID:', resolvedStoreId);

    // Execute based on intent
    let responseData = null;
    let creditsUsed = intentResult.creditsDeducted;

    if (intent.intent === 'plugin' && intent.action === 'generate') {
      // Check if this is a confirmed plugin generation request
      const isConfirmed = req.body.confirmedPlugin === true;

      if (!isConfirmed) {
        // Return confirmation request - let AI generate the confirmation message
        const confirmPrompt = `User wants: "${message}"
This requires generating a plugin which costs credits.
Generate a brief, friendly message asking if they want to proceed. Mention it will create custom functionality for their store.`;

        const confirmResult = await aiService.generate({
          userId,
          operationType: 'general',
          prompt: confirmPrompt,
          systemPrompt: 'Be brief and helpful. Ask for confirmation to generate a plugin. No markdown, no emojis.',
          maxTokens: 100,
          temperature: 0.7,
          metadata: { type: 'plugin-confirmation', storeId }
        });
        creditsUsed += confirmResult.creditsDeducted;

        return res.json({
          success: true,
          message: confirmResult.content,
          data: {
            type: 'plugin_confirmation',
            prompt: message,
            category: intent.details?.category || 'general'
          },
          creditsDeducted: creditsUsed
        });
      }

      // Generate plugin (confirmed)
      const pluginResult = await aiService.generatePlugin(userId, message, {
        category: intent.details?.category || 'general',
        storeId
      });

      responseData = {
        type: 'plugin',
        plugin: pluginResult.pluginData
      };
      creditsUsed += pluginResult.creditsDeducted;

      res.json({
        success: true,
        message: `I've created a plugin for you! Here's what it does:\n\n${pluginResult.pluginData.explanation || pluginResult.pluginData.description}`,
        data: responseData,
        creditsDeducted: creditsUsed
      });

    } else if (intent.intent === 'translation') {
      // AI-DRIVEN TRANSLATION HANDLER
      const ConnectionManager = require('../services/database/ConnectionManager');
      const translationService = require('../services/translation-service');

      // Debug: Log all store_id sources
      console.log('🔍 AI Chat Translation - Store ID sources:', {
        header: req.headers['x-store-id'],
        query: req.query.store_id,
        body_snake: req.body.store_id,
        body_camel: req.body.storeId,
        user_store_id: req.user?.store_id
      });

      const store_id = req.headers['x-store-id'] || req.query.store_id || req.body.store_id || req.body.storeId;
      console.log('🎯 AI Chat Translation - Using store_id:', store_id);

      if (!store_id) {
        return res.status(400).json({
          success: false,
          message: 'store_id is required for translations'
        });
      }

      const tenantDb = await ConnectionManager.getStoreConnection(store_id);

      // Fetch active languages from tenant DB using Supabase
      const { data: activeLanguages, error: langError } = await tenantDb
        .from('languages')
        .select('code, name, native_name, is_default, is_active')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (langError || !activeLanguages) {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch languages'
        });
      }

      const languageContext = activeLanguages.map(lang =>
        `${lang.name} (${lang.code})${lang.is_default ? ' [default]' : ''}`
      ).join(', ');

      const defaultLanguage = activeLanguages.find(lang => lang.is_default)?.code || 'en';

      // Step 1: Let AI analyze the request and search for relevant translations
      const analysisPrompt = `The user wants to translate something in their e-commerce store.

User request: "${message}"
Previous context: ${JSON.stringify(conversationHistory?.slice(-2) || [])}

STORE LANGUAGE CONTEXT:
- Active languages: ${languageContext}
- Default language: ${defaultLanguage}
- Total active: ${activeLanguages.length} language(s)

Analyze this request and provide:
1. What text/label they want to translate (e.g., "Add to Cart", "Buy Now")
2. Target language codes from the ACTIVE languages list above (e.g., ["fr", "es", "de"])
3. Suggested translation keys to search for (e.g., ["add_to_cart", "addtocart", "add to cart"])

IMPORTANT: Only suggest languages that are in the active languages list above!

Return JSON:
{
  "textToTranslate": "Add to Cart",
  "targetLanguages": ["fr", "es"],
  "searchTerms": ["add_to_cart", "add to cart", "addtocart", "cart.add"],
  "needsClarification": false,
  "clarificationQuestion": null,
  "inactiveLanguageWarning": null
}

If the user requests a language that's NOT in the active list, set inactiveLanguageWarning with a helpful message.
If you need to ask for clarification (missing language or unclear text), set needsClarification: true`;

      const analysisResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: analysisPrompt,
        systemPrompt: 'You are an AI translation assistant. Analyze user requests and extract structured information. Return ONLY valid JSON.',
        maxTokens: 512,
        temperature: 0.3,
        metadata: { type: 'translation-analysis', storeId: resolvedStoreId }
      });

      let analysis;
      try {
        const jsonMatch = analysisResult.content.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisResult.content);
      } catch (error) {
        console.error('Failed to parse analysis:', error);
        analysis = { needsClarification: true, clarificationQuestion: "I'm not sure what you'd like to translate. Could you be more specific?" };
      }

      creditsUsed += analysisResult.creditsDeducted;

      // Step 2: Check for inactive language warning
      if (analysis.inactiveLanguageWarning) {
        return res.json({
          success: true,
          message: `${analysis.inactiveLanguageWarning}\n\nYour active languages are: ${languageContext}\n\nWould you like to activate a new language, or choose from the active ones?`,
          data: {
            type: 'language_warning',
            activeLanguages: activeLanguages.map(l => ({ code: l.code, name: l.name }))
          },
          creditsDeducted: creditsUsed
        });
      }

      // Step 3: If AI needs clarification, ask the user
      if (analysis.needsClarification) {
        return res.json({
          success: true,
          message: analysis.clarificationQuestion || "Could you provide more details about what you'd like to translate?",
          data: { type: 'clarification' },
          creditsDeducted: creditsUsed
        });
      }

      // Step 3: Search for matching translation keys using AI's search terms
      const searchTerms = analysis.searchTerms || [analysis.textToTranslate];
      const searchConditions = searchTerms.map((_, idx) =>
        `(LOWER(value) LIKE $${idx * 2 + 1} OR LOWER(key) LIKE $${idx * 2 + 2})`
      ).join(' OR ');

      const searchBindings = searchTerms.flatMap(term => [
        `%${term.toLowerCase()}%`,
        `%${term.replace(/\s+/g, '_').toLowerCase()}%`
      ]);

      // Search translations using Supabase (simplified - search by first term)
      const firstTerm = searchTerms[0] || '';
      const { data: matchingKeys, error: searchError } = await tenantDb
        .from('translations')
        .select('key, value, language_code')
        .or(`value.ilike.%${firstTerm.toLowerCase()}%,key.ilike.%${firstTerm.replace(/\s+/g, '_').toLowerCase()}%`)
        .order('language_code')
        .order('key')
        .limit(20);

      if (searchError) {
        console.error('Translation search error:', searchError);
        return res.status(500).json({
          success: false,
          message: 'Failed to search translations'
        });
      }

      // Step 4: Let AI decide which keys are most relevant
      if (matchingKeys.length > 0) {
        const aiDecisionPrompt = `The user wants to translate: "${analysis.textToTranslate}"

I found these translation keys in the database:
${matchingKeys.map(k => `- ${k.key}: "${k.value}" (${k.language_code})`).join('\n')}

Which keys should be updated? Return JSON:
{
  "relevantKeys": ["product.add_to_cart", "common.addToCart"],
  "reasoning": "These keys match the 'add to cart' button functionality"
}`;

        const decisionResult = await aiService.generate({
          userId,
          operationType: 'general',
          prompt: aiDecisionPrompt,
          systemPrompt: 'You are a translation key expert. Identify the most relevant keys. Return ONLY valid JSON.',
          maxTokens: 256,
          temperature: 0.2,
          metadata: { type: 'key-selection', storeId: resolvedStoreId }
        });

        let decision;
        try {
          const jsonMatch = decisionResult.content.match(/\{[\s\S]*\}/);
          decision = JSON.parse(jsonMatch ? jsonMatch[0] : decisionResult.content);
        } catch (error) {
          // Fallback: use all unique keys
          decision = {
            relevantKeys: [...new Set(matchingKeys.map(k => k.key))],
            reasoning: 'Using all matching keys'
          };
        }

        creditsUsed += decisionResult.creditsDeducted;

        // Step 5: Generate translations for target languages
        const results = {};
        for (const targetLang of analysis.targetLanguages) {
          try {
            const translated = await translationService._translateWithClaude(
              analysis.textToTranslate,
              'en',
              targetLang,
              { type: 'button', location: 'general' }
            );
            results[targetLang] = translated;
          } catch (error) {
            console.error(`Translation to ${targetLang} failed:`, error);
            results[targetLang] = `[Translation failed]`;
          }
        }

        // Step 6: Show preview with AI's reasoning
        const keyGroups = {};
        decision.relevantKeys.forEach(key => {
          const keyData = matchingKeys.filter(k => k.key === key);
          if (keyData.length > 0) {
            keyGroups[key] = keyData.map(k => ({ lang: k.language_code, value: k.value }));
          }
        });

        const translationsList = Object.entries(results)
          .map(([lang, translation]) => `**${lang.toUpperCase()}**: ${translation}`)
          .join('\n');

        const keysInfo = Object.entries(keyGroups).map(([key, langs]) =>
          `- \`${key}\` (currently in ${langs.map(l => l.lang).join(', ')})`
        ).join('\n');

        return res.json({
          success: true,
          message: `I found these translation keys for "${analysis.textToTranslate}":\n\n${keysInfo}\n\n${decision.reasoning}\n\n**Suggested translations:**\n${translationsList}\n\nWould you like me to update these? Reply "yes" to proceed.`,
          data: {
            type: 'translation_preview',
            original: analysis.textToTranslate,
            translations: results,
            matchingKeys: keyGroups,
            action: 'update_labels',
            aiReasoning: decision.reasoning
          },
          creditsDeducted: creditsUsed
        });
      }

      // No matches found - let AI suggest next steps
      const noMatchPrompt = `The user wants to translate "${analysis.textToTranslate}" but I couldn't find matching translation keys in the database.

Suggest helpful next steps. Be friendly and actionable.`;

      const suggestionResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: noMatchPrompt,
        systemPrompt: 'You are a helpful translation assistant.',
        maxTokens: 256,
        temperature: 0.7,
        metadata: { type: 'translation-suggestion', storeId: resolvedStoreId }
      });

      res.json({
        success: true,
        message: suggestionResult.content,
        data: { type: 'suggestion' },
        creditsDeducted: creditsUsed + suggestionResult.creditsDeducted
      });

    } else if (intent.intent === 'layout') {
      // Generate layout
      const layoutResult = await aiService.generateLayout(userId, message, intent.details?.configType || 'homepage', {
        storeId
      });

      responseData = {
        type: 'layout',
        configType: intent.details?.configType || 'homepage',
        config: layoutResult.content
      };
      creditsUsed += layoutResult.creditsDeducted;

      res.json({
        success: true,
        message: `I've generated a layout configuration for your ${intent.details?.configType || 'homepage'}. You can preview it below.`,
        data: responseData,
        creditsDeducted: creditsUsed
      });

    } else if (intent.intent === 'layout_modify') {
      // Handle layout modifications (reorder, move, swap, remove elements)
      console.log('[AI Chat] Entering layout_modify handler');
      console.log('[AI Chat] Layout modify details:', JSON.stringify(intent.details));
      const ConnectionManager = require('../services/database/ConnectionManager');

      if (!resolvedStoreId) {
        return res.status(400).json({
          success: false,
          message: 'store_id is required for layout modifications'
        });
      }

      const tenantDb = await ConnectionManager.getStoreConnection(resolvedStoreId);
      const pageType = intent.details?.pageType || 'product';
      const action = intent.details?.action || 'move';
      const sourceElement = intent.details?.sourceElement;
      const targetElement = intent.details?.targetElement;
      const position = intent.details?.position || 'before';

      // Fetch current slot configuration (draft first, then published)
      let { data: slotConfig, error: fetchError } = await tenantDb
        .from('slot_configurations')
        .select('*')
        .eq('store_id', resolvedStoreId)
        .eq('page_type', pageType)
        .eq('status', 'draft')
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If no draft found, try published
      if (!slotConfig && !fetchError) {
        const { data: publishedConfig, error: pubError } = await tenantDb
          .from('slot_configurations')
          .select('*')
          .eq('store_id', resolvedStoreId)
          .eq('page_type', pageType)
          .eq('status', 'published')
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        slotConfig = publishedConfig;
        fetchError = pubError;
        console.log('[AI Chat] No draft found, using published config for layout modify');
      }

      if (fetchError) {
        console.error('[AI Chat] Failed to fetch slot configuration:', fetchError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch current layout configuration'
        });
      }

      if (!slotConfig) {
        return res.json({
          success: true,
          message: `I couldn't find a layout configuration for the ${pageType} page. Please save a layout in the Editor first, then I can help you modify it.`,
          data: { type: 'layout_error', reason: 'no_config_found' },
          creditsDeducted: creditsUsed
        });
      }

      // Parse the configuration
      const configuration = slotConfig.configuration || {};
      let slots = configuration.slots || {};
      const slotOrder = configuration.slotOrder || Object.keys(slots);

      console.log('[AI Chat] Config structure:', {
        hasConfiguration: !!slotConfig.configuration,
        hasSlots: !!configuration.slots,
        slotCount: Object.keys(slots).length,
        topLevelKeys: Object.keys(configuration).slice(0, 10)
      });
      console.log('[AI Chat] Available slots:', Object.keys(slots));
      console.log('[AI Chat] Current slot order:', slotOrder);

      // Check if slots object is empty - try to auto-recover by loading default slots
      if (Object.keys(slots).length === 0) {
        console.log('[AI Chat] Empty slots object in database configuration, attempting auto-recovery...');
        console.log('[AI Chat] Full configuration (first 500 chars):', JSON.stringify(slotConfig.configuration).substring(0, 500));

        // Try to load default slots from the config file
        try {
          const path = require('path');
          const configsDir = path.resolve(__dirname, '../../../src/components/editor/slot/configs');
          let configPath, configExport;

          switch (pageType) {
            case 'product':
              configPath = path.join(configsDir, 'product-config.js');
              configExport = 'productConfig';
              break;
            case 'category':
              configPath = path.join(configsDir, 'category-config.js');
              configExport = 'categoryConfig';
              break;
            case 'cart':
              configPath = path.join(configsDir, 'cart-config.js');
              configExport = 'cartConfig';
              break;
            case 'checkout':
              configPath = path.join(configsDir, 'checkout-config.js');
              configExport = 'checkoutConfig';
              break;
            case 'success':
              configPath = path.join(configsDir, 'success-config.js');
              configExport = 'successConfig';
              break;
            case 'header':
              configPath = path.join(configsDir, 'header-config.js');
              configExport = 'headerConfig';
              break;
            default:
              configPath = path.join(configsDir, `${pageType}-config.js`);
              configExport = `${pageType}Config`;
          }

          const configModule = await import(configPath);
          const defaultConfig = configModule[configExport];

          if (defaultConfig && defaultConfig.slots && Object.keys(defaultConfig.slots).length > 0) {
            // Found default slots - use them and update the database
            console.log(`[AI Chat] Loaded ${Object.keys(defaultConfig.slots).length} default slots from ${pageType}-config.js`);
            slots = defaultConfig.slots;

            // Update the database configuration with the default slots
            const updatedConfig = {
              ...configuration,
              slots: slots,
              metadata: {
                ...configuration.metadata,
                autoRecoveredSlots: true,
                recoveredAt: new Date().toISOString()
              }
            };

            const { error: updateError } = await tenantDb
              .from('slot_configurations')
              .update({
                configuration: updatedConfig,
                updated_at: new Date().toISOString()
              })
              .eq('id', slotConfig.id);

            if (updateError) {
              console.error('[AI Chat] Failed to update config with recovered slots:', updateError);
            } else {
              console.log('[AI Chat] Successfully updated database with recovered slots');
            }
          } else {
            throw new Error('Default config has no slots');
          }
        } catch (loadError) {
          console.error('[AI Chat] Failed to load default slots:', loadError);
          return res.json({
            success: true,
            message: `The ${pageType} page layout exists but has no slot configuration saved. Please open the ${pageType} page in the Editor, make a change (even a small one), and save it. Then I can help you modify the layout.`,
            data: {
              type: 'layout_error',
              reason: 'empty_slots',
              configId: slotConfig.id,
              pageType: pageType,
              configStatus: slotConfig.status,
              hint: 'The slot configuration may need to be re-saved from the Editor to populate the slots object.'
            },
            creditsDeducted: creditsUsed
          });
        }
      }

      // Build hierarchical slot info for better AI understanding
      const slotsByParent = {};
      Object.entries(slots).forEach(([id, slot]) => {
        const parentId = slot.parentId || 'root';
        if (!slotsByParent[parentId]) {
          slotsByParent[parentId] = [];
        }
        slotsByParent[parentId].push({
          id,
          type: slot.type,
          row: slot.position?.row,
          name: slot.name || slot.metadata?.displayName || id
        });
      });

      // Sort each parent's children by row
      Object.keys(slotsByParent).forEach(parentId => {
        slotsByParent[parentId].sort((a, b) => (a.row ?? 999) - (b.row ?? 999));
      });

      // Format hierarchical structure for prompt
      const hierarchyText = Object.entries(slotsByParent).map(([parentId, children]) => {
        const childList = children.map((c, idx) => `    ${idx + 1}. ${c.id} (row ${c.row}): ${c.name}`).join('\n');
        return `Container: ${parentId}\n${childList}`;
      }).join('\n\n');

      // Build a slot name lookup map for resolving user-friendly names to actual slot IDs
      const slotNameMap = {};
      Object.entries(slots).forEach(([id, slot]) => {
        // Add the ID itself
        slotNameMap[id.toLowerCase()] = id;
        // Add without underscores
        slotNameMap[id.toLowerCase().replace(/_/g, ' ')] = id;
        // Add display name if available
        if (slot.metadata?.displayName) {
          slotNameMap[slot.metadata.displayName.toLowerCase()] = id;
        }
        // Add name if available
        if (slot.name) {
          slotNameMap[slot.name.toLowerCase()] = id;
        }
      });

      // Add common aliases
      const commonAliases = {
        'sku': 'product_sku',
        'price': 'price_container',
        'the price': 'price_container',
        'product price': 'product_price',
        'main price': 'product_price',
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
        'quantity': 'quantity_selector',
        'qty': 'quantity_selector',
        'tabs': 'product_tabs',
        'product tabs': 'product_tabs',
        'breadcrumbs': 'breadcrumbs',
        'related products': 'related_products_container',
        'related': 'related_products_container',
        'options': 'options_container',
        'custom options': 'custom_options'
      };
      // Always add common aliases - we'll validate the resolved ID later
      Object.entries(commonAliases).forEach(([alias, slotId]) => {
        slotNameMap[alias] = slotId;
      });

      console.log('[AI Chat] Slot name map keys:', Object.keys(slotNameMap).slice(0, 20));
      console.log('[AI Chat] Available slots:', Object.keys(slots));

      /**
       * Resolve a user-provided slot name to actual slot ID
       */
      const resolveSlotId = (name) => {
        if (!name) return null;
        const lower = name.toLowerCase().trim();

        // Direct match
        if (slots[lower]) return lower;
        if (slots[name]) return name;

        // Lookup in map
        if (slotNameMap[lower]) return slotNameMap[lower];

        // Fuzzy match - check if any key contains the name or vice versa
        for (const [key, slotId] of Object.entries(slotNameMap)) {
          if (key.includes(lower) || lower.includes(key)) {
            return slotId;
          }
        }

        return null;
      };

      /**
       * Get suggestions for a slot name that wasn't found
       * Uses Levenshtein distance and keyword matching
       */
      const getSuggestions = (name, maxSuggestions = 3) => {
        if (!name) return [];
        const lower = name.toLowerCase().trim();
        const suggestions = [];

        // Simple Levenshtein distance
        const levenshtein = (a, b) => {
          if (a.length === 0) return b.length;
          if (b.length === 0) return a.length;
          const matrix = [];
          for (let i = 0; i <= b.length; i++) matrix[i] = [i];
          for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
          for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
              matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
                ? matrix[i - 1][j - 1]
                : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
          }
          return matrix[b.length][a.length];
        };

        // Score all slot names
        const scored = [];
        const seen = new Set();

        // Check aliases and slot IDs
        for (const [key, slotId] of Object.entries(slotNameMap)) {
          if (seen.has(slotId)) continue;
          seen.add(slotId);

          const distance = levenshtein(lower, key);
          const containsMatch = key.includes(lower) || lower.includes(key);
          const startsWithMatch = key.startsWith(lower) || lower.startsWith(key);

          // Score: lower is better
          let score = distance;
          if (containsMatch) score -= 3;
          if (startsWithMatch) score -= 5;

          // Get friendly name for display
          const slot = slots[slotId];
          const friendlyName = slot?.metadata?.displayName ||
                              slot?.name ||
                              slotId.replace(/_/g, ' ');

          scored.push({ slotId, friendlyName, key, score, distance });
        }

        // Sort by score and return top suggestions
        scored.sort((a, b) => a.score - b.score);
        return scored.slice(0, maxSuggestions).map(s => ({
          slotId: s.slotId,
          name: s.friendlyName,
          hint: s.key !== s.slotId ? `(you can say "${s.key}")` : ''
        }));
      };

      // Use AI to analyze - AI just needs to understand INTENT, we resolve the IDs
      const layoutAnalysisPrompt = `Understand this layout modification request.

AVAILABLE ELEMENTS ON PAGE:
${hierarchyText}

USER REQUEST: "${message}"

Your job: Understand what the user wants to move and where.

Return JSON:
{
  "understood": true/false,
  "source": "what user wants to move (use their words)",
  "target": "where to move it relative to (use their words)",
  "action": "move|swap|remove",
  "position": "before|after",
  "description": "human-readable description",
  "error": "error if request is unclear"
}

Examples:
- "move sku above price" → {source: "sku", target: "price", position: "before"}
- "put the title after description" → {source: "title", target: "description", position: "after"}
- "swap gallery and tabs" → {source: "gallery", target: "tabs", action: "swap"}

Return ONLY valid JSON.`;

      const analysisResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: layoutAnalysisPrompt,
        systemPrompt: 'You are a layout configuration expert. Analyze slot configurations and determine how to reorder them. Return ONLY valid JSON.',
        maxTokens: 512,
        temperature: 0.2,
        metadata: { type: 'layout-analysis', storeId: resolvedStoreId }
      });
      creditsUsed += analysisResult.creditsDeducted;

      let analysis;
      try {
        const jsonMatch = analysisResult.content.match(/\{[\s\S]*\}/);
        analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisResult.content);
      } catch (e) {
        console.error('Failed to parse layout analysis:', e);
        return res.json({
          success: true,
          message: "I couldn't understand how to modify the layout. Could you be more specific? For example: 'move the SKU above the stock label' or 'swap the price and title positions'.",
          data: { type: 'layout_error', reason: 'parse_error' },
          creditsDeducted: creditsUsed
        });
      }

      console.log('[AI Chat] Layout analysis result:', JSON.stringify(analysis));

      if (!analysis.understood || analysis.error) {
        return res.json({
          success: true,
          message: analysis.error || "I couldn't understand that layout change. Try something like: 'move sku above price' or 'put title after description'",
          data: { type: 'layout_error', reason: 'not_understood', analysis },
          creditsDeducted: creditsUsed
        });
      }

      // Validate AI returned source and target (new format - we resolve IDs ourselves)
      if (!analysis.source) {
        return res.json({
          success: true,
          message: "I couldn't determine which element you want to move. Try: 'move [element] above/below [target]'",
          data: { type: 'layout_error', reason: 'no_source' },
          creditsDeducted: creditsUsed
        });
      }

      // SMART RESOLUTION: Map AI's response (source/target) to actual slot IDs
      const sourceSlotIdResolved = resolveSlotId(analysis.source);
      const targetSlotIdResolved = resolveSlotId(analysis.target);

      console.log('[AI Chat] AI understood:', { source: analysis.source, target: analysis.target, position: analysis.position });
      console.log('[AI Chat] Resolved to:', { sourceSlotId: sourceSlotIdResolved, targetSlotId: targetSlotIdResolved });

      // Helper to build helpful error message with available slots
      const getAvailableSlotsList = () => {
        return Object.keys(slots)
          .filter(id => id !== 'main_layout' && id !== 'content_area') // Skip containers
          .slice(0, 10)
          .map(id => {
            const slot = slots[id];
            const name = slot?.metadata?.displayName || id.replace(/_/g, ' ');
            return name;
          });
      };

      // Validate we could resolve the source
      if (!sourceSlotIdResolved) {
        console.error('[AI Chat] Could not resolve source:', analysis.source);
        const suggestions = getSuggestions(analysis.source);
        const availableSlots = getAvailableSlotsList();
        const suggestionText = suggestions.length > 0
          ? `\n\nDid you mean:\n${suggestions.map(s => `• ${s.name} ${s.hint}`).join('\n')}`
          : `\n\nAvailable elements: ${availableSlots.join(', ')}`;

        return res.json({
          success: true,
          message: `I couldn't find an element called "${analysis.source}" on this page.${suggestionText}`,
          data: {
            type: 'layout_error',
            reason: 'source_not_found',
            searched: analysis.source,
            suggestions: suggestions,
            availableSlots: availableSlots
          },
          creditsDeducted: creditsUsed
        });
      }

      // Check if resolved source slot actually exists in config
      if (!slots[sourceSlotIdResolved]) {
        console.error('[AI Chat] Resolved source slot not in config:', sourceSlotIdResolved);
        const availableSlots = getAvailableSlotsList();
        return res.json({
          success: true,
          message: `The "${analysis.source}" element doesn't exist in this page's saved layout.\n\nAvailable elements: ${availableSlots.join(', ')}`,
          data: {
            type: 'layout_error',
            reason: 'source_slot_not_in_config',
            resolvedTo: sourceSlotIdResolved,
            availableSlots: availableSlots
          },
          creditsDeducted: creditsUsed
        });
      }

      // Validate we could resolve the target (if action requires it)
      if (analysis.action !== 'remove' && !targetSlotIdResolved) {
        console.error('[AI Chat] Could not resolve target:', analysis.target);
        const suggestions = getSuggestions(analysis.target);
        const availableSlots = getAvailableSlotsList();
        const suggestionText = suggestions.length > 0
          ? `\n\nDid you mean:\n${suggestions.map(s => `• ${s.name} ${s.hint}`).join('\n')}`
          : `\n\nAvailable elements: ${availableSlots.join(', ')}`;

        return res.json({
          success: true,
          message: `I couldn't find an element called "${analysis.target}" on this page.${suggestionText}`,
          data: {
            type: 'layout_error',
            reason: 'target_not_found',
            searched: analysis.target,
            suggestions: suggestions,
            availableSlots: availableSlots
          },
          creditsDeducted: creditsUsed
        });
      }

      // Check if resolved target slot actually exists in config
      if (analysis.action !== 'remove' && !slots[targetSlotIdResolved]) {
        console.error('[AI Chat] Resolved target slot not in config:', targetSlotIdResolved);
        const availableSlots = getAvailableSlotsList();
        return res.json({
          success: true,
          message: `The "${analysis.target}" element doesn't exist in this page's saved layout.\n\nAvailable elements: ${availableSlots.join(', ')}`,
          data: {
            type: 'layout_error',
            reason: 'target_slot_not_in_config',
            resolvedTo: targetSlotIdResolved,
            availableSlots: availableSlots
          },
          creditsDeducted: creditsUsed
        });
      }

      // Store resolved IDs in analysis for later use
      analysis.sourceSlotId = sourceSlotIdResolved;
      analysis.targetSlotId = targetSlotIdResolved;

      // CRITICAL FIX: Update position.row values for hierarchical slot ordering
      // Slots are sorted by position.row, not by slotOrder array
      const sourceSlotId = analysis.sourceSlotId;
      const targetSlotId = analysis.targetSlotId;
      const sourceSlot = slots[sourceSlotId];
      const targetSlot = slots[targetSlotId];

      if (sourceSlot && targetSlot && sourceSlot.parentId === targetSlot.parentId) {
        // Both slots are in the same container - update position.row values
        const parentId = sourceSlot.parentId;
        console.log('[AI Chat] Reordering slots within parent:', parentId);

        // Get all sibling slots (same parent)
        const siblingSlots = Object.entries(slots)
          .filter(([id, slot]) => slot.parentId === parentId)
          .sort((a, b) => {
            const rowA = a[1].position?.row ?? 999;
            const rowB = b[1].position?.row ?? 999;
            return rowA - rowB;
          });

        console.log('[AI Chat] Current sibling order:', siblingSlots.map(([id]) => id));

        // Determine new order based on action
        const currentOrder = siblingSlots.map(([id]) => id);
        const sourceIndex = currentOrder.indexOf(sourceSlotId);
        const targetIndex = currentOrder.indexOf(targetSlotId);

        if (sourceIndex !== -1 && targetIndex !== -1) {
          // Remove source from current position
          currentOrder.splice(sourceIndex, 1);

          // Calculate new target index (adjusted if source was before target)
          let newTargetIndex = currentOrder.indexOf(targetSlotId);
          if (analysis.action === 'move' && analysis.position === 'after') {
            newTargetIndex += 1;
          }

          // Insert source at new position
          currentOrder.splice(newTargetIndex, 0, sourceSlotId);

          console.log('[AI Chat] New sibling order:', currentOrder);

          // Update position.row for all siblings based on new order
          currentOrder.forEach((slotId, index) => {
            if (slots[slotId] && slots[slotId].position) {
              const newRow = index + 1; // 1-indexed rows
              console.log(`[AI Chat] Updating ${slotId} row: ${slots[slotId].position.row} -> ${newRow}`);
              slots[slotId].position.row = newRow;
            }
          });
        }
      } else if (sourceSlot && targetSlot) {
        console.log('[AI Chat] Slots have different parents - cross-container move not yet supported');
      }

      // Build the updated configuration with updated slot positions
      const updatedConfiguration = {
        ...configuration,
        slots: slots, // Updated slots with new position.row values
        // Keep existing slotOrder - position.row is what matters for rendering
        metadata: {
          ...configuration.metadata,
          lastModified: new Date().toISOString(),
          lastModifiedBy: 'AI Assistant',
          lastLayoutChange: analysis.description
        }
      };

      // Update the slot configuration
      console.log('[AI Chat] Updating layout for config id:', slotConfig.id);
      console.log('[AI Chat] Change:', analysis.description);

      const { data: updatedData, error: updateError } = await tenantDb
        .from('slot_configurations')
        .update({
          configuration: updatedConfiguration,
          updated_at: new Date().toISOString(),
          metadata: {
            ...slotConfig.metadata,
            ai_generated: true,
            last_ai_change: analysis.description,
            last_ai_request: message
          }
        })
        .eq('id', slotConfig.id)
        .select('id, configuration')
        .single();

      if (updateError) {
        console.error('[AI Chat] Failed to save layout change:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to save layout change: ' + updateError.message
        });
      }

      if (!updatedData) {
        console.error('[AI Chat] Update returned no data - row may not exist');
        return res.status(500).json({
          success: false,
          message: 'Failed to update layout - configuration not found'
        });
      }

      console.log('[AI Chat] Successfully updated layout order:', updatedData.id);

      // Let AI generate varied response
      const responsePrompt = `Changes made: ${analysis.description}

Confirm in 1 sentence. MUST mention the specific change. Keep it casual. No "Great/I've/Let me know".`;

      const responseResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: responsePrompt,
        systemPrompt: 'Mention the SPECIFIC change made. One casual sentence.',
        maxTokens: 40,
        temperature: 0.8,
        metadata: { type: 'response', storeId: resolvedStoreId }
      });
      creditsUsed += responseResult.creditsDeducted;

      responseData = {
        type: 'layout_modified',
        pageType,
        action: analysis.action,
        sourceSlotId: analysis.sourceSlotId,
        targetSlotId: analysis.targetSlotId,
        position: analysis.position,
        description: analysis.description,
        configId: slotConfig.id
      };

      res.json({
        success: true,
        message: responseResult.content,
        data: responseData,
        creditsDeducted: creditsUsed
      });
      return;

    } else if (intent.intent === 'admin_entity') {
      // Handle admin entity operations (product tabs, settings, coupons, etc.)
      console.log('[AI Chat] Entering admin_entity handler');
      console.log('[AI Chat] Admin entity details:', JSON.stringify(intent.details));

      if (!resolvedStoreId) {
        return res.status(400).json({
          success: false,
          message: 'store_id is required for admin entity operations'
        });
      }

      try {
        const entityName = intent.details?.entity;
        const operation = intent.details?.operation || 'update';
        const searchTerm = intent.details?.search_term;
        const params = intent.details?.params || {};

        if (!entityName) {
          // If no entity detected, use dynamic detection from database
          console.log('[AI Chat] No entity in intent, using dynamic detection');
          const dynamicIntent = await aiEntityService.detectEntityIntent(
            resolvedStoreId,
            message,
            aiService,
            userId
          );
          creditsUsed += dynamicIntent.creditsUsed || 0;

          if (dynamicIntent.intent !== 'admin_entity' || !dynamicIntent.entity) {
            return res.json({
              success: true,
              message: "I couldn't determine which admin setting you want to change. Could you be more specific? For example: 'rename the specs tab to Technical Details' or 'create a 20% discount coupon'.",
              data: { type: 'admin_error', reason: 'entity_not_detected' },
              creditsDeducted: creditsUsed
            });
          }

          // Use the dynamically detected values
          intent.details = {
            entity: dynamicIntent.entity,
            operation: dynamicIntent.operation,
            search_term: dynamicIntent.search_term,
            params: dynamicIntent.params
          };
        }

        const detectedEntity = intent.details.entity;
        const detectedOperation = intent.details.operation || 'update';
        const detectedSearchTerm = intent.details.search_term;
        const detectedParams = intent.details.params || {};

        // Get entity definition
        const entityDef = await aiEntityService.getEntityDefinition(resolvedStoreId, detectedEntity);

        if (!entityDef) {
          return res.json({
            success: true,
            message: `I don't recognize the entity "${detectedEntity}". I can help with: product tabs, categories, attributes, coupons, payment methods, shipping, languages, SEO settings, store settings, tax settings, CMS pages, and email templates.`,
            data: { type: 'admin_error', reason: 'unknown_entity' },
            creditsDeducted: creditsUsed
          });
        }

        // If we need to find an entity by search term, do that first
        let targetId = detectedParams.id;
        if (!targetId && detectedSearchTerm && ['update', 'delete', 'get'].includes(detectedOperation)) {
          console.log(`[AI Chat] Searching for ${detectedEntity} matching: ${detectedSearchTerm}`);
          const found = await aiEntityService.findEntityBySearchTerm(resolvedStoreId, detectedEntity, detectedSearchTerm);

          if (!found) {
            return res.json({
              success: true,
              message: `I couldn't find a ${entityDef.display_name} matching "${detectedSearchTerm}". Would you like me to list all available ${entityDef.display_name}?`,
              data: { type: 'admin_error', reason: 'not_found', search_term: detectedSearchTerm },
              creditsDeducted: creditsUsed
            });
          }

          if (Array.isArray(found)) {
            // Multiple matches - ask user to clarify
            const options = found.map(f => f.name || f.code || f.title || f[entityDef.primary_key]).join(', ');
            return res.json({
              success: true,
              message: `I found multiple ${entityDef.display_name} matching "${detectedSearchTerm}": ${options}. Which one did you mean?`,
              data: { type: 'admin_clarification', matches: found, entity: detectedEntity },
              creditsDeducted: creditsUsed
            });
          }

          targetId = found[entityDef.primary_key || 'id'];
          console.log(`[AI Chat] Found entity with ID: ${targetId}`);
        }

        // Execute the operation
        const operationParams = { ...detectedParams };
        if (targetId) {
          operationParams.id = targetId;
        }

        console.log(`[AI Chat] Executing ${detectedOperation} on ${detectedEntity}:`, operationParams);

        const result = await aiEntityService.executeEntityOperation(
          resolvedStoreId,
          detectedEntity,
          detectedOperation,
          operationParams,
          { search_term: detectedSearchTerm }
        );

        // Generate natural response
        const responseGen = await aiEntityService.generateEntityResponse(
          resolvedStoreId,
          entityDef,
          detectedOperation,
          result,
          aiService,
          userId,
          message
        );
        creditsUsed += responseGen.creditsUsed || 0;

        responseData = {
          type: 'admin_entity_modified',
          entity: detectedEntity,
          operation: detectedOperation,
          result: result.data,
          entityDef: {
            display_name: entityDef.display_name,
            category: entityDef.category
          }
        };

        res.json({
          success: true,
          message: responseGen.message,
          data: responseData,
          creditsDeducted: creditsUsed
        });
        return;

      } catch (error) {
        console.error('[AI Chat] Admin entity error:', error);
        return res.json({
          success: true,
          message: `I encountered an error while trying to update: ${error.message}. Please try again or contact support if the problem persists.`,
          data: { type: 'admin_error', reason: 'operation_failed', error: error.message },
          creditsDeducted: creditsUsed
        });
      }

    } else if (intent.intent === 'styling') {
      // Handle styling changes to slot configurations
      console.log('[AI Chat] Entering styling handler');
      console.log('[AI Chat] Styling details:', JSON.stringify(intent.details));
      const ConnectionManager = require('../services/database/ConnectionManager');

      // Use global AI conversations array
      const aiConversations = globalAiConversations;

      if (!resolvedStoreId) {
        return res.status(400).json({
          success: false,
          message: 'store_id is required for styling changes'
        });
      }

      const tenantDb = await ConnectionManager.getStoreConnection(resolvedStoreId);
      const pageType = intent.details?.pageType || 'product';

      // Normalize changes to array format (supports single or multiple changes)
      let stylingChanges = [];
      if (intent.details?.changes && Array.isArray(intent.details.changes)) {
        stylingChanges = intent.details.changes;
      } else if (intent.details?.element && intent.details?.property) {
        // Single change format
        stylingChanges = [{
          element: intent.details.element,
          property: intent.details.property,
          value: intent.details.value
        }];
      }

      console.log('[AI Chat] Styling changes to apply:', JSON.stringify(stylingChanges));

      if (stylingChanges.length === 0) {
        return res.json({
          success: true,
          message: "I couldn't determine what styling changes you want to make. Could you be more specific? For example: 'change the product title color to red' or 'increase the price font size to 24px'",
          data: { type: 'styling_error', reason: 'no_changes_specified' },
          creditsDeducted: creditsUsed
        });
      }

      // Fetch current slot configuration for the page type (draft first, then published)
      // Draft is used for preview, published is for live site
      let { data: slotConfig, error: fetchError } = await tenantDb
        .from('slot_configurations')
        .select('*')
        .eq('store_id', resolvedStoreId)
        .eq('page_type', pageType)
        .eq('status', 'draft')
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If no draft found, try published
      if (!slotConfig && !fetchError) {
        const { data: publishedConfig, error: pubError } = await tenantDb
          .from('slot_configurations')
          .select('*')
          .eq('store_id', resolvedStoreId)
          .eq('page_type', pageType)
          .eq('status', 'published')
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        slotConfig = publishedConfig;
        fetchError = pubError;
        console.log('[AI Chat] No draft found, using published config');
      }

      if (fetchError) {
        console.error('[AI Chat] Failed to fetch slot configuration:', fetchError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch current layout configuration'
        });
      }

      console.log('[AI Chat] Fetched slot config:', slotConfig ? `id=${slotConfig.id}, page=${slotConfig.page_type}` : 'null');

      if (!slotConfig) {
        return res.json({
          success: true,
          message: `I couldn't find a layout configuration for the ${pageType} page. Please save a layout in the Editor first, then I can help you modify styles.`,
          data: { type: 'styling_error', reason: 'no_config_found' },
          creditsDeducted: creditsUsed
        });
      }

      // Parse the configuration
      const configuration = slotConfig.configuration || {};
      let updatedSlots = { ...configuration.slots || {} };
      const slots = configuration.slots || {};

      console.log('[AI Chat] Available slots:', Object.keys(slots));
      console.log('[AI Chat] Processing', stylingChanges.length, 'change(s)');

      // Helper function to find slot by element name
      const findSlot = async (elementName) => {
        // Try exact match first
        if (elementName && slots[elementName]) {
          return { slot: slots[elementName], slotId: elementName };
        }

        // Try common variations
        const variations = [
          elementName,
          elementName?.replace(/_/g, '-'),
          elementName?.replace(/-/g, '_'),
          `${pageType}_${elementName}`,
          `${pageType}-${elementName}`,
        ].filter(Boolean);

        for (const variant of variations) {
          if (slots[variant]) {
            return { slot: slots[variant], slotId: variant };
          }
        }

        // Use AI to find matching slot
        const slotNames = Object.keys(slots).map(id => ({
          id,
          name: slots[id].name || id,
          type: slots[id].type || 'unknown'
        }));

        const matchPrompt = `Given these slots: ${JSON.stringify(slotNames)}
The user wants to modify "${elementName}".
Return JSON: { "slotId": "the_slot_id" }`;

        try {
          const matchResult = await aiService.generate({
            userId,
            operationType: 'general',
            prompt: matchPrompt,
            systemPrompt: 'Match element names to slot IDs. Return ONLY valid JSON.',
            maxTokens: 100,
            temperature: 0.2,
            metadata: { type: 'slot-matching', storeId: resolvedStoreId }
          });
          creditsUsed += matchResult.creditsDeducted;

          const match = JSON.parse(matchResult.content.match(/\{[\s\S]*\}/)?.[0] || '{}');
          if (match.slotId && slots[match.slotId]) {
            return { slot: slots[match.slotId], slotId: match.slotId };
          }
        } catch (e) {
          console.warn('Slot matching failed:', e.message);
        }

        return { slot: null, slotId: null };
      };

      // Process all changes
      const appliedChanges = [];
      const failedChanges = [];

      for (const change of stylingChanges) {
        const { element, property, value } = change;
        console.log('[AI Chat] Processing change:', JSON.stringify(change));

        const { slot: targetSlot, slotId: targetSlotId } = await findSlot(element);

        if (!targetSlot || !targetSlotId) {
          failedChanges.push({ element, reason: 'slot not found' });
          continue;
        }

        // Get current slot state (may have been modified by previous change)
        const currentSlot = updatedSlots[targetSlotId] || targetSlot;
        const currentClassName = currentSlot.className || '';
        const currentStyles = currentSlot.styles || {};
        let newClassName = currentClassName;
        let newStyles = { ...currentStyles };
        let changeDescription = '';

        // Load colord for color parsing
        const { colord, extend } = require('colord');
        const namesPlugin = require('colord/plugins/names');
        extend([namesPlugin]);

      // Smart color parser - uses AI for natural language descriptions
      const parseColor = async (colorValue) => {
        if (!colorValue) return null;

        // First try colord for standard formats (hex, rgb, hsl, CSS names)
        const cleaned = colorValue.toLowerCase().trim().replace(/\s+/g, '');
        const parsed = colord(cleaned);
        if (parsed.isValid()) {
          return parsed.toHex();
        }

        // If not a standard format, use AI to interpret the color description
        const colorPrompt = `Convert this color description to a hex color code:
"${colorValue}"

Return ONLY a JSON object: { "hex": "#xxxxxx", "name": "color name" }

Examples:
- "light green" → { "hex": "#90ee90", "name": "light green" }
- "dark ocean blue" → { "hex": "#1a3a5c", "name": "dark ocean blue" }
- "warm sunset orange" → { "hex": "#ff6b35", "name": "warm sunset orange" }
- "muted purple" → { "hex": "#9370db", "name": "muted purple" }

Return ONLY valid JSON.`;

        try {
          const colorSystemPrompt = 'You are a color expert. Convert color descriptions to precise hex codes. Return ONLY valid JSON.';
          const colorResult = await aiService.generate({
            userId,
            operationType: 'general',
            prompt: colorPrompt,
            systemPrompt: colorSystemPrompt,
            maxTokens: 100,
            temperature: 0.3,
            metadata: { type: 'color-parsing', storeId: resolvedStoreId }
          });
          creditsUsed += colorResult.creditsDeducted;

          // Track this AI conversation
          aiConversations.push({
            step: 'color-parsing',
            provider: 'anthropic',
            model: colorResult.usage?.model || 'claude-3-haiku',
            prompt: colorPrompt,
            systemPrompt: colorSystemPrompt,
            response: colorResult.content,
            tokens: colorResult.usage
          });

          const colorJson = JSON.parse(colorResult.content.match(/\{[\s\S]*\}/)?.[0] || '{}');
          if (colorJson.hex && /^#[0-9a-fA-F]{6}$/.test(colorJson.hex)) {
            return colorJson.hex;
          }
        } catch (e) {
          console.warn('AI color parsing failed:', e.message);
        }

        // Fallback to original value
        return colorValue;
      };

        if (property === 'color' || property === 'textColor') {
        // Remove existing Tailwind text color classes
        newClassName = currentClassName
          .replace(/text-(gray|red|blue|green|yellow|purple|pink|orange|black|white|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\d{2,3}/g, '')
          .replace(/text-(black|white|transparent|current|inherit)/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Parse and apply the color as inline style (AI-powered for natural language)
        const hexColor = await parseColor(value);
        newStyles.color = hexColor;
        changeDescription = `Changed text color to ${value} (${hexColor})`;

      } else if (property === 'backgroundColor' || property === 'background') {
        // Remove existing Tailwind background color classes
        newClassName = currentClassName
          .replace(/bg-(gray|red|blue|green|yellow|purple|pink|orange|black|white|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\d{2,3}/g, '')
          .replace(/bg-(black|white|transparent|current|inherit)/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        const hexColor = await parseColor(value);
        newStyles.backgroundColor = hexColor;
        changeDescription = `Changed background color to ${value} (${hexColor})`;

      } else if (property === 'fontSize' || property === 'size' || property === 'font-size' || property === 'textSize') {
        // Use AI to interpret font size value
        const currentSize = currentStyles.fontSize || '16px';
        const sizePrompt = `Convert this font size description to a valid CSS font-size value:
"${value}"

Current font size: ${currentSize}
Context: This is for a ${element || 'text element'} on a ${pageType} page.

If the request is relative (larger, bigger, smaller, etc.), calculate based on current size.
Return ONLY a JSON object: { "size": "24px", "interpretation": "description of change" }

Examples:
- "larger" with current 16px → { "size": "20px", "interpretation": "increased by 25%" }
- "much bigger" with current 14px → { "size": "21px", "interpretation": "increased by 50%" }
- "small" → { "size": "12px", "interpretation": "small text size" }
- "32" → { "size": "32px", "interpretation": "explicit pixel value" }
- "2rem" → { "size": "2rem", "interpretation": "explicit rem value" }

Return ONLY valid JSON.`;

        let finalSize = value;
        try {
          const sizeResult = await aiService.generate({
            userId,
            operationType: 'general',
            prompt: sizePrompt,
            systemPrompt: 'You are a CSS expert. Convert size descriptions to valid CSS values. Return ONLY valid JSON.',
            maxTokens: 100,
            temperature: 0.2,
            metadata: { type: 'size-parsing', storeId: resolvedStoreId }
          });
          creditsUsed += sizeResult.creditsDeducted;

          aiConversations.push({
            step: 'size-parsing',
            provider: 'anthropic',
            model: sizeResult.usage?.model || 'claude-3-haiku',
            prompt: sizePrompt,
            response: sizeResult.content,
            tokens: sizeResult.usage
          });

          const sizeJson = JSON.parse(sizeResult.content.match(/\{[\s\S]*\}/)?.[0] || '{}');
          if (sizeJson.size) {
            finalSize = sizeJson.size;
          }
        } catch (e) {
          console.warn('AI size parsing failed:', e.message);
          // Fallback: add px if just a number
          const num = parseFloat(value);
          if (!isNaN(num)) {
            finalSize = `${num}px`;
          }
        }

        newStyles.fontSize = finalSize;
        changeDescription = `Changed font size to ${finalSize}`;
      } else {
        // Use AI to interpret any CSS property value
        const cssPrompt = `Convert this styling request to a valid CSS property and value:
Property: "${property}"
Value: "${value}"
Element: ${element || 'text element'}
Page: ${pageType} page
Current styles: ${JSON.stringify(currentStyles)}

Return ONLY a JSON object: { "property": "css-property-name", "value": "valid-css-value", "interpretation": "what this does" }

Examples:
- property: "padding", value: "more" → { "property": "padding", "value": "16px", "interpretation": "increased padding" }
- property: "margin", value: "larger" → { "property": "margin", "value": "24px", "interpretation": "increased margin" }
- property: "border", value: "thin red" → { "property": "border", "value": "1px solid red", "interpretation": "thin red border" }
- property: "fontWeight", value: "bold" → { "property": "fontWeight", "value": "700", "interpretation": "bold text" }

Return ONLY valid JSON.`;

        let finalProperty = property;
        let finalValue = value;

        try {
          const cssResult = await aiService.generate({
            userId,
            operationType: 'general',
            prompt: cssPrompt,
            systemPrompt: 'You are a CSS expert. Convert style descriptions to valid CSS. Return ONLY valid JSON.',
            maxTokens: 150,
            temperature: 0.2,
            metadata: { type: 'css-parsing', storeId: resolvedStoreId }
          });
          creditsUsed += cssResult.creditsDeducted;

          aiConversations.push({
            step: 'css-parsing',
            provider: 'anthropic',
            model: cssResult.usage?.model || 'claude-3-haiku',
            prompt: cssPrompt,
            response: cssResult.content,
            tokens: cssResult.usage
          });

          const cssJson = JSON.parse(cssResult.content.match(/\{[\s\S]*\}/)?.[0] || '{}');
          if (cssJson.property && cssJson.value) {
            finalProperty = cssJson.property;
            finalValue = cssJson.value;
          }
        } catch (e) {
          console.warn('AI CSS parsing failed:', e.message);
        }

        newStyles[finalProperty] = finalValue;
        changeDescription = `Changed ${finalProperty} to ${finalValue}`;
      }

        // Update this slot in the accumulated changes
        updatedSlots[targetSlotId] = {
          ...currentSlot,
          className: newClassName,
          styles: newStyles
        };

        appliedChanges.push({
          element,
          slotId: targetSlotId,
          property,
          value,
          description: changeDescription
        });

        console.log('[AI Chat] Applied change:', changeDescription);
      } // End of for loop

      // Check if any changes were applied
      if (appliedChanges.length === 0) {
        return res.json({
          success: true,
          message: `I couldn't apply any of the requested changes. ${failedChanges.length > 0 ? `Failed to find: ${failedChanges.map(f => f.element).join(', ')}` : ''}`,
          data: { type: 'styling_error', reason: 'no_changes_applied', failedChanges },
          creditsDeducted: creditsUsed
        });
      }

      // Build the updated configuration with all changes
      const updatedConfiguration = {
        ...configuration,
        slots: updatedSlots,
        metadata: {
          ...configuration.metadata,
          lastModified: new Date().toISOString(),
          lastModifiedBy: 'AI Assistant'
        }
      };

      // Directly update the published configuration (no draft, immediate apply)
      const allChangeDescriptions = appliedChanges.map(c => c.description).join('; ');
      console.log('[AI Chat] Updating slot config id:', slotConfig.id);
      console.log('[AI Chat] Applied', appliedChanges.length, 'change(s):', allChangeDescriptions);

      const { data: updatedData, error: updateError } = await tenantDb
        .from('slot_configurations')
        .update({
          configuration: updatedConfiguration,
          updated_at: new Date().toISOString(),
          metadata: {
            ...slotConfig.metadata,
            ai_generated: true,
            last_ai_change: allChangeDescriptions,
            last_ai_request: message
          }
        })
        .eq('id', slotConfig.id)
        .select('id, configuration')
        .single();

      if (updateError) {
        console.error('[AI Chat] Failed to save styling change:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to save styling change: ' + updateError.message
        });
      }

      if (!updatedData) {
        console.error('[AI Chat] Update returned no data - row may not exist');
        return res.status(500).json({
          success: false,
          message: 'Failed to update styling - configuration not found'
        });
      }

      console.log('[AI Chat] Successfully updated slot config:', updatedData.id);
      console.log('[AI Chat] Changes applied:', allChangeDescriptions);

      // Let AI generate varied response
      const changesSummary = appliedChanges.map(c => c.description).join('; ');

      const responsePrompt = `Changes made: ${changesSummary}

Confirm in 1 sentence. MUST mention the specific changes. Keep it casual. No "Great/I've/Let me know".`;

      const responseResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: responsePrompt,
        systemPrompt: 'Mention the SPECIFIC changes made. One casual sentence.',
        maxTokens: 40,
        temperature: 0.8,
        metadata: { type: 'response', storeId: resolvedStoreId }
      });
      creditsUsed += responseResult.creditsDeducted;

      responseData = {
        type: 'styling_applied',
        pageType,
        appliedChanges,
        failedChanges,
        configId: slotConfig.id,
        aiConversations,
        detectedIntent: intent
      };

      res.json({
        success: true,
        message: responseResult.content,
        data: responseData,
        creditsDeducted: creditsUsed
      });
      return;

    } else {
      // Just chat - provide context about our slot-based system
      const chatSystemPrompt = `You are the AI assistant for Catalyst, a visual e-commerce website builder.

IMPORTANT: Catalyst uses a SLOT-BASED CONFIGURATION SYSTEM, not raw HTML/CSS.
- Pages are built from configurable slots (components)
- Each slot has properties: position, styles, className, visibility
- Changes are made by updating slot configurations, NOT by editing HTML files
- Users configure their store visually through the Editor

Available page types: product, category, cart, checkout, homepage, header
Common slots: product_title, product_sku, price_container, product_gallery, add_to_cart_button, stock_status

What you can help with:
- STYLING: "make sku red" → I modify the product_sku slot's color property
- LAYOUT: "move sku above price" → I reorder slots by updating position values
- PLUGINS: "add a wishlist button" → I generate custom functionality
- TRANSLATIONS: "translate to French" → I update language strings
- SETTINGS: "change store name" → I update store configuration

When users ask about styling or layout, ALWAYS explain that you'll modify their slot configuration.
NEVER suggest editing HTML files or CSS stylesheets directly - that's not how Catalyst works.

Previous conversation: ${JSON.stringify(conversationHistory?.slice(-3) || [])}`;

      const chatResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: message,
        systemPrompt: chatSystemPrompt,
        maxTokens: 1024,
        temperature: 0.7,
        metadata: { type: 'chat', storeId: resolvedStoreId }
      });

      res.json({
        success: true,
        message: chatResult.content,
        data: null,
        creditsDeducted: creditsUsed + chatResult.creditsDeducted
      });
    }

  } catch (error) {
    console.error('Chat Error:', error);

    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Chat failed'
    });
  }
});

/**
 * POST /api/ai/code/patch
 * Generate code patch
 */
router.post('/code/patch', authMiddleware, async (req, res) => {
  try {
    const { prompt, sourceCode, filePath } = req.body;
    const userId = req.user.id;

    if (!prompt || !sourceCode || !filePath) {
      return res.status(400).json({
        success: false,
        message: 'prompt, sourceCode, and filePath are required'
      });
    }

    const result = await aiService.generateCodePatch(userId, prompt, sourceCode, filePath, {
      filePath
    });

    res.json({
      success: true,
      patch: result.content,
      usage: result.usage,
      creditsDeducted: result.creditsDeducted
    });

  } catch (error) {
    console.error('Code Patch Error:', error);

    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Code patch generation failed'
    });
  }
});

module.exports = router;
