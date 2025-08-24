/**
 * Diff Patches API Routes
 * Provides endpoints for the existing DiffPreviewSystem.jsx component
 * Bridges hybrid customization system with the Diff tab UI
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { diffIntegrationService } = require('../services/diff-integration-service');

/**
 * @route   GET /api/diff-patches/:filePath
 * @desc    Get diff patches for a specific file path
 * @access  Private
 */
router.get('/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.params;
    const userId = req.user.id;
    
    console.log(`📋 Loading diff patches for file: ${filePath}`);
    
    const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, userId);
    
    res.json({
      success: true,
      data: {
        file: { path: filePath },
        patches: patches,
        count: patches.length
      },
      message: `Loaded ${patches.length} diff patches for ${filePath}`
    });
  } catch (error) {
    console.error('Error loading diff patches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load diff patches'
    });
  }
});

/**
 * @route   POST /api/diff-patches/broadcast/:filePath
 * @desc    Manually broadcast diff patches for a file to connected clients
 * @access  Private
 */
router.post('/broadcast/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.params;
    const userId = req.user.id;
    
    console.log(`📡 Broadcasting diff patches for file: ${filePath}`);
    
    const patches = await diffIntegrationService.loadAndBroadcastDiffPatches(
      filePath, 
      userId, 
      req.io // Socket.io instance if available
    );
    
    res.json({
      success: true,
      data: {
        file: { path: filePath },
        patches: patches,
        broadcasted: true
      },
      message: `Broadcasted ${patches.length} diff patches for ${filePath}`
    });
  } catch (error) {
    console.error('Error broadcasting diff patches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast diff patches'
    });
  }
});

/**
 * @route   GET /api/diff-patches/files/recent
 * @desc    Get recently modified files with diff patches
 * @access  Private
 */
router.get('/files/recent', authMiddleware, async (req, res) => {
  try {
    const { HybridCustomization } = require('../models/HybridCustomization');
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recently modified customizations
    const recentCustomizations = await HybridCustomization.findAll({
      where: { user_id: userId, status: 'active' },
      order: [['updated_at', 'DESC']],
      limit: limit,
      attributes: ['id', 'name', 'file_path', 'component_type', 'updated_at']
    });
    
    const filesList = recentCustomizations.map(customization => ({
      id: customization.id,
      name: customization.name,
      filePath: customization.file_path,
      componentType: customization.component_type,
      lastModified: customization.updated_at
    }));
    
    res.json({
      success: true,
      data: {
        files: filesList,
        count: filesList.length
      },
      message: `Found ${filesList.length} recently modified files`
    });
  } catch (error) {
    console.error('Error loading recent files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load recent files'
    });
  }
});

module.exports = router;