// backend/src/services/AIModelsService.js
const AIModel = require('../models/AIModel');

/**
 * AIModelsService - Centralized service for AI model configuration
 *
 * Provides cached access to AI models from the database with automatic refresh.
 * All services should use this instead of hardcoding model names.
 *
 * Usage:
 *   const aiModels = require('./AIModelsService');
 *   const config = await aiModels.getModelConfig('claude-sonnet');
 *   const defaultModel = await aiModels.getDefaultModel('anthropic');
 */
class AIModelsService {
  constructor() {
    // Cache for models
    this._modelsCache = null;
    this._modelMappingCache = null;
    this._defaultModelsCache = null;
    this._serviceKeysCache = null;
    this._fallbackCostsCache = null;

    // Cache expiration (5 minutes)
    this._cacheExpiry = 5 * 60 * 1000;
    this._lastCacheTime = 0;

    // Hardcoded fallbacks (used only if database is unavailable)
    this._fallbackModelMapping = {
      'claude-haiku': { provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
      'claude-sonnet': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      'claude-opus': { provider: 'anthropic', model: 'claude-3-opus-20240229' },
      'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
      'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
      'gemini-flash': { provider: 'gemini', model: 'gemini-2.0-flash' },
      'gemini-pro': { provider: 'gemini', model: 'gemini-1.5-pro' },
      'groq-llama': { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      'groq-mixtral': { provider: 'groq', model: 'mixtral-8x7b-32768' }
    };

    this._fallbackDefaultModels = {
      anthropic: 'claude-3-5-haiku-20241022',
      openai: 'gpt-4o-mini',
      gemini: 'gemini-2.0-flash',
      groq: 'llama-3.3-70b-versatile',
      deepseek: 'deepseek-chat'
    };
  }

  /**
   * Check if cache is still valid
   */
  _isCacheValid() {
    return this._modelsCache && (Date.now() - this._lastCacheTime) < this._cacheExpiry;
  }

  /**
   * Refresh the cache from database
   */
  async _refreshCache() {
    try {
      const models = await AIModel.getActiveModels();

      this._modelsCache = models;
      this._modelMappingCache = {};
      this._defaultModelsCache = {};
      this._serviceKeysCache = {};
      this._fallbackCostsCache = {};

      for (const model of models) {
        // Build model mapping (modelId -> { provider, model })
        this._modelMappingCache[model.model_id] = {
          provider: model.provider,
          model: model.api_model,
          maxTokens: model.max_tokens,
          supportsStreaming: model.supports_streaming,
          supportsVision: model.supports_vision,
          supportsTools: model.supports_tools
        };

        // Build default models per provider
        if (model.is_provider_default) {
          this._defaultModelsCache[model.provider] = model.api_model;
        }

        // Build service keys mapping
        if (model.service_key) {
          this._serviceKeysCache[model.model_id] = model.service_key;
        }

        // Build fallback costs
        this._fallbackCostsCache[model.model_id] = parseFloat(model.credits_per_use);
      }

      this._lastCacheTime = Date.now();
      console.log(`✅ AIModelsService cache refreshed: ${models.length} models loaded`);

    } catch (error) {
      console.warn('⚠️ Failed to refresh AI models cache, using fallbacks:', error.message);
      // Keep using existing cache or fallbacks
    }
  }

  /**
   * Ensure cache is loaded
   */
  async _ensureCache() {
    if (!this._isCacheValid()) {
      await this._refreshCache();
    }
  }

  /**
   * Get all active models
   */
  async getActiveModels() {
    await this._ensureCache();
    return this._modelsCache || [];
  }

  /**
   * Get model configuration by model ID (e.g., 'claude-sonnet')
   * Returns { provider, model, maxTokens, supportsStreaming, supportsVision, supportsTools }
   */
  async getModelConfig(modelId) {
    await this._ensureCache();

    if (this._modelMappingCache && this._modelMappingCache[modelId]) {
      return this._modelMappingCache[modelId];
    }

    // Fallback to hardcoded if not in cache
    return this._fallbackModelMapping[modelId] || this._fallbackModelMapping['claude-sonnet'];
  }

  /**
   * Get model configuration synchronously (uses cache or fallback)
   * Use this only when async is not possible
   */
  getModelConfigSync(modelId) {
    if (this._modelMappingCache && this._modelMappingCache[modelId]) {
      return this._modelMappingCache[modelId];
    }
    return this._fallbackModelMapping[modelId] || this._fallbackModelMapping['claude-sonnet'];
  }

  /**
   * Get the model mapping object (modelId -> { provider, model })
   */
  async getModelMapping() {
    await this._ensureCache();
    return this._modelMappingCache || this._fallbackModelMapping;
  }

  /**
   * Get default model for a provider
   */
  async getDefaultModel(provider) {
    await this._ensureCache();

    if (this._defaultModelsCache && this._defaultModelsCache[provider]) {
      return this._defaultModelsCache[provider];
    }

    return this._fallbackDefaultModels[provider] || this._fallbackDefaultModels.anthropic;
  }

  /**
   * Get all default models (provider -> api_model)
   */
  async getDefaultModels() {
    await this._ensureCache();
    return this._defaultModelsCache || this._fallbackDefaultModels;
  }

  /**
   * Get service key for a model
   */
  async getServiceKey(modelId) {
    await this._ensureCache();
    return this._serviceKeysCache?.[modelId] || `ai_chat_${modelId.replace('-', '_')}`;
  }

  /**
   * Get all service keys mapping (modelId -> serviceKey)
   */
  async getServiceKeys() {
    await this._ensureCache();
    return this._serviceKeysCache || {};
  }

  /**
   * Get fallback cost for a model
   */
  async getFallbackCost(modelId) {
    await this._ensureCache();
    return this._fallbackCostsCache?.[modelId] || 10; // Default 10 credits
  }

  /**
   * Get all fallback costs
   */
  async getFallbackCosts() {
    await this._ensureCache();
    return this._fallbackCostsCache || {};
  }

  /**
   * Get API model name from model ID
   * e.g., 'claude-sonnet' -> 'claude-3-5-sonnet-20241022'
   */
  async getApiModel(modelId) {
    const config = await this.getModelConfig(modelId);
    return config?.model || modelId;
  }

  /**
   * Get provider from model ID
   * e.g., 'claude-sonnet' -> 'anthropic'
   */
  async getProvider(modelId) {
    const config = await this.getModelConfig(modelId);
    return config?.provider || 'anthropic';
  }

  /**
   * Force cache refresh (useful after model updates)
   */
  async invalidateCache() {
    this._modelsCache = null;
    this._modelMappingCache = null;
    this._defaultModelsCache = null;
    this._serviceKeysCache = null;
    this._fallbackCostsCache = null;
    this._lastCacheTime = 0;
    console.log('🔄 AIModelsService cache invalidated');
  }

  /**
   * Initialize the service (preload cache)
   */
  async initialize() {
    await this._refreshCache();
  }
}

// Export singleton instance
module.exports = new AIModelsService();
