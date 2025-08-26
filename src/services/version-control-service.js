/**
 * Version Control System with Patch Management
 * Advanced versioning system for code changes with branching, merging, and patch application
 */

import { useState, useEffect } from 'react';
import DiffService from './diff-service.js';
import { astParser, ASTDiffer } from '../utils/ast-utils.js';

// Version entry structure
class Version {
  constructor(id, content, metadata = {}) {
    this.id = id;
    this.content = content;
    this.timestamp = Date.now();
    this.metadata = {
      author: 'system',
      message: '',
      tags: [],
      parentVersions: [],
      ...metadata
    };
    this.patches = new Map(); // Patches to reach this version from parents
    this.ast = null; // Cached AST
    this.diffStats = null; // Cached diff statistics
  }

  /**
   * Add patch from parent version
   */
  addPatch(parentId, patch) {
    this.patches.set(parentId, patch);
  }

  /**
   * Get patch to reach this version from parent
   */
  getPatch(parentId) {
    return this.patches.get(parentId);
  }

  /**
   * Set AST for this version
   */
  setAST(ast) {
    this.ast = ast;
  }

  /**
   * Get metadata summary
   */
  getSummary() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      author: this.metadata.author,
      message: this.metadata.message,
      contentLength: this.content.length,
      lineCount: this.content.split('\n').length,
      hasAST: !!this.ast,
      parentCount: this.metadata.parentVersions.length
    };
  }
}

// Branch management
class Branch {
  constructor(name, baseVersionId, metadata = {}) {
    this.name = name;
    this.baseVersionId = baseVersionId;
    this.headVersionId = baseVersionId;
    this.createdAt = Date.now();
    this.metadata = {
      description: '',
      author: 'system',
      protected: false,
      ...metadata
    };
    this.versionHistory = [baseVersionId];
  }

  /**
   * Add version to branch
   */
  addVersion(versionId) {
    this.versionHistory.push(versionId);
    this.headVersionId = versionId;
  }

  /**
   * Get branch summary
   */
  getSummary() {
    return {
      name: this.name,
      headVersionId: this.headVersionId,
      baseVersionId: this.baseVersionId,
      versionCount: this.versionHistory.length,
      createdAt: this.createdAt,
      author: this.metadata.author,
      description: this.metadata.description
    };
  }
}

// Main version control service
export class VersionControlService {
  constructor(options = {}) {
    this.options = {
      maxVersions: 100,
      enableASTParsing: true,
      enableAutoPatch: true,
      enableCompression: true,
      defaultBranch: 'main',
      ...options
    };

    // Storage
    this.versions = new Map();
    this.branches = new Map();
    this.tags = new Map();
    this.activeFiles = new Map(); // fileId -> current version info

    // Services
    this.diffService = new DiffService();
    
    // Event listeners
    this.eventListeners = new Map();
    
    // Initialize default branch
    this.createBranch(this.options.defaultBranch, null, {
      description: 'Main development branch',
      protected: true
    });
  }

  /**
   * Create initial version for a file
   */
  async createFile(fileId, initialContent, metadata = {}) {
    const versionId = this.generateVersionId();
    const version = new Version(versionId, initialContent, {
      ...metadata,
      message: metadata.message || 'Initial version',
      isInitial: true
    });

    // Parse AST if enabled
    if (this.options.enableASTParsing && metadata.language) {
      try {
        await astParser.initialize(window.monaco);
        const astResult = await astParser.parseToAST(initialContent, metadata.language);
        if (astResult.success) {
          version.setAST(astResult.ast);
        }
      } catch (error) {
        console.warn('AST parsing failed for initial version:', error);
      }
    }

    this.versions.set(versionId, version);
    
    // Set as head of default branch
    const defaultBranch = this.branches.get(this.options.defaultBranch);
    if (defaultBranch && !defaultBranch.baseVersionId) {
      defaultBranch.baseVersionId = versionId;
      defaultBranch.headVersionId = versionId;
      defaultBranch.versionHistory = [versionId];
    }

    // Track active file
    this.activeFiles.set(fileId, {
      currentVersionId: versionId,
      currentBranch: this.options.defaultBranch,
      language: metadata.language,
      lastModified: Date.now()
    });

    this.emit('fileCreated', { fileId, versionId, version });
    return version;
  }

