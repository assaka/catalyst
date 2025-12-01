/**
 * AI Learning Service - Continuous AI Improvement
 *
 * This service handles:
 * 1. User feedback collection (thumbs up/down on AI responses)
 * 2. Successful interaction tracking across all users
 * 3. Dynamic context improvement based on what works
 * 4. Admin documentation management
 * 5. Cross-user learning aggregation
 *
 * ALL AI tables are in MASTER DB because:
 * - Knowledge is shared across all stores
 * - Cross-user learning benefits everyone
 * - User-specific data uses user_id/store_id columns for filtering
 *
 * The system learns from:
 * - Direct user feedback (helpful/not helpful)
 * - Successful operations (entity updates that weren't reverted)
 * - Usage patterns (which context documents are used most)
 * - Error patterns (what queries fail and why)
 */

const { masterDbClient } = require('../database/masterConnection');
const aiContextService = require('./aiContextService');

class AILearningService {
  constructor() {
    // Cache for aggregated learning data
    this.learningCache = {
      successfulPrompts: null,
      failedPatterns: null,
      lastUpdate: null,
      ttl: 10 * 60 * 1000 // 10 minutes
    };
  }

  /**
   * Record user feedback on an AI response
   * @param {object} feedback - Feedback data
   * @param {string} feedback.storeId - Store ID
   * @param {string} feedback.userId - User ID
   * @param {string} feedback.conversationId - Conversation/session ID
   * @param {string} feedback.messageId - Message ID
   * @param {string} feedback.userMessage - Original user message
   * @param {string} feedback.aiResponse - AI response content
   * @param {string} feedback.intent - Detected intent
   * @param {string} feedback.entity - Entity involved (if any)
   * @param {string} feedback.operation - Operation performed (if any)
   * @param {boolean} feedback.wasHelpful - User's rating (true = helpful)
   * @param {string} feedback.feedbackText - Optional text feedback
   * @param {object} feedback.metadata - Additional context
   */
  async recordFeedback(feedback) {
    try {
      // ai_context_usage is in MASTER DB (cross-user learning)
      await masterDbClient.from('ai_context_usage').insert({
        user_id: feedback.userId,
        store_id: feedback.storeId,
        session_id: feedback.conversationId,
        query: feedback.userMessage,
        was_helpful: feedback.wasHelpful,
        created_at: new Date().toISOString()
      });

      // ai_usage_logs is in TENANT DB (per-store tracking)
      if (feedback.storeId) {
        const ConnectionManager = require('./database/ConnectionManager');
        const db = await ConnectionManager.getStoreConnection(feedback.storeId);
        await db.from('ai_usage_logs').insert({
          user_id: feedback.userId,
          operation_type: feedback.intent || 'chat',
          input: JSON.stringify({
            message: feedback.userMessage,
            intent: feedback.intent,
            entity: feedback.entity,
            operation: feedback.operation
          }),
          output: feedback.aiResponse?.substring(0, 1000), // Truncate for storage
          credits_used: 0, // Feedback doesn't cost credits
          success: feedback.wasHelpful,
          metadata: JSON.stringify({
            feedback_type: 'user_rating',
            was_helpful: feedback.wasHelpful,
            feedback_text: feedback.feedbackText,
            message_id: feedback.messageId,
            ...feedback.metadata
          }),
          created_at: new Date().toISOString()
        });
      }

      // If feedback is positive and it's an entity operation, save as successful pattern
      if (feedback.wasHelpful && feedback.intent === 'admin_entity' && feedback.entity) {
        await this.saveSuccessfulPattern(feedback);
      }

      // If feedback is negative, log for analysis
      if (!feedback.wasHelpful) {
        await this.logFailedInteraction(feedback);
      }

      return { success: true };
    } catch (error) {
      console.error('[AILearningService] Error recording feedback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save a successful interaction pattern for future reference (MASTER DB)
   */
  async saveSuccessfulPattern(feedback) {
    try {
      // Check if similar pattern already exists in MASTER DB
      const { data: existingPatterns, error: searchError } = await masterDbClient
        .from('ai_code_patterns')
        .select('id, usage_count')
        .eq('pattern_type', 'successful_prompt')
        .ilike('tags', `%${feedback.entity}%`)
        .ilike('description', `%${feedback.userMessage.substring(0, 50)}%`)
        .limit(1);

      if (searchError) {
        console.error('[AILearningService] Error searching patterns:', searchError);
      }

      if (existingPatterns && existingPatterns.length > 0) {
        // Increment usage count for existing pattern
        await masterDbClient.rpc('increment_usage_count', {
          table_name: 'ai_code_patterns',
          row_id: existingPatterns[0].id
        }).catch(() => {
          // Fallback: manual increment if RPC not available
          masterDbClient
            .from('ai_code_patterns')
            .update({ usage_count: existingPatterns[0].usage_count + 1 })
            .eq('id', existingPatterns[0].id);
        });
      } else {
        // Create new successful pattern in MASTER DB
        await masterDbClient.from('ai_code_patterns').insert({
          name: `Successful: ${feedback.entity} ${feedback.operation}`,
          pattern_type: 'successful_prompt',
          description: feedback.userMessage,
          code: JSON.stringify({
            user_message: feedback.userMessage,
            detected_intent: feedback.intent,
            entity: feedback.entity,
            operation: feedback.operation,
            ai_response: feedback.aiResponse?.substring(0, 500),
            store_id: feedback.storeId // Track which store this came from
          }),
          language: 'json',
          framework: 'ai-learning',
          parameters: JSON.stringify({
            intent: feedback.intent,
            entity: feedback.entity,
            operation: feedback.operation
          }),
          tags: JSON.stringify([feedback.entity, feedback.operation, 'successful', 'user-validated']),
          usage_count: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[AILearningService] Error saving successful pattern:', error);
    }
  }

  /**
   * Log failed interactions for analysis and improvement (MASTER DB)
   */
  async logFailedInteraction(feedback) {
    try {
      // Store in MASTER DB ai_context_documents as a "failure_log" type for analysis
      await masterDbClient.from('ai_context_documents').insert({
        type: 'failure_log',
        title: `Failed: ${feedback.intent || 'unknown'} - ${new Date().toISOString()}`,
        content: JSON.stringify({
          user_message: feedback.userMessage,
          ai_response: feedback.aiResponse,
          intent: feedback.intent,
          entity: feedback.entity,
          operation: feedback.operation,
          feedback_text: feedback.feedbackText,
          store_id: feedback.storeId, // Track which store this came from
          timestamp: new Date().toISOString()
        }),
        category: 'learning',
        tags: JSON.stringify(['failed', feedback.intent, feedback.entity].filter(Boolean)),
        priority: 1, // Low priority, just for analysis
        mode: 'all',
        is_active: false, // Don't include in RAG context
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AILearningService] Error logging failed interaction:', error);
    }
  }

  /**
   * Add documentation to AI context (admin function)
   * @param {object} doc - Document to add
   * @param {string} doc.storeId - Store ID (null for global)
   * @param {string} doc.title - Document title
   * @param {string} doc.content - Document content (markdown)
   * @param {string} doc.type - Document type (tutorial, reference, best_practices, etc.)
   * @param {string} doc.category - Category (products, settings, content, etc.)
   * @param {array} doc.tags - Tags for searchability
   * @param {number} doc.priority - Priority (0-100)
   */
  async addDocumentation(doc) {
    try {
      // Use aiContextService to add the document
      const result = await aiContextService.addContextDocument({
        type: doc.type || 'tutorial',
        title: doc.title,
        content: doc.content,
        category: doc.category || 'general',
        tags: doc.tags || [],
        priority: doc.priority || 50,
        mode: doc.mode || 'all',
        isActive: true,
        storeId: doc.storeId
      });

      // Clear cache to make document immediately available
      aiContextService.clearCache();

      return { success: true, documentId: result?.id };
    } catch (error) {
      console.error('[AILearningService] Error adding documentation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a plugin example for AI to learn from (MASTER DB)
   * @param {object} example - Plugin example
   */
  async addPluginExample(example) {
    try {
      // Insert into MASTER DB (shared across all stores)
      const { data: result, error } = await masterDbClient
        .from('ai_plugin_examples')
        .insert({
          name: example.name,
          slug: example.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: example.description,
          category: example.category || 'general',
          complexity: example.complexity || 'simple',
          code: example.code,
          files: JSON.stringify(example.files || []),
          features: JSON.stringify(example.features || []),
          use_cases: JSON.stringify(example.useCases || []),
          tags: JSON.stringify(example.tags || []),
          is_template: example.isTemplate || false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      aiContextService.clearCache();

      return { success: true, exampleId: result?.id };
    } catch (error) {
      console.error('[AILearningService] Error adding plugin example:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get learning statistics and insights (all from MASTER DB)
   * @param {string} storeId - Store ID (for filtering store-specific stats)
   */
  async getLearningStats(storeId) {
    try {
      // All AI tables are in MASTER DB - filter by store_id where applicable

      // Get feedback statistics for this store
      const { data: feedbackData } = await masterDbClient
        .from('ai_context_usage')
        .select('was_helpful')
        .eq('store_id', storeId);

      const feedbackStats = {
        total: feedbackData?.length || 0,
        helpful: feedbackData?.filter(f => f.was_helpful === true).length || 0,
        not_helpful: feedbackData?.filter(f => f.was_helpful === false).length || 0
      };

      // Get usage by intent for this store (ai_usage_logs is in TENANT DB)
      let intentStats = [];
      if (storeId) {
        const ConnectionManager = require('./database/ConnectionManager');
        const db = await ConnectionManager.getStoreConnection(storeId);
        const usageData = await db
          .from('ai_usage_logs')
          .select('operation_type', 'success');

        // Aggregate intent stats
        const intentMap = {};
        (usageData || []).forEach(u => {
          if (!intentMap[u.operation_type]) {
            intentMap[u.operation_type] = { count: 0, successful: 0 };
          }
          intentMap[u.operation_type].count++;
          if (u.success) intentMap[u.operation_type].successful++;
        });
        intentStats = Object.entries(intentMap).map(([operation_type, stats]) => ({
          operation_type,
          ...stats
        })).sort((a, b) => b.count - a.count);
      }

      // Get most used context documents (global, not store-specific)
      const { data: topDocuments } = await masterDbClient
        .from('ai_context_documents')
        .select('id, title, type, category, priority')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(10);

      // Get successful patterns (global, benefits all stores)
      const { data: successfulPatterns } = await masterDbClient
        .from('ai_code_patterns')
        .select('name, description, usage_count, tags')
        .eq('pattern_type', 'successful_prompt')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(10);

      // Get failed interactions count (global)
      const { count: failedCount } = await masterDbClient
        .from('ai_context_documents')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'failure_log');

      return {
        success: true,
        stats: {
          feedback: {
            total: feedbackStats.total,
            helpful: feedbackStats.helpful,
            notHelpful: feedbackStats.not_helpful,
            helpfulRate: feedbackStats.total > 0
              ? ((feedbackStats.helpful / feedbackStats.total) * 100).toFixed(1) + '%'
              : 'N/A'
          },
          intentUsage: intentStats,
          topDocuments: topDocuments || [],
          successfulPatterns: successfulPatterns || [],
          failedInteractions: failedCount || 0
        }
      };
    } catch (error) {
      console.error('[AILearningService] Error getting learning stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get successful prompts for a specific entity to use as examples (MASTER DB)
   * @param {string} entity - Entity name
   */
  async getSuccessfulPromptsForEntity(entity) {
    try {
      // Query MASTER DB for global successful patterns
      const { data: patterns, error } = await masterDbClient
        .from('ai_code_patterns')
        .select('description, code, usage_count')
        .eq('pattern_type', 'successful_prompt')
        .eq('is_active', true)
        .ilike('tags', `%${entity}%`)
        .order('usage_count', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[AILearningService] Error fetching patterns:', error);
        return [];
      }

      return (patterns || []).map(p => ({
        prompt: p.description,
        details: typeof p.code === 'string' ? JSON.parse(p.code) : p.code,
        successCount: p.usage_count
      }));
    } catch (error) {
      console.error('[AILearningService] Error getting successful prompts:', error);
      return [];
    }
  }

  /**
   * Generate improved intent prompt using learned patterns (MASTER DB)
   * Global patterns benefit all stores
   * @param {string} entity - Entity name (optional)
   */
  async getLearnedExamplesForPrompt(entity = null) {
    try {
      // Build query for MASTER DB
      let query = masterDbClient
        .from('ai_code_patterns')
        .select('description, code, tags')
        .eq('pattern_type', 'successful_prompt')
        .eq('is_active', true)
        .gte('usage_count', 2) // Only include patterns used at least twice
        .order('usage_count', { ascending: false })
        .limit(10);

      if (entity) {
        query = query.ilike('tags', `%${entity}%`);
      }

      const { data: patterns, error } = await query;

      if (error || !patterns || patterns.length === 0) {
        return '';
      }

      // Format as examples for the AI prompt
      let examples = '\n\nLEARNED SUCCESSFUL EXAMPLES:\n';
      patterns.forEach(p => {
        try {
          const details = typeof p.code === 'string' ? JSON.parse(p.code) : p.code;
          examples += `- "${p.description}" → entity: ${details.entity}, operation: ${details.operation}\n`;
        } catch {
          // Skip malformed entries
        }
      });

      return examples;
    } catch (error) {
      console.error('[AILearningService] Error getting learned examples:', error);
      return '';
    }
  }

  /**
   * Bulk import documentation from markdown files
   * @param {string} storeId - Store ID
   * @param {array} docs - Array of {title, content, category, type}
   */
  async bulkImportDocumentation(storeId, docs) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const doc of docs) {
      try {
        await this.addDocumentation({
          storeId,
          title: doc.title,
          content: doc.content,
          type: doc.type || 'reference',
          category: doc.category || 'general',
          tags: doc.tags || [],
          priority: doc.priority || 50
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ title: doc.title, error: error.message });
      }
    }

    return results;
  }

  /**
   * Analyze failed interactions and suggest improvements (MASTER DB)
   * Analyzes global failures to improve AI for all stores
   */
  async analyzeFailures() {
    try {
      // Get recent failures from MASTER DB (global analysis)
      const { data: failures, error } = await masterDbClient
        .from('ai_context_documents')
        .select('content, created_at')
        .eq('type', 'failure_log')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      if (!failures || failures.length === 0) {
        return { success: true, analysis: 'No failed interactions to analyze.' };
      }

      // Aggregate failure patterns
      const patterns = {};
      failures.forEach(f => {
        try {
          const data = typeof f.content === 'string' ? JSON.parse(f.content) : f.content;
          const key = `${data.intent || 'unknown'}_${data.entity || 'none'}`;
          if (!patterns[key]) {
            patterns[key] = { count: 0, examples: [] };
          }
          patterns[key].count++;
          if (patterns[key].examples.length < 3) {
            patterns[key].examples.push(data.user_message);
          }
        } catch {
          // Skip malformed entries
        }
      });

      // Sort by frequency
      const sortedPatterns = Object.entries(patterns)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);

      return {
        success: true,
        analysis: {
          totalFailures: failures.length,
          topFailurePatterns: sortedPatterns.map(([key, data]) => ({
            pattern: key,
            count: data.count,
            examples: data.examples
          })),
          suggestions: this._generateSuggestions(sortedPatterns)
        }
      };
    } catch (error) {
      console.error('[AILearningService] Error analyzing failures:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate suggestions based on failure patterns
   */
  _generateSuggestions(patterns) {
    const suggestions = [];

    patterns.forEach(([key, data]) => {
      if (key.includes('unknown')) {
        suggestions.push({
          issue: `${data.count} messages couldn't be classified`,
          suggestion: 'Add more example prompts to ai_entity_definitions for better intent detection'
        });
      } else if (key.includes('admin_entity')) {
        const entity = key.split('_').slice(2).join('_');
        suggestions.push({
          issue: `${data.count} failures with ${entity || 'entity'} operations`,
          suggestion: `Review entity definition for ${entity} and add more intent_keywords and example_prompts`
        });
      }
    });

    if (suggestions.length === 0) {
      suggestions.push({
        issue: 'No specific patterns detected',
        suggestion: 'Review individual failures for specific issues'
      });
    }

    return suggestions;
  }
}

module.exports = new AILearningService();
