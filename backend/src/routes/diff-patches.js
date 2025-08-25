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
 * @desc    Create a hybrid customization patch for auto-save functionality with open snapshot management
 * @access  Private
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { HybridCustomization } = require('../models/HybridCustomization');
    
    const {
      filePath,
      originalCode,
      modifiedCode,
      changeSummary,
      changeType = 'manual_edit'
    } = req.body;
    
    const userId = req.user.id;
    const storeId = req.user.store_id || '157d4590-49bf-4b0b-bd77-abe131909528'; // Default store for now
    
    console.log(`📝 Auto-saving changes for: ${filePath}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Store ID: ${storeId}`);
    
    // Check if customization already exists for this file path (store-scoped)
    let customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        store_id: storeId,
        status: 'active'
      }
    });
    
    let result;
    
    if (!customization) {
      // Create new customization with initial open snapshot
      console.log(`🆕 Creating new customization with open snapshot for: ${filePath}`);
      
      customization = await HybridCustomization.create({
        name: `Auto-saved changes to ${filePath.split('/').pop()}`,
        description: 'Auto-generated from manual edits',
        component_type: 'component',
        file_path: filePath,
        user_id: userId,
        store_id: storeId,
        baseline_code: originalCode,
        status: 'active',
        version_number: 1
      });
      
      // Create initial open snapshot
      const snapshot = await HybridCustomization.createSnapshot({
        customizationId: customization.id,
        changeType: changeType,
        changeSummary: changeSummary || 'Initial auto-save',
        changeDescription: `Auto-saved changes at ${new Date().toLocaleTimeString()}`,
        codeBefore: originalCode,
        codeAfter: modifiedCode,
        createdBy: userId,
        status: 'open' // Keep open for editing and undo capability
      });
      
      result = { success: true, customization, snapshot };
    } else {
      // Use new open snapshot management method for existing customizations
      console.log(`📝 Updating open snapshot for existing customization: ${customization.id}`);
      
      result = await HybridCustomization.createOrUpdateOpenSnapshot(customization.id, {
        changeType: changeType,
        changeSummary: changeSummary || 'Auto-saved changes',
        changeDescription: `Auto-saved changes at ${new Date().toLocaleTimeString()}`,
        codeBefore: originalCode,
        codeAfter: modifiedCode,
        createdBy: userId
      });
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create or update open snapshot');
    }
    
    // Broadcast diff patches to Diff tab if snapshot was created/updated
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
        id: customization.id,
        filePath: filePath,
        type: 'hybrid_customization',
        snapshotId: result.snapshot?.id,
        snapshotStatus: result.snapshot?.status || 'open',
        message: result.isNewSnapshot ? 'Created new open snapshot' : 'Updated existing open snapshot'
      },
      message: `Successfully auto-saved changes for ${filePath} with open snapshot management`
    });
  } catch (error) {
    console.error('Error creating hybrid patch with open snapshot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hybrid customization patch with open snapshot management'
    });
  }
});

/**
 * @route   POST /api/hybrid-patches/finalize/:filePath
 * @desc    Finalize open snapshots when "Publish" is clicked to enable rollback later
 * @access  Private
 */
router.post('/finalize/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { HybridCustomization } = require('../models/HybridCustomization');
    const { filePath } = req.params;
    const userId = req.user.id;
    const storeId = req.user.store_id || '157d4590-49bf-4b0b-bd77-abe131909528'; // Default store for now
    
    console.log(`🔒 Finalizing open snapshots for: ${filePath}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Store ID: ${storeId}`);
    
    // Find the customization for this file
    const customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        store_id: storeId,
        status: 'active'
      }
    });
    
    if (!customization) {
      return res.status(404).json({
        success: false,
        error: 'No active customization found for this file path'
      });
    }
    
    // Finalize any open snapshots for this customization
    const result = await HybridCustomization.finalizeOpenSnapshot(customization.id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to finalize open snapshot'
      });
    }
    
    res.json({
      success: true,
      data: {
        customizationId: customization.id,
        filePath: filePath,
        finalizedSnapshots: result.finalizedCount,
        message: result.finalizedCount > 0 
          ? `Finalized ${result.finalizedCount} open snapshot(s) - rollback now available`
          : 'No open snapshots found to finalize'
      },
      message: `Successfully processed snapshot finalization for ${filePath}`
    });
  } catch (error) {
    console.error('Error finalizing snapshots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finalize open snapshots'
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

/**
 * @route   GET /api/hybrid-patches/modified-code/:filePath
 * @desc    Get modified code for a file with all patches applied (for BrowserPreview)
 * @access  Private
 */
router.get('/modified-code/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.params;
    const storeId = req.user.store_id || '157d4590-49bf-4b0b-bd77-abe131909528'; // Default store for now
    
    console.log(`🌐 BrowserPreview API Request:`);
    console.log(`   File: ${filePath}`);
    console.log(`   Store ID: ${storeId}`);
    
    // Get modified code from diff integration service
    const modifiedCode = await diffIntegrationService.getModifiedCode(filePath, storeId);
    
    if (modifiedCode === null) {
      // No patches found, return null to indicate BrowserPreview should use original code
      return res.json({
        success: true,
        data: {
          filePath: filePath,
          modifiedCode: null,
          hasPatches: false
        },
        message: `No patches found for ${filePath} - using original code`
      });
    }
    
    res.json({
      success: true,
      data: {
        filePath: filePath,
        modifiedCode: modifiedCode,
        hasPatches: true
      },
      message: `Modified code loaded for ${filePath} with patches applied`
    });
  } catch (error) {
    console.error('Error getting modified code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get modified code for BrowserPreview'
    });
  }
});

module.exports = router;