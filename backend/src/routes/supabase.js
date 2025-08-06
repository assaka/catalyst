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
    console.log('OAuth configuration status:', {
      clientIdConfigured: !!process.env.SUPABASE_OAUTH_CLIENT_ID,
      clientSecretConfigured: !!process.env.SUPABASE_OAUTH_CLIENT_SECRET,
      redirectUriConfigured: !!process.env.SUPABASE_OAUTH_REDIRECT_URI
    });
    
    const state = uuidv4();
    const authUrl = supabaseIntegration.getAuthorizationUrl(req.storeId, state);
    console.log('Generated OAuth URL length:', authUrl.length);
    
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
    
    console.log('Token exchange result:', result);
    
    // Send success page that closes the popup window
    const projectUrl = result.project?.url || 'Connected';
    const userEmail = result.user?.email || '';
    
    // Check if this is a limited scope connection
    const isLimitedScope = result.limitedScope || 
                          projectUrl === 'Configuration pending' || 
                          projectUrl === 'https://pending-configuration.supabase.co' ||
                          projectUrl === 'pending_configuration' ||
                          projectUrl === 'Configuration pending - limited scope';
    
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
          .email {
            font-size: 14px;
            color: #4b5563;
            margin-top: 0.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓</div>
          <h1>${isLimitedScope ? 'Connected with Limited Scope' : 'Successfully Connected!'}</h1>
          <p>${isLimitedScope 
            ? 'Connection established but with limited permissions. You may need to update your OAuth app scopes for full functionality.' 
            : 'Your Supabase account has been connected. This window will close automatically.'}</p>
          ${userEmail ? `<p class="email">Connected as: ${userEmail}</p>` : ''}
          ${isLimitedScope ? '<p class="email" style="color: #f59e0b;">⚠️ Limited permissions - some features may not work</p>' : ''}
        </div>
        <script>
          // Notify parent window of success
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'supabase-oauth-success',
              project: '${projectUrl}',
              userEmail: '${userEmail}'
            }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
          }
          
          // Try to close window after 2 seconds
          setTimeout(() => {
            try {
              // Try window.close() first
              window.close();
              
              // If still open after 100ms, try alternative methods
              setTimeout(() => {
                // For some browsers, we need to use self.close()
                self.close();
                
                // If still not closed, show a message
                setTimeout(() => {
                  document.querySelector('.container').innerHTML = 
                    '<div class="success">✓</div>' +
                    '<h1>All Done!</h1>' +
                    '<p>You can now close this window and return to the dashboard.</p>' +
                    '<button onclick="window.close(); self.close();" style="' +
                    'background: #10b981; color: white; border: none; ' +
                    'padding: 10px 20px; border-radius: 6px; cursor: pointer; ' +
                    'font-size: 16px; margin-top: 10px;">Close Window</button>';
                }, 100);
              }, 100);
            } catch (e) {
              console.error('Cannot close window:', e);
              // Show manual close message
              document.querySelector('.container').innerHTML = 
                '<div class="success">✓</div>' +
                '<h1>All Done!</h1>' +
                '<p>You can now close this window and return to the dashboard.</p>';
            }
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
          
          // Try to close window after 3 seconds
          setTimeout(() => {
            try {
              window.close();
              self.close();
              
              // If still not closed, show manual close option
              setTimeout(() => {
                document.querySelector('.container').innerHTML = 
                  '<div class="error">✗</div>' +
                  '<h1>Connection Failed</h1>' +
                  '<p>You can close this window and try again.</p>' +
                  '<button onclick="window.close(); self.close();" style="' +
                  'background: #ef4444; color: white; border: none; ' +
                  'padding: 10px 20px; border-radius: 6px; cursor: pointer; ' +
                  'font-size: 16px; margin-top: 10px;">Close Window</button>';
              }, 200);
            } catch (e) {
              console.error('Cannot close window:', e);
            }
          }, 3000);
        </script>
      </body>
      </html>
    `);
  }
});

// Get available projects
router.get('/projects', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const result = await supabaseIntegration.getProjects(req.storeId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching Supabase projects:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Select a project
router.post('/select-project', auth, extractStoreId, checkStoreOwnership, async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    const result = await supabaseIntegration.selectProject(req.storeId, projectId);
    res.json(result);
  } catch (error) {
    console.error('Error selecting Supabase project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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

// Test upload - upload a sample product image
router.post('/storage/test-upload', 
  auth, 
  extractStoreId, 
  checkStoreOwnership,
  async (req, res) => {
    try {
      console.log('Testing Supabase storage upload...');
      
      // Create a test image buffer (1x1 pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      // Create mock file object
      const mockFile = {
        originalname: 'test-product.png',
        mimetype: 'image/png',
        buffer: testImageBuffer,
        size: testImageBuffer.length
      };

      const result = await supabaseStorage.uploadImage(req.storeId, mockFile, {
        folder: 'test-products',
        public: true
      });

      res.json({
        success: true,
        message: 'Test image uploaded successfully!',
        ...result
      });
    } catch (error) {
      console.error('Error in test upload:', error);
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