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
 *
 * NOTE: Default models are fetched from ai_models database table via AIModelsService
 */

const Anthropic = require('@anthropic-ai/sdk');

// Lazy load AIModelsService to avoid circular dependency
let _aiModelsService = null;
const getAIModelsService = () => {
  if (!_aiModelsService) {
    _aiModelsService = require('./AIModelsService');
  }
  return _aiModelsService;
};

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

    // Fallback default models (used if database unavailable)
    this._fallbackDefaultModels = {
      anthropic: 'claude-3-5-haiku-20241022',
      openai: 'gpt-4o-mini',
      deepseek: 'deepseek-chat',
      gemini: 'gemini-2.0-flash',
      groq: 'llama-3.3-70b-versatile'
    };

    // Cached default models (loaded from database)
    this._defaultModelsCache = null;
    this._cacheLoaded = false;

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
   * Load default models from database
   */
  async _loadDefaultModels() {
    if (this._cacheLoaded) return;

    try {
      const aiModelsService = getAIModelsService();
      this._defaultModelsCache = await aiModelsService.getDefaultModels();
      this._cacheLoaded = true;
      console.log('✅ AIProviderService: Default models loaded from database');
    } catch (error) {
      console.warn('⚠️ AIProviderService: Failed to load default models from database, using fallbacks:', error.message);
      this._defaultModelsCache = this._fallbackDefaultModels;
      this._cacheLoaded = true;
    }
  }

  /**
   * Get default model for a provider (sync with cache)
   */
  getDefaultModel(provider) {
    if (this._defaultModelsCache && this._defaultModelsCache[provider]) {
      return this._defaultModelsCache[provider];
    }
    return this._fallbackDefaultModels[provider] || this._fallbackDefaultModels.anthropic;
  }

  /**
   * Get default model for a provider (async, ensures cache is loaded)
   */
  async getDefaultModelAsync(provider) {
    await this._loadDefaultModels();
    return this.getDefaultModel(provider);
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
    // Ensure default models are loaded from database
    await this._loadDefaultModels();

    const {
      provider = this.getFirstAvailableProvider(),
      model = null, // Will be resolved below
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt = null,
      images = null // Array of { base64, type } for vision support
    } = options;

    // Get default model for provider if not specified
    const resolvedModel = model || this.getDefaultModel(provider);

    if (!provider) {
      throw new Error('No AI provider available. Please configure at least one API key.');
    }

    console.log(`🤖 AI Provider: ${provider}, Model: ${resolvedModel}${images ? `, Images: ${images.length}` : ''}`);

    if (provider === 'anthropic') {
      return await this._chatAnthropic(messages, { model: resolvedModel, temperature, maxTokens, systemPrompt, images });
    } else if (provider === 'openai') {
      return await this._chatOpenAI(messages, { model: resolvedModel, temperature, maxTokens, systemPrompt, images });
    } else if (provider === 'groq') {
      // Groq doesn't support vision yet, fall back to text-only
      if (images && images.length > 0) {
        console.warn('⚠️  Groq does not support vision. Images will be ignored.');
      }
      return await this._chatGroq(messages, { model: resolvedModel, temperature, maxTokens, systemPrompt });
    } else if (provider === 'gemini') {
      return await this._chatGemini(messages, { model: resolvedModel, temperature, maxTokens, systemPrompt, images });
    } else if (provider === 'deepseek') {
      // DeepSeek doesn't support vision yet, fall back to text-only
      if (images && images.length > 0) {
        console.warn('⚠️  DeepSeek does not support vision. Images will be ignored.');
      }
      return await this._chatDeepSeek(messages, { model: resolvedModel, temperature, maxTokens, systemPrompt });
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
    // Ensure default models are loaded from database
    await this._loadDefaultModels();

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
      model: this.getDefaultModel(provider),
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
        defaultModel: this.getDefaultModel(provider),
        available: true
      }));
  }

  /**
   * Get available providers async (ensures models are loaded from database)
   */
  async getAvailableProvidersAsync() {
    await this._loadDefaultModels();
    return this.getAvailableProviders();
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

  /**
   * Stream chat with extended thinking and tool use events (Anthropic only)
   * Yields events for thinking, tool_use, and text content
   *
   * @param {Array} messages - Chat messages
   * @param {Object} options - { model, temperature, maxTokens, systemPrompt, tools, thinkingBudget }
   * @yields {Object} Event objects with type: 'thinking_start', 'thinking', 'tool_start', 'tool_input', 'text', 'block_stop', 'done'
   */
  async *streamWithThinking(messages, options = {}) {
    // Ensure default models are loaded from database
    await this._loadDefaultModels();

    const defaultAnthropicModel = this.getDefaultModel('anthropic');

    const {
      model = defaultAnthropicModel,
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt = null,
      tools = []
    } = options;

    const client = this.getProvider('anthropic');
    if (!client) {
      throw new Error('Anthropic client not available.');
    }

    console.log(`🧠 Starting stream with ${tools.length} tools`);

    try {
      const requestParams = {
        model,
        max_tokens: maxTokens,
        temperature,
        messages
      };

      // Add system prompt if provided
      if (systemPrompt) {
        requestParams.system = systemPrompt;
      }

      // Add tools if provided
      if (tools && tools.length > 0) {
        requestParams.tools = tools;
        requestParams.tool_choice = { type: 'auto' };
      }

      console.log('🔧 Request params:', JSON.stringify({
        model: requestParams.model,
        hasTools: !!requestParams.tools?.length,
        hasSystem: !!requestParams.system
      }));

      const stream = await client.messages.stream(requestParams);

      let currentBlockType = null;
      let currentToolName = null;
      let currentToolId = null;
      let usage = { input_tokens: 0, output_tokens: 0 };

      for await (const event of stream) {
        // Content block started
        if (event.type === 'content_block_start') {
          const block = event.content_block;

          if (block.type === 'thinking') {
            currentBlockType = 'thinking';
            yield { type: 'thinking_start', index: event.index };
          } else if (block.type === 'tool_use') {
            currentBlockType = 'tool_use';
            currentToolName = block.name;
            currentToolId = block.id;
            yield {
              type: 'tool_start',
              tool: block.name,
              id: block.id,
              index: event.index
            };
          } else if (block.type === 'text') {
            currentBlockType = 'text';
            yield { type: 'text_start', index: event.index };
          }
        }

        // Content block delta (streaming content)
        if (event.type === 'content_block_delta') {
          const delta = event.delta;

          if (delta.type === 'thinking_delta') {
            yield { type: 'thinking', text: delta.thinking };
          } else if (delta.type === 'text_delta') {
            yield { type: 'text', text: delta.text };
          } else if (delta.type === 'input_json_delta') {
            yield {
              type: 'tool_input',
              json: delta.partial_json,
              tool: currentToolName,
              id: currentToolId
            };
          }
        }

        // Content block stopped
        if (event.type === 'content_block_stop') {
          yield {
            type: 'block_stop',
            blockType: currentBlockType,
            tool: currentToolName,
            id: currentToolId
          };
          currentBlockType = null;
          currentToolName = null;
          currentToolId = null;
        }

        // Message delta (stop reason, usage)
        if (event.type === 'message_delta') {
          if (event.usage) {
            usage.output_tokens = event.usage.output_tokens;
          }
          if (event.delta?.stop_reason) {
            yield { type: 'stop_reason', reason: event.delta.stop_reason };
          }
        }

        // Message start (input tokens)
        if (event.type === 'message_start') {
          if (event.message?.usage) {
            usage.input_tokens = event.message.usage.input_tokens;
          }
        }

        // Message stop
        if (event.type === 'message_stop') {
          yield { type: 'done', usage };
        }
      }

    } catch (error) {
      console.error('Extended thinking stream error:', error);
      yield { type: 'error', error: error.message };
      throw error;
    }
  }

  /**
   * Get tool definitions for webshop AI assistant
   * These tools allow AI to query and understand the store data
   */
  getWebshopTools() {
    return [
      {
        name: 'query_products',
        description: 'Search and retrieve products from the webshop catalog. Use this to find products by name, category, price range, or other attributes.',
        input_schema: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              description: 'Search term to find products by name or description'
            },
            category: {
              type: 'string',
              description: 'Filter by category name or slug'
            },
            min_price: {
              type: 'number',
              description: 'Minimum price filter'
            },
            max_price: {
              type: 'number',
              description: 'Maximum price filter'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of products to return (default: 10)'
            }
          }
        }
      },
      {
        name: 'query_orders',
        description: 'Search and retrieve orders from the webshop. Use this to find orders by status, date range, or customer.',
        input_schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Order status filter (pending, processing, completed, cancelled)'
            },
            date_from: {
              type: 'string',
              description: 'Start date for order search (ISO format)'
            },
            date_to: {
              type: 'string',
              description: 'End date for order search (ISO format)'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of orders to return (default: 10)'
            }
          }
        }
      },
      {
        name: 'query_customers',
        description: 'Search and retrieve customer information. Use this to find customers by email, name, or order history.',
        input_schema: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              description: 'Search term for customer name or email'
            },
            has_orders: {
              type: 'boolean',
              description: 'Filter to customers who have placed orders'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of customers to return (default: 10)'
            }
          }
        }
      },
      {
        name: 'get_store_stats',
        description: 'Get store statistics including total products, orders, revenue, and other key metrics.',
        input_schema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              description: 'Time period for stats: today, week, month, year, all'
            }
          }
        }
      },
      {
        name: 'query_categories',
        description: 'Get category hierarchy and product counts for the store.',
        input_schema: {
          type: 'object',
          properties: {
            parent_id: {
              type: 'string',
              description: 'Filter by parent category ID to get subcategories'
            },
            include_counts: {
              type: 'boolean',
              description: 'Include product counts per category'
            }
          }
        }
      }
    ];
  }
}

// Export singleton instance
module.exports = new AIProviderService();
