/**
 * Advanced Overlay Manager Hook
 * Combines in-memory overlay management with database persistence
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { OverlayManager } from '../services/overlay-manager';
import OverlayDatabaseBridge from '../services/overlay-database-bridge';
import { useAuth } from '../contexts/AuthContext';

export function useAdvancedOverlayManager(options = {}) {
  const { user } = useAuth();
  const {
    enableDatabaseSync = true,
    autoSave = true,
    autoSaveInterval = 30000,
    enableVersionControl = true,
    storeId = null,
    ...overlayManagerOptions
  } = options;

  // Initialize services
  const [overlayManager] = useState(() => new OverlayManager(overlayManagerOptions));
  const [dbBridge] = useState(() => new OverlayDatabaseBridge({
    autoSave,
    autoSaveInterval,
    enableVersionControl
  }));

  // State management
  const [stats, setStats] = useState({
    local: overlayManager.getStats(),
    database: { totalOverlays: 0, activeOverlays: 0, temporaryOverlays: 0 }
  });
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error'
  const [lastSync, setLastSync] = useState(null);

  // Refs for cleanup
  const autoSaveTimeouts = useRef(new Map());
  const syncInProgress = useRef(new Set());

  /**
   * Update statistics from both local and database
   */
  const updateStats = useCallback(async () => {
    const localStats = overlayManager.getStats();
    let databaseStats = { totalOverlays: 0, activeOverlays: 0, temporaryOverlays: 0 };

    if (enableDatabaseSync && user?.id) {
      try {
        const dbStatsResult = await dbBridge.getStats(user.id);
        if (dbStatsResult.success) {
          databaseStats = dbStatsResult.stats;
        }
      } catch (error) {
        console.error('Failed to get database stats:', error);
      }
    }

    setStats({ local: localStats, database: databaseStats });
  }, [overlayManager, dbBridge, enableDatabaseSync, user?.id]);

  /**
   * Sync overlay to database
   */
  const syncOverlayToDatabase = useCallback(async (fileId, overlay, options = {}) => {
    if (!enableDatabaseSync || !user?.id || syncInProgress.current.has(fileId)) {
      return { success: false, error: 'Sync not available' };
    }

    syncInProgress.current.add(fileId);
    setSyncStatus('syncing');

    try {
      const result = await dbBridge.saveOverlay({
        filePath: fileId,
        originalCode: overlay.originalCode,
        modifiedCode: overlay.tmpCode,
        metadata: {
          ...overlay.metadata,
          ...options.metadata,
          syncedAt: Date.now()
        },
        temporary: options.temporary !== false // Default to temporary
      });

      if (result.success) {
        // Update overlay with database info
        overlayManager.updateOverlay(overlay.id, overlay.tmpCode, {
          ...overlay.metadata,
          dbSynced: true,
          customizationId: result.customization?.id,
          snapshotId: result.snapshot?.id
        });

        setLastSync(Date.now());
        setSyncStatus('idle');
        await updateStats();

        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Database sync failed:', error);
      setSyncStatus('error');
      return { success: false, error: error.message };
    } finally {
      syncInProgress.current.delete(fileId);
    }
  }, [enableDatabaseSync, user?.id, overlayManager, dbBridge, updateStats]);

  /**
   * Create overlay with database sync
   */
  const createOverlay = useCallback(async (fileId, code, options = {}) => {
    // Create local overlay first
    const overlay = overlayManager.createTmpOverlay(fileId, code, options);

    // Auto-sync to database if enabled
    if (enableDatabaseSync && user?.id && autoSave) {
      // Use debounced auto-save
      dbBridge.autoSaveOverlay(fileId, overlay.originalCode, code, {
        ...options.metadata,
        overlayId: overlay.id
      });
    }

    await updateStats();
    return overlay;
  }, [overlayManager, enableDatabaseSync, user?.id, autoSave, dbBridge, updateStats]);

  /**
   * Update overlay with database sync
   */
  const updateOverlay = useCallback(async (overlayId, code, metadata = {}, options = {}) => {
    // Update local overlay first
    const overlay = overlayManager.updateOverlay(overlayId, code, metadata);
    
    // Auto-sync to database if enabled
    if (enableDatabaseSync && user?.id && autoSave) {
      // Use debounced auto-save
      dbBridge.autoSaveOverlay(overlay.fileId, overlay.originalCode, code, {
        ...metadata,
        overlayId: overlay.id
      });
    }

    await updateStats();
    return overlay;
  }, [overlayManager, enableDatabaseSync, user?.id, autoSave, dbBridge, updateStats]);

  /**
   * Remove overlay with database cleanup
   */
  const removeOverlay = useCallback(async (overlayId, options = {}) => {
    const overlay = overlayManager.getOverlay(overlayId);
    
    // Remove from local storage
    const result = overlayManager.removeOverlay(overlayId);

    // Remove from database if it was synced
    if (enableDatabaseSync && overlay?.metadata?.customizationId) {
      try {
        await dbBridge.removeOverlay(
          overlay.metadata.customizationId, 
          options.archive !== false // Default to archive
        );
      } catch (error) {
        console.error('Failed to remove overlay from database:', error);
      }
    }

    await updateStats();
    return result;
  }, [overlayManager, enableDatabaseSync, dbBridge, updateStats]);

  /**
   * Get merged content (local only for now)
   */
  const getMergedContent = useCallback((fileId, strategy = 'latest') => {
    return overlayManager.getMergedContent(fileId, strategy);
  }, [overlayManager]);

  /**
   * Load overlay from database
   */
  const loadOverlayFromDatabase = useCallback(async (filePath, temporary = false) => {
    if (!enableDatabaseSync || !user?.id) {
      return { success: false, error: 'Database sync not available' };
    }

    try {
      const result = await dbBridge.loadOverlay(filePath, temporary);
      
      if (result.success && result.customization) {
        // Create local overlay from database data
        const overlay = overlayManager.createTmpOverlay(
          filePath,
          result.customization.current_code,
          {
            metadata: {
              ...result.customization.metadata,
              fromDatabase: true,
              customizationId: result.customization.id
            }
          }
        );

        // Set original code
        overlayManager.setOriginalCode(filePath, result.customization.baseline_code);

        await updateStats();
        return { success: true, overlay };
      }

      return result;
    } catch (error) {
      console.error('Failed to load overlay from database:', error);
      return { success: false, error: error.message };
    }
  }, [enableDatabaseSync, user?.id, dbBridge, overlayManager, updateStats]);

  /**
   * Finalize overlay (make permanent)
   */
  const finalizeOverlay = useCallback(async (overlayId) => {
    const overlay = overlayManager.getOverlay(overlayId);
    if (!overlay) {
      return { success: false, error: 'Overlay not found' };
    }

    if (enableDatabaseSync && overlay.metadata?.customizationId) {
      try {
        // Finalize in database
        const result = await dbBridge.finalizeOverlay(overlay.metadata.customizationId);
        
        if (result.success) {
          // Update local overlay metadata
          overlayManager.updateOverlay(overlayId, overlay.tmpCode, {
            ...overlay.metadata,
            finalized: true,
            finalizedAt: Date.now()
          });

          await updateStats();
          return result;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Failed to finalize overlay:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Just mark as finalized locally
      overlayManager.updateOverlay(overlayId, overlay.tmpCode, {
        ...overlay.metadata,
        finalized: true,
        finalizedAt: Date.now()
      });

      return { success: true, message: 'Overlay finalized locally' };
    }
  }, [overlayManager, enableDatabaseSync, dbBridge, updateStats]);

  /**
   * Get user's overlays from database
   */
  const getUserOverlays = useCallback(async (options = {}) => {
    if (!enableDatabaseSync || !user?.id) {
      return { success: false, error: 'Database sync not available' };
    }

    return await dbBridge.getUserOverlays({
      userId: user.id,
      storeId,
      ...options
    });
  }, [enableDatabaseSync, user?.id, dbBridge, storeId]);

  /**
   * Manual sync all overlays
   */
  const syncAllOverlays = useCallback(async () => {
    const localStats = overlayManager.getStats();
    if (localStats.activeOverlays === 0) {
      return { success: true, message: 'No overlays to sync' };
    }

    setSyncStatus('syncing');
    let synced = 0;
    let failed = 0;

    // Get all file IDs with overlays
    const fileIds = []; // This would need to be implemented in OverlayManager
    
    for (const fileId of fileIds) {
      const overlays = overlayManager.getFileOverlays(fileId);
      for (const overlay of overlays) {
        if (!overlay.metadata?.dbSynced) {
          const result = await syncOverlayToDatabase(fileId, overlay);
          if (result.success) {
            synced++;
          } else {
            failed++;
          }
        }
      }
    }

    setSyncStatus(failed > 0 ? 'error' : 'idle');
    return { success: true, synced, failed };
  }, [overlayManager, syncOverlayToDatabase]);

  // Set up event listeners for overlay manager
  useEffect(() => {
    const handleOverlayCreated = () => updateStats();
    const handleOverlayUpdated = () => updateStats();
    const handleOverlayRemoved = () => updateStats();

    overlayManager.on('overlayCreated', handleOverlayCreated);
    overlayManager.on('overlayUpdated', handleOverlayUpdated);
    overlayManager.on('overlayRemoved', handleOverlayRemoved);

    return () => {
      overlayManager.off('overlayCreated', handleOverlayCreated);
      overlayManager.off('overlayUpdated', handleOverlayUpdated);
      overlayManager.off('overlayRemoved', handleOverlayRemoved);
    };
  }, [overlayManager, updateStats]);

  // Initial stats update
  useEffect(() => {
    updateStats();
  }, [updateStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      overlayManager.destroy();
      dbBridge.cleanup();
      
      // Clear auto-save timeouts
      for (const timeout of autoSaveTimeouts.current.values()) {
        clearTimeout(timeout);
      }
      autoSaveTimeouts.current.clear();
    };
  }, [overlayManager, dbBridge]);

  return {
    // Core overlay operations
    createOverlay,
    updateOverlay,
    removeOverlay,
    getMergedContent,
    finalizeOverlay,

    // Database operations
    syncOverlayToDatabase,
    loadOverlayFromDatabase,
    getUserOverlays,
    syncAllOverlays,

    // State and statistics
    stats,
    syncStatus,
    lastSync,

    // Direct access to managers
    overlayManager,
    dbBridge,

    // Utility methods
    getOverlay: overlayManager.getOverlay.bind(overlayManager),
    getFileOverlays: overlayManager.getFileOverlays.bind(overlayManager),
    clearFileOverlays: overlayManager.clearFileOverlays.bind(overlayManager),
    setOriginalCode: overlayManager.setOriginalCode.bind(overlayManager),
    getOverlayHistory: overlayManager.getOverlayHistory.bind(overlayManager)
  };
}