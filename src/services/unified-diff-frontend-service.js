/**
 * Frontend Unified Diff Service
 * Handles line-based diffs using standard unified diff format
 * Replaces character-level diff-match-patch implementation in frontend
 */

class UnifiedDiffFrontendService {
  constructor() {
    this.cache = new Map();
  }

  
  
  // DEPRECATED: Use createDiff() with showFullFile option instead

  /**
   * Create a unified diff between two pieces of code
   */
  createUnifiedDiff(originalCode, modifiedCode, filePath = 'file.txt') {
    try {
      // Normalize line endings first
      const normalizeLineEndings = (text) => {
        if (!text) return text;
        return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      };
      
      const normalizedOriginal = normalizeLineEndings(originalCode);
      const normalizedModified = normalizeLineEndings(modifiedCode);
      
      // If content is identical after normalization, return null
      if (normalizedOriginal === normalizedModified) {
        console.log('📋 No real changes after line ending normalization:', filePath);
        return null;
      }
      
      const originalLines = this.splitIntoLines(normalizedOriginal);
      const modifiedLines = this.splitIntoLines(normalizedModified);

      if (this.arraysEqual(originalLines, modifiedLines)) {
        return null; // No changes
      }

      // Create unified diff using simple line-by-line comparison
      const diff = this.createSimpleUnifiedDiff(originalLines, modifiedLines, filePath);
      return diff;

    } catch (error) {
      console.error('Error creating unified diff:', error);
      return null;
    }
  }

  /**
   * Create a simple unified diff implementation for frontend use
   */
  createSimpleUnifiedDiff(originalLines, modifiedLines, filePath = 'file.txt') {
    const result = [`--- a/${filePath}`, `+++ b/${filePath}`];
    const changes = [];
    
    // Find changed lines
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i];
      const modifiedLine = modifiedLines[i];
      
