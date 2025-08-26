/**
 * Overlay System for Local Preview
 * Manages temporary overlays for real-time code preview without affecting the main codebase
 */

import { useState, useEffect } from 'react';

// Overlay storage and management
class OverlayStorage {
  constructor() {
    this.overlays = new Map();
    this.overlayHistory = new Map();
    this.maxHistoryLength = 10;
    this.cleanupInterval = null;
    this.defaultTTL = 30 * 60 * 1000; // 30 minutes default TTL
    
    this.startCleanupScheduler();
  }

  /**
   * Create or update a temporary overlay
   */
  createTmpOverlay(fileId, tmpCode, options = {}) {
    const {
      ttl = this.defaultTTL,
      priority = 1,
      metadata = {},
      preserveHistory = true
    } = options;

    const overlayId = `${fileId}_${Date.now()}`;
    const overlay = {
      id: overlayId,
      fileId,
      tmpCode,
      originalCode: this.getOriginalCode(fileId),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + ttl,
      priority,
      metadata: {
        ...metadata,
        version: 1,
        size: tmpCode.length,
        lineCount: tmpCode.split('\n').length
      },
      status: 'active'
    };

    // Store overlay
    this.overlays.set(overlayId, overlay);
    
    // Update file mapping
    const fileOverlays = this.overlays.get(`file_${fileId}`) || [];
    fileOverlays.push(overlayId);
    this.overlays.set(`file_${fileId}`, fileOverlays);

    // Preserve history if requested
    if (preserveHistory) {
      this.addToHistory(fileId, overlay);
    }

    return overlay;
  }

  /**
   * Update existing overlay
   */
  updateOverlay(overlayId, tmpCode, metadata = {}) {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) {
      throw new Error(`Overlay ${overlayId} not found`);
    }

    const updated = {
      ...overlay,
      tmpCode,
      updatedAt: Date.now(),
      metadata: {
        ...overlay.metadata,
        ...metadata,
        version: overlay.metadata.version + 1,
        size: tmpCode.length,
        lineCount: tmpCode.split('\n').length
      }
    };

    this.overlays.set(overlayId, updated);
    this.addToHistory(overlay.fileId, updated);

