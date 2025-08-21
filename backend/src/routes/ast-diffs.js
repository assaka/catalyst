const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const ASTDiff = require('../models/ASTDiff');

/**
 * AST Diffs API Routes
 * Handles creating, applying, and managing AST diff overlays
 * Patches act as overlays that can be applied over original source code
 */

/**
 * POST /api/ast-diffs/create
 * Create a new AST diff overlay from code changes
 */
router.post('/create', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const {
      filePath,
      originalCode,
      modifiedCode,
      changeSummary,
      changeType = 'modification'
    } = req.body;

    // Validate required fields
    if (!filePath || !originalCode || !modifiedCode) {
      return res.status(400).json({
        success: false,
        message: 'filePath, originalCode, and modifiedCode are required'
      });
    }

    // Security: Only allow files from src directory
    if (!filePath.startsWith('src/')) {
      return res.status(403).json({
        success: false,
        message: 'Only src/ directory files are allowed'
      });
    }

    // Create AST diff overlay
    const astDiff = await ASTDiff.createFromCodeChanges({
      storeId: req.storeId,
      userId: req.user.id,
      filePath,
      originalCode,
      modifiedCode,
      changeSummary,
      changeType
    });

    res.json({
      success: true,
      message: 'AST diff overlay created successfully',
      data: {
        id: astDiff.id,
        filePath: astDiff.file_path,
        changeType: astDiff.change_type,
        changeSummary: astDiff.change_summary,
        affectedSymbols: astDiff.affected_symbols,
        patchPreview: astDiff.patch_preview,
        status: astDiff.status,
        createdAt: astDiff.created_at,
        // Return essential overlay data for UI
        overlay: {
          operations: astDiff.patch_operations,
          preview: astDiff.patch_preview,
          summary: astDiff.ast_diff.summary
        }
      }
    });
  } catch (error) {
    console.error('Error creating AST diff overlay:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ast-diffs/:id/apply
 * Apply an AST diff overlay to make changes live
 */
router.post('/:id/apply', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const astDiff = await ASTDiff.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!astDiff) {
      return res.status(404).json({
        success: false,
        message: 'AST diff overlay not found'
      });
    }

    // Apply the overlay
    const result = await astDiff.applyAsOverlay();

    res.json({
      success: true,
      message: 'AST diff overlay applied successfully',
      data: {
        id: astDiff.id,
        filePath: astDiff.file_path,
        status: astDiff.status,
        appliedAt: astDiff.applied_at,
        result
      }
    });
  } catch (error) {
    console.error('Error applying AST diff overlay:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ast-diffs/:id/revert
 * Revert an applied AST diff overlay
 */
router.post('/:id/revert', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const astDiff = await ASTDiff.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!astDiff) {
      return res.status(404).json({
        success: false,
        message: 'AST diff overlay not found'
      });
    }

    // Revert the overlay
    const result = await astDiff.revertOverlay();

    res.json({
      success: true,
      message: 'AST diff overlay reverted successfully',
      data: {
        id: astDiff.id,
        filePath: astDiff.file_path,
        status: astDiff.status,
        revertedAt: astDiff.reverted_at,
        result
      }
    });
  } catch (error) {
    console.error('Error reverting AST diff overlay:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ast-diffs/file/:filePath
 * Get all AST diff overlays for a specific file
 */
router.get('/file/*', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    // Extract file path from params (everything after /file/)
    const filePath = req.params[0];

    if (!filePath || !filePath.startsWith('src/')) {
      return res.status(400).json({
        success: false,
        message: 'Valid src/ file path is required'
      });
    }

    // Get all overlays for this file
    const overlays = await ASTDiff.getOverlaysForFile(req.storeId, filePath);

    res.json({
      success: true,
      data: {
        filePath,
        overlays: overlays.map(overlay => ({
          id: overlay.id,
          changeType: overlay.change_type,
          changeSummary: overlay.change_summary,
          affectedSymbols: overlay.affected_symbols,
          patchPreview: overlay.patch_preview,
          status: overlay.status,
          createdAt: overlay.created_at,
          appliedAt: overlay.applied_at,
          revertedAt: overlay.reverted_at,
          // Include overlay operations for preview
          operations: overlay.patch_operations,
          summary: overlay.ast_diff.summary
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching file overlays:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ast-diffs/history
 * Get AST diff overlay history for the store
 */
router.get('/history', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const {
      limit = 50,
      status,
      changeType,
      page = 1
    } = req.query;

    // Get overlay history
    const overlays = await ASTDiff.getOverlayHistory(req.storeId, {
      limit: parseInt(limit),
      status,
      changeType,
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        overlays: overlays.map(overlay => ({
          id: overlay.id,
          filePath: overlay.file_path,
          changeType: overlay.change_type,
          changeSummary: overlay.change_summary,
          affectedSymbols: overlay.affected_symbols,
          patchPreview: overlay.patch_preview,
          status: overlay.status,
          createdAt: overlay.created_at,
          appliedAt: overlay.applied_at,
          revertedAt: overlay.reverted_at,
          user: overlay.User ? {
            id: overlay.User.id,
            name: overlay.User.name
          } : null,
          // Summary stats for UI
          operationsCount: overlay.patch_operations.length,
          summary: overlay.ast_diff.summary
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: overlays.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching overlay history:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ast-diffs/:id
 * Get detailed information about a specific AST diff overlay
 */
router.get('/:id', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const astDiff = await ASTDiff.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      },
      include: [
        {
          model: require('../models/User'),
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!astDiff) {
      return res.status(404).json({
        success: false,
        message: 'AST diff overlay not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: astDiff.id,
        filePath: astDiff.file_path,
        originalHash: astDiff.original_hash,
        changeType: astDiff.change_type,
        changeSummary: astDiff.change_summary,
        affectedSymbols: astDiff.affected_symbols,
        patchPreview: astDiff.patch_preview,
        status: astDiff.status,
        createdAt: astDiff.created_at,
        appliedAt: astDiff.applied_at,
        revertedAt: astDiff.reverted_at,
        user: astDiff.User ? {
          id: astDiff.User.id,
          name: astDiff.User.name
        } : null,
        // Full overlay data for detailed view
        overlay: {
          originalAst: astDiff.original_ast,
          modifiedAst: astDiff.modified_ast,
          astDiff: astDiff.ast_diff,
          operations: astDiff.patch_operations
        }
      }
    });
  } catch (error) {
    console.error('Error fetching AST diff overlay:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/ast-diffs/:id
 * Delete an AST diff overlay (only if not applied)
 */
router.delete('/:id', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const astDiff = await ASTDiff.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });

    if (!astDiff) {
      return res.status(404).json({
        success: false,
        message: 'AST diff overlay not found'
      });
    }

    // Prevent deletion of applied overlays
    if (astDiff.status === 'applied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete applied overlay. Revert it first.'
      });
    }

    await astDiff.destroy();

    res.json({
      success: true,
      message: 'AST diff overlay deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting AST diff overlay:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;