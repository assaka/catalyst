// src/utils/aiService.js
import apiClient from '@/api/client';

/**
 * Frontend AI Service Utility
 * Communicates with backend AIService for all AI operations
 */
class AIServiceClient {
  /**
   * Generate AI response
   * @param {string} operationType - Type of operation (plugin-generation, translation, etc.)
   * @param {string} prompt - User prompt
   * @param {object} options - Additional options
   */
  async generate(operationType, prompt, options = {}) {
    try {
      const response = await apiClient.post('/ai/generate', {
        operationType,
        prompt,
        systemPrompt: options.systemPrompt || '',
        model: options.model || undefined,
        maxTokens: options.maxTokens || undefined,
        temperature: options.temperature || undefined,
        metadata: options.metadata || {}
      });

      if (response.success) {
        return {
          success: true,
          content: response.content,
          usage: response.usage,
          creditsDeducted: response.creditsDeducted,
          creditsRemaining: response.creditsRemaining
        };
      } else {
        throw new Error(response.message || 'AI generation failed');
      }
    } catch (error) {
      console.error('AI Generation Error:', error);

      // Handle specific error types
      if (error.response?.data?.code === 'INSUFFICIENT_CREDITS') {
        throw new Error(
          `Insufficient credits. You need ${error.response.data.required} credits but only have ${error.response.data.available}.`
        );
      }

      throw error;
    }
  }

  /**
   * Stream AI response
   * @param {string} operationType - Type of operation
   * @param {string} prompt - User prompt
   * @param {function} onChunk - Callback for each chunk
   * @param {object} options - Additional options
   */
  async generateStream(operationType, prompt, onChunk, options = {}) {
    try {
      const response = await fetch('/api/ai/generate/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getToken()}`
        },
        body: JSON.stringify({
          operationType,
          prompt,
          systemPrompt: options.systemPrompt || '',
          model: options.model || undefined,
          maxTokens: options.maxTokens || undefined,
          temperature: options.temperature || undefined,
          metadata: options.metadata || {}
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Streaming failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
              if (parsed.usage) {
                // Final usage stats
                onChunk(null, parsed.usage);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Stream Error:', error);
      throw error;
    }
  }

  /**
   * Get operation cost
   * @param {string} operationType - Type of operation
   */
  async getOperationCost(operationType) {
    try {
      const response = await apiClient.get(`/ai/cost/${operationType}`);
      return response.cost || 0;
    } catch (error) {
      console.error('Error fetching operation cost:', error);
      return 0;
    }
  }

  /**
   * Get remaining credits
   */
  async getRemainingCredits() {
    try {
      const response = await apiClient.get('/ai/credits');
      return response.credits || 0;
    } catch (error) {
      console.error('Error fetching credits:', error);
      return 0;
    }
  }

  /**
   * Get usage history
   * @param {number} limit - Number of records to fetch
   */
  async getUsageHistory(limit = 50) {
    try {
      const response = await apiClient.get(`/ai/usage-history?limit=${limit}`);
      return response.history || [];
    } catch (error) {
      console.error('Error fetching usage history:', error);
      return [];
    }
  }

  /**
   * Check if user has sufficient credits
   * @param {string} operationType - Type of operation
   */
  async checkCredits(operationType) {
    try {
      const response = await apiClient.post('/ai/check-credits', {
        operationType
      });
      return {
        hasCredits: response.hasCredits,
        required: response.required,
        available: response.available
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return {
        hasCredits: false,
        required: 0,
        available: 0
      };
    }
  }

  // Specific operation helpers

  /**
   * Generate plugin code
   */
  async generatePlugin(prompt, metadata = {}) {
    return this.generate('plugin-generation', prompt, {
      systemPrompt: 'You are an expert JavaScript/React plugin developer. Generate clean, production-ready plugin code.',
      metadata: { ...metadata, type: 'plugin' }
    });
  }

  /**
   * Modify existing plugin
   */
  async modifyPlugin(prompt, existingCode, metadata = {}) {
    return this.generate('plugin-modification', prompt, {
      systemPrompt: `You are an expert JavaScript/React plugin developer. Modify the existing plugin code according to the user's request.\n\nExisting Code:\n${existingCode}`,
      metadata: { ...metadata, type: 'plugin-modification' }
    });
  }

  /**
   * Translate content
   */
  async translateContent(content, targetLanguages, metadata = {}) {
    return this.generate('translation', `Translate the following content to ${targetLanguages.join(', ')}:\n\n${content}`, {
      systemPrompt: 'You are an expert translator. Provide accurate, culturally appropriate translations.',
      metadata: { ...metadata, type: 'translation', targetLanguages }
    });
  }

  /**
   * Generate layout config
   */
  async generateLayout(prompt, configType, metadata = {}) {
    return this.generate('layout-generation', prompt, {
      systemPrompt: `You are an expert frontend developer. Generate a ${configType} layout configuration following the project's structure.`,
      metadata: { ...metadata, type: 'layout', configType }
    });
  }

  /**
   * Generate code patch
   */
  async generateCodePatch(prompt, sourceCode, filePath, metadata = {}) {
    return this.generate('code-patch', prompt, {
      systemPrompt: `You are an expert code editor. Generate RFC 6902 JSON patches for safe code modifications.\n\nFile: ${filePath}\n\nSource Code:\n${sourceCode}`,
      metadata: { ...metadata, type: 'code-patch', filePath }
    });
  }
}

export default new AIServiceClient();
