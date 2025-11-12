const express = require('express');
const router = express.Router();
const supabaseIntegration = require('../services/supabase-integration');
const supabaseStorage = require('../services/supabase-storage');
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB to accommodate larger files like PDFs
  },
  fileFilter: (req, file, cb) => {
    // Allow all common file types - validation will be done at the application level
    const allowedMimes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Please check allowed file types.`));
    }
  }
});


// Get connection status and ensure buckets exist
router.get('/status', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const status = await supabaseIntegration.getConnectionStatus(req.storeId);
    
    // If connected with service role key, ensure buckets exist
    if (status.connected && status.hasServiceRoleKey) {
      const bucketResult = await supabaseStorage.ensureBucketsExist(req.storeId);
      if (bucketResult.success && bucketResult.bucketsCreated && bucketResult.bucketsCreated.length > 0) {
        console.log('Auto-created buckets on status check:', bucketResult.bucketsCreated);
      }
    }
    
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
router.post('/connect', authMiddleware, storeResolver(), async (req, res) => {
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
      frontendUrl: process.env.FRONTEND_URL,
      hasCode: !!req.query.code,
      hasState: !!req.query.state,
      hasError: !!req.query.error
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
      // Decode the state parameter first (it may be URL-encoded)
      const decodedState = decodeURIComponent(state);
      console.log('Decoded state:', decodedState);

      const stateData = JSON.parse(decodedState);
      storeId = stateData.storeId;
      console.log('Parsed state data:', stateData);

      if (!storeId) {
        throw new Error('Store ID not found in state');
      }
    } catch (err) {
      console.error('Failed to parse state:', {
        raw: state,
        error: err.message,
        stack: err.stack
      });
      throw new Error('Invalid state parameter - unable to identify store');
    }

    // Exchange code for token
    console.log('Exchanging code for token...');
    const result = await supabaseIntegration.exchangeCodeForToken(code, storeId);
    
    console.log('Token exchange result:', result);
    
    // Try to create buckets after successful connection
    if (result.success) {
      try {
        console.log('Attempting to create storage buckets...');
        const bucketResult = await supabaseStorage.ensureBucketsExist(storeId);
        if (bucketResult.success) {
          console.log('Bucket creation result:', bucketResult.message);
        }
      } catch (bucketError) {
        console.log('Could not create buckets immediately:', bucketError.message);
        // Non-blocking - buckets will be created on first use
      }
    }
    
    // Send minimal success page that closes instantly
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
        <title>Success</title>
        <style>
          body { margin: 0; background: #10b981; }
        </style>
      </head>
      <body>
        <script>
          console.log('🎯 OAuth callback page loaded');
          console.log('🔍 Window opener exists:', !!window.opener);

          // Show green screen briefly, then send message and close
          if (window.opener) {
            // Wait 500ms to show green background, then notify parent and close
            setTimeout(() => {
              // Send to all possible origins to ensure delivery
              const targetOrigin = '*'; // Allow any origin for OAuth callback
              const message = {
                type: 'supabase-oauth-success',
                project: '${projectUrl}',
                userEmail: '${userEmail}',
                isLimitedScope: ${isLimitedScope}
              };

              console.log('📤 Sending postMessage to parent:', { targetOrigin, message });

              try {
                window.opener.postMessage(message, targetOrigin);
                console.log('✅ Message sent successfully');
              } catch (error) {
                console.error('❌ Error sending message:', error);
              }

              // Try to close - parent will also try to close us
              console.log('🔒 Attempting to close window...');
              window.close();
            }, 500);
          } else {
            // No opener - show minimal message
            console.log('⚠️ No window.opener - showing manual close message');
            document.body.innerHTML = '<div style="color:white;text-align:center;padding:2rem;font-family:sans-serif;"><h1>✓ Success!</h1><p>Please close this window.</p></div>';
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    });

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
          // Notify parent window of error immediately
          if (window.opener) {
            window.opener.postMessage({
              type: 'supabase-oauth-error',
              error: '${error.message.replace(/'/g, "\\'")}'
            }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');

            // Parent will close this window, but try to close anyway after a short delay
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            // No opener, show manual close button immediately
            document.querySelector('.container').innerHTML =
              '<div class="error">✗</div>' +
              '<h1>Connection Failed</h1>' +
              '<p>You can close this window and try again.</p>' +
              '<button onclick="window.close();" style="' +
              'background: #ef4444; color: white; border: none; ' +
              'padding: 10px 20px; border-radius: 6px; cursor: pointer; ' +
              'font-size: 16px; margin-top: 10px;">Close Window</button>';
          }
        </script>
      </body>
      </html>
    `);
  }
});

