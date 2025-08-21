import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Diff Preview System Component
 * Displays visual diffs for manual code edits with expandable hunks
 */
const DiffPreviewSystem = ({ 
  diffResult = null,
  fileName = '',
  className,
  onCopyDiff
}) => {
  const [expandedHunks, setExpandedHunks] = useState(new Set());
  const [copiedHunks, setCopiedHunks] = useState(new Set());
  const [astDiffResult, setAstDiffResult] = useState(null);

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
    if (!diffResult?.diff) return;

    try {
      const diffText = diffResult.diff
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
  }, [diffResult, onCopyDiff]);

  // Memoized statistics - use AST diff result if available, otherwise manual diff result
  const stats = useMemo(() => {
    const activeResult = astDiffResult || diffResult;
    if (!activeResult?.summary?.stats) return null;
    return activeResult.summary.stats;
  }, [diffResult, astDiffResult]);

  // Clear AST diff result when file changes
  useEffect(() => {
    setAstDiffResult(null);
  }, [fileName]);

  // Listen for AST patches loaded from database
  useEffect(() => {
    const handleAstPatchesLoaded = (event) => {
      const { file, patches } = event.detail;
      if (file.path === fileName && patches.length > 0) {
        console.log('📋 AST patches loaded in DiffPreviewSystem:', patches);
        const latestPatch = patches[0];
        
        // Transform AST patch to diff result format that DiffPreviewSystem expects
        if (latestPatch.diffHunks && latestPatch.diffHunks.length > 0) {
          const transformedDiff = {
            hasChanges: true,
            changeCount: latestPatch.diffHunks.reduce((acc, hunk) => acc + hunk.changes.length, 0),
            timestamp: latestPatch.created_at || new Date().toISOString(),
            summary: {
              stats: {
                additions: latestPatch.diffHunks.reduce((acc, hunk) => 
                  acc + hunk.changes.filter(c => c.type === 'add').length, 0),
                deletions: latestPatch.diffHunks.reduce((acc, hunk) => 
                  acc + hunk.changes.filter(c => c.type === 'del').length, 0),
                modifications: latestPatch.diffHunks.reduce((acc, hunk) => 
                  acc + hunk.changes.filter(c => c.type === 'normal').length, 0)
              },
              hunks: latestPatch.diffHunks
            }
          };
          setAstDiffResult(transformedDiff);
        }
      } else if (file.path === fileName && patches.length === 0) {
        // Clear AST diff result if no patches found for this file
        setAstDiffResult(null);
      }
    };

    window.addEventListener('astPatchesLoaded', handleAstPatchesLoaded);
    return () => window.removeEventListener('astPatchesLoaded', handleAstPatchesLoaded);
  }, [fileName]);

  // Memoized hunks - use AST diff result if available, otherwise manual diff result
  const hunks = useMemo(() => {
    const activeResult = astDiffResult || diffResult;
    if (!activeResult?.summary?.hunks) return [];
    return activeResult.summary.hunks;
  }, [diffResult, astDiffResult]);

  const activeResult = astDiffResult || diffResult;
  if (!activeResult || !activeResult.hasChanges) {
    return (
      <div className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No changes detected</p>
          <p className="text-xs mt-1">Select a file with changes or edit code to see diff patches</p>
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
            {astDiffResult ? 'AST Diff Patches' : 'Manual Edit Preview'}
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
          {astDiffResult ? 'AST patches from database' : 'Manual edits'} • Detected at {activeResult.timestamp ? new Date(activeResult.timestamp).toLocaleTimeString() : 'unknown time'}
        </div>
      </div>
    </div>
  );
};

export default DiffPreviewSystem;