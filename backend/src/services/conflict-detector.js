/**
 * Conflict Detector Service
 * Detects and resolves potential conflicts in code modifications
 * Provides conflict analysis and resolution suggestions
 */
class ConflictDetector {
  constructor() {
    this.conflictTypes = [
      'syntax',
      'semantic',
      'dependency',
      'scope',
      'naming',
      'type'
    ];
    this.severityLevels = ['low', 'medium', 'high', 'critical'];
  }

  /**
   * Detect conflicts in patch operations
   * @param {Object} params - Detection parameters
   * @returns {Object} Conflict detection result
   */
  async detectConflicts({ patch, sourceCode, ast, filePath }) {
    try {
      const conflicts = [];
      const warnings = [];
      const resolutions = [];

      // Analyze each patch operation for conflicts
      for (let i = 0; i < patch.length; i++) {
        const operation = patch[i];
        const operationConflicts = await this._analyzeOperation(
          operation,
          sourceCode,
          ast,
          patch,
          i
        );
        
        conflicts.push(...operationConflicts.conflicts);
        warnings.push(...operationConflicts.warnings);
        resolutions.push(...operationConflicts.resolutions);
      }

      // Analyze cross-operation conflicts
      const crossConflicts = this._analyzeCrossOperationConflicts(patch, sourceCode, ast);
      conflicts.push(...crossConflicts.conflicts);
      resolutions.push(...crossConflicts.resolutions);

      // Determine overall severity
      const severity = this._calculateOverallSeverity(conflicts);

      return {
        success: true,
        hasConflicts: conflicts.length > 0,
        conflicts,
        warnings,
        resolutions,
        severity,
        summary: this._generateConflictSummary(conflicts, warnings)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        hasConflicts: false,
        conflicts: [],
        warnings: [],
        resolutions: [],
        severity: 'unknown'
      };
    }
  }

  /**
   * Analyze changes for conflicts
   * @param {Object} params - Analysis parameters
   * @returns {Object} Analysis result
   */
  async analyzeChanges({ changes, sourceCode, filePath, context = {} }) {
    try {
      const conflicts = [];
      const resolutions = [];

      // Parse changes into analyzable format
      const changeAnalysis = this._parseChanges(changes, sourceCode);
      
      // Check for syntax conflicts
      const syntaxConflicts = await this._checkSyntaxConflicts(
        changeAnalysis,
        sourceCode,
        context
      );
      conflicts.push(...syntaxConflicts);

      // Check for semantic conflicts
      const semanticConflicts = await this._checkSemanticConflicts(
        changeAnalysis,
        sourceCode,
        context
      );
      conflicts.push(...semanticConflicts);

      // Check for dependency conflicts
      const dependencyConflicts = await this._checkDependencyConflicts(
        changeAnalysis,
        sourceCode,
        context
      );
      conflicts.push(...dependencyConflicts);

      // Generate resolutions for found conflicts
      conflicts.forEach(conflict => {
        const resolution = this._generateResolution(conflict, changeAnalysis, context);
        if (resolution) {
          resolutions.push(resolution);
        }
      });

      const severity = this._calculateOverallSeverity(conflicts);

      return {
        success: true,
        hasConflicts: conflicts.length > 0,
        conflicts,
        resolutions,
        severity
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        hasConflicts: false,
        conflicts: [],
        resolutions: [],
        severity: 'unknown'
      };
    }
  }

