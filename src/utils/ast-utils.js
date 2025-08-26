/**
 * AST Utilities for Monaco Editor Integration
 * Provides AST parsing, diffing, and validation using Monaco's language services
 */

// AST parsing using Monaco's TypeScript language services
export class ASTParser {
  constructor() {
    this.monacoInstance = null;
    this.initialized = false;
  }

  /**
   * Initialize with Monaco instance
   */
  initialize(monaco) {
    this.monacoInstance = monaco;
    this.initialized = true;
  }

  /**
   * Parse code to AST using Monaco's TypeScript language service
   */
  async parseToAST(code, language = 'typescript') {
    if (!this.initialized || !this.monacoInstance) {
      throw new Error('ASTParser not initialized with Monaco instance');
    }

    try {
      switch (language) {
        case 'typescript':
        case 'javascript':
        case 'tsx':
        case 'jsx':
          return await this.parseTypeScript(code, language);
        case 'json':
          return await this.parseJSON(code);
        default:
          return await this.parseGeneric(code, language);
      }
    } catch (error) {
      console.error('AST parsing error:', error);
      return {
        success: false,
        error: error.message,
        ast: null
      };
    }
  }

  /**
   * Parse TypeScript/JavaScript code using Monaco's TS language service
   */
  async parseTypeScript(code, language) {
    const uri = this.monacoInstance.Uri.parse(`file:///temp.${language === 'tsx' ? 'tsx' : language === 'jsx' ? 'jsx' : 'ts'}`);
    
    // Create or update model
    let model = this.monacoInstance.editor.getModel(uri);
    if (!model) {
      model = this.monacoInstance.editor.createModel(code, language, uri);
    } else {
      model.setValue(code);
    }

    // Get TypeScript worker
    const worker = await this.monacoInstance.languages.typescript.getTypeScriptWorker();
    const client = await worker(uri);

    try {
      // Get syntax tree (simplified AST representation)
      const syntaxTree = await client.getSyntacticDiagnostics(uri.toString());
      const semanticDiagnostics = await client.getSemanticDiagnostics(uri.toString());
      
      // Extract AST-like structure from Monaco's language service
      const astData = await this.extractASTFromDiagnostics(model, client, uri);
      
      return {
        success: true,
        ast: astData,
        syntaxErrors: syntaxTree,
        semanticErrors: semanticDiagnostics,
        language: language
      };
    } finally {
      // Clean up model if it was created for parsing
      model.dispose();
    }
  }

  /**
   * Extract AST-like structure from Monaco's language service
   */
  async extractASTFromDiagnostics(model, client, uri) {
    try {
      // Get outline (structure) from Monaco
      const outline = await client.getNavigationTree(uri.toString());
      
      // Convert to our AST format
      return {
        type: 'Program',
        body: this.convertMonacoOutlineToAST(outline),
        sourceCode: model.getValue(),
        range: {
          start: { line: 1, column: 1 },
          end: { line: model.getLineCount(), column: model.getLineMaxColumn(model.getLineCount()) }
        }
      };
    } catch (error) {
      console.warn('Could not extract detailed AST:', error);
      return {
        type: 'Program',
        body: [],
        sourceCode: model.getValue(),
        simplified: true
      };
    }
  }

  /**
   * Convert Monaco's navigation tree to AST-like structure
   */
  convertMonacoOutlineToAST(outline) {
    if (!outline || !outline.childItems) return [];

    return outline.childItems.map(item => ({
      type: this.mapMonacoKindToASTType(item.kind),
      name: item.text,
      range: {
        start: { line: item.spans?.[0]?.start || 0 },
        end: { line: item.spans?.[0]?.end || 0 }
      },
      children: item.childItems ? this.convertMonacoOutlineToAST(item) : [],
      kind: item.kind
    }));
  }

  /**
   * Map Monaco's syntax kinds to AST node types
   */
  mapMonacoKindToASTType(kind) {
    const kindMap = {
      'class': 'ClassDeclaration',
      'function': 'FunctionDeclaration',
      'method': 'MethodDefinition',
      'property': 'Property',
      'variable': 'VariableDeclaration',
      'interface': 'InterfaceDeclaration',
      'type': 'TypeAliasDeclaration',
      'enum': 'EnumDeclaration',
      'module': 'ModuleDeclaration',
      'constructor': 'Constructor',
      'getter': 'GetAccessor',
      'setter': 'SetAccessor'
    };

    return kindMap[kind] || 'Unknown';
  }

  /**
   * Parse JSON with error handling
   */
  async parseJSON(code) {
    try {
      const parsed = JSON.parse(code);
      return {
        success: true,
        ast: {
          type: 'JSONDocument',
          value: parsed,
          sourceCode: code
        },
        syntaxErrors: [],
        semanticErrors: []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syntaxErrors: [{
          message: error.message,
          severity: 'error',
          startLineNumber: 1,
          endLineNumber: 1
        }]
      };
    }
  }

  /**
   * Generic parser for other languages
   */
  async parseGeneric(code, language) {
    return {
      success: true,
      ast: {
        type: 'GenericDocument',
        language: language,
        sourceCode: code,
        lines: code.split('\n').length
      },
      syntaxErrors: [],
      semanticErrors: []
    };
  }
}

