/**
 * Advanced Diff Management System
 * Implements efficient diff algorithms (Myers, patience diff) with compressed storage
 */

// Myers diff algorithm implementation
class MyersDiff {
  /**
   * Compute diff using Myers algorithm with O(ND) complexity
   */
  static compute(original, newText) {
    const originalLines = this.splitIntoLines(original);
    const newLines = this.splitIntoLines(newText);

    return this.computeLineDiff(originalLines, newLines);
  }

  /**
   * Split text into lines for line-based diffing
   */
  static splitIntoLines(text) {
    if (!text) return [];
    return text.split('\n');
  }

  /**
   * Compute line-based diff using Myers algorithm
   */
  static computeLineDiff(originalLines, newLines) {
    const n = originalLines.length;
    const m = newLines.length;
    const max = n + m;

    // Forward and reverse vectors
    const v = new Array(2 * max + 1).fill(0);
    const trace = [];

    // Find the length of the longest common subsequence
    for (let d = 0; d <= max; d++) {
      const v_copy = [...v];
      trace.push(v_copy);

      for (let k = -d; k <= d; k += 2) {
        let x;
        if (k === -d || (k !== d && v[max + k - 1] < v[max + k + 1])) {
          x = v[max + k + 1];
        } else {
          x = v[max + k - 1] + 1;
        }

        let y = x - k;

        // Extend diagonal as far as possible
        while (x < n && y < m && originalLines[x] === newLines[y]) {
          x++;
          y++;
        }

        v[max + k] = x;

        // Check if we've reached the end
        if (x >= n && y >= m) {
          return this.backtrackDiff(originalLines, newLines, trace, max, d);
        }
      }
    }

    // Fallback to simple diff if Myers fails
    return this.simpleDiff(originalLines, newLines);
  }

  /**
   * Backtrack to construct the actual diff
   */
  static backtrackDiff(originalLines, newLines, trace, max, d) {
    const diff = [];
    let x = originalLines.length;
    let y = newLines.length;

    for (let depth = d; depth >= 0; depth--) {
      const v = trace[depth];
      const k = x - y;

      let prevK;
      if (k === -depth || (k !== depth && v[max + k - 1] < v[max + k + 1])) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = v[max + prevK];
      const prevY = prevX - prevK;

      // Add common lines
      while (x > prevX && y > prevY) {
        x--;
        y--;
        diff.unshift({
          type: 'equal',
          oldIndex: x,
          newIndex: y,
          value: originalLines[x]
        });
      }

      // Add deletion or insertion
      if (depth > 0) {
        if (x > prevX) {
          diff.unshift({
            type: 'delete',
            oldIndex: x - 1,
            value: originalLines[x - 1]
          });
        } else {
          diff.unshift({
            type: 'insert',
            newIndex: y - 1,
            value: newLines[y - 1]
          });
        }
      }

      x = prevX;
      y = prevY;
    }

    return this.optimizeDiff(diff);
  }

  /**
   * Simple diff fallback for edge cases
   */
  static simpleDiff(originalLines, newLines) {
    const diff = [];
    const maxLen = Math.max(originalLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = originalLines[i];
      const newLine = newLines[i];

      if (oldLine === newLine && oldLine !== undefined) {
        diff.push({
          type: 'equal',
          oldIndex: i,
          newIndex: i,
          value: oldLine
        });
      } else {
        if (oldLine !== undefined) {
          diff.push({
            type: 'delete',
            oldIndex: i,
            value: oldLine
          });
        }
        if (newLine !== undefined) {
          diff.push({
            type: 'insert',
            newIndex: i,
            value: newLine
          });
        }
      }
    }

    return this.optimizeDiff(diff);
  }

  /**
   * Optimize diff by combining adjacent changes
   */
  static optimizeDiff(diff) {
    if (!diff.length) return diff;

    const optimized = [];
    let current = diff[0];

    for (let i = 1; i < diff.length; i++) {
      const next = diff[i];

      // Combine adjacent changes of same type
      if (current.type === next.type && current.type !== 'equal') {
        if (Array.isArray(current.value)) {
          current.value.push(next.value);
        } else {
          current.value = [current.value, next.value];
        }
        current.endIndex = next.newIndex || next.oldIndex;
      } else {
        optimized.push(current);
        current = next;
      }
    }

    optimized.push(current);
    return optimized;
  }
}

// Patience diff algorithm for better readability
class PatienceDiff {
  /**
   * Compute diff using patience algorithm (good for code)
   */
  static compute(original, newText) {
    const originalLines = original.split('\n');
    const newLines = newText.split('\n');

    return this.computePatienceDiff(originalLines, newLines);
  }

