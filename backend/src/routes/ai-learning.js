/**
 * AI Learning Routes
 * Endpoints for AI training, feedback, and documentation management
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
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
 * Analyze failed interactions (admin only)
 */
router.get('/failures', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.query.store_id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const result = await aiLearningService.analyzeFailures(storeId);
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
 * List all AI context documents
 */
router.get('/documents', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.query.store_id;
    const { type, category, is_active } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const db = await require('../services/database/ConnectionManager').getStoreConnection(storeId);

    let query = db
      .from('ai_context_documents')
      .select('id', 'type', 'title', 'category', 'tags', 'priority', 'mode', 'is_active', 'created_at', 'updated_at')
      .orderBy('priority', 'desc')
      .orderBy('created_at', 'desc');

    if (type) {
      query = query.where('type', type);
    }
    if (category) {
      query = query.where('category', category);
    }
    if (is_active !== undefined) {
      query = query.where('is_active', is_active === 'true');
    }

    const documents = await query;

    res.json({
      success: true,
      data: documents.map(d => ({
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
 * Get a single document with full content
 */
router.get('/documents/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.query.store_id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const db = await require('../services/database/ConnectionManager').getStoreConnection(storeId);

    const document = await db
      .from('ai_context_documents')
      .select('*')
      .where('id', req.params.id)
      .first();

    if (!document) {
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
 * Create a new AI context document
 */
router.post('/documents', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.body.storeId;
    const { title, content, type, category, tags, priority, mode } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'title and content are required'
      });
    }

    const result = await aiLearningService.addDocumentation({
      storeId,
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
 * Update an AI context document
 */
router.put('/documents/:id', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.body.storeId;
    const { title, content, type, category, tags, priority, mode, is_active } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const db = await require('../services/database/ConnectionManager').getStoreConnection(storeId);

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (priority !== undefined) updateData.priority = priority;
    if (mode !== undefined) updateData.mode = mode;
    if (is_active !== undefined) updateData.is_active = is_active;

    const [updated] = await db
      .from('ai_context_documents')
      .where('id', req.params.id)
      .update(updateData)
      .returning('*');

    if (!updated) {
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
 * Delete an AI context document
 */
router.delete('/documents/:id', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.query.store_id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const db = await require('../services/database/ConnectionManager').getStoreConnection(storeId);

    const deleted = await db
      .from('ai_context_documents')
      .where('id', req.params.id)
      .delete();

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
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
 * Bulk import documents from array
 */
router.post('/documents/bulk-import', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.body.storeId;
    const { documents } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'documents array is required'
      });
    }

    const result = await aiLearningService.bulkImportDocumentation(storeId, documents);

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
 * List all entity definitions
 */
router.get('/entities', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.query.store_id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const entities = await aiEntityService.getEntityDefinitions(storeId);

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
 * Update entity definition (keywords, examples, etc.)
 */
router.put('/entities/:entityName', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.body.storeId;
    const { intent_keywords, example_prompts, example_responses, is_active, priority } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const db = await require('../services/database/ConnectionManager').getStoreConnection(storeId);

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (intent_keywords !== undefined) updateData.intent_keywords = JSON.stringify(intent_keywords);
    if (example_prompts !== undefined) updateData.example_prompts = JSON.stringify(example_prompts);
    if (example_responses !== undefined) updateData.example_responses = JSON.stringify(example_responses);
    if (is_active !== undefined) updateData.is_active = is_active;
    if (priority !== undefined) updateData.priority = priority;

    const [updated] = await db
      .from('ai_entity_definitions')
      .where('entity_name', req.params.entityName)
      .update(updateData)
      .returning('*');

    if (!updated) {
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
 * List plugin examples
 */
router.get('/examples', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.query.store_id;
    const { category, complexity } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const db = await require('../services/database/ConnectionManager').getStoreConnection(storeId);

    let query = db
      .from('ai_plugin_examples')
      .select('id', 'name', 'slug', 'description', 'category', 'complexity', 'features', 'use_cases', 'tags', 'usage_count', 'is_template', 'is_active')
      .orderBy('usage_count', 'desc');

    if (category) {
      query = query.where('category', category);
    }
    if (complexity) {
      query = query.where('complexity', complexity);
    }

    const examples = await query;

    res.json({
      success: true,
      data: examples.map(e => ({
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
 * Add a new plugin example
 */
router.post('/examples', authMiddleware, authorize(['admin']), async (req, res) => {
  try {
    const storeId = req.headers['x-store-id'] || req.body.storeId;
    const { name, description, category, complexity, code, files, features, useCases, tags, isTemplate } = req.body;

    if (!storeId || !name || !code) {
      return res.status(400).json({
        success: false,
        message: 'store_id, name, and code are required'
      });
    }

    const result = await aiLearningService.addPluginExample({
      storeId,
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
