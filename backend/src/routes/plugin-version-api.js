// backend/src/routes/plugin-version-api.js
const express = require('express');
const router = express.Router();
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const jsonpatch = require('fast-json-patch');

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
    const { pluginId } = req.params;
    const { page = 1, limit = 20, filter = 'all' } = req.query;
    const offset = (page - 1) * limit;

    console.log(`📚 Loading versions for plugin: ${pluginId}`);

    // Build filter query
    let filterClause = '';
    if (filter === 'snapshots') {
      filterClause = `AND version_type = 'snapshot'`;
    } else if (filter === 'patches') {
      filterClause = `AND version_type = 'patch'`;
    } else if (filter === 'published') {
      filterClause = `AND is_published = true`;
    }

    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM plugin_version_history
      WHERE plugin_id = $1 ${filterClause}
    `, {
      bind: [pluginId],
      type: QueryTypes.SELECT
    });

    // Get versions with tags
    const versions = await sequelize.query(`
      SELECT
        vh.id,
        vh.plugin_id,
        vh.version_number,
        vh.version_type,
        vh.parent_version_id,
        vh.commit_message,
        vh.changelog,
        vh.created_by_name,
        vh.is_current,
        vh.is_published,
        vh.snapshot_distance,
        vh.files_changed,
        vh.lines_added,
        vh.lines_deleted,
        vh.created_at,
        vh.published_at,
        COALESCE(
          json_agg(
            json_build_object('name', vt.tag_name, 'type', vt.tag_type)
          ) FILTER (WHERE vt.id IS NOT NULL),
          '[]'::json
        ) as tags
      FROM plugin_version_history vh
      LEFT JOIN plugin_version_tags vt ON vh.id = vt.version_id
      WHERE vh.plugin_id = $1 ${filterClause}
      GROUP BY vh.id
      ORDER BY vh.created_at DESC
      LIMIT $2 OFFSET $3
    `, {
      bind: [pluginId, parseInt(limit), offset],
      type: QueryTypes.SELECT
    });

    console.log(`  ✅ Found ${versions.length} versions (total: ${countResult.total})`);

    res.json({
      success: true,
      versions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.total),
        totalPages: Math.ceil(countResult.total / limit)
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
 * GET /api/plugins/:pluginId/versions/current
 * Get the current active version
 */
router.get('/:pluginId/versions/current', async (req, res) => {
  try {
    const { pluginId } = req.params;

    const [version] = await sequelize.query(`
      SELECT * FROM plugin_versions_with_tags
      WHERE plugin_id = $1 AND is_current = true
      LIMIT 1
    `, {
      bind: [pluginId],
      type: QueryTypes.SELECT
    });

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
    const { pluginId, versionId } = req.params;

    console.log(`📖 Loading version: ${versionId}`);

    // Get version metadata
    const [version] = await sequelize.query(`
      SELECT * FROM plugin_versions_with_tags
      WHERE plugin_id = $1 AND id = $2
      LIMIT 1
    `, {
      bind: [pluginId, versionId],
      type: QueryTypes.SELECT
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }

    // Get patches for this version (if patch type)
    let patches = [];
    if (version.version_type === 'patch') {
      patches = await sequelize.query(`
        SELECT * FROM plugin_version_patches
        WHERE version_id = $1
        ORDER BY component_type, component_name
      `, {
        bind: [versionId],
        type: QueryTypes.SELECT
      });
    }

    // Get snapshot data (if snapshot type)
    let snapshot = null;
    if (version.version_type === 'snapshot') {
      [snapshot] = await sequelize.query(`
        SELECT * FROM plugin_version_snapshots
        WHERE version_id = $1
        LIMIT 1
      `, {
        bind: [versionId],
        type: QueryTypes.SELECT
      });
    }

    res.json({
      success: true,
      version: {
        ...version,
        patches,
        snapshot
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
    const [currentVersion] = await sequelize.query(`
      SELECT * FROM plugin_version_history
      WHERE plugin_id = $1 AND is_current = true
      LIMIT 1
    `, {
      bind: [pluginId],
      type: QueryTypes.SELECT
    });

    // Get current plugin state from database
    const pluginState = await getPluginCurrentState(pluginId);

    if (!pluginState) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }

    // Determine version number (increment patch version)
    const newVersionNumber = incrementVersion(
      currentVersion?.version_number || '1.0.0',
      'patch'
    );

    // Determine if should create snapshot
    const shouldSnapshot = force_snapshot ||
      tag_name ||
      !currentVersion ||
      (currentVersion.snapshot_distance >= 9);

    // Calculate patches if not snapshot
    let patches = [];
    let stats = { files_changed: 0, lines_added: 0, lines_deleted: 0 };

    if (!shouldSnapshot && currentVersion) {
      // Get previous plugin state
      const previousState = await reconstructPluginState(currentVersion.id);

      // Calculate patches
      patches = calculatePatches(previousState, pluginState);
      stats = calculateStats(patches);
    }

    // Create version record
    const [newVersion] = await sequelize.query(`
      INSERT INTO plugin_version_history (
        plugin_id,
        version_number,
        version_type,
        parent_version_id,
        commit_message,
        created_by,
        created_by_name,
        is_current,
        is_published,
        files_changed,
        lines_added,
        lines_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11)
      RETURNING *
    `, {
      bind: [
        pluginId,
        newVersionNumber,
        shouldSnapshot ? 'snapshot' : 'patch',
        currentVersion?.id || null,
        commit_message || 'Auto-save',
        created_by || null,
        created_by_name || 'System',
        !!tag_name,
        stats.files_changed,
        stats.lines_added,
        stats.lines_deleted
      ],
      type: QueryTypes.INSERT
    });

    // Store snapshot or patches
    if (shouldSnapshot) {
      await createSnapshot(newVersion[0].id, pluginId, pluginState);
    } else {
      await storePatches(newVersion[0].id, pluginId, patches);
    }

    // Create tag if provided
    if (tag_name) {
      await sequelize.query(`
        INSERT INTO plugin_version_tags (version_id, plugin_id, tag_name, tag_type, created_by, created_by_name)
        VALUES ($1, $2, $3, 'custom', $4, $5)
      `, {
        bind: [newVersion[0].id, pluginId, tag_name, created_by, created_by_name],
        type: QueryTypes.INSERT
      });
    }

    console.log(`  ✅ Created version ${newVersionNumber} (${shouldSnapshot ? 'snapshot' : 'patch'})`);

    res.json({
      success: true,
      version: newVersion[0],
      type: shouldSnapshot ? 'snapshot' : 'patch',
      patches_count: patches.length
    });
  } catch (error) {
    console.error('Failed to create version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/:pluginId/versions/:versionId/restore
 * Restore plugin to a specific version
 */
router.post('/:pluginId/versions/:versionId/restore', async (req, res) => {
  try {
    const { pluginId, versionId } = req.params;
    const { create_backup = true, created_by, created_by_name } = req.body;

    console.log(`🔄 Restoring plugin ${pluginId} to version ${versionId}`);

    // Create backup of current state if requested
    if (create_backup) {
      console.log('  💾 Creating backup...');
      await router.stack.find(r => r.route?.path === '/:pluginId/versions').route.stack[0].handle(
        { params: { pluginId }, body: {
          commit_message: `Backup before restore to ${versionId}`,
          created_by,
          created_by_name,
          tag_name: 'backup'
        }},
        { json: () => {} }
      );
    }

    // Reconstruct plugin state at target version
    const targetState = await reconstructPluginState(versionId);

    if (!targetState) {
      return res.status(404).json({
        success: false,
        error: 'Could not reconstruct version state'
      });
    }

    // Apply restored state to database
    await applyPluginState(pluginId, targetState);

    // Mark version as current
    await sequelize.query(`
      UPDATE plugin_version_history
      SET is_current = CASE WHEN id = $1 THEN true ELSE false END
      WHERE plugin_id = $2
    `, {
      bind: [versionId, pluginId],
      type: QueryTypes.UPDATE
    });

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
 * GET /api/plugins/:pluginId/versions/compare
 * Compare two versions and return diff
 */
router.get('/:pluginId/versions/compare', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Both "from" and "to" version IDs are required'
      });
    }

    console.log(`🔍 Comparing versions: ${from} -> ${to}`);

    // Check cache first
    const [cached] = await sequelize.query(`
      SELECT * FROM plugin_version_comparisons
      WHERE from_version_id = $1 AND to_version_id = $2
        AND computed_at > NOW() - INTERVAL '1 hour'
      LIMIT 1
    `, {
      bind: [from, to],
      type: QueryTypes.SELECT
    });

    if (cached) {
      console.log('  ✅ Using cached comparison');
      return res.json({
        success: true,
        comparison: cached,
        cached: true
      });
    }

    // Reconstruct both states
    const fromState = await reconstructPluginState(from);
    const toState = await reconstructPluginState(to);

    if (!fromState || !toState) {
      return res.status(404).json({
        success: false,
        error: 'Could not reconstruct version states'
      });
    }

    // Calculate detailed diff
    const diff = calculateDetailedDiff(fromState, toState);

    // Cache the result
    await sequelize.query(`
      INSERT INTO plugin_version_comparisons (
        plugin_id, from_version_id, to_version_id,
        files_changed, lines_added, lines_deleted,
        components_added, components_modified, components_deleted,
        diff_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (from_version_id, to_version_id)
      DO UPDATE SET
        diff_summary = EXCLUDED.diff_summary,
        computed_at = NOW()
    `, {
      bind: [
        pluginId, from, to,
        diff.files_changed, diff.lines_added, diff.lines_deleted,
        diff.components_added, diff.components_modified, diff.components_deleted,
        JSON.stringify(diff.summary)
      ],
      type: QueryTypes.INSERT
    });

    console.log(`  ✅ Comparison complete: ${diff.files_changed} files changed`);

    res.json({
      success: true,
      comparison: diff,
      cached: false
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
 * POST /api/plugins/:pluginId/versions/:versionId/tag
 * Add a tag to a version
 */
router.post('/:pluginId/versions/:versionId/tag', async (req, res) => {
  try {
    const { pluginId, versionId } = req.params;
    const { tag_name, tag_type = 'custom', description, created_by, created_by_name } = req.body;

    if (!tag_name) {
      return res.status(400).json({
        success: false,
        error: 'tag_name is required'
      });
    }

    await sequelize.query(`
      INSERT INTO plugin_version_tags (
        version_id, plugin_id, tag_name, tag_type, description, created_by, created_by_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plugin_id, tag_name)
      DO UPDATE SET
        version_id = EXCLUDED.version_id,
        description = EXCLUDED.description
    `, {
      bind: [versionId, pluginId, tag_name, tag_type, description, created_by, created_by_name],
      type: QueryTypes.INSERT
    });

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
    const { pluginId, versionId, tagName } = req.params;

    await sequelize.query(`
      DELETE FROM plugin_version_tags
      WHERE version_id = $1 AND plugin_id = $2 AND tag_name = $3
    `, {
      bind: [versionId, pluginId, tagName],
      type: QueryTypes.DELETE
    });

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
async function getPluginCurrentState(pluginId) {
  const [registry] = await sequelize.query(
    'SELECT * FROM plugin_registry WHERE id = $1',
    { bind: [pluginId], type: QueryTypes.SELECT }
  );

  if (!registry) return null;

  const hooks = await sequelize.query(
    'SELECT * FROM plugin_hooks WHERE plugin_id = $1',
    { bind: [pluginId], type: QueryTypes.SELECT }
  );

  const events = await sequelize.query(
    'SELECT * FROM plugin_events WHERE plugin_id = $1',
    { bind: [pluginId], type: QueryTypes.SELECT }
  );

  const scripts = await sequelize.query(
    'SELECT * FROM plugin_scripts WHERE plugin_id = $1',
    { bind: [pluginId], type: QueryTypes.SELECT }
  );

  const widgets = await sequelize.query(
    'SELECT * FROM plugin_widgets WHERE plugin_id = $1',
    { bind: [pluginId], type: QueryTypes.SELECT }
  );

  const controllers = await sequelize.query(
    'SELECT * FROM plugin_controllers WHERE plugin_id = $1',
    { bind: [pluginId], type: QueryTypes.SELECT }
  );

  const entities = await sequelize.query(
    'SELECT * FROM plugin_entities WHERE plugin_id = $1',
    { bind: [pluginId], type: QueryTypes.SELECT }
  );

  return {
    registry,
    hooks,
    events,
    scripts,
    widgets,
    controllers,
    entities
  };
}

/**
 * Reconstruct plugin state at a specific version
 * Uses snapshots and patches
 */
async function reconstructPluginState(versionId) {
  // Get version info
  const [version] = await sequelize.query(
    'SELECT * FROM plugin_version_history WHERE id = $1',
    { bind: [versionId], type: QueryTypes.SELECT }
  );

  if (!version) return null;

  // If snapshot, return snapshot data
  if (version.version_type === 'snapshot') {
    const [snapshot] = await sequelize.query(
      'SELECT * FROM plugin_version_snapshots WHERE version_id = $1',
      { bind: [versionId], type: QueryTypes.SELECT }
    );
    return snapshot?.snapshot_data;
  }

  // Find nearest snapshot by walking backwards
  let currentVersionId = version.parent_version_id;
  let snapshotData = null;
  const patchChain = [];

  while (currentVersionId && !snapshotData) {
    const [parentVersion] = await sequelize.query(
      'SELECT * FROM plugin_version_history WHERE id = $1',
      { bind: [currentVersionId], type: QueryTypes.SELECT }
    );

    if (!parentVersion) break;

    if (parentVersion.version_type === 'snapshot') {
      const [snapshot] = await sequelize.query(
        'SELECT * FROM plugin_version_snapshots WHERE version_id = $1',
        { bind: [parentVersion.id], type: QueryTypes.SELECT }
      );
      snapshotData = snapshot?.snapshot_data;
    } else {
      // Add patches to chain (will apply in reverse order)
      const patches = await sequelize.query(
        'SELECT * FROM plugin_version_patches WHERE version_id = $1',
        { bind: [parentVersion.id], type: QueryTypes.SELECT }
      );
      patchChain.unshift(...patches);
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
  const finalPatches = await sequelize.query(
    'SELECT * FROM plugin_version_patches WHERE version_id = $1',
    { bind: [versionId], type: QueryTypes.SELECT }
  );

  for (const patch of finalPatches) {
    if (patch.patch_operations) {
      const document = state[patch.component_type] || [];
      const result = jsonpatch.applyPatch(document, patch.patch_operations, false, false);
      state[patch.component_type] = result.newDocument;
    }
  }

  return state;
}

/**
 * Calculate RFC 6902 JSON Patches between two states
 */
function calculatePatches(oldState, newState) {
  const patches = [];
  const componentTypes = ['registry', 'hooks', 'events', 'scripts', 'widgets', 'controllers', 'entities'];

  for (const type of componentTypes) {
    const oldData = oldState[type] || [];
    const newData = newState[type] || [];

    const diff = jsonpatch.compare(oldData, newData);

    if (diff.length > 0) {
      patches.push({
        component_type: type,
        patch_operations: diff,
        operations_count: diff.length
      });
    }
  }

  return patches;
}

/**
 * Store patches in database
 */
async function storePatches(versionId, pluginId, patches) {
  for (const patch of patches) {
    await sequelize.query(`
      INSERT INTO plugin_version_patches (
        version_id, plugin_id, component_type, patch_operations, operations_count
      ) VALUES ($1, $2, $3, $4, $5)
    `, {
      bind: [
        versionId,
        pluginId,
        patch.component_type,
        JSON.stringify(patch.patch_operations),
        patch.operations_count
      ],
      type: QueryTypes.INSERT
    });
  }
}

/**
 * Create snapshot in database
 */
async function createSnapshot(versionId, pluginId, state) {
  await sequelize.query(`
    INSERT INTO plugin_version_snapshots (
      version_id, plugin_id, snapshot_data, hooks, events, scripts, widgets, controllers, entities, manifest, registry
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, {
    bind: [
      versionId,
      pluginId,
      JSON.stringify(state),
      JSON.stringify(state.hooks),
      JSON.stringify(state.events),
      JSON.stringify(state.scripts),
      JSON.stringify(state.widgets),
      JSON.stringify(state.controllers),
      JSON.stringify(state.entities),
      JSON.stringify(state.registry?.manifest),
      JSON.stringify(state.registry)
    ],
    type: QueryTypes.INSERT
  });
}

/**
 * Calculate statistics from patches
 */
function calculateStats(patches) {
  let files_changed = patches.length;
  let lines_added = 0;
  let lines_deleted = 0;

  for (const patch of patches) {
    for (const op of patch.patch_operations || []) {
      if (op.op === 'add') lines_added++;
      if (op.op === 'remove') lines_deleted++;
      if (op.op === 'replace') {
        lines_deleted++;
        lines_added++;
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
async function applyPluginState(pluginId, state) {
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
