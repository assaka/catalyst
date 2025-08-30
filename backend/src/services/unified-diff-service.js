/**
 * Unified Diff Service
 * Handles line-based diffs using standard unified diff format
 * Replaces character-level diff-match-patch implementation
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const execAsync = promisify(exec);

class UnifiedDiffService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create temp directory:', error.message);
    }
  }

  /**
   * Create a unified diff between two pieces of code
   */
  async createUnifiedDiff(originalCode, modifiedCode, filePath = 'file.txt') {
    try {
      // Normalize line endings to prevent false diffs
      const normalizeLineEndings = (text) => {
        if (!text) return text;
        return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      };
      
      const normalizedOriginal = normalizeLineEndings(originalCode);
      const normalizedModified = normalizeLineEndings(modifiedCode);
      
      // If content is identical after normalization, return empty diff
      if (normalizedOriginal === normalizedModified) {
        console.log(`📋 UnifiedDiffService: No real changes after line ending normalization for ${filePath}`);
        return '';
      }
      
      const timestamp = new Date().toISOString();
      const originalFile = path.join(this.tempDir, `original_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      const modifiedFile = path.join(this.tempDir, `modified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

      console.log(`🔍 UnifiedDiffService Debug for ${filePath}:`);
      console.log(`  Original content length: ${normalizedOriginal?.length || 0}`);
      console.log(`  Modified content length: ${normalizedModified?.length || 0}`);
      console.log(`  Content are identical: ${normalizedOriginal === normalizedModified}`);
      console.log(`  Original first 100 chars: ${(normalizedOriginal || '').substring(0, 100)}...`);
      console.log(`  Modified first 100 chars: ${(normalizedModified || '').substring(0, 100)}...`);
      
      // Find the exact character difference
      if (normalizedOriginal !== normalizedModified) {
        for (let i = 0; i < Math.max(normalizedOriginal.length, normalizedModified.length); i++) {
          if (normalizedOriginal[i] !== normalizedModified[i]) {
            const context = 20;
            const start = Math.max(0, i - context);
            const end = Math.min(Math.max(normalizedOriginal.length, normalizedModified.length), i + context + 1);
            
            console.log(`  🎯 First difference at position ${i}:`);
            console.log(`    Original char: "${normalizedOriginal[i] || 'EOF'}" (code: ${normalizedOriginal.charCodeAt(i) || 'N/A'})`);
            console.log(`    Modified char: "${normalizedModified[i] || 'EOF'}" (code: ${normalizedModified.charCodeAt(i) || 'N/A'})`);
            console.log(`    Original context: "${normalizedOriginal.substring(start, end).replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`);
            console.log(`    Modified context: "${normalizedModified.substring(start, end).replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`);
            break;
          }
        }
      }

      // Write normalized files to temp location
      await fs.writeFile(originalFile, normalizedOriginal);
      await fs.writeFile(modifiedFile, normalizedModified);

      // Verify what was actually written to files
      const writtenOriginal = await fs.readFile(originalFile, 'utf8');
      const writtenModified = await fs.readFile(modifiedFile, 'utf8');
      
      console.log(`  Written original length: ${writtenOriginal.length}`);
      console.log(`  Written modified length: ${writtenModified.length}`);
      console.log(`  Written files identical: ${writtenOriginal === writtenModified}`);

      try {
        // Use git diff for high-quality unified diff with maximum sensitivity
        const gitCommand = `git diff --no-index --no-prefix --minimal --ignore-space-at-eol --ignore-blank-lines=false "${originalFile}" "${modifiedFile}" || true`;
        console.log(`  Git command: ${gitCommand}`);
        
        const { stdout } = await execAsync(gitCommand);
        
        console.log(`  Git diff stdout length: ${stdout.length}`);
        console.log(`  Git diff stdout preview: ${stdout.substring(0, 200)}`);
        
        // Clean up temp files
        await fs.unlink(originalFile).catch(() => {});
        await fs.unlink(modifiedFile).catch(() => {});

        if (!stdout.trim()) {
          console.log(`  ❌ Git diff returned empty - no changes detected by git`);
          console.log(`  🔄 Falling back to simple diff implementation since git missed the changes`);
          
          // Since we know the files are different, use the fallback
          return this.createSimpleUnifiedDiff(originalCode, modifiedCode, filePath);
        }

        // Clean up the diff to use proper file paths
        const lines = stdout.split('\n');
        const cleanedLines = [];
        
        for (const line of lines) {
          if (line.startsWith('---')) {
            cleanedLines.push(`--- a/${filePath}`);
          } else if (line.startsWith('+++')) {
            cleanedLines.push(`+++ b/${filePath}`);
          } else {
            cleanedLines.push(line);
          }
        }

        return cleanedLines.join('\n');

      } catch (error) {
        // Fallback to simple line-by-line diff if git fails
        console.warn('Git diff failed, using fallback:', error.message);
        return this.createSimpleUnifiedDiff(originalCode, modifiedCode, filePath);
      }

    } catch (error) {
      console.error('Error creating unified diff:', error);
      return null;
    }
  }

  /**
   * Fallback simple unified diff implementation
   */
  createSimpleUnifiedDiff(originalCode, modifiedCode, filePath = 'file.txt') {
    console.log(`  🔄 Using fallback simple unified diff`);
    
    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');

    console.log(`  Original lines: ${originalLines.length}, Modified lines: ${modifiedLines.length}`);

    // Simple line-by-line comparison
    const result = [`--- a/${filePath}`, `+++ b/${filePath}`];
    let changes = [];
    let changeStart = -1;
    let changeEnd = -1;

    // Find all changed lines
    for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';

      if (originalLine !== modifiedLine) {
        if (changeStart === -1) {
          changeStart = i;
        }
        changeEnd = i;
        
        if (i < originalLines.length) {
          changes.push({ type: 'delete', line: originalLine, lineNum: i });
        }
        if (i < modifiedLines.length) {
          changes.push({ type: 'add', line: modifiedLine, lineNum: i });
        }
      }
    }

    if (changes.length > 0) {
      console.log(`  Found ${changes.length} line changes from line ${changeStart + 1} to ${changeEnd + 1}`);
      
      // Create a single hunk with 3 lines of context
      const contextBefore = 3;
      const contextAfter = 3;
      const hunkStart = Math.max(0, changeStart - contextBefore);
      const hunkEnd = Math.min(Math.max(originalLines.length, modifiedLines.length), changeEnd + contextAfter + 1);
      
      const origHunkStart = hunkStart + 1;
      const origHunkLength = Math.min(originalLines.length - hunkStart, hunkEnd - hunkStart);
      const newHunkStart = hunkStart + 1;
      const newHunkLength = Math.min(modifiedLines.length - hunkStart, hunkEnd - hunkStart);
      
      result.push(`@@ -${origHunkStart},${origHunkLength} +${newHunkStart},${newHunkLength} @@`);
      
      // Add context lines before changes
      for (let i = hunkStart; i < changeStart; i++) {
        if (i < originalLines.length) {
          result.push(` ${originalLines[i]}`);
        }
      }
      
      // Add the changes
      for (const change of changes) {
        if (change.type === 'delete') {
          result.push(`-${change.line}`);
        } else if (change.type === 'add') {
          result.push(`+${change.line}`);
        }
      }
      
      // Add context lines after changes
      for (let i = changeEnd + 1; i < hunkEnd && i < Math.max(originalLines.length, modifiedLines.length); i++) {
        if (i < originalLines.length) {
          result.push(` ${originalLines[i]}`);
        } else if (i < modifiedLines.length) {
          result.push(` ${modifiedLines[i]}`);
        }
      }
    }

    const finalDiff = result.length > 2 ? result.join('\n') : null;
    console.log(`  Simple diff result length: ${finalDiff?.length || 0}`);
    console.log(`  Simple diff preview: ${finalDiff?.substring(0, 200) || 'null'}...`);
    
    return finalDiff;
  }

  /**
   * Output a hunk in unified diff format
   */
  outputHunk(result, originalLines, modifiedLines, start, end, changes) {
    const contextEnd = Math.min(originalLines.length, end + 3);
    const hunkOrigStart = start + 1;
    const hunkOrigLength = contextEnd - start;
    const hunkNewStart = start + 1;
    const hunkNewLength = contextEnd - start;

    result.push(`@@ -${hunkOrigStart},${hunkOrigLength} +${hunkNewStart},${hunkNewLength} @@`);

    // Add context lines before changes
    for (let i = start; i < Math.min(start + 3, originalLines.length) && !changes.some(c => c.lineNum === i + 1); i++) {
      result.push(` ${originalLines[i]}`);
    }

    // Add changes
    for (const change of changes) {
      if (change.type === 'delete') {
        result.push(`-${change.line}`);
      } else if (change.type === 'add') {
        result.push(`+${change.line}`);
      }
    }

    // Add context lines after changes
    const lastChangeIndex = Math.max(...changes.map(c => c.lineNum - 1));
    for (let i = lastChangeIndex + 1; i < Math.min(lastChangeIndex + 4, originalLines.length); i++) {
      result.push(` ${originalLines[i]}`);
    }
  }

  /**
   * Apply a unified diff to code
   */
  async applyUnifiedDiff(originalCode, unifiedDiff) {
    try {
      if (!unifiedDiff || !unifiedDiff.trim()) {
        return originalCode;
      }

      const timestamp = Date.now();
      const originalFile = path.join(this.tempDir, `apply_original_${timestamp}_${Math.random().toString(36).substr(2, 9)}`);
      const diffFile = path.join(this.tempDir, `apply_diff_${timestamp}_${Math.random().toString(36).substr(2, 9)}.patch`);

      // Write files
      await fs.writeFile(originalFile, originalCode);
      await fs.writeFile(diffFile, unifiedDiff);

      try {
        // Apply patch using git apply
        const { stdout } = await execAsync(`cd "${path.dirname(originalFile)}" && git apply --ignore-space-change --ignore-whitespace "${diffFile}" --apply --check --no-index`, {
          input: originalCode
        });

        // Read the result
        const result = await fs.readFile(originalFile, 'utf8');
        
        // Clean up
        await fs.unlink(originalFile).catch(() => {});
        await fs.unlink(diffFile).catch(() => {});

        return result;

      } catch (error) {
        console.warn('Git apply failed, using fallback:', error.message);
        return this.applySimpleUnifiedDiff(originalCode, unifiedDiff);
      }

    } catch (error) {
      console.error('Error applying unified diff:', error);
      return originalCode;
    }
  }

  /**
   * Fallback simple unified diff application
   */
  applySimpleUnifiedDiff(originalCode, unifiedDiff) {
    const originalLines = originalCode.split('\n');
    const diffLines = unifiedDiff.split('\n');
    const result = [...originalLines];

    let i = 0;
    while (i < diffLines.length) {
      const line = diffLines[i];

      if (line.startsWith('@@')) {
        // Parse hunk header
        const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
        if (!match) {
          i++;
          continue;
        }

        const oldStart = parseInt(match[1]) - 1; // Convert to 0-based
        let currentLine = oldStart;
        i++; // Move past hunk header

        // Process hunk
        while (i < diffLines.length && !diffLines[i].startsWith('@@')) {
          const hunkLine = diffLines[i];

          if (hunkLine.startsWith(' ')) {
            // Context line - should match
            currentLine++;
          } else if (hunkLine.startsWith('-')) {
            // Delete line
            if (currentLine < result.length) {
              result.splice(currentLine, 1);
            }
          } else if (hunkLine.startsWith('+')) {
            // Add line
            result.splice(currentLine, 0, hunkLine.substring(1));
            currentLine++;
          }
          i++;
        }
      } else {
        i++;
      }
    }

    return result.join('\n');
  }

  /**
   * Parse a unified diff to extract change information
   */
  parseUnifiedDiff(unifiedDiff) {
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
        if (line.startsWith('+')) {
          currentHunk.changes.push({
            type: 'add',
            content: line.substring(1)
          });
        } else if (line.startsWith('-')) {
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
   * Create a reverse diff (swap additions and deletions)
   */
  createReverseDiff(unifiedDiff) {
    if (!unifiedDiff) return null;

    const lines = unifiedDiff.split('\n');
    const result = [];

    for (const line of lines) {
      if (line.startsWith('---')) {
        result.push(line.replace('---', '+++'));
      } else if (line.startsWith('+++')) {
        result.push(line.replace('+++', '---'));
      } else if (line.startsWith('+')) {
        result.push('-' + line.substring(1));
      } else if (line.startsWith('-')) {
        result.push('+' + line.substring(1));
      } else if (line.startsWith('@@')) {
        // Swap the line ranges
        const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)/);
        if (match) {
          const oldStart = match[1];
          const oldLength = match[2] || '1';
          const newStart = match[3];
          const newLength = match[4] || '1';
          const context = match[5] || '';
          result.push(`@@ -${newStart},${newLength} +${oldStart},${oldLength} @@${context}`);
        } else {
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Remove specific line changes from a unified diff
   */
  removeLineFromDiff(unifiedDiff, targetContent, originalContent) {
    if (!unifiedDiff) return null;

    const lines = unifiedDiff.split('\n');
    const result = [];
    let currentHunk = [];
    let inHunk = false;
    let hunkModified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('@@')) {
        // Process previous hunk
        if (inHunk && currentHunk.length > 0) {
          if (!hunkModified) {
            result.push(...currentHunk);
          }
          currentHunk = [];
          hunkModified = false;
        }

        currentHunk = [line];
        inHunk = true;
      } else if (inHunk) {
        if (line.startsWith('+')) {
          const addedContent = line.substring(1).trim();
          
          // Check if this is the line we want to remove
          if (this.contentMatches(addedContent, targetContent)) {
            hunkModified = true;
            console.log(`Removing line: ${addedContent}`);
            continue; // Skip this line
          }
        }
        
        currentHunk.push(line);
      } else {
        result.push(line);
      }
    }

    // Process final hunk
    if (inHunk && currentHunk.length > 0) {
      if (!hunkModified) {
        result.push(...currentHunk);
      }
    }

    const resultDiff = result.join('\n').trim();
    return resultDiff || '';
  }

  /**
   * Check if content matches for removal purposes
   */
  contentMatches(content1, content2) {
    if (!content1 || !content2) return false;

    // Exact match
    if (content1.trim() === content2.trim()) return true;

    // Remove HTML tags and compare
    const stripHtml = (str) => str.replace(/<[^>]*>/g, '').trim();
    const clean1 = stripHtml(content1);
    const clean2 = stripHtml(content2);
    
    if (clean1 === clean2) return true;

    // Word-level matching for single word changes
    const words1 = clean1.split(/\s+/).filter(w => w.length > 0);
    const words2 = clean2.split(/\s+/).filter(w => w.length > 0);
    
    // Single word replacement
    if (words1.length === 1 && words2.length === 1) {
      return words1[0] === words2[0];
    }

    // Contains match
    return clean1.includes(clean2) || clean2.includes(clean1);
  }

  /**
   * Generate hash for content
   */
  generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Validate that a diff is properly formatted
   */
  validateDiff(unifiedDiff) {
    if (!unifiedDiff || typeof unifiedDiff !== 'string') {
      return false;
    }

    const lines = unifiedDiff.split('\n');
    let hasHeader = false;
    let hasHunk = false;

    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++')) {
        hasHeader = true;
      } else if (line.startsWith('@@')) {
        hasHunk = true;
      }
    }

    return hasHeader && hasHunk;
  }
}

module.exports = new UnifiedDiffService();