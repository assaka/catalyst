import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Diff Preview System Component
 * Displays visual diffs for manual code edits with expandable hunks
 */
const DiffPreviewSystem = ({ 
  fileName = '',
  className,
  onCopyDiff
}) => {
  const [expandedHunks, setExpandedHunks] = useState(new Set());
  const [copiedHunks, setCopiedHunks] = useState(new Set());
  const [hybridPatches, setHybridPatches] = useState(null);

  // Toggle hunk expansion
  const toggleHunk = useCallback((hunkIndex) => {
    setExpandedHunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hunkIndex)) {
        newSet.delete(hunkIndex);
      } else {
        newSet.add(hunkIndex);
      }
      return newSet;
    });
  }, []);

  // Copy hunk to clipboard
  const copyHunk = useCallback(async (hunk, hunkIndex) => {
    try {
      const hunkText = hunk.changes
        .map(change => {
          const prefix = change.type === 'add' ? '+' : change.type === 'del' ? '-' : ' ';
          return `${prefix}${change.content}`;
        })
        .join('\n');
      
      await navigator.clipboard.writeText(hunkText);
      
      setCopiedHunks(prev => new Set(prev).add(hunkIndex));
      setTimeout(() => {
        setCopiedHunks(prev => {
          const newSet = new Set(prev);
          newSet.delete(hunkIndex);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy hunk:', error);
    }
  }, []);

  // Copy entire diff to clipboard
  const copyEntireDiff = useCallback(async () => {
    if (!hybridPatches?.diffHunks) return;

    try {
      const diffText = hybridPatches.diffHunks
        .flatMap(hunk => hunk.changes)
        .map(change => {
          const prefix = change.type === 'add' ? '+' : change.type === 'del' ? '-' : ' ';
          return `${prefix}${change.content}`;
        })
        .join('\n');
      
      await navigator.clipboard.writeText(diffText);
      onCopyDiff?.(diffText);
    } catch (error) {
      console.error('Failed to copy diff:', error);
    }
  }, [hybridPatches, onCopyDiff]);

  // Memoized statistics from hybrid patches
  const stats = useMemo(() => {
    if (!hybridPatches?.diffHunks) return null;
    
    const additions = hybridPatches.diffHunks.reduce((acc, hunk) => 
      acc + hunk.changes.filter(c => c.type === 'add').length, 0);
    const deletions = hybridPatches.diffHunks.reduce((acc, hunk) => 
      acc + hunk.changes.filter(c => c.type === 'del').length, 0);
    const modifications = hybridPatches.diffHunks.reduce((acc, hunk) => 
      acc + hunk.changes.filter(c => c.type === 'normal').length, 0);
    
    return { additions, deletions, modifications };
  }, [hybridPatches]);

  // Clear hybrid patches when file changes
  useEffect(() => {
    setHybridPatches(null);
  }, [fileName]);

  // Listen for hybrid customization patches loaded from database
  useEffect(() => {
    const handleHybridPatchesLoaded = (event) => {
      console.log('🎯 DiffPreviewSystem received hybridPatchesLoaded event:', {
        currentFileName: fileName,
        eventFilePath: event.detail?.file?.path,
        patchesCount: event.detail?.patches?.length || 0,
        eventDetail: event.detail
      });
      
      const { file, patches } = event.detail;
      if (file.path === fileName && patches.length > 0) {
        console.log('📋 Hybrid patches loaded in DiffPreviewSystem:', patches);
        const latestPatch = patches[0];
        
        console.log('🔍 Checking latest patch for diffHunks:', {
          patchId: latestPatch.id,
          hasDiffHunks: !!latestPatch.diffHunks,
          diffHunksCount: latestPatch.diffHunks?.length || 0
        });
        
        if (latestPatch.diffHunks && latestPatch.diffHunks.length > 0) {
          console.log('✅ Setting hybrid patches in DiffPreviewSystem');
          setHybridPatches(latestPatch);
        } else {
          console.log('❌ Latest patch has no diffHunks, not setting patches');
          setHybridPatches(null);
        }
      } else if (file.path === fileName && patches.length === 0) {
        console.log('📭 No patches for current file, clearing hybrid patches');
        setHybridPatches(null);
      } else {
        console.log('🔄 Event is for different file or no match:', {
          eventForFile: file.path,
          currentFile: fileName,
          pathsMatch: file.path === fileName
        });
      }
    };

    window.addEventListener('hybridPatchesLoaded', handleHybridPatchesLoaded);
    return () => window.removeEventListener('hybridPatchesLoaded', handleHybridPatchesLoaded);
  }, [fileName]);

  // Memoized hunks from hybrid patches
  const hunks = useMemo(() => {
    if (!hybridPatches?.diffHunks) return [];
    return hybridPatches.diffHunks;
  }, [hybridPatches]);

  if (!hybridPatches || !hybridPatches.diffHunks || hybridPatches.diffHunks.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hybrid customizations detected</p>
          <p className="text-xs mt-1">Create a customization or select a file with version history to see patches</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-white dark:bg-gray-900", className)}>
      {/* Header with Stats */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Hybrid Customization Diff
          </h3>
          <button
            onClick={copyEntireDiff}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copy entire diff"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        
        {fileName && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {fileName}
          </div>
        )}

        {stats && (
          <div className="flex items-center space-x-4 text-xs">
            <span className="text-gray-700 dark:text-gray-300">
              {stats.additions + stats.deletions} changes
            </span>
            {stats.additions > 0 && (
              <span className="text-green-600 dark:text-green-400">
                +{stats.additions} additions
              </span>
            )}
            {stats.deletions > 0 && (
              <span className="text-red-600 dark:text-red-400">
                -{stats.deletions} deletions
              </span>
            )}
            {stats.modifications > 0 && (
              <span className="text-blue-600 dark:text-blue-400">
                ~{stats.modifications} modifications
              </span>
            )}
          </div>
        )}
      </div>

      {/* Diff Hunks */}
      <div className="flex-1 overflow-auto">
        {hunks.length > 0 ? (
          <div className="space-y-4 p-4">
            {hunks.map((hunk, hunkIndex) => (
              <div
                key={hunkIndex}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Hunk Header */}
                <div className="bg-gray-100 dark:bg-gray-800 p-2 flex items-center justify-between cursor-pointer">
                  <button
                    onClick={() => toggleHunk(hunkIndex)}
                    className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {expandedHunks.has(hunkIndex) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-mono">
                      @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                    </span>
                  </button>
                  
                  <button
                    onClick={() => copyHunk(hunk, hunkIndex)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy hunk"
                  >
                    {copiedHunks.has(hunkIndex) ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Hunk Content */}
                {expandedHunks.has(hunkIndex) && (
                  <div className="bg-white dark:bg-gray-900">
                    {hunk.changes.map((change, changeIndex) => (
                      <div
                        key={changeIndex}
                        className={cn(
                          "px-4 py-1 text-sm font-mono flex items-center",
                          change.type === 'add' && "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200",
                          change.type === 'del' && "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200",
                          change.type === 'normal' && "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <span className="w-4 text-center mr-2 text-xs">
                          {change.type === 'add' ? '+' : change.type === 'del' ? '-' : ' '}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all">
                          {change.content || ' '}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {change.newLine || change.oldLine || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No diff hunks available</p>
              <p className="text-xs mt-1">Changes are too small to create hunks</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50 dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Hybrid customization v{hybridPatches?.metadata?.version_number || 1} • {hybridPatches?.change_type || 'Unknown'} • {hybridPatches?.created_at ? new Date(hybridPatches.created_at).toLocaleTimeString() : 'unknown time'}
        </div>
        {hybridPatches?.metadata?.customization_name && (
          <div className="text-xs text-gray-400 text-center mt-1">
            {hybridPatches.metadata.customization_name} ({hybridPatches.metadata.component_type})
          </div>
        )}
      </div>
    </div>
  );
};

export default DiffPreviewSystem;