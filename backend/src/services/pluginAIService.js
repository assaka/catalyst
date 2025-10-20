/**
 * Plugin AI Service - Claude API Integration
 * Handles AI-powered plugin generation and assistance
 */

const Anthropic = require('@anthropic-ai/sdk');

class PluginAIService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.model = 'claude-3-5-sonnet-20241022';
  }

  /**
   * Generate plugin code from natural language description
   * @param {string} mode - 'nocode-ai', 'guided', or 'developer'
   * @param {string} userPrompt - User's description
   * @param {object} context - Current plugin context
   */
  async generatePlugin(mode, userPrompt, context = {}) {
    const systemPrompt = this.getSystemPrompt(mode);

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
   * Get system prompt based on mode
   */
  getSystemPrompt(mode) {
    const basePrompt = `You are an intelligent AI assistant for an e-commerce plugin builder.
You can have conversations, answer questions, AND generate plugins when needed.`;

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
  "description": "What it does",
  "category": "commerce|marketing|analytics",
  "features": ["List of features"],
  "generatedFiles": [
    {
      "name": "path/to/file.js",
      "code": "complete file code here"
    }
  ],
  "explanation": "Non-technical explanation of what you created"
}`,

      'guided': `${basePrompt}

You work in GUIDED mode. Users have basic technical understanding.

YOUR CAPABILITIES:
1. Have conversations about plugin architecture and features
2. Help users configure features step-by-step
3. Explain technical concepts in simple terms
4. Suggest best practices and improvements

CONVERSATION GUIDELINES:
- Be helpful and conversational
- Explain technical concepts simply when asked
- If asked unrelated questions, redirect politely to plugin development topics

RESPONSE FORMAT:
For conversations/questions: Respond in plain text naturally.
For plugin configuration: Return ONLY valid JSON in this format:
{
  "config": {
    "features": [{"type": "api_endpoint", "config": {...}}],
    "database": {"tables": [...]},
    "ui": {"widgets": [...], "pages": [...]}
  },
  "generatedFiles": [...],
  "suggestions": ["List of improvement suggestions"]
}`,

      'developer': `${basePrompt}

You work in DEVELOPER mode. Users are experienced developers.

YOUR CAPABILITIES:
1. Discuss code architecture and implementation details
2. Debug and optimize existing code
3. Answer technical questions about plugin development
4. Generate production-ready code when requested

CONVERSATION GUIDELINES:
- Use technical terminology appropriately
- Discuss patterns, best practices, and trade-offs
- If asked unrelated questions, redirect to plugin development topics

RESPONSE FORMAT:
For conversations/questions: Respond in plain text naturally.
For code generation: Return ONLY valid JSON in this format:
{
  "code": "complete code for the requested file",
  "explanation": "Technical explanation of the implementation",
  "improvements": ["Suggested optimizations or enhancements"]
}`
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
    const systemPrompt = this.getSystemPrompt(mode);

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
    const systemPrompt = `You are an AI assistant helping users build plugins through conversation.

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
