const express = require('express');
const router = express.Router();
const { HybridCustomization, CustomizationSnapshot, CustomizationRollback } = require('../models/HybridCustomization');
const VersionControlService = require('../services/version-control-service');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const { diffIntegrationService } = require('../services/diff-integration-service');

// Initialize version control service
const versionControl = new VersionControlService();

/**
 * @route   POST /api/hybrid-customizations
 * @desc    Create a new hybrid customization with version control
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      storeId,
      name,
      description,
      componentType,
      filePath,
      baselineCode,
      initialCode,
      aiPrompt,
      aiExplanation
    } = req.body;

    // Validate store ownership if storeId provided
    if (storeId) {
      const hasAccess = await checkStoreOwnership(req.user.id, storeId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this store'
        });
      }
    }

    const result = await versionControl.createCustomization({
      userId: req.user.id,
      storeId,
      name,
      description,
      componentType,
      filePath,
      baselineCode,
      initialCode,
      aiPrompt,
      aiExplanation
    });

    if (result.success) {
      // Broadcast diff patches to existing Diff tab
      if (result.snapshot && result.customization) {
        await diffIntegrationService.handleSnapshotCreated(
          result.snapshot, 
          result.customization, 
          req.io // Socket.io instance if available
        );
      }

      res.status(201).json({
        success: true,
        data: result.customization,
        meta: {
          version: result.version,
          snapshotCount: result.snapshotCount
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create customization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customization'
    });
  }
});

/**
 * @route   GET /api/hybrid-customizations
 * @desc    Get customizations for authenticated user
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { storeId, componentType, status = 'active', include = '' } = req.query;
    
    const options = {
      where: { status }
    };

    if (storeId) {
      const hasAccess = await checkStoreOwnership(req.user.id, storeId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this store'
        });
      }
      options.where.store_id = storeId;
    }

    if (componentType) {
      options.where.component_type = componentType;
    }

    // Handle includes
    const includeRelations = [];
    if (include.includes('snapshots')) {
      includeRelations.push({
        model: CustomizationSnapshot,
        as: 'snapshots',
        limit: 5,
        order: [['snapshot_number', 'DESC']]
      });
    }
    if (include.includes('rollbacks')) {
      includeRelations.push({
        model: CustomizationRollback,
        as: 'rollbacks',
        limit: 3,
        order: [['performed_at', 'DESC']]
      });
    }
    
    if (includeRelations.length > 0) {
      options.include = includeRelations;
    }

    const customizations = await HybridCustomization.findByUser(req.user.id, options);

    res.json({
      success: true,
      data: customizations,
      count: customizations.length
    });
  } catch (error) {
    console.error('Get customizations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customizations'
    });
  }
});

/**
 * @route   GET /api/hybrid-customizations/:id
 * @desc    Get a specific customization with full details
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { includeHistory = false } = req.query;

    const customization = await HybridCustomization.findByPk(id, {
      include: [
        {
          model: require('../models/User'),
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: require('../models/Store'),
          as: 'store',
          attributes: ['id', 'name', 'domain']
        }
      ]
    });

    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    // Check permissions
    if (customization.user_id !== req.user.id) {
      if (customization.store_id) {
        const hasAccess = await checkStoreOwnership(req.user.id, customization.store_id);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Access denied to this customization'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this customization'
        });
      }
    }

    let historyData = null;
    if (includeHistory === 'true') {
      const historyResult = await versionControl.getVersionHistory(id, {
        includeSnapshots: true,
        includeRollbacks: true
      });
      historyData = historyResult.success ? historyResult : null;
    }

    res.json({
      success: true,
      data: customization,
      history: historyData
    });
  } catch (error) {
    console.error('Get customization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customization'
    });
  }
});

/**
 * @route   POST /api/hybrid-customizations/:id/changes
 * @desc    Apply changes to a customization with snapshot tracking
 * @access  Private
 */
router.post('/:id/changes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      modifiedCode,
      changeSummary,
      changeDescription,
      changeType = 'manual_edit',
      aiPrompt,
      aiExplanation
    } = req.body;

    // Verify ownership
    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    const result = await versionControl.applyChanges(id, {
      modifiedCode,
      changeSummary,
      changeDescription,
      changeType,
      aiPrompt,
      aiExplanation,
      createdBy: req.user.id
    });

    if (result.success) {
      // Broadcast diff patches to existing Diff tab
      if (result.snapshot && customization) {
        await diffIntegrationService.handleSnapshotCreated(
          result.snapshot, 
          customization, 
          req.io // Socket.io instance if available
        );
      }

      res.json({
        success: true,
        data: {
          snapshot: result.snapshot,
          analysis: result.analysis,
          changesSummary: result.changesSummary
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Apply changes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply changes'
    });
  }
});

/**
 * @route   POST /api/hybrid-customizations/:id/rollback
 * @desc    Rollback customization to a specific snapshot
 * @access  Private
 */
