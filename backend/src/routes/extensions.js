/**
 * Extension System API Routes
 * Replaces the patch system with hook-based extensions
 */

const express = require('express');
const router = express.Router();
const extensionService = require('../services/extension-service');
const { authMiddleware } = require('../middleware/authMiddleware');
const { storeResolver } = require('../middleware/storeResolver');

// Create a new release
router.post('/releases', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const {
      name,
      version,
      description = '',
      changes = [],
      type = 'minor'
    } = req.body;

    console.log(`📦 Creating release: ${name}`);

    const result = await extensionService.createRelease({
      name,
      version,
      description,
      changes,
      type,
      storeId: req.storeId,
      createdBy: req.user.id
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Release created successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error creating release:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Publish a release
router.post('/releases/:releaseId/publish', authMiddleware, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { publishNotes = '' } = req.body;

    console.log(`🚀 Publishing release: ${releaseId}`);

    const result = await extensionService.publishRelease(releaseId, {
      publishedBy: req.user.id,
      publishNotes
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Release published successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error publishing release:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rollback to a previous version
router.post('/releases/rollback', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { targetVersion, reason = '' } = req.body;

    console.log(`↩️ Rolling back to version: ${targetVersion}`);

    const result = await extensionService.rollbackToVersion(req.storeId, targetVersion, {
      performedBy: req.user.id,
      reason
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Rollback completed successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error performing rollback:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get version history
router.get('/versions', storeResolver({ required: false }), async (req, res) => {
  try {
    const storeId = req.storeId || req.query.store_id;
    const limit = parseInt(req.query.limit) || 20;
    const includeRolledBack = req.query.include_rolled_back === 'true';

    console.log(`📚 Getting version history for store: ${storeId}`);

    const result = await extensionService.getVersionHistory(storeId, {
      limit,
      includeRolledBack
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          versions: result.versions,
          totalVersions: result.versions.length
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error getting version history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current published version
router.get('/current-version', storeResolver({ required: false }), async (req, res) => {
  try {
    const storeId = req.storeId || req.query.store_id;

    console.log(`🔍 Getting current version for store: ${storeId}`);

    const result = await extensionService.getCurrentVersion(storeId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          currentVersion: result.version
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error getting current version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Compare two versions
router.get('/compare/:version1/:version2', storeResolver({ required: false }), async (req, res) => {
  try {
    const { version1, version2 } = req.params;
    const storeId = req.storeId || req.query.store_id;

    console.log(`🔄 Comparing versions ${version1} vs ${version2}`);

    const result = await extensionService.compareVersions(storeId, version1, version2);

    if (result.success) {
      res.json({
        success: true,
        data: result.comparison
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error comparing versions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate preview for changes before creating release
router.post('/preview', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { changes = [] } = req.body;

    console.log(`👁️ Generating preview for ${changes.length} changes`);

    // For now, we'll return a mock preview
    // This would be expanded to actually generate preview URLs
    const previewData = {
      previewId: `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      storeId: req.storeId,
      changes,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      previewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/preview?id=preview_${Date.now()}`
    };

    res.json({
      success: true,
      data: previewData
    });

  } catch (error) {
    console.error('❌ Error generating preview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get extension statistics
router.get('/stats', storeResolver({ required: false }), async (req, res) => {
  try {
    const storeId = req.storeId || req.query.store_id;

    console.log(`📊 Getting extension stats for store: ${storeId}`);

    const result = await extensionService.getStats(storeId);

    if (result.success) {
      res.json({
        success: true,
        data: result.stats
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Hook management endpoints

// Register a hook
router.post('/hooks', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const {
      hookName,
      handlerFunction,
      priority = 10,
      description = '',
      isAsync = false
    } = req.body;

    // Validate hook name and function
    if (!hookName || !handlerFunction) {
      return res.status(400).json({
        success: false,
        error: 'Hook name and handler function are required'
      });
    }

    // Store hook registration in database
    const [result] = await extensionService.sequelize.query(`
      INSERT INTO hook_registrations (
        store_id, hook_name, handler_function, priority, description, is_async
      ) VALUES (
        :storeId, :hookName, :handlerFunction, :priority, :description, :isAsync
      ) RETURNING id
    `, {
      replacements: {
        storeId: req.storeId,
        hookName,
        handlerFunction,
        priority,
        description,
        isAsync
      },
      type: extensionService.sequelize.QueryTypes.INSERT
    });

    res.json({
      success: true,
      message: 'Hook registered successfully',
      data: {
        hookId: result[0].id,
        hookName,
        priority
      }
    });

  } catch (error) {
    console.error('❌ Error registering hook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get registered hooks
router.get('/hooks', storeResolver({ required: false }), async (req, res) => {
  try {
    const storeId = req.storeId || req.query.store_id;

    const hooks = await extensionService.sequelize.query(`
      SELECT 
        id, hook_name, priority, description, is_async, is_active, created_at
      FROM hook_registrations 
      WHERE store_id = :storeId AND is_active = true
      ORDER BY hook_name, priority
    `, {
      replacements: { storeId },
      type: extensionService.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        hooks,
        totalHooks: hooks.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting hooks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register an event listener
router.post('/events', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const {
      eventName,
      handlerFunction,
      priority = 10,
      description = '',
      isOnce = false
    } = req.body;

    if (!eventName || !handlerFunction) {
      return res.status(400).json({
        success: false,
        error: 'Event name and handler function are required'
      });
    }

    const [result] = await extensionService.sequelize.query(`
      INSERT INTO event_listeners (
        store_id, event_name, handler_function, priority, description, is_once
      ) VALUES (
        :storeId, :eventName, :handlerFunction, :priority, :description, :isOnce
      ) RETURNING id
    `, {
      replacements: {
        storeId: req.storeId,
        eventName,
        handlerFunction,
        priority,
        description,
        isOnce
      },
      type: extensionService.sequelize.QueryTypes.INSERT
    });

    res.json({
      success: true,
      message: 'Event listener registered successfully',
      data: {
        listenerId: result[0].id,
        eventName,
        priority
      }
    });

  } catch (error) {
    console.error('❌ Error registering event listener:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get file baselines for FileTreeNavigator (restored endpoint)
router.get('/baselines', async (req, res) => {
  try {
    // Query file baselines from database
    const files = await extensionService.sequelize.query(`
      SELECT 
        file_path,
        file_type,
        file_size,
        last_modified,
        code_hash,
        version
      FROM file_baselines 
      ORDER BY file_path ASC
    `, {
      type: extensionService.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        files: files.map(file => ({
          file_path: file.file_path,
          file_type: file.file_type,
          file_size: file.file_size,
          last_modified: file.last_modified,
          code_hash: file.code_hash,
          version: file.version
        }))
      },
      message: 'File baselines retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error getting file baselines:', error);
    
    // Fallback to minimal structure if database query fails
    res.json({
      success: true,
      data: {
        files: [
          { file_path: 'src/pages/Cart.jsx', file_type: 'jsx', file_size: 30000, last_modified: new Date() },
          { file_path: 'src/core/HookSystem.js', file_type: 'js', file_size: 12000, last_modified: new Date() },
          { file_path: 'src/core/EventSystem.js', file_type: 'js', file_size: 10000, last_modified: new Date() },
          { file_path: 'backend/src/routes/extensions.js', file_type: 'js', file_size: 15000, last_modified: new Date() }
        ]
      },
      message: 'Fallback file baselines (database unavailable)'
    });
  }
});

// Get individual file baseline content for AIContextWindow
router.get('/baseline/:filePath', async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    
    // Query specific file baseline from database (graceful handling of missing columns)
    let file;
    try {
      // Try the most complete query first
      [file] = await extensionService.sequelize.query(`
        SELECT 
          file_path,
          baseline_code,
          file_size,
          last_modified,
          code_hash
        FROM file_baselines 
        WHERE file_path = :filePath
        LIMIT 1
      `, {
        replacements: { filePath },
        type: extensionService.sequelize.QueryTypes.SELECT
      });
    } catch (error) {
      try {
        // If that fails, try without baseline_code
        console.log('⚠️ Trying query without baseline_code column');
        [file] = await extensionService.sequelize.query(`
          SELECT 
            file_path,
            file_size,
            last_modified,
            code_hash
          FROM file_baselines 
          WHERE file_path = :filePath
          LIMIT 1
        `, {
          replacements: { filePath },
          type: extensionService.sequelize.QueryTypes.SELECT
        });
      } catch (secondError) {
        try {
          // If that also fails, try with just basic columns
          console.log('⚠️ Trying basic query with minimal columns');
          [file] = await extensionService.sequelize.query(`
            SELECT 
              file_path,
              file_size,
              last_modified
            FROM file_baselines 
            WHERE file_path = :filePath
            LIMIT 1
          `, {
            replacements: { filePath },
            type: extensionService.sequelize.QueryTypes.SELECT
          });
        } catch (thirdError) {
          // If even the basic query fails, try the most minimal query
          console.log('⚠️ Trying most minimal query');
          [file] = await extensionService.sequelize.query(`
            SELECT file_path FROM file_baselines WHERE file_path = :filePath LIMIT 1
          `, {
            replacements: { filePath },
            type: extensionService.sequelize.QueryTypes.SELECT
          });
        }
      }
    }

    if (file) {
      // Check if we have baseline content or just file metadata
      if (file.baseline_code) {
        res.json({
          success: true,
          data: {
            hasBaseline: true,
            baselineCode: file.baseline_code,
            file_path: file.file_path,
            file_size: file.file_size,
            last_modified: file.last_modified,
            code_hash: file.code_hash
          },
          message: 'File baseline content retrieved successfully'
        });
      } else {
        // File exists but no content stored - return metadata only
        res.json({
          success: true,
          data: {
            hasBaseline: false,
            file_path: file.file_path,
            file_size: file.file_size,
            last_modified: file.last_modified,
            code_hash: file.code_hash,
            message: `File exists but no baseline content stored for ${filePath}`
          }
        });
      }
    } else {
      // File not found in baselines - return fallback
      res.json({
        success: true,
        data: {
          hasBaseline: false,
          message: `No baseline found for ${filePath}`
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error getting file baseline:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear cache
router.post('/cache/clear', authMiddleware, async (req, res) => {
  try {
    const { key } = req.body;
    
    extensionService.clearCache(key);
    
    res.json({
      success: true,
      message: key ? `Cache cleared for key: ${key}` : 'All cache cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;