/**
 * Patches API Routes
 * Replaces the overlay system with efficient patch-only approach
 * Supports versioning, A/B testing, and rollbacks
 */

const express = require('express');
const router = express.Router();
const patchService = require('../services/patch-service');
const { authMiddleware } = require('../middleware/auth');

// Apply patches to a file and return the result (public endpoint for preview)
router.get('/apply/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    console.log(`🔄 Patches API: Apply patches to ${filePath}`);

    const options = {
      storeId: req.query.store_id || '157d4590-49bf-4b0b-bd77-abe131909528',
      userId: req.query.user_id || null,
      sessionId: req.query.session_id || null,
      releaseVersion: req.query.version || null,
      abVariant: req.query.ab_variant || null,
      previewMode: req.query.preview === 'true',
      maxPatches: parseInt(req.query.max_patches) || 50
    };

    console.log(`🔍 Patch application options:`, options);

    const result = await patchService.applyPatches(filePath, options);

    // Set cache control headers to prevent unwanted caching for patch applications
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          hasPatches: result.hasPatches,
          patchedCode: result.patchedCode,
          baselineCode: result.baselineCode,
          appliedPatches: result.appliedPatches,
          totalPatches: result.totalPatches || result.appliedPatches,
          patchDetails: result.patchDetails || [],
          cacheKey: result.cacheKey,
          mode: 'patches'
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        data: {
          hasPatches: false,
          mode: 'patches'
        }
      });
    }

  } catch (error) {
    console.error('❌ Patches API: Error applying patches:', error);
    
    // Set cache control headers for error responses too
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        hasPatches: false,
        mode: 'patches'
      }
    });
  }
});

