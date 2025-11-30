// backend/src/routes/plugin-version-api.js
const express = require('express');
const router = express.Router();
const ConnectionManager = require('../services/database/ConnectionManager');
const jsonpatch = require('fast-json-patch');

/**
 * Get tenant-specific Supabase client
 * Uses getStoreConnection which returns a SupabaseAdapter
 */
async function getTenantDb(req) {
  const storeId = req.headers['x-store-id'] || req.query.store_id;
  if (!storeId) throw new Error('Store ID is required for plugin operations');
  // getStoreConnection returns a SupabaseAdapter with .from() method
  return await ConnectionManager.getStoreConnection(storeId);
}

/**
 * =====================================================
 * PLUGIN VERSION CONTROL API
 * =====================================================
 * Git-like version control for plugins
 * Hybrid snapshot + patch strategy
 * =====================================================
 */

/**
 * GET /api/plugins/:pluginId/versions
 * List all versions for a plugin with pagination
 */
router.get('/:pluginId/versions', async (req, res) => {
  try {
    const db = await getTenantDb(req);
    const { pluginId } = req.params;
    const { page = 1, limit = 20, filter = 'all' } = req.query;
    const offset = (page - 1) * limit;

    console.log(`📚 Loading versions for plugin: ${pluginId}`);

    // Build query with filters
    let query = db.from('plugin_version_history')
      .select('*')
      .eq('plugin_id', pluginId);

    // Apply filters
    if (filter === 'snapshots') {
      query = query.eq('version_type', 'snapshot');
    } else if (filter === 'patches') {
      query = query.eq('version_type', 'patch');
    } else if (filter === 'published') {
      query = query.eq('is_published', true);
    }

    // Get total count
    const { count, error: countError } = await db.from('plugin_version_history')
      .select('*', { count: 'exact', head: true })
      .eq('plugin_id', pluginId);

    if (countError) throw new Error(countError.message);

    // Get versions with pagination
    const { data: versions, error: versionsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (versionsError) throw new Error(versionsError.message);

    // Get tags for these versions
    const versionIds = versions.map(v => v.id);
    let tags = [];
    if (versionIds.length > 0) {
      const { data: tagsData, error: tagsError } = await db.from('plugin_version_tags')
        .select('*')
        .in('version_id', versionIds);

      if (!tagsError) tags = tagsData || [];
    }

    // Attach tags to versions
    const versionsWithTags = versions.map(v => ({
      ...v,
      tags: tags.filter(t => t.version_id === v.id).map(t => ({ name: t.tag_name, type: t.tag_type }))
    }));

    console.log(`  ✅ Found ${versions.length} versions (total: ${count})`);

    res.json({
      success: true,
      versions: versionsWithTags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Failed to get versions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/:pluginId/versions/compare
 * Compare two versions and return diff
 * MUST BE BEFORE /:versionId route to avoid matching "compare" as a UUID
 */
router.get('/:pluginId/versions/compare', async (req, res) => {
  try {
    const db = await getTenantDb(req);
    const { pluginId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Both "from" and "to" version IDs are required'
      });
    }

    console.log(`🔍 Comparing versions: ${from} -> ${to}`);

    // Check cache first (skip cache check if table doesn't exist)
    let cached = null;
    try {
      const { data: cachedData } = await db.from('plugin_version_comparisons')
        .select('*')
        .eq('from_version_id', from)
        .eq('to_version_id', to)
        .gte('computed_at', new Date(Date.now() - 3600000).toISOString())
        .maybeSingle();
      cached = cachedData;
    } catch (e) {
      // Cache table might not exist, continue without cache
    }

    if (cached) {
      console.log('  ✅ Using cached comparison');
      return res.json({
        success: true,
        comparison: cached,
        cached: true
      });
    }

    // Reconstruct both states
    const fromState = await reconstructPluginState(db, from);
    const toState = await reconstructPluginState(db, to);

    console.log(`  ✓ States reconstructed:`, {
      fromState_keys: fromState ? Object.keys(fromState) : null,
      toState_keys: toState ? Object.keys(toState) : null,
      fromState_hooks_count: fromState?.hooks?.length || 0,
      toState_hooks_count: toState?.hooks?.length || 0
    });

    if (!fromState || !toState) {
      return res.status(404).json({
        success: false,
        error: 'Could not reconstruct version states'
      });
    }

    // Calculate detailed diff
    const diff = calculateDetailedDiff(fromState, toState);

    console.log(`  ✓ Diff calculated:`, {
      files_changed: diff.files_changed,
      lines_added: diff.lines_added,
      lines_deleted: diff.lines_deleted,
      summary_length: diff.summary?.length || 0
    });

    // Try to cache the result (skip if table doesn't exist)
    try {
      await db.from('plugin_version_comparisons')
        .upsert({
          plugin_id: pluginId,
          from_version_id: from,
          to_version_id: to,
          files_changed: diff.files_changed,
          lines_added: diff.lines_added,
          lines_deleted: diff.lines_deleted,
          components_added: diff.components_added,
          components_modified: diff.components_modified,
          components_deleted: diff.components_deleted,
          diff_summary: diff.summary,
          computed_at: new Date().toISOString()
        }, { onConflict: 'from_version_id,to_version_id' });
    } catch (e) {
      // Cache table might not exist, continue without caching
      console.warn('Could not cache comparison:', e.message);
    }

    console.log(`  ✅ Comparison complete: ${diff.files_changed} files changed`);

    res.json({
      success: true,
      comparison: diff,
      cached: false,
      info: {
        snapshot_info: diff.files_changed === 0
          ? 'These versions are identical'
          : `${diff.files_changed} components changed. Auto-snapshots are created every 10 versions to optimize performance.`
      }
    });
  } catch (error) {
    console.error('Failed to compare versions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/:pluginId/versions/current
 * Get the current active version
 */
router.get('/:pluginId/versions/current', async (req, res) => {
  try {
    const db = await getTenantDb(req);
    const { pluginId } = req.params;

    const { data: version, error } = await db.from('plugin_version_history')
      .select('*')
      .eq('plugin_id', pluginId)
      .eq('is_current', true)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'No current version found'
      });
    }

    res.json({
      success: true,
      version
    });
  } catch (error) {
    console.error('Failed to get current version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/:pluginId/versions/:versionId
 * Get specific version details with full data
 */
router.get('/:pluginId/versions/:versionId', async (req, res) => {
  try {
    const db = await getTenantDb(req);
    const { pluginId, versionId } = req.params;

    console.log(`📖 Loading version: ${versionId}`);

    // Get version metadata
    const { data: version, error: versionError } = await db.from('plugin_version_history')
      .select('*')
      .eq('plugin_id', pluginId)
      .eq('id', versionId)
      .maybeSingle();

    if (versionError) throw new Error(versionError.message);

    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }

    // Get patches for this version (if patch type)
    let patches = [];
    if (version.version_type === 'patch') {
      const { data: patchData, error: patchError } = await db.from('plugin_version_patches')
        .select('*')
        .eq('version_id', versionId)
        .order('component_type', { ascending: true });

      if (!patchError) patches = patchData || [];
    }

    // Get snapshot data (if snapshot type)
    let snapshot = null;
    if (version.version_type === 'snapshot') {
      const { data: snapshotData, error: snapshotError } = await db.from('plugin_version_snapshots')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle();

      if (!snapshotError) snapshot = snapshotData;
    }

    // Reconstruct full plugin state at this version
    const reconstructedState = await reconstructPluginState(db, versionId);

    console.log(`  ✓ Version details loaded:`, {
      version_type: version.version_type,
      has_snapshot: !!snapshot,
      has_patches: patches.length > 0,
      has_reconstructed: !!reconstructedState,
      reconstructed_keys: reconstructedState ? Object.keys(reconstructedState) : []
    });

    res.json({
      success: true,
      version: {
        ...version,
        patches,
        snapshot,
        reconstructed_state: reconstructedState  // Full reconstructed state for diff viewing
      }
    });
  } catch (error) {
    console.error('Failed to get version details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:pluginId/versions
 * Create a new version (auto-called on plugin save)
 */
router.post('/:pluginId/versions', async (req, res) => {
  try {
    const db = await getTenantDb(req);
    const { pluginId } = req.params;
    const {
      commit_message,
      created_by,
      created_by_name,
      force_snapshot = false,
      tag_name = null
    } = req.body;

    console.log(`📝 Creating new version for plugin: ${pluginId}`);

    // Get current version
    const { data: currentVersion } = await db.from('plugin_version_history')
      .select('*')
      .eq('plugin_id', pluginId)
      .eq('is_current', true)
      .maybeSingle();

    // Get current plugin state from database
    const pluginState = await getPluginCurrentState(db, pluginId);

    if (!pluginState) {
      console.error(`  ❌ Plugin ${pluginId} not found in database`);
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    console.log(`  ✓ Plugin state loaded:`, {
      hasRegistry: !!pluginState.registry,
      hooks: pluginState.hooks?.length || 0,
      events: pluginState.events?.length || 0,
      scripts: pluginState.scripts?.length || 0
    });

    // Determine version number (increment patch version)
    const newVersionNumber = incrementVersion(
      currentVersion?.version_number || '1.0.0',
      'patch'
    );

    // Determine if should create snapshot
    let shouldSnapshot = force_snapshot ||
      tag_name ||
      !currentVersion ||
      (currentVersion.snapshot_distance >= 9);

    // Calculate patches if not snapshot
    let patches = [];
    let stats = { files_changed: 0, lines_added: 0, lines_deleted: 0 };

    if (!shouldSnapshot && currentVersion) {
      // Get previous plugin state
      const previousState = await reconstructPluginState(db, currentVersion.id);

      if (!previousState) {
        console.warn(`  ⚠ Could not reconstruct previous state for version ${currentVersion.id}, forcing snapshot`);
        // Force snapshot if we can't reconstruct previous state
        shouldSnapshot = true;
      } else {
        // Calculate patches
        patches = calculatePatches(previousState, pluginState);
        stats = calculateStats(patches);
      }
    }

    // Unmark current version
    if (currentVersion) {
      await db.from('plugin_version_history')
        .update({ is_current: false })
        .eq('id', currentVersion.id);
    }

    // Create version record
    const { data: newVersion, error: insertError } = await db.from('plugin_version_history')
      .insert({
        plugin_id: pluginId,
        version_number: newVersionNumber,
        version_type: shouldSnapshot ? 'snapshot' : 'patch',
        parent_version_id: currentVersion?.id || null,
        commit_message: commit_message || 'Auto-save',
        created_by: created_by || null,
        created_by_name: created_by_name || 'System',
        is_current: true,
        is_published: !!tag_name,
        files_changed: stats.files_changed,
        lines_added: stats.lines_added,
        lines_deleted: stats.lines_deleted,
        snapshot_distance: shouldSnapshot ? 0 : (currentVersion?.snapshot_distance || 0) + 1
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    // Store snapshot or patches
    if (shouldSnapshot) {
      await createSnapshot(db, newVersion.id, pluginId, pluginState);
    } else {
      await storePatches(db, newVersion.id, pluginId, patches);
    }

    // Create tag if provided
    if (tag_name) {
      await db.from('plugin_version_tags')
        .insert({
          version_id: newVersion.id,
          plugin_id: pluginId,
          tag_name: tag_name,
          tag_type: 'custom',
          created_by: created_by,
          created_by_name: created_by_name
        });
    }

    console.log(`  ✅ Created version ${newVersionNumber} (${shouldSnapshot ? 'snapshot' : 'patch'})`);

    res.json({
      success: true,
      version: newVersion,
      type: shouldSnapshot ? 'snapshot' : 'patch',
      patches_count: patches.length
    });
  } catch (error) {
    console.error('❌ Failed to create version:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * POST /api/plugins/:pluginId/versions/:versionId/restore
 * Restore plugin to a specific version
 */
router.post('/:pluginId/versions/:versionId/restore', async (req, res) => {
  try {
    const db = await getTenantDb(req);
    const { pluginId, versionId } = req.params;
    const { create_backup = true, created_by, created_by_name } = req.body;

    console.log(`🔄 Restoring plugin ${pluginId} to version ${versionId}`);

    // Reconstruct plugin state at target version
    const targetState = await reconstructPluginState(db, versionId);

    if (!targetState) {
      return res.status(404).json({
        success: false,
        error: 'Could not reconstruct version state'
      });
    }

    // Apply restored state to database
    await applyPluginState(db, pluginId, targetState);

    // Mark all versions as not current, then set the target as current
    await db.from('plugin_version_history')
      .update({ is_current: false })
      .eq('plugin_id', pluginId);

    await db.from('plugin_version_history')
      .update({ is_current: true })
      .eq('id', versionId);

    console.log(`  ✅ Restored successfully`);

    res.json({
      success: true,
      message: 'Plugin restored successfully',
      version_id: versionId
    });
  } catch (error) {
    console.error('Failed to restore version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:pluginId/versions/:versionId/tag
 * Add a tag to a version
 */
router.post('/:pluginId/versions/:versionId/tag', async (req, res) => {
  try {
    const db = await getTenantDb(req);
    const { pluginId, versionId } = req.params;
    const { tag_name, tag_type = 'custom', description, created_by, created_by_name } = req.body;

    if (!tag_name) {
      return res.status(400).json({
        success: false,
        error: 'tag_name is required'
      });
    }

    await db.from('plugin_version_tags')
      .upsert({
        version_id: versionId,
        plugin_id: pluginId,
        tag_name: tag_name,
        tag_type: tag_type,
        description: description,
        created_by: created_by,
        created_by_name: created_by_name
      }, { onConflict: 'plugin_id,tag_name' });

    res.json({
      success: true,
      message: 'Tag created successfully'
    });
  } catch (error) {
    console.error('Failed to create tag:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/plugins/:pluginId/versions/:versionId/tag/:tagName
 * Remove a tag from a version
 */
router.delete('/:pluginId/versions/:versionId/tag/:tagName', async (req, res) => {
  try {
    const db = await getTenantDb(req);
    const { pluginId, versionId, tagName } = req.params;

    await db.from('plugin_version_tags')
      .delete()
      .eq('version_id', versionId)
      .eq('plugin_id', pluginId)
      .eq('tag_name', tagName);

    res.json({
      success: true,
      message: 'Tag removed successfully'
    });
  } catch (error) {
    console.error('Failed to remove tag:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get current plugin state from all tables
 */
async function getPluginCurrentState(db, pluginId) {
  const { data: registry } = await db.from('plugin_registry')
    .select('*')
    .eq('id', pluginId)
    .maybeSingle();

  if (!registry) return null;

  const { data: hooks } = await db.from('plugin_hooks')
    .select('*')
    .eq('plugin_id', pluginId);

  const { data: events } = await db.from('plugin_events')
    .select('*')
    .eq('plugin_id', pluginId);

  const { data: scripts } = await db.from('plugin_scripts')
    .select('*')
    .eq('plugin_id', pluginId);

  const { data: widgets } = await db.from('plugin_widgets')
    .select('*')
    .eq('plugin_id', pluginId);

  const { data: controllers } = await db.from('plugin_controllers')
    .select('*')
    .eq('plugin_id', pluginId);

  const { data: entities } = await db.from('plugin_entities')
    .select('*')
    .eq('plugin_id', pluginId);

  return {
    registry,
    hooks: hooks || [],
    events: events || [],
    scripts: scripts || [],
    widgets: widgets || [],
    controllers: controllers || [],
    entities: entities || []
  };
}

/**
 * Reconstruct plugin state at a specific version
 * Uses snapshots and patches
 */
async function reconstructPluginState(db, versionId) {
  try {
    // Get version info
    const { data: version } = await db.from('plugin_version_history')
      .select('*')
      .eq('id', versionId)
      .maybeSingle();

    if (!version) {
      console.warn(`⚠ Version ${versionId} not found`);
      return null;
    }

    // If snapshot, return snapshot data
    if (version.version_type === 'snapshot') {
      const { data: snapshot } = await db.from('plugin_version_snapshots')
        .select('*')
        .eq('version_id', versionId)
        .maybeSingle();

      console.log(`  🔍 Snapshot found for version ${versionId}:`, {
        has_snapshot: !!snapshot,
        has_snapshot_data: !!snapshot?.snapshot_data,
        snapshot_data_type: typeof snapshot?.snapshot_data,
        snapshot_data_keys: snapshot?.snapshot_data ? Object.keys(snapshot.snapshot_data) : []
      });

      return snapshot?.snapshot_data;
    }

    // Find nearest snapshot by walking backwards
    let currentVersionId = version.parent_version_id;
    let snapshotData = null;
    const patchChain = [];

    while (currentVersionId && !snapshotData) {
      const { data: parentVersion } = await db.from('plugin_version_history')
        .select('*')
        .eq('id', currentVersionId)
        .maybeSingle();

      if (!parentVersion) break;

      if (parentVersion.version_type === 'snapshot') {
        const { data: snapshot } = await db.from('plugin_version_snapshots')
          .select('*')
          .eq('version_id', parentVersion.id)
          .maybeSingle();
        snapshotData = snapshot?.snapshot_data;
      } else {
        // Add patches to chain (will apply in reverse order)
        const { data: patches } = await db.from('plugin_version_patches')
          .select('*')
          .eq('version_id', parentVersion.id);
        if (patches) patchChain.unshift(...patches);
      }

      currentVersionId = parentVersion.parent_version_id;
    }

    // Apply patches to snapshot
    let state = snapshotData || {};

    for (const patch of patchChain) {
      if (patch.patch_operations) {
        const document = state[patch.component_type] || [];
        const result = jsonpatch.applyPatch(document, patch.patch_operations, false, false);
        state[patch.component_type] = result.newDocument;
      }
    }

    // Apply final version patches
    const { data: finalPatches } = await db.from('plugin_version_patches')
      .select('*')
      .eq('version_id', versionId);

    for (const patch of finalPatches || []) {
      if (patch.patch_operations) {
        const document = state[patch.component_type] || [];
        const result = jsonpatch.applyPatch(document, patch.patch_operations, false, false);
        state[patch.component_type] = result.newDocument;
      }
    }

    return state;
  } catch (error) {
    console.error('❌ Error reconstructing plugin state:', error);
    console.error('   Version ID:', versionId);
    return null;
  }
}

/**
 * Calculate RFC 6902 JSON Patches between two states
 */
function calculatePatches(oldState, newState) {
  const patches = [];
  const componentTypes = ['registry', 'hooks', 'events', 'scripts', 'widgets', 'controllers', 'entities'];

  // Ensure states are valid objects
  if (!oldState || !newState) {
    console.warn('⚠ calculatePatches: Invalid state provided', {
      hasOldState: !!oldState,
      hasNewState: !!newState
    });
    return patches;
  }

  console.log('🔍 Calculating patches between states:', {
    oldState_keys: Object.keys(oldState),
    newState_keys: Object.keys(newState),
    oldState_registry_type: typeof oldState.registry,
    newState_registry_type: typeof newState.registry
  });

  for (const type of componentTypes) {
    const oldData = oldState[type] || (type === 'registry' ? null : []);
    const newData = newState[type] || (type === 'registry' ? null : []);

    console.log(`  📁 Comparing ${type}:`, {
      old_type: typeof oldData,
      new_type: typeof newData,
      old_length: Array.isArray(oldData) ? oldData.length : 'not array',
      new_length: Array.isArray(newData) ? newData.length : 'not array'
    });

    const diff = jsonpatch.compare(oldData, newData);

    console.log(`    Diff operations: ${diff.length}`);

    if (diff.length > 0) {
      patches.push({
        component_type: type,
        patch_operations: diff,
        operations_count: diff.length
      });
    }
  }

  console.log(`✅ Total patches created: ${patches.length}`);

  return patches;
}

/**
 * Store patches in database
 */
async function storePatches(db, versionId, pluginId, patches) {
  for (const patch of patches) {
    await db.from('plugin_version_patches')
      .insert({
        version_id: versionId,
        plugin_id: pluginId,
        component_type: patch.component_type,
        patch_operations: patch.patch_operations,
        operations_count: patch.operations_count
      });
  }
}

/**
 * Create snapshot in database
 */
async function createSnapshot(db, versionId, pluginId, state) {
  try {
    // Safely extract manifest and registry data
    const registryData = state?.registry || null;
    const manifestData = registryData?.manifest || null;

    await db.from('plugin_version_snapshots')
      .insert({
        version_id: versionId,
        plugin_id: pluginId,
        snapshot_data: state || {},
        hooks: state?.hooks || [],
        events: state?.events || [],
        scripts: state?.scripts || [],
        widgets: state?.widgets || [],
        controllers: state?.controllers || [],
        entities: state?.entities || [],
        manifest: manifestData,
        registry: registryData
      });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    console.error('State data:', JSON.stringify(state, null, 2));
    throw error;
  }
}

/**
 * Calculate statistics from patches
 * Counts actual lines of code changed, not patch operations
 */
function calculateStats(patches) {
  let files_changed = 0;
  let lines_added = 0;
  let lines_deleted = 0;

  for (const patch of patches) {
    const ops = patch.patch_operations || [];
    if (ops.length > 0) files_changed++;

    for (const op of ops) {
      // For code fields, count actual lines
      if (op.path && (
        op.path.includes('handler_function') ||
        op.path.includes('listener_function') ||
        op.path.includes('file_content') ||
        op.path.includes('component_code') ||
        op.path.includes('handler_code')
      )) {
        if (op.op === 'add' && op.value) {
          const lines = String(op.value).split('\n').length;
          lines_added += lines;
        } else if (op.op === 'remove' && op.value) {
          const lines = String(op.value).split('\n').length;
          lines_deleted += lines;
        } else if (op.op === 'replace') {
          // For replace, count both old and new
          const newLines = String(op.value || '').split('\n').length;
          const oldLines = 1; // We don't have old value, estimate 1 line
          lines_added += newLines;
          lines_deleted += oldLines;
        }
      } else {
        // For non-code fields, count as 1 line change
        if (op.op === 'add') lines_added++;
        if (op.op === 'remove') lines_deleted++;
        if (op.op === 'replace') {
          lines_deleted++;
          lines_added++;
        }
      }
    }
  }

  return { files_changed, lines_added, lines_deleted };
}

/**
 * Calculate detailed diff between two states
 */
function calculateDetailedDiff(fromState, toState) {
  const patches = calculatePatches(fromState, toState);
  const stats = calculateStats(patches);

  return {
    ...stats,
    components_added: 0, // TODO: Count new components
    components_modified: patches.length,
    components_deleted: 0, // TODO: Count deleted components
    summary: patches
  };
}

/**
 * Apply plugin state to database
 */
async function applyPluginState(db, pluginId, state) {
  // TODO: Implement applying state to all plugin tables
  // This is a complex operation that needs transaction support
  console.warn('applyPluginState not fully implemented yet');
}

/**
 * Increment semantic version
 */
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  if (type === 'major') {
    parts[0]++;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === 'minor') {
    parts[1]++;
    parts[2] = 0;
  } else {
    parts[2]++;
  }
  return parts.join('.');
}

module.exports = router;
