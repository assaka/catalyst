/**
 * Preview System API Routes
 * Handles server-side preview generation and rendering
 */

const express = require('express');
const router = express.Router();
const previewService = require('../services/preview-service');
const { authMiddleware } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiting for preview operations
const previewRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit to 20 preview requests per minute per IP
  message: {
    success: false,
    error: 'Too many preview requests. Please wait a moment.'
  }
});

/**
 * Create a new preview session
 * POST /api/preview/create
 */
router.post('/create', previewRateLimit, async (req, res) => {
  try {
    const {
      storeId,
      fileName,
      originalCode,
      modifiedCode,
      language = 'javascript',
      targetPath = '/'
    } = req.body;

    // Validation
    if (!storeId || !fileName || !originalCode || !modifiedCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: storeId, fileName, originalCode, modifiedCode'
      });
    }

    if (modifiedCode.length > 1024 * 1024) { // 1MB limit
      return res.status(400).json({
        success: false,
        error: 'Modified code exceeds size limit (1MB)'
      });
    }

    console.log(`🎬 Creating preview session for ${fileName} in store ${storeId}`);

    // Determine target path from fileName if not provided
    let finalTargetPath = targetPath;
    if (targetPath === '/' && fileName) {
      const pathMap = {
        'Cart.jsx': '/cart',
        'src/pages/Cart.jsx': '/cart',
        'Checkout.jsx': '/checkout', 
        'src/pages/Checkout.jsx': '/checkout',
        'Storefront.jsx': '/shop',
        'src/pages/Storefront.jsx': '/shop',
        'ProductDetail.jsx': '/products',
        'src/pages/ProductDetail.jsx': '/products'
      };
      finalTargetPath = pathMap[fileName] || '/';
    }

    const result = await previewService.createPreviewSession({
      storeId,
      fileName,
      originalCode,
      modifiedCode,
      language,
      targetPath: finalTargetPath
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Preview session created successfully',
        data: {
          sessionId: result.sessionId,
          previewUrl: result.previewUrl,
          expiresAt: result.expiresAt,
          fileName,
          targetPath: finalTargetPath
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in preview create endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Render preview content
 * GET /api/preview/render/:sessionId
 */
router.get('/render/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || !/^[a-f0-9]{32}$/.test(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format'
      });
    }

    console.log(`🖼 Rendering preview for session: ${sessionId}`);

    const result = await previewService.renderPreview(sessionId);
    
    console.log(`📊 Preview render result:`, {
      success: result.success,
      error: result.error,
      hasContent: !!result.content,
      contentType: result.contentType,
      sessionFound: result.session ? 'yes' : 'no'
    });

    if (result.success) {
      // Set headers for HTML content
      res.setHeader('Content-Type', result.contentType);
      res.removeHeader('X-Frame-Options');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Content-Security-Policy', "frame-ancestors *; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: *; style-src 'self' 'unsafe-inline' https: http: *; connect-src 'self' https: http: *; img-src 'self' https: http: data: *; font-src 'self' https: http: data: *;");
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Add preview headers for debugging
      res.setHeader('X-Catalyst-Preview', 'true');
      res.setHeader('X-Catalyst-Session', sessionId);
      res.setHeader('X-Catalyst-File', result.session.fileName);

      // Send the modified HTML content
      res.send(result.content);
    } else {
      // Return error page for failed preview
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview Error - Catalyst</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              margin: 0;
              padding: 40px 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 16px;
              padding: 40px;
              max-width: 500px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { margin: 0 0 16px 0; font-size: 24px; font-weight: 600; }
            p { margin: 0 0 24px 0; opacity: 0.9; line-height: 1.6; }
            .error { 
              background: rgba(239, 68, 68, 0.2); 
              border: 1px solid rgba(239, 68, 68, 0.3);
              border-radius: 8px;
              padding: 16px;
              margin-top: 20px;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
              font-size: 14px;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⚠️</div>
            <h1>Preview Error</h1>
            <p>Unable to generate preview content for this session.</p>
            <div class="error">${result.error}</div>
            <p style="margin-top: 24px; font-size: 14px; opacity: 0.7;">
              Please try creating a new preview session or check if your changes are valid.
            </p>
          </div>
        </body>
        </html>
      `;
      
      res.status(404).setHeader('Content-Type', 'text/html').send(errorHtml);
    }

  } catch (error) {
    console.error('❌ Error in preview render endpoint:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html><head><title>Server Error</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>500 - Server Error</h1>
        <p>An error occurred while rendering the preview.</p>
      </body></html>
    `;
    
    res.status(500).setHeader('Content-Type', 'text/html').send(errorHtml);
  }
});

/**
 * Get preview session info
 * GET /api/preview/session/:sessionId
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = previewService.getSessionInfo(sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.session
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error getting session info:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get preview system statistics
 * GET /api/preview/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = previewService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error getting preview stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/preview/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Preview Service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;