/**
 * AST Differ - Compare two AST structures
 */
export class ASTDiffer {
  /**
   * Compare two AST structures and return semantic differences
   */
  static compareASTs(oldAST, newAST) {
    const changes = [];

    if (!oldAST || !newAST) {
      return [{
        type: 'complete_change',
        description: 'Complete document change',
        oldNode: oldAST,
        newNode: newAST
      }];
    }

    // Compare structure recursively
    this.compareNodes(oldAST, newAST, changes, []);

    return changes;
  }

  /**
   * Compare individual nodes recursively
   */
  static compareNodes(oldNode, newNode, changes, path) {
    if (!oldNode && !newNode) return;

    if (!oldNode) {
      changes.push({
        type: 'addition',
        path: [...path],
        newNode: newNode,
        description: `Added ${newNode.type} at ${path.join('.')}`
      });
      return;
    }

    if (!newNode) {
      changes.push({
        type: 'deletion',
        path: [...path],
        oldNode: oldNode,
        description: `Removed ${oldNode.type} at ${path.join('.')}`
      });
      return;
    }

    // Compare node types
    if (oldNode.type !== newNode.type) {
      changes.push({
        type: 'type_change',
        path: [...path],
        oldNode: oldNode,
        newNode: newNode,
        description: `Changed from ${oldNode.type} to ${newNode.type} at ${path.join('.')}`
      });
    }

    // Compare names
    if (oldNode.name !== newNode.name) {
      changes.push({
        type: 'name_change',
        path: [...path],
        oldNode: oldNode,
        newNode: newNode,
        description: `Renamed from "${oldNode.name}" to "${newNode.name}" at ${path.join('.')}`
      });
    }

    // Compare children
    const oldChildren = oldNode.children || oldNode.body || [];
    const newChildren = newNode.children || newNode.body || [];

    this.compareArrays(oldChildren, newChildren, changes, [...path, 'children']);
  }

  /**
   * Compare arrays of AST nodes
   */
  static compareArrays(oldArray, newArray, changes, path) {
    const maxLength = Math.max(oldArray.length, newArray.length);

    for (let i = 0; i < maxLength; i++) {
      this.compareNodes(
        oldArray[i], 
        newArray[i], 
        changes, 
        [...path, i]
      );
    }
  }

  /**
   * Generate a semantic diff summary
   */
  static generateDiffSummary(changes) {
    const summary = {
      total: changes.length,
      additions: changes.filter(c => c.type === 'addition').length,
      deletions: changes.filter(c => c.type === 'deletion').length,
      modifications: changes.filter(c => ['type_change', 'name_change'].includes(c.type)).length,
      impactLevel: 'low'
    };

    // Determine impact level
    if (summary.deletions > 5 || summary.additions > 10) {
      summary.impactLevel = 'high';
    } else if (summary.modifications > 3 || summary.total > 8) {
      summary.impactLevel = 'medium';
    }

    summary.description = this.generateSummaryDescription(summary, changes);

    return summary;
  }

  /**
   * Generate human-readable summary description
   */
  static generateSummaryDescription(summary, changes) {
    const parts = [];

    if (summary.additions > 0) {
      parts.push(`${summary.additions} addition${summary.additions > 1 ? 's' : ''}`);
    }
    if (summary.deletions > 0) {
      parts.push(`${summary.deletions} deletion${summary.deletions > 1 ? 's' : ''}`);
    }
    if (summary.modifications > 0) {
      parts.push(`${summary.modifications} modification${summary.modifications > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
      return 'No structural changes detected';
    }

    return parts.join(', ');
  }
}

/**
 * AST Validator - Validate code structure
 */
export class ASTValidator {
  /**
   * Validate AST structure and return issues
   */
  static validateAST(ast, rules = {}) {
    const issues = [];

    if (!ast) {
      issues.push({
        severity: 'error',
        message: 'No AST provided',
        type: 'missing_ast'
      });
      return issues;
    }

    // Default validation rules
    const defaultRules = {
      maxDepth: 20,
      maxFunctionLength: 100,
      maxComplexity: 10,
      requireDocumentation: false,
      ...rules
    };

    this.validateNode(ast, issues, defaultRules, 0);

    return issues;
  }

  /**
   * Validate individual AST node
   */
  static validateNode(node, issues, rules, depth) {
    if (!node) return;

    // Check depth
    if (depth > rules.maxDepth) {
      issues.push({
        severity: 'warning',
        message: `Nesting depth exceeds ${rules.maxDepth} levels`,
        type: 'max_depth_exceeded',
        node: node
      });
    }

    // Check function length (simplified)
    if (node.type === 'FunctionDeclaration' && node.sourceCode) {
      const lines = node.sourceCode.split('\n').length;
      if (lines > rules.maxFunctionLength) {
        issues.push({
          severity: 'warning',
          message: `Function "${node.name}" has ${lines} lines (max: ${rules.maxFunctionLength})`,
          type: 'function_too_long',
          node: node
        });
      }
    }

    // Recursively validate children
    const children = node.children || node.body || [];
    children.forEach(child => {
      this.validateNode(child, issues, rules, depth + 1);
    });
  }
}

// Export a default instance for convenience
export const astParser = new ASTParser();
export const astDiffer = ASTDiffer;
export const astValidator = ASTValidator;