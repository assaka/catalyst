// backend/src/models/AIModel.js
const { masterDbClient } = require('../database/masterConnection');

/**
 * AIModel - Data access for AI models configuration
 * Provides methods to fetch and manage AI model configurations from master DB
 */
class AIModel {
  /**
   * Get all active and visible models
   */
  static async getActiveModels() {
    const { data, error } = await masterDbClient
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch active AI models:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get only provider default models (for dropdown display)
   */
  static async getProviderDefaults() {
    const { data, error } = await masterDbClient
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .eq('is_provider_default', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch provider default models:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get all models for a specific provider
   */
  static async getByProvider(provider) {
    const { data, error } = await masterDbClient
      .from('ai_models')
      .select('*')
      .eq('provider', provider)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error(`Failed to fetch models for provider ${provider}:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a single model by model_id
   */
  static async getByModelId(modelId) {
    const { data, error } = await masterDbClient
      .from('ai_models')
      .select('*')
      .eq('model_id', modelId)
      .maybeSingle();

    if (error) {
      console.error(`Failed to fetch model ${modelId}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Get model configuration for API calls
   * Returns provider and api_model for the given model_id
   */
  static async getModelConfig(modelId) {
    const model = await this.getByModelId(modelId);

    if (!model) {
      return null;
    }

    return {
      provider: model.provider,
      model: model.api_model,
      maxTokens: model.max_tokens,
      supportsStreaming: model.supports_streaming,
      supportsVision: model.supports_vision,
      supportsTools: model.supports_tools
    };
  }

  /**
   * Get all models (admin view)
   */
  static async getAllModels() {
    const { data, error } = await masterDbClient
      .from('ai_models')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch all AI models:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update model status (activate/deactivate)
   */
  static async updateStatus(modelId, isActive) {
    const { data, error } = await masterDbClient
      .from('ai_models')
      .update({ is_active: isActive })
      .eq('model_id', modelId)
      .select()
      .single();

    if (error) {
      console.error(`Failed to update model ${modelId} status:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Set provider default model
   * Clears existing default for provider and sets new one
   */
  static async setProviderDefault(modelId, provider) {
    // First, clear existing default for this provider
    await masterDbClient
      .from('ai_models')
      .update({ is_provider_default: false })
      .eq('provider', provider);

    // Set new default
    const { data, error } = await masterDbClient
      .from('ai_models')
      .update({ is_provider_default: true })
      .eq('model_id', modelId)
      .select()
      .single();

    if (error) {
      console.error(`Failed to set provider default for ${modelId}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Update model credits
   */
  static async updateCredits(modelId, credits) {
    const { data, error } = await masterDbClient
      .from('ai_models')
      .update({ credits_per_use: credits })
      .eq('model_id', modelId)
      .select()
      .single();

    if (error) {
      console.error(`Failed to update credits for ${modelId}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Format model for frontend consumption
   */
  static formatForFrontend(model) {
    return {
      id: model.model_id,
      name: model.name,
      provider: model.provider,
      credits: parseFloat(model.credits_per_use),
      icon: model.icon,
      description: model.description,
      serviceKey: model.service_key,
      isProviderDefault: model.is_provider_default,
      isActive: model.is_active,
      maxTokens: model.max_tokens,
      supportsVision: model.supports_vision
    };
  }
}

module.exports = AIModel;
