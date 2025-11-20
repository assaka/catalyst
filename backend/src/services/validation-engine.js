/**
 * Validation Rules Engine
 * Comprehensive validation system for hybrid patches with extensible rules
 */

const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const ConnectionManager = require('./database/ConnectionManager');
const { QueryTypes } = require('sequelize');

class ValidationEngine {
  constructor() {
    this.ruleHandlers = new Map();
    this.initializeBuiltInRules();
  }

  /**
   * Initialize built-in validation rules
   */
  initializeBuiltInRules() {
    // Content validation rules
    this.ruleHandlers.set('must_contain', this.mustContainRule.bind(this));
    this.ruleHandlers.set('cannot_contain', this.cannotContainRule.bind(this));
    this.ruleHandlers.set('must_not_modify', this.mustNotModifyRule.bind(this));
    
    // Syntax and structure rules
    this.ruleHandlers.set('syntax_valid', this.syntaxValidRule.bind(this));
    this.ruleHandlers.set('preserve_functions', this.preserveFunctionsRule.bind(this));
    this.ruleHandlers.set('preserve_exports', this.preserveExportsRule.bind(this));
    
    // Security rules
    this.ruleHandlers.set('security_check', this.securityCheckRule.bind(this));
    this.ruleHandlers.set('prevent_xss', this.preventXSSRule.bind(this));
    this.ruleHandlers.set('block_dangerous_apis', this.blockDangerousAPIsRule.bind(this));
    
    // Performance rules
    this.ruleHandlers.set('prevent_infinite_loops', this.preventInfiniteLoopsRule.bind(this));
    this.ruleHandlers.set('limit_complexity', this.limitComplexityRule.bind(this));
    
    // Custom rules
    this.ruleHandlers.set('custom', this.customRule.bind(this));
  }

  /**
   * Validate code against a set of rules
   */
  async validateCode(code, rules, context = {}) {
    const result = {
      success: true,
      errors: [],
      warnings: [],
      ruleResults: {}
    };

    console.log('🔍 [ValidationEngine] Validating code with', Object.keys(rules).length, 'rules');

    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
      try {
        const ruleResult = await this.applyRule(code, ruleName, ruleConfig, context);
        result.ruleResults[ruleName] = ruleResult;

        if (!ruleResult.passed) {
          result.success = false;
          if (ruleResult.severity === 'error') {
            result.errors.push(...ruleResult.messages);
          } else {
            result.warnings.push(...ruleResult.messages);
          }
        }
      } catch (error) {
        result.success = false;
        result.errors.push(`Rule '${ruleName}' failed: ${error.message}`);
        result.ruleResults[ruleName] = {
          passed: false,
          severity: 'error',
          messages: [error.message]
        };
      }
    }

    console.log(`✅ [ValidationEngine] Validation ${result.success ? 'passed' : 'failed'}:`, {
      errors: result.errors.length,
      warnings: result.warnings.length
    });

