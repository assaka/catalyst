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

STANDARD PLUGIN TEMPLATE:
\`\`\`javascript
/**
 * [Plugin Name]
 * [Description]
 *
 * @version 1.0.0
 * @author AI Generated
 */
class PluginName extends Plugin {
  constructor(config = {}) {
    super(config);
    this.config = config;
  }

  static getMetadata() {
    return {
      name: '[Plugin Name]',
      slug: '[plugin-slug]',
      version: '1.0.0',
      description: '[Description]',
      author: 'AI Generated',
      category: 'commerce',
      hooks: ['renderCart'],
      events: []
    };
  }

  async install() {
    await super.install();
    console.log('[Plugin Name] installed');
  }

  async enable() {
    await super.enable();
    console.log('[Plugin Name] enabled');
  }

  async disable() {
    await super.disable();
    console.log('[Plugin Name] disabled');
  }

  // Hook implementations
  renderCart(config, context) {
    try {
      return \`<div class="plugin-container">
        <!-- Plugin HTML here -->
      </div>\`;
    } catch (error) {
      console.error('[Plugin Name] render error:', error);
      return '';
    }
  }
}

module.exports = PluginName;
\`\`\`

RESPONSE FORMAT - Return ONLY valid JSON (no markdown, no explanations):
{
  "name": "Cart Alert Plugin",
  "slug": "cart-alert-plugin",
  "description": "Displays alerts in the shopping cart",
  "category": "commerce",
  "version": "1.0.0",
  "author": "AI Generated",
  "features": ["Cart alerts", "Custom messages", "Configurable styling"],
  "generatedFiles": [
    {
      "name": "index.js",
      "code": "// Complete plugin code following the standard template above"
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
    "hooks": ["renderCart"],
    "events": [],
    "adminNavigation": {
      "enabled": false
    }
  },
  "explanation": "This plugin displays customizable alert messages in the shopping cart to inform customers about special offers or important information."
}

IMPORTANT:
- Use the EXACT same code structure for every plugin
- Always include error handling in hook methods
- Always use template literals for HTML
- Always include JSDoc comments
- Always extend the Plugin base class
- Return ONLY the JSON object, no markdown formatting`;

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
      throw new Error(`Failed to parse plugin data from AI response. AI returned: ${result.content.substring(0, 200)}...`);
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

      // Build manifest
      const manifest = {
        name: pluginData.name,
        version: pluginData.version || '1.0.0',
        generated_by_ai: true,
        generatedFiles: pluginData.generatedFiles || [],
        hooks: pluginData.manifest?.hooks || [],
        events: pluginData.manifest?.events || [],
        adminNavigation: pluginData.manifest?.adminNavigation || null,
        ...pluginData
      };

      // Insert into plugin_registry
      await sequelize.query(`
        INSERT INTO plugin_registry (
          id, name, slug, version, description, author, category, status, type, framework,
          manifest, creator_id, is_installed, is_enabled,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
        )
      `, {
        bind: [
          pluginId,
          pluginData.name,
          slug,
          pluginData.version || '1.0.0',
          pluginData.description || '',
          pluginData.author || 'AI Generated',
          pluginData.category || 'utility',
          'active',
          'ai-generated',
          'react',
          JSON.stringify(manifest),
          userId || null,  // Ensure NULL if userId is undefined
          true,  // is_installed
          true   // is_enabled
        ],
        type: sequelize.QueryTypes.INSERT
      });

      console.log(`✅ Plugin saved to registry: ${pluginData.name} (${pluginId})`);

      // Generate manifest.json content
      const manifestJson = {
        name: pluginData.name,
        slug: slug,
        version: pluginData.version || '1.0.0',
        description: pluginData.description || '',
        author: pluginData.author || 'AI Generated',
        category: pluginData.category || 'utility',
        type: 'ai-generated',
        framework: 'react',
        hooks: pluginData.manifest?.hooks || [],
        events: pluginData.manifest?.events || [],
        adminNavigation: pluginData.manifest?.adminNavigation || null,
        dependencies: pluginData.dependencies || [],
        permissions: pluginData.permissions || [],
        config_schema: pluginData.config_schema || {}
      };

      // Save manifest.json
      await sequelize.query(`
        INSERT INTO plugin_scripts (
          plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, {
        bind: [
          pluginId,
          'manifest.json',
          JSON.stringify(manifestJson, null, 2),
          'json',
          'config',
          0,
          true
        ],
        type: sequelize.QueryTypes.INSERT
      });
      console.log(`  📄 Saved manifest.json`);

      // Generate README.md content
      const readmeContent = `# ${pluginData.name}

${pluginData.description || 'AI-generated plugin for Catalyst e-commerce platform'}

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

${manifest.hooks && manifest.hooks.length > 0 ?
  manifest.hooks.map(h => `- \`${h}\``).join('\n')
  : 'No hooks registered.'}

## Version

- **Version**: ${pluginData.version || '1.0.0'}
- **Author**: ${pluginData.author || 'AI Generated'}
- **Category**: ${pluginData.category || 'utility'}
- **Generated**: ${new Date().toISOString()}

## Support

For issues or questions, please contact the platform administrator.
`;

      // Save README.md
      await sequelize.query(`
        INSERT INTO plugin_scripts (
          plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, {
        bind: [
          pluginId,
          'README.md',
          readmeContent,
          'markdown',
          'docs',
          0,
          true
        ],
        type: sequelize.QueryTypes.INSERT
      });
      console.log(`  📄 Saved README.md`);

      // Save generated files to plugin_scripts table with proper directory structure
      if (pluginData.generatedFiles && pluginData.generatedFiles.length > 0) {
        for (const file of pluginData.generatedFiles) {
          let fileName = file.name || file.filename || 'index.js';
          const fileContent = file.code || file.content || '';

          // Ensure proper directory structure
          // If file doesn't have a path prefix, add 'src/'
          if (!fileName.includes('/') && !fileName.includes('\\')) {
            fileName = `src/${fileName}`;
          }

          if (fileContent) {
            await sequelize.query(`
              INSERT INTO plugin_scripts (
                plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, {
              bind: [
                pluginId,
                fileName,
                fileContent,
                'js',
                'frontend',
                0,
                true
              ],
              type: sequelize.QueryTypes.INSERT
            });

            console.log(`  📄 Saved script: ${fileName}`);
          }
        }
      }

      // Save hooks to plugin_hooks table
      const hooks = pluginData.manifest?.hooks || [];
      if (hooks && hooks.length > 0) {
        for (const hookName of hooks) {
          await sequelize.query(`
            INSERT INTO plugin_hooks (
              plugin_id, hook_name, handler_function, priority, is_enabled
            )
            VALUES ($1, $2, $3, $4, $5)
          `, {
            bind: [
              pluginId,
              hookName,
              `render${hookName.charAt(0).toUpperCase() + hookName.slice(1)}`,
              10,
              true
            ],
            type: sequelize.QueryTypes.INSERT
          });

          console.log(`  🪝 Registered hook: ${hookName}`);
        }
      }

      // Return plugin ID and slug
      return { pluginId, slug };
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