// Get available projects
router.get('/projects', authMiddleware, storeResolver(), async (req, res) => {
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
router.post('/select-project', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    const result = await supabaseIntegration.selectProject(req.storeId, projectId);
    
    // Try to create buckets after project selection
    if (result.success) {
      try {
        console.log('Attempting to create storage buckets after project selection...');
        const bucketResult = await supabaseStorage.ensureBucketsExist(req.storeId);
        if (bucketResult.success) {
          console.log('Bucket creation result:', bucketResult.message);
          result.bucketsCreated = bucketResult.bucketsCreated;
          if (bucketResult.bucketsCreated && bucketResult.bucketsCreated.length > 0) {
            result.message = `${result.message || 'Project selected successfully'}. Auto-created buckets: ${bucketResult.bucketsCreated.join(', ')}`;
          }
        }
      } catch (bucketError) {
        console.log('Could not create buckets after project selection:', bucketError.message);
        // Non-blocking - buckets will be created on first use
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error selecting Supabase project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test connection and ensure buckets exist
router.post('/test', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const result = await supabaseIntegration.testConnection(req.storeId);
    
    // If connection is successful and has keys, ensure buckets exist
    if (result.success) {
      const bucketResult = await supabaseStorage.ensureBucketsExist(req.storeId);
      if (bucketResult.success && bucketResult.bucketsCreated && bucketResult.bucketsCreated.length > 0) {
        result.message = `${result.message}. Auto-created buckets: ${bucketResult.bucketsCreated.join(', ')}`;
      }
    }
    
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
router.post('/disconnect', authMiddleware, storeResolver(), async (req, res) => {
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

// Upload image - handles both 'file' and 'image' fields for flexibility
router.post('/storage/upload', authMiddleware, 
  storeResolver(), 
  upload.single('file') || upload.single('image'), // Accept both field names
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      // Enhanced options from request body
      const options = {
        folder: req.body.folder || 'uploads',
        public: req.body.public === 'true' || req.body.public === true,
        type: req.body.type || 'general', // product, category, asset, etc.
        useMagentoStructure: req.body.useMagentoStructure === 'true',
        filename: req.body.filename
      };

      const result = await supabaseStorage.uploadImage(req.storeId, req.file, options);

      // Enhanced response with additional metadata
      res.json({
        success: true,
        ...result,
        id: result.id || Date.now(),
        filename: result.filename || req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Test upload - upload a sample product image
router.post('/storage/test-upload', authMiddleware, 
  storeResolver(),
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

      // For test upload, always try direct API first
      let result;
      try {
        console.log('Attempting direct API upload for test...');
        console.log('Store ID:', req.storeId);
        
        // First check if we have API keys
        const tokenInfo = await supabaseIntegration.getTokenInfo(req.storeId);
        console.log('Token info check for test upload:');
        console.log('  Has project URL:', !!tokenInfo?.project_url);
        console.log('  Project URL:', tokenInfo?.project_url);
        console.log('  Has service key:', !!tokenInfo?.service_role_key);
        
        result = await supabaseStorage.uploadImageDirect(req.storeId, mockFile, {
          folder: 'test-products',
          public: true
        });
      } catch (directError) {
        console.log('Direct API failed:', directError.message);
        console.log('Attempting regular upload as fallback...');
        result = await supabaseStorage.uploadImage(req.storeId, mockFile, {
          folder: 'test-products',
          public: true
        });
      }

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
router.post('/storage/upload-multiple', authMiddleware,
  storeResolver(),
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
router.get('/storage/list', authMiddleware, storeResolver(), async (req, res) => {
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

// List files from specific bucket
router.get('/storage/list/:bucketName', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { bucketName } = req.params;
    console.log(`📂 Listing files from bucket: ${bucketName}`);

    const result = await supabaseStorage.listImages(req.storeId, req.query.folder, {
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
      bucket: bucketName
    });

    res.json(result);
  } catch (error) {
    console.error('Error listing files from bucket:', error);

    // Check for specific authentication/service role key errors
    if (error.message && (error.message.includes('Invalid service role key') || error.message.includes('JWT') || error.message.includes('malformed'))) {
      return res.status(401).json({
        success: false,
        message: error.message,
        errorType: 'INVALID_SERVICE_KEY'
      });
    }

    // Check for permission errors
    if (error.message && error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        errorType: 'PERMISSION_DENIED'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete image
router.delete('/storage/delete', authMiddleware, storeResolver(), async (req, res) => {
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
router.post('/storage/move', authMiddleware, storeResolver(), async (req, res) => {
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
router.post('/storage/copy', authMiddleware, storeResolver(), async (req, res) => {
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
router.post('/storage/signed-url', authMiddleware, storeResolver(), async (req, res) => {
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
router.get('/storage/stats', authMiddleware, storeResolver(), async (req, res) => {
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

// Fetch and update API keys for current project
router.post('/fetch-api-keys', authMiddleware, storeResolver(), async (req, res) => {
  try {
    console.log('Fetching API keys for store:', req.storeId);
    const result = await supabaseIntegration.fetchAndUpdateApiKeys(req.storeId);
    
    // Get updated status
    const status = await supabaseIntegration.getConnectionStatus(req.storeId);
    
    res.json({
      ...result,
      connectionStatus: status
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Manually update project configuration (for limited scope connections or when API doesn't provide keys)
router.post('/update-config', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { projectId, projectUrl, serviceRoleKey, databaseUrl, storageUrl, authUrl } = req.body;
    
    console.log('Manual config update request:', {
      hasProjectId: !!projectId,
      hasProjectUrl: !!projectUrl,
      hasServiceRoleKey: !!serviceRoleKey
    });
    
    // Validate at least one field is provided
    if (!projectUrl && !serviceRoleKey && !databaseUrl && !storageUrl && !authUrl) {
      return res.status(400).json({
        success: false,
        message: 'At least one configuration field must be provided'
      });
    }
    
    // Validate project URL format if provided
    if (projectUrl && !projectUrl.includes('supabase.co')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project URL format. Expected format: https://[project-id].supabase.co'
      });
    }
    
    const result = await supabaseIntegration.updateProjectConfig(req.storeId, {
      projectUrl,
      serviceRoleKey,
      databaseUrl,
      storageUrl,
      authUrl
    });
    
    // After updating, test if storage works and create buckets
    if (serviceRoleKey) {
      try {
        const tokenInfo = await supabaseIntegration.getTokenInfo(req.storeId);
        console.log('Config updated. New token info:', {
          hasServiceKey: !!tokenInfo?.service_role_key
        });
        
        // Try to create buckets with the new service role key
        console.log('Attempting to create storage buckets with new config...');
        const bucketResult = await supabaseStorage.ensureBucketsExist(req.storeId);
        if (bucketResult.success) {
          console.log('Bucket creation result:', bucketResult.message);
          result.bucketsCreated = bucketResult.bucketsCreated;
        }
        
        result.storageReady = true;
      } catch (testError) {
        console.log('Could not verify storage readiness:', testError.message);
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error updating project config:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Ensure buckets exist - can be called anytime to create missing buckets
router.post('/storage/ensure-buckets', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const result = await supabaseStorage.ensureBucketsExist(req.storeId);
    res.json(result);
  } catch (error) {
    console.error('Error ensuring buckets exist:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get storage buckets
router.get('/storage/buckets', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const result = await supabaseStorage.listBuckets(req.storeId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching buckets:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create storage bucket
router.post('/storage/buckets', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { name, public: isPublic } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Bucket name is required'
      });
    }
    
    const result = await supabaseStorage.createBucket(req.storeId, name, {
      public: isPublic === true || isPublic === 'true'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating bucket:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete storage bucket
router.delete('/storage/buckets/:bucketId', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { bucketId } = req.params;
    
    const result = await supabaseStorage.deleteBucket(req.storeId, bucketId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting bucket:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;