/**
 * Diff Detection Service
 * Detects and analyzes differences between original and modified code
 * Generates JSON patches and visual diffs for manual code edits
 */

/**
 * Generate a simple line-based diff between two strings
 * @param {string} original - Original text
 * @param {string} modified - Modified text
 * @returns {Array} Array of diff operations
 */
export function generateLineDiff(original, modified) {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  const diff = [];
  let originalIndex = 0;
  let modifiedIndex = 0;
  
  while (originalIndex < originalLines.length || modifiedIndex < modifiedLines.length) {
    const originalLine = originalLines[originalIndex];
    const modifiedLine = modifiedLines[modifiedIndex];
    
    if (originalIndex >= originalLines.length) {
      // Added lines at the end
      diff.push({
        type: 'add',
        line: modifiedIndex + 1,
        content: modifiedLine,
        oldLine: null,
        newLine: modifiedIndex + 1
      });
      modifiedIndex++;
    } else if (modifiedIndex >= modifiedLines.length) {
      // Removed lines at the end
      diff.push({
        type: 'del',
        line: originalIndex + 1,
        content: originalLine,
        oldLine: originalIndex + 1,
        newLine: null
      });
      originalIndex++;
    } else if (originalLine === modifiedLine) {
      // Unchanged line
      diff.push({
        type: 'normal',
        line: originalIndex + 1,
        content: originalLine,
        oldLine: originalIndex + 1,
        newLine: modifiedIndex + 1
      });
      originalIndex++;
      modifiedIndex++;
    } else {
      // Look ahead to find if this is a replacement, addition, or deletion
      const lookaheadDistance = 3;
      let foundMatch = false;
      
      // Check if the modified line appears in the next few original lines (deletion)
      for (let i = 1; i <= lookaheadDistance && originalIndex + i < originalLines.length; i++) {
        if (originalLines[originalIndex + i] === modifiedLine) {
          // Lines were deleted
          for (let j = 0; j < i; j++) {
            diff.push({
              type: 'del',
              line: originalIndex + 1 + j,
              content: originalLines[originalIndex + j],
              oldLine: originalIndex + 1 + j,
              newLine: null
            });
          }
          originalIndex += i;
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        // Check if the original line appears in the next few modified lines (addition)
        for (let i = 1; i <= lookaheadDistance && modifiedIndex + i < modifiedLines.length; i++) {
          if (modifiedLines[modifiedIndex + i] === originalLine) {
            // Lines were added
            for (let j = 0; j < i; j++) {
              diff.push({
                type: 'add',
                line: modifiedIndex + 1 + j,
                content: modifiedLines[modifiedIndex + j],
                oldLine: null,
                newLine: modifiedIndex + 1 + j
              });
            }
            modifiedIndex += i;
            foundMatch = true;
            break;
          }
        }
      }
      
      if (!foundMatch) {
        // This is a replacement
        diff.push({
          type: 'del',
          line: originalIndex + 1,
          content: originalLine,
          oldLine: originalIndex + 1,
          newLine: null
        });
        diff.push({
          type: 'add',
          line: modifiedIndex + 1,
          content: modifiedLine,
          oldLine: null,
          newLine: modifiedIndex + 1
        });
        originalIndex++;
        modifiedIndex++;
      }
    }
  }
  
  return diff;
}

/**
 * Generate JSON Patch (RFC 6902) operations from a diff
 * @param {Array} diff - Diff operations from generateLineDiff
 * @returns {Array} JSON Patch operations
 */
export function generateJSONPatch(diff) {
  const patch = [];
  let lineOffset = 0;
  
  diff.forEach(operation => {
    switch (operation.type) {
      case 'add':
        patch.push({
          op: 'add',
          path: `/lines/${operation.newLine - 1 + lineOffset}`,
          value: operation.content
        });
        lineOffset++;
        break;
        
      case 'del':
        patch.push({
          op: 'remove',
          path: `/lines/${operation.oldLine - 1 + lineOffset}`
        });
        lineOffset--;
        break;
        
      case 'replace':
        patch.push({
          op: 'replace',
          path: `/lines/${operation.oldLine - 1 + lineOffset}`,
          value: operation.content
        });
        break;
    }
  });
  
  return patch;
}

/**
 * Generate a visual diff summary for display
 * @param {Array} diff - Diff operations
 * @returns {Object} Summary statistics and hunks
 */
export function generateDiffSummary(diff) {
  const stats = {
    additions: diff.filter(op => op.type === 'add').length,
    deletions: diff.filter(op => op.type === 'del').length,
    modifications: 0
  };
  
  // Group consecutive operations into hunks
  const hunks = [];
  let currentHunk = null;
  
  diff.forEach((operation, index) => {
    if (operation.type === 'normal' && currentHunk) {
      // End current hunk if we have more than 3 consecutive normal lines
      const normalCount = currentHunk.changes.reverse().findIndex(change => change.type !== 'normal');
      if (normalCount >= 3) {
        currentHunk.changes = currentHunk.changes.reverse();
        hunks.push(currentHunk);
        currentHunk = null;
      } else {
        currentHunk.changes = currentHunk.changes.reverse();
      }
    }
    
    if (operation.type !== 'normal') {
      if (!currentHunk) {
        // Start new hunk
        const contextStart = Math.max(0, index - 3);
        currentHunk = {
          oldStart: operation.oldLine || operation.line,
          newStart: operation.newLine || operation.line,
          oldLines: 0,
          newLines: 0,
          changes: []
        };
        
        // Add context lines before
        for (let i = contextStart; i < index; i++) {
          if (diff[i] && diff[i].type === 'normal') {
            currentHunk.changes.push(diff[i]);
          }
        }
      }
      
      currentHunk.changes.push(operation);
      
      if (operation.type === 'add') {
        currentHunk.newLines++;
      } else if (operation.type === 'del') {
        currentHunk.oldLines++;
      }
    } else if (currentHunk) {
      currentHunk.changes.push(operation);
    }
  });
  
  // Add final hunk if exists
  if (currentHunk) {
    hunks.push(currentHunk);
  }
  
  // Calculate modifications (paired add/del operations)
  stats.modifications = Math.min(stats.additions, stats.deletions);
  
  return {
    stats,
    hunks,
    oldFileName: 'original',
    newFileName: 'modified',
    totalChanges: stats.additions + stats.deletions
  };
}

/**
 * Detect if code has been manually edited
 * @param {string} original - Original code
 * @param {string} current - Current code
 * @returns {Object} Detection result with diff information
 */
export function detectManualEdit(original, current) {
  if (!original || !current || original === current) {
    return {
      hasChanges: false,
      diff: null,
      patch: null,
      summary: null
    };
  }
  
  const diff = generateLineDiff(original, current);
  const patch = generateJSONPatch(diff);
  const summary = generateDiffSummary(diff);
  
  return {
    hasChanges: true,
    diff,
    patch,
    summary,
    changeCount: summary.totalChanges,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a debounced diff detector
 * @param {Function} callback - Function to call when changes are detected
 * @param {number} delay - Debounce delay in milliseconds
 * @param {string} initialOriginalCode - Initial original code baseline
 * @returns {Function} Debounced detector function with setOriginal method
 */
export function createDebouncedDiffDetector(callback, delay = 500, initialOriginalCode = '') {
  let timeoutId = null;
  let originalCode = initialOriginalCode;
  
  const detectChanges = function(currentCode) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (originalCode) {
        const result = detectManualEdit(originalCode, currentCode);
        // Always call callback to handle both changes and clearing when returning to original
        callback(result);
      }
    }, delay);
  };
  
  // Add method to update the original code baseline
  detectChanges.setOriginal = function(newOriginalCode) {
    originalCode = newOriginalCode;
  };
  
  return detectChanges;
}

/**
 * Set the original code baseline for diff detection
 * @param {Function} detector - Debounced detector function
 * @param {string} code - Original code to set as baseline
 */
export function setOriginalCode(detector, code) {
  detector.originalCode = code;
}