// Create a new patch or update existing one in edit session (requires authentication)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      filePath,
      modifiedCode,
      patchName,
      changeType = 'manual_edit',
      changeSummary,
      changeDescription = '',
      priority = 0,
      releaseId = null,
      sessionId = null,     // NEW: session ID for edit session tracking
      useUpsert = true      // NEW: enable upsert strategy by default
    } = req.body;

    const storeId = req.headers['x-store-id'] || '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log(`📝 Creating/updating patch for ${filePath} (session: ${sessionId || 'none'})`);

    const result = await patchService.createPatch(filePath, modifiedCode, {
      storeId,
      releaseId,
      patchName,
      changeType,
      changeSummary,
      changeDescription,
      createdBy: req.user.id,
      priority,
      sessionId,
      useUpsert
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.action === 'updated' ? 'Patch updated successfully' : 'Patch created successfully',
        data: {
          patchId: result.patchId,
          diff: result.diff,
          createdAt: result.createdAt,
          action: result.action,
          sessionId: result.sessionId,
          accumulatedChanges: result.accumulatedChanges
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error creating patch:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get patches for a specific file
router.get('/file/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const storeId = req.query.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';
    const status = req.query.status || 'all';
    const releaseVersion = req.query.version || null;

    let query = `
      SELECT 
        cp.*,
        pr.version_name,
        pr.status as release_status,
        u.email as created_by_email
      FROM patch_diffs cp
      LEFT JOIN patch_releases pr ON cp.release_id = pr.id
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.store_id = :storeId AND cp.file_path = :filePath
    `;

    const replacements = { storeId, filePath };

    if (status !== 'all') {
      query += ` AND cp.status = :status`;
      replacements.status = status;
    }

    if (releaseVersion) {
      query += ` AND pr.version_name = :releaseVersion`;
      replacements.releaseVersion = releaseVersion;
    }

    query += ` ORDER BY cp.priority ASC, cp.created_at DESC`;

    const patches = await patchService.sequelize.query(query, {
      replacements,
      type: patchService.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        patches: patches || [],
        filePath,
        totalPatches: (patches || []).length
      }
    });

  } catch (error) {
    console.error('❌ Error getting patches for file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Publish patches (assign version_id) - requires authentication
router.post('/publish/:releaseId', authMiddleware, async (req, res) => {
  try {
    const { releaseId } = req.params;
    console.log(`📤 Publishing patches for release: ${releaseId}`);

    const result = await patchService.publishPatches(releaseId, {
      publishedBy: req.user.id
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Patches published successfully',
        data: {
          releaseId,
          publishedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error publishing patches:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rollback published release - requires authentication
router.post('/rollback/:releaseId', authMiddleware, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { rollbackReason = '' } = req.body;

    console.log(`⏪ Rolling back release: ${releaseId}`);

    const result = await patchService.rollbackRelease(releaseId, rollbackReason);

    if (result.success) {
      res.json({
        success: true,
        message: 'Release rolled back successfully',
        data: {
          releaseId,
          rollbackReason,
          rolledBackAt: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error rolling back release:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get patch releases for a store
router.get('/releases', async (req, res) => {
  try {
    const storeId = req.query.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';
    const status = req.query.status || 'all';

    let query = `
      SELECT 
        pr.*,
        u.email as created_by_email,
        COUNT(cp.id) as patch_count
      FROM patch_releases pr
      LEFT JOIN users u ON pr.created_by = u.id
      LEFT JOIN patch_diffs cp ON pr.id = cp.release_id
      WHERE pr.store_id = :storeId
    `;

    const replacements = { storeId };

    if (status !== 'all') {
      query += ` AND pr.status = :status`;
      replacements.status = status;
    }

    query += ` 
      GROUP BY pr.id, u.email
      ORDER BY pr.version_number DESC, pr.created_at DESC
    `;

    const [releases] = await patchService.sequelize.query(query, {
      replacements,
      type: patchService.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        releases: releases || [],
        totalReleases: (releases || []).length
      }
    });

  } catch (error) {
    console.error('❌ Error getting patch releases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new patch release - requires authentication
router.post('/releases', authMiddleware, async (req, res) => {
  try {
    const {
      versionName,
      releaseType = 'minor',
      description = '',
      abTestConfig = null
    } = req.body;

    const storeId = req.headers['x-store-id'] || '157d4590-49bf-4b0b-bd77-abe131909528';

    // Get next version number
    const [maxVersion] = await patchService.sequelize.query(`
      SELECT COALESCE(MAX(version_number), 0) as max_version 
      FROM patch_releases 
      WHERE store_id = :storeId
    `, {
      replacements: { storeId },
      type: patchService.sequelize.QueryTypes.SELECT
    });

    const nextVersionNumber = (maxVersion[0].max_version || 0) + 1;

    // Create release
    const [result] = await patchService.sequelize.query(`
      INSERT INTO patch_releases (
        store_id, version_name, version_number, release_type, 
        description, ab_test_config, created_by
      ) VALUES (
        :storeId, :versionName, :versionNumber, :releaseType,
        :description, :abTestConfig, :createdBy
      ) RETURNING id, created_at
    `, {
      replacements: {
        storeId,
        versionName,
        versionNumber: nextVersionNumber,
        releaseType,
        description,
        abTestConfig: abTestConfig ? JSON.stringify(abTestConfig) : null,
        createdBy: req.user.id
      },
      type: patchService.sequelize.QueryTypes.INSERT
    });

    res.json({
      success: true,
      message: 'Patch release created successfully',
      data: {
        releaseId: result[0].id,
        versionName,
        versionNumber: nextVersionNumber,
        createdAt: result[0].created_at
      }
    });

  } catch (error) {
    console.error('❌ Error creating patch release:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get patch application statistics
router.get('/stats', async (req, res) => {
  try {
    const storeId = req.query.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';

    const [stats] = await patchService.sequelize.query(`
      SELECT 
        COUNT(DISTINCT cp.id) as total_patches,
        COUNT(DISTINCT pr.id) as total_releases,
        COUNT(DISTINCT cp.file_path) as files_with_patches,
        COUNT(CASE WHEN cp.status = 'published' THEN 1 END) as published_patches,
        COUNT(CASE WHEN cp.status = 'open' THEN 1 END) as open_patches,
        COUNT(CASE WHEN pr.status = 'published' THEN 1 END) as published_releases
      FROM patch_diffs cp
      LEFT JOIN patch_releases pr ON cp.release_id = pr.id
      WHERE cp.store_id = :storeId
    `, {
      replacements: { storeId },
      type: patchService.sequelize.QueryTypes.SELECT
    });

    const serviceStats = patchService.getStats();

    res.json({
      success: true,
      data: {
        database: stats[0] || {
          total_patches: 0,
          total_releases: 0,
          files_with_patches: 0,
          published_patches: 0,
          open_patches: 0,
          published_releases: 0
        },
        service: serviceStats
      }
    });

  } catch (error) {
    console.error('❌ Error getting patch stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Finalize diffs for a file - assign release_id and set status to final
router.post('/finalize-diffs', authMiddleware, async (req, res) => {
  try {
    const { filePath, releaseId, changeSummary = '' } = req.body;
    const storeId = req.headers['x-store-id'] || '157d4590-49bf-4b0b-bd77-abe131909528';

    if (!filePath || !releaseId) {
      return res.status(400).json({
        success: false,
        error: 'File path and release ID are required'
      });
    }

    console.log(`🏁 Finalizing diffs for file: ${filePath} with release: ${releaseId}`);

    // Update open diffs for the file to assign release_id and set status to 'open' (ready for publishing)
    const [updatedDiffs] = await patchService.sequelize.query(`
      UPDATE patch_diffs 
      SET 
        release_id = :releaseId,
        status = 'open',
        change_summary = COALESCE(NULLIF(:changeSummary, ''), change_summary, 'AI-generated changes'),
        updated_at = CURRENT_TIMESTAMP
      WHERE store_id = :storeId 
        AND file_path = :filePath 
        AND status = 'open'
        AND release_id IS NULL
        AND created_by = :createdBy
      RETURNING id, patch_name, change_summary
    `, {
      replacements: { 
        storeId, 
        filePath, 
        releaseId, 
        changeSummary,
        createdBy: req.user.id 
      },
      type: patchService.sequelize.QueryTypes.UPDATE
    });

    const finalizedCount = updatedDiffs[1]?.rowCount || 0;

    if (finalizedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'No open diffs found for this file'
      });
    }

    console.log(`✅ Finalized ${finalizedCount} diffs for ${filePath}`);

    res.json({
      success: true,
      message: 'Diffs finalized successfully',
      data: {
        filePath,
        releaseId,
        finalizedDiffs: updatedDiffs[0] || [],
        totalFinalized: finalizedCount,
        finalizedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error finalizing diffs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Finalize edit session - move patches from 'open' to 'ready_for_review' status
router.post('/finalize-session', authMiddleware, async (req, res) => {
  try {
    const { sessionId, releaseId = null, changeSummary = '' } = req.body;
    const storeId = req.headers['x-store-id'] || '157d4590-49bf-4b0b-bd77-abe131909528';

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    console.log(`🏁 Finalizing edit session: ${sessionId}`);

    const result = await patchService.finalizeEditSession(sessionId, {
      storeId,
      releaseId,
      changeSummary,
      createdBy: req.user.id
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Edit session finalized successfully',
        data: {
          sessionId,
          finalizedPatches: result.finalizedPatches,
          totalPatches: result.totalPatches,
          finalizedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error finalizing edit session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear cache endpoint - for debugging
router.post('/cache/clear', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    patchService.clearCache(filePath);
    
    res.json({
      success: true,
      message: filePath ? `Cache cleared for ${filePath}` : 'All cache cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get baseline code for a file (for AI chat integration)
router.get('/baseline/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const storeId = req.query.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log(`📋 Getting baseline code for ${filePath}`);
    
    const result = await patchService.getBaseline(filePath, storeId);
    
    // Set cache control headers to prevent unwanted caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          hasBaseline: true,
          baselineCode: result.code,
          filePath: filePath
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          hasBaseline: false,
          message: result.error
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get modified code for a file (applies all patches to get final result)
router.get('/modified-code/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const storeId = req.query.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log(`🔧 Getting modified code for ${filePath}`);
    
    const result = await patchService.applyPatches(filePath, {
      storeId,
      previewMode: true
    });
    
    // Set cache control headers to prevent unwanted caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          modifiedCode: result.finalCode || result.patchedCode,
          hasPatches: result.hasPatches,
          appliedPatches: result.appliedPatches?.length || 0,
          filePath: filePath
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get file baselines for tree navigation
router.get('/baselines', async (req, res) => {
  try {
    console.log(`📋 Getting file baselines (core codebase files)`);
    
    // Baselines represent core code files that are the same across all stores
    const files = await patchService.sequelize.query(`
      SELECT DISTINCT
        file_path,
        baseline_code,
        code_hash,
        version,
        file_type,
        file_size,
        last_modified
      FROM file_baselines 
      ORDER BY file_path ASC
    `, {
      type: patchService.sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        files: files || [],
        totalFiles: (files || []).length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting file baselines:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test patch application without applying - for inline preview validation
router.get('/test/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const storeId = req.query.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log(`🧪 Testing patch application for: ${filePath}`);
    
    const result = await patchService.applyPatches(filePath, {
      storeId,
      previewMode: true,
      maxPatches: 50
    });
    
    // Set cache control headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          canApplyPatches: true,
          hasBaseline: !!result.baselineCode,
          hasPatches: result.hasPatches,
          patchedCode: result.patchedCode,
          baselineCode: result.baselineCode,
          appliedPatches: result.appliedPatches,
          totalPatches: result.totalPatches || result.appliedPatches,
          patchDetails: result.patchDetails || [],
          applicationLog: result.applicationLog || [],
          mode: 'test',
          filePath
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        data: {
          canApplyPatches: false,
          hasBaseline: false,
          hasPatches: false,
          mode: 'test',
          filePath
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Patch test error:', error);
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        canApplyPatches: false,
        hasBaseline: false,
        hasPatches: false,
        mode: 'test',
        filePath: req.params.filePath
      }
    });
  }
});

// Get patches for a specific file (catch-all route for frontend compatibility)
// This route must be at the end to avoid conflicts with other routes
router.get('/:filePath(*)', async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const storeId = req.query.store_id || '157d4590-49bf-4b0b-bd77-abe131909528';
    const status = req.query.status || 'all';
    const releaseVersion = req.query.version || null;

    console.log(`🔍 Getting patches for file: ${filePath}`);

    let query = `
      SELECT 
        cp.*,
        pr.version_name,
        pr.status as release_status,
        u.email as created_by_email
      FROM patch_diffs cp
      LEFT JOIN patch_releases pr ON cp.release_id = pr.id
      LEFT JOIN users u ON cp.created_by = u.id
      WHERE cp.store_id = :storeId AND cp.file_path = :filePath
    `;

    const replacements = { storeId, filePath };

    if (status !== 'all') {
      query += ` AND cp.status = :status`;
      replacements.status = status;
    }

    if (releaseVersion) {
      query += ` AND pr.version_name = :releaseVersion`;
      replacements.releaseVersion = releaseVersion;
    }

    query += ` ORDER BY cp.priority ASC, cp.created_at DESC`;

    const patches = await patchService.sequelize.query(query, {
      replacements,
      type: patchService.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        patches: patches || [],
        filePath,
        totalPatches: (patches || []).length
      }
    });

  } catch (error) {
    console.error('❌ Error getting patches for file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Revert specific line in patches (surgical approach) - requires authentication
router.patch('/revert-line/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 PATCH /revert-line endpoint called');
    console.log('🔍 User from auth middleware:', req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'undefined');
    console.log('🔍 Request headers:', {
      'authorization': req.headers.authorization ? 'Present' : 'Missing',
      'x-store-id': req.headers['x-store-id'],
      'content-type': req.headers['content-type']
    });
    
    const filePath = req.params.filePath;
    const { lineNumber, originalContent, modifiedContent } = req.body;
    const storeId = req.headers['x-store-id'] || '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log(`↩️ Reverting line ${lineNumber} in ${filePath}`);
    console.log(`   From: "${modifiedContent}" → To: "${originalContent}"`);

    if (typeof lineNumber !== 'number' || lineNumber < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid line number is required'
      });
    }

    // Get active patches for this file
    const patches = await patchService.sequelize.query(`
      SELECT id, unified_diff, patch_name, change_summary
      FROM patch_diffs 
      WHERE store_id = :storeId 
      AND file_path = :filePath 
      AND is_active = true
      AND unified_diff IS NOT NULL
    `, {
      replacements: { storeId, filePath },
      type: patchService.sequelize.QueryTypes.SELECT
    });

    let modifiedPatches = 0;
    let deletedPatches = 0;

    for (const patch of patches) {
      try {
        console.log(`\n🔍 Processing patch: ${patch.patch_name}`);
        console.log(`📄 Original unified diff:`)
        console.log(patch.unified_diff);
        console.log(`📍 Looking for line ${lineNumber} with content: "${modifiedContent}"`);
        
        // Parse unified diff and remove hunks that affect the reverted line
        const modifiedDiff = removeDiffHunkForLine(patch.unified_diff, lineNumber, originalContent, modifiedContent);
        
        console.log(`📄 Modified diff result:`);
        console.log(modifiedDiff);
        console.log(`📊 Modified diff is null: ${modifiedDiff === null}`);
        console.log(`📊 Modified diff is empty: ${modifiedDiff === ''}`);
        console.log(`📊 Modified diff trimmed is empty: ${modifiedDiff && modifiedDiff.trim() === ''}`);
        
        if (modifiedDiff === null) {
          // No changes were made to this patch
          console.log(`⏭️ Skipping patch - no changes made`);
          continue;
        }
        
        if (modifiedDiff.trim() === '') {
          // Patch became empty after removing the hunk, delete it
          await patchService.sequelize.query(`
            UPDATE patch_diffs 
            SET is_active = false, status = 'reverted', updated_at = NOW()
            WHERE id = :patchId
          `, {
            replacements: { patchId: patch.id },
            type: patchService.sequelize.QueryTypes.UPDATE
          });
          deletedPatches++;
          console.log(`🗑️ Deleted empty patch: ${patch.patch_name}`);
        } else {
          // Update patch with modified diff
          await patchService.sequelize.query(`
            UPDATE patch_diffs 
            SET unified_diff = :modifiedDiff, updated_at = NOW()
            WHERE id = :patchId
          `, {
            replacements: { 
              patchId: patch.id, 
              modifiedDiff: modifiedDiff 
            },
            type: patchService.sequelize.QueryTypes.UPDATE
          });
          modifiedPatches++;
          console.log(`✏️ Modified patch: ${patch.patch_name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing patch ${patch.id}:`, error.message);
      }
    }

    console.log(`✅ Processed ${patches.length} patches: ${modifiedPatches} modified, ${deletedPatches} deleted`);

    res.json({
      success: true,
      message: `Successfully reverted line ${lineNumber}`,
      data: {
        totalPatches: patches.length,
        modifiedPatches,
        deletedPatches,
        filePath,
        lineNumber
      }
    });

  } catch (error) {
    console.error('❌ Error reverting line:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to remove diff hunks that affect a specific line
function removeDiffHunkForLine(unifiedDiff, targetLineNumber, originalContent, modifiedContent) {
  if (!unifiedDiff) return null;
  
  console.log(`🔍 Analyzing diff for line ${targetLineNumber}: "${modifiedContent}"`);
  
  const lines = unifiedDiff.split('\n');
  const result = [];
  let currentHunk = [];
  let inHunk = false;
  let hunkStartOldLine = 0;
  let hunkStartNewLine = 0;
  let oldLineNumber = 0;
  let newLineNumber = 0;
  let hunkShouldBeRemoved = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('@@')) {
      // Process previous hunk
      if (inHunk && currentHunk.length > 0) {
        if (!hunkShouldBeRemoved) {
          result.push(...currentHunk);
        } else {
          console.log(`🗑️ Removing hunk starting at old:${hunkStartOldLine} new:${hunkStartNewLine} that affects target line ${targetLineNumber}`);
        }
        currentHunk = [];
        hunkShouldBeRemoved = false;
      }
      
      // Parse hunk header to get starting line numbers for both old (-) and new (+) files
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (match) {
        hunkStartOldLine = parseInt(match[1]);
        hunkStartNewLine = parseInt(match[2]);
        oldLineNumber = hunkStartOldLine;
        newLineNumber = hunkStartNewLine;
        console.log(`📍 Hunk starts at old line: ${hunkStartOldLine}, new line: ${hunkStartNewLine}`);
      }
      
      currentHunk = [line];
      inHunk = true;
    } else if (inHunk) {
      currentHunk.push(line);
      
      // Track line numbers as we go through the hunk
      if (line.startsWith(' ')) {
        // Context line - appears in both old and new files
        oldLineNumber++;
        newLineNumber++;
      } else if (line.startsWith('-')) {
        // Deleted line - only in old file
        oldLineNumber++;
      } else if (line.startsWith('+')) {
        // Added line - only in new file, check if this is the line we want to revert
        const addedContent = line.substring(1); // Remove the '+' prefix
        
        // Check if this added line matches what we're trying to revert
        const addedContentTrimmed = addedContent.trim();
        const modifiedContentTrimmed = modifiedContent ? modifiedContent.trim() : '';
        
        console.log(`🔍 Checking added line: "${addedContentTrimmed}"`);
        console.log(`🔍 Against target content: "${modifiedContentTrimmed}"`);
        console.log(`🔍 Line position - Old file: ${oldLineNumber}, New file: ${newLineNumber}, Target line: ${targetLineNumber}`);
        
        // Try multiple matching strategies
        const exactMatch = addedContentTrimmed === modifiedContentTrimmed;
        const containsMatch = modifiedContentTrimmed && addedContentTrimmed.includes(modifiedContentTrimmed);
        const reverseContainsMatch = modifiedContentTrimmed && modifiedContentTrimmed.includes(addedContentTrimmed);
        
        // Additional strategy: check if the added content is a word within the target content
        const words = modifiedContentTrimmed.split(/\s+/).filter(w => w.length > 0);
        const wordMatch = words.some(word => word === addedContentTrimmed || addedContentTrimmed === word);
        
        console.log(`🔍 Match strategies: exact=${exactMatch}, contains=${containsMatch}, reverse=${reverseContainsMatch}, word=${wordMatch}`);
        
        if (exactMatch || containsMatch || reverseContainsMatch || wordMatch) {
          console.log(`🎯 Found matching content: "${addedContentTrimmed}"`);
          console.log(`📍 Target line number: ${targetLineNumber}, Current new position: ${newLineNumber}`);
          
          // Since we found matching content, mark the hunk for removal regardless of line number
          // The line numbers in character-level diffs don't match visual line numbers
          hunkShouldBeRemoved = true;
          console.log(`✂️ Marking hunk for removal - content match found (ignoring line number mismatch)`);
        }
        
        // Increment new line number for added lines
        newLineNumber++;
      }
    } else {
      result.push(line);
    }
  }
  
  // Process final hunk
  if (inHunk && currentHunk.length > 0) {
    if (!hunkShouldBeRemoved) {
      result.push(...currentHunk);
    } else {
      console.log(`🗑️ Removing final hunk that affects target line ${targetLineNumber}`);
    }
  }
  
  const resultDiff = result.join('\n').trim();
  console.log(`📊 Original diff lines: ${lines.length}, Result diff lines: ${result.length}`);
  console.log(`📊 Result diff is empty: ${resultDiff === ''}`);
  
  return resultDiff;
}

module.exports = router;