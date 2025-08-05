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
    const state = uuidv4();
    const authUrl = supabaseIntegration.getAuthorizationUrl(req.storeId, state);
    
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
    const { code, state } = req.query;
    
    if (!code) {
      throw new Error('Authorization code not provided');
    }

    // Parse state to get store ID
    let storeId;
    try {
      const stateData = JSON.parse(state);
      storeId = stateData.storeId;
    } catch {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for token
    const result = await supabaseIntegration.exchangeCodeForToken(code, storeId);
    
    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard/integrations/supabase?connected=true&project=${encodeURIComponent(result.project.url)}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard/integrations/supabase?error=${encodeURIComponent(error.message)}`);
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