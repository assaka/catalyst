const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { extractStoreId, checkStoreOwnership } = require('../middleware/storeAuth');
const storageManager = require('../services/storage-manager');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require authentication and store ownership
router.use(authMiddleware);
router.use(extractStoreId);
router.use(checkStoreOwnership);

/**
 * POST /api/storage/upload
 * Upload single image via unified storage manager
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { storeId } = req;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log(`📤 Uploading image for store ${storeId}:`, {
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

    const result = await storageManager.uploadImage(storeId, req.file, options);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: result,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed || false
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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

    const result = await storageManager.uploadMultipleImages(storeId, req.files, options);

    res.json({
      success: true,
      message: `Successfully uploaded ${result.totalUploaded} of ${req.files.length} images`,
      data: result
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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

    const result = await storageManager.listImages(storeId, folder, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('List images error:', error);
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

    const result = await storageManager.deleteImage(storeId, imagePath, provider);

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
    const uploadResult = await storageManager.uploadImage(storeId, mockFile, {
      folder: 'storage-tests',
      public: true
    });

    // Clean up test image immediately
    try {
      await storageManager.deleteImage(storeId, uploadResult.path, uploadResult.provider);
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