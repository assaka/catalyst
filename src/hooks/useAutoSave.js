/**
 * Auto-save hook with debounced saving and offline fallback
 * Implements intelligent saving with conflict resolution and local storage backup
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Auto-save configuration constants
const DEFAULT_CONFIG = {
  delay: 2000,           // Default debounce delay in milliseconds
  maxRetries: 3,         // Max retry attempts for failed saves
  retryDelay: 1000,      // Delay between retries
  enableOfflineStorage: true,  // Enable localStorage fallback
  enableConflictDetection: true,  // Enable conflict detection
  compressionEnabled: true,      // Enable compression for large files
  maxLocalStorageSize: 1024 * 1024, // 1MB max for localStorage
};

/**
 * Auto-save hook for Monaco Editor
 */
export function useAutoSave({
  editorState,
  onSave,
  delay = DEFAULT_CONFIG.delay,
  fileId,
  originalContent = '',
  onConflict,
  onError,
  onSaveSuccess,
  config = {}
}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State management
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success, error, conflict
  const [lastSaved, setLastSaved] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [saveHistory, setSaveHistory] = useState([]);

  // Refs for stable references
  const saveTimeoutRef = useRef(null);
  const lastContentRef = useRef(originalContent);
  const savePromiseRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  /**
   * Online/offline detection
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Try to sync pending changes when coming back online
      if (pendingChanges) {
        triggerSave(pendingChanges, true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingChanges]);

  /**
   * Compress content for storage if needed
   */
  const compressContent = useCallback((content) => {
    if (!mergedConfig.compressionEnabled || content.length < 1024) {
      return { content, compressed: false };
    }

    try {
      // Simple compression using JSON stringify with replacement
      const compressed = JSON.stringify(content).replace(/\s+/g, ' ');
      return {
        content: compressed,
        compressed: true,
        originalSize: content.length,
        compressedSize: compressed.length
      };
    } catch (error) {
      console.warn('Compression failed:', error);
      return { content, compressed: false };
    }
  }, [mergedConfig.compressionEnabled]);

  /**
   * Decompress content if it was compressed
   */
  const decompressContent = useCallback((data) => {
    if (!data.compressed) {
      return data.content;
    }

    try {
      return JSON.parse(data.content);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return data.content;
    }
  }, []);

  /**
   * Save to localStorage as offline backup
   */
  const saveToLocalStorage = useCallback((content, metadata = {}) => {
    if (!mergedConfig.enableOfflineStorage || !fileId) return;

    try {
      const compressed = compressContent(content);
      
      // Check size limit
      const dataSize = JSON.stringify(compressed).length;
      if (dataSize > mergedConfig.maxLocalStorageSize) {
        console.warn('Content too large for localStorage, skipping offline backup');
        return;
      }

      const storageData = {
        ...compressed,
        fileId,
        timestamp: Date.now(),
        isOfflineBackup: true,
        ...metadata
      };

      localStorage.setItem(`autosave_${fileId}`, JSON.stringify(storageData));
      
      // Also save to a general pending changes list
      const pendingKey = 'autosave_pending';
      const existing = JSON.parse(localStorage.getItem(pendingKey) || '[]');
      const updated = existing.filter(item => item.fileId !== fileId);
      updated.push({ fileId, timestamp: Date.now() });
      localStorage.setItem(pendingKey, JSON.stringify(updated.slice(-10))); // Keep last 10
      
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [fileId, mergedConfig, compressContent]);

  /**
   * Load from localStorage
   */
  const loadFromLocalStorage = useCallback(() => {
    if (!mergedConfig.enableOfflineStorage || !fileId) return null;

    try {
      const stored = localStorage.getItem(`autosave_${fileId}`);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return {
        content: decompressContent(data),
        timestamp: data.timestamp,
        isOfflineBackup: data.isOfflineBackup
      };
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, [fileId, mergedConfig, decompressContent]);

  /**
   * Clear localStorage backup
   */
  const clearLocalStorageBackup = useCallback(() => {
    if (!fileId) return;

    try {
      localStorage.removeItem(`autosave_${fileId}`);
      
      // Remove from pending list
      const pendingKey = 'autosave_pending';
      const existing = JSON.parse(localStorage.getItem(pendingKey) || '[]');
      const updated = existing.filter(item => item.fileId !== fileId);
      localStorage.setItem(pendingKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to clear localStorage backup:', error);
    }
  }, [fileId]);

  /**
   * Detect conflicts with server version
   */
  const detectConflict = useCallback(async (currentContent) => {
    if (!mergedConfig.enableConflictDetection) return false;

    try {
      // This would typically check against server version
      // For now, we'll check against the original content
      return originalContent !== lastContentRef.current && 
             lastContentRef.current !== currentContent;
    } catch (error) {
      console.warn('Conflict detection failed:', error);
      return false;
    }
  }, [mergedConfig.enableConflictDetection, originalContent]);

  /**
   * Trigger save operation
   */
  const triggerSave = useCallback(async (content, isRetry = false) => {
    if (savePromiseRef.current && !isRetry) {
      // Wait for current save to complete
      try {
        await savePromiseRef.current;
      } catch (error) {
        // Ignore errors from previous save
      }
    }

    setSaveStatus('saving');
    
    const savePromise = (async () => {
      try {
        // Check for conflicts
        if (await detectConflict(content)) {
          setSaveStatus('conflict');
          if (onConflict) {
            onConflict({
              currentContent: content,
              serverContent: originalContent,
              lastKnownContent: lastContentRef.current
            });
          }
          return false;
        }

        // Attempt to save
        if (onSave) {
          await onSave(content, {
            fileId,
            timestamp: Date.now(),
            isOnline,
            retryAttempt: retryCount
          });
        }

        // Save successful
        setSaveStatus('success');
        setLastSaved(new Date());
        setRetryCount(0);
        lastContentRef.current = content;
        
        // Clear offline backup on successful save
        if (isOnline) {
          clearLocalStorageBackup();
          setPendingChanges(null);
        }

        // Add to save history
        setSaveHistory(prev => [
          { timestamp: Date.now(), status: 'success', size: content.length },
          ...prev.slice(0, 9) // Keep last 10 saves
        ]);

        if (onSaveSuccess) {
          onSaveSuccess({ content, timestamp: Date.now() });
        }

        return true;

      } catch (error) {
        console.error('Save failed:', error);
        
        if (retryCount < mergedConfig.maxRetries) {
          // Schedule retry
          setRetryCount(prev => prev + 1);
          retryTimeoutRef.current = setTimeout(() => {
            triggerSave(content, true);
          }, mergedConfig.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
          
          setSaveStatus('saving'); // Keep showing saving during retry
        } else {
          // Save failed, use offline storage
          setSaveStatus('error');
          setRetryCount(0);
          
          if (!isOnline || mergedConfig.enableOfflineStorage) {
            saveToLocalStorage(content, { 
              failedAt: Date.now(),
              error: error.message 
            });
            setPendingChanges(content);
          }

          // Add to save history
          setSaveHistory(prev => [
            { timestamp: Date.now(), status: 'error', error: error.message },
            ...prev.slice(0, 9)
          ]);

          if (onError) {
            onError(error, { content, retryCount });
          }
        }

        throw error;
      }
    })();

    savePromiseRef.current = savePromise;
    return savePromise;

  }, [
    onSave, fileId, isOnline, retryCount, mergedConfig, 
    detectConflict, onConflict, originalContent, onSaveSuccess, 
    onError, clearLocalStorageBackup, saveToLocalStorage
  ]);

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback((content) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Clear retry timeout if user is still typing
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      if (content !== lastContentRef.current) {
        triggerSave(content);
      }
    }, delay);

  }, [delay, triggerSave]);

  /**
   * Manual save function
   */
  const forceSave = useCallback(async (content = editorState) => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    return triggerSave(content);
  }, [editorState, triggerSave]);

  /**
   * Main effect - trigger auto-save when editor state changes
   */
  useEffect(() => {
    if (editorState && editorState !== lastContentRef.current) {
      debouncedSave(editorState);
    }
  }, [editorState, debouncedSave]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Recovery function for offline content
   */
  const recoverOfflineContent = useCallback(() => {
    const offlineData = loadFromLocalStorage();
    if (offlineData && offlineData.isOfflineBackup) {
      return {
        content: offlineData.content,
        timestamp: new Date(offlineData.timestamp),
        isRecovered: true
      };
    }
    return null;
  }, [loadFromLocalStorage]);

  /**
   * Get pending changes from localStorage
   */
  const getPendingChanges = useCallback(() => {
    try {
      const pending = localStorage.getItem('autosave_pending');
      if (!pending) return [];

      return JSON.parse(pending).map(item => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get pending changes:', error);
      return [];
    }
  }, []);

  return {
    // Status
    saveStatus,
    lastSaved,
    isOnline,
    retryCount,
    pendingChanges: !!pendingChanges,
    saveHistory,
    
    // Actions
    forceSave,
    recoverOfflineContent,
    getPendingChanges,
    clearLocalStorageBackup,
    
    // Configuration
    config: mergedConfig,
    
    // Metadata
    metadata: {
      hasOfflineBackup: !!loadFromLocalStorage(),
      lastContentLength: lastContentRef.current?.length || 0,
      currentContentLength: editorState?.length || 0
    }
  };
}

/**
 * Hook for managing multiple auto-save instances
 */
export function useMultiAutoSave() {
  const [instances, setInstances] = useState(new Map());
  
  const createInstance = useCallback((fileId, config) => {
    const instance = { fileId, config, status: 'idle' };
    setInstances(prev => new Map(prev).set(fileId, instance));
    return instance;
  }, []);
  
  const removeInstance = useCallback((fileId) => {
    setInstances(prev => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
  }, []);
  
  const getAllPendingChanges = useCallback(() => {
    try {
      const pending = localStorage.getItem('autosave_pending');
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      return [];
    }
  }, []);
  
  return {
    instances: Array.from(instances.values()),
    createInstance,
    removeInstance,
    getAllPendingChanges
  };
}

export default useAutoSave;