/**
 * Plugin AI Service - Claude API Integration
 * Handles AI-powered plugin generation and assistance
 *
 * RAG INTEGRATION:
 * This service uses the RAG (Retrieval-Augmented Generation) system to enhance
 * plugin generation with relevant context from the database.
 *
 * HOW RAG IS USED:
 * 1. Before generating a plugin, fetch relevant docs/examples from aiContextService
 * 2. Inject that context into the AI system prompt
 * 3. AI uses the context to generate better, more accurate plugins
 *
 * WHAT CONTEXT IS FETCHED:
 * - Architecture documentation (how to build plugins)
 * - Working plugin examples (similar to what user wants)
 * - Code patterns (database migrations, API routes, etc.)
 *
 * See: backend/src/services/RAG_SYSTEM.md for full RAG documentation
 * See: backend/src/services/aiContextService.js for context fetching
 */

const Anthropic = require('@anthropic-ai/sdk');
const aiContextService = require('./aiContextService');

class PluginAIService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.model = 'claude-3-sonnet-20240229';
  }

  /**
   * Generate plugin code from natural language description
   *
   * RAG USAGE:
   * This method ALWAYS fetches RAG context from the database before generating
   * the plugin. The context includes:
   * - Architecture docs (how to structure plugins)
   * - Similar plugin examples (e.g., if user wants "reviews", fetch "reviews" example)
   * - Code patterns (migrations, API endpoints)
   *
   * The fetched context is injected into the system prompt, so the AI knows:
   * - How Catalyst plugins work (architecture)
   * - What similar plugins look like (examples)
   * - How to implement specific features (patterns)
   *
   * @param {string} mode - 'nocode' | 'developer' - Which builder mode
   * @param {string} userPrompt - User's natural language description of what they want
   * @param {object} context - Additional context
   * @param {string} context.category - 'commerce' | 'marketing' | 'analytics' etc.
   * @param {number} context.storeId - Store ID for store-specific context
   *
   * @returns {Promise<Object>} Parsed plugin code and metadata
   *
   * @example
   * const plugin = await pluginAIService.generatePlugin(
   *   'nocode',
   *   'Create a wishlist plugin where users can save products',
   *   { category: 'commerce', storeId: 123 }
   * );
   */
  async generatePlugin(mode, userPrompt, context = {}) {
    // ⚡ RAG: Fetch relevant context from database (5 docs + 3 examples + 5 patterns)
    // This gives the AI knowledge about:
    // - How to build Catalyst plugins (docs)
    // - Similar working plugins (examples)
    // - Code snippets for specific tasks (patterns)
    const dynamicContext = await aiContextService.getContextForQuery({
      mode,                      // 'nocode' or 'developer' - filters docs by audience
      category: context.category, // 'commerce', 'marketing' etc - finds relevant examples
      query: userPrompt,          // User's prompt - used for future vector search
      storeId: context.storeId,   // Optional store-specific context
      limit: 13                   // Total: 5 docs + 3 examples + 5 patterns
    });

    const systemPrompt = await this.getSystemPrompt(mode, dynamicContext);

    const message = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: this.buildUserPrompt(mode, userPrompt, context)
      }]
    });

    return this.parseAIResponse(message.content[0].text, mode);
  }

  /**
   * Generate code suggestions for developer mode
   */
  async generateCodeSuggestion(fileName, currentCode, prompt) {
    const message = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2048,
      temperature: 0.5,
      system: `You are an expert JavaScript/React developer helping to improve plugin code.
Provide clean, production-ready code following best practices.`,
      messages: [{
        role: 'user',
        content: `File: ${fileName}

Current code:
\`\`\`javascript
${currentCode}
\`\`\`

Request: ${prompt}

Please provide the improved code.`
      }]
    });

    return message.content[0].text;
  }

  /**
   * Answer questions about plugin development
   */
  async answerQuestion(question, pluginContext) {
    const message = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1024,
      temperature: 0.3,
      system: `You are a helpful plugin development assistant. Answer questions clearly and concisely.
Focus on practical, actionable advice.`,
      messages: [{
        role: 'user',
        content: `Plugin context: ${JSON.stringify(pluginContext, null, 2)}

Question: ${question}`
      }]
    });

    return message.content[0].text;
  }

  /**
   * Get system prompt with RAG context injected
   *
   * RAG CONTEXT INJECTION:
   * The dynamicContext parameter contains formatted markdown from the database:
   * - Knowledge base documents (architecture, best practices)
   * - Working plugin examples (similar code to reference)
   * - Code patterns (reusable snippets)
   *
   * This context is injected BEFORE the base prompt, so the AI has all the
   * knowledge it needs about:
   * - How Catalyst plugins are structured
   * - What similar plugins look like
   * - How to implement specific features
   *
   * FALLBACK:
   * If dynamicContext is null (RAG fetch failed), falls back to hardcoded
   * architecture docs. This ensures the AI always has SOME context.
   *
   * @param {string} mode - 'nocode' | 'developer'
   * @param {string} dynamicContext - Formatted markdown from aiContextService.getContextForQuery()
   *
   * @returns {Promise<string>} Complete system prompt with RAG context
   */
  async getSystemPrompt(mode, dynamicContext = null) {
    // ⚡ RAG: Use dynamic context from database (preferred)
    // Falls back to hardcoded context if database fetch failed
    const pluginArchitectureContext = dynamicContext || `
# CATALYST PLUGIN ARCHITECTURE (FALLBACK - Update database for latest context!)

## Tech Stack
- Backend: Node.js + Express
- Frontend: React + Vite
- Database: PostgreSQL with Sequelize ORM
- NO PHP - This is a JavaScript/Node.js system!
- NO jQuery - Use modern JavaScript/React!

## Plugin Structure
Plugins are ES6 JavaScript classes that extend the base Plugin class:

\`\`\`javascript
const Plugin = require('../core/Plugin');

class MyPlugin extends Plugin {
  constructor(config = {}) {
    super(config);
    // Initialize plugin properties
  }

  static getMetadata() {
    return {
      name: 'My Plugin Name',
      slug: 'my-plugin',
      version: '1.0.0',
      description: 'What the plugin does',
      author: 'Author Name',
      category: 'commerce|marketing|analytics|integration',
      dependencies: [],
      permissions: []
    };
  }

  async install() {
    await super.install();
    await this.runMigrations();
    // Custom installation logic
  }

  async enable() {
    await this.registerHooks();
    await this.registerRoutes();
    // Start services
  }

  async disable() {
    await this.stopServices();
    // Cleanup
  }

  // Hook methods - render HTML for different page areas
  renderHomepageHeader(config, context) {
    return \`<div>HTML content here</div>\`;
  }

  renderHomepageContent(config, context) {
    return \`<div>More content</div>\`;
  }
}

module.exports = MyPlugin;
\`\`\`

## Simple Plugin Example (No Database)
For simple plugins that just display content:

\`\`\`javascript
class SimplePlugin {
  constructor() {
    this.name = 'Simple Plugin';
    this.version = '1.0.0';
  }

  renderHomepageHeader(config, context) {
    const { message = 'Hello!' } = config;
    return \`
      <div style="padding: 20px; background: #f0f8ff;">
        <h3>\${message}</h3>
        <p>Welcome to \${context.store.name}</p>
      </div>
    \`;
  }

  onEnable() { console.log('Plugin enabled'); }
  onDisable() { console.log('Plugin disabled'); }
}

module.exports = SimplePlugin;
\`\`\`

## Available Hooks
Plugins can implement these render methods:
- renderHomepageHeader(config, context) - Top of homepage
- renderHomepageContent(config, context) - Main homepage content
- renderProductPage(config, context) - Product pages
- renderCheckout(config, context) - Checkout flow
- renderOrderConfirmation(config, context) - After order

## Context Object
The context parameter contains:
- context.store - Store information {id, name, settings}
- context.user - Current user (if logged in)
- context.product - Product data (for product hooks)
- context.order - Order data (for order hooks)

## Database (Sequelize ORM)
For plugins that need data storage:

\`\`\`javascript
async runMigrations() {
  const { DataTypes } = require('sequelize');
  const sequelize = require('../database');

  // Create table
  await sequelize.getQueryInterface().createTable('plugin_data', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    store_id: { type: DataTypes.INTEGER },
    data: { type: DataTypes.JSON },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE }
  });
}
\`\`\`

## API Routes
To add custom API endpoints:

\`\`\`javascript
async registerRoutes() {
  const express = require('express');
  const router = express.Router();

  router.post('/api/my-plugin/action', async (req, res) => {
    // Handle request
    res.json({ success: true });
  });

  return router;
}
\`\`\`
`;

    const basePrompt = `You are an intelligent AI assistant for the Catalyst e-commerce plugin builder.
You can have conversations, answer questions, AND generate plugins when needed.

${pluginArchitectureContext}`;

    const modePrompts = {
      'nocode-ai': `${basePrompt}

You work in NO-CODE mode. Users have ZERO technical knowledge.

YOUR CAPABILITIES:
1. Have friendly conversations and answer questions about plugins
2. Detect when user wants to CREATE a new plugin
3. Detect when user wants to MODIFY/ENHANCE an existing plugin
4. Guide users through the plugin creation process
5. Explain what plugins can do in simple terms

CONVERSATION GUIDELINES:
- Be friendly, helpful, and conversational
- Never mention technical terms (API, webhook, database schemas, etc.)
- Focus on business features and outcomes
- If asked something unrelated to e-commerce plugins, politely redirect: "I'm here to help you build e-commerce plugins! Ask me to create features like customer reviews, loyalty points, wishlists, or custom checkout options."

WHEN TO GENERATE A PLUGIN:
Only return JSON plugin code when the user clearly wants to:
- CREATE a new plugin (e.g., "create a wishlist", "build a reviews system")
- ADD features to their store (e.g., "I need loyalty points", "add product recommendations")

If they're just asking questions or chatting, respond conversationally in plain text.

RESPONSE FORMAT:
For conversations/questions: Respond in plain text naturally.
For plugin generation: Return ONLY valid JSON in this EXACT format:
{
  "name": "Plugin Name",
  "slug": "plugin-name",
  "description": "What it does",
  "category": "commerce|marketing|analytics|integration",
  "version": "1.0.0",
  "author": "Plugin Builder",
  "features": ["List of features in simple terms"],
  "plugin_structure": {
    "main_file": "// Complete plugin code as string",
    "manifest": {
      "name": "Plugin Name",
      "slug": "plugin-name",
      "version": "1.0.0",
      "description": "What it does",
      "category": "commerce|marketing|analytics|integration",
      "adminNavigation": {
        "enabled": true,
        "label": "My Plugin",
        "icon": "Package",
        "route": "/admin/my-plugin",
        "order": 100,
        "parentKey": null
      }
    }
  },
  "generatedFiles": [
    {
      "name": "index.js",
      "code": "// Complete plugin code"
    }
  ],
  "explanation": "Non-technical explanation: This plugin helps you [benefit]. It works by [simple description]. You can configure [settings]."
}

ADMIN NAVIGATION:
- Include adminNavigation in manifest if the plugin needs an admin page
- Use appropriate Lucide icons (Package, ShoppingCart, Users, Settings, etc.)
- Set order: 1-50 for core features, 51-100 for plugins, 100+ for utilities
- Leave parentKey null for top-level items, or use existing keys like "products", "orders"

IMPORTANT CODE REQUIREMENTS:
- Use the Simple Plugin structure for basic plugins (no database)
- Use the full Plugin class for complex plugins (with database/APIs)
- Return complete, runnable JavaScript code
- Include proper error handling
- Use template literals for HTML generation
- Escape user input to prevent XSS
- Follow the exact hook method signatures shown above
- Store the complete plugin code in plugin_structure.main_file as a STRING`,

      'guided': `${basePrompt}

You work in GUIDED mode. Users have basic technical understanding.

YOUR CAPABILITIES:
1. Have conversations about plugin architecture and features
2. Help users configure features step-by-step
3. Explain technical concepts in simple terms
4. Suggest best practices and improvements
5. Generate plugin code following the Catalyst structure

CONVERSATION GUIDELINES:
- Be helpful and conversational
- Explain technical concepts simply when asked
- Reference the plugin structure examples above
- If asked unrelated questions, redirect politely to plugin development topics

RESPONSE FORMAT:
For conversations/questions: Respond in plain text naturally.
For plugin generation: Return ONLY valid JSON following the exact structure shown in the architecture context above.`,

      'developer': `${basePrompt}

You work in DEVELOPER mode. Users are experienced developers.

YOUR CAPABILITIES:
1. Discuss code architecture and implementation details
2. Debug and optimize existing code
3. Answer technical questions about plugin development
4. Generate production-ready, well-architected plugin code
5. Explain Sequelize ORM patterns and Node.js best practices

CONVERSATION GUIDELINES:
- Use technical terminology appropriately
- Discuss patterns, best practices, and trade-offs
- Reference the Plugin base class and available methods
- Suggest performance optimizations and security improvements
- If asked unrelated questions, redirect to plugin development topics

RESPONSE FORMAT:
For conversations/questions: Respond in plain text naturally.
For code generation: Return ONLY valid JSON in this format:
{
  "name": "Plugin Name",
  "slug": "plugin-slug",
  "description": "Technical description",
  "category": "commerce|marketing|analytics|integration",
  "generatedFiles": [
    {
      "name": "index.js",
      "code": "// Complete plugin code following Catalyst structure"
    },
    {
      "name": "README.md",
      "code": "# Technical documentation"
    }
  ],
  "explanation": "Technical explanation of architecture, patterns used, and implementation details",
  "improvements": ["Suggested optimizations or enhancements"]
}

IMPORTANT: Always generate complete, production-ready plugins following the Catalyst Plugin architecture above.`
    };

    return modePrompts[mode] || basePrompt;
  }

  /**
   * Build user prompt with context
   */
  buildUserPrompt(mode, userPrompt, context) {
    let prompt = '';

    if (mode === 'nocode-ai') {
      prompt = `User wants to create: ${userPrompt}

Current plugin state: ${JSON.stringify(context, null, 2)}

Generate a complete plugin with all necessary code, database tables, and UI components.
Remember: Use NO technical jargon. Focus on business value.`;
    } else if (mode === 'guided') {
      prompt = `User is building a plugin with these requirements: ${userPrompt}

Current configuration: ${JSON.stringify(context, null, 2)}

Help them configure the plugin step-by-step. Suggest database tables, features, and UI components.`;
    } else if (mode === 'developer') {
      prompt = `Developer request: ${userPrompt}

Current file: ${context.currentFile?.name || 'N/A'}
Current code:
\`\`\`javascript
${context.currentCode || '// Empty file'}
\`\`\`

Provide production-ready code with proper error handling and best practices.`;
    }

    return prompt;
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(responseText, mode) {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse entire response as JSON
      return JSON.parse(responseText);
    } catch (error) {
      // Not JSON - this is a conversational response
      console.log('AI returned conversational response (not JSON)');

      // Return plain text response in a format the frontend can handle
      // The frontend will display this as a regular chat message
      return {
        type: 'conversation',
        message: responseText,
        isConversational: true
      };
    }
  }

  /**
   * Generate plugin from template
   */
  async generateFromTemplate(templateId, customization = {}) {
    const templates = {
      reviews: {
        name: 'Product Reviews',
        description: '5-star rating system with customer reviews',
        prompt: 'Create a product review system with star ratings, written reviews, and photo uploads'
      },
      wishlist: {
        name: 'Customer Wishlist',
        description: 'Let customers save favorite products',
        prompt: 'Create a wishlist feature where customers can save and manage their favorite products'
      },
      loyalty: {
        name: 'Loyalty Points',
        description: 'Reward repeat customers with points',
        prompt: 'Create a loyalty points system that rewards customers for purchases and allows redemption'
      }
    };

    const template = templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const fullPrompt = `${template.prompt}. ${customization.additionalRequirements || ''}`;

    return await this.generatePlugin('nocode-ai', fullPrompt, {
      templateId,
      ...customization
    });
  }

  /**
   * Chat with AI assistant (streaming response)
   */
  async chat(messages, mode = 'nocode-ai') {
    // Get dynamic context for chat
    const dynamicContext = await aiContextService.getContextForQuery({
      mode,
      query: messages[messages.length - 1]?.content || '',
      limit: 5
    });

    const systemPrompt = await this.getSystemPrompt(mode, dynamicContext);

    const stream = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true
    });

    return stream;
  }

  /**
   * Enhanced chat with context tracking for no-code builder
   */
  async chatWithContext({ message, mode, conversationHistory, pluginConfig, currentStep }) {
    // Fetch relevant context from database
    const dynamicContext = await aiContextService.getContextForQuery({
      mode: mode || 'nocode',
      category: pluginConfig.category,
      query: message,
      storeId: pluginConfig.storeId,
      limit: 8
    });

    const systemPrompt = `You are an AI assistant helping users build plugins through conversation.

${dynamicContext}

Your role:
- Ask clarifying questions to understand what they want to build
- Provide friendly, helpful guidance without technical jargon
- Extract plugin details from their responses
- Update the plugin configuration as you learn more
- Suggest next steps to keep the conversation flowing

Current plugin state: ${JSON.stringify(pluginConfig, null, 2)}
Current step: ${currentStep}

When you respond:
1. Provide a helpful, conversational response
2. Ask follow-up questions if needed
3. Extract any plugin details mentioned (name, features, database needs, etc.)

Be conversational, friendly, and guide them naturally through the process.`;

    // Build conversation context
    const messages = [];

    // Add recent conversation history (last 5 messages)
    conversationHistory.slice(-5).forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Create streaming response
    const stream = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages,
      stream: true
    });

    // Parse the response to extract plugin config and suggestions
    let fullResponse = '';
    const responseStream = {
      stream,
      config: pluginConfig,
      step: currentStep,
      suggestions: []
    };

    return responseStream;
  }

  /**
   * Generate smart contextual suggestions for next steps
   */
  async generateSmartSuggestions({ context, currentStep, pluginConfig, recentMessages, userMessage }) {
    const systemPrompt = `You are an AI assistant that generates helpful suggestions for building plugins.

Based on the conversation context, generate 2-4 short, actionable questions or prompts that would help move the conversation forward.

Current context: ${context}
Current step: ${currentStep}
Plugin config so far: ${JSON.stringify(pluginConfig, null, 2)}
Recent conversation: ${JSON.stringify(recentMessages.slice(-3), null, 2)}
Latest user message: ${userMessage}

Generate suggestions that:
- Help clarify requirements
- Explore additional features
- Move toward completing the plugin
- Are phrased as questions the user might ask

Return ONLY a JSON array of 2-4 short suggestion strings, like:
["What features will this have?", "Will this need database storage?", "How should users access this?"]`;

    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 512,
        temperature: 0.8,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: 'Generate suggestions for the next steps in this conversation.'
        }]
      });

      const responseText = message.content[0].text;

      // Try to parse JSON array
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback suggestions based on context
      return this.getFallbackSuggestions(currentStep, pluginConfig);
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      return this.getFallbackSuggestions(currentStep, pluginConfig);
    }
  }

  /**
   * Get fallback suggestions when AI generation fails
   */
  getFallbackSuggestions(currentStep, pluginConfig) {
    if (!pluginConfig.name) {
      return [
        "What should we call this plugin?",
        "What problem does this solve?",
        "Who will use this plugin?"
      ];
    }

    if (!pluginConfig.features || pluginConfig.features.length === 0) {
      return [
        "What features do you need?",
        "Should users be able to input data?",
        "Do you need any automated tasks?"
      ];
    }

    return [
      "Should we add more features?",
      "Do you need database storage?",
      "I'm ready to generate the plugin - shall we proceed?"
    ];
  }
}

module.exports = new PluginAIService();
