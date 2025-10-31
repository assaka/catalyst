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
      // AI-DRIVEN TRANSLATION HANDLER
      // Let the AI understand the context and make decisions
      const { sequelize } = require('../database/connection');
      const translationService = require('../services/translation-service');

      // Step 1: Let AI analyze the request and search for relevant translations
      const analysisPrompt = `The user wants to translate something in their e-commerce store.

User request: "${message}"
Previous context: ${JSON.stringify(conversationHistory?.slice(-2) || [])}

Analyze this request and provide:
1. What text/label they want to translate (e.g., "Add to Cart", "Buy Now")
2. Target language codes (e.g., ["fr", "es", "de"])
3. Suggested translation keys to search for (e.g., ["add_to_cart", "addtocart", "add to cart"])

Return JSON:
{
  "textToTranslate": "Add to Cart",
  "targetLanguages": ["fr", "es"],
  "searchTerms": ["add_to_cart", "add to cart", "addtocart", "cart.add"],
  "needsClarification": false,
  "clarificationQuestion": null
}

If you need to ask for clarification (missing language or unclear text), set needsClarification: true`;

      const analysisResult = await aiService.generate({
        userId,
        operationType: 'general',
        prompt: analysisPrompt,
        systemPrompt: 'You are an AI translation assistant. Analyze user requests and extract structured information. Return ONLY valid JSON.',
        maxTokens: 512,
        temperature: 0.3,
        metadata: { type: 'translation-analysis' }
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

      // Step 2: If AI needs clarification, ask the user
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

      const matchingKeys = await sequelize.query(`
        SELECT DISTINCT key, value, language_code
        FROM translations
        WHERE ${searchConditions}
        ORDER BY language_code, key
        LIMIT 20
      `, {
        bind: searchBindings,
        type: sequelize.QueryTypes.SELECT
      });

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
          metadata: { type: 'key-selection' }
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
        metadata: { type: 'translation-suggestion' }
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

    } else {
      // Check if this is a confirmation for a previous action
      const isConfirmation = /^(yes|yeah|yep|sure|ok|okay|do it|update|apply|confirm)/i.test(message.trim());

      if (isConfirmation && conversationHistory && conversationHistory.length > 0) {
        // Check if the last message had a pending action
        const lastMessage = conversationHistory[conversationHistory.length - 1];
        if (lastMessage?.data?.type === 'translation_preview' && lastMessage?.data?.action === 'update_labels') {
          // User confirmed - update the translations
          const { translations, matchingKeys, original } = lastMessage.data;
          const { sequelize } = require('../database/connection');
          const Translation = require('../models/Translation');

          let updatedCount = 0;
          const updates = [];

          for (const [key, langData] of Object.entries(matchingKeys)) {
            for (const targetLang of Object.keys(translations)) {
              try {
                // Check if translation exists
                const existing = await Translation.findOne({
                  where: { key, language_code: targetLang }
                });

                if (existing) {
                  // Update existing
                  await existing.update({ value: translations[targetLang] });
                } else {
                  // Create new translation
                  await Translation.create({
                    key,
                    language_code: targetLang,
                    value: translations[targetLang],
                    category: 'common',
                    type: 'system'
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
            creditsDeducted: creditsUsed
          });
        }
      }

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
