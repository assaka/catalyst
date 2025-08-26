/**
 * BrowserPreviewOverlay Component
 * Non-destructive overlay system showing code patches on top of immutable core code
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Code, GitBranch, Eye, EyeOff, Maximize2, Minimize2, 
  Layers, Save, RotateCcw, History, Upload, Download,
  FileCode, Trash2
} from 'lucide-react';
import DiffPreviewSystem from './DiffPreviewSystem';
import { useOverlayManager } from '../../services/overlay-manager';

const BrowserPreviewOverlay = ({
  isVisible,
  onClose,
  filePath,
  coreCode, // Immutable core code
  currentEditedCode, // Current code being edited
  onCodeChange, // Callback when patches are applied
  onPublish, // Callback when publishing overlay
  onRollback, // Callback when rolling back
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [overlayStats, setOverlayStats] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [visualDiff, setVisualDiff] = useState(null);
  const dragRef = useRef(null);
  const overlayRef = useRef(null);
  const { 
    manager: overlayManager, 
    stats: managerStats, 
    getMergedContent, 
    createOverlay, 
    setOriginalCode,
    clearFileOverlays,
    removeOverlay 
  } = useOverlayManager();

  // Initialize overlay when component mounts or filePath changes
  useEffect(() => {
    if (filePath && coreCode) {
      setOriginalCode(filePath, coreCode);
      
      // Apply current edited code as overlay if different from core
      if (currentEditedCode && currentEditedCode !== coreCode) {
        createOverlay(filePath, currentEditedCode, {
          changeType: 'live_edit',
          changeSummary: 'Live editing changes'
        });
        
        // Notify parent component about the code change
        const newAppliedCode = getMergedContent(filePath);
        onCodeChange?.(newAppliedCode);
      }
      
      updateOverlayData();
    }
  }, [filePath, coreCode, currentEditedCode, setOriginalCode, createOverlay, getMergedContent, onCodeChange]);

  // Update overlay data
  const updateOverlayData = () => {
    if (!filePath) return;
    
    const fileOverlays = overlayManager.getFileOverlays(filePath);
    const stats = managerStats;
    const mergedContent = getMergedContent(filePath);
    
    setOverlays(fileOverlays);
    setOverlayStats({
      filePath,
      patchCount: fileOverlays.length,
      isDirty: fileOverlays.length > 0,
      hasChanges: mergedContent !== coreCode,
      coreSize: coreCode.length,
      appliedSize: mergedContent.length,
      sizeDiff: mergedContent.length - coreCode.length,
      lastModified: fileOverlays.length > 0 ? fileOverlays[0].updatedAt : Date.now()
    });
    
    setVisualDiff({
      filePath,
      coreCode: coreCode,
      appliedCode: mergedContent,
      overlays: fileOverlays
    });
  };

  // Handle overlay operations
  const handleRemoveOverlay = (overlayId) => {
    if (removeOverlay(overlayId)) {
      updateOverlayData();
      const newAppliedCode = getMergedContent(filePath);
      onCodeChange?.(newAppliedCode);
    }
  };

  const handleRevertToOverlay = (overlayId) => {
    // For overlay manager, we can't revert to a specific overlay easily
    // Instead, remove all overlays created after this one
    const fileOverlays = overlayManager.getFileOverlays(filePath);
    const targetIndex = fileOverlays.findIndex(o => o.id === overlayId);
    
    if (targetIndex >= 0) {
      // Remove overlays after the target
      fileOverlays.slice(0, targetIndex).forEach(overlay => {
        removeOverlay(overlay.id);
      });
      updateOverlayData();
      const newAppliedCode = getMergedContent(filePath);
      onCodeChange?.(newAppliedCode);
    }
  };

  const handlePublish = () => {
    // For overlay manager, publish means we have finalized the overlay
    const publishedData = {
      filePath,
      appliedCode: getMergedContent(filePath),
      overlayCount: overlayManager.getFileOverlays(filePath).length
    };
    
    updateOverlayData();
    onPublish?.(publishedData);
  };

  const handleRollback = () => {
    // Clear all overlays for this file to rollback to core
    clearFileOverlays(filePath);
    updateOverlayData();
    onRollback?.(coreCode);
    onCodeChange?.(coreCode);
  };

  const handleCreateSnapshot = () => {
    // Overlay manager doesn't have snapshots, but we can log the current state
    const snapshot = {
      id: `snapshot_${Date.now()}`,
      filePath,
      overlayCount: overlayManager.getFileOverlays(filePath).length,
      timestamp: Date.now()
    };
    console.log('📸 Created snapshot reference:', snapshot.id);
  };

  // Handle dragging functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const rect = overlayRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const handleMouseMove = (e) => {
        setOverlayPosition({
          x: e.clientX - offsetX,
          y: e.clientY - offsetY
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isVisible) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      } else if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault();
        setShowDiffOnly(!showDiffOnly);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, isExpanded, showDiffOnly, onClose]);

  const overlayVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const expandedVariants = {
    compact: {
      width: '400px',
      height: '300px'
    },
    expanded: {
      width: '80vw',
      height: '80vh',
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <motion.div
          ref={overlayRef}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden ${className}`}
          style={{
            position: 'absolute',
            left: overlayPosition.x,
            top: overlayPosition.y,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleMouseDown}
        >
          <motion.div
            variants={expandedVariants}
            animate={isExpanded ? 'expanded' : 'compact'}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="drag-handle flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-900">Non-destructive Overlay</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <GitBranch className="w-3 h-3" />
                  <span>{filePath ? filePath.split('/').pop() : 'Unknown File'}</span>
                </div>
                {overlayStats && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${overlayStats.isDirty ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {overlayStats.patchCount} patch{overlayStats.patchCount !== 1 ? 'es' : ''}
                    </span>
                    {overlayStats.hasChanges && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {overlayStats.sizeDiff > 0 ? '+' : ''}{overlayStats.sizeDiff} chars
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Overlay Controls */}
                <button
                  onClick={handleCreateSnapshot}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Create snapshot"
                >
                  <History className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePublish}
                  className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                  title="Publish overlay (flatten patches)"
                  disabled={!overlayStats?.hasChanges}
                >
                  <Upload className="w-4 h-4" />
                </button>

                <button
                  onClick={handleRollback}
                  className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                  title="Rollback to core code"
                  disabled={!overlayStats?.hasChanges}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Toggle Controls */}
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                
                <button
                  onClick={() => setShowDiffOnly(!showDiffOnly)}
                  className={`p-1.5 rounded-md transition-colors ${
                    showDiffOnly 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Toggle diff-only view"
                >
                  {showDiffOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Toggle expanded view"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Close overlay (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {showDiffOnly ? (
                // Diff-only view
                <div className="h-full">
                  <DiffPreviewSystem
                    originalCode={visualDiff?.coreCode || coreCode}
                    modifiedCode={visualDiff?.appliedCode || currentEditedCode}
                    filePath={filePath}
                    compact={!isExpanded}
                    showHeader={false}
                  />
                </div>
              ) : (
                // Split view with core code + overlay patches
                <div className="h-full flex">
                  {/* Core Code Section (Immutable) */}
                  <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="px-4 py-2 bg-green-50 border-b border-gray-200 font-medium text-sm text-green-700 flex items-center gap-2">
                      <Save className="w-3 h-3" />
                      Core Code (Immutable)
                    </div>
                    <div className="flex-1 overflow-auto p-4 bg-green-50">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                        {coreCode || 'No core code available'}
                      </pre>
                    </div>
                  </div>

                  {/* Overlays Section */}
                  <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="px-4 py-2 bg-yellow-50 border-b border-gray-200 font-medium text-sm text-yellow-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3 h-3" />
                        Overlays ({overlays.length})
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                      {overlays.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 italic">
                          No overlays applied. Edit code to create overlays.
                        </div>
                      ) : (
                        <div className="space-y-2 p-2">
                          {overlays.map((overlay, index) => (
                            <div key={overlay.id} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                    #{index + 1}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {new Date(overlay.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleRevertToOverlay(overlay.id)}
                                    className="p-1 text-xs text-blue-600 hover:bg-blue-100 rounded"
                                    title="Revert to this overlay"
                                  >
                                    ↻
                                  </button>
                                  <button
                                    onClick={() => handleRemoveOverlay(overlay.id)}
                                    className="p-1 text-xs text-red-600 hover:bg-red-100 rounded"
                                    title="Remove this overlay"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {overlay.metadata?.changeSummary || overlay.metadata?.source || 'Code overlay'}
                              </div>
                              <div className="text-xs font-mono bg-gray-50 p-2 rounded max-h-20 overflow-auto">
                                <div className="text-gray-600">
                                  Size: {overlay.metadata?.size || overlay.tmpCode?.length || 0} chars
                                </div>
                                <div className="text-gray-600">
                                  Lines: {overlay.metadata?.lineCount || overlay.tmpCode?.split('\n').length || 0}
                                </div>
                                <div className="text-gray-600">
                                  Version: {overlay.metadata?.version || 1}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Applied Code Section (Core + Overlays) */}
                  <div className="w-1/3 flex flex-col">
                    <div className="px-4 py-2 bg-blue-50 border-b border-gray-200 font-medium text-sm text-blue-700 flex items-center gap-2">
                      <Code className="w-3 h-3" />
                      Applied Code (Live Preview)
                    </div>
                    <div className="flex-1 overflow-auto p-4 bg-blue-50">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                        {getMergedContent(filePath) || currentEditedCode || 'No applied code available'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with shortcuts */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
              <span>
                Non-destructive: Core code remains unchanged • Patches overlay on top
              </span>
              <span>
                Shortcuts: Esc (close), Ctrl+F (expand), Ctrl+D (diff-only)
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BrowserPreviewOverlay;