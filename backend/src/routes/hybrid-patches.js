/**
 * Hybrid Patches API Routes
 * Unified system for code patches with auto-save, version control, and database persistence
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const VersionControlService = require('../services/version-control-service');
const { HybridCustomization } = require('../models');

// Initialize version control service
const versionControl = new VersionControlService();

/**
 * Create/Update patch (auto-save endpoint)
 * POST /api/hybrid-patches/create
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      filePath,
      originalCode,
      modifiedCode,
      changeSummary = 'Auto-saved changes',
      changeType = 'manual_edit',
      metadata = {}
    } = req.body;

    const userId = req.user.id;

    if (!filePath || !modifiedCode) {
      return res.status(400).json({
        success: false,
        error: 'filePath and modifiedCode are required'
      });
    }

    // Check if customization already exists for this file path
    let customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        user_id: userId,
        status: 'active'
      }
    });

    let result;
    if (!customization) {
      // Create new customization
      result = await versionControl.createCustomization({
        userId,
        name: `Auto-saved changes to ${filePath.split('/').pop()}`,
        description: 'Auto-generated from manual edits',
        componentType: 'component',
        filePath,
        baselineCode: originalCode || modifiedCode,
        initialCode: modifiedCode,
        changeType,
        changeSummary
      });
    } else {
      // Add changes to existing customization
      result = await versionControl.applyChanges(customization.id, {
        modifiedCode,
        changeSummary,
        changeDescription: `Auto-saved changes at ${new Date().toLocaleTimeString()}`,
        changeType,
        createdBy: userId
      });
    }

    if (result.success) {
      res.json({
        success: true,
        customization: result.customization,
        snapshot: result.snapshot,
        message: customization ? 'Changes applied to existing customization' : 'New customization created'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to save patch'
      });
    }
  } catch (error) {
    console.error('Error creating/updating patch:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create patch'
    });
  }
});

/**
 * Get patches for a specific file
 * GET /api/hybrid-patches/:filePath
 */
router.get('/:filePath', authMiddleware, async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const userId = req.user.id;

    console.log(`🔍 Fetching patches for ${filePath} (user: ${userId})`);

    // Find active customization for this file path and user
    const customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        user_id: userId,
        status: 'active'
      },
      include: [
        {
          association: 'snapshots',
          where: { status: 'open' },
          required: false,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (customization) {
      const patches = customization.snapshots || [];
      
      res.json({
        success: true,
        patches: patches.map(snapshot => ({
          id: snapshot.id,
          changeSummary: snapshot.change_summary,
          changeDescription: snapshot.change_description,
          changeType: snapshot.change_type,
          astDiff: snapshot.ast_diff,
          createdAt: snapshot.created_at,
          status: snapshot.status
        })),
        customization: {
          id: customization.id,
          baselineCode: customization.baseline_code,
          currentCode: customization.current_code,
          filePath: customization.file_path
        }
      });
    } else {
      res.json({
        success: true,
        patches: [],
        message: 'No patches found for this file'
      });
    }
  } catch (error) {
    console.error('Error fetching patches:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch patches'
    });
  }
});

/**
 * Get baseline code for a file
 * GET /api/hybrid-patches/baseline/:filePath
 */
router.get('/baseline/:filePath', authMiddleware, async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const userId = req.user.id;

    console.log(`🔍 Fetching baseline for ${filePath} (user: ${userId})`);

    // Find active customization for this file path and user
    const customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        user_id: userId,
        status: 'active'
      }
    });

    if (customization && customization.baseline_code) {
      res.json({
        success: true,
        data: {
          hasBaseline: true,
          baselineCode: customization.baseline_code,
          customizationId: customization.id,
          lastModified: customization.updated_at
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          hasBaseline: false,
          message: 'No baseline found for this file'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching baseline code:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch baseline code'
    });
  }
});

/**
 * Finalize patches for a file (on publish)
 * POST /api/hybrid-patches/finalize/:filePath
 */
router.post('/finalize/:filePath', authMiddleware, async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const userId = req.user.id;

    console.log(`🔒 Finalizing patches for ${filePath} (user: ${userId})`);

    // Find active customization for this file path and user
    const customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        user_id: userId,
        status: 'active'
      },
      include: [
        {
          association: 'snapshots',
          where: { status: 'open' },
          required: false
        }
      ]
    });

    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'No active customization found for this file'
      });
    }

    // Finalize all open snapshots
    const openSnapshots = customization.snapshots || [];
    const finalizedSnapshots = [];

    for (const snapshot of openSnapshots) {
      const result = await versionControl.finalizeSnapshot(snapshot.id);
      if (result.success) {
        finalizedSnapshots.push(snapshot.id);
      }
    }

    res.json({
      success: true,
      customizationId: customization.id,
      finalizedSnapshots,
      message: `Finalized ${finalizedSnapshots.length} snapshots for ${filePath}`
    });
  } catch (error) {
    console.error('Error finalizing patches:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to finalize patches'
    });
  }
});

/**
 * Get recent modified files
 * GET /api/hybrid-patches/files/recent
 */
router.get('/files/recent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const recentCustomizations = await HybridCustomization.findAll({
      where: {
        user_id: userId,
        status: 'active'
      },
      order: [['updated_at', 'DESC']],
      limit,
      include: [
        {
          association: 'snapshots',
          where: { status: 'open' },
          required: false,
          attributes: ['id', 'change_summary', 'created_at'],
          limit: 1,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    const files = recentCustomizations.map(customization => ({
      filePath: customization.file_path,
      customizationId: customization.id,
      lastModified: customization.updated_at,
      hasChanges: (customization.snapshots || []).length > 0,
      latestChange: (customization.snapshots || [])[0]?.change_summary
    }));

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Error fetching recent files:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch recent files'
    });
  }
});

/**
 * Get modified code for preview
 * GET /api/hybrid-patches/modified-code/:filePath
 */
router.get('/modified-code/:filePath', authMiddleware, async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const userId = req.user.id;

    const customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        user_id: userId,
        status: 'active'
      }
    });

    if (customization && customization.current_code) {
      res.json({
        success: true,
        data: {
          modifiedCode: customization.current_code,
          customizationId: customization.id,
          lastModified: customization.updated_at
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No modified code found for this file'
      });
    }
  } catch (error) {
    console.error('Error fetching modified code:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch modified code'
    });
  }
});

module.exports = router;