/**
 * Customization Overlays API Routes
 * Provides endpoints for overlay persistence and version control
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const OverlayPersistenceService = require('../services/overlay-persistence-service');
const VersionControlService = require('../services/version-control-service');

// Initialize services
const overlayService = new OverlayPersistenceService();
const versionService = new VersionControlService();

/**
 * Create or update an overlay
 * POST /api/customization-overlays
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      filePath,
      originalCode,
      modifiedCode,
      metadata = {},
      temporary = false,
      changeSummary,
      changeType = 'manual_edit'
    } = req.body;

    const userId = req.user.id;

    if (!filePath || !modifiedCode) {
      return res.status(400).json({
        success: false,
        error: 'filePath and modifiedCode are required'
      });
    }

    const result = await overlayService.saveOverlay({
      userId,
      filePath,
      originalCode,
      modifiedCode,
      metadata: {
        ...metadata,
        changeSummary,
        changeType
      },
      temporary
    });

    res.json(result);
  } catch (error) {
    console.error('Error saving overlay:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Load overlay for a file
 * GET /api/customization-overlays/:filePath
 */
router.get('/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.params;
    const { temporary = false } = req.query;
    const userId = req.user.id;

    const result = await overlayService.loadOverlay(
      userId, 
      filePath, 
      temporary === 'true'
    );

    res.json(result);
  } catch (error) {
    console.error('Error loading overlay:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Update existing overlay
 * PUT /api/customization-overlays/:customizationId
 */
router.put('/:customizationId', authMiddleware, async (req, res) => {
  try {
    const { customizationId } = req.params;
    const { modifiedCode, metadata = {} } = req.body;
    const userId = req.user.id;

    if (!modifiedCode) {
      return res.status(400).json({
        success: false,
        error: 'modifiedCode is required'
      });
    }

    const result = await overlayService.updateOverlay(customizationId, {
      modifiedCode,
      metadata,
      userId
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating overlay:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Remove overlay
 * DELETE /api/customization-overlays/:customizationId
 */
router.delete('/:customizationId', authMiddleware, async (req, res) => {
  try {
    const { customizationId } = req.params;
    const { archive = true } = req.query;

    const result = await overlayService.removeOverlay(
      customizationId, 
      archive === 'true'
    );

    res.json(result);
  } catch (error) {
    console.error('Error removing overlay:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get user's overlays
 * GET /api/customization-overlays/user/:userId
 */
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      storeId = null,
      status = 'active',
      limit = 50,
      includeTemporary = false
    } = req.query;

    // Ensure user can only access their own overlays
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access other user overlays'
      });
    }

    const result = await overlayService.getUserOverlays(userId, {
      storeId,
      status,
      limit: parseInt(limit),
      includeTemporary: includeTemporary === 'true'
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting user overlays:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Finalize temporary overlay
 * POST /api/customization-overlays/:overlayId/finalize
 */
router.post('/:overlayId/finalize', authMiddleware, async (req, res) => {
  try {
    const { overlayId } = req.params;
    const userId = req.user.id;

    const result = await overlayService.finalizeOverlay(overlayId, userId);

    res.json(result);
  } catch (error) {
    console.error('Error finalizing overlay:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get overlay statistics
 * GET /api/customization-overlays/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;
    
    // If userId provided, ensure user can only see their own stats
    const targetUserId = userId && (userId === req.user.id || req.user.role === 'admin') 
      ? userId 
      : req.user.id;

    const stats = await overlayService.getStats(targetUserId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting overlay stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * VERSION CONTROL ENDPOINTS
 */

/**
 * Create new customization with version control
 * POST /api/customization-overlays/version-control/create
 */
router.post('/version-control/create', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      componentType = 'component',
      filePath,
      baselineCode,
      initialCode,
      changeType = 'manual_edit',
      changeSummary
    } = req.body;

    const userId = req.user.id;

    if (!name || !filePath || !baselineCode || !initialCode) {
      return res.status(400).json({
        success: false,
        error: 'name, filePath, baselineCode, and initialCode are required'
      });
    }

    const result = await versionService.createCustomization({
      userId,
      name,
      description,
      componentType,
      filePath,
      baselineCode,
      initialCode,
      changeType,
      changeSummary
    });

    res.json(result);
  } catch (error) {
    console.error('Error creating customization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Apply changes to existing customization
 * POST /api/customization-overlays/version-control/:customizationId/changes
 */
router.post('/version-control/:customizationId/changes', authMiddleware, async (req, res) => {
  try {
    const { customizationId } = req.params;
    const {
      modifiedCode,
      changeSummary,
      changeDescription,
      changeType = 'modification'
    } = req.body;

    const userId = req.user.id;

    if (!modifiedCode || !changeSummary) {
      return res.status(400).json({
        success: false,
        error: 'modifiedCode and changeSummary are required'
      });
    }

    const result = await versionService.applyChanges(customizationId, {
      modifiedCode,
      changeSummary,
      changeDescription,
      changeType,
      createdBy: userId
    });

    res.json(result);
  } catch (error) {
    console.error('Error applying changes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get customization with snapshots
 * GET /api/customization-overlays/version-control/:customizationId
 */
router.get('/version-control/:customizationId', authMiddleware, async (req, res) => {
  try {
    const { customizationId } = req.params;
    const { includeSnapshots = true } = req.query;

    const customization = await versionService.getCustomization(
      customizationId,
      includeSnapshots === 'true'
    );

    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    res.json({
      success: true,
      customization
    });
  } catch (error) {
    console.error('Error getting customization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get user's customizations
 * GET /api/customization-overlays/version-control/user/:userId
 */
router.get('/version-control/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { storeId = null, status = 'active' } = req.query;

    // Ensure user can only access their own customizations
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access other user customizations'
      });
    }

    const customizations = await versionService.getUserCustomizations(
      userId, 
      storeId, 
      status
    );

    res.json({
      success: true,
      customizations
    });
  } catch (error) {
    console.error('Error getting user customizations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get customizations by file
 * GET /api/customization-overlays/version-control/file/*
 */
router.get('/version-control/file/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.params;
    const userId = req.user.id;

    const customizations = await versionService.getCustomizationsByFile(
      filePath,
      userId
    );

    res.json({
      success: true,
      customizations
    });
  } catch (error) {
    console.error('Error getting customizations by file:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Finalize snapshot
 * POST /api/customization-overlays/version-control/snapshots/:snapshotId/finalize
 */
router.post('/version-control/snapshots/:snapshotId/finalize', authMiddleware, async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const { metadata = {} } = req.body;

    const result = await versionService.finalizeSnapshot(snapshotId, metadata);

    res.json(result);
  } catch (error) {
    console.error('Error finalizing snapshot:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Revert to snapshot
 * POST /api/customization-overlays/version-control/:customizationId/revert/:snapshotId
 */
router.post('/version-control/:customizationId/revert/:snapshotId', authMiddleware, async (req, res) => {
  try {
    const { customizationId, snapshotId } = req.params;
    const { metadata = {} } = req.body;
    const userId = req.user.id;

    const result = await versionService.revertToSnapshot(
      customizationId,
      snapshotId,
      userId,
      metadata
    );

    res.json(result);
  } catch (error) {
    console.error('Error reverting to snapshot:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Archive customization
 * POST /api/customization-overlays/version-control/:customizationId/archive
 */
router.post('/version-control/:customizationId/archive', authMiddleware, async (req, res) => {
  try {
    const { customizationId } = req.params;

    const result = await versionService.archiveCustomization(customizationId);

    res.json(result);
  } catch (error) {
    console.error('Error archiving customization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get version control statistics
 * GET /api/customization-overlays/version-control/stats
 */
router.get('/version-control/stats', authMiddleware, async (req, res) => {
  try {
    const { userId, storeId } = req.query;
    
    // If userId provided, ensure user can only see their own stats
    const targetUserId = userId && (userId === req.user.id || req.user.role === 'admin') 
      ? userId 
      : req.user.id;

    const stats = await versionService.getStats(targetUserId, storeId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting version control stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;