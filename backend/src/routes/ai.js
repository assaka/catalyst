// backend/src/routes/ai.js
const express = require('express');
const router = express.Router();
const aiService = require('../services/AIService');
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
    const intentPrompt = `Analyze this user message and determine what they want to do.

User message: "${message}"

Previous conversation: ${JSON.stringify(conversationHistory?.slice(-3) || [])}

Determine the intent and respond with JSON:
{
  "intent": "plugin|translation|layout|layout_modify|styling|code|chat",
  "action": "generate|modify|chat",
  "details": { ... }
}

INTENT DEFINITIONS:

1. **styling** - Changing visual properties of EXISTING elements (colors, fonts, sizes, spacing):
   - "change the product title color to red" → styling
   - "make the price blue" → styling
   - "set the button background to green" → styling
   - "increase the font size of the title" → styling
   Details: { pageType, element, property, value }

2. **layout** - Adding NEW sections/components OR generating a new page layout from scratch:
   - "add a hero section to the homepage" → layout (action: "generate")
   - "create a new layout for the product page" → layout (action: "generate")
   - "generate a modern homepage layout" → layout (action: "generate")
   Details: { configType, description, action: "generate" }

3. **layout_modify** - Reordering, moving, swapping, or removing EXISTING elements within a page:
   - "move the sku above the stock label" → layout_modify
   - "swap the price and title positions" → layout_modify
   - "reorder the product info section" → layout_modify
   - "remove the breadcrumbs from the product page" → layout_modify
   - "put the add to cart button before the price" → layout_modify
   Details: {
     pageType: "product|category|homepage|cart|checkout|account|login|success",
     action: "move|swap|reorder|remove",
     sourceElement: "element to move",
     targetElement: "element to move relative to (for move/swap)",
     position: "before|after|above|below" (for move operations)
   }

4. **translation** - Translating text to other languages:
   - "translate add to cart to French" → translation
   Details: { text, targetLanguages, entities }

5. **plugin** - Creating new functionality/features:
   - "create a wishlist plugin" → plugin
   Details: { description, category }

6. **code** - Modifying source code directly:
   - "add error handling to this function" → code
   Details: { operation }

7. **chat** - General questions or conversation

STYLING DETAILS FORMAT (supports multiple changes):
{
  "pageType": "product|category|homepage|cart|checkout|account|login|success",
  "changes": [
    { "element": "product_title", "property": "fontSize", "value": "24px" },
    { "element": "product_price", "property": "color", "value": "purple" }
  ]
}

For single changes, you can also use the simple format:
{
  "pageType": "product",
  "element": "product_title",
  "property": "color",
  "value": "red"
}

IMPORTANT: If user mentions color, font, size, background - it's STYLING, not layout.
IMPORTANT: If user mentions multiple changes in one message, use the "changes" array format.

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

    let intent;
    try {
      const jsonMatch = intentResult.content.match(/\{[\s\S]*\}/);
      intent = JSON.parse(jsonMatch ? jsonMatch[0] : intentResult.content);
    } catch (error) {
      // Default to chat if can't parse
      intent = { intent: 'chat', action: 'chat' };
    }

    console.log('[AI Chat] Detected intent:', JSON.stringify(intent));
    console.log('[AI Chat] Store ID:', resolvedStoreId);

    // Execute based on intent
    let responseData = null;
    let creditsUsed = intentResult.creditsDeducted;

    if (intent.intent === 'plugin' && intent.action === 'generate') {
      // Generate plugin
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
      const slots = configuration.slots || {};
      const slotOrder = configuration.slotOrder || Object.keys(slots);

      console.log('[AI Chat] Available slots:', Object.keys(slots));
      console.log('[AI Chat] Current slot order:', slotOrder);

      // Use AI to analyze the current layout and determine the changes
      const layoutAnalysisPrompt = `Analyze this slot configuration and help modify it.

CURRENT SLOTS (in order):
${slotOrder.map((id, idx) => `${idx + 1}. ${id}: ${slots[id]?.name || slots[id]?.type || id}`).join('\n')}

USER REQUEST: "${message}"

DETECTED ACTION: ${action}
SOURCE ELEMENT: ${sourceElement || 'not specified'}
TARGET ELEMENT: ${targetElement || 'not specified'}
POSITION: ${position}

Based on the user's request and current slot order, determine:
1. Which slot(s) need to be modified
2. The new order after the modification

