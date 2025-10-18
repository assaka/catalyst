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
    const basePrompt = `You are an expert plugin generator for an e-commerce platform.
You generate clean, production-ready code following best practices.`;

    const modePrompts = {
      'nocode-ai': `${basePrompt}

You work in NO-CODE mode. Users have ZERO technical knowledge.
- Never mention technical terms (API, webhook, database schemas, etc.)
- Focus on business features and outcomes
- Generate complete, working plugins automatically
- Provide friendly, non-technical explanations

Return JSON in this format:
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
- Help users configure features step-by-step
- Explain technical concepts in simple terms
- Suggest best practices
- Generate configuration and code based on user's visual choices

Return JSON in this format:
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
- Provide production-ready, optimized code
- Include error handling, validation, and security
- Follow SOLID principles and best practices
- Add helpful comments and documentation

Return JSON in this format:
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
      console.error('Failed to parse AI response as JSON:', error);

      // Fallback: return raw text
      return {
        rawResponse: responseText,
        error: 'Failed to parse JSON response'
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
}

module.exports = new PluginAIService();