    return updated;
  }

  /**
   * Get overlay by ID
   */
  getOverlay(overlayId) {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return null;

    // Check if expired
    if (overlay.expiresAt < Date.now()) {
      this.removeOverlay(overlayId);
      return null;
    }

    return overlay;
  }

  /**
   * Get all overlays for a file
   */
  getFileOverlays(fileId) {
    const overlayIds = this.overlays.get(`file_${fileId}`) || [];
    return overlayIds
      .map(id => this.getOverlay(id))
      .filter(overlay => overlay !== null)
      .sort((a, b) => b.priority - a.priority || b.updatedAt - a.updatedAt);
  }

  /**
   * Get the most recent overlay for a file
   */
  getLatestOverlay(fileId) {
    const overlays = this.getFileOverlays(fileId);
    return overlays.length > 0 ? overlays[0] : null;
  }

  /**
   * Remove overlay
   */
  removeOverlay(overlayId) {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return false;

    // Remove from main storage
    this.overlays.delete(overlayId);

    // Remove from file mapping
    const fileOverlays = this.overlays.get(`file_${overlay.fileId}`) || [];
    const updated = fileOverlays.filter(id => id !== overlayId);
    if (updated.length > 0) {
      this.overlays.set(`file_${overlay.fileId}`, updated);
    } else {
      this.overlays.delete(`file_${overlay.fileId}`);
    }

    return true;
  }

  /**
   * Remove all overlays for a file
   */
  removeFileOverlays(fileId) {
    const overlayIds = this.overlays.get(`file_${fileId}`) || [];
    let removed = 0;

    overlayIds.forEach(id => {
      if (this.overlays.delete(id)) {
        removed++;
      }
    });

    this.overlays.delete(`file_${fileId}`);
    return removed;
  }

  /**
   * Add overlay to history
   */
  addToHistory(fileId, overlay) {
    const historyKey = `history_${fileId}`;
    let history = this.overlayHistory.get(historyKey) || [];
    
    // Add to beginning of history
    history.unshift({
      id: overlay.id,
      tmpCode: overlay.tmpCode,
      createdAt: overlay.createdAt,
      updatedAt: overlay.updatedAt,
      metadata: overlay.metadata
    });

    // Trim history
    if (history.length > this.maxHistoryLength) {
      history = history.slice(0, this.maxHistoryLength);
    }

    this.overlayHistory.set(historyKey, history);
  }

  /**
   * Get overlay history for a file
   */
  getOverlayHistory(fileId) {
    return this.overlayHistory.get(`history_${fileId}`) || [];
  }

  /**
   * Get original code for a file (placeholder - would integrate with file system)
   */
  getOriginalCode(fileId) {
    // This would typically fetch from the main file system
    // For now, return a placeholder
    return this.overlays.get(`original_${fileId}`) || '';
  }

  /**
   * Set original code for a file
   */
  setOriginalCode(fileId, code) {
    this.overlays.set(`original_${fileId}`, code);
  }

  /**
   * Start cleanup scheduler
   */
  startCleanupScheduler() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredOverlays();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Cleanup expired overlays
   */
  cleanupExpiredOverlays() {
    const now = Date.now();
    const expiredIds = [];

    for (const [key, overlay] of this.overlays) {
      if (key.includes('_') && overlay.expiresAt && overlay.expiresAt < now) {
        expiredIds.push(key);
      }
    }

    expiredIds.forEach(id => this.removeOverlay(id));

    if (expiredIds.length > 0) {
      console.log(`Cleaned up ${expiredIds.length} expired overlays`);
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    let activeOverlays = 0;
    let totalSize = 0;
    let fileCount = 0;

    for (const [key, value] of this.overlays) {
      if (key.includes('_') && typeof value === 'object' && value.tmpCode) {
        activeOverlays++;
        totalSize += value.tmpCode.length;
      }
      if (key.startsWith('file_')) {
        fileCount++;
      }
    }

    return {
      activeOverlays,
      filesWithOverlays: fileCount,
      totalSize,
      averageSize: activeOverlays > 0 ? Math.round(totalSize / activeOverlays) : 0
    };
  }

  /**
   * Destroy storage and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.overlays.clear();
    this.overlayHistory.clear();
  }
}

// Overlay merger - combines overlays with original code
class OverlayMerger {
  /**
   * Merge overlay with original code
   */
  static mergeOverlay(overlay, mergeStrategy = 'replace') {
    if (!overlay) return overlay?.originalCode || '';

    switch (mergeStrategy) {
      case 'replace':
        return overlay.tmpCode;
      
      case 'merge':
        return this.mergeDiff(overlay.originalCode, overlay.tmpCode);
      
      case 'patch':
        return this.applyPatches(overlay.originalCode, overlay.tmpCode);
      
      default:
        return overlay.tmpCode;
    }
  }

  /**
   * Merge multiple overlays for the same file
   */
  static mergeMultipleOverlays(overlays, mergeStrategy = 'latest') {
    if (!overlays || overlays.length === 0) return '';
    if (overlays.length === 1) return this.mergeOverlay(overlays[0]);

    switch (mergeStrategy) {
      case 'latest':
        return this.mergeOverlay(overlays[0]); // Already sorted by latest
      
      case 'priority':
        const highest = overlays.reduce((prev, current) => 
          current.priority > prev.priority ? current : prev
        );
        return this.mergeOverlay(highest);
      
      case 'composite':
        return this.compositeOverlays(overlays);
      
      default:
        return this.mergeOverlay(overlays[0]);
    }
  }

  /**
   * Create composite from multiple overlays
   */
  static compositeOverlays(overlays) {
    if (!overlays.length) return '';
    
    let result = overlays[0].originalCode || '';
    
    // Apply overlays in priority order (highest first)
    const sorted = [...overlays].sort((a, b) => b.priority - a.priority);
    
    for (const overlay of sorted) {
      result = this.mergeOverlay({ 
        ...overlay, 
        originalCode: result 
      });
    }
    
    return result;
  }

  /**
   * Simple diff merge (placeholder implementation)
   */
  static mergeDiff(original, modified) {
    // This would use the DiffService for intelligent merging
    // For now, return the modified version
    return modified;
  }

  /**
   * Apply patches (placeholder implementation)
   */
  static applyPatches(original, patches) {
    // This would apply specific patches to the original
    // For now, return the patches as-is
    return patches;
  }
}

