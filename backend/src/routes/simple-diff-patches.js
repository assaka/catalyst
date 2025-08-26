/**
 * Simplified Hybrid Patches API
 * Simple approach: store customization snapshot when code is edited with diff
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { HybridCustomization, CustomizationSnapshot } = require('../models/HybridCustomization');

/**
 * @route   POST /api/simple-hybrid-patches/create
 * @desc    Simple: Create snapshot on code edit with diff
 * @access  Private
 */
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      filePath,
      originalCode,
      modifiedCode,
      changeSummary = 'Code edited'
    } = req.body;

    const userId = req.user.id;
    const storeId = req.user.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log(`📝 Simple auto-save for: ${filePath}`);
    console.log(`   Original code: ${originalCode?.length || 0} chars`);
    console.log(`   Modified code: ${modifiedCode?.length || 0} chars`);

    // Validate required params
    if (!filePath || !originalCode || !modifiedCode) {
      return res.status(400).json({
        success: false,
        error: 'filePath, originalCode, and modifiedCode are required'
      });
    }

    // Skip if no changes
    if (originalCode === modifiedCode) {
      return res.json({
        success: true,
        message: 'No changes detected',
        data: { filePath, hasChanges: false }
      });
    }

    // Find or create customization
    let customization = await HybridCustomization.findOne({
      where: { file_path: filePath, store_id: storeId, status: 'active' }
    });

    if (!customization) {
      customization = await HybridCustomization.create({
        file_path: filePath,
        store_id: storeId,
        user_id: userId,
        name: `Changes to ${filePath.split('/').pop()}`,
        description: 'Auto-generated from code edits',
        component_type: 'component',
        baseline_code: originalCode,
        current_code: modifiedCode,
        status: 'active',
        version_number: 1
      });
      console.log(`✅ Created new customization: ${customization.id}`);
    }

    // Generate simple line-based diff
    const diff = generateSimpleDiff(originalCode, modifiedCode);
    
    console.log(`📊 Generated diff: ${diff.stats.totalChanges} changes (+${diff.stats.additions} -${diff.stats.deletions})`);

    // Create snapshot
    const snapshot = await CustomizationSnapshot.create({
      customization_id: customization.id,
      snapshot_number: await getNextSnapshotNumber(customization.id),
      change_type: 'manual_edit',
      change_summary: changeSummary,
      change_description: `Auto-saved at ${new Date().toLocaleTimeString()}`,
      ast_diff: diff,
      patch_operations: [], // Simple approach uses basic diff in ast_diff
      reverse_patch_operations: [], // Simple approach doesn't need complex reverse operations
      created_by: userId,
      status: 'open'
    });

    console.log(`✅ Created snapshot: ${snapshot.id}`);

    res.json({
      success: true,
      data: {
        customizationId: customization.id,
        snapshotId: snapshot.id,
        filePath,
        hasChanges: true,
        changes: diff.stats.totalChanges
      },
      message: `Saved changes for ${filePath}`
    });

  } catch (error) {
    console.error('❌ Simple auto-save failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to save changes'
    });
  }
});

/**
 * @route   GET /api/simple-hybrid-patches/:filePath
 * @desc    Get patches for a file
 * @access  Private
 */
router.get('/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.params;
    const storeId = req.user.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';

    const customization = await HybridCustomization.findOne({
      where: { file_path: filePath, store_id: storeId, status: 'active' },
      include: [{
        model: CustomizationSnapshot,
        as: 'snapshots',
        order: [['snapshot_number', 'DESC']],
        limit: 10
      }]
    });

    if (!customization) {
      return res.json({
        success: true,
        data: { file: { path: filePath }, patches: [], count: 0 },
        message: `No patches found for ${filePath}`
      });
    }

    const patches = customization.snapshots.map(snapshot => ({
      id: snapshot.id,
      summary: snapshot.change_summary,
      changes: snapshot.ast_diff?.stats?.totalChanges || 0,
      createdAt: snapshot.created_at,
      status: snapshot.status
    }));

    res.json({
      success: true,
      data: {
        file: { path: filePath },
        patches,
        count: patches.length
      },
      message: `Found ${patches.length} patches for ${filePath}`
    });

  } catch (error) {
    console.error('❌ Failed to get patches:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get patches'
    });
  }
});

/**
 * Generate simple line-based diff
 */
function generateSimpleDiff(original, modified) {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  const changes = [];
  let additions = 0;
  let deletions = 0;
  
  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i];
    const modifiedLine = modifiedLines[i];
    
    if (originalLine !== modifiedLine) {
      if (originalLine && !modifiedLine) {
        // Deletion
        changes.push({
          type: 'deletion',
          lineNumber: i + 1,
          content: originalLine
        });
        deletions++;
      } else if (!originalLine && modifiedLine) {
        // Addition
        changes.push({
          type: 'addition',
          lineNumber: i + 1,
          content: modifiedLine
        });
        additions++;
      } else if (originalLine && modifiedLine) {
        // Modification
        changes.push({
          type: 'modification',
          lineNumber: i + 1,
          oldContent: originalLine,
          newContent: modifiedLine
        });
        additions++;
        deletions++;
      }
    }
  }
  
  return {
    type: 'simple_diff',
    hasChanges: changes.length > 0,
    changes,
    stats: {
      additions,
      deletions,
      modifications: changes.filter(c => c.type === 'modification').length,
      totalChanges: changes.length
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Get next snapshot number for a customization
 */
async function getNextSnapshotNumber(customizationId) {
  const lastSnapshot = await CustomizationSnapshot.findOne({
    where: { customization_id: customizationId },
    order: [['snapshot_number', 'DESC']]
  });
  
  return (lastSnapshot?.snapshot_number || 0) + 1;
}

module.exports = router;