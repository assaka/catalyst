const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const { storeResolver } = require('../middleware/storeResolver');

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

// All routes require authentication and automatic store resolution
router.use(authMiddleware);
router.use(storeResolver);

/**
 * POST /api/storage/upload
 * Upload single file via unified storage manager
 */
router.post('/upload', upload.single('file'), async (req, res) => {
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
    
    // Check if it's a storage configuration issue
    if (error.message.includes('No storage provider')) {
      return res.status(400).json({
        success: false,
        error: 'Storage not configured. Please connect Supabase, AWS S3, or Google Cloud Storage in Settings > Integrations.',
        requiresConfiguration: true,
        configurationUrl: '/admin/integrations'
      });
    }
    
    // Other server errors
    res.status(500).json({
      success: false,
      error: error.message,
      requiresConfiguration: false
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
  console.log('🔍 Storage list endpoint hit:', {
    storeId: req.storeId,
    folder: req.query.folder,
    limit: req.query.limit,
    offset: req.query.offset,
    userId: req.user?.id,
    userRole: req.user?.role
  });

  try {
    const { storeId } = req;
    const { folder, limit = 50, offset = 0 } = req.query;

    console.log('📁 Calling storageManager.listFiles with:', {
      storeId,
      folder,
      options: { limit: parseInt(limit), offset: parseInt(offset) }
    });

    const startTime = Date.now();

    // Add 5-second timeout to prevent hanging
    const listPromise = storageManager.listFiles(storeId, folder, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Storage list operation timed out after 5 seconds')), 5000);
    });

    const result = await Promise.race([listPromise, timeoutPromise]);
    const duration = Date.now() - startTime;

    console.log(`✅ StorageManager.listFiles completed in ${duration}ms:`, {
      filesCount: result?.files?.length || 0,
      provider: result?.provider,
      total: result?.total
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('List images error:', error);

    // If timeout or no storage provider, return empty list
    if (error.message.includes('No storage provider') || error.message.includes('timed out')) {
      return res.status(200).json({
        success: true,
        data: {
          files: [],
          total: 0,
          provider: null
        },
        requiresConfiguration: error.message.includes('No storage provider'),
        message: error.message.includes('timed out')
          ? 'Storage provider is taking too long to respond. Please check your connection.'
          : 'No storage provider configured. Please connect a storage provider in the integrations settings.'
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
 * Delete image from storage and database
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

    console.log(`🗑️ Deleting file for store ${storeId}: ${imagePath}`);

    // Delete from storage provider
    const result = await storageManager.deleteFile(storeId, imagePath, provider);
    console.log('✅ File deleted from storage:', result);

    // Delete from database (MediaAsset table) - use tenant connection
    const ConnectionManager = require('../services/database/ConnectionManager');
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { error: deleteError, count } = await tenantDb
        .from('media_assets')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
        .eq('file_path', imagePath);

      if (deleteError) {
        console.error('Database delete error:', deleteError);
      }

      console.log(`📊 Deleted ${count || 0} database record(s) for ${imagePath}`);
    } catch (dbError) {
      console.warn('Database cleanup error (file still deleted from storage):', dbError.message);
      // Don't fail the request if storage deletion succeeded but DB cleanup failed
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: result
    });

  } catch (error) {
    console.error('Delete file error:', error);
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
 * GET /api/storage/status
 * Get current storage configuration status for a store
 */
router.get('/status', async (req, res) => {
  try {
    const { storeId } = req;

    console.log('📊 Checking storage status for store:', storeId);

    // Get current provider with timeout
    let currentProvider = null;
    let configured = false;
    let provider = 'External URLs';

    try {
      const providerPromise = storageManager.getStorageProvider(storeId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout getting storage provider')), 3000);
      });
      currentProvider = await Promise.race([providerPromise, timeoutPromise]);

      if (currentProvider && currentProvider.type) {
        configured = true;
        provider = currentProvider.type;
      }
    } catch (error) {
      console.log('Could not get current provider:', error.message);
      configured = false;
    }

    res.json({
      success: true,
      configured: configured,
      hasProvider: configured,
      provider: provider,
      integrationType: provider
    });

  } catch (error) {
    console.error('Storage status error:', error);
    res.status(500).json({
      success: false,
      configured: false,
      hasProvider: false,
      provider: 'External URLs',
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

    // Check each provider with timeout protection
    for (const provider of providers) {
      try {
        const checkPromise = storageManager.isProviderAvailable(provider, storeId);
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve(false), 2000); // 2 second timeout per provider
        });

        providerStatus[provider] = {
          available: await Promise.race([checkPromise, timeoutPromise]),
          name: getProviderName(provider)
        };
      } catch (error) {
        console.log(`Error checking ${provider} availability:`, error.message);
        providerStatus[provider] = {
          available: false,
          name: getProviderName(provider)
        };
      }
    }

    // Get current provider with timeout
    let current = null;
    try {
      const providerPromise = storageManager.getStorageProvider(storeId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout getting storage provider')), 3000);
      });
      current = await Promise.race([providerPromise, timeoutPromise]);
    } catch (error) {
      console.log('Could not get current provider:', error.message);
      // Return response without current provider info
      return res.json({
        success: true,
        data: {
          current: null,
          providers: providerStatus,
          fallbackOrder: storageManager.fallbackOrder || [],
          message: 'Could not determine current storage provider'
        }
      });
    }

    res.json({
      success: true,
      data: {
        current: {
          provider: current.type,
          name: getProviderName(current.type)
        },
        providers: providerStatus,
        fallbackOrder: storageManager.fallbackOrder || []
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