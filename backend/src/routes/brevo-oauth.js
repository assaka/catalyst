const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const brevoOAuthService = require('../services/brevo-oauth-service');
const emailService = require('../services/email-service');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/brevo/oauth/init
 * Initiate Brevo OAuth flow
 */
router.get('/oauth/init', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Generate OAuth URL
    const authUrl = brevoOAuthService.initiateOAuth(store_id);

    res.json({
      success: true,
      data: {
        authUrl
      }
    });
  } catch (error) {
    console.error('Brevo OAuth init error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate OAuth',
      error: error.message
    });
  }
});

/**
 * GET /api/brevo/oauth/callback
 * Handle Brevo OAuth callback
 */
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing OAuth parameters'
      });
    }

    // Decode state to get store_id
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { storeId } = stateData;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid state parameter'
      });
    }

    // Check store access
    req.params.store_id = storeId;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Exchange code for tokens
    const result = await brevoOAuthService.handleOAuthCallback(code, storeId);

    // Redirect to settings page with success message
    const corsOrigin = process.env.CORS_ORIGIN || 'https://catalyst-pearl.vercel.app';
    res.redirect(`${corsOrigin}/admin/settings?tab=email&brevo_connected=true`);
  } catch (error) {
    console.error('Brevo OAuth callback error:', error);

    // Redirect to settings page with error
    const corsOrigin = process.env.CORS_ORIGIN || 'https://catalyst-pearl.vercel.app';
    res.redirect(`${corsOrigin}/admin/settings?tab=email&brevo_error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * POST /api/brevo/oauth/disconnect
 * Disconnect Brevo from store
 */
router.post('/oauth/disconnect', [
  body('store_id').isUUID().withMessage('Valid store_id is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id } = req.body;

    // Check store access
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await brevoOAuthService.disconnect(store_id);

    res.json({
      success: true,
      message: 'Brevo disconnected successfully'
    });
  } catch (error) {
    console.error('Brevo disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Brevo',
      error: error.message
    });
  }
});

/**
 * GET /api/brevo/oauth/status
 * Check Brevo connection status for a store
 */
router.get('/oauth/status', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const isConfigured = await brevoOAuthService.isConfigured(store_id);
    const config = await brevoOAuthService.getConfiguration(store_id);

    res.json({
      success: true,
      data: {
        isConfigured,
        config: config ? {
          sender_name: config.sender_name,
          sender_email: config.sender_email,
          is_active: config.is_active,
          token_expires_at: config.token_expires_at,
          connected_at: config.created_at
        } : null
      }
    });
  } catch (error) {
    console.error('Brevo status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Brevo status',
      error: error.message
    });
  }
});

/**
 * POST /api/brevo/test-connection
 * Test Brevo connection by sending a test email
 */
router.post('/test-connection', [
  body('store_id').isUUID().withMessage('Valid store_id is required'),
  body('test_email').isEmail().withMessage('Valid test email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, test_email } = req.body;

    // Check store access
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Test connection
    const result = await brevoOAuthService.testConnection(store_id);

    // If connection is successful, optionally send a test email
    if (result.success) {
      try {
        // Create a simple test email
        const testHtml = `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Brevo Connection Test</h2>
              <p>This is a test email from your Catalyst email system.</p>
              <p>If you received this email, your Brevo integration is working correctly!</p>
              <p>Account: ${result.account.email}</p>
              <p>Company: ${result.account.companyName || 'N/A'}</p>
              <hr>
              <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
            </body>
          </html>
        `;

        await emailService.sendViaBrevo(
          store_id,
          test_email,
          'Brevo Connection Test',
          testHtml
        );

        result.test_email_sent = true;
      } catch (emailError) {
        console.error('Failed to send test email:', emailError.message);
        result.test_email_sent = false;
        result.email_error = emailError.message;
      }
    }

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Brevo test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Brevo connection',
      error: error.message
    });
  }
});

/**
 * GET /api/brevo/email-statistics
 * Get email sending statistics for a store
 */
router.get('/email-statistics', async (req, res) => {
  try {
    const { store_id, days = 30 } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store access
    req.params.store_id = store_id;
    await new Promise((resolve, reject) => {
      checkStoreOwnership(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const stats = await emailService.getEmailStatistics(store_id, parseInt(days));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get email statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email statistics',
      error: error.message
    });
  }
});

module.exports = router;
