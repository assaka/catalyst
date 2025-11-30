const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { storeResolver } = require('../middleware/storeResolver');
const aiWorkspaceService = require('../services/ai-workspace-service');

const router = express.Router();

// All routes require authentication and automatic store resolution
router.use(authMiddleware);
router.use(storeResolver);

// @route   POST /api/ai/studio/chat
// @desc    Process AI chat messages with context awareness
// @access  Private
router.post('/chat', async (req, res) => {
  try {
    const { message, context, history = [], capabilities = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const response = await aiWorkspaceService.processMessage({
      message,
      context,
      history,
      capabilities,
      userId: req.user.id,
      storeId: req.storeId
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('AI Workspace chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI processing failed'
    });
  }
});

// @route   POST /api/ai/studio/execute
// @desc    Execute AI-generated actions (translations, design changes, etc.)
// @access  Private
router.post('/execute', async (req, res) => {
  try {
    const { action, params } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }

    const result = await aiWorkspaceService.executeAction(action, params, req.user.id, req.storeId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI Workspace execute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Action execution failed'
    });
  }
});

// @route   GET /api/ai/studio/history
// @desc    Get AI conversation history
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const { context, limit = 50 } = req.query;

    const history = await aiWorkspaceService.getHistory(req.user.id, req.storeId, context, limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get AI history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/ai/studio/history
// @desc    Clear AI conversation history
// @access  Private
router.delete('/history', async (req, res) => {
  try {
    const { context } = req.query;

    await aiWorkspaceService.clearHistory(req.user.id, req.storeId, context);

    res.json({
      success: true,
      message: 'History cleared successfully'
    });
  } catch (error) {
    console.error('Clear AI history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/ai/studio/suggestions
// @desc    Get context-aware prompt suggestions
// @access  Private
router.get('/suggestions', async (req, res) => {
  try {
    const { context } = req.query;

    const suggestions = await aiWorkspaceService.getSuggestions(context);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Get AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
