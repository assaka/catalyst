/**
 * AI Context Service
 * Fetches context data from database for AI plugin generation
 * Supports future vector-based RAG implementation
 */

const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

class AIContextService {
  constructor() {
    // In-memory cache to reduce database hits
    this.cache = {
      documents: null,
      examples: null,
      patterns: null,
      lastFetch: null,
      ttl: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Get relevant context for AI based on mode and query
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
   * Get relevant context documents
   */
  async getRelevantDocuments({ mode, category, limit = 5 }) {
    try {
      const [results] = await sequelize.query(`
        SELECT id, type, title, content, category, tags, priority
        FROM ai_context_documents
        WHERE is_active = true
          AND (mode = :mode OR mode = 'all')
          ${category ? 'AND (category = :category OR category = \'core\')' : ''}
        ORDER BY priority DESC, created_at DESC
        LIMIT :limit
      `, {
        replacements: { mode, category, limit },
        type: Sequelize.QueryTypes.SELECT
      });

      return results;
    } catch (error) {
      console.error('Error fetching context documents:', error);
      return [];
    }
  }

  /**
   * Get relevant plugin examples
   */
  async getRelevantExamples({ category, query, limit = 3 }) {
    try {
      // For now, simple category-based matching
      // TODO: Implement vector similarity search when embeddings are added
      const [results] = await sequelize.query(`
        SELECT id, name, slug, description, category, complexity, code, files, features, use_cases, tags
        FROM ai_plugin_examples
        WHERE is_active = true
          ${category ? 'AND category = :category' : ''}
        ORDER BY
          CASE WHEN is_template = true THEN 1 ELSE 2 END,
          usage_count DESC,
          rating DESC NULLS LAST
        LIMIT :limit
      `, {
        replacements: { category, limit },
        type: Sequelize.QueryTypes.SELECT
      });

      return results.map(r => ({
        ...r,
        files: typeof r.files === 'string' ? JSON.parse(r.files) : r.files,
        features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
        use_cases: typeof r.use_cases === 'string' ? JSON.parse(r.use_cases) : r.use_cases,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags
      }));
    } catch (error) {
      console.error('Error fetching plugin examples:', error);
      return [];
    }
  }

  /**
   * Get relevant code patterns
   */
  async getRelevantPatterns({ query, limit = 5 }) {
    try {
      // Simple keyword matching for now
      // TODO: Implement vector similarity when embeddings ready
      const [results] = await sequelize.query(`
        SELECT id, name, pattern_type, description, code, language, framework, parameters, example_usage, tags
        FROM ai_code_patterns
        WHERE is_active = true
        ORDER BY usage_count DESC
        LIMIT :limit
      `, {
        replacements: { limit },
        type: Sequelize.QueryTypes.SELECT
      });

      return results.map(r => ({
        ...r,
        parameters: typeof r.parameters === 'string' ? JSON.parse(r.parameters) : r.parameters,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags
      }));
    } catch (error) {
      console.error('Error fetching code patterns:', error);
      return [];
    }
  }

  /**
   * Format context into AI-readable string
   */
  formatContextForAI(context) {
    let formatted = '';

    // Add architecture documents
    if (context.documents && context.documents.length > 0) {
      formatted += '# KNOWLEDGE BASE\n\n';
      context.documents.forEach(doc => {
        formatted += `## ${doc.title}\n${doc.content}\n\n`;
      });
    }

    // Add plugin examples
    if (context.examples && context.examples.length > 0) {
      formatted += '# PLUGIN EXAMPLES\n\n';
      context.examples.forEach(ex => {
        formatted += `## ${ex.name} (${ex.complexity})\n`;
        formatted += `**Description:** ${ex.description}\n`;
        formatted += `**Category:** ${ex.category}\n`;
        formatted += `**Features:** ${ex.features.join(', ')}\n\n`;
        formatted += `**Code:**\n\`\`\`javascript\n${ex.code}\n\`\`\`\n\n`;
        if (ex.use_cases && ex.use_cases.length > 0) {
          formatted += `**Use cases:** ${ex.use_cases.join(', ')}\n\n`;
        }
      });
    }

    // Add code patterns
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
   * Track context usage for analytics and improving RAG
   */
  async trackContextUsage({ documentId, exampleId, patternId, userId, sessionId, query, wasHelpful }) {
    try {
      await sequelize.query(`
        INSERT INTO ai_context_usage (document_id, example_id, pattern_id, user_id, session_id, query, was_helpful, created_at)
        VALUES (:documentId, :exampleId, :patternId, :userId, :sessionId, :query, :wasHelpful, NOW())
      `, {
        replacements: {
          documentId: documentId || null,
          exampleId: exampleId || null,
          patternId: patternId || null,
          userId: userId || null,
          sessionId: sessionId || null,
          query: query || null,
          wasHelpful: wasHelpful || null
        }
      });

      // Increment usage counts
      if (exampleId) {
        await sequelize.query('UPDATE ai_plugin_examples SET usage_count = usage_count + 1 WHERE id = :id', {
          replacements: { id: exampleId }
        });
      }
      if (patternId) {
        await sequelize.query('UPDATE ai_code_patterns SET usage_count = usage_count + 1 WHERE id = :id', {
          replacements: { id: patternId }
        });
      }
    } catch (error) {
      console.error('Error tracking context usage:', error);
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences({ userId, sessionId, storeId }) {
    try {
      const [results] = await sequelize.query(`
        SELECT * FROM ai_user_preferences
        WHERE (user_id = :userId OR session_id = :sessionId)
          ${storeId ? 'AND (store_id = :storeId OR store_id IS NULL)' : ''}
        ORDER BY updated_at DESC
        LIMIT 1
      `, {
        replacements: { userId: userId || null, sessionId, storeId: storeId || null },
        type: Sequelize.QueryTypes.SELECT
      });

      if (results.length > 0) {
        const prefs = results[0];
        return {
          ...prefs,
          coding_style: typeof prefs.coding_style === 'string' ? JSON.parse(prefs.coding_style) : prefs.coding_style,
          favorite_patterns: typeof prefs.favorite_patterns === 'string' ? JSON.parse(prefs.favorite_patterns) : prefs.favorite_patterns,
          recent_plugins: typeof prefs.recent_plugins === 'string' ? JSON.parse(prefs.recent_plugins) : prefs.recent_plugins,
          categories_interest: typeof prefs.categories_interest === 'string' ? JSON.parse(prefs.categories_interest) : prefs.categories_interest,
          context_preferences: typeof prefs.context_preferences === 'string' ? JSON.parse(prefs.context_preferences) : prefs.context_preferences
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  /**
   * Save/update user preferences
   */
  async saveUserPreferences(preferences) {
    try {
      const { userId, sessionId, storeId, ...prefs } = preferences;

      // Check if preferences exist
      const existing = await this.getUserPreferences({ userId, sessionId, storeId });

      if (existing) {
        // Update
        await sequelize.query(`
          UPDATE ai_user_preferences
          SET
            preferred_mode = :preferredMode,
            coding_style = :codingStyle,
            favorite_patterns = :favoritePatterns,
            recent_plugins = :recentPlugins,
            categories_interest = :categoriesInterest,
            context_preferences = :contextPreferences,
            updated_at = NOW()
          WHERE id = :id
        `, {
          replacements: {
            id: existing.id,
            preferredMode: prefs.preferredMode || existing.preferred_mode,
            codingStyle: JSON.stringify(prefs.codingStyle || existing.coding_style),
            favoritePatterns: JSON.stringify(prefs.favoritePatterns || existing.favorite_patterns),
            recentPlugins: JSON.stringify(prefs.recentPlugins || existing.recent_plugins),
            categoriesInterest: JSON.stringify(prefs.categoriesInterest || existing.categories_interest),
            contextPreferences: JSON.stringify(prefs.contextPreferences || existing.context_preferences)
          }
        });
      } else {
        // Insert
        await sequelize.query(`
          INSERT INTO ai_user_preferences
          (user_id, session_id, store_id, preferred_mode, coding_style, favorite_patterns, recent_plugins, categories_interest, context_preferences, created_at, updated_at)
          VALUES (:userId, :sessionId, :storeId, :preferredMode, :codingStyle, :favoritePatterns, :recentPlugins, :categoriesInterest, :contextPreferences, NOW(), NOW())
        `, {
          replacements: {
            userId: userId || null,
            sessionId,
            storeId: storeId || null,
            preferredMode: prefs.preferredMode || null,
            codingStyle: JSON.stringify(prefs.codingStyle || {}),
            favoritePatterns: JSON.stringify(prefs.favoritePatterns || []),
            recentPlugins: JSON.stringify(prefs.recentPlugins || []),
            categoriesInterest: JSON.stringify(prefs.categoriesInterest || []),
            contextPreferences: JSON.stringify(prefs.contextPreferences || {})
          }
        });
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Add new context document (for admin/API use)
   */
  async addContextDocument(document) {
    try {
      const [result] = await sequelize.query(`
        INSERT INTO ai_context_documents (type, title, content, category, tags, priority, mode, is_active, store_id, created_at, updated_at)
        VALUES (:type, :title, :content, :category, :tags, :priority, :mode, :isActive, :storeId, NOW(), NOW())
        RETURNING id
      `, {
        replacements: {
          type: document.type,
          title: document.title,
          content: document.content,
          category: document.category || null,
          tags: JSON.stringify(document.tags || []),
          priority: document.priority || 0,
          mode: document.mode || 'all',
          isActive: document.isActive !== false,
          storeId: document.storeId || null
        }
      });

      return result[0];
    } catch (error) {
      console.error('Error adding context document:', error);
      throw error;
    }
  }

  /**
   * Clear cache (useful after adding new context)
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
