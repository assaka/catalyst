/**
 * Overlay Merge Service
 * Merges baseline code with database overlays at the data level instead of DOM manipulation
 */

import { parse } from '@babel/parser';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export class OverlayMergeService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Merge baseline code with overlays to produce final code
   */
  async mergeCodeWithOverlays(baselineCode, overlays, fileName) {
    try {
      console.log(`🔄 OverlayMergeService: Merging ${overlays.length} overlays for ${fileName}`);
      
      // If no overlays, return baseline
      if (!overlays || overlays.length === 0) {
        return {
          success: true,
          mergedCode: baselineCode,
          appliedOverlays: 0
        };
      }

      // Sort overlays by priority and timestamp
      const sortedOverlays = overlays.sort((a, b) => {
        // Higher priority first, then by timestamp (newer first)
        if (a.priority !== b.priority) {
          return (b.priority || 1) - (a.priority || 1);
        }
        return new Date(b.updatedAt || b.created_at) - new Date(a.updatedAt || a.created_at);
      });

      let mergedCode = baselineCode;
      let appliedCount = 0;

      for (const overlay of sortedOverlays) {
        if (overlay.status === 'active' && overlay.current_code) {
          // For now, use the latest overlay's current_code as the final result
          // In the future, this could be enhanced to merge multiple overlays intelligently
          mergedCode = overlay.current_code;
          appliedCount++;
          console.log(`✅ Applied overlay: ${overlay.name || 'Unnamed'}`);
        }
      }

      return {
        success: true,
        mergedCode,
        appliedOverlays: appliedCount,
        baselineLength: baselineCode.length,
        mergedLength: mergedCode.length
      };

    } catch (error) {
      console.error('❌ OverlayMergeService: Error merging overlays:', error);
      return {
        success: false,
        error: error.message,
        mergedCode: baselineCode, // Fallback to baseline
        appliedOverlays: 0
      };
    }
  }

  /**
   * Smart merge using AST parsing for React/JSX files
   */
  async mergeWithASTAnalysis(baselineCode, overlayCode, fileName) {
    try {
      // Only use AST analysis for JS/JSX/TS/TSX files
      if (!/\.(jsx?|tsx?)$/.test(fileName)) {
        return overlayCode; // Simple replacement for non-JS files
      }

      console.log(`🧠 OverlayMergeService: Using AST analysis for ${fileName}`);

      // Parse both baseline and overlay code
      const baselineAST = this.parseCode(baselineCode, fileName);
      const overlayAST = this.parseCode(overlayCode, fileName);

      if (!baselineAST || !overlayAST) {
        // If parsing fails, fall back to simple replacement
        return overlayCode;
      }

      // Merge ASTs intelligently
      const mergedAST = this.mergeASTs(baselineAST, overlayAST);

      // Generate code from merged AST
      const { code } = generate(mergedAST, {
        retainLines: false,
        compact: false
      });

      return code;

    } catch (error) {
      console.warn('⚠️ AST merge failed, using simple replacement:', error.message);
      return overlayCode;
    }
  }

  /**
   * Parse code into AST
   */
  parseCode(code, fileName) {
    try {
      const plugins = ['jsx'];
      
      // Add TypeScript plugin for TS files
      if (/\.tsx?$/.test(fileName)) {
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
      console.warn(`⚠️ Failed to parse ${fileName}:`, error.message);
      return null;
    }
  }

  /**
   * Merge two ASTs intelligently
   */
  mergeASTs(baselineAST, overlayAST) {
    // For now, prefer overlay AST completely
    // This can be enhanced to merge specific parts (imports, functions, etc.)
    return overlayAST;
  }

  /**
   * Extract changes between baseline and overlay code
   */
  extractChanges(baselineCode, overlayCode) {
    const changes = {
      hasChanges: false,
      styleChanges: [],
      textChanges: [],
      structureChanges: []
    };

    try {
      // Extract style changes (CSS-in-JS, styled-components, className changes)
      const overlayStyleMatches = [
        ...overlayCode.matchAll(/styled\.\w+`([^`]*)`/gs),
        ...overlayCode.matchAll(/css`([^`]*)`/gs),
        ...overlayCode.matchAll(/className=['"]([^'"]*)['"]/g),
        ...overlayCode.matchAll(/style=\{([^}]*)\}/g)
      ];

      const baselineStyleMatches = [
        ...baselineCode.matchAll(/styled\.\w+`([^`]*)`/gs),
        ...baselineCode.matchAll(/css`([^`]*)`/gs),
        ...baselineCode.matchAll(/className=['"]([^'"]*)['"]/g),
        ...baselineCode.matchAll(/style=\{([^}]*)\}/g)
      ];

      // Compare style changes
      overlayStyleMatches.forEach(match => {
        const style = match[1];
        const hasEquivalentInBaseline = baselineStyleMatches.some(baseMatch => 
          baseMatch[1] === style
        );
        
        if (!hasEquivalentInBaseline) {
          changes.styleChanges.push({
            type: 'style',
            value: style,
            context: match[0]
          });
          changes.hasChanges = true;
        }
      });

      // Extract text content changes
      const overlayTextMatches = [...overlayCode.matchAll(/>([^<>{]+)</g)];
      const baselineTextMatches = [...baselineCode.matchAll(/>([^<>{]+)</g)];

      overlayTextMatches.forEach(match => {
        const text = match[1].trim();
        if (text && text.length > 0) {
          const hasEquivalentInBaseline = baselineTextMatches.some(baseMatch =>
            baseMatch[1].trim() === text
          );

          if (!hasEquivalentInBaseline) {
            changes.textChanges.push({
              type: 'text',
              value: text,
              context: match[0]
            });
            changes.hasChanges = true;
          }
        }
      });

      // Extract component structure changes (new components, props, etc.)
      const overlayComponentMatches = [...overlayCode.matchAll(/<([A-Z]\w*)[^>]*>/g)];
      const baselineComponentMatches = [...baselineCode.matchAll(/<([A-Z]\w*)[^>]*>/g)];

      overlayComponentMatches.forEach(match => {
        const component = match[0];
        const hasEquivalentInBaseline = baselineComponentMatches.some(baseMatch =>
          baseMatch[0] === component
        );

        if (!hasEquivalentInBaseline) {
          changes.structureChanges.push({
            type: 'component',
            value: component,
            componentName: match[1]
          });
          changes.hasChanges = true;
        }
      });

    } catch (error) {
      console.warn('⚠️ Error extracting changes:', error.message);
    }

    return changes;
  }

  /**
   * Create a preview-safe merged code that can be injected into iframe
   */
  createPreviewCode(mergedCode, fileName) {
    try {
      // For React components, wrap in error boundary
      if (fileName.includes('.jsx') || fileName.includes('.tsx')) {
        return `
// 🎭 Preview Overlay Applied
${mergedCode}
`;
      }

      return mergedCode;
    } catch (error) {
      console.warn('⚠️ Error creating preview code:', error.message);
      return mergedCode;
    }
  }

  /**
   * Clear cache for a specific file
   */
  clearCache(fileName) {
    if (fileName) {
      this.cache.delete(fileName);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get merge statistics
   */
  getStats() {
    return {
      cachedFiles: this.cache.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }
}

// Default instance
export const overlayMergeService = new OverlayMergeService();
export default overlayMergeService;