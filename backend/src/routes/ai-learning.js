/**
 * AI Learning Routes
 * Endpoints for AI training, feedback, and documentation management
 *
 * ALL AI tables are in MASTER DB for cross-user learning
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
const { masterDbClient } = require('../database/masterConnection');
const aiLearningService = require('../services/aiLearningService');
const aiContextService = require('../services/aiContextService');
const aiEntityService = require('../services/aiEntityService');

/**
 * POST /api/ai-learning/feedback
 * Record user feedback on AI response
 */
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const {
      conversationId,
      messageId,
      userMessage,
      aiResponse,
      intent,
      entity,
      operation,
      wasHelpful,
      feedbackText
    } = req.body;

    const storeId = req.headers['x-store-id'] || req.body.storeId;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (wasHelpful === undefined) {
      return res.status(400).json({
        success: false,
        message: 'wasHelpful (true/false) is required'
      });
    }

    const result = await aiLearningService.recordFeedback({
      storeId,
      userId: req.user.id,
      conversationId,
      messageId,
      userMessage,
      aiResponse,
      intent,
      entity,
      operation,
      wasHelpful,
      feedbackText
    });

    res.json(result);
  } catch (error) {
    console.error('AI feedback error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ai-learning/stats
 * Get AI learning statistics (admin only)
 */
router.get('/stats', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.query.store_id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const result = await aiLearningService.getLearningStats(storeId);
    res.json(result);
  } catch (error) {
    console.error('AI stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ai-learning/failures
 * Analyze failed interactions (admin only) - global analysis from MASTER DB
 */
router.get('/failures', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    // No storeId needed - analyzes global failures from MASTER DB
    const result = await aiLearningService.analyzeFailures();
    res.json(result);
  } catch (error) {
    console.error('AI failures analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ DOCUMENTATION MANAGEMENT ============

/**
 * GET /api/ai-learning/documents
 * List all AI context documents (from MASTER DB - global knowledge)
 */
router.get('/documents', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { type, category, is_active } = req.query;

    // Query MASTER DB (global documents)
    let query = masterDbClient
      .from('ai_context_documents')
      .select('id, type, title, category, tags, priority, mode, is_active, created_at, updated_at')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: documents, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: (documents || []).map(d => ({
        ...d,
        tags: typeof d.tags === 'string' ? JSON.parse(d.tags) : d.tags
      }))
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ai-learning/documents/:id
 * Get a single document with full content (from MASTER DB)
 */
router.get('/documents/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    // Query MASTER DB (global documents)
    const { data: document, error } = await masterDbClient
      .from('ai_context_documents')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...document,
        tags: typeof document.tags === 'string' ? JSON.parse(document.tags) : document.tags,
        metadata: typeof document.metadata === 'string' ? JSON.parse(document.metadata) : document.metadata
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ai-learning/documents
 * Create a new AI context document (in MASTER DB - global knowledge)
 */
router.post('/documents', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { title, content, type, category, tags, priority, mode } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'title and content are required'
      });
    }

    // Add document to MASTER DB via aiLearningService
    const result = await aiLearningService.addDocumentation({
      title,
      content,
      type: type || 'reference',
      category: category || 'general',
      tags: tags || [],
      priority: priority || 50,
      mode: mode || 'all'
    });

    res.json(result);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/ai-learning/documents/:id
 * Update an AI context document (in MASTER DB)
 */
router.put('/documents/:id', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { title, content, type, category, tags, priority, mode, is_active } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (priority !== undefined) updateData.priority = priority;
    if (mode !== undefined) updateData.mode = mode;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update in MASTER DB
    const { data: updated, error } = await masterDbClient
      .from('ai_context_documents')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !updated) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Clear cache
    aiContextService.clearCache();

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/ai-learning/documents/:id
 * Delete an AI context document (from MASTER DB)
 */
router.delete('/documents/:id', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    // Delete from MASTER DB
    const { error, count } = await masterDbClient
      .from('ai_context_documents')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw error;
    }

    aiContextService.clearCache();

    res.json({
      success: true,
      message: 'Document deleted'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ai-learning/documents/bulk-import
 * Bulk import documents from array (to MASTER DB - global knowledge)
 */
router.post('/documents/bulk-import', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { documents } = req.body;

    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'documents array is required'
      });
    }

    // Import to MASTER DB (no storeId needed)
    const result = await aiLearningService.bulkImportDocumentation(null, documents);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ ENTITY DEFINITIONS MANAGEMENT ============

/**
 * GET /api/ai-learning/entities
 * List all entity definitions (from MASTER DB - global schemas)
 */
router.get('/entities', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    // Get entity definitions from MASTER DB (no storeId needed)
    const entities = await aiEntityService.getEntityDefinitions();

    res.json({
      success: true,
      data: entities
    });
  } catch (error) {
    console.error('List entities error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/ai-learning/entities/:entityName
 * Update entity definition (keywords, examples, etc.) in MASTER DB
 */
router.put('/entities/:entityName', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { intent_keywords, example_prompts, example_responses, is_active, priority } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (intent_keywords !== undefined) updateData.intent_keywords = intent_keywords;
    if (example_prompts !== undefined) updateData.example_prompts = example_prompts;
    if (example_responses !== undefined) updateData.example_responses = example_responses;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (priority !== undefined) updateData.priority = priority;

    // Update in MASTER DB
    const { data: updated, error } = await masterDbClient
      .from('ai_entity_definitions')
      .update(updateData)
      .eq('entity_name', req.params.entityName)
      .select()
      .single();

    if (error || !updated) {
      return res.status(404).json({
        success: false,
        message: 'Entity definition not found'
      });
    }

    // Clear cache
    aiEntityService.clearCache();

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update entity error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============ PLUGIN EXAMPLES MANAGEMENT ============

/**
 * GET /api/ai-learning/examples
 * List plugin examples (from MASTER DB - global code examples)
 */
router.get('/examples', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { category, complexity } = req.query;

    // Query MASTER DB for global plugin examples
    let query = masterDbClient
      .from('ai_plugin_examples')
      .select('id, name, slug, description, category, complexity, features, use_cases, tags, usage_count, is_template, is_active')
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (complexity) {
      query = query.eq('complexity', complexity);
    }

    const { data: examples, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: (examples || []).map(e => ({
        ...e,
        features: typeof e.features === 'string' ? JSON.parse(e.features) : e.features,
        use_cases: typeof e.use_cases === 'string' ? JSON.parse(e.use_cases) : e.use_cases,
        tags: typeof e.tags === 'string' ? JSON.parse(e.tags) : e.tags
      }))
    });
  } catch (error) {
    console.error('List examples error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ai-learning/examples
 * Add a new plugin example (to MASTER DB - global examples)
 */
router.post('/examples', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const { name, description, category, complexity, code, files, features, useCases, tags, isTemplate } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'name and code are required'
      });
    }

    // Add to MASTER DB via aiLearningService
    const result = await aiLearningService.addPluginExample({
      name,
      description,
      category,
      complexity,
      code,
      files,
      features,
      useCases,
      tags,
      isTemplate
    });

    res.json(result);
  } catch (error) {
    console.error('Add example error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
