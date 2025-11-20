/**
 * Extension Service
 * Backend service for managing extensions and releases
 * Replaces the old patch system
 */

const crypto = require('crypto');
const ConnectionManager = require('./database/ConnectionManager');
const { QueryTypes } = require('sequelize');

class ExtensionService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Create a new release
   */
  async createRelease(releaseData) {
    try {
      const {
        name,
        version,
        description = '',
        changes = [],
        storeId,
        createdBy,
        type = 'minor'
      } = releaseData;

      // Validate required fields
      if (!name || !storeId || !createdBy) {
        throw new Error('Missing required fields: name, storeId, createdBy');
      }

      const connection = await ConnectionManager.getStoreConnection(storeId);

      // Check if version already exists
      if (version) {
        const existingRelease = await connection.query(`
          SELECT id FROM extension_releases
          WHERE store_id = :storeId AND version = :version
        `, {
          replacements: { storeId, version },
          type: QueryTypes.SELECT
        });

        if (existingRelease.length > 0) {
          throw new Error(`Version ${version} already exists for this store`);
        }
      }

      // Generate version if not provided
      const finalVersion = version || await this.generateNextVersion(storeId, type);

      // Create release record
      const [result] = await connection.query(`
        INSERT INTO extension_releases (
          name, version, description, type, changes, store_id, created_by, status
        ) VALUES (
          :name, :version, :description, :type, :changes, :storeId, :createdBy, 'draft'
        ) RETURNING id, created_at
      `, {
        replacements: {
          name,
          version: finalVersion,
          description,
          type,
          changes: JSON.stringify(changes),
          storeId,
          createdBy
        },
        type: QueryTypes.INSERT
      });

      console.log(`✅ Created release: ${name} (${finalVersion})`);

      return {
        success: true,
        releaseId: result[0].id,
        version: finalVersion,
        name,
        createdAt: result[0].created_at
      };

    } catch (error) {
      console.error('❌ Error creating release:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Publish a release
   */
  async publishRelease(releaseId, storeId, publishData = {}) {
    try {
      const { publishedBy, publishNotes = '' } = publishData;
      const connection = await ConnectionManager.getStoreConnection(storeId);

      // Check if release exists and is in draft status
      const [release] = await connection.query(`
        SELECT * FROM extension_releases
        WHERE id = :releaseId AND status = 'draft'
      `, {
        replacements: { releaseId },
        type: QueryTypes.SELECT
      });

      if (!release) {
        throw new Error('Release not found or not in draft status');
      }

      // Get current published version for rollback reference
      const [currentVersion] = await connection.query(`
        SELECT version FROM extension_releases
        WHERE store_id = :storeId AND status = 'published'
        ORDER BY published_at DESC LIMIT 1
      `, {
        replacements: { storeId: release[0].store_id },
        type: QueryTypes.SELECT
      });

      // Update release status
      await connection.query(`
        UPDATE extension_releases
        SET
          status = 'published',
          published_at = CURRENT_TIMESTAMP,
          published_by = :publishedBy,
          publish_notes = :publishNotes,
          rollback_version = :rollbackVersion
        WHERE id = :releaseId
      `, {
        replacements: {
          releaseId,
          publishedBy,
          publishNotes,
          rollbackVersion: currentVersion?.[0]?.version || null
        },
        type: QueryTypes.UPDATE
      });

      // Create version history entry
      await this.createVersionHistory({
        storeId: release[0].store_id,
        releaseId,
        version: release[0].version,
        action: 'published',
        performedBy: publishedBy,
        metadata: { publishNotes }
      });

      console.log(`🚀 Published release: ${release[0].name} (${release[0].version})`);

      return {
        success: true,
        releaseId,
        version: release[0].version,
        publishedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error publishing release:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(storeId, targetVersion, rollbackData = {}) {
    try {
      const { performedBy, reason = '' } = rollbackData;

      // Find target version
      const [targetRelease] = await sequelize.query(`
        SELECT * FROM extension_releases 
        WHERE store_id = :storeId AND version = :targetVersion AND status = 'published'
      `, {
        replacements: { storeId, targetVersion },
        type: sequelize.QueryTypes.SELECT
      });

      if (!targetRelease) {
        throw new Error(`Target version ${targetVersion} not found or not published`);
      }

      // Get current version
      const [currentRelease] = await sequelize.query(`
        SELECT * FROM extension_releases 
        WHERE store_id = :storeId AND status = 'published' 
        ORDER BY published_at DESC LIMIT 1
      `, {
        replacements: { storeId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!currentRelease || currentRelease[0].version === targetVersion) {
        throw new Error('Already at target version or no current version found');
      }

      // Mark current version as rolled back
      await sequelize.query(`
        UPDATE extension_releases 
        SET 
          status = 'rolled_back',
          rollback_performed_at = CURRENT_TIMESTAMP,
          rollback_reason = :reason,
          rollback_performed_by = :performedBy
        WHERE id = :currentReleaseId
      `, {
        replacements: {
          currentReleaseId: currentRelease[0].id,
          reason,
          performedBy
        },
        type: sequelize.QueryTypes.UPDATE
      });

      // Mark target version as current
      await sequelize.query(`
        UPDATE extension_releases 
        SET status = 'published' 
        WHERE id = :targetReleaseId
      `, {
        replacements: { targetReleaseId: targetRelease[0].id },
        type: sequelize.QueryTypes.UPDATE
      });

      // Create version history entry
      await this.createVersionHistory({
        storeId,
        releaseId: currentRelease[0].id,
        version: currentRelease[0].version,
        action: 'rolled_back',
        performedBy,
        metadata: { 
          reason, 
          targetVersion,
          rollbackFromVersion: currentRelease[0].version
        }
      });

      console.log(`↩️ Rolled back from ${currentRelease[0].version} to ${targetVersion}`);

      return {
        success: true,
        fromVersion: currentRelease[0].version,
        toVersion: targetVersion,
        performedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error performing rollback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get version history
   */
  async getVersionHistory(storeId, options = {}) {
    try {
      const { limit = 20, includeRolledBack = true } = options;

      let query = `
        SELECT 
          r.*,
          u.email as created_by_email,
          pub_u.email as published_by_email,
          rb_u.email as rollback_performed_by_email
        FROM extension_releases r
        LEFT JOIN users u ON r.created_by = u.id
        LEFT JOIN users pub_u ON r.published_by = pub_u.id
        LEFT JOIN users rb_u ON r.rollback_performed_by = rb_u.id
        WHERE r.store_id = :storeId
      `;

      const replacements = { storeId };

      if (!includeRolledBack) {
        query += ` AND r.status != 'rolled_back'`;
      }

      query += ` ORDER BY r.created_at DESC`;

      if (limit > 0) {
        query += ` LIMIT :limit`;
        replacements.limit = limit;
      }

      const versions = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      return {
        success: true,
        versions: versions.map(v => ({
          ...v,
          changes: typeof v.changes === 'string' ? JSON.parse(v.changes) : v.changes
        }))
      };

    } catch (error) {
      console.error('❌ Error getting version history:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current published version
   */
  async getCurrentVersion(storeId) {
    try {
      const [currentVersion] = await sequelize.query(`
        SELECT * FROM extension_releases 
        WHERE store_id = :storeId AND status = 'published' 
        ORDER BY published_at DESC LIMIT 1
      `, {
        replacements: { storeId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!currentVersion) {
        return { success: true, version: null };
      }

      return {
        success: true,
        version: {
          ...currentVersion[0],
          changes: typeof currentVersion[0].changes === 'string' ? 
            JSON.parse(currentVersion[0].changes) : currentVersion[0].changes
        }
      };

    } catch (error) {
      console.error('❌ Error getting current version:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate next version number
   */
  async generateNextVersion(storeId, type = 'minor') {
    try {
      const [latestVersion] = await sequelize.query(`
        SELECT version FROM extension_releases 
        WHERE store_id = :storeId 
        ORDER BY created_at DESC LIMIT 1
      `, {
        replacements: { storeId },
        type: sequelize.QueryTypes.SELECT
      });

      const currentVersion = latestVersion?.[0]?.version || '0.0.0';
      const [major, minor, patch] = currentVersion.split('.').map(Number);

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

    } catch (error) {
      console.error('❌ Error generating version:', error);
      return '1.0.0'; // Fallback
    }
  }

  /**
   * Create version history entry
   */
  async createVersionHistory(historyData) {
    try {
      const {
        storeId,
        releaseId,
        version,
        action,
        performedBy,
        metadata = {}
      } = historyData;

      await sequelize.query(`
        INSERT INTO version_history (
          store_id, release_id, version, action, performed_by, metadata
        ) VALUES (
          :storeId, :releaseId, :version, :action, :performedBy, :metadata
        )
      `, {
        replacements: {
          storeId,
          releaseId,
          version,
          action,
          performedBy,
          metadata: JSON.stringify(metadata)
        },
        type: sequelize.QueryTypes.INSERT
      });

    } catch (error) {
      console.error('❌ Error creating version history:', error);
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(storeId, version1, version2) {
    try {
      const [v1, v2] = await Promise.all([
        sequelize.query(`
          SELECT * FROM extension_releases 
          WHERE store_id = :storeId AND version = :version
        `, {
          replacements: { storeId, version: version1 },
          type: sequelize.QueryTypes.SELECT
        }),
        sequelize.query(`
          SELECT * FROM extension_releases 
          WHERE store_id = :storeId AND version = :version
        `, {
          replacements: { storeId, version: version2 },
          type: sequelize.QueryTypes.SELECT
        })
      ]);

      if (!v1[0] || !v2[0]) {
        throw new Error('One or both versions not found');
      }

      const changes1 = typeof v1[0].changes === 'string' ? JSON.parse(v1[0].changes) : v1[0].changes;
      const changes2 = typeof v2[0].changes === 'string' ? JSON.parse(v2[0].changes) : v2[0].changes;

      const comparison = {
        version1: { ...v1[0], changes: changes1 },
        version2: { ...v2[0], changes: changes2 },
        timeDiff: new Date(v2[0].created_at) - new Date(v1[0].created_at),
        changesDiff: this.calculateChangesDiff(changes1, changes2),
        compatibility: this.checkVersionCompatibility(version1, version2)
      };

      return { success: true, comparison };

    } catch (error) {
      console.error('❌ Error comparing versions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate differences between change sets
   */
  calculateChangesDiff(changes1, changes2) {
    const files1 = new Set(changes1.map(c => c.filePath || c.fileName));
    const files2 = new Set(changes2.map(c => c.filePath || c.fileName));
    
    const addedFiles = [...files2].filter(f => !files1.has(f));
    const removedFiles = [...files1].filter(f => !files2.has(f));
    const commonFiles = [...files1].filter(f => files2.has(f));

    return {
      filesAdded: addedFiles.length,
      filesRemoved: removedFiles.length,
      filesModified: commonFiles.length,
      totalChanges: changes2.length - changes1.length,
      addedFiles,
      removedFiles,
      commonFiles
    };
  }

  /**
   * Check version compatibility
   */
  checkVersionCompatibility(version1, version2) {
    const [major1, minor1] = version1.split('.').map(Number);
    const [major2, minor2] = version2.split('.').map(Number);

    return {
      backward: major1 === major2,
      forward: major1 <= major2 && (major1 < major2 || minor1 <= minor2),
      level: major1 !== major2 ? 'major' : minor1 !== minor2 ? 'minor' : 'patch',
      breaking: major1 !== major2
    };
  }

  /**
   * Get release statistics
   */
  async getStats(storeId) {
    try {
      const [stats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_releases,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_releases,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published_releases,
          COUNT(CASE WHEN status = 'rolled_back' THEN 1 END) as rolled_back_releases
        FROM extension_releases 
        WHERE store_id = :storeId
      `, {
        replacements: { storeId },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        success: true,
        stats: stats[0] || {
          total_releases: 0,
          draft_releases: 0,
          published_releases: 0,
          rolled_back_releases: 0
        }
      };

    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = new ExtensionService();