  /**
   * Create new version from content change
   */
  async createVersion(fileId, newContent, metadata = {}) {
    const fileInfo = this.activeFiles.get(fileId);
    if (!fileInfo) {
      throw new Error(`File ${fileId} not found. Use createFile first.`);
    }

    const currentVersion = this.versions.get(fileInfo.currentVersionId);
    if (!currentVersion) {
      throw new Error(`Current version not found for file ${fileId}`);
    }

    const versionId = this.generateVersionId();
    const version = new Version(versionId, newContent, {
      ...metadata,
      parentVersions: [fileInfo.currentVersionId],
      message: metadata.message || 'Content update'
    });

    // Create patch from current version
    if (this.options.enableAutoPatch) {
      const diffResult = this.diffService.createDiff(
        currentVersion.content, 
        newContent,
        { compress: this.options.enableCompression }
      );

      if (diffResult.success) {
        version.addPatch(fileInfo.currentVersionId, {
          diff: diffResult.diff,
          compressed: diffResult.compressed,
          stats: diffResult.metadata
        });
        version.diffStats = this.diffService.getDiffStats(diffResult.diff);
      }
    }

    // Parse AST if enabled and language is available
    if (this.options.enableASTParsing && fileInfo.language) {
      try {
        const astResult = await astParser.parseToAST(newContent, fileInfo.language);
        if (astResult.success) {
          version.setAST(astResult.ast);

          // Compare ASTs if current version has AST
          if (currentVersion.ast) {
            const astDiff = ASTDiffer.compareASTs(currentVersion.ast, astResult.ast);
            version.metadata.astChanges = ASTDiffer.generateDiffSummary(astDiff);
          }
        }
      } catch (error) {
        console.warn('AST parsing failed for new version:', error);
      }
    }

    this.versions.set(versionId, version);

    // Add to current branch
    const currentBranch = this.branches.get(fileInfo.currentBranch);
    if (currentBranch) {
      currentBranch.addVersion(versionId);
    }

    // Update file info
    fileInfo.currentVersionId = versionId;
    fileInfo.lastModified = Date.now();

    // Cleanup old versions if needed
    this.cleanupVersions();

    this.emit('versionCreated', { fileId, versionId, version, parentId: fileInfo.currentVersionId });
    return version;
  }

  /**
   * Get version by ID
   */
  getVersion(versionId) {
    return this.versions.get(versionId);
  }

  /**
   * Get current version for file
   */
  getCurrentVersion(fileId) {
    const fileInfo = this.activeFiles.get(fileId);
    if (!fileInfo) return null;
    return this.versions.get(fileInfo.currentVersionId);
  }

  /**
   * Get version history for file
   */
  getVersionHistory(fileId, limit = 50) {
    const fileInfo = this.activeFiles.get(fileId);
    if (!fileInfo) return [];

    const branch = this.branches.get(fileInfo.currentBranch);
    if (!branch) return [];

    return branch.versionHistory
      .slice(-limit)
      .reverse()
      .map(versionId => this.versions.get(versionId))
      .filter(version => version !== undefined)
      .map(version => version.getSummary());
  }

  /**
   * Revert to previous version
   */
  async revertToVersion(fileId, targetVersionId, metadata = {}) {
    const targetVersion = this.versions.get(targetVersionId);
    if (!targetVersion) {
      throw new Error(`Version ${targetVersionId} not found`);
    }

    const fileInfo = this.activeFiles.get(fileId);
    if (!fileInfo) {
      throw new Error(`File ${fileId} not found`);
    }

    // Create new version with reverted content
    const newVersion = await this.createVersion(fileId, targetVersion.content, {
      ...metadata,
      message: `Revert to version ${targetVersionId}`,
      isRevert: true,
      revertedFromId: targetVersionId
    });

    this.emit('versionReverted', { 
      fileId, 
      newVersionId: newVersion.id, 
      targetVersionId,
      targetVersion 
    });

    return newVersion;
  }