  /**
   * Analyze single operation for conflicts
   * @private
   */
  async _analyzeOperation(operation, sourceCode, ast, allOperations, operationIndex) {
    const conflicts = [];
    const warnings = [];
    const resolutions = [];

    // Extract operation details
    const pathParts = operation.path.split('/').filter(p => p);
    const lineIndex = parseInt(pathParts[pathParts.length - 1]);
    const lines = sourceCode.split('\n');

    switch (operation.op) {
      case 'add':
        const addConflicts = this._checkAddConflicts(operation, lines, lineIndex, ast);
        conflicts.push(...addConflicts.conflicts);
        warnings.push(...addConflicts.warnings);
        resolutions.push(...addConflicts.resolutions);
        break;

      case 'remove':
        const removeConflicts = this._checkRemoveConflicts(operation, lines, lineIndex, ast);
        conflicts.push(...removeConflicts.conflicts);
        warnings.push(...removeConflicts.warnings);
        resolutions.push(...removeConflicts.resolutions);
        break;

      case 'replace':
        const replaceConflicts = this._checkReplaceConflicts(operation, lines, lineIndex, ast);
        conflicts.push(...replaceConflicts.conflicts);
        warnings.push(...replaceConflicts.warnings);
        resolutions.push(...replaceConflicts.resolutions);
        break;

      case 'move':
        const moveConflicts = this._checkMoveConflicts(operation, lines, ast);
        conflicts.push(...moveConflicts.conflicts);
        warnings.push(...moveConflicts.warnings);
        resolutions.push(...moveConflicts.resolutions);
        break;
    }

    return { conflicts, warnings, resolutions };
  }

  /**
   * Check add operation conflicts
   * @private
   */
  _checkAddConflicts(operation, lines, lineIndex, ast) {
    const conflicts = [];
    const warnings = [];
    const resolutions = [];

    // Check if insertion point is valid
    if (lineIndex < 0 || lineIndex > lines.length) {
      conflicts.push({
        type: 'syntax',
        severity: 'high',
        message: `Invalid insertion point: line ${lineIndex}`,
        line: lineIndex,
        operation: operation.op,
        details: {
          maxValidLine: lines.length,
          requestedLine: lineIndex
        }
      });

      resolutions.push({
        type: 'auto-fix',
        message: 'Adjust insertion point to end of file',
        action: {
          op: 'replace',
          path: '/path',
          value: `/lines/${lines.length}`
        }
      });
    }

    // Check for syntax validity of new content
    if (operation.value) {
      const syntaxIssues = this._validateSyntax(operation.value);
      syntaxIssues.forEach(issue => {
        conflicts.push({
          type: 'syntax',
          severity: issue.severity,
          message: `Syntax error in added content: ${issue.message}`,
          line: lineIndex,
          operation: operation.op,
          details: issue
        });
      });
    }

    // Check for variable naming conflicts
    const namingConflicts = this._checkNamingConflicts(operation.value, ast);
    conflicts.push(...namingConflicts);

    // Check for scope conflicts
    const scopeConflicts = this._checkScopeConflicts(operation.value, lineIndex, lines);
    warnings.push(...scopeConflicts);

    return { conflicts, warnings, resolutions };
  }

  /**
   * Check remove operation conflicts
   * @private
   */
  _checkRemoveConflicts(operation, lines, lineIndex, ast) {
    const conflicts = [];
    const warnings = [];
    const resolutions = [];

    // Check if line exists
    if (lineIndex < 0 || lineIndex >= lines.length) {
      conflicts.push({
        type: 'syntax',
        severity: 'high',
        message: `Cannot remove non-existent line ${lineIndex}`,
        line: lineIndex,
        operation: operation.op,
        details: {
          maxValidLine: lines.length - 1,
          requestedLine: lineIndex
        }
      });
    } else {
      const lineContent = lines[lineIndex];
      
      // Check if removing critical code
      const criticalPatterns = [
        /import\s+.*?from/,
        /export\s+default/,
        /class\s+\w+/,
        /function\s+\w+/
      ];

      criticalPatterns.forEach(pattern => {
        if (pattern.test(lineContent)) {
          warnings.push({
            type: 'semantic',
            severity: 'medium',
            message: `Removing potentially critical code: ${lineContent.trim()}`,
            line: lineIndex,
            operation: operation.op,
            details: {
              pattern: pattern.source,
              content: lineContent
            }
          });
        }
      });

      // Check for dependency usage
      const dependencyWarnings = this._checkDependencyUsage(lineContent, ast);
      warnings.push(...dependencyWarnings);
    }

    return { conflicts, warnings, resolutions };
  }

