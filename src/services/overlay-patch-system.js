/**
 * Overlay Patch System
 * Non-destructive code overlay system that applies patches without modifying core code
 */

import { diffLines, applyPatch, createPatch, parsePatch } from 'diff';

class OverlayPatchSystem {
  constructor() {
    this.overlays = new Map(); // filePath -> { coreCode, patches: [], appliedCode }
    this.snapshots = new Map(); // snapshotId -> overlayState
  }

  /**
   * Initialize overlay for a file
   */
  initializeOverlay(filePath, coreCode) {
    if (!this.overlays.has(filePath)) {
      this.overlays.set(filePath, {
        filePath,
        coreCode: coreCode.trim(),
        patches: [],
        appliedCode: coreCode.trim(),
        lastModified: Date.now(),
        isDirty: false
      });
    }
    return this.overlays.get(filePath);
  }

  /**
   * Add a new patch without modifying core code
   */
  addPatch(filePath, newCode, metadata = {}) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) {
      throw new Error(`Overlay not initialized for ${filePath}`);
    }

    // Create patch from current applied code to new code
    const patch = createPatch(
      filePath,
      overlay.appliedCode,
      newCode.trim(),
      'current',
      'modified'
    );

    // Only add patch if there are actual changes
    if (patch && !patch.includes('No newline at end of file') || newCode.trim() !== overlay.appliedCode.trim()) {
      const patchData = {
        id: `patch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        patch: patch,
        rawDiff: diffLines(overlay.appliedCode, newCode.trim()),
        metadata: {
          changeType: 'edit',
          changeSummary: 'Code modification',
          ...metadata
        },
        previewCode: overlay.appliedCode,
        resultCode: newCode.trim()
      };

      overlay.patches.push(patchData);
      overlay.appliedCode = newCode.trim();
      overlay.lastModified = Date.now();
      overlay.isDirty = true;

      console.log(`📝 Added patch ${patchData.id} to ${filePath}`);
      return patchData;
    }

    return null;
  }

  /**
   * Get the current applied code (core + all patches)
   */
  getAppliedCode(filePath) {
    const overlay = this.overlays.get(filePath);
    return overlay ? overlay.appliedCode : null;
  }

  /**
   * Get the core code (immutable)
   */
  getCoreCode(filePath) {
    const overlay = this.overlays.get(filePath);
    return overlay ? overlay.coreCode : null;
  }

  /**
   * Get all patches for a file
   */
  getPatches(filePath) {
    const overlay = this.overlays.get(filePath);
    return overlay ? overlay.patches : [];
  }

  /**
   * Remove a specific patch and reapply remaining patches
   */
  removePatch(filePath, patchId) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) return false;

    const patchIndex = overlay.patches.findIndex(p => p.id === patchId);
    if (patchIndex === -1) return false;

    // Remove the patch
    overlay.patches.splice(patchIndex, 1);

    // Reapply all remaining patches from core code
    this.reapplyAllPatches(filePath);
    
    console.log(`🗑️ Removed patch ${patchId} from ${filePath}`);
    return true;
  }

  /**
   * Revert to a specific patch (remove all patches after it)
   */
  revertToPatch(filePath, patchId) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) return false;

    const patchIndex = overlay.patches.findIndex(p => p.id === patchId);
    if (patchIndex === -1) return false;

    // Remove all patches after the target patch
    overlay.patches = overlay.patches.slice(0, patchIndex + 1);

    // Reapply remaining patches
    this.reapplyAllPatches(filePath);
    
    console.log(`⏪ Reverted ${filePath} to patch ${patchId}`);
    return true;
  }

  /**
   * Reapply all patches from core code
   */
  reapplyAllPatches(filePath) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) return;

    let currentCode = overlay.coreCode;

    // Apply each patch in sequence
    for (const patchData of overlay.patches) {
      try {
        if (patchData.patch && patchData.patch.trim()) {
          const parsedPatch = parsePatch(patchData.patch);
          if (parsedPatch && parsedPatch.length > 0) {
            const result = applyPatch(currentCode, parsedPatch[0]);
            if (result !== false) {
              currentCode = result;
            } else {
              console.warn(`⚠️ Failed to apply patch ${patchData.id}, using result code`);
              currentCode = patchData.resultCode;
            }
          }
        } else {
          // Fallback to result code if patch is empty
          currentCode = patchData.resultCode;
        }
      } catch (error) {
        console.warn(`⚠️ Error applying patch ${patchData.id}:`, error);
        currentCode = patchData.resultCode;
      }
    }

    overlay.appliedCode = currentCode;
    overlay.lastModified = Date.now();
  }

  /**
   * Create a snapshot of current overlay state
   */
  createSnapshot(filePath, name = null) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) return null;

    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const snapshot = {
      id: snapshotId,
      name: name || `Snapshot ${new Date().toLocaleTimeString()}`,
      timestamp: Date.now(),
      filePath,
      coreCode: overlay.coreCode,
      patches: JSON.parse(JSON.stringify(overlay.patches)), // Deep copy
      appliedCode: overlay.appliedCode,
      patchCount: overlay.patches.length
    };

    this.snapshots.set(snapshotId, snapshot);
    console.log(`📸 Created snapshot ${snapshotId} for ${filePath}`);
    return snapshot;
  }

  /**
   * Restore from a snapshot
   */
  restoreSnapshot(snapshotId) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return false;

    const overlay = {
      filePath: snapshot.filePath,
      coreCode: snapshot.coreCode,
      patches: JSON.parse(JSON.stringify(snapshot.patches)), // Deep copy
      appliedCode: snapshot.appliedCode,
      lastModified: Date.now(),
      isDirty: snapshot.patches.length > 0
    };

    this.overlays.set(snapshot.filePath, overlay);
    console.log(`📥 Restored snapshot ${snapshotId} for ${snapshot.filePath}`);
    return true;
  }

  /**
   * Publish (flatten) all patches into a final overlay
   * This creates a single patch from core to final state
   */
  publishOverlay(filePath, metadata = {}) {
    const overlay = this.overlays.get(filePath);
    if (!overlay || overlay.patches.length === 0) {
      return null;
    }

    // Create final patch from core code to applied code
    const finalPatch = createPatch(
      filePath,
      overlay.coreCode,
      overlay.appliedCode,
      'core',
      'published'
    );

    const publishedOverlay = {
      id: `published_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filePath,
      coreCode: overlay.coreCode,
      publishedCode: overlay.appliedCode,
      finalPatch: finalPatch,
      originalPatches: JSON.parse(JSON.stringify(overlay.patches)), // Keep for rollback
      publishedAt: Date.now(),
      metadata: {
        patchCount: overlay.patches.length,
        totalChanges: overlay.appliedCode !== overlay.coreCode,
        ...metadata
      }
    };

    // Clear patches since we've published
    overlay.patches = [];
    overlay.isDirty = false;

    console.log(`🚀 Published overlay ${publishedOverlay.id} for ${filePath}`);
    return publishedOverlay;
  }

  /**
   * Rollback published overlay to core code
   */
  rollbackToCore(filePath) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) return false;

    overlay.patches = [];
    overlay.appliedCode = overlay.coreCode;
    overlay.lastModified = Date.now();
    overlay.isDirty = false;

    console.log(`↩️ Rolled back ${filePath} to core code`);
    return true;
  }

  /**
   * Get overlay statistics
   */
  getOverlayStats(filePath) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) return null;

    return {
      filePath,
      patchCount: overlay.patches.length,
      isDirty: overlay.isDirty,
      hasChanges: overlay.appliedCode !== overlay.coreCode,
      coreSize: overlay.coreCode.length,
      appliedSize: overlay.appliedCode.length,
      sizeDiff: overlay.appliedCode.length - overlay.coreCode.length,
      lastModified: overlay.lastModified
    };
  }

  /**
   * Get visual diff for overlay
   */
  getVisualDiff(filePath) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) return null;

    return {
      filePath,
      coreCode: overlay.coreCode,
      appliedCode: overlay.appliedCode,
      unifiedDiff: createPatch(filePath, overlay.coreCode, overlay.appliedCode, 'core', 'current'),
      lineDiff: diffLines(overlay.coreCode, overlay.appliedCode),
      patches: overlay.patches.map(p => ({
        id: p.id,
        timestamp: p.timestamp,
        metadata: p.metadata,
        diff: p.rawDiff
      }))
    };
  }

  /**
   * Clear all overlays
   */
  clearAll() {
    this.overlays.clear();
    this.snapshots.clear();
    console.log('🧹 Cleared all overlays and snapshots');
  }

  /**
   * Export overlay data
   */
  exportOverlay(filePath) {
    const overlay = this.overlays.get(filePath);
    if (!overlay) return null;

    return {
      version: '1.0',
      exported: Date.now(),
      overlay: JSON.parse(JSON.stringify(overlay))
    };
  }

  /**
   * Import overlay data
   */
  importOverlay(exportedData) {
    if (exportedData.version !== '1.0') {
      throw new Error('Unsupported overlay export version');
    }

    const overlay = exportedData.overlay;
    this.overlays.set(overlay.filePath, overlay);
    console.log(`📥 Imported overlay for ${overlay.filePath}`);
    return overlay;
  }
}

// Create singleton instance
const overlayPatchSystem = new OverlayPatchSystem();

export default overlayPatchSystem;
export { OverlayPatchSystem };