    return result;
  }

  /**
   * Apply a single validation rule
   */
  async applyRule(code, ruleName, ruleConfig, context) {
    const handler = this.ruleHandlers.get(ruleName);
    
    if (!handler) {
      throw new Error(`Unknown validation rule: ${ruleName}`);
    }

    return await handler(code, ruleConfig, context);
  }

  /**
   * Must contain rule - code must include specific patterns
   */
  async mustContainRule(code, config, context) {
    const patterns = Array.isArray(config) ? config : (config.patterns || []);
    const caseSensitive = config.case_sensitive !== false;
    const messages = [];

    for (const pattern of patterns) {
      const searchCode = caseSensitive ? code : code.toLowerCase();
      const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
      
      if (!searchCode.includes(searchPattern)) {
        messages.push(`Code must contain: "${pattern}"`);
      }
    }

    return {
      passed: messages.length === 0,
      severity: 'error',
      messages
    };
  }

  /**
   * Cannot contain rule - code must not include specific patterns
   */
  async cannotContainRule(code, config, context) {
    const patterns = Array.isArray(config) ? config : (config.patterns || []);
    const caseSensitive = config.case_sensitive !== false;
    const messages = [];

    for (const pattern of patterns) {
      const searchCode = caseSensitive ? code : code.toLowerCase();
      const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
      
      if (searchCode.includes(searchPattern)) {
        messages.push(`Code cannot contain: "${pattern}"`);
      }
    }

    return {
      passed: messages.length === 0,
      severity: 'error',
      messages
    };
  }

  /**
   * Must not modify rule - specific patterns should remain unchanged
   */
  async mustNotModifyRule(code, config, context) {
    if (!context.originalCode) {
      return {
        passed: true,
        severity: 'warning',
        messages: ['Cannot validate must_not_modify without original code']
      };
    }

    const protectedPatterns = Array.isArray(config) ? config : (config.patterns || []);
    const messages = [];

    for (const pattern of protectedPatterns) {
      const originalHasPattern = context.originalCode.includes(pattern);
      const modifiedHasPattern = code.includes(pattern);
      
      if (originalHasPattern && !modifiedHasPattern) {
        messages.push(`Protected pattern was removed: "${pattern}"`);
      }
    }

    return {
      passed: messages.length === 0,
      severity: 'error',
      messages
    };
  }

  /**
   * Syntax validation rule
   */
  async syntaxValidRule(code, config, context) {
    try {
      const fileType = context.fileType || 'javascript';
      const plugins = [];

      // Determine parser plugins based on file type
      if (fileType.includes('jsx') || fileType.includes('react')) {
        plugins.push('jsx');
      }
      if (fileType.includes('typescript')) {
        plugins.push('typescript');
      }

      parse(code, {
        sourceType: 'module',
        plugins: plugins.length > 0 ? plugins : ['jsx', 'typescript'],
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        strictMode: false
      });

      return {
        passed: true,
        severity: 'error',
        messages: []
      };
    } catch (error) {
      return {
        passed: false,
        severity: 'error',
        messages: [`Syntax error: ${error.message}`]
      };
    }
  }

  /**
   * Preserve functions rule - ensure critical functions are not removed
   */
  async preserveFunctionsRule(code, config, context) {
    const requiredFunctions = Array.isArray(config) ? config : (config.required_functions || []);
    const messages = [];

    for (const functionName of requiredFunctions) {
      // Check for function declarations, expressions, and arrow functions
      const patterns = [
        new RegExp(`function\\s+${functionName}\\s*\\(`, 'g'),
        new RegExp(`const\\s+${functionName}\\s*=\\s*function`, 'g'),
        new RegExp(`const\\s+${functionName}\\s*=\\s*\\(`, 'g'),
        new RegExp(`${functionName}\\s*:\\s*function`, 'g'),
        new RegExp(`${functionName}\\s*:\\s*\\(`, 'g')
      ];

      const found = patterns.some(pattern => pattern.test(code));
      
      if (!found) {
        messages.push(`Required function not found: "${functionName}"`);
      }
    }

    return {
      passed: messages.length === 0,
      severity: 'error',
      messages
    };
  }

  /**
   * Preserve exports rule - ensure exports are maintained
   */
  async preserveExportsRule(code, config, context) {
    const messages = [];

    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      let hasExports = false;
      traverse(ast, {
        ExportDeclaration: () => { hasExports = true; },
        ExportDefaultDeclaration: () => { hasExports = true; },
        ExportNamedDeclaration: () => { hasExports = true; }
      });

      // Also check for module.exports (CommonJS)
      if (!hasExports && code.includes('module.exports')) {
        hasExports = true;
      }

      if (!hasExports && config.required !== false) {
        messages.push('Code must have at least one export');
      }
    } catch (error) {
      // If we can't parse, assume it's okay (syntax validation will catch syntax errors)
    }

    return {
      passed: messages.length === 0,
      severity: 'warning',
      messages
    };
  }

  /**
   * Security check rule - basic security validations
   */
  async securityCheckRule(code, config, context) {
    const dangerousPatterns = [
      'eval(',
      'Function(',
      'document.write(',
      'innerHTML =',
      'outerHTML =',
      'document.cookie',
      'localStorage.setItem',
      'sessionStorage.setItem',
      'window.location.href =',
      'location.replace(',
      '<script',
      'javascript:',
      'vbscript:',
      'data:text/html',
      ...config.additional_patterns || []
    ];

    const messages = [];
    const severity = config.severity || 'error';

    for (const pattern of dangerousPatterns) {
      if (code.includes(pattern)) {
        messages.push(`Potentially dangerous pattern detected: "${pattern}"`);
      }
    }

    return {
      passed: messages.length === 0,
      severity,
      messages
    };
  }

  /**
   * Prevent XSS rule
   */
  async preventXSSRule(code, config, context) {
    const xssPatterns = [
      'dangerouslySetInnerHTML',
      'innerHTML =',
      'outerHTML =',
      'document.write',
      'eval(',
      '<script',
      'javascript:',
      'vbscript:',
      'onload=',
      'onerror=',
      'onclick='
    ];

    const messages = [];

    for (const pattern of xssPatterns) {
      if (code.includes(pattern)) {
        messages.push(`XSS risk detected: "${pattern}"`);
      }
    }

    return {
      passed: messages.length === 0,
      severity: 'error',
      messages
    };
  }

  /**
   * Block dangerous APIs rule
   */
  async blockDangerousAPIsRule(code, config, context) {
    const dangerousAPIs = [
      'process.exit',
      'process.kill',
      'child_process',
      'fs.writeFile',
      'fs.unlink',
      'fs.rmdir',
      'require("fs")',
      'require("child_process")',
      'require("os")',
      'require("path")',
      'require("crypto").randomBytes',
      ...config.additional_apis || []
    ];

    const messages = [];

    for (const api of dangerousAPIs) {
      if (code.includes(api)) {
        messages.push(`Dangerous API usage detected: "${api}"`);
      }
    }

    return {
      passed: messages.length === 0,
      severity: 'error',
      messages
    };
  }

  /**
   * Prevent infinite loops rule
   */
  async preventInfiniteLoopsRule(code, config, context) {
    const messages = [];
    const suspiciousPatterns = [
      /while\s*\(\s*true\s*\)/g,
      /for\s*\(\s*;\s*;\s*\)/g,
      /while\s*\(\s*1\s*\)/g
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(code)) {
        messages.push(`Potential infinite loop detected: ${pattern.source}`);
      }
    }

    return {
      passed: messages.length === 0,
      severity: 'warning',
      messages
    };
  }

  /**
   * Limit complexity rule
   */
  async limitComplexityRule(code, config, context) {
    const maxLines = config.max_lines || 1000;
    const maxFunctionLength = config.max_function_length || 100;
    const messages = [];

    const lines = code.split('\n').length;
    if (lines > maxLines) {
      messages.push(`Code too long: ${lines} lines (max: ${maxLines})`);
    }

    // Simple function length check (could be more sophisticated)
    const functionMatches = code.match(/function[^{]*\{([^}]+\{[^}]*\}[^}]*)*[^}]*\}/g);
    if (functionMatches) {
      for (const func of functionMatches) {
        const funcLines = func.split('\n').length;
        if (funcLines > maxFunctionLength) {
          messages.push(`Function too long: ${funcLines} lines (max: ${maxFunctionLength})`);
        }
      }
    }

    return {
      passed: messages.length === 0,
      severity: 'warning',
      messages
    };
  }

  /**
   * Custom rule handler
   */
  async customRule(code, config, context) {
    // This would allow for store-specific custom validation rules
    // For now, return a placeholder
    return {
      passed: true,
      severity: 'info',
      messages: ['Custom rule validation not implemented']
    };
  }

  /**
   * Get validation rules for a store and file type
   */
  async getStoreValidationRules(storeId, filePath) {
    try {
      const connection = await ConnectionManager.getStoreConnection(storeId);
      const rules = await connection.query(`
        SELECT rule_name, rule_type, rule_config, file_patterns
        FROM hybrid_patch_validations
        WHERE store_id = :storeId
        AND is_active = true
        ORDER BY rule_name
      `, {
        replacements: { storeId },
        type: QueryTypes.SELECT
      });

      const applicableRules = {};
      
      for (const rule of rules) {
        // Check if rule applies to this file
        if (rule.file_patterns && rule.file_patterns.length > 0) {
          const patterns = Array.isArray(rule.file_patterns) ? rule.file_patterns : [rule.file_patterns];
          const applies = patterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filePath);
          });
          
          if (!applies) continue;
        }

        applicableRules[rule.rule_name] = JSON.parse(rule.rule_config);
      }

      return applicableRules;
    } catch (error) {
      console.error('❌ [ValidationEngine] Error getting store validation rules:', error);
      return {};
    }
  }

  /**
   * Create a new validation rule for a store
   */
  async createValidationRule(storeId, ruleData, createdBy) {
    try {
      const {
        rule_name,
        rule_type,
        rule_config,
        file_patterns = ['*'],
        description
      } = ruleData;

      const connection = await ConnectionManager.getStoreConnection(storeId);
      await connection.query(`
        INSERT INTO hybrid_patch_validations (
          store_id, rule_name, rule_type, rule_config,
          file_patterns, description, created_by
        ) VALUES (
          :storeId, :ruleName, :ruleType, :ruleConfig,
          :filePatterns, :description, :createdBy
        )
      `, {
        replacements: {
          storeId,
          ruleName: rule_name,
          ruleType: rule_type,
          ruleConfig: JSON.stringify(rule_config),
          filePatterns: JSON.stringify(file_patterns),
          description,
          createdBy
        },
        type: QueryTypes.INSERT
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [ValidationEngine] Error creating validation rule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test validation rules against sample code
   */
  async testValidationRules(rules, sampleCode, context = {}) {
    console.log('🧪 [ValidationEngine] Testing validation rules');
    
    const result = await this.validateCode(sampleCode, rules, context);
    
    return {
      ...result,
      testMode: true,
      sampleCodeLength: sampleCode.length,
      rulesCount: Object.keys(rules).length
    };
  }
}

module.exports = ValidationEngine;