  /**
   * Main patience diff algorithm
   */
  static computePatienceDiff(original, newArr) {
    // Find unique lines that appear exactly once in both arrays
    const uniqueOriginal = this.findUniqueLines(original);
    const uniqueNew = this.findUniqueLines(newArr);
    
    const commonUnique = new Map();
    
    for (const [line, indices] of uniqueOriginal) {
      if (uniqueNew.has(line)) {
        commonUnique.set(line, {
          original: indices[0],
          new: uniqueNew.get(line)[0]
        });
      }
    }

    // Find longest common subsequence of unique lines
    const lcs = this.longestCommonSubsequence(Array.from(commonUnique.values()));
    
    // Recursively diff the sections between LCS matches
    return this.buildDiffFromLCS(original, newArr, lcs, 0, 0, 0);
  }

  /**
   * Find lines that appear exactly once
   */
  static findUniqueLines(lines) {
    const counts = new Map();
    const indices = new Map();

    lines.forEach((line, index) => {
      if (counts.has(line)) {
        counts.set(line, counts.get(line) + 1);
      } else {
        counts.set(line, 1);
        indices.set(line, [index]);
      }
    });

    // Return only unique lines (count = 1)
    const unique = new Map();
    for (const [line, count] of counts) {
      if (count === 1) {
        unique.set(line, indices.get(line));
      }
    }

    return unique;
  }

  /**
   * Find longest common subsequence
   */
  static longestCommonSubsequence(matches) {
    if (!matches.length) return [];

    // Sort by original position
    matches.sort((a, b) => a.original - b.original);

    // Use patience sorting on new positions
    const patience = [];
    
    for (const match of matches) {
      let insertPos = patience.length;
      
      // Binary search for insertion position
      let left = 0;
      let right = patience.length;
      
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (patience[mid].new < match.new) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      
      patience[left] = match;
    }

    return patience;
  }

  /**
   * Build diff from LCS matches
   */
  static buildDiffFromLCS(original, newArr, lcs, origStart, newStart, lcsIndex) {
    const diff = [];

    if (lcsIndex >= lcs.length) {
      // Handle remaining lines
      for (let i = origStart; i < original.length; i++) {
        diff.push({ type: 'delete', oldIndex: i, value: original[i] });
      }
      for (let i = newStart; i < newArr.length; i++) {
        diff.push({ type: 'insert', newIndex: i, value: newArr[i] });
      }
      return diff;
    }

    const match = lcs[lcsIndex];
    
    // Recursively diff before this match
    const beforeDiff = MyersDiff.computeLineDiff(
      original.slice(origStart, match.original),
      newArr.slice(newStart, match.new)
    );
    
    diff.push(...beforeDiff);
    
    // Add the match
    diff.push({
      type: 'equal',
      oldIndex: match.original,
      newIndex: match.new,
      value: original[match.original]
    });

    // Recursively diff after this match
    const afterDiff = this.buildDiffFromLCS(
      original, newArr, lcs, 
      match.original + 1, match.new + 1, lcsIndex + 1
    );
    
    diff.push(...afterDiff);
    
    return diff;
  }
}

// Diff compression for storage
class DiffCompressor {
  /**
   * Compress diff for efficient storage
   */
  static compress(diff) {
    if (!diff || !diff.length) return null;

    const compressed = {
      version: '1.0',
      algorithm: 'myers',
      changes: [],
      metadata: {
        totalChanges: diff.length,
        createdAt: Date.now()
      }
    };

    for (const change of diff) {
      compressed.changes.push({
        t: change.type[0], // 'd', 'i', 'e' for delete, insert, equal
        o: change.oldIndex,
        n: change.newIndex,
        v: this.compressValue(change.value)
      });
    }

    return JSON.stringify(compressed);
  }

  /**
   * Decompress diff from storage
   */
  static decompress(compressedDiff) {
    if (!compressedDiff) return [];

    try {
      const compressed = JSON.parse(compressedDiff);
      const diff = [];

      const typeMap = { 'd': 'delete', 'i': 'insert', 'e': 'equal' };

      for (const change of compressed.changes) {
        diff.push({
          type: typeMap[change.t] || change.t,
          oldIndex: change.o,
          newIndex: change.n,
          value: this.decompressValue(change.v)
        });
      }

      return diff;
    } catch (error) {
      console.error('Failed to decompress diff:', error);
      return [];
    }
  }

  /**
   * Compress value (handle arrays and strings)
   */
  static compressValue(value) {
    if (Array.isArray(value)) {
      return { a: value }; // Array marker
    }
    return value;
  }

  /**
   * Decompress value
   */
  static decompressValue(compressed) {
    if (compressed && typeof compressed === 'object' && compressed.a) {
      return compressed.a; // Extract array
    }
    return compressed;
  }
}

// Main diff service
export class DiffService {
  constructor() {
    this.algorithm = 'myers'; // Default algorithm
  }

