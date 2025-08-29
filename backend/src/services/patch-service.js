/**
 * Versioned Patch Service
 * Handles patch-only application with A/B testing and rollback support
 * Replaces the overlay system with efficient patch accumulation
 */

const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const crypto = require('crypto');
const { sequelize } = require('../database/connection');
const unifiedDiffService = require('./unified-diff-service');

class PatchService {
  constructor() {
    this.cache = new Map();
    this.sequelize = sequelize; // Expose sequelize instance for routes
  }

  /**
   * Apply patches to a file and return the result
   * This is the main entry point for patch application
   */
  async applyPatches(filePath, options = {}) {
    try {
      const {
        storeId,
        userId = null,
        sessionId = null,
        releaseVersion = null,
        abVariant = null,
        previewMode = false,
        maxPatches = 50
      } = options;

      console.log(`🔄 PatchService: Applying patches to ${filePath}`);
      console.log(`   Options:`, { storeId, userId, releaseVersion, abVariant, previewMode });

      // Get baseline code for the file
      const baseline = await this.getBaseline(filePath, storeId);
      if (!baseline.success) {
        return baseline;
      }

      // Get applicable patches based on context
      const patches = await this.getApplicablePatches(filePath, {
        storeId,
        userId,
        releaseVersion,
        abVariant,
        previewMode,
        maxPatches
      });

      if (patches.length === 0) {
        return {
          success: true,
          hasPatches: false,
          baselineCode: baseline.code,
          patchedCode: baseline.code,
          appliedPatches: 0,
          cacheKey: this.generateCacheKey(filePath, options)
        };
      }

      // Apply patches sequentially
      const result = await this.applyPatchesSequentially(
        baseline.code,
        patches,
        filePath,
        options
      );

      // Log application if not in preview mode
      if (!previewMode && result.success) {
        await this.logPatchApplications(patches, filePath, options, result);
      }

      return {
        ...result,
        filePath: filePath,
        baselineCode: baseline.code,
        finalCode: result.patchedCode,
        appliedPatches: patches.map(p => {
          let unifiedDiff = p.unified_diff;
          
          // Fix URL encoding issue - decode URL-encoded characters in the diff
          if (unifiedDiff) {
            try {
              unifiedDiff = decodeURIComponent(unifiedDiff);
            } catch (decodeError) {
              // If decoding fails, keep original (might not be URL-encoded)
              console.warn('Warning: Could not decode unified diff, using original:', decodeError.message);
            }
          }
          
          return {
            id: p.id,
            changeSummary: p.change_summary,
            patchName: p.patch_name,
            changeType: p.change_type,
            priority: p.priority,
            unifiedDiff: unifiedDiff,
            astDiff: p.ast_diff,
            createdAt: p.created_at,
            releaseVersion: p.release?.version_name
          };
        }),
        patchDetails: patches.map(p => ({
          id: p.id,
          name: p.patch_name,
          changeType: p.change_type,
          priority: p.priority,
          releaseVersion: p.release?.version_name
        }))
      };

    } catch (error) {
      console.error('❌ PatchService: Error applying patches:', error);
      return {
        success: false,
        error: error.message,
        hasPatches: false,
        baselineCode: null,
        patchedCode: null
      };
    }
  }

  /**
   * Get baseline code for a file
   */
  async getBaseline(filePath, storeId) {
    try {
      const baselines = await sequelize.query(`
        SELECT baseline_code, code_hash, version 
        FROM file_baselines 
        WHERE store_id = :storeId AND file_path = :filePath
        ORDER BY last_modified DESC 
        LIMIT 1
      `, {
        replacements: { storeId, filePath },
        type: sequelize.QueryTypes.SELECT
      });

      if (!baselines || baselines.length === 0) {
        return {
          success: false,
          error: `No baseline found for file: ${filePath}`,
          code: null
        };
      }

      return {
        success: true,
        code: baselines[0].baseline_code,
        hash: baselines[0].code_hash,
        version: baselines[0].version
      };

    } catch (error) {
      console.error('❌ Error getting baseline:', error);
      return {
        success: false,
        error: error.message,
        code: null
      };
    }
  }

