// backend/src/services/AIService.js
const Anthropic = require('@anthropic-ai/sdk');
const { sequelize } = require('../database/connection');
const aiContextService = require('./aiContextService'); // RAG system

/**
 * Centralized AI Service
 * Handles all AI model interactions, credit management, and usage tracking
 * Integrates with RAG (Retrieval-Augmented Generation) for better context
 */
class AIService {
  constructor() {
    this.client = null;
    this.defaultModel = 'claude-3-haiku-20240307';
    this.models = {
      'claude-sonnet': 'claude-3-sonnet-20240229',
      'claude-opus': 'claude-3-opus-20240229',
      'claude-haiku': 'claude-3-haiku-20240307'
    };

    // Credit costs per operation type (in credits)
    this.operationCosts = {
      'plugin-generation': 50,
      'plugin-modification': 30,
      'translation': 20,
      'layout-generation': 40,
      'code-patch': 25,
      'general': 10
    };
  }

  /**
   * Initialize Anthropic client
   */
  initClient() {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Check if user has sufficient credits
   */
  async checkCredits(userId, operationType) {
    const cost = this.operationCosts[operationType] || this.operationCosts.general;

    const [result] = await sequelize.query(`
      SELECT credits FROM users WHERE id = $1
    `, {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    if (!result || result.credits < cost) {
      return {
        hasCredits: false,
        required: cost,
        available: result?.credits || 0
      };
    }

    return {
      hasCredits: true,
      required: cost,
      available: result.credits
    };
  }

  /**
   * Deduct credits from user account
   */
  async deductCredits(userId, operationType, metadata = {}) {
    const cost = this.operationCosts[operationType] || this.operationCosts.general;

    // Get store_id - use first store if not provided (credit_usage requires non-null store_id)
    let storeId = metadata.storeId;
    if (!storeId) {
      const [store] = await sequelize.query(`
        SELECT id FROM stores LIMIT 1
      `, {
        type: sequelize.QueryTypes.SELECT
      });
      storeId = store?.id || '00000000-0000-0000-0000-000000000000'; // Fallback UUID
    }

    // Map operation types to usage_type values that match existing constraint
    const usageTypeMap = {
      'plugin-generation': 'ai_plugin_generation',
      'plugin-modification': 'ai_plugin_modification',
      'translation': 'ai_translation',
      'layout-generation': 'ai_layout',
      'code-patch': 'ai_code_patch',
      'general': 'ai_chat'
    };

    const usageType = usageTypeMap[operationType] || 'other';

    // Deduct credits
    await sequelize.query(`
      UPDATE users
      SET credits = credits - $1,
          updated_at = NOW()
      WHERE id = $2
    `, {
      bind: [cost, userId],
      type: sequelize.QueryTypes.UPDATE
    });

    // Log credit usage in existing credit_usage table
    await sequelize.query(`
      INSERT INTO credit_usage (
        id,
        user_id,
        store_id,
        credits_used,
        usage_type,
        description,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, {
      bind: [
        require('uuid').v4(),
        userId,
        storeId,
        cost,
        usageType,
        `AI Studio: ${operationType}`,
        JSON.stringify(metadata)
      ],
      type: sequelize.QueryTypes.INSERT
    });

    return cost;
  }

  /**
   * Log AI usage for analytics
   */
  async logUsage(userId, operationType, metadata = {}) {
    await sequelize.query(`
      INSERT INTO ai_usage_logs (
        user_id,
        operation_type,
        model_used,
        tokens_input,
        tokens_output,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, {
      bind: [
        userId,
        operationType,
        metadata.model || this.defaultModel,
        metadata.tokensInput || 0,
        metadata.tokensOutput || 0,
        JSON.stringify(metadata)
      ],
      type: sequelize.QueryTypes.INSERT
    });
  }

  /**
   * Generate AI response with credit deduction
   */
  async generate(options) {
    const {
      userId,
      operationType,
      prompt,
      systemPrompt = '',
      model = this.defaultModel,
      maxTokens = 4096,
      temperature = 0.7,
      metadata = {}
    } = options;

    // Validate user has credits
    const creditCheck = await this.checkCredits(userId, operationType);
    if (!creditCheck.hasCredits) {
      throw new Error(
        `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`
      );
    }

    try {
      // Initialize client
      this.initClient();

      // Prepare messages
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];

      // Call Claude API
      const response = await this.client.messages.create({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt || undefined,
        messages: messages
      });

      // Extract response
      const content = response.content[0].text;
      const usage = {
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        model: model
      };

      // Deduct credits
      await this.deductCredits(userId, operationType, {
        ...metadata,
        ...usage
      });

      // Log usage
      await this.logUsage(userId, operationType, {
        ...metadata,
        ...usage
      });

      return {
        success: true,
        content,
        usage,
        creditsDeducted: this.operationCosts[operationType] || this.operationCosts.general
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
    const {
      userId,
      operationType,
      prompt,
      systemPrompt = '',
      model = this.defaultModel,
      maxTokens = 4096,
      temperature = 0.7,
      metadata = {}
    } = options;

    // Validate user has credits
    const creditCheck = await this.checkCredits(userId, operationType);
    if (!creditCheck.hasCredits) {
      throw new Error(
        `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`
      );
    }

    try {
      // Initialize client
      this.initClient();

      // Prepare messages
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];

      // Stream Claude API
      const stream = await this.client.messages.stream({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt || undefined,
        messages: messages
      });

      let fullContent = '';
      let usage = {
        tokensInput: 0,
        tokensOutput: 0,
        model: model
      };

      // Yield chunks as they arrive
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullContent += text;
          yield text;
        }

        if (chunk.type === 'message_stop') {
          // Get final usage stats
          const message = await stream.finalMessage();
          usage.tokensInput = message.usage.input_tokens;
          usage.tokensOutput = message.usage.output_tokens;
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
    const [result] = await sequelize.query(`
      SELECT credits FROM users WHERE id = $1
    `, {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    return result?.credits || 0;
  }

  /**
   * Get operation cost
   */
  getOperationCost(operationType) {
    return this.operationCosts[operationType] || this.operationCosts.general;
  }

  /**
   * Get user's AI usage history
   */
  async getUserUsageHistory(userId, limit = 50) {
    const results = await sequelize.query(`
      SELECT
        operation_type,
        model_used,
        tokens_input,
        tokens_output,
        metadata,
        created_at
      FROM ai_usage_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, {
      bind: [userId, limit],
      type: sequelize.QueryTypes.SELECT
    });

    return results;
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

    const systemPrompt = `You are an expert plugin developer for the Catalyst e-commerce platform.

${ragContext || '# Catalyst Plugin Architecture\n\nPlugins are JavaScript classes that extend the base Plugin class with hooks, events, and controllers.'}

Generate a complete, production-ready plugin based on the user's description.

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "name": "Plugin Name",
  "slug": "plugin-slug",
  "description": "What the plugin does",
  "category": "commerce|marketing|analytics|integration",
  "version": "1.0.0",
  "author": "Plugin Builder",
  "features": ["Feature 1", "Feature 2"],
  "generatedFiles": [
    {
      "name": "index.js",
      "code": "// Complete plugin code"
    }
  ],
  "config_schema": {
    "fields": [
      {
        "name": "setting_name",
        "type": "text|number|boolean|select",
        "label": "Setting Label",
        "default": "default value"
      }
    ]
  },
  "manifest": {
    "name": "Plugin Name",
    "slug": "plugin-slug",
    "version": "1.0.0",
    "hooks": ["renderHomepageHeader", "renderProductPage"],
    "events": ["product.view", "order.created"],
    "adminNavigation": {
      "enabled": true,
      "label": "My Plugin",
      "icon": "Package",
      "route": "/admin/my-plugin"
    }
  },
  "explanation": "User-friendly explanation of what this plugin does and how to use it"
}`;

    const result = await this.generate({
      userId,
      operationType: 'plugin-generation',
      prompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.7,
      metadata
    });

    // Parse the JSON response
    try {
      let content = result.content;

      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      } else {
        // Try to extract any JSON object
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          content = jsonObjectMatch[0];
        }
      }

      const pluginData = JSON.parse(content);
      return {
        ...result,
        pluginData
      };
    } catch (error) {
      console.error('Failed to parse AI response:', result.content);
      throw new Error(`Failed to parse plugin data from AI response. AI returned: ${result.content.substring(0, 200)}...`);
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
      prompt,
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.7,
      metadata
    });

    try {
      let content = result.content;

      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      } else {
        // Try to extract any JSON object
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          content = jsonObjectMatch[0];
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
