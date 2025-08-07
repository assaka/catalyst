const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

// Extract store ID middleware - gets storeId from headers/body/params
const extractStoreId = (req, res, next) => {
  const storeId = req.headers['x-store-id'] || 
                  req.body.store_id || 
                  req.query.store_id ||
                  req.params.store_id;
  
  if (!storeId) {
    return res.status(400).json({
      success: false,
      error: 'Store ID is required'
    });
  }
  
  req.storeId = storeId;
  // Also set it in params for checkStoreOwnership middleware
  req.params.store_id = storeId;
  next();
};
const storageManager = require('../services/storage-manager');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit to accommodate larger files like PDFs
    files: 10 // Maximum 10 files at once
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

// All routes require authentication and store ownership
router.use(authMiddleware);
router.use(extractStoreId);
router.use(checkStoreOwnership);

/**
 * POST /api/storage/upload
 * Upload single file via unified storage manager
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { storeId } = req;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    console.log(`📤 Uploading file for store ${storeId}:`, {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Upload options from request body
    const options = {
      folder: req.body.folder || 'general',
      public: req.body.public !== 'false', // Default to true unless explicitly false
      ...(req.body.metadata && { metadata: JSON.parse(req.body.metadata) })
    };

    const result = await storageManager.uploadFile(storeId, req.file, options);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: result,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed || false
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Return 400 for configuration issues, 500 for server errors
    const statusCode = error.message.includes('No storage provider') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: error.message,
      requiresConfiguration: error.message.includes('No storage provider')
    });
  }
});

/**
 * POST /api/storage/upload-multiple
 * Upload multiple images via unified storage manager
 */
router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  try {
    const { storeId } = req;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    console.log(`📤 Uploading ${req.files.length} images for store ${storeId}`);

    // Upload options from request body
    const options = {
      folder: req.body.folder || 'general',
      public: req.body.public !== 'false', // Default to true unless explicitly false
      ...(req.body.metadata && { metadata: JSON.parse(req.body.metadata) })
    };

    const result = await storageManager.uploadMultipleFiles(storeId, req.files, options);

    res.json({
      success: true,
      message: `Successfully uploaded ${result.totalUploaded} of ${req.files.length} images`,
      data: result
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    
    // Return 400 for configuration issues, 500 for server errors
    const statusCode = error.message.includes('No storage provider') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: error.message,
      requiresConfiguration: error.message.includes('No storage provider')
    });
  }
});

/**
 * GET /api/storage/list
 * List images from current storage provider
 */
router.get('/list', async (req, res) => {
  try {
    const { storeId } = req;
    const { folder, limit = 50, offset = 0 } = req.query;

    const result = await storageManager.listFiles(storeId, folder, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('List images error:', error);
    
    // If no storage provider is configured, return empty list with info
    if (error.message.includes('No storage provider')) {
      return res.status(200).json({
        success: true,
        data: {
          files: [],
          total: 0,
          provider: null
        },
        requiresConfiguration: true,
        message: 'No storage provider configured. Please connect a storage provider in the integrations settings.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/storage/delete
 * Delete image from storage
 */
router.delete('/delete', async (req, res) => {
  try {
    const { storeId } = req;
    const { imagePath, provider } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        error: 'Image path is required'
      });
    }

    const result = await storageManager.deleteFile(storeId, imagePath, provider);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/storage/move
 * Move image to different folder
 */
router.post('/move', async (req, res) => {
  try {
    const { storeId } = req;
    const { fromPath, toPath } = req.body;

    if (!fromPath || !toPath) {
      return res.status(400).json({
        success: false,
        error: 'Both fromPath and toPath are required'
      });
    }

    // Get current provider and move image
    const { provider } = await storageManager.getStorageProvider(storeId);
    
    let result;
    if (provider.moveImage) {
      if (provider.constructor.name === 'SupabaseStorageService') {
        result = await provider.moveImage(storeId, fromPath, toPath);
      } else if (provider.constructor.name === 'GCSStorageService') {
        const config = await storageManager.getStoreStorageConfig(storeId);
        result = await provider.moveImage(storeId, fromPath, toPath, config);
      } else if (provider.constructor.name === 'S3StorageService') {
        const config = await storageManager.getStoreStorageConfig(storeId);
        result = await provider.moveImage(storeId, fromPath, toPath, config);
      } else if (provider.constructor.name === 'LocalStorageService') {
        result = await provider.moveImage(fromPath, toPath);
      }
    } else {
      throw new Error('Move operation not supported by current storage provider');
    }

    res.json({
      success: true,
      message: 'Image moved successfully',
      data: result
    });

  } catch (error) {
    console.error('Move image error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/storage/stats
 * Get storage usage statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { storeId } = req;

    const result = await storageManager.getStorageStats(storeId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Storage stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/storage/providers
 * Get available storage providers and their status
 */
router.get('/providers', async (req, res) => {
  try {
    const { storeId } = req;

    const providers = ['supabase', 'gcs', 's3', 'local'];
    const providerStatus = {};

    for (const provider of providers) {
      providerStatus[provider] = {
        available: await storageManager.isProviderAvailable(provider, storeId),
        name: getProviderName(provider)
      };
    }

    // Get current provider
    const current = await storageManager.getStorageProvider(storeId);

    res.json({
      success: true,
      data: {
        current: {
          provider: current.type,
          name: getProviderName(current.type)
        },
        providers: providerStatus,
        fallbackOrder: storageManager.fallbackOrder
      }
    });

  } catch (error) {
    console.error('Storage providers error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/storage/test
 * Test storage functionality with current provider
 */
router.post('/test', async (req, res) => {
  try {
    const { storeId } = req;

    // Create a test 1x1 pixel PNG image
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00, 
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00, 
      0x01, 0x00, 0x01, 0x5C, 0xCC, 0x2E, 0x34, 0x00, 0x00, 0x00, 0x00, 0x49, 
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const mockFile = {
      originalname: 'storage-test.png',
      mimetype: 'image/png',
      buffer: testImageBuffer,
      size: testImageBuffer.length
    };

    // Upload test image
    const uploadResult = await storageManager.uploadFile(storeId, mockFile, {
      folder: 'storage-tests',
      public: true
    });

    // Clean up test image immediately
    try {
      await storageManager.deleteFile(storeId, uploadResult.path, uploadResult.provider);
    } catch (deleteError) {
      console.warn('Could not clean up test image:', deleteError.message);
    }

    res.json({
      success: true,
      message: 'Storage test completed successfully',
      data: {
        provider: uploadResult.provider,
        testPassed: true,
        fallbackUsed: uploadResult.fallbackUsed || false,
        uploadTime: Date.now(),
        imageSize: testImageBuffer.length
      }
    });

  } catch (error) {
    console.error('Storage test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      testPassed: false
    });
  }
});

/**
 * Get human-readable provider name
 */
function getProviderName(provider) {
  const names = {
    'supabase': 'Supabase Storage',
    'gcs': 'Google Cloud Storage',
    's3': 'Amazon S3',
    'local': 'Local Storage'
  };
  return names[provider] || provider;
}

module.exports = router;