  /**
   * Check replace operation conflicts
   * @private
   */
  _checkReplaceConflicts(operation, lines, lineIndex, ast) {
    const conflicts = [];
    const warnings = [];
    const resolutions = [];

    // Check if line exists
    if (lineIndex < 0 || lineIndex >= lines.length) {
      conflicts.push({
        type: 'syntax',
        severity: 'high',
        message: `Cannot replace non-existent line ${lineIndex}`,
        line: lineIndex,
        operation: operation.op
      });
    } else {
      const originalContent = lines[lineIndex];
      const newContent = operation.value;

      // Check syntax of new content
      const syntaxIssues = this._validateSyntax(newContent);
      syntaxIssues.forEach(issue => {
        conflicts.push({
          type: 'syntax',
          severity: issue.severity,
          message: `Syntax error in replacement content: ${issue.message}`,
          line: lineIndex,
          operation: operation.op,
          details: issue
        });
      });

      // Check for semantic changes
      const semanticChanges = this._analyzeSemanticChanges(originalContent, newContent);
      semanticChanges.forEach(change => {
        if (change.severity === 'high') {
          conflicts.push({
            type: 'semantic',
            severity: change.severity,
            message: change.message,
            line: lineIndex,
            operation: operation.op,
            details: change
          });
        } else {
          warnings.push({
            type: 'semantic',
            severity: change.severity,
            message: change.message,
            line: lineIndex,
            operation: operation.op,
            details: change
          });
        }
      });
    }

    return { conflicts, warnings, resolutions };
  }

  /**
   * Check move operation conflicts
   * @private
   */
  _checkMoveConflicts(operation, lines, ast) {
    const conflicts = [];
    const warnings = [];
    const resolutions = [];

    const fromParts = operation.from.split('/').filter(p => p);
    const toParts = operation.path.split('/').filter(p => p);
    const fromIndex = parseInt(fromParts[fromParts.length - 1]);
    const toIndex = parseInt(toParts[toParts.length - 1]);

    // Check if source line exists
    if (fromIndex < 0 || fromIndex >= lines.length) {
      conflicts.push({
        type: 'syntax',
        severity: 'high',
        message: `Cannot move from non-existent line ${fromIndex}`,
        line: fromIndex,
        operation: operation.op
      });
    }

    // Check if destination is valid
    if (toIndex < 0 || toIndex > lines.length) {
      conflicts.push({
        type: 'syntax',
        severity: 'high',
        message: `Invalid move destination: line ${toIndex}`,
        line: toIndex,
        operation: operation.op
      });
    }

    // Check for scope issues when moving
    if (fromIndex >= 0 && fromIndex < lines.length) {
      const lineContent = lines[fromIndex];
      const scopeIssues = this._checkMoveScope(lineContent, fromIndex, toIndex, lines);
      warnings.push(...scopeIssues);
    }

    return { conflicts, warnings, resolutions };
  }

  /**
   * Analyze cross-operation conflicts
   * @private
   */
  _analyzeCrossOperationConflicts(patch, sourceCode, ast) {
    const conflicts = [];
    const resolutions = [];

    // Check for operations affecting the same line
    const lineOperations = new Map();
    
    patch.forEach((operation, index) => {
      const pathParts = operation.path.split('/').filter(p => p);
      const lineIndex = parseInt(pathParts[pathParts.length - 1]);
      
      if (!isNaN(lineIndex)) {
        if (!lineOperations.has(lineIndex)) {
          lineOperations.set(lineIndex, []);
        }
        lineOperations.get(lineIndex).push({ operation, index });
      }
    });

    // Check for conflicts on same lines
    lineOperations.forEach((operations, lineIndex) => {
      if (operations.length > 1) {
        conflicts.push({
          type: 'syntax',
          severity: 'high',
          message: `Multiple operations on line ${lineIndex}`,
          line: lineIndex,
          operation: 'multiple',
          details: {
            operations: operations.map(op => op.operation.op),
            count: operations.length
          }
        });

        // Suggest merging operations
        resolutions.push({
          type: 'merge',
          message: `Merge operations on line ${lineIndex}`,
          action: 'merge_operations',
          details: {
            lineIndex,
            operations: operations
          }
        });
      }
    });

    return { conflicts, resolutions };
  }

