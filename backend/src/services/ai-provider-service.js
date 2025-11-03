/**
 * Unified AI Provider Service
 *
 * Centralized service for managing all AI providers (Anthropic, OpenAI, DeepSeek, Gemini, etc.)
 * Provides consistent interface for AI operations across the application
 *
 * BENEFITS:
 * - Single source of truth for AI provider management
 * - Easy to add new providers (just add to providers map)
 * - Consistent error handling across all AI operations
 * - Provider fallback support
 * - Centralized API key management
 *
 * USAGE:
 * const aiProvider = require('./ai-provider-service');
 * const result = await aiProvider.chat(messages, { provider: 'anthropic' });
 * const translation = await aiProvider.translate(text, 'en', 'nl');
 */

const Anthropic = require('@anthropic-ai/sdk');

class AIProviderService {
  constructor() {
    // Provider instances (lazy loaded)
    this.providers = {
      anthropic: null,
      openai: null,
      deepseek: null,
      gemini: null
    };

    // Default models for each provider
    this.defaultModels = {
      anthropic: 'claude-3-haiku-20240307',
      openai: 'gpt-3.5-turbo',
      deepseek: 'deepseek-chat',
      gemini: 'gemini-pro'
    };

    // Provider-specific API keys
    this.apiKeys = {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      gemini: process.env.GEMINI_API_KEY
    };
  }

  /**
   * Check if a provider is available (has API key configured)
   */
  isProviderAvailable(providerName) {
    return !!this.apiKeys[providerName];
  }

  /**
   * Get the first available provider (in priority order)
   */
  getFirstAvailableProvider() {
    const priority = ['anthropic', 'openai', 'deepseek', 'gemini'];
    for (const provider of priority) {
      if (this.isProviderAvailable(provider)) {
        return provider;
      }
    }
    return null;
  }

  /**
   * Initialize a specific provider client
   */
  initProvider(providerName) {
    const apiKey = this.apiKeys[providerName];

    if (!apiKey) {
      console.warn(`⚠️  ${providerName} API key not configured`);
      return null;
    }

    if (this.providers[providerName]) {
      return this.providers[providerName]; // Already initialized
    }

    try {
      if (providerName === 'anthropic') {
        this.providers.anthropic = new Anthropic({ apiKey });
        console.log('✅ Anthropic client initialized');
      } else if (providerName === 'openai') {
        // OpenAI uses fetch, no SDK initialization needed
        console.log('✅ OpenAI client ready (fetch-based)');
      } else if (providerName === 'deepseek') {
        // DeepSeek setup (future)
        console.log('⚠️  DeepSeek not yet implemented');
      } else if (providerName === 'gemini') {
        // Gemini setup (future)
        console.log('⚠️  Gemini not yet implemented');
      }

      return this.providers[providerName];
    } catch (error) {
      console.error(`❌ Failed to initialize ${providerName}:`, error.message);
      return null;
    }
  }

  /**
   * Get or initialize a provider
   */
  getProvider(providerName) {
    if (this.providers[providerName]) {
      return this.providers[providerName];
    }
    return this.initProvider(providerName);
  }

