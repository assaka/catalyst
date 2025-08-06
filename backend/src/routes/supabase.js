const express = require('express');
const router = express.Router();
const supabaseIntegration = require('../services/supabase-integration');
const supabaseStorage = require('../services/supabase-storage');
const auth = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Middleware to extract store ID
const extractStoreId = (req, res, next) => {
  const storeId = req.headers['x-store-id'] || 
                  req.body.store_id || 
                  req.query.store_id ||
                  req.params.store_id;
  
  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: 'Store ID is required'
    });
  }
  
  req.params.store_id = storeId;
  req.storeId = storeId;
  next();
};

// Get connection status
router.get('/status', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const status = await supabaseIntegration.getConnectionStatus(req.storeId);
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Error getting Supabase status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Initialize OAuth flow
router.post('/connect', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    console.log('Initiating Supabase OAuth connection for store:', req.storeId);
    
    const state = uuidv4();
    const authUrl = supabaseIntegration.getAuthorizationUrl(req.storeId, state);
    console.log('Generated OAuth URL:', authUrl);
    
    // Store state in session or database for verification
    req.session = req.session || {};
    req.session.supabaseOAuthState = state;
    req.session.supabaseOAuthStore = req.storeId;
    
    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('Error initiating Supabase connection:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    console.log('Supabase OAuth callback received:', {
      query: req.query,
      headers: req.headers
    });

    const { code, state, error, error_description } = req.query;
    
    // Check for OAuth errors from Supabase
    if (error) {
      console.error('OAuth error from Supabase:', error, error_description);
      throw new Error(error_description || error || 'Authorization failed');
    }
    
    if (!code) {
      throw new Error('Authorization code not provided');
    }

    // Parse state to get store ID
    let storeId;
    try {
      const stateData = JSON.parse(state);
      storeId = stateData.storeId;
      console.log('Parsed state:', stateData);
    } catch (err) {
      console.error('Failed to parse state:', state, err);
      throw new Error('Invalid state parameter');
    }

    // Exchange code for token
    console.log('Exchanging code for token...');
    const result = await supabaseIntegration.exchangeCodeForToken(code, storeId);
    
    // Send success page that closes the popup window
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supabase Connected</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
          }
          .success {
            color: #10b981;
            font-size: 48px;
            margin-bottom: 1rem;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 0.5rem;
          }
          p {
            color: #6b7280;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓</div>
          <h1>Successfully Connected!</h1>
          <p>Your Supabase account has been connected. This window will close automatically.</p>
        </div>
        <script>
          // Notify parent window of success
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'supabase-oauth-success',
              project: '${result.project.url}'
            }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
          }
          // Close window after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    // Send error page that closes the popup window
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Failed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
          }
          .error {
            color: #ef4444;
            font-size: 48px;
            margin-bottom: 1rem;
          }
          h1 {
            color: #1f2937;
            margin-bottom: 0.5rem;
          }
          p {
            color: #6b7280;
            margin-bottom: 1rem;
          }
          .error-details {
            background: #fef2f2;
            color: #991b1b;
            padding: 1rem;
            border-radius: 6px;
            margin-top: 1rem;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">✗</div>
          <h1>Connection Failed</h1>
          <p>Unable to connect to Supabase. This window will close automatically.</p>
          <div class="error-details">${error.message}</div>
        </div>
        <script>
          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'supabase-oauth-error',
              error: '${error.message.replace(/'/g, "\\'")}'
            }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
          }
          // Close window after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `);
  }
});

// Test connection
router.post('/test', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const result = await supabaseIntegration.testConnection(req.storeId);
    res.json(result);
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Disconnect
router.post('/disconnect', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const result = await supabaseIntegration.disconnect(req.storeId);
    res.json(result);
  } catch (error) {
    console.error('Error disconnecting Supabase:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =================
// Storage endpoints
// =================

// Upload image
router.post('/storage/upload', 
  auth, 
  extractStoreId, 
  checkStoreOwnership, 
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const result = await supabaseStorage.uploadImage(req.storeId, req.file, {
        folder: req.body.folder,
        public: req.body.public === 'true'
      });

      res.json(result);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Upload multiple images
router.post('/storage/upload-multiple',
  auth,
  extractStoreId,
  checkStoreOwnership,
  upload.array('images', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided'
        });
      }

      const result = await supabaseStorage.uploadMultipleImages(req.storeId, req.files, {
        folder: req.body.folder,
        public: req.body.public === 'true'
      });

      res.json(result);
    } catch (error) {
      console.error('Error uploading images:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// List images
router.get('/storage/list', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const result = await supabaseStorage.listImages(req.storeId, req.query.folder, {
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
      bucket: req.query.bucket
    });

    res.json(result);
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete image
router.delete('/storage/delete', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const { path, bucket } = req.body;
    
    if (!path) {
      return res.status(400).json({
        success: false,
        message: 'Image path is required'
      });
    }

    const result = await supabaseStorage.deleteImage(req.storeId, path, bucket);
    res.json(result);
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Move image
router.post('/storage/move', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const { fromPath, toPath, bucket } = req.body;
    
    if (!fromPath || !toPath) {
      return res.status(400).json({
        success: false,
        message: 'Both fromPath and toPath are required'
      });
    }

    const result = await supabaseStorage.moveImage(req.storeId, fromPath, toPath, bucket);
    res.json(result);
  } catch (error) {
    console.error('Error moving image:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Copy image
router.post('/storage/copy', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const { fromPath, toPath, bucket } = req.body;
    
    if (!fromPath || !toPath) {
      return res.status(400).json({
        success: false,
        message: 'Both fromPath and toPath are required'
      });
    }

    const result = await supabaseStorage.copyImage(req.storeId, fromPath, toPath, bucket);
    res.json(result);
  } catch (error) {
    console.error('Error copying image:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get signed URL
router.post('/storage/signed-url', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const { path, expiresIn, bucket } = req.body;
    
    if (!path) {
      return res.status(400).json({
        success: false,
        message: 'Image path is required'
      });
    }

    const result = await supabaseStorage.getSignedUrl(req.storeId, path, expiresIn, bucket);
    res.json(result);
  } catch (error) {
    console.error('Error creating signed URL:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get storage statistics
router.get('/storage/stats', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const result = await supabaseStorage.getStorageStats(req.storeId);
    res.json(result);
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;