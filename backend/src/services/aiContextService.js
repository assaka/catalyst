/**
 * AI Context Service - RAG (Retrieval-Augmented Generation) System
 *
 * This service fetches context data from the MASTER database to enhance AI prompts.
 *
 * ALL AI tables are in MASTER DB because:
 * - Knowledge is shared across all stores
 * - Cross-user learning benefits everyone
 * - Centralized training data management
 * - User-specific data uses user_id/store_id columns for filtering
 *
 * Tables in Master DB:
 * - ai_context_documents - Global knowledge base
 * - ai_plugin_examples - Working code examples
 * - ai_code_patterns - Reusable snippets & successful prompts
 * - ai_entity_definitions - Admin entity schemas
 * - ai_chat_history - All conversations for learning
 * - ai_learning_insights - Aggregated learnings
 * - ai_user_preferences - User preferences (filtered by user_id)
 *
 * See: backend/src/services/RAG_SYSTEM.md for full documentation
 */

const { masterDbClient } = require('../database/masterConnection');

class AIContextService {
  constructor() {
    // In-memory cache to reduce database hits (5 minute TTL)
    this.cache = {
      documents: null,
      examples: null,
      patterns: null,
      lastFetch: null,
      ttl: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * MAIN ENTRY POINT: Get complete RAG context for AI prompts
   */
  async getContextForQuery({ mode, category, query, storeId = null, limit = 10 }) {
    const context = {
      documents: await this.getRelevantDocuments({ mode, category, limit: 5 }),
      examples: await this.getRelevantExamples({ category, query, limit: 3 }),
      patterns: await this.getRelevantPatterns({ query, limit: 5 })
    };

    return this.formatContextForAI(context);
  }

  /**
   * Get relevant knowledge base documents from ai_context_documents
   */
  async getRelevantDocuments({ mode, category, limit = 5 }) {
    try {
      let query = masterDbClient
        .from('ai_context_documents')
        .select('id, type, title, content, category, tags, priority')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by mode
      if (mode && mode !== 'all') {
        query = query.or(`mode.eq.${mode},mode.eq.all`);
      }

      // Filter by category
      if (category) {
        query = query.or(`category.eq.${category},category.eq.core`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching context documents:', error);
        return [];
      }

      return (data || []).map(doc => ({
        ...doc,
        tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : (doc.tags || [])
      }));
    } catch (error) {
      console.error('Error fetching context documents:', error);
      return [];
    }
  }

  /**
   * Get relevant plugin examples from ai_plugin_examples
   */
  async getRelevantExamples({ category, query, limit = 3 }) {
    try {
      let dbQuery = masterDbClient
        .from('ai_plugin_examples')
        .select('id, name, slug, description, category, complexity, code, files, features, use_cases, tags')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Error fetching plugin examples:', error);
        return [];
      }

      return (data || []).map(r => ({
        ...r,
        files: typeof r.files === 'string' ? JSON.parse(r.files) : (r.files || []),
        features: typeof r.features === 'string' ? JSON.parse(r.features) : (r.features || []),
        use_cases: typeof r.use_cases === 'string' ? JSON.parse(r.use_cases) : (r.use_cases || []),
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || [])
      }));
    } catch (error) {
      console.error('Error fetching plugin examples:', error);
      return [];
    }
  }

  /**
   * Get relevant code patterns from ai_code_patterns
   */
  async getRelevantPatterns({ query, limit = 5 }) {
    try {
      const { data, error } = await masterDbClient
        .from('ai_code_patterns')
        .select('id, name, pattern_type, description, code, language, framework, parameters, example_usage, tags')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching code patterns:', error);
        return [];
      }

      return (data || []).map(r => ({
        ...r,
        parameters: typeof r.parameters === 'string' ? JSON.parse(r.parameters) : (r.parameters || []),
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || [])
      }));
    } catch (error) {
      console.error('Error fetching code patterns:', error);
      return [];
    }
  }

  /**
   * Format context objects into AI-readable markdown string
   */
  formatContextForAI(context) {
    let formatted = '';

    if (context.documents && context.documents.length > 0) {
      formatted += '# KNOWLEDGE BASE\n\n';
      context.documents.forEach(doc => {
        formatted += `## ${doc.title}\n${doc.content}\n\n`;
      });
    }

    if (context.examples && context.examples.length > 0) {
      formatted += '# PLUGIN EXAMPLES\n\n';
      context.examples.forEach(ex => {
        formatted += `## ${ex.name} (${ex.complexity})\n`;
        formatted += `**Description:** ${ex.description}\n`;
        formatted += `**Category:** ${ex.category}\n`;
        if (ex.features && ex.features.length > 0) {
          formatted += `**Features:** ${ex.features.join(', ')}\n\n`;
        }
        formatted += `**Code:**\n\`\`\`javascript\n${ex.code}\n\`\`\`\n\n`;
        if (ex.use_cases && ex.use_cases.length > 0) {
          formatted += `**Use cases:** ${ex.use_cases.join(', ')}\n\n`;
        }
      });
    }

    if (context.patterns && context.patterns.length > 0) {
      formatted += '# CODE PATTERNS & SNIPPETS\n\n';
      context.patterns.forEach(pattern => {
        formatted += `## ${pattern.name} (${pattern.pattern_type})\n`;
        formatted += `**Description:** ${pattern.description}\n`;
        if (pattern.framework) {
          formatted += `**Framework:** ${pattern.framework}\n`;
        }
        formatted += `\n**Code:**\n\`\`\`${pattern.language}\n${pattern.code}\n\`\`\`\n`;
        if (pattern.example_usage) {
          formatted += `\n**Usage:** ${pattern.example_usage}\n`;
        }
        formatted += '\n';
      });
    }

    return formatted;
  }

  /**
   * Track context usage for analytics
   */
  async trackContextUsage({ documentId, exampleId, patternId, userId, sessionId, query, wasHelpful, storeId = null }) {
    try {
      // Insert into master DB
      const { error } = await masterDbClient.from('ai_context_usage').insert({
        document_id: documentId || null,
        example_id: exampleId || null,
        pattern_id: patternId || null,
        user_id: userId || null,
        session_id: sessionId || null,
        query: query || null,
        was_helpful: wasHelpful || null,
        store_id: storeId || null,
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error tracking context usage:', error);
      }

      // Increment usage counts
      if (exampleId) {
        await masterDbClient.rpc('increment_usage_count', {
          table_name: 'ai_plugin_examples',
          row_id: exampleId
        }).catch(() => {});
      }
      if (patternId) {
        await masterDbClient.rpc('increment_usage_count', {
          table_name: 'ai_code_patterns',
          row_id: patternId
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Error tracking context usage:', error);
    }
  }

  /**
   * Get user preferences (from TENANT DB - user prefs are tenant-specific)
   */
  async getUserPreferences({ userId, sessionId, storeId }) {
    try {
      if (!storeId) {
        return null;
      }

      const ConnectionManager = require('./database/ConnectionManager');
      const db = await ConnectionManager.getStoreConnection(storeId);

      let query = db
        .from('ai_user_preferences')
        .select('*')
        .orderBy('updated_at', 'desc')
        .limit(1);

      if (userId) {
        query = query.where('user_id', userId);
      } else if (sessionId) {
        query = query.where('session_id', sessionId);
      } else {
        return null;
      }

      const data = await query.first();

      if (!data) {
        return null;
      }

      return {
        ...data,
        coding_style: typeof data.coding_style === 'string' ? JSON.parse(data.coding_style) : data.coding_style,
        favorite_patterns: typeof data.favorite_patterns === 'string' ? JSON.parse(data.favorite_patterns) : data.favorite_patterns,
        recent_plugins: typeof data.recent_plugins === 'string' ? JSON.parse(data.recent_plugins) : data.recent_plugins,
        categories_interest: typeof data.categories_interest === 'string' ? JSON.parse(data.categories_interest) : data.categories_interest,
        context_preferences: typeof data.context_preferences === 'string' ? JSON.parse(data.context_preferences) : data.context_preferences
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  /**
   * Save/update user preferences (in TENANT DB - user prefs are tenant-specific)
   */
  async saveUserPreferences(preferences) {
    try {
      const { userId, sessionId, storeId, ...prefs } = preferences;

      if (!storeId) {
        console.error('storeId is required for saving user preferences');
        return;
      }

      const ConnectionManager = require('./database/ConnectionManager');
      const db = await ConnectionManager.getStoreConnection(storeId);

      const existing = await this.getUserPreferences({ userId, sessionId, storeId });

      const data = {
        user_id: userId || null,
        session_id: sessionId || null,
        preferred_mode: prefs.preferredMode || null,
        coding_style: JSON.stringify(prefs.codingStyle || {}),
        favorite_patterns: JSON.stringify(prefs.favoritePatterns || []),
        recent_plugins: JSON.stringify(prefs.recentPlugins || []),
        categories_interest: JSON.stringify(prefs.categoriesInterest || []),
        context_preferences: JSON.stringify(prefs.contextPreferences || {}),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await db
          .from('ai_user_preferences')
          .where('id', existing.id)
          .update(data);
      } else {
        data.created_at = new Date().toISOString();
        await db.from('ai_user_preferences').insert(data);
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Add new context document to the knowledge base
   */
  async addContextDocument(document) {
    try {
      const { data, error } = await masterDbClient
        .from('ai_context_documents')
        .insert({
          type: document.type,
          title: document.title,
          content: document.content,
          category: document.category || null,
          tags: document.tags || [],
          priority: document.priority || 0,
          mode: document.mode || 'all',
          is_active: document.isActive !== false,
          metadata: document.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      this.clearCache();
      return data;
    } catch (error) {
      console.error('Error adding context document:', error);
      throw error;
    }
  }

  /**
   * Save chat message for learning
   */
  async saveChatMessage({ userId, storeId, sessionId, role, content, intent, entity, operation, wasSuccessful, metadata }) {
    try {
      const { error } = await masterDbClient.from('ai_chat_history').insert({
        user_id: userId || null,
        store_id: storeId || null,
        session_id: sessionId || null,
        role,
        content,
        intent: intent || null,
        entity: entity || null,
        operation: operation || null,
        was_successful: wasSuccessful,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error saving chat message:', error);
      }
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }

  /**
   * Get successful prompts for an entity (for learning)
   */
  async getSuccessfulPrompts(entity, limit = 5) {
    try {
      const { data, error } = await masterDbClient
        .from('ai_chat_history')
        .select('content, intent, entity, operation, metadata')
        .eq('role', 'user')
        .eq('entity', entity)
        .eq('was_successful', true)
        .not('user_feedback', 'eq', 'not_helpful')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching successful prompts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching successful prompts:', error);
      return [];
    }
  }

  /**
   * Update chat feedback
   */
  async updateChatFeedback(chatId, feedback, feedbackText = null) {
    try {
      const { error } = await masterDbClient
        .from('ai_chat_history')
        .update({
          user_feedback: feedback,
          feedback_text: feedbackText
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error updating chat feedback:', error);
      }
    } catch (error) {
      console.error('Error updating chat feedback:', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      documents: null,
      examples: null,
      patterns: null,
      lastFetch: null,
      ttl: 5 * 60 * 1000
    };
  }
}

module.exports = new AIContextService();
