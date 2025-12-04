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
      gemini: null,
      groq: null
    };

    // Default models for each provider
    this.defaultModels = {
      anthropic: 'claude-3-haiku-20240307',
      openai: 'gpt-4o-mini',
      deepseek: 'deepseek-chat',
      gemini: 'gemini-1.5-flash',
      groq: 'llama-3.1-70b-versatile'
    };

    // Provider-specific API keys
    this.apiKeys = {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY
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
    const priority = ['anthropic', 'openai', 'groq', 'gemini', 'deepseek'];
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
        this.providers.openai = { ready: true };
        console.log('✅ OpenAI client ready (fetch-based)');
      } else if (providerName === 'groq') {
        // Groq uses OpenAI-compatible API
        this.providers.groq = { ready: true };
        console.log('✅ Groq client ready (OpenAI-compatible)');
      } else if (providerName === 'gemini') {
        // Gemini uses REST API
        this.providers.gemini = { ready: true };
        console.log('✅ Gemini client ready (REST-based)');
      } else if (providerName === 'deepseek') {
        // DeepSeek uses OpenAI-compatible API
        this.providers.deepseek = { ready: true };
        console.log('✅ DeepSeek client ready (OpenAI-compatible)');
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
   * @param {Object} options - { provider, model, temperature, maxTokens, systemPrompt, images }
   * @returns {Promise<Object>} { content, usage: { input_tokens, output_tokens }, provider, model }
   */
  async chat(messages, options = {}) {
    const {
      provider = this.getFirstAvailableProvider(),
      model = this.defaultModels[provider],
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt = null,
      images = null // Array of { base64, type } for vision support
    } = options;

    if (!provider) {
      throw new Error('No AI provider available. Please configure at least one API key.');
    }

    console.log(`🤖 AI Provider: ${provider}, Model: ${model}${images ? `, Images: ${images.length}` : ''}`);

    if (provider === 'anthropic') {
      return await this._chatAnthropic(messages, { model, temperature, maxTokens, systemPrompt, images });
    } else if (provider === 'openai') {
      return await this._chatOpenAI(messages, { model, temperature, maxTokens, systemPrompt, images });
    } else if (provider === 'groq') {
      // Groq doesn't support vision yet, fall back to text-only
      if (images && images.length > 0) {
        console.warn('⚠️  Groq does not support vision. Images will be ignored.');
      }
      return await this._chatGroq(messages, { model, temperature, maxTokens, systemPrompt });
    } else if (provider === 'gemini') {
      return await this._chatGemini(messages, { model, temperature, maxTokens, systemPrompt, images });
    } else if (provider === 'deepseek') {
      // DeepSeek doesn't support vision yet, fall back to text-only
      if (images && images.length > 0) {
        console.warn('⚠️  DeepSeek does not support vision. Images will be ignored.');
      }
      return await this._chatDeepSeek(messages, { model, temperature, maxTokens, systemPrompt });
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

    // Calculate maxTokens based on input length - longer texts need more output tokens
    // Claude Haiku supports up to 4096 output tokens, GPT-3.5 supports up to 4096
    const inputLength = text.length;
    const estimatedTokens = Math.ceil(inputLength / 3); // Rough estimate: 3 chars per token
    const dynamicMaxTokens = Math.min(Math.max(estimatedTokens * 2, 2048), 8192); // At least 2048, max 8192

    const result = await this.chat(messages, {
      provider,
      model: this.defaultModels[provider],
      temperature: 0.3, // Lower temperature for consistent translations
      maxTokens: dynamicMaxTokens,
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

    const { model, temperature, maxTokens, systemPrompt, images } = options;

    try {
      console.log(`   🌍 ANTHROPIC API CALL`);
      console.log(`   🤖 Model: ${model}`);

      // Transform messages to include images if provided
      let transformedMessages = messages;
      if (images && images.length > 0) {
        transformedMessages = messages.map((msg, idx) => {
          // Only add images to the last user message
          if (msg.role === 'user' && idx === messages.length - 1) {
            const content = [];

            // Add images first
            for (const img of images) {
              // Extract base64 data (remove data:image/xxx;base64, prefix if present)
              let base64Data = img.base64;
              let mediaType = img.type || 'image/jpeg';

              if (base64Data.startsWith('data:')) {
                const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                  mediaType = matches[1];
                  base64Data = matches[2];
                }
              }

              content.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              });
            }

            // Add text after images
            content.push({
              type: 'text',
              text: msg.content
            });

            return { role: msg.role, content };
          }
          return msg;
        });

        console.log(`   📷 Images attached: ${images.length}`);
      }

      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt || undefined,
        messages: transformedMessages
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

    const { model, temperature, maxTokens, systemPrompt, images } = options;

    try {
      console.log(`   🌍 OPENAI API CALL`);
      console.log(`   🤖 Model: ${model}`);

      const fetch = (await import('node-fetch')).default;

      // Transform messages to include images if provided
      let transformedMessages = messages;
      if (images && images.length > 0) {
        transformedMessages = messages.map((msg, idx) => {
          // Only add images to the last user message
          if (msg.role === 'user' && idx === messages.length - 1) {
            const content = [];

            // Add images first
            for (const img of images) {
              // OpenAI expects the full data URL
              let imageUrl = img.base64;
              if (!imageUrl.startsWith('data:')) {
                imageUrl = `data:${img.type || 'image/jpeg'};base64,${img.base64}`;
              }

              content.push({
                type: 'image_url',
                image_url: { url: imageUrl }
              });
            }

            // Add text after images
            content.push({
              type: 'text',
              text: msg.content
            });

            return { role: msg.role, content };
          }
          return msg;
        });

        console.log(`   📷 Images attached: ${images.length}`);
      }

      // OpenAI format: system message goes in messages array
      const openaiMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...transformedMessages]
        : transformedMessages;

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
   * Groq-specific chat implementation (OpenAI-compatible API)
   */
  async _chatGroq(messages, options) {
    const apiKey = this.apiKeys.groq;

    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const { model, temperature, maxTokens, systemPrompt } = options;

    try {
      console.log(`   🌍 GROQ API CALL`);
      console.log(`   🤖 Model: ${model}`);

      const fetch = (await import('node-fetch')).default;

      // Groq uses OpenAI-compatible format
      const groqMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: groqMessages,
          temperature,
          max_tokens: maxTokens
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.error?.message || `API request failed with status ${response.status}`;
        throw new Error(`Groq API error: ${errorMessage}`);
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from Groq API');
      }

      const content = data.choices[0].message.content;

      console.log(`   ✅ GROQ API RESPONSE received`);
      console.log(`   📊 Tokens: input=${data.usage?.prompt_tokens || 0}, output=${data.usage?.completion_tokens || 0}`);

      return {
        content,
        usage: {
          input_tokens: data.usage?.prompt_tokens || 0,
          output_tokens: data.usage?.completion_tokens || 0
        },
        provider: 'groq',
        model
      };
    } catch (error) {
      console.error(`   ❌ GROQ API ERROR:`, error.message);
      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  /**
   * Gemini-specific chat implementation (Google AI API)
   */
  async _chatGemini(messages, options) {
    const apiKey = this.apiKeys.gemini;

    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const { model, temperature, maxTokens, systemPrompt, images } = options;

    try {
      console.log(`   🌍 GEMINI API CALL`);
      console.log(`   🤖 Model: ${model}`);

      const fetch = (await import('node-fetch')).default;

      // Convert messages to Gemini format with image support
      const geminiContents = messages.map((msg, idx) => {
        const parts = [];

        // Add images to the last user message
        if (images && images.length > 0 && msg.role === 'user' && idx === messages.length - 1) {
          for (const img of images) {
            // Extract base64 data
            let base64Data = img.base64;
            let mimeType = img.type || 'image/jpeg';

            if (base64Data.startsWith('data:')) {
              const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
              if (matches) {
                mimeType = matches[1];
                base64Data = matches[2];
              }
            }

            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            });
          }
          console.log(`   📷 Images attached: ${images.length}`);
        }

        // Add text content
        parts.push({ text: msg.content });

        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });

      // Gemini uses system instruction separately
      const requestBody = {
        contents: geminiContents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };

      if (systemPrompt) {
        requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.error?.message || `API request failed with status ${response.status}`;
        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const content = data.candidates[0].content.parts[0].text;

      console.log(`   ✅ GEMINI API RESPONSE received`);
      console.log(`   📊 Tokens: input=${data.usageMetadata?.promptTokenCount || 0}, output=${data.usageMetadata?.candidatesTokenCount || 0}`);

      return {
        content,
        usage: {
          input_tokens: data.usageMetadata?.promptTokenCount || 0,
          output_tokens: data.usageMetadata?.candidatesTokenCount || 0
        },
        provider: 'gemini',
        model
      };
    } catch (error) {
      console.error(`   ❌ GEMINI API ERROR:`, error.message);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * DeepSeek-specific chat implementation (OpenAI-compatible API)
   */
  async _chatDeepSeek(messages, options) {
    const apiKey = this.apiKeys.deepseek;

    if (!apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const { model, temperature, maxTokens, systemPrompt } = options;

    try {
      console.log(`   🌍 DEEPSEEK API CALL`);
      console.log(`   🤖 Model: ${model}`);

      const fetch = (await import('node-fetch')).default;

      // DeepSeek uses OpenAI-compatible format
      const deepseekMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: deepseekMessages,
          temperature,
          max_tokens: maxTokens
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.error?.message || `API request failed with status ${response.status}`;
        throw new Error(`DeepSeek API error: ${errorMessage}`);
      }

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from DeepSeek API');
      }

      const content = data.choices[0].message.content;

      console.log(`   ✅ DEEPSEEK API RESPONSE received`);
      console.log(`   📊 Tokens: input=${data.usage?.prompt_tokens || 0}, output=${data.usage?.completion_tokens || 0}`);

      return {
        content,
        usage: {
          input_tokens: data.usage?.prompt_tokens || 0,
          output_tokens: data.usage?.completion_tokens || 0
        },
        provider: 'deepseek',
        model
      };
    } catch (error) {
      console.error(`   ❌ DEEPSEEK API ERROR:`, error.message);
      throw new Error(`DeepSeek API error: ${error.message}`);
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
      groq: 'Groq',
      gemini: 'Google Gemini',
      deepseek: 'DeepSeek'
    };
    return names[provider] || provider;
  }
}

// Export singleton instance
module.exports = new AIProviderService();
