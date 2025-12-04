/**
 * Plugin AI Assistant API Routes
 */

const express = require('express');
const router = express.Router();
const pluginAIService = require('../services/pluginAIService');

/**
 * POST /api/plugins/ai/generate
 * Generate plugin from natural language description
 */
router.post('/generate', async (req, res) => {
  try {
    const { mode, prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await pluginAIService.generatePlugin(mode || 'nocode-ai', prompt, context);

    res.json(result);
  } catch (error) {
    console.error('Error generating plugin:', error);
    res.status(500).json({
      error: 'Failed to generate plugin',
      message: error.message
    });
  }
});

/**
 * POST /api/plugins/ai/suggest-code
 * Get code suggestions for developer mode
 */
router.post('/suggest-code', async (req, res) => {
  try {
    const { fileName, currentCode, prompt } = req.body;

    if (!fileName || !prompt) {
      return res.status(400).json({ error: 'fileName and prompt are required' });
    }

    const suggestion = await pluginAIService.generateCodeSuggestion(
      fileName,
      currentCode || '',
      prompt
    );

    res.json({ suggestion });
  } catch (error) {
    console.error('Error generating code suggestion:', error);
    res.status(500).json({
      error: 'Failed to generate code suggestion',
      message: error.message
    });
  }
});

/**
 * POST /api/plugins/ai/ask
 * Ask a question about plugin development
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, pluginContext } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const answer = await pluginAIService.answerQuestion(question, pluginContext || {});

    res.json({ answer });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({
      error: 'Failed to answer question',
      message: error.message
    });
  }
});

/**
 * POST /api/plugins/ai/template
 * Generate plugin from template
 */
router.post('/template', async (req, res) => {
  try {
    const { templateId, customization } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const result = await pluginAIService.generateFromTemplate(templateId, customization);

    res.json(result);
  } catch (error) {
    console.error('Error generating from template:', error);
    res.status(500).json({
      error: 'Failed to generate from template',
      message: error.message
    });
  }
});

/**
 * POST /api/plugins/ai/chat
 * Chat with AI assistant (streaming)
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, mode, conversationHistory, pluginConfig, currentStep } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await pluginAIService.chatWithContext({
      message,
      mode: mode || 'nocode',
      conversationHistory: conversationHistory || [],
      pluginConfig: pluginConfig || {},
      currentStep: currentStep || 'start'
    });

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    if (result.stream) {
      for await (const chunk of result.stream) {
        if (chunk.type === 'content_block_delta') {
          const text = chunk.delta.text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
    }

    // Send final metadata
    res.write(`data: ${JSON.stringify({
      config: result.config,
      step: result.step,
      suggestions: result.suggestions
    })}\n\n`);

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('Error in chat:', error);

    // If streaming hasn't started, send error as JSON
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to chat with AI',
        message: error.message
      });
    } else {
      // If streaming has started, send error as SSE
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

/**
 * POST /api/plugins/ai/smart-suggestions
 * Generate smart contextual suggestions for next steps
 */
router.post('/smart-suggestions', async (req, res) => {
  try {
    const { context, currentStep, pluginConfig, recentMessages, userMessage } = req.body;

    const suggestions = await pluginAIService.generateSmartSuggestions({
      context: context || 'initial',
      currentStep: currentStep || 'start',
      pluginConfig: pluginConfig || {},
      recentMessages: recentMessages || [],
      userMessage: userMessage || ''
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error.message
    });
  }
});

/**
 * GET /api/plugins/ai/status
 * Check if AI service is available
 */
router.get('/status', async (req, res) => {
  try {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const apiKey = process.env.ANTHROPIC_API_KEY || '';

    // Debug: Show key format without exposing full key
    const keyPreview = apiKey ? `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}` : 'not set';
    const keyLength = apiKey.length;
    const hasWhitespace = apiKey !== apiKey.trim();

    res.json({
      available: hasApiKey,
      model: 'claude-3-5-sonnet-latest',
      message: hasApiKey
        ? 'AI service is ready'
        : 'ANTHROPIC_API_KEY not configured',
      debug: {
        keyPreview,
        keyLength,
        hasWhitespace,
        startsWithCorrectPrefix: apiKey.startsWith('sk-ant-')
      }
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      error: error.message
    });
  }
});

module.exports = router;
