/**
 * Line-based diff utility for efficient patch storage
 * Only stores changes, not full code, to optimize storage
 */

/**
 * Generate a line-based diff between original and modified code
 * @param {string} originalCode - Original code content  
 * @param {string} modifiedCode - Modified code content
 * @returns {Object} Diff object with changes and metadata
 */
function generateLineDiff(originalCode, modifiedCode) {
  if (!originalCode || !modifiedCode) {
    return {
      type: 'line_diff',
      hasChanges: false,
      changes: [],
      stats: { additions: 0, deletions: 0, modifications: 0 },
      timestamp: new Date().toISOString()
    };
  }

  const originalLines = originalCode.split('\n');
  const modifiedLines = modifiedCode.split('\n');
  
  const changes = [];
  let additions = 0, deletions = 0, modifications = 0;
  
  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = i < originalLines.length ? originalLines[i] : null;
    const modifiedLine = i < modifiedLines.length ? modifiedLines[i] : null;
    
    if (originalLine === null && modifiedLine !== null) {
      // Line added
      changes.push({
        type: 'add',
        lineNumber: i + 1,
        content: modifiedLine,
        oldContent: null
      });
      additions++;
    } else if (originalLine !== null && modifiedLine === null) {
      // Line deleted
      changes.push({
        type: 'del',
        lineNumber: i + 1,
        content: null,
        oldContent: originalLine
      });
      deletions++;
    } else if (originalLine !== modifiedLine) {
      // Line modified
      changes.push({
        type: 'mod',
        lineNumber: i + 1,
        content: modifiedLine,
        oldContent: originalLine
      });
      modifications++;
    }
    // Skip unchanged lines - don't store them
  }
  
  return {
    type: 'line_diff',
    hasChanges: changes.length > 0,
    changes,
    stats: {
      additions,
      deletions, 
      modifications,
      totalChanges: additions + deletions + modifications
    },
    metadata: {
      originalLinesCount: originalLines.length,
      modifiedLinesCount: modifiedLines.length,
      linesChanged: changes.length
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Apply a line diff to reconstruct the modified code
 * @param {string} originalCode - Original code content
 * @param {Object} lineDiff - Line diff object
 * @returns {string} Reconstructed modified code
 */
function applyLineDiff(originalCode, lineDiff) {
  if (!lineDiff || !lineDiff.hasChanges) {
    return originalCode;
  }
  
  const originalLines = originalCode.split('\n');
  const result = [...originalLines]; // Copy original
  
  // Apply changes in reverse order to maintain line numbers
  const changes = [...lineDiff.changes].sort((a, b) => b.lineNumber - a.lineNumber);
  
  for (const change of changes) {
    const lineIndex = change.lineNumber - 1; // Convert to 0-based index
    
    switch (change.type) {
      case 'add':
        result.splice(lineIndex, 0, change.content);
        break;
      case 'del':
        result.splice(lineIndex, 1);
        break;
      case 'mod':
        result[lineIndex] = change.content;
        break;
    }
  }
  
  return result.join('\n');
}

/**
 * Create a compact diff summary for UI display
 * @param {Object} lineDiff - Line diff object
 * @returns {string} Human-readable summary
 */
function createDiffSummary(lineDiff) {
  if (!lineDiff || !lineDiff.hasChanges) {
    return 'No changes';
  }
  
  const { stats } = lineDiff;
  const parts = [];
  
  if (stats.additions > 0) parts.push(`+${stats.additions} lines`);
  if (stats.deletions > 0) parts.push(`-${stats.deletions} lines`);
  if (stats.modifications > 0) parts.push(`~${stats.modifications} lines`);
  
  return parts.join(', ') || 'Modified';
}

module.exports = {
  generateLineDiff,
  applyLineDiff,
  createDiffSummary
};