  /**
   * Get patches applicable to current context
   */
  async getApplicablePatches(filePath, options) {
    try {
      const { storeId, userId, releaseVersion, abVariant, previewMode } = options;

      let query = `
        SELECT 
          cp.*,
          pr.version_name,
          pr.status as release_status,
          pr.ab_test_config
        FROM patch_diffs cp
        LEFT JOIN patch_releases pr ON cp.release_id = pr.id
        WHERE cp.store_id = :storeId 
          AND cp.file_path = :filePath
          AND cp.is_active = true
      `;

      const replacements = { storeId, filePath };

      // Filter by release version if specified
      if (releaseVersion) {
        query += ` AND pr.version_name = :releaseVersion`;
        replacements.releaseVersion = releaseVersion;
      }

      // Filter by status based on mode
      if (previewMode) {
        // In preview mode, include open and published patches
        query += ` AND cp.status IN ('open', 'published')`;
      } else {
        // In production, only published patches
        query += ` AND cp.status = 'published'`;
      }

      // Handle A/B testing
      if (abVariant) {
        query += ` AND (pr.ab_test_config IS NULL OR pr.ab_test_config->>'variant' = :abVariant)`;
        replacements.abVariant = abVariant;
      }

      query += ` ORDER BY cp.priority ASC, cp.created_at ASC`;

      const patches = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      // Filter patches based on user preferences if userId provided
      if (userId) {
        return this.filterByUserPreferences(patches, userId, storeId);
      }

      return patches || [];

    } catch (error) {
      console.error('❌ Error getting applicable patches:', error);
      return [];
    }
  }

  /**
   * Apply patches sequentially to accumulate changes
   */
  async applyPatchesSequentially(baselineCode, patches, filePath, options) {
    let currentCode = baselineCode;
    let appliedCount = 0;
    const applicationLog = [];

    console.log(`🔄 Applying ${patches.length} patches sequentially to ${filePath}`);

    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      console.log(`📝 Applying patch ${i + 1}/${patches.length}: ${patch.patch_name}`);

      try {
        const startTime = Date.now();
        let patchedCode;

        // Apply patch based on type and file format
        if (patch.ast_diff && this.isJSFile(filePath)) {
          // Apply AST-based patch for JavaScript/JSX files
          patchedCode = await this.applyASTDiff(currentCode, patch.ast_diff, filePath);
        } else if (patch.unified_diff) {
          // Apply unified diff patch
          patchedCode = await this.applyUnifiedDiff(currentCode, patch.unified_diff);
        } else {
          console.warn(`⚠️ No diff data for patch ${patch.id}, skipping`);
          continue;
        }

        const duration = Date.now() - startTime;

        // Validate the patched code
        if (this.isValidCode(patchedCode, filePath)) {
          currentCode = patchedCode;
          appliedCount++;
          
          applicationLog.push({
            patchId: patch.id,
            patchName: patch.patch_name,
            status: 'success',
            duration
          });

          console.log(`✅ Patch ${patch.patch_name} applied successfully (${duration}ms)`);
        } else {
          console.error(`❌ Patch ${patch.patch_name} produced invalid code`);
          applicationLog.push({
            patchId: patch.id,
            patchName: patch.patch_name,
            status: 'failed',
            error: 'Invalid code produced',
            duration
          });
        }

      } catch (error) {
        console.error(`❌ Error applying patch ${patch.patch_name}:`, error.message);
        applicationLog.push({
          patchId: patch.id,
          patchName: patch.patch_name,
          status: 'failed',
          error: error.message
        });
      }
    }

