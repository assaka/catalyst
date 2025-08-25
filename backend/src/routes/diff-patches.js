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
    
    // Validate change type against database constraint
    const validChangeTypes = ['initial', 'ai_modification', 'manual_edit', 'rollback', 'merge'];
    if (!validChangeTypes.includes(changeType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid changeType '${changeType}'. Must be one of: ${validChangeTypes.join(', ')}`
      });
    }
    
    const userId = req.user.id;
    const storeId = req.user.store_id || '157d4590-49bf-4b0b-bd77-abe131909528'; // Default store for now
    
    console.log(`📝 Auto-saving changes for: ${filePath}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Store ID: ${storeId}`);
    console.log(`   Original code length: ${originalCode?.length || 0}`);
    console.log(`   Modified code length: ${modifiedCode?.length || 0}`);
    
    // Check if customization already exists for this file path (store-scoped)
    let customization = await HybridCustomization.findOne({
      where: {
        file_path: filePath,
        store_id: storeId,
        status: 'active'
      }
    });
    
    let result;
    
    // Use upsert approach for both customization and snapshot creation
    console.log(`📝 Upserting customization and open snapshot for: ${filePath}`);
    
    // Find or create customization (lightweight - no full code storage yet)
    customization = await HybridCustomization.findOne({
      where: { file_path: filePath, store_id: storeId, status: 'active' }
    });
    
    let wasCreated = false;
    if (!customization) {
      // Create new customization - only store metadata, no full code
      customization = await HybridCustomization.create({
        file_path: filePath,
        store_id: storeId,
        user_id: userId,
        name: `Auto-saved changes to ${filePath.split('/').pop()}`,
        description: 'Auto-generated from manual edits',
        component_type: 'component',
        baseline_code: null, // Only store after Preview
        current_code: null,  // Only store after Preview
        status: 'active',
        version_number: 1
      });
      wasCreated = true;
    } else {
      // Don't update current_code during auto-save - only after Preview
      console.log(`📝 Using existing customization for ${filePath} (no full code update)`);
    }
    
    console.log(`${wasCreated ? '🆕 Created' : '📝 Updated'} customization: ${customization.id}`);
    
    // Get next snapshot number for this customization
    const { CustomizationSnapshot } = require('../models/HybridCustomization');
    const maxSnapshot = await CustomizationSnapshot.max('snapshot_number', {
      where: { customization_id: customization.id }
    });
    const nextSnapshotNumber = (maxSnapshot || 0) + 1;
    
    // Check for existing open snapshot
    let existingOpenSnapshot = await CustomizationSnapshot.findOne({
      where: { customization_id: customization.id, status: 'open' }
    });
    
    let snapshot;
    if (existingOpenSnapshot) {
      // Update existing open snapshot with new code and AST diff
      console.log(`📝 Updating existing open snapshot: ${existingOpenSnapshot.id}`);
      
      // Use the createSnapshot method to ensure proper AST diff generation
      await existingOpenSnapshot.destroy(); // Remove the old one
      console.log(`🔧 Creating snapshot with data:`, {
        customizationId: customization.id,
        changeType: changeType,
        changeSummary: changeSummary || 'Auto-saved changes',
        hasOriginalCode: !!originalCode,
        hasModifiedCode: !!modifiedCode,
        userId: userId
      });
      
      try {
        snapshot = await HybridCustomization.createSnapshot({
          customizationId: customization.id,
          changeType: changeType,
          changeSummary: changeSummary || 'Auto-saved changes',
          changeDescription: `Auto-saved changes at ${new Date().toLocaleTimeString()}`,
          codeBefore: originalCode,
          codeAfter: modifiedCode,
          createdBy: userId,
          status: 'open' // Keep open for editing and undo capability
        });
      } catch (snapshotError) {
        console.error(`❌ Error creating snapshot:`, snapshotError.message);
        console.error(`❌ Error details:`, {
          customizationId: customization.id,
          changeType,
          userId,
          hasOriginalCode: !!originalCode,
          hasModifiedCode: !!modifiedCode
        });
        console.error(`❌ Full stack trace:`, snapshotError.stack);
        
        // Check for specific constraint violations
        if (snapshotError.message.includes('violates check constraint')) {
          throw new Error(`Database constraint violation: ${snapshotError.message}. Check that changeType '${changeType}' is valid.`);
        } else if (snapshotError.message.includes('foreign key')) {
          throw new Error(`Foreign key constraint violation: ${snapshotError.message}. Check that customizationId and userId exist.`);
        } else {
          throw snapshotError;
        }
      }
      
      console.log(`✅ Snapshot created successfully:`, snapshot.id);
    } else {
      // Create new open snapshot with full AST analysis
      console.log(`🆕 Creating new open snapshot for customization: ${customization.id}`);
      
      console.log(`🔧 Creating NEW snapshot with data:`, {
        customizationId: customization.id,
        changeType: changeType,
        changeSummary: changeSummary || 'Initial auto-save',
        hasOriginalCode: !!originalCode,
        hasModifiedCode: !!modifiedCode,
        userId: userId
      });
      
      try {
        snapshot = await HybridCustomization.createSnapshot({
          customizationId: customization.id,
          changeType: changeType,
          changeSummary: changeSummary || 'Initial auto-save',
          changeDescription: `Auto-saved changes at ${new Date().toLocaleTimeString()}`,
          codeBefore: originalCode,
          codeAfter: modifiedCode,
          createdBy: userId,
          status: 'open' // Keep open for editing and undo capability
        });
      } catch (snapshotError) {
        console.error(`❌ Error creating NEW snapshot:`, snapshotError.message);
        console.error(`❌ Error details:`, {
          customizationId: customization.id,
          changeType,
          userId,
          hasOriginalCode: !!originalCode,
          hasModifiedCode: !!modifiedCode
        });
        console.error(`❌ Full stack trace:`, snapshotError.stack);
        
        // Check for specific constraint violations
        if (snapshotError.message.includes('violates check constraint')) {
          throw new Error(`Database constraint violation: ${snapshotError.message}. Check that changeType '${changeType}' is valid.`);
        } else if (snapshotError.message.includes('foreign key')) {
          throw new Error(`Foreign key constraint violation: ${snapshotError.message}. Check that customizationId and userId exist.`);
        } else {
          throw snapshotError;
        }
      }
      
      console.log(`✅ NEW Snapshot created successfully:`, snapshot.id);
    }
    
    console.log(`📸 Managed open snapshot: ${snapshot.id} (status: ${snapshot.status}) with AST diff`);
    
    result = { success: true, customization, snapshot };
    
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