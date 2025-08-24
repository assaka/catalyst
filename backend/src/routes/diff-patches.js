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
    const storeId = req.user.store_id || '157d4590-49bf-4b0b-bd77-abe131909528'; // Default store for now
    
    console.log(`🔍 API Request Debug:`);
    console.log(`   File: ${filePath}`);
    console.log(`   User ID from req.user.id: ${userId}`);
    console.log(`   User email: ${req.user.email || "N/A"}`);
    console.log(`   User role: ${req.user.role || "N/A"}`);
    console.log(`   Store ID: ${storeId}`);
    
    console.log(`📋 Loading hybrid patches for file: ${filePath}`);
    
    // Use store-scoped patches instead of user-scoped
    const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, userId, storeId);
    
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
 * @route   POST /api/hybrid-patches/create
 * @desc    Create a hybrid customization patch for auto-save functionality  
 * @access  Private
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { HybridCustomization } = require('../models/HybridCustomization');
    const VersionControlService = require('../services/version-control-service');
    const versionControl = new VersionControlService();
    
    const {
      filePath,
      originalCode,
      modifiedCode,
      changeSummary,
      changeType = 'manual_edit'
    } = req.body;
    
    const userId = req.user.id;
    
    console.log(`📝 Creating hybrid patch for: ${filePath}`);
    
    // Check if customization already exists for this file path
    let customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        user_id: userId,
        status: 'active'
      }
    });
    
    if (!customization) {
      // Create new customization
      console.log(`🆕 Creating new customization for: ${filePath}`);
      const result = await versionControl.createCustomization({
        userId: userId,
        name: `Auto-saved changes to ${filePath.split('/').pop()}`,
        description: `Auto-generated from manual edits`,
        componentType: 'component',
        filePath: filePath,
        baselineCode: originalCode,
        initialCode: modifiedCode,
        changeType: changeType,
        changeSummary: changeSummary || 'Manual edits detected'
      });
      
      if (result.success) {
        customization = result.customization;
      } else {
        throw new Error(result.error || 'Failed to create customization');
      }
    } else {
      // Add changes to existing customization
      console.log(`📝 Adding changes to existing customization: ${customization.id}`);
      const result = await versionControl.applyChanges(customization.id, {
        modifiedCode: modifiedCode,
        changeSummary: changeSummary || 'Manual edits detected',
        changeDescription: `Auto-saved changes at ${new Date().toLocaleTimeString()}`,
        changeType: changeType,
        createdBy: userId
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to apply changes');
      }
      
      // Broadcast diff patches to Diff tab
      if (result.snapshot && customization) {
        await diffIntegrationService.handleSnapshotCreated(
          result.snapshot, 
          customization, 
          req.io // Socket.io instance if available
        );
      }
    }
    
    res.json({
      success: true,
      data: {
        id: customization.id,
        filePath: filePath,
        type: 'hybrid_customization',
        message: 'Auto-saved as hybrid customization'
      },
      message: `Successfully saved hybrid customization for ${filePath}`
    });
  } catch (error) {
    console.error('Error creating hybrid patch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hybrid customization patch'
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