  /**
   * Parse changes into analyzable format
   * @private
   */
  _parseChanges(changes, sourceCode) {
    if (typeof changes === 'string') {
      // Direct code replacement
      return {
        type: 'replacement',
        original: sourceCode,
        modified: changes,
        operations: []
      };
    } else if (Array.isArray(changes)) {
      // Patch operations
      return {
        type: 'patch',
        original: sourceCode,
        operations: changes
      };
    } else {
      // Object with specific change types
      return {
        type: 'structured',
        original: sourceCode,
        changes
      };
    }
  }

  /**
   * Check syntax conflicts
   * @private
   */
  async _checkSyntaxConflicts(changeAnalysis, sourceCode, context) {
    const conflicts = [];

    if (changeAnalysis.type === 'replacement') {
      const syntaxIssues = this._validateSyntax(changeAnalysis.modified);
      syntaxIssues.forEach(issue => {
        conflicts.push({
          type: 'syntax',
          severity: issue.severity,
          message: issue.message,
          line: issue.line || 0,
          operation: 'replacement',
          details: issue
        });
      });
    }

    return conflicts;
  }

  /**
   * Check semantic conflicts
   * @private
   */
  async _checkSemanticConflicts(changeAnalysis, sourceCode, context) {
    const conflicts = [];

    // Check for breaking changes in API
    if (changeAnalysis.type === 'replacement') {
      const semanticIssues = this._analyzeSemanticChanges(
        changeAnalysis.original,
        changeAnalysis.modified
      );
      
      semanticIssues.forEach(issue => {
        if (issue.severity === 'high') {
          conflicts.push({
            type: 'semantic',
            severity: issue.severity,
            message: issue.message,
            operation: 'replacement',
            details: issue
          });
        }
      });
    }

    return conflicts;
  }

  /**
   * Check dependency conflicts
   * @private
   */
  async _checkDependencyConflicts(changeAnalysis, sourceCode, context) {
    const conflicts = [];

    // Check for missing imports/dependencies
    if (changeAnalysis.type === 'replacement') {
      const dependencyIssues = this._checkMissingDependencies(
        changeAnalysis.modified,
        context
      );
      conflicts.push(...dependencyIssues);
    }

    return conflicts;
  }

  /**
   * Validate syntax
   * @private
   */
  _validateSyntax(code) {
    const issues = [];

    // Basic bracket matching
    const brackets = { '(': 0, '[': 0, '{': 0 };
    const closingBrackets = { ')': '(', ']': '[', '}': '{' };
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (brackets.hasOwnProperty(char)) {
        brackets[char]++;
      } else if (closingBrackets.hasOwnProperty(char)) {
        const opening = closingBrackets[char];
        if (brackets[opening] > 0) {
          brackets[opening]--;
        } else {
          issues.push({
            severity: 'high',
            message: `Unmatched closing bracket: ${char}`,
            position: i
          });
        }
      }
    }

    // Check for unmatched opening brackets
    Object.entries(brackets).forEach(([bracket, count]) => {
      if (count > 0) {
        issues.push({
          severity: 'high',
          message: `Unmatched opening bracket: ${bracket}`,
          count
        });
      }
    });

    // Check for basic JavaScript syntax
    const syntaxPatterns = [
      { pattern: /\bfunction\s+\w+\s*\([^)]*\)\s*{/, message: 'Function syntax looks correct' },
      { pattern: /\bconst\s+\w+\s*=/, message: 'Const declaration syntax looks correct' },
      { pattern: /\bif\s*\([^)]+\)\s*{/, message: 'If statement syntax looks correct' }
    ];

    // More sophisticated syntax checking would require a proper parser
    // This is a simplified version for demonstration

