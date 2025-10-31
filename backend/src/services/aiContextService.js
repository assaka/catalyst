/**
 * AI Context Service - RAG (Retrieval-Augmented Generation) System
 *
 * This service fetches context data from the database to enhance AI prompts with:
 * - Knowledge base documents (architecture, best practices, tutorials)
 * - Working plugin examples (real code to reference)
 * - Reusable code patterns (snippets for specific tasks)
 *
 * WHEN TO USE:
 * - Plugin generation (pluginAIService.js)
 * - Translations (translation-service.js)
 * - AI Studio (ai-studio-service.js)
 * - Any AI feature that needs contextual knowledge
 *
 * WHEN NOT TO USE:
 * - Simple greetings or acknowledgments
 * - Error messages
 * - Non-AI operations
 *
 * See: backend/src/services/RAG_SYSTEM.md for full documentation
 */

const { Sequelize } = require('sequelize');
const { sequelize } = require('../database/connection');

class AIContextService {
  constructor() {
    // In-memory cache to reduce database hits (5 minute TTL)
    // Cache is cleared manually via clearCache() when new content is added
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
   *
   * This is the primary method you should use. It fetches all relevant context
   * (documents, examples, patterns) and formats them into an AI-readable string.
   *
   * @param {Object} options - Query options
   * @param {string} options.mode - 'nocode' | 'developer' | 'all' - Which builder mode
   * @param {string} options.category - 'core' | 'translations' | 'ai-studio' | 'commerce' | 'marketing'
   * @param {string} options.query - User's input/prompt to help find relevant context
   * @param {number} [options.storeId] - Optional store ID for store-specific context
   * @param {number} [options.limit=10] - Max total items to fetch (split across documents/examples/patterns)
   *
   * @returns {Promise<string>} Formatted context string ready to inject into AI system prompt
   *
   * @example
   * // For plugin generation
   * const context = await aiContextService.getContextForQuery({
   *   mode: 'nocode',
   *   category: 'commerce',
   *   query: 'create a wishlist plugin',
   *   limit: 8
   * });
   *
   * @example
   * // For translations
   * const context = await aiContextService.getContextForQuery({
   *   mode: 'all',
   *   category: 'translations',
   *   query: 'translate from English to French',
   *   limit: 5
   * });
   *
   * @example
   * // For AI Studio
   * const context = await aiContextService.getContextForQuery({
   *   mode: 'all',
   *   category: 'ai-studio',
   *   query: 'design homepage layout',
   *   limit: 5
   * });
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
   * Get relevant knowledge base documents from ai_context_documents table
   *
   * WHAT IT FETCHES:
   * - Architecture guides and API references
   * - Best practices and tutorials
   * - Feature-specific documentation
   *
   * WHEN TO USE DIRECTLY:
   * - When you only need documentation (no code examples)
   * - When building custom context combinations
   * - Usually you should use getContextForQuery() instead
   *
   * @param {Object} options - Query options
   * @param {string} options.mode - 'nocode' | 'developer' | 'all' - Filters docs by target audience
   * @param {string} [options.category] - 'core' | 'translations' | 'ai-studio' etc. - Filters by feature
   * @param {number} [options.limit=5] - Max documents to return
   *
   * @returns {Promise<Array>} Array of document objects with: id, type, title, content, category, tags, priority
   *
   * DOCUMENTS ARE ORDERED BY:
   * 1. Priority (100 = critical, always include)
   * 2. Creation date (newer first)
   *
   * @example
   * const docs = await aiContextService.getRelevantDocuments({
   *   mode: 'developer',
   *   category: 'core',
   *   limit: 10
   * });
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
   * Get relevant working plugin examples from ai_plugin_examples table
   *
   * WHAT IT FETCHES:
   * - Real, working plugin code that AI can reference and adapt
   * - Similar plugins to what user is trying to build
   * - Template plugins that can be starting points
   *
   * WHEN TO USE DIRECTLY:
   * - When user wants to build something similar to existing plugins
   * - When showing code structure patterns
   * - Usually you should use getContextForQuery() instead
   *
   * @param {Object} options - Query options
   * @param {string} [options.category] - 'marketing' | 'commerce' | 'analytics' | 'integration' | 'translations'
   * @param {string} [options.query] - User's prompt (future: will use for vector similarity)
   * @param {number} [options.limit=3] - Max examples to return
   *
   * @returns {Promise<Array>} Array of example objects with parsed JSON fields (features, use_cases, tags, files)
   *
   * EXAMPLES ARE ORDERED BY:
   * 1. Templates first (is_template = true)
   * 2. Most frequently used (usage_count)
   * 3. Highest rated
   *
   * FUTURE: Will implement vector similarity search using query parameter and embedding_vector column
   *
   * @example
   * const examples = await aiContextService.getRelevantExamples({
   *   category: 'marketing',
   *   query: 'banner announcement',
   *   limit: 3
   * });
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

      // Parse JSON fields from PostgreSQL JSONB
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
   * Get relevant code patterns from ai_code_patterns table
   *
   * WHAT IT FETCHES:
   * - Reusable code snippets for specific technical tasks
   * - Database migrations, API endpoints, validation logic
   * - UI components, email templates, security patterns
   *
   * WHEN TO USE DIRECTLY:
   * - When you need specific technical solutions
   * - When user asks "how do I create a database table"
   * - Usually you should use getContextForQuery() instead
   *
   * @param {Object} options - Query options
   * @param {string} [options.query] - User's prompt (future: will use for vector similarity)
   * @param {number} [options.limit=5] - Max patterns to return
   *
   * @returns {Promise<Array>} Array of pattern objects with parsed JSON fields (parameters, tags)
   *
   * PATTERNS ARE ORDERED BY:
   * - Most frequently used (usage_count DESC)
   *
   * PATTERN TYPES:
   * - 'database' - Sequelize migrations, queries
   * - 'api' - Express endpoints, middleware
   * - 'validation' - Input validation, sanitization
   * - 'ui_component' - React components, CSS
   * - 'email' - Email templates, sending
   * - 'security' - Auth, permissions, encryption
   *
   * FUTURE: Will implement vector similarity search using query parameter
   *
   * @example
   * const patterns = await aiContextService.getRelevantPatterns({
   *   query: 'database table create migration',
   *   limit: 5
   * });
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

      // Parse JSON fields from PostgreSQL JSONB
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
   * Format context objects into AI-readable markdown string
   *
   * WHAT IT DOES:
   * - Converts database results into structured markdown
   * - Formats code blocks with proper syntax highlighting
   * - Organizes by sections: Knowledge Base, Examples, Patterns
   *
   * DO NOT CALL THIS DIRECTLY:
   * - This is called automatically by getContextForQuery()
   * - Only use if you're building custom context fetching logic
   *
   * @param {Object} context - Context object with documents, examples, patterns arrays
   * @param {Array} context.documents - Knowledge base documents
   * @param {Array} context.examples - Plugin examples
   * @param {Array} context.patterns - Code patterns
   *
   * @returns {string} Formatted markdown string ready for AI system prompt
   *
   * OUTPUT FORMAT:
   * # KNOWLEDGE BASE
   * ## Document Title
   * Document content...
   *
   * # PLUGIN EXAMPLES
   * ## Example Name (complexity)
   * **Description:** ...
   * **Code:**
   * ```javascript
   * code here
   * ```
   *
   * # CODE PATTERNS & SNIPPETS
   * ## Pattern Name (pattern_type)
   * **Description:** ...
   * **Code:**
   * ```language
   * code here
   * ```
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
   * Track which context was used to help improve RAG system over time
   *
   * WHEN TO USE:
   * - After AI generates a plugin
   * - When user provides feedback (helpful/not helpful)
   * - Every time RAG context is used in production
   *
   * WHY TRACK:
   * - Identify which documents/examples are most helpful
   * - Improve context selection algorithms
   * - Remove unhelpful context
   * - Understand user needs better
   *
   * @param {Object} usage - Usage tracking data
   * @param {number} [usage.documentId] - Which document from ai_context_documents was used
   * @param {number} [usage.exampleId] - Which example from ai_plugin_examples was used
   * @param {number} [usage.patternId] - Which pattern from ai_code_patterns was used
   * @param {number} [usage.userId] - User ID (if logged in)
   * @param {string} [usage.sessionId] - Session ID (always available)
   * @param {string} [usage.query] - User's original query/prompt
   * @param {boolean} [usage.wasHelpful] - Did this context help? (get from user feedback)
   *
   * WHAT IT DOES:
   * 1. Logs usage to ai_context_usage table
   * 2. Increments usage_count on the example/pattern (for sorting)
   *
   * ANALYTICS QUERIES:
   * ```sql
   * -- Most helpful documents
   * SELECT d.title, COUNT(*) as uses, SUM(CASE WHEN cu.was_helpful THEN 1 ELSE 0 END) as helpful
   * FROM ai_context_documents d
   * JOIN ai_context_usage cu ON cu.document_id = d.id
   * GROUP BY d.id, d.title
   * ORDER BY helpful DESC;
   * ```
   *
   * @example
   * await aiContextService.trackContextUsage({
   *   documentId: 5,
   *   exampleId: 2,
   *   userId: 123,
   *   sessionId: 'abc-def',
   *   query: 'create wishlist plugin',
   *   wasHelpful: true
   * });
   */
  async trackContextUsage({ documentId, exampleId, patternId, userId, sessionId, query, wasHelpful }) {
    try {
      // Log to usage table for analytics
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

      // Increment usage counts for sorting (higher usage = shown first)
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
      // Don't throw - tracking failures shouldn't break the main flow
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
   * Add new context document to the knowledge base
   *
   * WHEN TO USE:
   * - Admin panel for adding documentation
   * - API endpoints for content management
   * - Programmatically seeding new content
   *
   * WHO USES:
   * - Admin users managing the knowledge base
   * - Migration/seed scripts
   * - NOT end users building plugins
   *
   * @param {Object} document - Document to add
   * @param {string} document.type - 'architecture' | 'api_reference' | 'best_practices' | 'tutorial' | 'reference' | 'capabilities'
   * @param {string} document.title - Document title
   * @param {string} document.content - Full document content (markdown supported)
   * @param {string} [document.category] - 'core' | 'translations' | 'ai-studio' | 'commerce' | 'marketing'
   * @param {Array<string>} [document.tags] - Tags for searchability
   * @param {number} [document.priority=0] - 0-100, higher = more important (100 = always include)
   * @param {string} [document.mode='all'] - 'nocode' | 'developer' | 'all'
   * @param {boolean} [document.isActive=true] - Whether to use in queries
   * @param {number} [document.storeId] - Store-specific content (rare)
   *
   * @returns {Promise<Object>} Created document with id
   *
   * IMPORTANT:
   * - Call clearCache() after adding to see changes immediately
   * - Priority 100 = critical, always shown
   * - Priority 80-99 = high priority
   * - Priority 50-79 = medium
   * - Priority 0-49 = low (rarely shown)
   *
   * @example
   * const doc = await aiContextService.addContextDocument({
   *   type: 'best_practices',
   *   title: 'SEO Optimization Guide',
   *   content: '# SEO Best Practices\n\nDetailed content...',
   *   category: 'marketing',
   *   tags: ['seo', 'optimization', 'metadata'],
   *   priority: 85,
   *   mode: 'all',
   *   isActive: true
   * });
   * aiContextService.clearCache(); // Important!
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
