// backend/src/routes/ai.js
const express = require('express');
const router = express.Router();
const aiService = require('../services/AIService');
const { authMiddleware } = require('../middleware/auth');

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

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }

    // Determine intent from conversation
    const intentPrompt = `Analyze this user message and determine what they want to do.

User message: "${message}"

Previous conversation: ${JSON.stringify(conversationHistory?.slice(-3) || [])}

Determine the intent and respond with JSON:
{
  "intent": "plugin|translation|layout|code|chat",
  "action": "generate|modify|chat",
  "details": {
    // For plugin: { description, category }
    // For translation: { text: "the text to translate", targetLanguages: ["fr", "es"], entities: ["products", "categories"] }
    // For layout: { configType, description }
    // For code: { operation }
  }
}

For translation intent:
- Extract the text to translate (e.g., "add to cart button" → "Add to Cart")
- Extract target language codes (e.g., "French" → "fr", "Spanish" → "es", "German" → "de", "Arabic" → "ar")
- Common language mappings: French=fr, Spanish=es, German=de, Arabic=ar, Chinese=zh, Japanese=ja, Portuguese=pt, Italian=it, Dutch=nl, Russian=ru

Return ONLY valid JSON.`;

    const intentResult = await aiService.generate({
      userId,
      operationType: 'general',
      prompt: intentPrompt,
      systemPrompt: 'You are an intent classifier. Return ONLY valid JSON.',
      maxTokens: 512,
      temperature: 0.3,
      metadata: { type: 'intent-detection' }
    });

    let intent;
    try {
      const jsonMatch = intentResult.content.match(/\{[\s\S]*\}/);
      intent = JSON.parse(jsonMatch ? jsonMatch[0] : intentResult.content);
    } catch (error) {
      // Default to chat if can't parse
      intent = { intent: 'chat', action: 'chat' };
    }

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
      // Handle translation request
      const { text, targetLanguages } = intent.details || {};

      // If no target language specified, ask for it
      if (!targetLanguages || targetLanguages.length === 0) {
        const clarifyResult = await aiService.generate({
          userId,
          operationType: 'general',
          prompt: `The user said: "${message}"\n\nThey want to translate something but didn't specify the target language. Ask them which language(s) they want to translate to. Be friendly and suggest common languages like French (fr), Spanish (es), German (de), Arabic (ar), Chinese (zh), etc.`,
          systemPrompt: 'You are a helpful translation assistant. Ask clarifying questions in a friendly way.',
          maxTokens: 256,
          temperature: 0.7,
          metadata: { type: 'translation-clarification' }
        });

        return res.json({
          success: true,
          message: clarifyResult.content,
          data: {
            type: 'clarification',
            needsLanguage: true
          },
          creditsDeducted: creditsUsed + clarifyResult.creditsDeducted
        });
      }

      // If no text to translate, extract it from the message
      const textToTranslate = text || message.replace(/translate|to|in|into|for|the/gi, '').trim();

      if (!textToTranslate) {
        return res.json({
          success: true,
          message: "I'd be happy to help translate! Could you tell me what text you'd like me to translate?",
          data: {
            type: 'clarification',
            needsText: true
          },
          creditsDeducted: creditsUsed
        });
      }

      // Perform the translation
      const translationService = require('../services/translation-service');
      const results = {};

      for (const targetLang of targetLanguages) {
        try {
          const translated = await translationService._translateWithClaude(
            textToTranslate,
            'en',
            targetLang,
            { type: 'button', location: 'general' }
          );
          results[targetLang] = translated;
        } catch (error) {
          console.error(`Translation to ${targetLang} failed:`, error);
          results[targetLang] = `[Translation failed: ${error.message}]`;
        }
      }

      // Format the response
      const translationsList = Object.entries(results)
        .map(([lang, translation]) => `**${lang.toUpperCase()}**: ${translation}`)
        .join('\n');

      res.json({
        success: true,
        message: `Here are the translations for "${textToTranslate}":\n\n${translationsList}`,
        data: {
          type: 'translation',
          original: textToTranslate,
          translations: results
        },
        creditsDeducted: creditsUsed
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
        metadata: { type: 'chat' }
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