  /**
   * Create branch
   */
  createBranch(branchName, baseVersionId = null, metadata = {}) {
    if (this.branches.has(branchName)) {
      throw new Error(`Branch ${branchName} already exists`);
    }

    const branch = new Branch(branchName, baseVersionId, metadata);
    this.branches.set(branchName, branch);

    this.emit('branchCreated', { branchName, branch });
    return branch;
  }

  /**
   * Switch to branch
   */
  switchToBranch(fileId, branchName) {
    const branch = this.branches.get(branchName);
    if (!branch) {
      throw new Error(`Branch ${branchName} not found`);
    }

    const fileInfo = this.activeFiles.get(fileId);
    if (!fileInfo) {
      throw new Error(`File ${fileId} not found`);
    }

    const oldBranch = fileInfo.currentBranch;
    fileInfo.currentBranch = branchName;
    fileInfo.currentVersionId = branch.headVersionId;

    this.emit('branchSwitched', { fileId, oldBranch, newBranch: branchName });
    return this.versions.get(branch.headVersionId);
  }

  /**
   * Merge branch
   */
  async mergeBranch(fileId, sourceBranch, targetBranch = null, metadata = {}) {
    const source = this.branches.get(sourceBranch);
    const target = this.branches.get(targetBranch || this.options.defaultBranch);

    if (!source || !target) {
      throw new Error('Source or target branch not found');
    }

    const sourceVersion = this.versions.get(source.headVersionId);
    const targetVersion = this.versions.get(target.headVersionId);

    if (!sourceVersion || !targetVersion) {
      throw new Error('Source or target version not found');
    }

    // Simple merge - take source content
    // In a real implementation, you'd handle conflicts
    const mergedContent = await this.performMerge(
      targetVersion.content,
      sourceVersion.content,
      metadata.mergeStrategy || 'source'
    );

    // Create merge version
    const mergeVersion = await this.createVersion(fileId, mergedContent, {
      ...metadata,
      message: `Merge ${sourceBranch} into ${targetBranch || this.options.defaultBranch}`,
      isMerge: true,
      parentVersions: [target.headVersionId, source.headVersionId],
      mergedBranches: [sourceBranch, targetBranch || this.options.defaultBranch]
    });

    this.emit('branchMerged', { 
      fileId, 
      sourceBranch, 
      targetBranch: targetBranch || this.options.defaultBranch,
      mergeVersionId: mergeVersion.id 
    });

    return mergeVersion;
  }

  /**
   * Perform merge operation
   */
  async performMerge(targetContent, sourceContent, strategy = 'source') {
    switch (strategy) {
      case 'source':
        return sourceContent;
      case 'target':
        return targetContent;
      case 'diff':
        // Use diff service to merge intelligently
        const diffResult = this.diffService.createDiff(targetContent, sourceContent);
        return this.diffService.applyDiff(targetContent, diffResult.diff);
      default:
        return sourceContent;
    }
  }

  /**
   * Create tag
   */
  createTag(tagName, versionId, metadata = {}) {
    if (this.tags.has(tagName)) {
      throw new Error(`Tag ${tagName} already exists`);
    }

    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    const tag = {
      name: tagName,
      versionId: versionId,
      createdAt: Date.now(),
      metadata: {
        description: '',
        author: 'system',
        ...metadata
      }
    };

    this.tags.set(tagName, tag);
    this.emit('tagCreated', { tagName, tag });
    return tag;
  }

  /**
   * Apply patch to content
   */
  applyPatch(content, patch) {
    if (!patch || !patch.diff) {
      return content;
    }

    let diff = patch.diff;
    if (patch.compressed) {
      diff = this.diffService.decompressDiff(patch.compressed);
    }

    return this.diffService.applyDiff(content, diff);
  }

  /**
   * Get diff between versions
   */
  getDiffBetweenVersions(fromVersionId, toVersionId) {
    const fromVersion = this.versions.get(fromVersionId);
    const toVersion = this.versions.get(toVersionId);

    if (!fromVersion || !toVersion) {
      throw new Error('One or both versions not found');
    }

    return this.diffService.createDiff(fromVersion.content, toVersion.content);
  }

