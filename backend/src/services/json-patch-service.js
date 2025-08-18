/**
 * JSON Patch Service
 * Implements RFC 6902 JSON Patch operations for safe code modifications
 * Provides natural language to patch conversion and code preview generation
 */
class JSONPatchService {
  constructor() {
    this.supportedOperations = ['add', 'remove', 'replace', 'move', 'copy', 'test'];
    this.commonPatterns = this._initializeCommonPatterns();
  }

  /**
   * Generate RFC 6902 JSON Patch from natural language prompt
   * @param {Object} params - Generation parameters
   * @returns {Object} Patch generation result
   */
  async generatePatch({ prompt, ast, sourceCode, filePath, context = {} }) {
    try {
      // Analyze the prompt to understand intent
      const intent = this._analyzePromptIntent(prompt);
      
      // Generate patch operations based on intent and AST
      const operations = await this._generatePatchOperations(
        intent,
        ast,
        sourceCode,
        context
      );

      if (operations.length === 0) {
        return {
          success: false,
          error: 'Could not generate patch operations from the given prompt'
        };
      }

      // Create RFC 6902 compliant patch
      const patch = this._createRFC6902Patch(operations);
      
      // Generate preview of changes
      const preview = await this._generateCodePreview(sourceCode, patch);
      
      // Calculate confidence score
      const confidence = this._calculateConfidence(intent, operations, ast);

      return {
        success: true,
        patch,
        preview: preview.code,
        diff: preview.diff,
        operations,
        confidence,
        suggestions: this._generateSuggestions(intent, operations)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply RFC 6902 JSON Patch to source code
   * @param {Object} params - Application parameters
   * @returns {Object} Application result
   */
  async applyPatch({ patch, sourceCode, filePath }) {
    try {
      // Validate patch format
      if (!this._validatePatchFormat(patch)) {
        return {
          success: false,
          error: 'Invalid patch format - must be RFC 6902 compliant'
        };
      }

      // Convert source code to structured format for patching
      const codeStructure = this._parseCodeToStructure(sourceCode);
      
      // Apply each operation in sequence
      const appliedOperations = [];
      let modifiedStructure = { ...codeStructure };

      for (const operation of patch) {
        const result = await this._applyOperation(operation, modifiedStructure, sourceCode);
        if (!result.success) {
          return {
            success: false,
            error: `Failed to apply operation: ${result.error}`,
            appliedOperations
          };
        }
        modifiedStructure = result.structure;
        appliedOperations.push({
          operation,
          result: result.description
        });
      }

      // Convert back to source code
      const modifiedCode = this._structureToCode(modifiedStructure, sourceCode);

      return {
        success: true,
        modifiedCode,
        appliedOperations,
        originalLength: sourceCode.length,
        modifiedLength: modifiedCode.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate code preview from patch
   * @param {Object} params - Preview parameters
   * @returns {Object} Preview result
   */
  async generatePreview({ sourceCode, changes, filePath }) {
    try {
      let previewCode = sourceCode;
      const highlights = [];
      const validationErrors = [];

      // Apply changes to generate preview
      if (Array.isArray(changes)) {
        // Changes are patch operations
        const applyResult = await this.applyPatch({
          patch: changes,
          sourceCode,
          filePath
        });
        
        if (applyResult.success) {
          previewCode = applyResult.modifiedCode;
        } else {
          validationErrors.push({
            message: applyResult.error,
            severity: 'error'
          });
        }
      } else if (typeof changes === 'string') {
        // Changes are direct code replacement
        previewCode = changes;
      }

      // Generate diff
      const diff = this._generateDiff(sourceCode, previewCode);
      
      // Extract highlights from diff
      diff.hunks.forEach(hunk => {
        hunk.changes.forEach(change => {
          if (change.type === 'add' || change.type === 'del') {
            highlights.push({
              line: change.ln || change.ln2,
              type: change.type,
              content: change.content
            });
          }
        });
      });

      return {
        success: true,
        code: previewCode,
        diff,
        highlights,
        validation: {
          isValid: validationErrors.length === 0,
          errors: validationErrors
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: sourceCode,
        diff: null,
        highlights: [],
        validation: { isValid: false, errors: [{ message: error.message }] }
      };
    }
  }

  /**
   * Analyze prompt intent
   * @private
   */
  _analyzePromptIntent(prompt) {
    const intent = {
      action: 'unknown',
      target: null,
      details: {},
      confidence: 0
    };

    const lowerPrompt = prompt.toLowerCase();

    // Detect action type
    if (lowerPrompt.includes('add') || lowerPrompt.includes('create')) {
      intent.action = 'add';
    } else if (lowerPrompt.includes('remove') || lowerPrompt.includes('delete')) {
      intent.action = 'remove';
    } else if (lowerPrompt.includes('change') || lowerPrompt.includes('modify') || lowerPrompt.includes('update')) {
      intent.action = 'replace';
    } else if (lowerPrompt.includes('move') || lowerPrompt.includes('relocate')) {
      intent.action = 'move';
    }

    // Detect target elements
    const targets = {
      function: /(?:function|method)\s+(\w+)/i,
      variable: /(?:variable|const|let|var)\s+(\w+)/i,
      class: /class\s+(\w+)/i,
      component: /component\s+(\w+)/i,
      import: /import\s+.*?(\w+)/i,
      export: /export\s+.*?(\w+)/i
    };

    Object.entries(targets).forEach(([type, pattern]) => {
      const match = prompt.match(pattern);
      if (match) {
        intent.target = {
          type,
          name: match[1]
        };
      }
    });

    // Extract additional details
    intent.details = this._extractIntentDetails(prompt, intent.action);
    
    // Calculate confidence based on clarity of intent
    intent.confidence = this._calculateIntentConfidence(intent, prompt);

    return intent;
  }

  /**
   * Generate patch operations
   * @private
   */
  async _generatePatchOperations(intent, ast, sourceCode, context) {
    const operations = [];
    const lines = sourceCode.split('\n');

    switch (intent.action) {
      case 'add':
        operations.push(...this._generateAddOperations(intent, ast, lines, context));
        break;
      case 'remove':
        operations.push(...this._generateRemoveOperations(intent, ast, lines));
        break;
      case 'replace':
        operations.push(...this._generateReplaceOperations(intent, ast, lines, context));
        break;
      case 'move':
        operations.push(...this._generateMoveOperations(intent, ast, lines));
        break;
      default:
        // Try to infer from common patterns
        operations.push(...this._generateInferredOperations(intent, ast, lines, context));
    }

    return operations;
  }

  /**
   * Generate add operations
   * @private
   */
  _generateAddOperations(intent, ast, lines, context) {
    const operations = [];

    if (intent.target?.type === 'function') {
      // Add a new function
      const insertLine = this._findBestInsertLocation(ast, 'function', lines);
      operations.push({
        op: 'add',
        path: `/lines/${insertLine}`,
        value: this._generateFunctionTemplate(intent.target.name, intent.details)
      });
    } else if (intent.target?.type === 'variable') {
      // Add a new variable
      const insertLine = this._findBestInsertLocation(ast, 'variable', lines);
      operations.push({
        op: 'add',
        path: `/lines/${insertLine}`,
        value: this._generateVariableDeclaration(intent.target.name, intent.details)
      });
    } else if (intent.target?.type === 'import') {
      // Add an import statement
      const insertLine = this._findImportInsertLocation(lines);
      operations.push({
        op: 'add',
        path: `/lines/${insertLine}`,
        value: this._generateImportStatement(intent.target.name, intent.details)
      });
    }

    return operations;
  }

  /**
   * Generate remove operations
   * @private
   */
  _generateRemoveOperations(intent, ast, lines) {
    const operations = [];

    if (intent.target?.name) {
      // Find the target in the AST and generate remove operations
      const targetLines = this._findTargetLines(intent.target, ast, lines);
      targetLines.forEach(lineIndex => {
        operations.push({
          op: 'remove',
          path: `/lines/${lineIndex}`
        });
      });
    }

    return operations;
  }

  /**
   * Generate replace operations
   * @private
   */
  _generateReplaceOperations(intent, ast, lines, context) {
    const operations = [];

    if (intent.target?.name) {
      const targetLines = this._findTargetLines(intent.target, ast, lines);
      targetLines.forEach(lineIndex => {
        const newContent = this._generateReplacementContent(
          intent.target,
          lines[lineIndex],
          intent.details,
          context
        );
        operations.push({
          op: 'replace',
          path: `/lines/${lineIndex}`,
          value: newContent
        });
      });
    }

    return operations;
  }

  /**
   * Generate move operations
   * @private
   */
  _generateMoveOperations(intent, ast, lines) {
    const operations = [];

    if (intent.target?.name && intent.details.destination) {
      const sourceLines = this._findTargetLines(intent.target, ast, lines);
      const destinationLine = this._findDestinationLine(intent.details.destination, ast, lines);
      
      sourceLines.forEach((lineIndex, index) => {
        operations.push({
          op: 'move',
          from: `/lines/${lineIndex}`,
          path: `/lines/${destinationLine + index}`
        });
      });
    }

    return operations;
  }

  /**
   * Generate inferred operations
   * @private
   */
  _generateInferredOperations(intent, ast, lines, context) {
    const operations = [];
    
    // Use common patterns to infer intent
    for (const pattern of this.commonPatterns) {
      if (pattern.matches(intent, context)) {
        operations.push(...pattern.generateOperations(intent, ast, lines, context));
        break;
      }
    }

    return operations;
  }

  /**
   * Create RFC 6902 compliant patch
   * @private
   */
  _createRFC6902Patch(operations) {
    return operations.map(op => {
      const patch = { op: op.op, path: op.path };
      
      if (op.value !== undefined) patch.value = op.value;
      if (op.from !== undefined) patch.from = op.from;
      
      return patch;
    });
  }

  /**
   * Validate patch format
   * @private
   */
  _validatePatchFormat(patch) {
    if (!Array.isArray(patch)) return false;

    return patch.every(operation => {
      if (!operation.op || !operation.path) return false;
      if (!this.supportedOperations.includes(operation.op)) return false;
      
      // Validate operation-specific requirements
      switch (operation.op) {
        case 'add':
        case 'replace':
        case 'test':
          return operation.value !== undefined;
        case 'move':
        case 'copy':
          return operation.from !== undefined;
        case 'remove':
          return true;
        default:
          return false;
      }
    });
  }

  /**
   * Parse code to structure
   * @private
   */
  _parseCodeToStructure(sourceCode) {
    const lines = sourceCode.split('\n');
    return {
      type: 'program',
      lines: lines.map((line, index) => ({
        index,
        content: line,
        indentation: line.match(/^\s*/)[0],
        trimmed: line.trim()
      }))
    };
  }

  /**
   * Apply operation to structure
   * @private
   */
  async _applyOperation(operation, structure, originalCode) {
    try {
      const newStructure = { ...structure, lines: [...structure.lines] };
      
      switch (operation.op) {
        case 'add':
          return this._applyAddOperation(operation, newStructure);
        case 'remove':
          return this._applyRemoveOperation(operation, newStructure);
        case 'replace':
          return this._applyReplaceOperation(operation, newStructure);
        case 'move':
          return this._applyMoveOperation(operation, newStructure);
        case 'copy':
          return this._applyCopyOperation(operation, newStructure);
        case 'test':
          return this._applyTestOperation(operation, newStructure);
        default:
          return {
            success: false,
            error: `Unsupported operation: ${operation.op}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply add operation
   * @private
   */
  _applyAddOperation(operation, structure) {
    const pathParts = operation.path.split('/').filter(p => p);
    const lineIndex = parseInt(pathParts[pathParts.length - 1]);
    
    if (isNaN(lineIndex) || lineIndex < 0) {
      return {
        success: false,
        error: 'Invalid line index in add operation'
      };
    }

    // Insert new line
    structure.lines.splice(lineIndex, 0, {
      index: lineIndex,
      content: operation.value,
      indentation: '',
      trimmed: operation.value.trim()
    });

    // Update indices for subsequent lines
    for (let i = lineIndex + 1; i < structure.lines.length; i++) {
      structure.lines[i].index = i;
    }

    return {
      success: true,
      structure,
      description: `Added line at position ${lineIndex}`
    };
  }

  /**
   * Apply remove operation
   * @private
   */
  _applyRemoveOperation(operation, structure) {
    const pathParts = operation.path.split('/').filter(p => p);
    const lineIndex = parseInt(pathParts[pathParts.length - 1]);
    
    if (isNaN(lineIndex) || lineIndex < 0 || lineIndex >= structure.lines.length) {
      return {
        success: false,
        error: 'Invalid line index in remove operation'
      };
    }

    // Remove line
    structure.lines.splice(lineIndex, 1);

    // Update indices for subsequent lines
    for (let i = lineIndex; i < structure.lines.length; i++) {
      structure.lines[i].index = i;
    }

    return {
      success: true,
      structure,
      description: `Removed line at position ${lineIndex}`
    };
  }

  /**
   * Apply replace operation
   * @private
   */
  _applyReplaceOperation(operation, structure) {
    const pathParts = operation.path.split('/').filter(p => p);
    const lineIndex = parseInt(pathParts[pathParts.length - 1]);
    
    if (isNaN(lineIndex) || lineIndex < 0 || lineIndex >= structure.lines.length) {
      return {
        success: false,
        error: 'Invalid line index in replace operation'
      };
    }

    // Replace line content
    structure.lines[lineIndex] = {
      index: lineIndex,
      content: operation.value,
      indentation: structure.lines[lineIndex].indentation,
      trimmed: operation.value.trim()
    };

    return {
      success: true,
      structure,
      description: `Replaced line at position ${lineIndex}`
    };
  }

  /**
   * Apply move operation
   * @private
   */
  _applyMoveOperation(operation, structure) {
    const fromParts = operation.from.split('/').filter(p => p);
    const toParts = operation.path.split('/').filter(p => p);
    const fromIndex = parseInt(fromParts[fromParts.length - 1]);
    const toIndex = parseInt(toParts[toParts.length - 1]);
    
    if (isNaN(fromIndex) || isNaN(toIndex) || 
        fromIndex < 0 || fromIndex >= structure.lines.length ||
        toIndex < 0) {
      return {
        success: false,
        error: 'Invalid indices in move operation'
      };
    }

    // Move line
    const line = structure.lines.splice(fromIndex, 1)[0];
    const actualToIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
    structure.lines.splice(actualToIndex, 0, line);

    // Update all indices
    structure.lines.forEach((line, index) => {
      line.index = index;
    });

    return {
      success: true,
      structure,
      description: `Moved line from position ${fromIndex} to ${actualToIndex}`
    };
  }

  /**
   * Apply copy operation
   * @private
   */
  _applyCopyOperation(operation, structure) {
    const fromParts = operation.from.split('/').filter(p => p);
    const toParts = operation.path.split('/').filter(p => p);
    const fromIndex = parseInt(fromParts[fromParts.length - 1]);
    const toIndex = parseInt(toParts[toParts.length - 1]);
    
    if (isNaN(fromIndex) || isNaN(toIndex) || 
        fromIndex < 0 || fromIndex >= structure.lines.length ||
        toIndex < 0) {
      return {
        success: false,
        error: 'Invalid indices in copy operation'
      };
    }

    // Copy line
    const sourceLine = structure.lines[fromIndex];
    const copiedLine = {
      index: toIndex,
      content: sourceLine.content,
      indentation: sourceLine.indentation,
      trimmed: sourceLine.trimmed
    };
    
    structure.lines.splice(toIndex, 0, copiedLine);

    // Update indices for subsequent lines
    for (let i = toIndex + 1; i < structure.lines.length; i++) {
      structure.lines[i].index = i;
    }

    return {
      success: true,
      structure,
      description: `Copied line from position ${fromIndex} to ${toIndex}`
    };
  }

  /**
   * Apply test operation
   * @private
   */
  _applyTestOperation(operation, structure) {
    const pathParts = operation.path.split('/').filter(p => p);
    const lineIndex = parseInt(pathParts[pathParts.length - 1]);
    
    if (isNaN(lineIndex) || lineIndex < 0 || lineIndex >= structure.lines.length) {
      return {
        success: false,
        error: 'Invalid line index in test operation'
      };
    }

    const actualValue = structure.lines[lineIndex].content;
    const expectedValue = operation.value;

    if (actualValue !== expectedValue) {
      return {
        success: false,
        error: `Test failed: expected "${expectedValue}", got "${actualValue}"`
      };
    }

    return {
      success: true,
      structure,
      description: `Test passed for line ${lineIndex}`
    };
  }

  /**
   * Convert structure back to code
   * @private
   */
  _structureToCode(structure, originalCode) {
    return structure.lines.map(line => line.content).join('\n');
  }

  /**
   * Generate code preview
   * @private
   */
  async _generateCodePreview(sourceCode, patch) {
    const applyResult = await this.applyPatch({
      patch,
      sourceCode,
      filePath: ''
    });

    if (!applyResult.success) {
      return {
        code: sourceCode,
        diff: null,
        error: applyResult.error
      };
    }

    const diff = this._generateDiff(sourceCode, applyResult.modifiedCode);
    
    return {
      code: applyResult.modifiedCode,
      diff
    };
  }

  /**
   * Generate diff between two code strings
   * @private
   */
  _generateDiff(oldCode, newCode) {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    
    const hunks = [];
    let hunk = null;

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine !== newLine) {
        if (!hunk) {
          hunk = {
            oldStart: i + 1,
            newStart: i + 1,
            changes: []
          };
        }

        if (oldLine !== undefined) {
          hunk.changes.push({
            type: 'del',
            content: oldLine,
            ln: i + 1
          });
        }

        if (newLine !== undefined) {
          hunk.changes.push({
            type: 'add',
            content: newLine,
            ln2: i + 1
          });
        }
      } else if (hunk) {
        // End of current hunk
        hunks.push(hunk);
        hunk = null;
      }
    }

    if (hunk) {
      hunks.push(hunk);
    }

    return {
      hunks,
      oldFileName: 'original',
      newFileName: 'modified'
    };
  }

  /**
   * Calculate confidence score
   * @private
   */
  _calculateConfidence(intent, operations, ast) {
    let confidence = 0.5;

    // Higher confidence for clear intent
    if (intent.action !== 'unknown') confidence += 0.2;
    if (intent.target) confidence += 0.2;
    
    // Higher confidence for successful operation generation
    if (operations.length > 0) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Generate suggestions
   * @private
   */
  _generateSuggestions(intent, operations) {
    const suggestions = [];

    if (operations.length === 0) {
      suggestions.push({
        type: 'warning',
        message: 'No operations generated. Try being more specific about what you want to change.'
      });
    }

    if (intent.confidence < 0.7) {
      suggestions.push({
        type: 'info',
        message: 'Intent unclear. Consider providing more specific instructions.'
      });
    }

    return suggestions;
  }

  /**
   * Extract intent details
   * @private
   */
  _extractIntentDetails(prompt, action) {
    const details = {};

    // Extract parameters for function creation
    if (prompt.includes('parameter') || prompt.includes('argument')) {
      const paramMatch = prompt.match(/parameters?\s*[:\-]?\s*([^.!?]+)/i);
      if (paramMatch) {
        details.parameters = paramMatch[1].split(',').map(p => p.trim());
      }
    }

    // Extract return type
    if (prompt.includes('return')) {
      const returnMatch = prompt.match(/returns?\s+([^.!?]+)/i);
      if (returnMatch) {
        details.returnType = returnMatch[1].trim();
      }
    }

    // Extract value for variables
    if (prompt.includes('value') || prompt.includes('equals')) {
      const valueMatch = prompt.match(/(?:value|equals)\s*[=:]?\s*([^.!?]+)/i);
      if (valueMatch) {
        details.value = valueMatch[1].trim();
      }
    }

    return details;
  }

  /**
   * Calculate intent confidence
   * @private
   */
  _calculateIntentConfidence(intent, prompt) {
    let confidence = 0.3;

    if (intent.action !== 'unknown') confidence += 0.3;
    if (intent.target) confidence += 0.3;
    if (Object.keys(intent.details).length > 0) confidence += 0.1;

    return confidence;
  }

  /**
   * Initialize common patterns
   * @private
   */
  _initializeCommonPatterns() {
    return [
      {
        name: 'addReactHook',
        matches: (intent, context) => 
          intent.action === 'add' && 
          (context.isReact || intent.target?.name?.startsWith('use')),
        generateOperations: (intent, ast, lines, context) => [
          {
            op: 'add',
            path: '/lines/0',
            value: `const [${intent.target?.name || 'state'}, set${intent.target?.name || 'State'}] = useState();`
          }
        ]
      },
      {
        name: 'addImport',
        matches: (intent, context) => 
          intent.action === 'add' && 
          intent.target?.type === 'import',
        generateOperations: (intent, ast, lines, context) => [
          {
            op: 'add',
            path: '/lines/0',
            value: `import ${intent.target.name} from '${intent.details.from || intent.target.name}';`
          }
        ]
      }
    ];
  }

  /**
   * Helper methods for code generation
   * @private
   */
  _findBestInsertLocation(ast, type, lines) {
    // Simple heuristic: find the end of similar declarations
    switch (type) {
      case 'function':
        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].includes('function ') || lines[i].includes('const ') && lines[i].includes('=>')) {
            return i + 1;
          }
        }
        return lines.length;
      case 'variable':
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('const ') || lines[i].includes('let ') || lines[i].includes('var ')) {
            return i + 1;
          }
        }
        return 0;
      default:
        return lines.length;
    }
  }

  _findImportInsertLocation(lines) {
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      } else if (lastImportIndex >= 0 && lines[i].trim() !== '') {
        break;
      }
    }
    return lastImportIndex + 1;
  }

  _generateFunctionTemplate(name, details) {
    const params = details.parameters ? details.parameters.join(', ') : '';
    const returnStatement = details.returnType ? `\n  return ${details.returnType};` : '\n  // TODO: Implement function';
    return `function ${name}(${params}) {${returnStatement}\n}`;
  }

  _generateVariableDeclaration(name, details) {
    const value = details.value || 'null';
    return `const ${name} = ${value};`;
  }

  _generateImportStatement(name, details) {
    const from = details.from || name;
    return `import ${name} from '${from}';`;
  }

  _findTargetLines(target, ast, lines) {
    const targetLines = [];
    
    // Simple pattern matching for finding target lines
    const pattern = new RegExp(`\\b${target.name}\\b`);
    
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        targetLines.push(index);
      }
    });

    return targetLines;
  }

  _findDestinationLine(destination, ast, lines) {
    // Simple implementation - find line containing destination
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(destination)) {
        return i;
      }
    }
    return lines.length;
  }

  _generateReplacementContent(target, originalLine, details, context) {
    // Simple replacement logic
    if (details.newName) {
      return originalLine.replace(target.name, details.newName);
    }
    if (details.newValue) {
      return originalLine.replace(/=.*?;/, `= ${details.newValue};`);
    }
    return originalLine;
  }
}

module.exports = JSONPatchService;