/**
 * Enhanced Overlay Service
 * Implements server-side diff merging with baseline code and accumulation logic
 */

const { CustomizationOverlay, CustomizationSnapshot } = require('../models');
const { diff_match_patch } = require('diff-match-patch');
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

class EnhancedOverlayService {
  constructor() {
    this.dmp = new diff_match_patch();
    this.cache = new Map();
    
    // Configure diff-match-patch for better performance
    this.dmp.Diff_Timeout = 1.0;
    this.dmp.Diff_EditCost = 4;
  }

  /**
   * Get merged code for a file with proper diff accumulation
   * This is the main entry point for the server-side overlay system
   */
  async getMergedCode(filePath, userId = null, options = {}) {
    try {
      const {
        includePending = false,
        maxSnapshots = 10,
        enableCaching = true
      } = options;

      console.log(`🔄 Enhanced Overlay: Getting merged code for ${filePath}`);

      // Check cache first if enabled
      const cacheKey = `${filePath}_${userId}_${includePending}`;
      if (enableCaching && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) { // 30 second cache
          console.log(`📋 Using cached result for ${filePath}`);
          return cached.result;
        }
      }

      // Find the baseline customization
      // For public access (userId = null), find any active overlay for this file
      // For authenticated users, filter by user ID
      const whereCondition = { file_path: filePath, status: 'active' };
      if (userId) {
        whereCondition.user_id = userId;
      }

      console.log(`🔍 Enhanced Overlay: Looking for overlay with conditions:`, whereCondition);

      const customization = await CustomizationOverlay.findOne({
        where: whereCondition,
        include: [{
          model: CustomizationSnapshot,
          as: 'snapshots',
          where: {
            status: includePending ? ['open', 'finalized'] : 'open'
          },
          required: false,
          limit: maxSnapshots,
          order: [['version_number', 'ASC']] // Apply changes in chronological order
        }]
      });

      if (!customization) {
        console.log(`❌ Enhanced Overlay: No customization found for ${filePath} with conditions:`, whereCondition);
        return {
          success: false,
          error: 'No customization found for file',
          hasOverlay: false,
          baselineCode: null,
          mergedCode: null
        };
      }

      console.log(`✅ Enhanced Overlay: Found customization for ${filePath}:`, {
        id: customization.id,
        userId: customization.user_id,
        storeId: customization.store_id,
        status: customization.status,
        snapshotCount: customization.snapshots?.length || 0
      });

      const baselineCode = customization.baseline_code;
      if (!baselineCode) {
        return {
          success: false,
          error: 'No baseline code available',
          hasOverlay: false,
          baselineCode: null,
          mergedCode: null
        };
      }

      // If no snapshots, return current_code or baseline
      if (!customization.snapshots || customization.snapshots.length === 0) {
        const finalCode = customization.current_code || baselineCode;
        const result = {
          success: true,
          hasOverlay: finalCode !== baselineCode,
          baselineCode,
          mergedCode: finalCode,
          appliedSnapshots: 0,
          customizationId: customization.id
        };

        if (enableCaching) {
          this.cache.set(cacheKey, { result, timestamp: Date.now() });
        }
        
        return result;
      }

      // Apply diff accumulation - merge all snapshots in order
      let mergedCode = await this.applySnapshotsSequentially(
        baselineCode, 
        customization.snapshots,
        filePath
      );

      const result = {
        success: true,
        hasOverlay: true,
        baselineCode,
        mergedCode,
        appliedSnapshots: customization.snapshots.length,
        customizationId: customization.id,
        lastModified: customization.updated_at,
        snapshots: customization.snapshots.map(s => ({
          id: s.id,
          version: s.version_number,
          changeSummary: s.change_summary,
          changeType: s.change_type,
          createdAt: s.created_at
        }))
      };

      // Cache the result
      if (enableCaching) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }

