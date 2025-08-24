/**
 * Hybrid Customization Patches API Routes
 * Provides endpoints for the DiffPreviewSystem.jsx component
 * Pure hybrid customization system - no backward compatibility
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { diffIntegrationService } = require('../services/diff-integration-service');

/**
 * @route   GET /api/hybrid-patches/:filePath
 * @desc    Get hybrid customization patches for a specific file path
 * @access  Private
 */
router.get('/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.params;
    const userId = req.user.id;
    
    console.log(`📋 Loading hybrid patches for file: ${filePath}`);
    
    const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, userId);
    
    res.json({
      success: true,
      data: {
        file: { path: filePath },
        patches: patches,
        count: patches.length,
        type: 'hybrid_customization'
      },
      message: `Loaded ${patches.length} hybrid customization patches for ${filePath}`
    });
  } catch (error) {
    console.error('Error loading hybrid patches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load hybrid customization patches'
    });
  }
});

/**
 * @route   POST /api/hybrid-patches/broadcast/:filePath
 * @desc    Manually broadcast hybrid customization patches for a file to connected clients
 * @access  Private
 */
router.post('/broadcast/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.params;
    const userId = req.user.id;
    
    console.log(`📡 Broadcasting hybrid patches for file: ${filePath}`);
    
    const patches = await diffIntegrationService.loadAndBroadcastHybridPatches(
      filePath, 
      userId, 
      req.io // Socket.io instance if available
    );
    
    res.json({
      success: true,
      data: {
        file: { path: filePath },
        patches: patches,
        broadcasted: true,
        type: 'hybrid_customization'
      },
      message: `Broadcasted ${patches.length} hybrid customization patches for ${filePath}`
    });
  } catch (error) {
    console.error('Error broadcasting hybrid patches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast hybrid customization patches'
    });
  }
});

/**
 * @route   GET /api/hybrid-patches/files/recent
 * @desc    Get recently modified files with hybrid customization patches
 * @access  Private
 */
router.get('/files/recent', authMiddleware, async (req, res) => {
  try {
    const { HybridCustomization } = require('../models/HybridCustomization');
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recently modified hybrid customizations
    const recentCustomizations = await HybridCustomization.findAll({
      where: { user_id: userId, status: 'active' },
      order: [['updated_at', 'DESC']],
      limit: limit,
      attributes: ['id', 'name', 'file_path', 'component_type', 'version_number', 'updated_at'],
      include: [{
        association: 'snapshots',
        separate: true,
        limit: 1,
        order: [['snapshot_number', 'DESC']],
        attributes: ['id', 'change_type', 'created_at']
      }]
    });
    
    const filesList = recentCustomizations.map(customization => ({
      id: customization.id,
      name: customization.name,
      filePath: customization.file_path,
      componentType: customization.component_type,
      version: customization.version_number,
      lastModified: customization.updated_at,
      lastChangeType: customization.snapshots?.[0]?.change_type || 'unknown',
      hasSnapshots: customization.snapshots && customization.snapshots.length > 0
    }));
    
    res.json({
      success: true,
      data: {
        files: filesList,
        count: filesList.length,
        type: 'hybrid_customization'
      },
      message: `Found ${filesList.length} recently modified hybrid customization files`
    });
  } catch (error) {
    console.error('Error loading recent hybrid files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load recent hybrid customization files'
    });
  }
});

module.exports = router;