    return {
      success: true,
      hasPatches: appliedCount > 0,
      patchedCode: currentCode,
      appliedCount,
      totalPatches: patches.length,
      applicationLog,
      codeHash: this.generateHash(currentCode)
    };
  }

  /**
   * Apply unified diff patch
   */
  async applyUnifiedDiff(currentCode, unifiedDiff) {
    try {
      return await unifiedDiffService.applyUnifiedDiff(currentCode, unifiedDiff);
    } catch (error) {
      console.error(`❌ Error applying unified diff:`, error.message);
      return currentCode; // Return original on error
    }
  }

  /**
   * Apply AST-based diff for JavaScript/JSX files
   */
  async applyASTDiff(currentCode, astDiff, filePath) {
    try {
      if (!astDiff || typeof astDiff !== 'object') {
        console.log(`⚠️ Invalid AST diff for ${filePath}`);
        return currentCode;
      }

      const ast = this.parseCode(currentCode, filePath);
      if (!ast) {
        return currentCode;
      }

      // Apply text content changes
      if (astDiff.textChanges) {
        traverse(ast, {
          StringLiteral(path) {
            const change = astDiff.textChanges.find(tc => tc.old === path.node.value);
            if (change) {
              path.node.value = change.new;
            }
          },
          JSXText(path) {
            const change = astDiff.textChanges.find(tc => tc.old === path.node.value.trim());
            if (change) {
              path.node.value = change.new;
            }
          }
        });
      }

      // Generate the modified code
      const result = generate(ast, {
        retainLines: false,
        compact: false,
        jsescOption: { quotes: 'single' }
      });

      return result.code;

    } catch (error) {
      console.error(`❌ Error applying AST diff:`, error.message);
      return currentCode; // Return original on error
    }
  }

  /**
   * Create or update a patch using upsert strategy for edit sessions
   * This accumulates changes during an edit session rather than creating multiple patches
   */
  async createPatch(filePath, modifiedCode, options = {}) {
    try {
      const {
        storeId,
        releaseId = null,
        patchName,
        changeType = 'manual_edit',
        changeSummary,
        changeDescription = '',
        createdBy,
        priority = 0,
        sessionId = null,  // NEW: session ID for edit session grouping
        useUpsert = true   // NEW: flag to enable/disable upsert behavior
      } = options;

      // Get baseline code
      const baseline = await this.getBaseline(filePath, storeId);
      if (!baseline.success) {
        return { success: false, error: baseline.error };
      }

      // Create diff
      const diff = this.createDiff(baseline.code, modifiedCode, filePath);
      if (!diff.unifiedDiff) {
        return { success: false, error: 'Could not create diff - no changes detected' };
      }

      let result;

      if (useUpsert && sessionId && changeType === 'manual_edit') {
        // UPSERT STRATEGY: Look for existing open patch in this edit session
        console.log(`🔄 Using upsert strategy for session ${sessionId} on ${filePath}`);
        
        const existingPatch = await sequelize.query(`
          SELECT id, change_description, updated_at 
          FROM patch_diffs 
          WHERE store_id = :storeId 
            AND file_path = :filePath 
            AND status = 'open'
            AND change_type = 'manual_edit'
            AND created_by = :createdBy
          ORDER BY updated_at DESC 
          LIMIT 1
        `, {
          replacements: { storeId, filePath, createdBy },
          type: sequelize.QueryTypes.SELECT
        });

        if (existingPatch.length > 0) {
          // UPDATE existing patch - accumulate changes
          const patchId = existingPatch[0].id;
          const existingDescription = existingPatch[0].change_description || '';
          const accumulatedDescription = existingDescription 
            ? `${existingDescription}\\n\\n[${new Date().toLocaleTimeString()}] ${changeDescription || 'Auto-save'}` 
            : changeDescription || 'Auto-save';

          await sequelize.query(`
            UPDATE patch_diffs 
            SET 
              unified_diff = :unifiedDiff,
              ast_diff = :astDiff,
              change_summary = :changeSummary,
              change_description = :changeDescription,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = :patchId
          `, {
            replacements: {
              patchId,
              unifiedDiff: diff.unifiedDiff,
              astDiff: diff.astDiff ? JSON.stringify(diff.astDiff) : null,
              changeSummary,
              changeDescription: accumulatedDescription
            },
            type: sequelize.QueryTypes.UPDATE
          });

          console.log(`✅ Updated existing patch ${patchId} for ${filePath} (session ${sessionId})`);

          return {
            success: true,
            patchId,
            diff: diff.stats,
            action: 'updated',
            sessionId,
            accumulatedChanges: true
          };
        }
      }

      // CREATE new patch (default behavior or no existing patch found)
      [result] = await sequelize.query(`
        INSERT INTO patch_diffs (
          release_id, store_id, file_path, patch_name, change_type,
          unified_diff, ast_diff, change_summary, change_description,
          baseline_version, priority, created_by
        ) VALUES (
          :releaseId, :storeId, :filePath, :patchName, :changeType,
          :unifiedDiff, :astDiff, :changeSummary, :changeDescription,
          :baselineVersion, :priority, :createdBy
        ) RETURNING id, created_at
      `, {
        replacements: {
          releaseId,
          storeId,
          filePath,
          patchName: patchName || `Auto-save ${filePath.split('/').pop()} (${new Date().toLocaleTimeString()})`,
          changeType,
          unifiedDiff: diff.unifiedDiff,
          astDiff: diff.astDiff ? JSON.stringify(diff.astDiff) : null,
          changeSummary,
          changeDescription,
          baselineVersion: baseline.version,
          priority,
          createdBy
        },
        type: sequelize.QueryTypes.INSERT
      });

      console.log(`✅ Created new patch ${patchName || 'auto-save'} for ${filePath}`);

      return {
        success: true,
        patchId: result[0].id,
        diff: diff.stats,
        createdAt: result[0].created_at,
        action: 'created',
        sessionId,
        accumulatedChanges: false
      };

    } catch (error) {
      console.error('❌ Error creating/updating patch:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Finalize an edit session by marking patches as ready for review
   * This is called when the user stops editing or explicitly saves
   */
  async finalizeEditSession(sessionId, options = {}) {
    try {
      const { storeId, filePath, createdBy, finalizeAll = false } = options;

      let query = `
        UPDATE patch_diffs 
        SET 
          status = 'ready_for_review',
          change_description = CONCAT(
            COALESCE(change_description, ''), 
            CASE 
              WHEN change_description IS NOT NULL THEN '\n\n'
              ELSE ''
            END,
            '[Finalized at ' || TO_CHAR(NOW(), 'HH24:MI:SS') || ']'
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE status = 'open' 
          AND change_type = 'manual_edit'
      `;

      const replacements = {};

      if (!finalizeAll) {
        query += ` AND store_id = :storeId AND created_by = :createdBy`;
        replacements.storeId = storeId;
        replacements.createdBy = createdBy;

        if (filePath) {
          query += ` AND file_path = :filePath`;
          replacements.filePath = filePath;
        }
      }

      query += ` RETURNING id, file_path, patch_name`;

      const finalizedPatches = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.UPDATE
      });

      console.log(`✅ Finalized ${finalizedPatches[1]?.rowCount || 0} edit session patches`);

      return {
        success: true,
        finalizedPatches: finalizedPatches[0] || [],
        totalPatches: finalizedPatches[1]?.rowCount || 0,
        sessionId
      };

    } catch (error) {
      console.error('❌ Error finalizing edit session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Publish patches (assign version_id)
   */
  async publishPatches(releaseId, options = {}) {
    try {
      const { publishedBy } = options;

      // Update patch status and release status
      await sequelize.query(`
        UPDATE patch_diffs 
        SET status = 'published', updated_at = CURRENT_TIMESTAMP
        WHERE release_id = :releaseId AND status = 'open'
      `, {
        replacements: { releaseId },
        type: sequelize.QueryTypes.UPDATE
      });

      await sequelize.query(`
        UPDATE patch_releases 
        SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = :releaseId
      `, {
        replacements: { releaseId },
        type: sequelize.QueryTypes.UPDATE
      });

      // Clear cache for affected files
      this.clearCache();

      console.log(`✅ Published patches for release ${releaseId}`);

      return { success: true };

    } catch (error) {
      console.error('❌ Error publishing patches:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback published release
   */
  async rollbackRelease(releaseId, rollbackReason = '') {
    try {
      // Update release status
      await sequelize.query(`
        UPDATE patch_releases 
        SET 
          status = 'rolled_back', 
          rolled_back_at = CURRENT_TIMESTAMP,
          rollback_reason = :rollbackReason,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = :releaseId
      `, {
        replacements: { releaseId, rollbackReason },
        type: sequelize.QueryTypes.UPDATE
      });

      // Update patch status
      await sequelize.query(`
        UPDATE patch_diffs 
        SET status = 'rolled_back', updated_at = CURRENT_TIMESTAMP
        WHERE release_id = :releaseId
      `, {
        replacements: { releaseId },
        type: sequelize.QueryTypes.UPDATE
      });

      // Clear cache
      this.clearCache();

      console.log(`✅ Rolled back release ${releaseId}: ${rollbackReason}`);

      return { success: true };

    } catch (error) {
      console.error('❌ Error rolling back release:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Utility methods
   */
  async createDiff(baselineCode, modifiedCode, filePath) {
    try {
      // Create unified diff using line-based approach
      const unifiedDiff = await unifiedDiffService.createUnifiedDiff(baselineCode, modifiedCode, filePath);
      
      if (!unifiedDiff) {
        return { unifiedDiff: null, astDiff: null, stats: { additions: 0, deletions: 0, changes: 0 } };
      }

      // Check diff size and warn if it's too large (could cause frontend display issues)
      const MAX_DIFF_SIZE = 10000; // 10KB limit for diffs
      if (unifiedDiff && unifiedDiff.length > MAX_DIFF_SIZE) {
        console.warn(`⚠️ Large diff detected (${unifiedDiff.length} chars) for ${filePath} - this may cause display issues`);
        
        // Optionally truncate very large diffs with a summary
        if (unifiedDiff.length > 50000) {
          const truncatedDiff = unifiedDiff.substring(0, MAX_DIFF_SIZE);
          const remainingSize = unifiedDiff.length - MAX_DIFF_SIZE;
          unifiedDiff = truncatedDiff + `\n\n... [TRUNCATED: ${remainingSize} more characters] ...\n\nNote: This diff was truncated due to size. Full diff may indicate entire file replacement.`;
        }
      }

      // Create AST diff for JS files
      let astDiff = null;
      if (this.isJSFile(filePath)) {
        astDiff = this.createASTDiff(baselineCode, modifiedCode, filePath);
      }

      // Get diff statistics
      const stats = unifiedDiffService.getDiffStats(unifiedDiff);

      return {
        unifiedDiff,
        astDiff,
        stats
      };
    } catch (error) {
      console.error(`❌ Error creating diff:`, error.message);
      return { unifiedDiff: null, astDiff: null, stats: { additions: 0, deletions: 0, changes: 0 } };
    }
  }

  createASTDiff(baselineCode, modifiedCode, filePath) {
    try {
      const baselineAST = this.parseCode(baselineCode, filePath);
      const modifiedAST = this.parseCode(modifiedCode, filePath);

      if (!baselineAST || !modifiedAST) {
        return null;
      }

      const astDiff = { textChanges: [] };

      // Extract text changes from string literals and JSX text
      const baselineTexts = new Set();
      const modifiedTexts = new Set();

      traverse(baselineAST, {
        StringLiteral(path) { baselineTexts.add(path.node.value); },
        JSXText(path) { baselineTexts.add(path.node.value.trim()); }
      });

      traverse(modifiedAST, {
        StringLiteral(path) { modifiedTexts.add(path.node.value); },
        JSXText(path) { modifiedTexts.add(path.node.value.trim()); }
      });

      // Find text changes
      modifiedTexts.forEach(newText => {
        if (!baselineTexts.has(newText) && newText.length > 0) {
          const closest = [...baselineTexts].find(baseText => 
            baseText.toLowerCase().includes(newText.toLowerCase()) || 
            newText.toLowerCase().includes(baseText.toLowerCase())
          );
          
          if (closest) {
            astDiff.textChanges.push({ old: closest, new: newText });
          }
        }
      });

      return astDiff.textChanges.length > 0 ? astDiff : null;

    } catch (error) {
      console.error(`❌ Error creating AST diff:`, error.message);
      return null;
    }
  }

  parseCode(code, filePath) {
    try {
      const plugins = ['jsx'];
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        plugins.push('typescript');
      }

      return parse(code, {
        sourceType: 'module',
        plugins,
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        strictMode: false
      });
    } catch (error) {
      console.warn(`⚠️ Failed to parse ${filePath}:`, error.message);
      return null;
    }
  }

  isJSFile(filePath) {
    return /\.(jsx?|tsx?)$/.test(filePath);
  }

  isValidCode(code, filePath) {
    if (!code || code.trim().length === 0) {
      return false;
    }

    // For JS files, try parsing to validate syntax
    if (this.isJSFile(filePath)) {
      const ast = this.parseCode(code, filePath);
      return ast !== null;
    }

    return true; // For non-JS files, assume valid if not empty
  }

  generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  generateCacheKey(filePath, options) {
    const keyData = {
      filePath,
      storeId: options.storeId,
      userId: options.userId,
      releaseVersion: options.releaseVersion,
      abVariant: options.abVariant,
      previewMode: options.previewMode
    };
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  async filterByUserPreferences(patches, userId, storeId) {
    try {
      const [preferences] = await sequelize.query(`
        SELECT excluded_patches, ab_test_overrides
        FROM user_patch_preferences 
        WHERE user_id = :userId AND store_id = :storeId
      `, {
        replacements: { userId, storeId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!preferences || !preferences[0]) {
        return patches;
      }

      const excludedPatches = preferences[0].excluded_patches || [];
      return patches.filter(patch => !excludedPatches.includes(patch.id));

    } catch (error) {
      console.error('❌ Error filtering by user preferences:', error);
      return patches;
    }
  }

  async logPatchApplications(patches, filePath, options, result) {
    try {
      for (const patch of patches) {
        const logEntry = result.applicationLog.find(log => log.patchId === patch.id);
        
        await sequelize.query(`
          INSERT INTO patch_logs (
            store_id, patch_id, release_id, applied_by, user_id, session_id,
            ab_variant, file_path, baseline_code_hash, result_code_hash,
            application_status, error_message, duration_ms
          ) VALUES (
            :storeId, :patchId, :releaseId, :appliedBy, :userId, :sessionId,
            :abVariant, :filePath, :baselineHash, :resultHash,
            :status, :errorMessage, :duration
          )
        `, {
          replacements: {
            storeId: options.storeId,
            patchId: patch.id,
            releaseId: patch.release_id,
            appliedBy: options.previewMode ? 'preview' : 'system',
            userId: options.userId,
            sessionId: options.sessionId,
            abVariant: options.abVariant,
            filePath,
            baselineHash: this.generateHash(result.baselineCode || ''),
            resultHash: result.codeHash,
            status: logEntry?.status || 'success',
            errorMessage: logEntry?.error || null,
            duration: logEntry?.duration || 0
          },
          type: sequelize.QueryTypes.INSERT
        });
      }
    } catch (error) {
      console.error('❌ Error logging patch applications:', error);
    }
  }

  clearCache(filePath = null) {
    if (filePath) {
      const keysToDelete = [];
      for (const [key] of this.cache) {
        if (key.includes(filePath)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      memoryUsage: process.memoryUsage()
    };
  }
}

module.exports = new PatchService();