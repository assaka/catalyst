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
      modified_code,  // Simplified: only the new/current code
      changeSummary,
      changeType = 'manual_edit'
    } = req.body;
    
    // For backward compatibility, also accept modifiedCode
    const modifiedCode = modified_code || req.body.modifiedCode;
    
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
    const requestStartTime = new Date();
    const requestTimestamp = requestStartTime.toISOString();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    console.log(`🚀 ============= AUTO-SAVE REQUEST START [${requestId}] =============`);
    console.log(`📝 Auto-saving changes for: ${filePath}`);
    console.log(`   Request ID: ${requestId}`);
    console.log(`   Timestamp: ${requestTimestamp}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Store ID: ${storeId}`);
    console.log(`   Modified code length: ${modifiedCode?.length || 0}`);
    console.log(`   Change summary: ${changeSummary}`);
    
    // Enhanced debugging: Log request body details
    console.log(`🔍 ENHANCED DEBUGGING - Request Analysis:`);
    console.log(`   Request method: ${req.method}`);
    console.log(`   Request URL: ${req.originalUrl}`);
    console.log(`   Request headers - Content-Type: ${req.headers['content-type']}`);
    console.log(`   Request headers - User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
    console.log(`   Request body keys: ${Object.keys(req.body)}`);
    console.log(`   Request body size: ${JSON.stringify(req.body).length} chars`);
    console.log(`   FilePath from body: "${req.body.filePath}"`);
    console.log(`   ChangeSummary from body: "${req.body.changeSummary}"`);
    console.log(`   ChangeType from body: "${req.body.changeType}"`);
    
    // ULTRA DETAILED debugging: Analyze request payload structure
    console.log(`🔍 ULTRA DETAILED PAYLOAD ANALYSIS:`);
    console.log(`   modified_code type: ${typeof req.body.modified_code}`);
    console.log(`   modifiedCode type: ${typeof req.body.modifiedCode}`);
    console.log(`   modified_code is string: ${typeof req.body.modified_code === 'string'}`);
    console.log(`   modifiedCode is string: ${typeof req.body.modifiedCode === 'string'}`);
    console.log(`   modified_code is null: ${req.body.modified_code === null}`);
    console.log(`   modifiedCode is null: ${req.body.modifiedCode === null}`);
    console.log(`   modified_code is undefined: ${req.body.modified_code === undefined}`);
    console.log(`   modifiedCode is undefined: ${req.body.modifiedCode === undefined}`);
    
    // Validate required parameters
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'filePath is required'
      });
    }
    
    if (!modifiedCode) {
      return res.status(400).json({
        success: false,
        error: 'modified_code (or modifiedCode for backward compatibility) is required'
      });
    }
    
    console.log(`✅ API validation passed - modified code received (${modifiedCode.length} characters)`);
    
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
      // Create new customization - store baseline code for proper diffs
      customization = await HybridCustomization.create({
        file_path: filePath,
        store_id: storeId,
        user_id: userId,
        name: `Auto-saved changes to ${filePath.split('/').pop()}`,
        description: 'Auto-generated from manual edits',
        component_type: 'component',
        baseline_code: modifiedCode, // For new files, first save becomes the baseline
        current_code: null,  // Only store after Preview
        status: 'active',
        version_number: 1
      });
      wasCreated = true;
      console.log(`🔧 Set baseline_code for new customization (${modifiedCode?.length || 0} chars)`);
    } else {
      // Update baseline_code if not set (use current modified code as baseline)
      if (!customization.baseline_code) {
        await customization.update({ baseline_code: modifiedCode });
        console.log(`🔧 Updated baseline_code for existing customization (${modifiedCode?.length || 0} chars)`);
      } else {
        console.log(`📝 Using existing customization with baseline_code: ${customization.baseline_code ? 'SET' : 'NULL'}`);
      }
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
        // Use baseline_code from database as the codeBefore for accurate diffs
        const actualCodeBefore = customization.baseline_code;
        
        console.log(`🔧 Creating snapshot with patch-based storage:`);
        console.log(`   Baseline from DB: ${customization.baseline_code ? 'SET' : 'NULL'} (${customization.baseline_code?.length || 0} chars)`);
        console.log(`   Modified from frontend: ${modifiedCode ? 'SET' : 'NULL'} (${modifiedCode?.length || 0} chars)`);
        console.log(`   Modified from frontend: ${modifiedCode ? 'SET' : 'NULL'} (${modifiedCode?.length || 0} chars)`);
        console.log(`   Using codeBefore: DB baseline (${actualCodeBefore?.length || 0} chars)`);
        
        // Enhanced comparison logging
        if (customization.baseline_code && modifiedCode) {
          const baselineVsModified = customization.baseline_code === modifiedCode;
          console.log(`🔍 CRITICAL COMPARISON CHECK:`);
          console.log(`   DB baseline === Modified code: ${baselineVsModified ? '❌ IDENTICAL' : '✅ DIFFERENT'}`);
          console.log(`   This is the comparison that will generate the line diff.`);
          
          // ULTRA DETAILED DATABASE BASELINE ANALYSIS
          console.log(`🔍 DATABASE BASELINE DEEP ANALYSIS:`);
          console.log(`   DB baseline code length: ${customization.baseline_code.length}`);
          console.log(`   Frontend modified length: ${modifiedCode.length}`);
          console.log(`   Length difference: ${Math.abs(customization.baseline_code.length - modifiedCode.length)}`);
          
          // Hash comparison for baseline vs modified
          const crypto = require('crypto');
          const baselineHash = crypto.createHash('md5').update(customization.baseline_code).digest('hex');
          const modifiedHash = crypto.createHash('md5').update(modifiedCode).digest('hex');
          console.log(`   DB baseline hash: ${baselineHash}`);
          console.log(`   Frontend modified hash: ${modifiedHash}`);
          console.log(`   Hashes match: ${baselineHash === modifiedHash ? '❌ YES' : '✅ NO'}`);
          
          // Character-by-character analysis
          let charDiffCount = 0;
          const minLen = Math.min(customization.baseline_code.length, modifiedCode.length);
          for (let i = 0; i < minLen; i++) {
            if (customization.baseline_code[i] !== modifiedCode[i]) {
              charDiffCount++;
            }
          }
          console.log(`   Character differences found: ${charDiffCount}`);
          console.log(`   Length difference: ${Math.abs(customization.baseline_code.length - modifiedCode.length)}`);
          console.log(`   Total character changes: ${charDiffCount + Math.abs(customization.baseline_code.length - modifiedCode.length)}`);
          
          if (baselineVsModified) {
            console.log(`   🚨 ROOT CAUSE IDENTIFIED: DB baseline and frontend modified code are identical!`);
            console.log(`   This means the frontend is NOT sending the actual edited code.`);
            console.log(`   The frontend should send the current editor content as 'modifiedCode'.`);
            console.log(`   🔍 DEBUG QUESTIONS FOR FRONTEND:`);
            console.log(`     - Is the editor capturing the current content correctly?`);
            console.log(`     - Is the auto-save logic getting the baseline from the wrong source?`);
            console.log(`     - Is the editor state being updated after manual changes?`);
            console.log(`     - Are the frontend references pointing to the same object?`);
          } else {
            // Show first few lines to verify they're actually different
            const baselineLines = customization.baseline_code.split('\n');
            const modifiedLines = modifiedCode.split('\n');
            console.log(`   🔍 Line count comparison: baseline=${baselineLines.length}, modified=${modifiedLines.length}`);
            
            // Find first differing line and show context
            let foundDiff = false;
            for (let i = 0; i < Math.min(10, baselineLines.length, modifiedLines.length); i++) {
              if (baselineLines[i] !== modifiedLines[i]) {
                console.log(`   ✅ Found difference at line ${i + 1}:`);
                console.log(`      Baseline: "${baselineLines[i]}"`);
                console.log(`      Modified: "${modifiedLines[i]}"`);
                console.log(`      Line length diff: ${Math.abs(baselineLines[i].length - modifiedLines[i].length)}`);
                foundDiff = true;
                break;
              }
            }
            
            if (!foundDiff && baselineLines.length !== modifiedLines.length) {
              console.log(`   ✅ Difference found in line count only:`);
              console.log(`      Baseline lines: ${baselineLines.length}`);
              console.log(`      Modified lines: ${modifiedLines.length}`);
              if (baselineLines.length < modifiedLines.length) {
                console.log(`      Extra lines in modified starting at line ${baselineLines.length + 1}`);
              } else {
                console.log(`      Extra lines in baseline starting at line ${modifiedLines.length + 1}`);
              }
            }
          }
        }
        
        // Generate unified diff patch BEFORE creating snapshot
        const { generateUnifiedDiff } = require('../utils/unified-diff');
        const fileName = filePath.split('/').pop() || 'file'; // Extract filename for diff header
        const unifiedDiff = generateUnifiedDiff(actualCodeBefore, modifiedCode, fileName);
        
        console.log(`🔧 Generated unified diff patch:`);
        console.log(`   Has changes: ${unifiedDiff.hasChanges}`);
        console.log(`   Total changes: ${unifiedDiff.stats?.totalChanges || 0}`);
        console.log(`   Additions: +${unifiedDiff.stats?.additions || 0}`);
        console.log(`   Deletions: -${unifiedDiff.stats?.deletions || 0}`);
        console.log(`   Patch size: ${unifiedDiff.patch?.length || 0} characters`);
        
        if (!unifiedDiff.hasChanges) {
          console.log(`⚠️  No changes detected in unified diff - skipping snapshot creation`);
          return res.json({
            success: true,
            data: {
              id: customization.id,
              filePath: filePath,
              type: 'hybrid_customization',
              snapshotId: null,
              snapshotStatus: 'no_changes',
              message: 'No changes detected - snapshot not created'
            },
            message: `No changes detected for ${filePath} - no snapshot needed`
          });
        }
        
        // Prepare patch operations for database storage
        const patchOperations = {
          type: 'unified_diff',
          patch: unifiedDiff.patch,
          stats: unifiedDiff.stats,
          metadata: unifiedDiff.metadata,
          created_at: unifiedDiff.timestamp
        };
        
        // Create reverse patch for rollback capability
        const reversePatchOperations = {
          type: 'unified_diff',
          patch: generateUnifiedDiff(modifiedCode, actualCodeBefore, fileName).patch,
          stats: {
            additions: unifiedDiff.stats.deletions, // Reverse the stats
            deletions: unifiedDiff.stats.additions,
            modifications: unifiedDiff.stats.modifications,
            totalChanges: unifiedDiff.stats.totalChanges
          },
          created_at: unifiedDiff.timestamp
        };
        
        // Create snapshot with unified diff patch data
        snapshot = await HybridCustomization.createSnapshot({
          customizationId: customization.id,
          changeType: changeType,
          changeSummary: changeSummary || `Manual edit: ${unifiedDiff.stats.totalChanges} changes (+${unifiedDiff.stats.additions} -${unifiedDiff.stats.deletions})`,
          changeDescription: `Auto-saved changes at ${new Date().toLocaleTimeString()}`,
          codeBefore: null, // Don't store full code - use patch only
          codeAfter: null,  // Don't store full code - use patch only  
          createdBy: userId,
          status: 'open', // Keep open for editing and undo capability
          // Store unified diff data in proper database fields
          astDiff: unifiedDiff, // Store full unified diff object for metadata
          patchOperations: patchOperations,
          reversePatchOperations: reversePatchOperations,
          patchPreview: unifiedDiff.patch.substring(0, 1000) // Store truncated patch for quick preview
        });
      } catch (snapshotError) {
        console.error(`❌ Error creating snapshot:`, snapshotError.message);
        console.error(`❌ Error details:`, {
          customizationId: customization.id,
          changeType,
          userId,
          hasModifiedCode: !!modifiedCode,
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
        // Use baseline_code from database as the codeBefore for accurate diffs
        const actualCodeBefore = customization.baseline_code;
        
        console.log(`🔧 Creating NEW snapshot with patch-based storage:`);
        console.log(`   Baseline from DB: ${customization.baseline_code ? 'SET' : 'NULL'} (${customization.baseline_code?.length || 0} chars)`);
        console.log(`   Modified from frontend: ${modifiedCode ? 'SET' : 'NULL'} (${modifiedCode?.length || 0} chars)`);
        console.log(`   Modified from frontend: ${modifiedCode ? 'SET' : 'NULL'} (${modifiedCode?.length || 0} chars)`);
        console.log(`   Using codeBefore: DB baseline (${actualCodeBefore?.length || 0} chars)`);
        
        // Generate unified diff patch BEFORE creating snapshot (consistent with update path)
        const { generateUnifiedDiff } = require('../utils/unified-diff');
        const fileName = filePath.split('/').pop() || 'file'; // Extract filename for diff header
        const unifiedDiff = generateUnifiedDiff(actualCodeBefore, modifiedCode, fileName);
        
        console.log(`🔧 Generated unified diff patch for NEW snapshot:`);
        console.log(`   Has changes: ${unifiedDiff.hasChanges}`);
        console.log(`   Total changes: ${unifiedDiff.stats?.totalChanges || 0}`);
        console.log(`   Additions: +${unifiedDiff.stats?.additions || 0}`);
        console.log(`   Deletions: -${unifiedDiff.stats?.deletions || 0}`);
        console.log(`   Patch size: ${unifiedDiff.patch?.length || 0} characters`);
        
        if (!unifiedDiff.hasChanges) {
          console.log(`⚠️  No changes detected in unified diff - skipping NEW snapshot creation`);
          return res.json({
            success: true,
            data: {
              id: customization.id,
              filePath: filePath,
              type: 'hybrid_customization',
              snapshotId: null,
              snapshotStatus: 'no_changes',
              message: 'No changes detected - snapshot not created'
            },
            message: `No changes detected for ${filePath} - no snapshot needed`
          });
        }
        
        // Prepare patch operations for database storage (consistent with update path)
        const patchOperations = {
          type: 'unified_diff',
          patch: unifiedDiff.patch,
          stats: unifiedDiff.stats,
          metadata: unifiedDiff.metadata,
          created_at: unifiedDiff.timestamp
        };
        
        // Create reverse patch for rollback capability (consistent with update path)
        const reversePatchOperations = {
          type: 'unified_diff',
          patch: generateUnifiedDiff(modifiedCode, actualCodeBefore, fileName).patch,
          stats: {
            additions: unifiedDiff.stats.deletions, // Reverse the stats
            deletions: unifiedDiff.stats.additions,
            modifications: unifiedDiff.stats.modifications,
            totalChanges: unifiedDiff.stats.totalChanges
          },
          created_at: unifiedDiff.timestamp
        };
        
        // Create snapshot with unified diff patch data (consistent with update path)
        snapshot = await HybridCustomization.createSnapshot({
          customizationId: customization.id,
          changeType: changeType,
          changeSummary: changeSummary || `Initial edit: ${unifiedDiff.stats.totalChanges} changes (+${unifiedDiff.stats.additions} -${unifiedDiff.stats.deletions})`,
          changeDescription: `Auto-saved changes at ${new Date().toLocaleTimeString()}`,
          codeBefore: null, // Don't store full code - use patch only
          codeAfter: null,  // Don't store full code - use patch only
          createdBy: userId,
          status: 'open', // Keep open for editing and undo capability
          // Store unified diff data in proper database fields (consistent with update path)
          astDiff: unifiedDiff, // Store full unified diff object for metadata
          patchOperations: patchOperations,
          reversePatchOperations: reversePatchOperations,
          patchPreview: unifiedDiff.patch.substring(0, 1000) // Store truncated patch for quick preview
        });
      } catch (snapshotError) {
        console.error(`❌ Error creating NEW snapshot:`, snapshotError.message);
        console.error(`❌ Error details:`, {
          customizationId: customization.id,
          changeType,
          userId,
          hasModifiedCode: !!modifiedCode,
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
    
    const responseData = {
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
    };
    
    const endTimestamp = new Date().toISOString();
    const processingTimeMs = Date.now() - requestStartTime.getTime();
    
    console.log(`🎉 ============= AUTO-SAVE REQUEST SUCCESS [${requestId}] =============`);
    console.log(`   Processing time: ${processingTimeMs}ms`);
    console.log(`   End timestamp: ${endTimestamp}`);
    console.log(`   Response data: ${JSON.stringify(responseData.data, null, 2)}`);
    console.log(`🏁 ============= REQUEST COMPLETE [${requestId}] =============`);
    
    res.json(responseData);
  } catch (error) {
    const errorTimestamp = new Date().toISOString();
    const processingTimeMs = Date.now() - requestStartTime.getTime();
    
    console.error(`❌ ============= AUTO-SAVE REQUEST ERROR [${requestId}] =============`);
    console.error(`   Processing time: ${processingTimeMs}ms`);
    console.error(`   Error timestamp: ${errorTimestamp}`);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Error stack: ${error.stack}`);
    console.error(`   Request data: filePath=${filePath}, userId=${userId}, storeId=${storeId}`);
    console.error(`💥 ============= REQUEST FAILED [${requestId}] =============`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create hybrid customization patch with open snapshot management',
      requestId: requestId // Include request ID for debugging
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