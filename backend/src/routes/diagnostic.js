// Diagnostic endpoint to test Anthropic API configuration
const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const AIModel = require('../models/AIModel');

/**
 * GET /api/diagnostic/anthropic
 * Test Anthropic API configuration and model availability
 * Models are fetched from ai_models database table
 */
router.get('/anthropic', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
    apiKeyPrefix: process.env.ANTHROPIC_API_KEY
      ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...'
      : 'NOT SET',
    sdkVersion: '0.67.0', // From backend package.json
    tests: []
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({
      success: false,
      error: 'ANTHROPIC_API_KEY environment variable is not set',
      diagnostics
    });
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  // Get Anthropic models from database
  let modelsToTest = [];
  try {
    const dbModels = await AIModel.getByProvider('anthropic');
    modelsToTest = dbModels.map(m => m.api_model);
    diagnostics.modelsSource = 'database';
    diagnostics.modelsCount = modelsToTest.length;
  } catch (error) {
    console.warn('Failed to fetch models from database, using fallback:', error.message);
    // Fallback models if database unavailable
    modelsToTest = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229'
    ];
    diagnostics.modelsSource = 'fallback';
    diagnostics.modelsError = error.message;
  }

  let workingModel = null;

  for (const model of modelsToTest) {
    try {
      const message = await client.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Test'
        }]
      });

      diagnostics.tests.push({
        model,
        status: 'success',
        response: message.content[0].text,
        usage: message.usage
      });

      if (!workingModel) {
        workingModel = model;
      }
    } catch (error) {
      diagnostics.tests.push({
        model,
        status: 'failed',
        error: error.message,
        statusCode: error.status,
        errorType: error.type
      });
    }
  }

  res.json({
    success: !!workingModel,
    workingModel,
    recommendation: workingModel
      ? `Use model: ${workingModel}`
      : 'No working model found - check API key validity',
    diagnostics
  });
});

module.exports = router;
