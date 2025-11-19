const express = require('express');
const router = express.Router();
const multer = require('multer');
const storageManager = require('../services/storage-manager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { storeResolver } = require('../middleware/storeResolver');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for general files
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});


// Upload file with organized structure
router.post('/upload', authMiddleware,
  storeResolver(),
  upload.single('file'),
  async (req, res) => {
    try {
      const { storeId } = req;
      const { type, folder } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      // Determine upload options based on type
      let uploadOptions = {
        useOrganizedStructure: true,
        filename: req.file.originalname,
        public: true
      };

      // Set type based on request
      if (type === 'category') {
        uploadOptions.type = 'category';
      } else if (type === 'product') {
        uploadOptions.type = 'product';
      } else if (type === 'asset') {
        uploadOptions.type = 'asset';
      } else if (folder) {
        // Custom folder without organized structure
        uploadOptions.useOrganizedStructure = false;
        uploadOptions.folder = folder;
      } else {
        // Default to assets
        uploadOptions.type = 'asset';
      }

      console.log('📤 Uploading file with options:', uploadOptions);

      const result = await storageManager.uploadFile(storeId, req.file, uploadOptions);

      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          url: result.publicUrl,
          path: result.path,
          bucket: result.bucket,
          size: result.size,
          mimetype: result.mimetype,
          filename: result.filename
        }
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

// Upload multiple files
router.post('/upload-multiple', authMiddleware,
  storeResolver(),
  upload.array('files', 10),
  async (req, res) => {
    try {
      const { storeId } = req;
      const { type, folder } = req.body;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      // Upload all files
      const uploadPromises = req.files.map(file => {
        let uploadOptions = {
          useOrganizedStructure: true,
          filename: file.originalname,
          public: true
        };

        if (type === 'category') {
          uploadOptions.type = 'category';
        } else if (type === 'product') {
          uploadOptions.type = 'product';
        } else if (type === 'asset') {
          uploadOptions.type = 'asset';
        } else if (folder) {
          uploadOptions.useOrganizedStructure = false;
          uploadOptions.folder = folder;
        } else {
          uploadOptions.type = 'asset';
        }

        return storageManager.uploadFile(storeId, file, uploadOptions);
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const uploaded = [];
      const failed = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          uploaded.push({
            url: result.value.publicUrl,
            path: result.value.path,
            filename: result.value.filename,
            size: result.value.size
          });
        } else {
          failed.push({
            filename: req.files[index].originalname,
            error: result.reason?.message || 'Upload failed'
          });
        }
      });

      res.json({
        success: true,
        message: `Uploaded ${uploaded.length} files successfully`,
        uploaded,
        failed,
        totalUploaded: uploaded.length,
        totalFailed: failed.length
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// List files in a directory
router.get('/list', authMiddleware,
  storeResolver(),
  async (req, res) => {
    try {
      const { storeId } = req;
      const { type, folder, bucket } = req.query;
      
      let listFolder = folder;
      
      // Determine folder based on type
      if (type === 'category') {
        listFolder = 'categories';
      } else if (type === 'product') {
        listFolder = 'products';
      } else if (type === 'asset') {
        listFolder = 'assets';
      }

      const result = await storageManager.listFiles(storeId, listFolder, {
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
        bucket: bucket || undefined
      });

      res.json({
        success: true,
        files: result.files,
        total: result.total
      });
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Delete a file
router.delete('/delete', authMiddleware,
  storeResolver(),
  async (req, res) => {
    try {
      const { storeId } = req;
      const { path, bucket } = req.body;
      
      if (!path) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        });
      }

      const result = await storageManager.deleteFile(storeId, path, bucket);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get storage statistics
router.get('/stats', authMiddleware,
  storeResolver(),
  async (req, res) => {
    try {
      const { storeId } = req;
      
      const stats = await storageManager.getStorageStats(storeId);

      res.json({
        success: true,
        stats: stats.summary,
        buckets: stats.stats
      });
    } catch (error) {
      console.error('Error getting storage stats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;