  /**
   * Chat/Completion - Unified interface for all providers
   *
   * @param {Array} messages - Chat messages [{ role: 'user', content: '...' }]
   * @param {Object} options - { provider, model, temperature, maxTokens, systemPrompt }
   * @returns {Promise<Object>} { content, usage: { input_tokens, output_tokens }, provider, model }
   */
  async chat(messages, options = {}) {
    const {
      provider = this.getFirstAvailableProvider(),
      model = this.defaultModels[provider],
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt = null
    } = options;

    if (!provider) {
      throw new Error('No AI provider available. Please configure at least one API key.');
    }

    console.log(`🤖 AI Provider: ${provider}, Model: ${model}`);

    if (provider === 'anthropic') {
      return await this._chatAnthropic(messages, { model, temperature, maxTokens, systemPrompt });
    } else if (provider === 'openai') {
      return await this._chatOpenAI(messages, { model, temperature, maxTokens, systemPrompt });
    } else if (provider === 'deepseek') {
      throw new Error('DeepSeek not yet implemented');
    } else if (provider === 'gemini') {
      throw new Error('Gemini not yet implemented');
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Translate text - Optimized for translation with context
   *
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @param {Object} options - { provider, context, ragContext }
   * @returns {Promise<Object>} { translatedText, usage, provider, model }
   */
  async translate(text, fromLang, toLang, options = {}) {
    const {
      provider = this.getFirstAvailableProvider(),
      context = {},
      ragContext = ''
    } = options;

    const { type = 'general', location = 'unknown', maxLength } = context;

    // Build translation prompt
    const systemPrompt = `You are a professional translator specializing in e-commerce localization.

${ragContext}

Guidelines:
- Preserve HTML tags, placeholders {{variables}}, and special characters
- Maintain the tone and formality of the original
- Use natural, idiomatic expressions
- Follow e-commerce terminology conventions
- Consider cultural adaptation where appropriate`;

    const userPrompt = `Translate from ${fromLang} to ${toLang}.

Context:
- Type: ${type} (button, heading, label, paragraph, description)
- Location: ${location} (cart, checkout, product, homepage)
${maxLength ? `- Max length: ${maxLength} characters` : ''}

Text to translate:
${text}

Return ONLY the translated text, no explanations or notes.`;

    const messages = [{ role: 'user', content: userPrompt }];

    const result = await this.chat(messages, {
      provider,
      model: this.defaultModels[provider],
      temperature: 0.3, // Lower temperature for consistent translations
      maxTokens: 1024,
      systemPrompt
    });

    return {
      translatedText: result.content,
      usage: result.usage,
      provider: result.provider,
      model: result.model
    };
  }

  /**
   * Anthropic-specific chat implementation
   */
  async _chatAnthropic(messages, options) {
    const client = this.getProvider('anthropic');

    if (!client) {
      throw new Error('Anthropic client not available. Check ANTHROPIC_API_KEY configuration.');
    }

    const { model, temperature, maxTokens, systemPrompt } = options;

    try {
      console.log(`   🌍 ANTHROPIC API CALL`);
      console.log(`   🤖 Model: ${model}`);

      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt || undefined,
        messages
      });

      const content = response.content[0].text;

      console.log(`   ✅ ANTHROPIC API RESPONSE received`);
      console.log(`   📊 Tokens: input=${response.usage.input_tokens}, output=${response.usage.output_tokens}`);

      return {
        content,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        },
        provider: 'anthropic',
        model
      };
    } catch (error) {
      console.error(`   ❌ ANTHROPIC API ERROR:`, error.message);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  /**
   * OpenAI-specific chat implementation
   */
  async _chatOpenAI(messages, options) {
    const apiKey = this.apiKeys.openai;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { model, temperature, maxTokens, systemPrompt } = options;

    try {
      console.log(`   🌍 OPENAI API CALL`);
      console.log(`   🤖 Model: ${model}`);

      const fetch = (await import('node-fetch')).default;

      // OpenAI format: system message goes in messages array
      const openaiMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: openaiMessages,
          temperature,
          max_tokens: maxTokens
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.error?.message || `API request failed with status ${response.status}`;
        throw new Error(`OpenAI API error: ${errorMessage}`);
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from OpenAI API');
      }

      const content = data.choices[0].message.content;

      console.log(`   ✅ OPENAI API RESPONSE received`);
      console.log(`   📊 Tokens: input=${data.usage?.prompt_tokens || 0}, output=${data.usage?.completion_tokens || 0}`);

      return {
        content,
        usage: {
          input_tokens: data.usage?.prompt_tokens || 0,
          output_tokens: data.usage?.completion_tokens || 0
        },
        provider: 'openai',
        model
      };
    } catch (error) {
      console.error(`   ❌ OPENAI API ERROR:`, error.message);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Get available providers (for UI selection)
   */
  getAvailableProviders() {
    return Object.keys(this.apiKeys)
      .filter(provider => this.isProviderAvailable(provider))
      .map(provider => ({
        name: provider,
        displayName: this._getProviderDisplayName(provider),
        defaultModel: this.defaultModels[provider],
        available: true
      }));
  }

  /**
   * Get provider display name
   */
  _getProviderDisplayName(provider) {
    const names = {
      anthropic: 'Anthropic (Claude)',
      openai: 'OpenAI (GPT)',
      deepseek: 'DeepSeek',
      gemini: 'Google Gemini'
    };
    return names[provider] || provider;
  }
}

// Export singleton instance
module.exports = new AIProviderService();