// Main overlay manager
export class OverlayManager {
  constructor(options = {}) {
    this.storage = new OverlayStorage();
    this.options = {
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      maxOverlaysPerFile: 5,
      enableAutoCleanup: true,
      ...options
    };
    
    this.eventListeners = new Map();
  }

  /**
   * Create temporary overlay
   */
  createTmpOverlay(fileId, tmpCode, options = {}) {
    const mergedOptions = { ...this.options, ...options };
    
    // Check limits
    const existing = this.storage.getFileOverlays(fileId);
    if (existing.length >= mergedOptions.maxOverlaysPerFile) {
      // Remove oldest overlay
      const oldest = existing[existing.length - 1];
      this.storage.removeOverlay(oldest.id);
    }

    const overlay = this.storage.createTmpOverlay(fileId, tmpCode, mergedOptions);
    
    this.emit('overlayCreated', { overlay, fileId });
    
    return overlay;
  }

  /**
   * Update overlay
   */
  updateOverlay(overlayId, tmpCode, metadata = {}) {
    const overlay = this.storage.updateOverlay(overlayId, tmpCode, metadata);
    this.emit('overlayUpdated', { overlay, overlayId });
    return overlay;
  }

  /**
   * Get merged content for preview
   */
  getMergedContent(fileId, mergeStrategy = 'latest') {
    const overlays = this.storage.getFileOverlays(fileId);
    
    if (overlays.length === 0) {
      return this.storage.getOriginalCode(fileId);
    }

    return OverlayMerger.mergeMultipleOverlays(overlays, mergeStrategy);
  }

  /**
   * Get overlay for editing
   */
  getOverlay(overlayId) {
    return this.storage.getOverlay(overlayId);
  }

  /**
   * Get all overlays for a file
   */
  getFileOverlays(fileId) {
    return this.storage.getFileOverlays(fileId);
  }

  /**
   * Remove overlay
   */
  removeOverlay(overlayId) {
    const result = this.storage.removeOverlay(overlayId);
    if (result) {
      this.emit('overlayRemoved', { overlayId });
    }
    return result;
  }

  /**
   * Remove all overlays for a file
   */
  clearFileOverlays(fileId) {
    const removed = this.storage.removeFileOverlays(fileId);
    if (removed > 0) {
      this.emit('fileOverlaysCleared', { fileId, count: removed });
    }
    return removed;
  }

  /**
   * Set original code (for comparison and merging)
   */
  setOriginalCode(fileId, code) {
    this.storage.setOriginalCode(fileId, code);
  }

  /**
   * Get overlay history
   */
  getOverlayHistory(fileId) {
    return this.storage.getOverlayHistory(fileId);
  }

  /**
   * Get storage statistics
   */
  getStats() {
    return this.storage.getStats();
  }

  /**
   * Manual cleanup
   */
  cleanup() {
    this.storage.cleanupExpiredOverlays();
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
          console.error('Error in overlay event listener:', error);
        }
      });
    }
  }

  /**
   * Destroy manager and cleanup resources
   */
  destroy() {
    this.storage.destroy();
    this.eventListeners.clear();
  }
}

// React hook for overlay management
export function useOverlayManager(options = {}) {
  const [manager] = useState(() => new OverlayManager(options));
  const [stats, setStats] = useState(manager.getStats());

  useEffect(() => {
    const updateStats = () => setStats(manager.getStats());
    
    manager.on('overlayCreated', updateStats);
    manager.on('overlayUpdated', updateStats);
    manager.on('overlayRemoved', updateStats);
    
    return () => {
      manager.off('overlayCreated', updateStats);
      manager.off('overlayUpdated', updateStats);
      manager.off('overlayRemoved', updateStats);
    };
  }, [manager]);

  useEffect(() => {
    return () => manager.destroy();
  }, [manager]);

  return {
    manager,
    stats,
    createOverlay: (fileId, code, options) => manager.createTmpOverlay(fileId, code, options),
    updateOverlay: (overlayId, code, metadata) => manager.updateOverlay(overlayId, code, metadata),
    getMergedContent: (fileId, strategy) => manager.getMergedContent(fileId, strategy),
    removeOverlay: (overlayId) => manager.removeOverlay(overlayId),
    clearFileOverlays: (fileId) => manager.clearFileOverlays(fileId),
    setOriginalCode: (fileId, code) => manager.setOriginalCode(fileId, code)
  };
}

export default OverlayManager;
export { OverlayStorage, OverlayMerger };