Return JSON:
{
  "understood": true/false,
  "sourceSlotId": "exact slot id from the list",
  "targetSlotId": "exact slot id from the list (for move/swap)",
  "action": "move|swap|remove",
  "newOrder": ["slot_id_1", "slot_id_2", ...],
  "description": "human-readable description of what changed",
  "error": "error message if understood is false"
}

IMPORTANT:
- Match slot IDs exactly from the list above
- For "move X above/before Y": place X directly before Y in the array
- For "move X below/after Y": place X directly after Y in the array
- For "swap X and Y": exchange their positions
- For "remove X": exclude X from the new order
- Return the complete newOrder array with all slot IDs

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
          message: analysis.error || "I couldn't determine how to modify the layout. Could you be more specific about which elements you want to move?",
          data: { type: 'layout_error', reason: 'not_understood', analysis },
          creditsDeducted: creditsUsed
        });
      }

      if (!analysis.newOrder || !Array.isArray(analysis.newOrder)) {
        return res.json({
          success: true,
          message: "I couldn't determine the new layout order. Please specify which elements you want to move and where.",
          data: { type: 'layout_error', reason: 'no_new_order' },
          creditsDeducted: creditsUsed
        });
      }

      // Validate the new order contains valid slot IDs
      const validSlotIds = Object.keys(slots);
      const invalidIds = analysis.newOrder.filter(id => !validSlotIds.includes(id));
      if (invalidIds.length > 0) {
        console.warn('[AI Chat] Invalid slot IDs in new order:', invalidIds);
        // Filter out invalid IDs
        analysis.newOrder = analysis.newOrder.filter(id => validSlotIds.includes(id));
      }

      // Build the updated configuration with new order
      const updatedConfiguration = {
        ...configuration,
        slotOrder: analysis.newOrder,
        metadata: {
          ...configuration.metadata,
          lastModified: new Date().toISOString(),
          lastModifiedBy: 'AI Assistant',
          lastLayoutChange: analysis.description
        }
      };

      // Update the slot configuration
      console.log('[AI Chat] Updating layout order for config id:', slotConfig.id);
      console.log('[AI Chat] New order:', analysis.newOrder);

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

      // Generate natural AI response
      const responsePrompt = `The user asked: "${message}"

I modified the layout on the ${pageType} page:
${analysis.description}

Generate a brief, friendly confirmation message (1-2 sentences). Be conversational and helpful. Mention that the preview will refresh to show the changes.`;

      const responseResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: responsePrompt,
        systemPrompt: 'You are a helpful AI assistant. Generate brief, friendly responses. No markdown, no emojis, just natural text.',
        maxTokens: 150,
        temperature: 0.7,
        metadata: { type: 'response-generation', storeId: resolvedStoreId }
      });
      creditsUsed += responseResult.creditsDeducted;

      responseData = {
        type: 'layout_modified',
        pageType,
        action: analysis.action,
        sourceSlotId: analysis.sourceSlotId,
        targetSlotId: analysis.targetSlotId,
        newOrder: analysis.newOrder,
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

      // Generate natural AI response for all changes
      const changesListForPrompt = appliedChanges.map(c => `- ${c.description} (${c.element})`).join('\n');
      const responsePrompt = `The user asked: "${message}"

I applied these styling changes on the ${pageType} page:
${changesListForPrompt}

Generate a brief, friendly confirmation message (1-2 sentences). Be conversational and helpful. Mention that the preview will refresh to show the changes.`;

      const responseResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: responsePrompt,
        systemPrompt: 'You are a helpful AI assistant. Generate brief, friendly responses. No markdown, no emojis, just natural text.',
        maxTokens: 150,
        temperature: 0.7,
        metadata: { type: 'response-generation', storeId: resolvedStoreId }
      });
      creditsUsed += responseResult.creditsDeducted;

      aiConversations.push({
        step: 'response-generation',
        provider: 'anthropic',
        model: responseResult.usage?.model || 'claude-3-haiku',
        prompt: responsePrompt,
        response: responseResult.content,
        tokens: responseResult.usage
      });

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
      // Just chat
      const chatResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: message,
        systemPrompt: `You are a helpful AI assistant for Catalyst e-commerce platform.

You can help users:
- Create plugins: "Create a wishlist plugin"
- Translate content: "Translate all products to French"
- Generate layouts: "Add hero section to homepage"
- Edit code: "Add error handling to this function"

Be friendly and guide them toward what they can build.

Previous conversation: ${JSON.stringify(conversationHistory?.slice(-3) || [])}`,
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