router.post('/:id/rollback', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      targetSnapshotNumber,
      rollbackType = 'full_rollback',
      rollbackReason = '',
      createNewVersion = false
    } = req.body;

    if (!targetSnapshotNumber) {
      return res.status(400).json({
        success: false,
        error: 'Target snapshot number is required'
      });
    }

    // Verify ownership
    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    const result = await versionControl.rollbackToSnapshot(id, targetSnapshotNumber, {
      rollbackType,
      rollbackReason,
      performedBy: req.user.id,
      createNewVersion
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          rollbackResult: result.rollbackResult,
          impactAnalysis: result.impactAnalysis,
          targetSnapshot: result.targetSnapshot
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform rollback'
    });
  }
});

/**
 * @route   GET /api/hybrid-customizations/:id/history
 * @desc    Get comprehensive version history
 * @access  Private
 */
router.get('/:id/history', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { includeSnapshots = true, includeRollbacks = true } = req.query;

    // Verify ownership
    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    const result = await versionControl.getVersionHistory(id, {
      includeSnapshots: includeSnapshots === 'true',
      includeRollbacks: includeRollbacks === 'true'
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          versions: result.versions,
          snapshots: result.snapshots,
          rollbacks: result.rollbacks,
          summary: result.summary
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch version history'
    });
  }
});

/**
 * @route   GET /api/hybrid-customizations/:id/snapshots
 * @desc    Get snapshot history for a customization
 * @access  Private
 */
router.get('/:id/snapshots', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, changeType } = req.query;

    // Verify ownership
    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    const snapshots = await customization.getSnapshotHistory({
      limit: parseInt(limit),
      changeType
    });

    res.json({
      success: true,
      data: snapshots,
      count: snapshots.length
    });
  } catch (error) {
    console.error('Get snapshots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch snapshots'
    });
  }
});

/**
 * @route   POST /api/hybrid-customizations/:id/compare-snapshots
 * @desc    Compare two snapshots
 * @access  Private
 */
router.post('/:id/compare-snapshots', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { snapshot1Number, snapshot2Number } = req.body;

    if (!snapshot1Number || !snapshot2Number) {
      return res.status(400).json({
        success: false,
        error: 'Both snapshot numbers are required'
      });
    }

    // Verify ownership
    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    const result = await versionControl.compareSnapshots(id, snapshot1Number, snapshot2Number);

    if (result.success) {
      res.json({
        success: true,
        data: result.comparison,
        meta: {
          snapshot1: result.snapshot1,
          snapshot2: result.snapshot2
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Compare snapshots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare snapshots'
    });
  }
});

/**
 * @route   POST /api/hybrid-customizations/:id/cherry-pick
 * @desc    Cherry pick changes from specific snapshots
 * @access  Private
 */
router.post('/:id/cherry-pick', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      snapshotNumbers,
      createNewVersion = true,
      changeSummary = 'Cherry picked changes'
    } = req.body;

    if (!snapshotNumbers || !Array.isArray(snapshotNumbers) || snapshotNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Snapshot numbers array is required'
      });
    }

    // Verify ownership
    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    const result = await versionControl.cherryPickChanges(id, snapshotNumbers, {
      createNewVersion,
      changeSummary,
      performedBy: req.user.id
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          newVersion: result.newVersion,
          cherryPickedSnapshots: result.cherryPickedSnapshots,
          appliedOperations: result.appliedOperations
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Cherry pick error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cherry pick changes'
    });
  }
});

/**
 * @route   POST /api/hybrid-customizations/:id/create-version
 * @desc    Create a new version from current customization
 * @access  Private
 */
router.post('/:id/create-version', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      modifiedCode,
      changeSummary = 'New version created'
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Version name is required'
      });
    }

    // Verify ownership
    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    const newVersion = await customization.createVersion({
      name,
      description,
      modifiedCode,
      changeSummary,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: newVersion,
      message: 'New version created successfully'
    });
  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create new version'
    });
  }
});

/**
 * @route   DELETE /api/hybrid-customizations/:id
 * @desc    Archive a customization (soft delete)
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    await customization.update({
      status: 'archived',
      is_current_version: false
    });

    res.json({
      success: true,
      message: 'Customization archived successfully'
    });
  } catch (error) {
    console.error('Archive customization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive customization'
    });
  }
});

/**
 * @route   PUT /api/hybrid-customizations/:id/restore
 * @desc    Restore an archived customization
 * @access  Private
 */
router.put('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const customization = await HybridCustomization.findByPk(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'Customization not found'
      });
    }

    if (customization.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this customization'
      });
    }

    await customization.update({
      status: 'active',
      is_current_version: true
    });

    res.json({
      success: true,
      data: customization,
      message: 'Customization restored successfully'
    });
  } catch (error) {
    console.error('Restore customization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore customization'
    });
  }
});

module.exports = router;