      if (originalLine !== modifiedLine) {
        const change = {
          lineNumber: i + 1,
          original: originalLine,
          modified: modifiedLine,
          type: this.getChangeType(originalLine, modifiedLine)
        };
        changes.push(change);
      }
    }

    if (changes.length === 0) {
      return null;
    }

    // Group changes into hunks
    const hunks = this.groupIntoHunks(changes, originalLines, modifiedLines);
    
    // Generate unified diff format with proper hunk separation
    hunks.forEach((hunk, hunkIndex) => {
      const contextLines = 3;
      
      // Calculate hunk boundaries with context
      // For a proper hunk, we need to include all lines from first change to last change, plus context
      const firstChangeLineIndex = hunk.startLine; // 0-indexed
      const lastChangeLineIndex = hunk.lastChangeLineNumber - 1; // Convert to 0-indexed
      
      const hunkStart = Math.max(0, firstChangeLineIndex - contextLines);
      const hunkEnd = Math.min(originalLines.length, lastChangeLineIndex + contextLines + 1);
      
      // Calculate line counts for hunk header
      const originalLinesInHunk = hunkEnd - hunkStart;
      const modifiedLinesInHunk = originalLinesInHunk; // Same for context, adjusted for changes
      
      const oldStart = hunkStart + 1; // Convert to 1-indexed
      const newStart = hunkStart + 1; // Convert to 1-indexed
      
      result.push(`@@ -${oldStart},${originalLinesInHunk} +${newStart},${modifiedLinesInHunk} @@`);
      
      // Process each line in the hunk range
      for (let i = hunkStart; i < hunkEnd; i++) {
        const lineNumber = i + 1; // Convert to 1-indexed
        const change = hunk.changes.find(c => c.lineNumber === lineNumber);
        
        if (change) {
          // This line has changes
          if (change.type === 'modify') {
            if (change.original !== undefined) {
              result.push(`-${change.original}`);
            }
            if (change.modified !== undefined) {
              result.push(`+${change.modified}`);
            }
          } else if (change.type === 'delete' && change.original !== undefined) {
            result.push(`-${change.original}`);
          } else if (change.type === 'insert' && change.modified !== undefined) {
            result.push(`+${change.modified}`);
          }
        } else {
          // Context line (no changes)
          if (originalLines[i] !== undefined) {
            result.push(` ${originalLines[i]}`);
          }
        }
      }
    });

    return result.join('\n');
  }

  /**
   * Group changes into hunks for better readability
   */
  groupIntoHunks(changes, originalLines, modifiedLines) {
    if (!changes.length) return [];
    
    const hunks = [];
    let currentHunk = null;
    const minHunkSeparation = 6; // Minimum lines between changes to create separate hunks
    
    changes.forEach((change, index) => {
      const shouldStartNewHunk = !currentHunk || 
        (currentHunk.lastChangeLineNumber && 
         change.lineNumber > currentHunk.lastChangeLineNumber + minHunkSeparation);
      
      if (shouldStartNewHunk) {
        // Start new hunk
        if (currentHunk) {
          hunks.push(currentHunk);
        }

        currentHunk = {
          startLine: change.lineNumber - 1, // 0-indexed
          lastChangeLineNumber: change.lineNumber,
          originalLines: 0,
          modifiedLines: 0,
          changes: []
        };
      }
      
      currentHunk.changes.push(change);
      currentHunk.lastChangeLineNumber = change.lineNumber;
      
      // Update line counts
      if (change.type === 'delete') {
        currentHunk.originalLines++;
      } else if (change.type === 'insert') {
        currentHunk.modifiedLines++;
      } else if (change.type === 'modify') {
        currentHunk.originalLines++;
        currentHunk.modifiedLines++;
      }
    });
    
    if (currentHunk) {
      hunks.push(currentHunk);
    }
    
    return hunks;
  }

  /**
   * Determine the type of change
   */
  getChangeType(originalLine, modifiedLine) {
    if (originalLine === undefined) return 'insert';
    if (modifiedLine === undefined) return 'delete';
    return 'modify';
  }

  /**
   * Parse a unified diff to extract change information
   */
  parseUnifiedDiff(unifiedDiff) {
    if (!unifiedDiff) {
      return [];
    }

    const changes = [];
    const lines = unifiedDiff.split('\n');
    let currentHunk = null;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // New hunk
        const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
        if (match) {
          currentHunk = {
            oldStart: parseInt(match[1]),
            oldLength: parseInt(match[2]) || 1,
            newStart: parseInt(match[3]),
            newLength: parseInt(match[4]) || 1,
            changes: []
          };
          changes.push(currentHunk);
        }
      } else if (currentHunk) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentHunk.changes.push({
            type: 'add',
            content: line.substring(1)
          });
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentHunk.changes.push({
            type: 'delete',
            content: line.substring(1)
          });
        } else if (line.startsWith(' ')) {
          currentHunk.changes.push({
            type: 'context',
            content: line.substring(1)
          });
        }
      }
    }

    return changes;
  }

  /**
   * Get statistics about a diff
   */
  getDiffStats(unifiedDiff) {
    if (!unifiedDiff) {
      return { additions: 0, deletions: 0, changes: 0 };
    }

    const lines = unifiedDiff.split('\n');
    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      }
    }

    return {
      additions,
      deletions,
      changes: additions + deletions
    };
  }

  /**
   * Create a line-based diff (pure unified diff format)
   */
  createDiff(original, newCode, options = {}) {
    try {
      const unifiedDiff = this.createUnifiedDiff(original, newCode, options.filename || 'file');
      
      if (!unifiedDiff) {
        return {
          success: false,
          error: 'No changes detected',
          unifiedDiff: null,
          parsedDiff: [],
          metadata: null
        };
      }
      
      const stats = this.getDiffStats(unifiedDiff);
      
      return {
        success: true,
        unifiedDiff: unifiedDiff,
        parsedDiff: this.parseUnifiedDiff(unifiedDiff),
        metadata: {
          algorithm: 'unified',
          originalLength: original.length,
          newLength: newCode.length,
          changes: stats.changes,
          additions: stats.additions,
          deletions: stats.deletions,
          createdAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        unifiedDiff: null,
        parsedDiff: [],
        metadata: null
      };
    }
  }


  /**
   * Utility methods
   */
  splitIntoLines(text) {
    if (!text) return [];
    return text.split('\n');
  }

  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /**
   * Check if a diff is likely just line endings
   */
  isLineEndingOnlyDiff(originalCode, modifiedCode) {
    if (!originalCode || !modifiedCode) return false;
    
    // First check if they're exactly the same
    if (originalCode === modifiedCode) return true;
    
    const normalizeLineEndings = (text) => {
      return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    };
    
    const normalizedOriginal = normalizeLineEndings(originalCode);
    const normalizedModified = normalizeLineEndings(modifiedCode);
    
    // Only consider it line-endings-only if they're identical after normalization
    // BUT different before normalization
    const isLineEndingOnly = (originalCode !== modifiedCode) && (normalizedOriginal === normalizedModified);

    return isLineEndingOnly;
  }

  /**
   * Reconstruct original and modified code from unified diff
   * This allows us to get both versions when we only have the diff
   */
  reconstructFromUnifiedDiff(unifiedDiff, baselineHint = null) {
    if (!unifiedDiff) {
      return { success: false, error: 'No unified diff provided' };
    }

    try {
      const lines = unifiedDiff.split('\n');
      let originalLines = [];
      let modifiedLines = [];
      
      let currentOriginalLine = 1;
      let currentModifiedLine = 1;

      for (const line of lines) {
        if (line.startsWith('@@')) {
          // Parse hunk header: @@ -oldStart,oldLength +newStart,newLength @@
          const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
          if (match) {
            currentOriginalLine = parseInt(match[1]);
            currentModifiedLine = parseInt(match[3]);
          }
        } else if (line.startsWith('---') || line.startsWith('+++')) {
          // Skip file headers
          continue;
        } else if (line.startsWith(' ')) {
          // Context line (appears in both versions)
          const content = line.substring(1);
          originalLines[currentOriginalLine - 1] = content;
          modifiedLines[currentModifiedLine - 1] = content;
          currentOriginalLine++;
          currentModifiedLine++;
        } else if (line.startsWith('-')) {
          // Deleted line (only in original)
          const content = line.substring(1);
          originalLines[currentOriginalLine - 1] = content;
          currentOriginalLine++;
        } else if (line.startsWith('+')) {
          // Added line (only in modified)
          const content = line.substring(1);
          modifiedLines[currentModifiedLine - 1] = content;
          currentModifiedLine++;
        }
      }
      
      // Convert sparse arrays to dense arrays, handling empty arrays
      const originalKeys = Object.keys(originalLines).map(k => parseInt(k)).filter(k => !isNaN(k));
      const modifiedKeys = Object.keys(modifiedLines).map(k => parseInt(k)).filter(k => !isNaN(k));
      
      if (originalKeys.length === 0 && modifiedKeys.length === 0) {
        return { success: false, error: 'No lines found in unified diff' };
      }
      
      const maxOriginalLine = originalKeys.length > 0 ? Math.max(...originalKeys) + 1 : 0;
      const maxModifiedLine = modifiedKeys.length > 0 ? Math.max(...modifiedKeys) + 1 : 0;
      
      let denseOriginal = [];
      let denseModified = [];
      
      // Fill original array
      for (let i = 0; i < maxOriginalLine; i++) {
        denseOriginal[i] = originalLines[i] !== undefined ? originalLines[i] : '';
      }
      
      // Fill modified array  
      for (let i = 0; i < maxModifiedLine; i++) {
        denseModified[i] = modifiedLines[i] !== undefined ? modifiedLines[i] : '';
      }
      
      const originalCode = denseOriginal.join('\n');
      const modifiedCode = denseModified.join('\n');
      
      return {
        success: true,
        originalCode,
        modifiedCode,
        metadata: {
          originalLines: denseOriginal.length,
          modifiedLines: denseModified.length,
          reconstructedFrom: 'unified_diff'
        }
      };
      
    } catch (error) {
      console.error('Error reconstructing from unified diff:', error);
      return { 
        success: false, 
        error: error.message,
        originalCode: baselineHint || '',
        modifiedCode: baselineHint || ''
      };
    }
  }

  /**
   * Apply a unified diff to a base text to get the modified version
   */
  applyUnifiedDiff(baseText, unifiedDiff) {
    if (!baseText || !unifiedDiff) {
      return { success: false, error: 'Base text and unified diff required' };
    }

    try {
      const baseLines = baseText.split('\n');
      let modifiedLines = [...baseLines]; // Copy base lines
      const lines = unifiedDiff.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('@@')) {
          // Parse hunk header
          const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
          if (match) {
            // We could use this info for more precise application
            // For now, we'll apply changes line by line
          }
        } else if (line.startsWith(' ')) {
          // Context line - no change needed
          continue;
        } else if (line.startsWith('-')) {
          // Line to remove
          const content = line.substring(1);
          const index = modifiedLines.indexOf(content);
          if (index !== -1) {
            modifiedLines.splice(index, 1);
          }
        } else if (line.startsWith('+')) {
          // Line to add
          const content = line.substring(1);
          // This is simplified - in a full implementation we'd need
          // to track position more carefully
          modifiedLines.push(content);
        }
      }
      
      return {
        success: true,
        modifiedCode: modifiedLines.join('\n')
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default UnifiedDiffFrontendService;