  /**
   * Create diff between original and new code
   */
  createDiff(original, newCode, options = {}) {
    const { algorithm = this.algorithm, compress = true } = options;

    try {
      let diff;

      switch (algorithm) {
        case 'patience':
          diff = PatienceDiff.compute(original, newCode);
          break;
        case 'myers':
        default:
          diff = MyersDiff.compute(original, newCode);
          break;
      }

      const result = {
        success: true,
        diff: diff,
        metadata: {
          algorithm: algorithm,
          originalLength: original.length,
          newLength: newCode.length,
          changes: diff.length,
          createdAt: Date.now()
        }
      };

      if (compress) {
        result.compressed = DiffCompressor.compress(diff);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        diff: [],
        metadata: null
      };
    }
  }

  /**
   * Apply diff to create new content
   */
  applyDiff(original, diff) {
    if (!diff || !diff.length) return original;

    const originalLines = original.split('\n');
    const result = [];
    let originalIndex = 0;

    for (const change of diff) {
      switch (change.type) {
        case 'equal':
          result.push(change.value);
          originalIndex++;
          break;
        case 'insert':
          if (Array.isArray(change.value)) {
            result.push(...change.value);
          } else {
            result.push(change.value);
          }
          break;
        case 'delete':
          originalIndex++;
          // Skip deleted lines
          break;
      }
    }

    return result.join('\n');
  }

  /**
   * Get diff statistics
   */
  getDiffStats(diff) {
    if (!diff) return null;

    const stats = {
      additions: 0,
      deletions: 0,
      modifications: 0,
      unchanged: 0
    };

    for (const change of diff) {
      switch (change.type) {
        case 'insert':
          stats.additions += Array.isArray(change.value) ? change.value.length : 1;
          break;
        case 'delete':
          stats.deletions += Array.isArray(change.value) ? change.value.length : 1;
          break;
        case 'equal':
          stats.unchanged++;
          break;
      }
    }

    // Estimate modifications (paired deletions and insertions)
    stats.modifications = Math.min(stats.additions, stats.deletions);
    stats.netAdditions = stats.additions - stats.modifications;
    stats.netDeletions = stats.deletions - stats.modifications;

    return stats;
  }

  /**
   * Create unified diff format (like git diff)
   */
  createUnifiedDiff(original, newCode, filename = 'file') {
    const diff = this.createDiff(original, newCode).diff;
    const originalLines = original.split('\n');
    const newLines = newCode.split('\n');

    let unified = `--- a/${filename}\n+++ b/${filename}\n`;
    let oldLineNum = 1;
    let newLineNum = 1;

    // Group changes into hunks
    const hunks = this.createHunks(diff, originalLines, newLines);

    for (const hunk of hunks) {
      unified += `@@ -${hunk.oldStart},${hunk.oldLength} +${hunk.newStart},${hunk.newLength} @@\n`;

      for (const line of hunk.lines) {
        unified += line + '\n';
      }
    }

    return unified;
  }

  /**
   * Create hunks for unified diff
   */
  createHunks(diff, originalLines, newLines) {
    const hunks = [];
    let currentHunk = null;
    let oldLineNum = 1;
    let newLineNum = 1;

    for (const change of diff) {
      if (change.type === 'equal') {
        if (currentHunk) {
          currentHunk.lines.push(` ${change.value}`);
        }
        oldLineNum++;
        newLineNum++;
      } else {
        // Start new hunk if needed
        if (!currentHunk) {
          currentHunk = {
            oldStart: oldLineNum,
            newStart: newLineNum,
            oldLength: 0,
            newLength: 0,
            lines: []
          };
        }

        if (change.type === 'delete') {
          const values = Array.isArray(change.value) ? change.value : [change.value];
          for (const value of values) {
            currentHunk.lines.push(`-${value}`);
            currentHunk.oldLength++;
            oldLineNum++;
          }
        } else if (change.type === 'insert') {
          const values = Array.isArray(change.value) ? change.value : [change.value];
          for (const value of values) {
            currentHunk.lines.push(`+${value}`);
            currentHunk.newLength++;
            newLineNum++;
          }
        }

        // Close hunk if we have enough context
        if (currentHunk && currentHunk.lines.length > 0) {
          hunks.push(currentHunk);
          currentHunk = null;
        }
      }
    }

    // Add final hunk if exists
    if (currentHunk && currentHunk.lines.length > 0) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  /**
   * Compress diff for storage
   */
  compressDiff(diff) {
    return DiffCompressor.compress(diff);
  }

  /**
   * Decompress diff from storage
   */
  decompressDiff(compressedDiff) {
    return DiffCompressor.decompress(compressedDiff);
  }
}

// Export instances and classes
export default DiffService;
export { MyersDiff, PatienceDiff, DiffCompressor };