/**
 * Version System
 * Manages releases and version history for the extension system
 */

import hookSystem from './HookSystem.js';
import eventSystem from './EventSystem.js';

class VersionSystem {
  constructor() {
    this.versions = new Map();
    this.releases = new Map();
    this.currentVersion = null;
    this.debug = process.env.NODE_ENV === 'development';
  }

  /**
   * Create a new release from current state
   */
  async createRelease(releaseData) {
    try {
      const {
        name,
        description = '',
        version,
        changes = [],
        storeId,
        createdBy,
        type = 'minor' // major, minor, patch, hotfix
      } = releaseData;

      // Validate release data
      this.validateReleaseData(releaseData);

      // Apply pre-create hooks
      const processedReleaseData = hookSystem.apply('version.beforeCreateRelease', releaseData, {
        currentVersion: this.currentVersion,
        existingReleases: Array.from(this.releases.values())
      });

      // Generate version number if not provided
      const versionNumber = version || this.generateVersionNumber(type);

      const release = {
        id: `release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: processedReleaseData.name,
        version: versionNumber,
        description: processedReleaseData.description,
        type: processedReleaseData.type,
        changes: processedReleaseData.changes,
        storeId: processedReleaseData.storeId,
        createdBy: processedReleaseData.createdBy,
        createdAt: new Date(),
        status: 'draft', // draft, published, archived, rolled_back
        metadata: {
          totalFiles: this.countUniqueFiles(processedReleaseData.changes),
          totalChanges: processedReleaseData.changes.length,
          compatibility: this.checkCompatibility(processedReleaseData.changes)
        },
        rollbackPoint: this.currentVersion ? { ...this.currentVersion } : null
      };

      // Store the release
      this.releases.set(release.id, release);

      // Apply post-create hooks
      hookSystem.do('version.afterCreateRelease', { release });

      // Emit event
      eventSystem.emit('version.releaseCreated', { release });
      return release;

    } catch (error) {
      console.error('❌ Failed to create release:', error);
      throw error;
    }
  }

  /**
   * Publish a release
   */
  async publishRelease(releaseId, publishOptions = {}) {
    try {
      const release = this.releases.get(releaseId);
      if (!release) {
        throw new Error(`Release ${releaseId} not found`);
      }

      if (release.status !== 'draft') {
        throw new Error(`Cannot publish release in status: ${release.status}`);
      }

      // Apply pre-publish hooks
      const shouldPublish = hookSystem.apply('version.beforePublishRelease', true, {
        release,
        publishOptions
      });

      if (!shouldPublish) {
        throw new Error('Release publication cancelled by hook');
      }

      // Backup current version for rollback
      const previousVersion = this.currentVersion;

      // Publish the release
      release.status = 'published';
      release.publishedAt = new Date();
      release.publishedBy = publishOptions.publishedBy;
      release.previousVersion = previousVersion;

      // Set as current version
      this.currentVersion = release;

      // Store in version history
      this.versions.set(release.version, release);

      // Apply post-publish hooks
      hookSystem.do('version.afterPublishRelease', {
        release,
        previousVersion
      });

      // Emit events
      eventSystem.emit('version.releasePublished', {
        release,
        previousVersion
      });

      return release;

    } catch (error) {
      console.error('❌ Failed to publish release:', error);
      throw error;
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(targetVersion, rollbackReason = '') {
    try {
      // Find the target version
      const targetRelease = this.versions.get(targetVersion) || 
        Array.from(this.versions.values()).find(v => v.id === targetVersion);

      if (!targetRelease) {
        throw new Error(`Version ${targetVersion} not found`);
      }

      // Apply pre-rollback hooks
      const shouldRollback = hookSystem.apply('version.beforeRollback', true, {
        currentVersion: this.currentVersion,
        targetVersion: targetRelease,
        rollbackReason
      });

      if (!shouldRollback) {
        throw new Error('Rollback cancelled by hook');
      }

      // Create rollback record
      const rollbackRecord = {
        id: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fromVersion: this.currentVersion,
        toVersion: targetRelease,
        reason: rollbackReason,
        performedAt: new Date(),
        type: 'manual_rollback'
      };

      // Update current version
      const previousVersion = this.currentVersion;
      this.currentVersion = targetRelease;

      // Mark current version as rolled back if it exists
      if (previousVersion) {
        previousVersion.status = 'rolled_back';
        previousVersion.rollbackRecord = rollbackRecord;
      }

      // Apply post-rollback hooks
      hookSystem.do('version.afterRollback', {
        rollbackRecord,
        previousVersion,
        currentVersion: targetRelease
      });

      // Emit event
      eventSystem.emit('version.rollbackPerformed', {
        rollbackRecord,
        previousVersion,
        currentVersion: targetRelease
      });

      if (this.debug) {
        console.log(`↩️ Rolled back from ${previousVersion?.version} to ${targetRelease.version}`);
      }

      return rollbackRecord;

    } catch (error) {
      console.error('❌ Failed to rollback version:', error);
      throw error;
    }
  }

  /**
   * Get version history
   */
  getVersionHistory(options = {}) {
    const { limit = 10, includeRolledBack = false } = options;
    
    let versions = Array.from(this.versions.values());
    
    if (!includeRolledBack) {
      versions = versions.filter(v => v.status !== 'rolled_back');
    }
    
    // Sort by creation date, newest first
    versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (limit > 0) {
      versions = versions.slice(0, limit);
    }
    
    return versions;
  }

  /**
   * Compare two versions
   */
  compareVersions(version1, version2) {
    const v1 = this.versions.get(version1) || this.releases.get(version1);
    const v2 = this.versions.get(version2) || this.releases.get(version2);
    
    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }
    
    const comparison = {
      version1: v1,
      version2: v2,
      changes: this.getChangesBetweenVersions(v1, v2),
      compatibility: this.checkVersionCompatibility(v1, v2),
      timeDiff: new Date(v2.createdAt) - new Date(v1.createdAt),
      summary: this.generateComparisonSummary(v1, v2)
    };
    
    // Apply comparison hooks
    return hookSystem.apply('version.compareVersions', comparison, {
      version1: v1,
      version2: v2
    });
  }

  /**
   * Validate release data
   */
  validateReleaseData(releaseData) {
    if (!releaseData.name) {
      throw new Error('Release name is required');
    }
    
    if (!releaseData.storeId) {
      throw new Error('Store ID is required');
    }
    
    if (!releaseData.createdBy) {
      throw new Error('Created by is required');
    }
    
    if (!Array.isArray(releaseData.changes)) {
      throw new Error('Changes must be an array');
    }
    
    // Apply custom validation hooks
    const customValidation = hookSystem.apply('version.validateReleaseData', true, {
      releaseData
    });
    
    if (!customValidation) {
      throw new Error('Custom validation failed');
    }
  }

  /**
   * Generate semantic version number
   */
  generateVersionNumber(type = 'minor') {
    const currentVer = this.currentVersion?.version || '0.0.0';
    const [major, minor, patch] = currentVer.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      case 'hotfix':
        return `${major}.${minor}.${patch + 1}-hotfix`;
      default:
        return `${major}.${minor + 1}.0`;
    }
  }

  /**
   * Count unique files in changes
   */
  countUniqueFiles(changes) {
    const files = new Set();
    for (const change of changes) {
      if (change.filePath) files.add(change.filePath);
      if (change.fileName) files.add(change.fileName);
    }
    return files.size;
  }

  /**
   * Check compatibility of changes
   */
  checkCompatibility(changes) {
    let hasBreakingChanges = false;
    let hasDeprecations = false;
    
    for (const change of changes) {
      if (change.breaking === true) {
        hasBreakingChanges = true;
      }
      if (change.deprecated === true) {
        hasDeprecations = true;
      }
    }
    
    return {
      breaking: hasBreakingChanges,
      deprecated: hasDeprecations,
      level: hasBreakingChanges ? 'major' : hasDeprecations ? 'minor' : 'patch'
    };
  }

  /**
   * Get changes between two versions
   */
  getChangesBetweenVersions(v1, v2) {
    const v1Changes = new Set(v1.changes.map(c => c.id || `${c.filePath}_${c.timestamp}`));
    const v2Changes = new Set(v2.changes.map(c => c.id || `${c.filePath}_${c.timestamp}`));
    
    const addedChanges = v2.changes.filter(c => !v1Changes.has(c.id || `${c.filePath}_${c.timestamp}`));
    const removedChanges = v1.changes.filter(c => !v2Changes.has(c.id || `${c.filePath}_${c.timestamp}`));
    
    return {
      added: addedChanges,
      removed: removedChanges,
      total: addedChanges.length + removedChanges.length
    };
  }

  /**
   * Check compatibility between versions
   */
  checkVersionCompatibility(v1, v2) {
    const [major1, minor1] = v1.version.split('.').map(Number);
    const [major2, minor2] = v2.version.split('.').map(Number);
    
    return {
      backward: major1 === major2, // Same major version = backward compatible
      forward: major1 <= major2 && (major1 < major2 || minor1 <= minor2),
      level: major1 !== major2 ? 'major' : minor1 !== minor2 ? 'minor' : 'patch'
    };
  }

  /**
   * Generate comparison summary
   */
  generateComparisonSummary(v1, v2) {
    const changes = this.getChangesBetweenVersions(v1, v2);
    const compatibility = this.checkVersionCompatibility(v1, v2);
    
    return {
      filesChanged: this.countUniqueFiles([...changes.added, ...changes.removed]),
      changesAdded: changes.added.length,
      changesRemoved: changes.removed.length,
      compatibilityLevel: compatibility.level,
      isUpgrade: new Date(v2.createdAt) > new Date(v1.createdAt),
      riskLevel: compatibility.level === 'major' ? 'high' : 
                compatibility.level === 'minor' ? 'medium' : 'low'
    };
  }

  /**
   * Archive old versions
   */
  archiveOldVersions(olderThanDays = 90) {
    const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    let archivedCount = 0;
    
    for (const [versionId, version] of this.versions) {
      if (version.createdAt < cutoffDate && version.status === 'published' && version !== this.currentVersion) {
        version.status = 'archived';
        version.archivedAt = new Date();
        archivedCount++;
      }
    }
    
    return archivedCount;
  }

  /**
   * Get current version
   */
  getCurrentVersion() {
    return this.currentVersion;
  }

  /**
   * Get all releases
   */
  getAllReleases(status = null) {
    let releases = Array.from(this.releases.values());
    
    if (status) {
      releases = releases.filter(r => r.status === status);
    }
    
    return releases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get statistics
   */
  getStats() {
    const releases = Array.from(this.releases.values());
    const versions = Array.from(this.versions.values());
    
    return {
      totalReleases: releases.length,
      totalVersions: versions.length,
      publishedVersions: versions.filter(v => v.status === 'published').length,
      draftReleases: releases.filter(r => r.status === 'draft').length,
      currentVersion: this.currentVersion?.version || 'none',
      oldestVersion: versions.length > 0 ? 
        versions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0].version : 'none',
      newestVersion: versions.length > 0 ? 
        versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].version : 'none'
    };
  }

  /**
   * Clear all versions (for testing)
   */
  clear() {
    this.versions.clear();
    this.releases.clear();
    this.currentVersion = null;
  }
}

// Create singleton instance
const versionSystem = new VersionSystem();

export default versionSystem;
export { VersionSystem };