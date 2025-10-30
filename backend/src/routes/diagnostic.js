// Diagnostic endpoint to test Anthropic API configuration
const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

/**
 * GET /api/diagnostic/anthropic
 * Test Anthropic API configuration and model availability
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

  // Test models in order of preference
  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ];

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
