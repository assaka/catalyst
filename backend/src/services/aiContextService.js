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

const ConnectionManager = require('./database/ConnectionManager');

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
      documents: await this.getRelevantDocuments({ mode, category, storeId, limit: 5 }),
      examples: await this.getRelevantExamples({ category, query, storeId, limit: 3 }),
      patterns: await this.getRelevantPatterns({ query, storeId, limit: 5 })
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
  async getRelevantDocuments({ mode, category, storeId = null, limit = 5 }) {
    try {
      // Get storeId if not provided
      if (!storeId) {
        const { masterDbClient } = require('../database/masterConnection');
        const { data: store } = await masterDbClient
          .from('stores')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }

      if (!storeId) {
        console.warn('No store found for AI context documents');
        return [];
      }

      // Get tenant connection for AI context data
      const connection = await ConnectionManager.getStoreConnection(storeId);

      let query = connection.client
        .from('ai_context_documents')
        .select('id, type, title, content, category, tags, priority')
        .eq('is_active', true)
        .or(`mode.eq.${mode},mode.eq.all`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.or(`category.eq.${category},category.eq.core`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching context documents:', error);
        return [];
      }

      return data || [];
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
  async getRelevantExamples({ category, query, storeId = null, limit = 3 }) {
    try {
      // Get storeId if not provided
      if (!storeId) {
        const { masterDbClient } = require('../database/masterConnection');
        const { data: store } = await masterDbClient
          .from('stores')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }

      if (!storeId) {
        console.warn('No store found for AI plugin examples');
        return [];
      }

      // Get tenant connection for AI examples
      const connection = await ConnectionManager.getStoreConnection(storeId);

      let query_builder = connection.client
        .from('ai_plugin_examples')
        .select('id, name, slug, description, category, complexity, code, files, features, use_cases, tags')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (category) {
        query_builder = query_builder.eq('category', category);
      }

      const { data, error } = await query_builder;

      if (error) {
        console.error('Error fetching plugin examples:', error);
        return [];
      }

      // Parse JSON fields (Supabase returns them as objects already)
      return (data || []).map(r => ({
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
  async getRelevantPatterns({ query, storeId = null, limit = 5 }) {
    try {
      // Get storeId if not provided
      if (!storeId) {
        const { masterDbClient } = require('../database/masterConnection');
        const { data: store } = await masterDbClient
          .from('stores')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }

      if (!storeId) {
        console.warn('No store found for AI code patterns');
        return [];
      }

      // Get tenant connection for AI patterns
      const connection = await ConnectionManager.getStoreConnection(storeId);

      const { data, error } = await connection.client
        .from('ai_code_patterns')
        .select('id, name, pattern_type, description, code, language, framework, parameters, example_usage, tags')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching code patterns:', error);
        return [];
      }

      // Parse JSON fields (Supabase returns them as objects already)
      return (data || []).map(r => ({
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
  async trackContextUsage({ documentId, exampleId, patternId, userId, sessionId, query, wasHelpful, storeId = null }) {
    try {
      // Get storeId if not provided
      if (!storeId) {
        const { masterDbClient } = require('../database/masterConnection');
        const { data: store } = await masterDbClient
          .from('stores')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }

      if (!storeId) {
        console.warn('No store found for tracking context usage');
        return;
      }

      // Get tenant connection for AI context tracking
      const connection = await ConnectionManager.getStoreConnection(storeId);

      // Log to usage table for analytics
      await connection.client
        .from('ai_context_usage')
        .insert({
          document_id: documentId || null,
          example_id: exampleId || null,
          pattern_id: patternId || null,
          user_id: userId || null,
          session_id: sessionId || null,
          query: query || null,
          was_helpful: wasHelpful || null,
          created_at: new Date().toISOString()
        });

      // Increment usage counts for sorting (higher usage = shown first)
      if (exampleId) {
        await connection.client.rpc('increment_usage_count', {
          table_name: 'ai_plugin_examples',
          record_id: exampleId
        }).catch(() => {
          // Fallback if RPC doesn't exist - just skip incrementing
          console.warn('Could not increment usage count for example');
        });
      }
      if (patternId) {
        await connection.client.rpc('increment_usage_count', {
          table_name: 'ai_code_patterns',
          record_id: patternId
        }).catch(() => {
          // Fallback if RPC doesn't exist - just skip incrementing
          console.warn('Could not increment usage count for pattern');
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
      // Get storeId if not provided
      if (!storeId) {
        const { masterDbClient } = require('../database/masterConnection');
        const { data: store } = await masterDbClient
          .from('stores')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }

      if (!storeId) {
        console.warn('No store found for user preferences');
        return null;
      }

      // Get tenant connection for user preferences
      const connection = await ConnectionManager.getStoreConnection(storeId);

      let query = connection.client
        .from('ai_user_preferences')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (userId && sessionId) {
        query = query.or(`user_id.eq.${userId},session_id.eq.${sessionId}`);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return null;
      }

      if (data) {
        return {
          ...data,
          coding_style: typeof data.coding_style === 'string' ? JSON.parse(data.coding_style) : data.coding_style,
          favorite_patterns: typeof data.favorite_patterns === 'string' ? JSON.parse(data.favorite_patterns) : data.favorite_patterns,
          recent_plugins: typeof data.recent_plugins === 'string' ? JSON.parse(data.recent_plugins) : data.recent_plugins,
          categories_interest: typeof data.categories_interest === 'string' ? JSON.parse(data.categories_interest) : data.categories_interest,
          context_preferences: typeof data.context_preferences === 'string' ? JSON.parse(data.context_preferences) : data.context_preferences
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
      const { userId, sessionId, storeId: providedStoreId, ...prefs } = preferences;

      // Get storeId if not provided
      let storeId = providedStoreId;
      if (!storeId) {
        const { masterDbClient } = require('../database/masterConnection');
        const { data: store } = await masterDbClient
          .from('stores')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }

      if (!storeId) {
        console.warn('No store found for saving user preferences');
        return;
      }

      // Get tenant connection for user preferences
      const connection = await ConnectionManager.getStoreConnection(storeId);

      // Check if preferences exist
      const existing = await this.getUserPreferences({ userId, sessionId, storeId });

      if (existing) {
        // Update
        await connection.client
          .from('ai_user_preferences')
          .update({
            preferred_mode: prefs.preferredMode || existing.preferred_mode,
            coding_style: prefs.codingStyle || existing.coding_style,
            favorite_patterns: prefs.favoritePatterns || existing.favorite_patterns,
            recent_plugins: prefs.recentPlugins || existing.recent_plugins,
            categories_interest: prefs.categoriesInterest || existing.categories_interest,
            context_preferences: prefs.contextPreferences || existing.context_preferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert
        await connection.client
          .from('ai_user_preferences')
          .insert({
            user_id: userId || null,
            session_id: sessionId,
            store_id: storeId,
            preferred_mode: prefs.preferredMode || null,
            coding_style: prefs.codingStyle || {},
            favorite_patterns: prefs.favoritePatterns || [],
            recent_plugins: prefs.recentPlugins || [],
            categories_interest: prefs.categoriesInterest || [],
            context_preferences: prefs.contextPreferences || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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
      // Get storeId if not provided
      let storeId = document.storeId;
      if (!storeId) {
        const { masterDbClient } = require('../database/masterConnection');
        const { data: store } = await masterDbClient
          .from('stores')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }

      if (!storeId) {
        throw new Error('No store found for adding context document');
      }

      // Get tenant connection for AI context documents
      const connection = await ConnectionManager.getStoreConnection(storeId);

      const { data, error } = await connection.client
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
          store_id: storeId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to add context document: ${error.message}`);
      }

      return data;
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