    return issues;
  }

  /**
   * Check naming conflicts
   * @private
   */
  _checkNamingConflicts(code, ast) {
    const conflicts = [];
    
    if (!code) return conflicts;

    // Extract declared names from new code
    const declaredNames = this._extractDeclaredNames(code);
    
    // Check against existing symbols in AST
    if (ast && ast.symbols) {
      declaredNames.forEach(name => {
        const existingSymbol = ast.symbols.find(symbol => symbol.name === name);
        if (existingSymbol) {
          conflicts.push({
            type: 'naming',
            severity: 'medium',
            message: `Name conflict: '${name}' already exists`,
            details: {
              newName: name,
              existingSymbol
            }
          });
        }
      });
    }

    return conflicts;
  }

  /**
   * Check scope conflicts
   * @private
   */
  _checkScopeConflicts(code, lineIndex, lines) {
    const warnings = [];
    
    if (!code) return warnings;

    // Simple scope checking - look for variable declarations in wrong scope
    if (code.includes('const ') || code.includes('let ') || code.includes('var ')) {
      // Check if we're inside a function or block
      let inFunction = false;
      let inBlock = false;
      
      for (let i = lineIndex - 1; i >= 0; i--) {
        const line = lines[i];
        if (line.includes('function ') || line.includes('=> {')) {
          inFunction = true;
          break;
        }
        if (line.includes('{')) {
          inBlock = true;
          break;
        }
      }

      if (!inFunction && !inBlock && code.includes('let ')) {
        warnings.push({
          type: 'scope',
          severity: 'low',
          message: 'Variable declaration at global scope - consider using const',
          details: { suggestion: 'const' }
        });
      }
    }

    return warnings;
  }

  /**
   * Check dependency usage
   * @private
   */
  _checkDependencyUsage(lineContent, ast) {
    const warnings = [];
    
    // Check if removing an import that might be used
    if (lineContent.includes('import ')) {
      const importMatch = lineContent.match(/import\s+(?:{([^}]+)}|(\w+))/);
      if (importMatch) {
        const importedNames = importMatch[1] ? 
          importMatch[1].split(',').map(n => n.trim()) : 
          [importMatch[2]];
        
        importedNames.forEach(name => {
          warnings.push({
            type: 'dependency',
            severity: 'medium',
            message: `Removing import for '${name}' - ensure it's not used elsewhere`,
            details: { importedName: name }
          });
        });
      }
    }

    return warnings;
  }

  /**
   * Analyze semantic changes
   * @private
   */
  _analyzeSemanticChanges(originalContent, newContent) {
    const changes = [];

    // Check for function signature changes
    const originalFunctionMatch = originalContent.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    const newFunctionMatch = newContent.match(/function\s+(\w+)\s*\(([^)]*)\)/);

    if (originalFunctionMatch && newFunctionMatch) {
      const originalName = originalFunctionMatch[1];
      const newName = newFunctionMatch[1];
      const originalParams = originalFunctionMatch[2];
      const newParams = newFunctionMatch[2];

      if (originalName !== newName) {
        changes.push({
          severity: 'high',
          message: `Function name changed from '${originalName}' to '${newName}'`,
          type: 'function_rename',
          details: { originalName, newName }
        });
      }

      if (originalParams !== newParams) {
        changes.push({
          severity: 'medium',
          message: `Function parameters changed`,
          type: 'parameter_change',
          details: { originalParams, newParams }
        });
      }
    }

    // Check for variable type changes
    const originalVarMatch = originalContent.match(/(const|let|var)\s+(\w+)/);
    const newVarMatch = newContent.match(/(const|let|var)\s+(\w+)/);

    if (originalVarMatch && newVarMatch) {
      const originalType = originalVarMatch[1];
      const newType = newVarMatch[1];
      const originalName = originalVarMatch[2];
      const newName = newVarMatch[2];

      if (originalType !== newType) {
        changes.push({
          severity: 'low',
          message: `Variable declaration type changed from '${originalType}' to '${newType}'`,
          type: 'declaration_type_change',
          details: { originalType, newType }
        });
      }

      if (originalName !== newName) {
        changes.push({
          severity: 'medium',
          message: `Variable name changed from '${originalName}' to '${newName}'`,
          type: 'variable_rename',
          details: { originalName, newName }
        });
      }
    }

    return changes;
  }

  /**
   * Check move scope issues
   * @private
   */
  _checkMoveScope(lineContent, fromIndex, toIndex, lines) {
    const warnings = [];

    // Check if moving a variable declaration outside its scope
    if (lineContent.includes('const ') || lineContent.includes('let ')) {
      // Simple check: if moving significantly up or down, warn about scope
      if (Math.abs(toIndex - fromIndex) > 10) {
        warnings.push({
          type: 'scope',
          severity: 'medium',
          message: `Moving variable declaration significant distance - check scope validity`,
          details: {
            from: fromIndex,
            to: toIndex,
            distance: Math.abs(toIndex - fromIndex)
          }
        });
      }
    }

    return warnings;
  }

  /**
   * Check missing dependencies
   * @private
   */
  _checkMissingDependencies(code, context) {
    const conflicts = [];

    // Common React hooks that require imports
    const reactHooks = ['useState', 'useEffect', 'useContext', 'useCallback', 'useMemo'];
    const usedHooks = reactHooks.filter(hook => code.includes(hook));

    if (usedHooks.length > 0 && !code.includes("import") && !context.hasReactImport) {
      conflicts.push({
        type: 'dependency',
        severity: 'high',
        message: `React hooks used but React import missing: ${usedHooks.join(', ')}`,
        details: {
          missingImport: 'React',
          usedHooks
        }
      });
    }

    return conflicts;
  }

  /**
   * Extract declared names from code
   * @private
   */
  _extractDeclaredNames(code) {
    const names = [];
    
    // Function declarations
    const functionMatches = code.match(/function\s+(\w+)/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        const name = match.match(/function\s+(\w+)/)[1];
        names.push(name);
      });
    }

    // Variable declarations
    const variableMatches = code.match(/(?:const|let|var)\s+(\w+)/g);
    if (variableMatches) {
      variableMatches.forEach(match => {
        const name = match.match(/(?:const|let|var)\s+(\w+)/)[1];
        names.push(name);
      });
    }

    // Class declarations
    const classMatches = code.match(/class\s+(\w+)/g);
    if (classMatches) {
      classMatches.forEach(match => {
        const name = match.match(/class\s+(\w+)/)[1];
        names.push(name);
      });
    }

    return names;
  }

  /**
   * Generate resolution for conflict
   * @private
   */
  _generateResolution(conflict, changeAnalysis, context) {
    switch (conflict.type) {
      case 'naming':
        return {
          type: 'rename',
          message: `Rename '${conflict.details.newName}' to avoid conflict`,
          action: 'suggest_alternative_name',
          suggestions: [
            `${conflict.details.newName}2`,
            `new${conflict.details.newName}`,
            `${conflict.details.newName}Alt`
          ]
        };

      case 'syntax':
        if (conflict.message.includes('bracket')) {
          return {
            type: 'auto-fix',
            message: 'Auto-fix bracket matching',
            action: 'fix_brackets'
          };
        }
        break;

      case 'dependency':
        if (conflict.details?.missingImport) {
          return {
            type: 'add-import',
            message: `Add missing import: ${conflict.details.missingImport}`,
            action: 'add_import',
            details: {
              import: conflict.details.missingImport,
              from: conflict.details.missingImport === 'React' ? 'react' : conflict.details.missingImport
            }
          };
        }
        break;

      case 'scope':
        return {
          type: 'scope-fix',
          message: 'Adjust variable scope placement',
          action: 'move_to_appropriate_scope'
        };
    }

    return null;
  }

  /**
   * Calculate overall severity
   * @private
   */
  _calculateOverallSeverity(conflicts) {
    if (conflicts.length === 0) return 'none';

    const severities = conflicts.map(c => c.severity);
    
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Generate conflict summary
   * @private
   */
  _generateConflictSummary(conflicts, warnings) {
    const summary = {
      total: conflicts.length + warnings.length,
      conflicts: conflicts.length,
      warnings: warnings.length,
      byType: {},
      bySeverity: {}
    };

    [...conflicts, ...warnings].forEach(item => {
      // Count by type
      summary.byType[item.type] = (summary.byType[item.type] || 0) + 1;
      
      // Count by severity
      summary.bySeverity[item.severity] = (summary.bySeverity[item.severity] || 0) + 1;
    });

    return summary;
  }
}

module.exports = ConflictDetector;