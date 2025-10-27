// backend/src/services/AIService.js
const Anthropic = require('@anthropic-ai/sdk');
const { sequelize } = require('../database/connection');

/**
 * Centralized AI Service
 * Handles all AI model interactions, credit management, and usage tracking
 */
class AIService {
  constructor() {
    this.client = null;
    this.defaultModel = 'claude-3-5-sonnet-20241022';
    this.models = {
      'claude-sonnet': 'claude-3-5-sonnet-20241022',
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

    // Log credit usage
    await sequelize.query(`
      INSERT INTO credit_transactions (
        user_id,
        amount,
        operation_type,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `, {
      bind: [
        userId,
        -cost,
        operationType,
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
}

module.exports = new AIService();
