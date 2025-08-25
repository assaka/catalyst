/**
 * Unified Diff Format Generator
 * Creates proper unified diff patches in standard format for text changes
 */

/**
 * Generate a unified diff between original and modified code
 * @param {string} originalCode - Original code content
 * @param {string} modifiedCode - Modified code content
 * @param {string} fileName - File name for diff header (optional)
 * @returns {Object} Unified diff object with patch and metadata
 */
function generateUnifiedDiff(originalCode, modifiedCode, fileName = 'file') {
  if (!originalCode && !modifiedCode) {
    return {
      type: 'unified_diff',
      hasChanges: false,
      patch: '',
      stats: { additions: 0, deletions: 0, modifications: 0 },
      timestamp: new Date().toISOString()
    };
  }

  // Handle null/undefined cases
  const original = originalCode || '';
  const modified = modifiedCode || '';
  
  if (original === modified) {
    return {
      type: 'unified_diff',
      hasChanges: false,
      patch: '',
      stats: { additions: 0, deletions: 0, modifications: 0 },
      timestamp: new Date().toISOString()
    };
  }

  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  // Generate the diff using a simple LCS-based approach
  const diff = computeLineDiff(originalLines, modifiedLines);
  const unifiedPatch = formatUnifiedDiff(diff, originalLines, modifiedLines, fileName);
  
  // Calculate statistics
  let additions = 0;
  let deletions = 0;
  
  diff.forEach(change => {
    if (change.type === 'add') additions++;
    if (change.type === 'del') deletions++;
  });
  
  return {
    type: 'unified_diff',
    hasChanges: diff.length > 0,
    patch: unifiedPatch,
    stats: {
      additions,
      deletions,
      modifications: 0, // In unified diff, modifications are shown as del+add
      totalChanges: additions + deletions
    },
    metadata: {
      originalLinesCount: originalLines.length,
      modifiedLinesCount: modifiedLines.length,
      hunks: countHunks(diff)
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Compute line-by-line differences between original and modified lines
 * @param {Array} originalLines - Original file lines
 * @param {Array} modifiedLines - Modified file lines
 * @returns {Array} Array of change objects
 */
function computeLineDiff(originalLines, modifiedLines) {
  const changes = [];
  const originalLen = originalLines.length;
  const modifiedLen = modifiedLines.length;
  
  // Simple diff algorithm - can be enhanced with Myers' algorithm for better results
  let origIndex = 0;
  let modIndex = 0;
  
  while (origIndex < originalLen || modIndex < modifiedLen) {
    if (origIndex >= originalLen) {
      // Remaining lines are additions
      changes.push({
        type: 'add',
        originalLineNum: null,
        modifiedLineNum: modIndex + 1,
        content: modifiedLines[modIndex]
      });
      modIndex++;
    } else if (modIndex >= modifiedLen) {
      // Remaining lines are deletions
      changes.push({
        type: 'del',
        originalLineNum: origIndex + 1,
        modifiedLineNum: null,
        content: originalLines[origIndex]
      });
      origIndex++;
    } else if (originalLines[origIndex] === modifiedLines[modIndex]) {
      // Lines are the same - record as unchanged for context
      changes.push({
        type: 'same',
        originalLineNum: origIndex + 1,
        modifiedLineNum: modIndex + 1,
        content: originalLines[origIndex]
      });
      origIndex++;
      modIndex++;
    } else {
      // Lines are different - look ahead to see if it's a modification or insertion/deletion
      let found = false;
      
      // Look for the modified line in the next few lines of original
      for (let look = 1; look <= Math.min(5, originalLen - origIndex); look++) {
        if (originalLines[origIndex + look] === modifiedLines[modIndex]) {
          // Found match - delete the intervening lines
          for (let del = 0; del < look; del++) {
            changes.push({
              type: 'del',
              originalLineNum: origIndex + del + 1,
              modifiedLineNum: null,
              content: originalLines[origIndex + del]
            });
          }
          origIndex += look;
          found = true;
          break;
        }
      }
      
      if (!found) {
        // Look for the original line in the next few lines of modified
        for (let look = 1; look <= Math.min(5, modifiedLen - modIndex); look++) {
          if (modifiedLines[modIndex + look] === originalLines[origIndex]) {
            // Found match - add the intervening lines
            for (let add = 0; add < look; add++) {
              changes.push({
                type: 'add',
                originalLineNum: null,
                modifiedLineNum: modIndex + add + 1,
                content: modifiedLines[modIndex + add]
              });
            }
            modIndex += look;
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        // Treat as a deletion followed by an addition
        changes.push({
          type: 'del',
          originalLineNum: origIndex + 1,
          modifiedLineNum: null,
          content: originalLines[origIndex]
        });
        changes.push({
          type: 'add',
          originalLineNum: null,
          modifiedLineNum: modIndex + 1,
          content: modifiedLines[modIndex]
        });
        origIndex++;
        modIndex++;
      }
    }
  }
  
  return changes;
}

/**
 * Format changes into unified diff format
 * @param {Array} changes - Array of change objects
 * @param {Array} originalLines - Original file lines
 * @param {Array} modifiedLines - Modified file lines
 * @param {string} fileName - File name for diff header
 * @returns {string} Formatted unified diff patch
 */
function formatUnifiedDiff(changes, originalLines, modifiedLines, fileName) {
  if (changes.length === 0) {
    return '';
  }
  
  let patch = '';
  
  // Add diff header
  patch += `--- a/${fileName}\n`;
  patch += `+++ b/${fileName}\n`;
  
  // Group changes into hunks
  const hunks = groupChangesIntoHunks(changes, originalLines, modifiedLines);
  
  for (const hunk of hunks) {
    // Add hunk header
    const oldStart = hunk.originalStart;
    const oldCount = hunk.originalCount;
    const newStart = hunk.modifiedStart;
    const newCount = hunk.modifiedCount;
    
    patch += `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@\n`;
    
    // Add hunk content
    for (const change of hunk.changes) {
      switch (change.type) {
        case 'same':
          patch += ` ${change.content}\n`;
          break;
        case 'del':
          patch += `-${change.content}\n`;
          break;
        case 'add':
          patch += `+${change.content}\n`;
          break;
      }
    }
  }
  
  return patch;
}

/**
 * Group changes into hunks with context lines
 * @param {Array} changes - Array of change objects
 * @param {Array} originalLines - Original file lines
 * @param {Array} modifiedLines - Modified file lines
 * @returns {Array} Array of hunk objects
 */
function groupChangesIntoHunks(changes, originalLines, modifiedLines) {
  const hunks = [];
  const contextLines = 3; // Standard context lines
  
  // Filter out unchanged lines for grouping, but keep some for context
  const significantChanges = changes.filter((change, index) => {
    if (change.type !== 'same') return true;
    
    // Keep context lines around changes
    const hasChangeNearby = (offset) => {
      const nearbyIndex = index + offset;
      return nearbyIndex >= 0 && 
             nearbyIndex < changes.length && 
             changes[nearbyIndex].type !== 'same';
    };
    
    for (let offset = -contextLines; offset <= contextLines; offset++) {
      if (offset !== 0 && hasChangeNearby(offset)) {
        return true;
      }
    }
    
    return false;
  });
  
  if (significantChanges.length === 0) {
    return hunks;
  }
  
  // For now, create a single hunk with all changes
  // This can be enhanced to create multiple hunks for better organization
  const firstChange = significantChanges[0];
  const lastChange = significantChanges[significantChanges.length - 1];
  
  const originalStart = Math.max(1, (firstChange.originalLineNum || firstChange.modifiedLineNum || 1) - contextLines);
  const modifiedStart = Math.max(1, (firstChange.modifiedLineNum || firstChange.originalLineNum || 1) - contextLines);
  
  hunks.push({
    originalStart,
    originalCount: significantChanges.filter(c => c.originalLineNum !== null).length + contextLines * 2,
    modifiedStart,
    modifiedCount: significantChanges.filter(c => c.modifiedLineNum !== null).length + contextLines * 2,
    changes: significantChanges
  });
  
  return hunks;
}

/**
 * Count the number of hunks in a diff
 * @param {Array} changes - Array of change objects
 * @returns {number} Number of hunks
 */
function countHunks(changes) {
  // Simplified - for now just return 1 if there are changes
  return changes.length > 0 ? 1 : 0;
}

/**
 * Apply a unified diff patch to original code
 * @param {string} originalCode - Original code content
 * @param {string} patch - Unified diff patch
 * @returns {string} Modified code after applying patch
 */
function applyUnifiedDiff(originalCode, patch) {
  if (!patch || patch.trim() === '') {
    return originalCode;
  }
  
  const originalLines = originalCode.split('\n');
  const patchLines = patch.split('\n');
  
  // Start with a copy of the original
  const result = [...originalLines];
  let currentLineIndex = 0;
  let inHunk = false;
  
  for (let i = 0; i < patchLines.length; i++) {
    const line = patchLines[i];
    
    // Skip header lines (--- and +++)
    if (line.startsWith('---') || line.startsWith('+++')) {
      continue;
    }
    
    if (line.startsWith('@@')) {
      // Parse hunk header to get starting line numbers
      const hunkMatch = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (hunkMatch) {
        currentLineIndex = parseInt(hunkMatch[1]) - 1; // Convert to 0-based for original
        inHunk = true;
      }
    } else if (inHunk) {
      if (line.startsWith(' ')) {
        // Context line - advance both pointers
        currentLineIndex++;
      } else if (line.startsWith('-')) {
        // Deletion - remove line at current index
        result.splice(currentLineIndex, 1);
        // Don't advance currentLineIndex since we removed a line
      } else if (line.startsWith('+')) {
        // Addition - insert line at current index
        result.splice(currentLineIndex, 0, line.substring(1));
        currentLineIndex++; // Advance since we added a line
      }
    }
  }
  
  return result.join('\n');
}

module.exports = {
  generateUnifiedDiff,
  applyUnifiedDiff
};