      console.log(`✅ Enhanced Overlay: Merged ${customization.snapshots.length} snapshots for ${filePath}`);
      return result;

    } catch (error) {
      console.error('❌ Enhanced Overlay: Error getting merged code:', error);
      return {
        success: false,
        error: error.message,
        hasOverlay: false,
        baselineCode: null,
        mergedCode: null
      };
    }
  }

  /**
   * Apply snapshots sequentially to accumulate all changes
   */
  async applySnapshotsSequentially(baselineCode, snapshots, filePath) {
    let currentCode = baselineCode;

    console.log(`🔄 Applying ${snapshots.length} snapshots sequentially for ${filePath}`);

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      console.log(`📝 Applying snapshot ${i + 1}/${snapshots.length}: ${snapshot.change_summary}`);

      try {
        if (snapshot.ast_diff && this.isJSFile(filePath)) {
          // Apply AST-based diff for JavaScript/JSX files
          currentCode = await this.applyASTDiff(currentCode, snapshot.ast_diff, filePath);
        } else if (snapshot.unified_diff) {
          // Apply unified diff patch
          currentCode = this.applyUnifiedDiff(currentCode, snapshot.unified_diff);
        } else {
          // Fallback: use the full current_code from the parent customization if available
          console.log(`⚠️ No diff found for snapshot ${snapshot.id}, skipping`);
        }
      } catch (error) {
        console.error(`❌ Error applying snapshot ${snapshot.id}:`, error.message);
        // Continue with next snapshot instead of failing completely
      }
    }

    return currentCode;
  }

  /**
   * Apply AST-based diff for JavaScript/JSX files
   */
  async applyASTDiff(currentCode, astDiff, filePath) {
    try {
      if (!astDiff || typeof astDiff !== 'object') {
        console.log(`⚠️ Invalid AST diff for ${filePath}`);
        return currentCode;
      }

      const ast = this.parseCode(currentCode, filePath);
      if (!ast) {
        return currentCode;
      }

      // Apply AST transformations based on diff
      if (astDiff.textChanges) {
        // Apply text content changes
        traverse(ast, {
          StringLiteral(path) {
            const change = astDiff.textChanges.find(tc => tc.old === path.node.value);
            if (change) {
              path.node.value = change.new;
            }
          },
          JSXText(path) {
            const change = astDiff.textChanges.find(tc => tc.old === path.node.value.trim());
            if (change) {
              path.node.value = change.new;
            }
          }
        });
      }

      if (astDiff.propChanges) {
        // Apply prop changes to JSX elements
        traverse(ast, {
          JSXOpeningElement(path) {
            if (astDiff.propChanges[path.node.name.name]) {
              const changes = astDiff.propChanges[path.node.name.name];
              changes.forEach(change => {
                const existingAttr = path.node.attributes.find(
                  attr => attr.name && attr.name.name === change.prop
                );
                
                if (existingAttr && change.action === 'modify') {
                  if (t.isStringLiteral(existingAttr.value)) {
                    existingAttr.value.value = change.newValue;
                  }
                } else if (!existingAttr && change.action === 'add') {
                  const newAttr = t.jsxAttribute(
                    t.jsxIdentifier(change.prop),
                    t.stringLiteral(change.newValue)
                  );
                  path.node.attributes.push(newAttr);
                }
              });
            }
          }
        });
      }

      // Generate the modified code
      const result = generate(ast, {
        retainLines: false,
        compact: false,
        jsescOption: { quotes: 'single' }
      });

      return result.code;

    } catch (error) {
      console.error(`❌ Error applying AST diff:`, error.message);
      return currentCode; // Return original on error
    }
  }

  /**
   * Apply unified diff patch
   */
  applyUnifiedDiff(currentCode, unifiedDiff) {
    try {
      const patches = this.dmp.patch_fromText(unifiedDiff);
      const [patchedCode, results] = this.dmp.patch_apply(patches, currentCode);
      
      // Check if all patches applied successfully
      const failedPatches = results.filter(result => !result).length;
      if (failedPatches > 0) {
        console.warn(`⚠️ ${failedPatches} patches failed to apply`);
      }

      return patchedCode;
    } catch (error) {
      console.error(`❌ Error applying unified diff:`, error.message);
      return currentCode;
    }
  }

  /**
   * Parse JavaScript/JSX/TypeScript code into AST
   */
  parseCode(code, filePath) {
    try {
      const plugins = ['jsx'];
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        plugins.push('typescript');
      }

      return parse(code, {
        sourceType: 'module',
        plugins,
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        strictMode: false
      });
    } catch (error) {
      console.warn(`⚠️ Failed to parse ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Check if file is a JavaScript/JSX/TypeScript file
   */
  isJSFile(filePath) {
    return /\.(jsx?|tsx?)$/.test(filePath);
  }

  /**
   * Create a new diff from baseline to modified code
   */
  createDiff(baselineCode, modifiedCode, filePath) {
    try {
      // Create unified diff
      const diffs = this.dmp.diff_main(baselineCode, modifiedCode);
      this.dmp.diff_cleanupSemantic(diffs);
      const unifiedDiff = this.dmp.patch_toText(this.dmp.patch_make(baselineCode, diffs));

      // Create AST diff for JS files
      let astDiff = null;
      if (this.isJSFile(filePath)) {
        astDiff = this.createASTDiff(baselineCode, modifiedCode, filePath);
      }

      return {
        unifiedDiff,
        astDiff,
        stats: {
          additions: diffs.filter(d => d[0] === 1).reduce((sum, d) => sum + d[1].length, 0),
          deletions: diffs.filter(d => d[0] === -1).reduce((sum, d) => sum + d[1].length, 0),
          changes: diffs.filter(d => d[0] !== 0).length
        }
      };
    } catch (error) {
      console.error(`❌ Error creating diff:`, error.message);
      return { unifiedDiff: null, astDiff: null, stats: { additions: 0, deletions: 0, changes: 0 } };
    }
  }

  /**
   * Create AST-based diff for intelligent merging
   */
  createASTDiff(baselineCode, modifiedCode, filePath) {
    try {
      const baselineAST = this.parseCode(baselineCode, filePath);
      const modifiedAST = this.parseCode(modifiedCode, filePath);

      if (!baselineAST || !modifiedAST) {
        return null;
      }

      const astDiff = {
        textChanges: [],
        propChanges: {},
        structureChanges: []
      };

      // Extract text changes from string literals and JSX text
      const baselineTexts = new Set();
      const modifiedTexts = new Set();

      traverse(baselineAST, {
        StringLiteral(path) { baselineTexts.add(path.node.value); },
        JSXText(path) { baselineTexts.add(path.node.value.trim()); }
      });

      traverse(modifiedAST, {
        StringLiteral(path) { modifiedTexts.add(path.node.value); },
        JSXText(path) { modifiedTexts.add(path.node.value.trim()); }
      });

      // Find text changes
      modifiedTexts.forEach(newText => {
        if (!baselineTexts.has(newText) && newText.length > 0) {
          // Try to find the closest match in baseline
          const closest = [...baselineTexts].find(baseText => 
            baseText.toLowerCase().includes(newText.toLowerCase()) || 
            newText.toLowerCase().includes(baseText.toLowerCase())
          );
          
          if (closest) {
            astDiff.textChanges.push({ old: closest, new: newText });
          }
        }
      });

      return astDiff.textChanges.length > 0 || Object.keys(astDiff.propChanges).length > 0 
        ? astDiff 
        : null;

    } catch (error) {
      console.error(`❌ Error creating AST diff:`, error.message);
      return null;
    }
  }

  /**
   * Get parsed and processed code ready for browser rendering
   */
  async getProcessedCodeForBrowser(filePath, userId = null, options = {}) {
    try {
      const merged = await this.getMergedCode(filePath, userId, options);
      
      if (!merged.success || !merged.mergedCode) {
        return merged;
      }

      // Parse and prepare code for browser injection
      let processedCode = merged.mergedCode;

      // For JSX files, wrap in try-catch to prevent browser errors
      if (filePath.includes('.jsx') || filePath.includes('.tsx')) {
        processedCode = this.wrapForBrowserSafety(processedCode, filePath);
      }

      // Extract key information for browser-side application
      const extractedData = this.extractBrowserData(processedCode);

      return {
        ...merged,
        processedCode,
        extractedData,
        browserReady: true
      };

    } catch (error) {
      console.error(`❌ Error processing code for browser:`, error.message);
      return {
        success: false,
        error: error.message,
        browserReady: false
      };
    }
  }

  /**
   * Wrap code for safe browser injection
   */
  wrapForBrowserSafety(code, filePath) {
    return `
// 🎭 Enhanced Overlay Applied - ${new Date().toLocaleTimeString()}
// File: ${filePath}
try {
${code}
} catch (overlayError) {
  console.warn('Overlay code error:', overlayError);
}
`;
  }

  /**
   * Extract data for browser-side application
   */
  extractBrowserData(code) {
    try {
      const data = {
        textContent: [],
        classNames: [],
        styles: [],
        components: []
      };

      // Extract text content
      const textMatches = [...code.matchAll(/>([^<>{]+)</g)];
      data.textContent = textMatches
        .map(match => match[1].trim())
        .filter(text => text.length > 0 && !text.includes('{'));

      // Extract class names
      const classMatches = [...code.matchAll(/className=['"]([^'"]*)['"]/g)];
      data.classNames = classMatches.map(match => match[1]);

      // Extract inline styles
      const styleMatches = [...code.matchAll(/style=\{([^}]*)\}/g)];
      data.styles = styleMatches.map(match => match[1]);

      // Extract component usage
      const componentMatches = [...code.matchAll(/<([A-Z][A-Za-z0-9]*)[^>]*>/g)];
      data.components = [...new Set(componentMatches.map(match => match[1]))];

      return data;
    } catch (error) {
      console.warn(`⚠️ Error extracting browser data:`, error.message);
      return { textContent: [], classNames: [], styles: [], components: [] };
    }
  }

  /**
   * Clear cache for specific file or all files
   */
  clearCache(filePath = null) {
    if (filePath) {
      // Clear all cache entries for this file
      const keysToDelete = [];
      for (const [key] of this.cache) {
        if (key.startsWith(filePath + '_')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage()
    };
  }
}

module.exports = new EnhancedOverlayService();