  /**
   * Get unified diff between versions
   */
  getUnifiedDiff(fromVersionId, toVersionId, filename = 'file') {
    const fromVersion = this.versions.get(fromVersionId);
    const toVersion = this.versions.get(toVersionId);

    if (!fromVersion || !toVersion) {
      throw new Error('One or both versions not found');
    }

    return this.diffService.createUnifiedDiff(
      fromVersion.content, 
      toVersion.content, 
      filename
    );
  }

  /**
   * Export version history
   */
  exportHistory(fileId, format = 'json') {
    const history = this.getVersionHistory(fileId, this.options.maxVersions);
    
    switch (format) {
      case 'json':
        return JSON.stringify(history, null, 2);
      case 'csv':
        return this.convertHistoryToCSV(history);
      default:
        return history;
    }
  }

  /**
   * Convert history to CSV format
   */
  convertHistoryToCSV(history) {
    const headers = ['Version ID', 'Timestamp', 'Author', 'Message', 'Content Length', 'Line Count'];
    const rows = history.map(version => [
      version.id,
      new Date(version.timestamp).toISOString(),
      version.author,
      version.message,
      version.contentLength,
      version.lineCount
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      totalVersions: this.versions.size,
      totalBranches: this.branches.size,
      totalTags: this.tags.size,
      activeFiles: this.activeFiles.size,
      branches: Array.from(this.branches.values()).map(b => b.getSummary()),
      recentActivity: this.getRecentActivity(10)
    };
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit = 10) {
    const activity = [];

    // Get recent versions
    for (const version of this.versions.values()) {
      activity.push({
        type: 'version',
        timestamp: version.timestamp,
        id: version.id,
        message: version.metadata.message,
        author: version.metadata.author
      });
    }

    return activity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Cleanup old versions
   */
  cleanupVersions() {
    if (this.versions.size <= this.options.maxVersions) return;

    // Get all versions sorted by timestamp
    const sortedVersions = Array.from(this.versions.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // Remove oldest versions
    const toRemove = sortedVersions.slice(0, sortedVersions.length - this.options.maxVersions);
    
    for (const [versionId] of toRemove) {
      // Don't remove if it's a current version or branch head
      const isActive = Array.from(this.activeFiles.values())
        .some(info => info.currentVersionId === versionId);
      
      const isBranchHead = Array.from(this.branches.values())
        .some(branch => branch.headVersionId === versionId);

      if (!isActive && !isBranchHead) {
        this.versions.delete(versionId);
      }
    }
  }

  /**
   * Generate unique version ID
   */
  generateVersionId() {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event management
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in version control event listener:', error);
        }
      });
    }
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy() {
    this.versions.clear();
    this.branches.clear();
    this.tags.clear();
    this.activeFiles.clear();
    this.eventListeners.clear();
  }
}

// React hook for version control
export function useVersionControl(fileId, options = {}) {
  const [service] = useState(() => new VersionControlService(options));
  const [currentVersion, setCurrentVersion] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);
  const [stats, setStats] = useState(service.getStats());

  useEffect(() => {
    const updateData = () => {
      setCurrentVersion(service.getCurrentVersion(fileId));
      setVersionHistory(service.getVersionHistory(fileId));
      setStats(service.getStats());
    };

    service.on('versionCreated', updateData);
    service.on('versionReverted', updateData);
    service.on('branchSwitched', updateData);

    updateData();

    return () => {
      service.off('versionCreated', updateData);
      service.off('versionReverted', updateData);
      service.off('branchSwitched', updateData);
    };
  }, [service, fileId]);

  useEffect(() => {
    return () => service.destroy();
  }, [service]);

  return {
    service,
    currentVersion,
    versionHistory,
    stats,
    createVersion: (content, metadata) => service.createVersion(fileId, content, metadata),
    revertToVersion: (versionId, metadata) => service.revertToVersion(fileId, versionId, metadata),
    createBranch: (branchName, metadata) => service.createBranch(branchName, currentVersion?.id, metadata),
    switchToBranch: (branchName) => service.switchToBranch(fileId, branchName),
    createTag: (tagName, metadata) => service.createTag(tagName, currentVersion?.id, metadata),
    exportHistory: (format) => service.exportHistory(fileId, format)
  };
}

export default VersionControlService;
export { Version, Branch };