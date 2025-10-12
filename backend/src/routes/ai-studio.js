const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const aiStudioService = require('../services/ai-studio-service');

const router = express.Router();

// @route   POST /api/ai/studio/chat
// @desc    Process AI chat messages with context awareness
// @access  Private
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, context, history = [], capabilities = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const response = await aiStudioService.processMessage({
      message,
      context,
      history,
      capabilities,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('AI Studio chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI processing failed'
    });
  }
});

// @route   POST /api/ai/studio/execute
// @desc    Execute AI-generated actions (translations, design changes, etc.)
// @access  Private
router.post('/execute', authMiddleware, async (req, res) => {
  try {
    const { action, params } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }

    const result = await aiStudioService.executeAction(action, params, req.user.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI Studio execute error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Action execution failed'
    });
  }
});

// @route   GET /api/ai/studio/history
// @desc    Get AI conversation history
// @access  Private
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { context, limit = 50 } = req.query;

    const history = await aiStudioService.getHistory(req.user.id, context, limit);

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
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    const { context } = req.query;

    await aiStudioService.clearHistory(req.user.id, context);

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
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { context } = req.query;

    const suggestions = await aiStudioService.getSuggestions(context);

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
