const fs = require('fs').promises;
const path = require('path');

/**
 * AST Analyzer Service
 * Provides Abstract Syntax Tree analysis for JavaScript/TypeScript code
 * Supports code intelligence, symbol resolution, and safe code generation
 */
class ASTAnalyzer {
  constructor() {
    this.supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
    this.excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.env*',
      '*.log',
      'coverage',
      '.next',
      '.nuxt'
    ];
  }

  /**
   * Analyze source code and return AST with metadata
   * @param {string} sourceCode - The source code to analyze
   * @param {string} filePath - Optional file path for context
   * @returns {Object} Analysis result with AST and metadata
   */
  async analyzeCode(sourceCode, filePath = '') {
    try {
      // Basic validation
      if (!sourceCode || typeof sourceCode !== 'string') {
        return {
          success: false,
          error: 'Invalid source code provided'
        };
      }

      // Determine file type
      const fileExtension = path.extname(filePath).toLowerCase();
      const isTypeScript = ['.ts', '.tsx'].includes(fileExtension);
      const isReact = ['.jsx', '.tsx'].includes(fileExtension);

      // Simple AST-like structure extraction
      const analysis = {
        ast: this._parseSimpleAST(sourceCode, isTypeScript, isReact),
        symbols: this._extractSymbols(sourceCode),
        imports: this._extractImports(sourceCode),
        exports: this._extractExports(sourceCode),
        functions: this._extractFunctions(sourceCode),
        classes: this._extractClasses(sourceCode),
        variables: this._extractVariables(sourceCode),
        jsx: isReact ? this._extractJSXElements(sourceCode) : [],
        types: isTypeScript ? this._extractTypes(sourceCode) : [],
        metadata: {
          fileType: fileExtension,
          isTypeScript,
          isReact,
          lineCount: sourceCode.split('\n').length,
          characterCount: sourceCode.length
        }
      };

      return {
        success: true,
        ast: analysis.ast,
        symbols: analysis.symbols,
        imports: analysis.imports,
        exports: analysis.exports,
        functions: analysis.functions,
        classes: analysis.classes,
        variables: analysis.variables,
        jsx: analysis.jsx,
        types: analysis.types,
        metadata: analysis.metadata,
        suggestions: this._generateSuggestions(analysis)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate code syntax
   * @param {string} sourceCode - Code to validate
   * @param {string} filePath - File path for context
   * @returns {Object} Validation result
   */
  async validateCode(sourceCode, filePath = '') {
    try {
      // Basic syntax validation
      const errors = [];
      const warnings = [];

      // Check for basic syntax issues
      const syntaxErrors = this._checkBasicSyntax(sourceCode);
      errors.push(...syntaxErrors);

      // Check for common issues
      const commonIssues = this._checkCommonIssues(sourceCode);
      warnings.push(...commonIssues);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        score: this._calculateQualityScore(sourceCode, errors, warnings)
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{ message: error.message, line: 0, column: 0 }],
        warnings: [],
        score: 0
      };
    }
  }

  /**
   * Get code completion suggestions
   * @param {Object} params - Completion parameters
   * @returns {Object} Completion suggestions
   */
  async getCompletions({ sourceCode, filePath, position, context = {} }) {
    try {
      const line = position.line || 0;
      const column = position.column || 0;
      
      const lines = sourceCode.split('\n');
      const currentLine = lines[line] || '';
      const beforeCursor = currentLine.substring(0, column);
      const afterCursor = currentLine.substring(column);

      // Analyze context around cursor
      const completionContext = this._analyzeCompletionContext(
        sourceCode,
        lines,
        line,
        column,
        beforeCursor,
        afterCursor
      );

      // Generate suggestions based on context
      const suggestions = this._generateCompletionSuggestions(
        completionContext,
        context
      );

      return {
        success: true,
        suggestions,
        context: completionContext,
        triggerKind: this._determineTriggerKind(beforeCursor)
      };

    } catch (error) {
      return {
        success: false,
        suggestions: [],
        error: error.message
      };
    }
  }

  /**
   * Get file tree structure
   * @param {Object} params - Tree parameters
   * @returns {Object} File tree structure
   */
  async getFileTree({ basePath, includeHidden = false, excludePatterns = [] }) {
    try {
      const allExcludePatterns = [...this.excludePatterns, ...excludePatterns];
      const tree = await this._buildFileTree(basePath, includeHidden, allExcludePatterns);
      
      return {
        success: true,
        tree,
        totalFiles: this._countFiles(tree),
        totalDirectories: this._countDirectories(tree)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        tree: [],
        totalFiles: 0,
        totalDirectories: 0
      };
    }
  }

  /**
   * Parse simple AST structure
   * @private
   */
  _parseSimpleAST(sourceCode, isTypeScript, isReact) {
    const ast = {
      type: 'Program',
      body: [],
      sourceType: 'module',
      comments: this._extractComments(sourceCode),
      tokens: this._extractTokens(sourceCode)
    };

    // Add basic structure analysis
    const lines = sourceCode.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        ast.body.push({
          type: 'Statement',
          line: index + 1,
          content: trimmed,
          raw: line
        });
      }
    });

    return ast;
  }

  /**
   * Extract symbols from code
   * @private
   */
  _extractSymbols(sourceCode) {
    const symbols = [];
    const patterns = {
      function: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/g,
      variable: /(?:const|let|var)\s+(\w+)/g,
      class: /class\s+(\w+)/g,
      import: /import\s+.*?from\s+['"]([^'"]+)['"]/g
    };

    Object.entries(patterns).forEach(([type, pattern]) => {
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        const name = match[1] || match[2] || match[3];
        if (name) {
          symbols.push({
            name,
            type,
            line: sourceCode.substring(0, match.index).split('\n').length,
            character: match.index
          });
        }
      }
    });

    return symbols;
  }

  /**
   * Extract import statements
   * @private
   */
  _extractImports(sourceCode) {
    const imports = [];
    const importPattern = /import\s+(?:(\w+)|{([^}]+)}|(\w+)\s*,\s*{([^}]+)}|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importPattern.exec(sourceCode)) !== null) {
      const [fullMatch, defaultImport, namedImports, defaultWithNamed, namedWithDefault, namespaceImport, modulePath] = match;
      
      imports.push({
        modulePath,
        defaultImport: defaultImport || defaultWithNamed,
        namedImports: namedImports || namedWithDefault || '',
        namespaceImport,
        line: sourceCode.substring(0, match.index).split('\n').length,
        raw: fullMatch
      });
    }

    return imports;
  }

  /**
   * Extract export statements
   * @private
   */
  _extractExports(sourceCode) {
    const exports = [];
    const exportPatterns = [
      /export\s+default\s+(\w+)/g,
      /export\s+(?:const|let|var|function|class)\s+(\w+)/g,
      /export\s+{([^}]+)}/g
    ];

    exportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        exports.push({
          name: match[1],
          line: sourceCode.substring(0, match.index).split('\n').length,
          raw: match[0]
        });
      }
    });

    return exports;
  }

  /**
   * Extract function definitions
   * @private
   */
  _extractFunctions(sourceCode) {
    const functions = [];
    const functionPatterns = [
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      /const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g,
      /(\w+)\s*:\s*(?:async\s+)?\(([^)]*)\)\s*=>/g
    ];

    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        functions.push({
          name: match[1],
          parameters: match[2] ? match[2].split(',').map(p => p.trim()) : [],
          line: sourceCode.substring(0, match.index).split('\n').length,
          raw: match[0]
        });
      }
    });

    return functions;
  }

  /**
   * Extract class definitions
   * @private
   */
  _extractClasses(sourceCode) {
    const classes = [];
    const classPattern = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g;
    
    let match;
    while ((match = classPattern.exec(sourceCode)) !== null) {
      classes.push({
        name: match[1],
        extends: match[2],
        line: sourceCode.substring(0, match.index).split('\n').length,
        raw: match[0]
      });
    }

    return classes;
  }

  /**
   * Extract variable declarations
   * @private
   */
  _extractVariables(sourceCode) {
    const variables = [];
    const variablePattern = /(const|let|var)\s+(\w+)(?:\s*=\s*([^;,\n]+))?/g;
    
    let match;
    while ((match = variablePattern.exec(sourceCode)) !== null) {
      variables.push({
        name: match[2],
        type: match[1],
        initialValue: match[3] ? match[3].trim() : null,
        line: sourceCode.substring(0, match.index).split('\n').length,
        raw: match[0]
      });
    }

    return variables;
  }

  /**
   * Extract JSX elements
   * @private
   */
  _extractJSXElements(sourceCode) {
    const jsx = [];
    const jsxPattern = /<(\w+)(?:\s+[^>]*)?(?:\/>|>[^<]*<\/\1>)/g;
    
    let match;
    while ((match = jsxPattern.exec(sourceCode)) !== null) {
      jsx.push({
        tagName: match[1],
        line: sourceCode.substring(0, match.index).split('\n').length,
        raw: match[0]
      });
    }

    return jsx;
  }

  /**
   * Extract TypeScript types
   * @private
   */
  _extractTypes(sourceCode) {
    const types = [];
    const typePatterns = [
      /type\s+(\w+)\s*=/g,
      /interface\s+(\w+)/g,
      /enum\s+(\w+)/g
    ];

    typePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        types.push({
          name: match[1],
          line: sourceCode.substring(0, match.index).split('\n').length,
          raw: match[0]
        });
      }
    });

    return types;
  }

  /**
   * Extract comments
   * @private
   */
  _extractComments(sourceCode) {
    const comments = [];
    const commentPatterns = [
      /\/\/(.*)$/gm,
      /\/\*([\s\S]*?)\*\//g
    ];

    commentPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        comments.push({
          type: index === 0 ? 'line' : 'block',
          content: match[1].trim(),
          line: sourceCode.substring(0, match.index).split('\n').length,
          raw: match[0]
        });
      }
    });

    return comments;
  }

  /**
   * Extract tokens
   * @private
   */
  _extractTokens(sourceCode) {
    const tokens = [];
    const tokenPattern = /(\w+|[{}();,.])/g;
    
    let match;
    while ((match = tokenPattern.exec(sourceCode)) !== null) {
      tokens.push({
        value: match[1],
        type: this._getTokenType(match[1]),
        start: match.index,
        end: match.index + match[1].length
      });
    }

    return tokens;
  }

  /**
   * Get token type
   * @private
   */
  _getTokenType(token) {
    const keywords = [
      'const', 'let', 'var', 'function', 'class', 'import', 'export',
      'if', 'else', 'for', 'while', 'return', 'async', 'await'
    ];
    
    if (keywords.includes(token)) return 'keyword';
    if (/^[{}();,.]$/.test(token)) return 'punctuation';
    if (/^\w+$/.test(token)) return 'identifier';
    return 'unknown';
  }

  /**
   * Check basic syntax
   * @private
   */
  _checkBasicSyntax(sourceCode) {
    const errors = [];
    
    // Check for unmatched brackets
    const brackets = { '(': 0, '[': 0, '{': 0 };
    const closingBrackets = { ')': '(', ']': '[', '}': '{' };
    
    for (let i = 0; i < sourceCode.length; i++) {
      const char = sourceCode[i];
      if (brackets.hasOwnProperty(char)) {
        brackets[char]++;
      } else if (closingBrackets.hasOwnProperty(char)) {
        const opening = closingBrackets[char];
        if (brackets[opening] > 0) {
          brackets[opening]--;
        } else {
          errors.push({
            message: `Unmatched closing bracket: ${char}`,
            line: sourceCode.substring(0, i).split('\n').length,
            column: i - sourceCode.lastIndexOf('\n', i - 1) - 1
          });
        }
      }
    }

    // Check for unmatched opening brackets
    Object.entries(brackets).forEach(([bracket, count]) => {
      if (count > 0) {
        errors.push({
          message: `Unmatched opening bracket: ${bracket}`,
          line: 0,
          column: 0
        });
      }
    });

    return errors;
  }

  /**
   * Check common issues
   * @private
   */
  _checkCommonIssues(sourceCode) {
    const warnings = [];
    
    // Check for console.log statements
    if (sourceCode.includes('console.log')) {
      warnings.push({
        message: 'Console.log statements found - consider removing for production',
        severity: 'warning'
      });
    }

    // Check for var usage
    if (sourceCode.includes('var ')) {
      warnings.push({
        message: 'Consider using const or let instead of var',
        severity: 'info'
      });
    }

    return warnings;
  }

  /**
   * Calculate quality score
   * @private
   */
  _calculateQualityScore(sourceCode, errors, warnings) {
    let score = 100;
    score -= errors.length * 10;
    score -= warnings.length * 2;
    
    // Bonus for good practices
    if (sourceCode.includes('const ')) score += 5;
    if (sourceCode.includes('// ') || sourceCode.includes('/*')) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate suggestions
   * @private
   */
  _generateSuggestions(analysis) {
    const suggestions = [];
    
    if (analysis.functions.length === 0) {
      suggestions.push({
        type: 'suggestion',
        message: 'Consider adding functions to organize your code better',
        severity: 'info'
      });
    }

    if (analysis.imports.length > 10) {
      suggestions.push({
        type: 'suggestion',
        message: 'Many imports detected - consider organizing them',
        severity: 'info'
      });
    }

    return suggestions;
  }

  /**
   * Analyze completion context
   * @private
   */
  _analyzeCompletionContext(sourceCode, lines, line, column, beforeCursor, afterCursor) {
    const context = {
      inFunction: false,
      inClass: false,
      inComment: false,
      inString: false,
      nearDot: beforeCursor.endsWith('.'),
      nearArrow: beforeCursor.includes('=>'),
      currentWord: this._getCurrentWord(beforeCursor),
      previousWords: this._getPreviousWords(beforeCursor, 3)
    };

    // Analyze surrounding context
    const surroundingLines = lines.slice(Math.max(0, line - 5), line + 5);
    context.nearbySymbols = this._extractSymbols(surroundingLines.join('\n'));

    return context;
  }

  /**
   * Generate completion suggestions
   * @private
   */
  _generateCompletionSuggestions(completionContext, context) {
    const suggestions = [];
    
    // JavaScript/React common completions
    const commonCompletions = [
      { label: 'console.log', kind: 'function', detail: 'Log to console' },
      { label: 'useState', kind: 'function', detail: 'React state hook' },
      { label: 'useEffect', kind: 'function', detail: 'React effect hook' },
      { label: 'function', kind: 'keyword', detail: 'Function declaration' },
      { label: 'const', kind: 'keyword', detail: 'Constant declaration' },
      { label: 'return', kind: 'keyword', detail: 'Return statement' }
    ];

    // Filter based on context
    if (completionContext.nearDot) {
      suggestions.push(
        { label: 'map', kind: 'method', detail: 'Array map method' },
        { label: 'filter', kind: 'method', detail: 'Array filter method' },
        { label: 'reduce', kind: 'method', detail: 'Array reduce method' }
      );
    } else {
      suggestions.push(...commonCompletions);
    }

    // Add nearby symbols
    completionContext.nearbySymbols.forEach(symbol => {
      if (!suggestions.find(s => s.label === symbol.name)) {
        suggestions.push({
          label: symbol.name,
          kind: symbol.type,
          detail: `Local ${symbol.type}`
        });
      }
    });

    return suggestions;
  }

  /**
   * Determine trigger kind
   * @private
   */
  _determineTriggerKind(beforeCursor) {
    if (beforeCursor.endsWith('.')) return 'dot';
    if (beforeCursor.endsWith('(')) return 'function';
    return 'invoked';
  }

  /**
   * Get current word
   * @private
   */
  _getCurrentWord(text) {
    const match = text.match(/(\w+)$/);
    return match ? match[1] : '';
  }

  /**
   * Get previous words
   * @private
   */
  _getPreviousWords(text, count) {
    const words = text.match(/\w+/g);
    return words ? words.slice(-count) : [];
  }

  /**
   * Build file tree
   * @private
   */
  async _buildFileTree(dirPath, includeHidden, excludePatterns) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const tree = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip hidden files if not requested
        if (!includeHidden && entry.name.startsWith('.')) continue;
        
        // Skip excluded patterns
        if (excludePatterns.some(pattern => entry.name.includes(pattern))) continue;

        const node = {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          extension: entry.isFile() ? path.extname(entry.name) : null,
          isSupported: entry.isFile() ? this.supportedExtensions.includes(path.extname(entry.name)) : false
        };

        if (entry.isDirectory()) {
          try {
            node.children = await this._buildFileTree(fullPath, includeHidden, excludePatterns);
          } catch (error) {
            // Skip directories we can't read
            node.children = [];
          }
        }

        tree.push(node);
      }

      return tree.sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    } catch (error) {
      return [];
    }
  }

  /**
   * Count files in tree
   * @private
   */
  _countFiles(tree) {
    let count = 0;
    tree.forEach(node => {
      if (node.type === 'file') {
        count++;
      } else if (node.children) {
        count += this._countFiles(node.children);
      }
    });
    return count;
  }

  /**
   * Count directories in tree
   * @private
   */
  _countDirectories(tree) {
    let count = 0;
    tree.forEach(node => {
      if (node.type === 'directory') {
        count++;
        if (node.children) {
          count += this._countDirectories(node.children);
        }
      }
    });
    return count;
  }

  /**
   * Calculate diff between two code analyses
   * @param {Object} beforeAnalysis - Analysis of code before changes
   * @param {Object} afterAnalysis - Analysis of code after changes
   * @returns {Object} Diff object with changes
   */
  calculateDiff(beforeAnalysis, afterAnalysis) {
    try {
      const diff = {
        type: 'ast_diff',
        timestamp: new Date().toISOString(),
        changes: {
          functions: this._calculateSymbolDiff(beforeAnalysis.functions || [], afterAnalysis.functions || []),
          variables: this._calculateSymbolDiff(beforeAnalysis.variables || [], afterAnalysis.variables || []),
          classes: this._calculateSymbolDiff(beforeAnalysis.classes || [], afterAnalysis.classes || []),
          imports: this._calculateSymbolDiff(beforeAnalysis.imports || [], afterAnalysis.imports || []),
          exports: this._calculateSymbolDiff(beforeAnalysis.exports || [], afterAnalysis.exports || []),
          jsx: this._calculateSymbolDiff(beforeAnalysis.jsx || [], afterAnalysis.jsx || []),
          types: this._calculateSymbolDiff(beforeAnalysis.types || [], afterAnalysis.types || [])
        },
        summary: {
          hasChanges: false,
          additionsCount: 0,
          modificationsCount: 0,
          deletionsCount: 0
        }
      };

      // Calculate summary statistics
      Object.values(diff.changes).forEach(symbolDiff => {
        if (symbolDiff.added.length > 0 || symbolDiff.modified.length > 0 || symbolDiff.removed.length > 0) {
          diff.summary.hasChanges = true;
        }
        diff.summary.additionsCount += symbolDiff.added.length;
        diff.summary.modificationsCount += symbolDiff.modified.length;
        diff.summary.deletionsCount += symbolDiff.removed.length;
      });

      return diff;
    } catch (error) {
      console.warn('Error calculating AST diff:', error.message);
      return {
        type: 'ast_diff',
        timestamp: new Date().toISOString(),
        changes: {},
        summary: { hasChanges: false, additionsCount: 0, modificationsCount: 0, deletionsCount: 0 },
        error: error.message
      };
    }
  }

  /**
   * Extract affected symbols from a diff
   * @param {Object} astDiff - The AST diff object
   * @returns {Array} Array of affected symbols
   */
  extractAffectedSymbols(astDiff) {
    try {
      const affectedSymbols = [];

      if (!astDiff || !astDiff.changes) {
        return affectedSymbols;
      }

      Object.entries(astDiff.changes).forEach(([symbolType, symbolDiff]) => {
        // Add symbols that were added
        symbolDiff.added?.forEach(symbol => {
          affectedSymbols.push({
            name: symbol.name || symbol.tagName || symbol.modulePath || 'unknown',
            type: symbolType,
            changeType: 'added',
            line: symbol.line,
            raw: symbol.raw
          });
        });

        // Add symbols that were modified
        symbolDiff.modified?.forEach(symbol => {
          affectedSymbols.push({
            name: symbol.name || symbol.tagName || symbol.modulePath || 'unknown',
            type: symbolType,
            changeType: 'modified',
            line: symbol.line,
            raw: symbol.raw
          });
        });

        // Add symbols that were removed
        symbolDiff.removed?.forEach(symbol => {
          affectedSymbols.push({
            name: symbol.name || symbol.tagName || symbol.modulePath || 'unknown',
            type: symbolType,
            changeType: 'removed',
            line: symbol.line,
            raw: symbol.raw
          });
        });
      });

      return affectedSymbols;
    } catch (error) {
      console.warn('Error extracting affected symbols:', error.message);
      return [];
    }
  }

  /**
   * Calculate diff for specific symbol types
   * @private
   */
  _calculateSymbolDiff(beforeSymbols, afterSymbols) {
    const diff = {
      added: [],
      modified: [],
      removed: []
    };

    // Create maps for efficient lookup
    const beforeMap = new Map();
    const afterMap = new Map();

    beforeSymbols.forEach(symbol => {
      const key = this._getSymbolKey(symbol);
      beforeMap.set(key, symbol);
    });

    afterSymbols.forEach(symbol => {
      const key = this._getSymbolKey(symbol);
      afterMap.set(key, symbol);
    });

    // Find added symbols (in after but not in before)
    afterMap.forEach((symbol, key) => {
      if (!beforeMap.has(key)) {
        diff.added.push(symbol);
      }
    });

    // Find removed symbols (in before but not in after)
    beforeMap.forEach((symbol, key) => {
      if (!afterMap.has(key)) {
        diff.removed.push(symbol);
      }
    });

    // Find modified symbols (in both but different)
    beforeMap.forEach((beforeSymbol, key) => {
      const afterSymbol = afterMap.get(key);
      if (afterSymbol && this._symbolsAreDifferent(beforeSymbol, afterSymbol)) {
        diff.modified.push({
          before: beforeSymbol,
          after: afterSymbol,
          ...afterSymbol // Use after symbol as the base for modified symbol
        });
      }
    });

    return diff;
  }

  /**
   * Get a unique key for a symbol for comparison
   * @private
   */
  _getSymbolKey(symbol) {
    // Different symbol types use different identifiers
    return symbol.name || symbol.tagName || symbol.modulePath || symbol.raw || JSON.stringify(symbol);
  }

  /**
   * Check if two symbols are different
   * @private
   */
  _symbolsAreDifferent(before, after) {
    // Compare key properties based on symbol type
    const compareProps = ['parameters', 'initialValue', 'extends', 'namedImports', 'defaultImport'];
    
    for (const prop of compareProps) {
      if (before[prop] !== after[prop]) {
        // For arrays, do a deep comparison
        if (Array.isArray(before[prop]) && Array.isArray(after[prop])) {
          if (JSON.stringify(before[prop]) !== JSON.stringify(after[prop])) {
            return true;
          }
        } else if (before[prop] !== after[prop]) {
          return true;
        }
      }
    }

    // Compare line numbers (indicates position changes)
    return before.line !== after.line;
  }
}

module.exports = ASTAnalyzer;