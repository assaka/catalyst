/**
 * Hybrid Patch Service
 * Creates and applies hybrid patches with validation rules and fallback strategies
 * Supports multiple patch types: modify, override, insert, delete, A/B testing
 * Provides unified interface for creating and applying different patch formats
 */

const crypto = require('crypto');
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const { sequelize } = require('../database/connection');
const unifiedDiffService = require('./unified-diff-service');
const ValidationEngine = require('./validation-engine');

class HybridPatchService {
  constructor() {
    this.sequelize = sequelize;
    this.validationEngine = new ValidationEngine();
  }

  /**
   * Create a flexible patch based on the input format
   * Supports multiple patch types: modify, override, hybrid, unified_diff
   */
  async createPatch(patchData) {
    try {
      console.log('🔧 [HybridPatch] Creating patch:', patchData.patch_type);

      const result = await this.validateAndNormalizePatch(patchData);
      if (!result.success) {
        return result;
      }

      const normalizedPatch = result.patch;
      
      // Generate different representations based on patch type
      const patchRepresentations = await this.generatePatchRepresentations(normalizedPatch);

      // Store in database
      const patchId = await this.storePatch(normalizedPatch, patchRepresentations);

      return {
        success: true,
        patchId,
        patchType: normalizedPatch.patch_type,
        message: `${normalizedPatch.patch_type} patch created successfully`
      };

    } catch (error) {
      console.error('❌ [HybridPatch] Failed to create patch:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate and normalize patch data from different input formats
   */
  async validateAndNormalizePatch(patchData) {
    try {
      // Detect patch format and convert to normalized structure
      const normalizedPatch = await this.detectAndNormalize(patchData);
      
      // Validate required fields
      const validation = this.validatePatchStructure(normalizedPatch);
      if (!validation.success) {
        return validation;
      }

      return {
        success: true,
        patch: normalizedPatch
      };
    } catch (error) {
      return {
        success: false,
        error: `Patch validation failed: ${error.message}`
      };
    }
  }

  /**
   * Detect patch format and normalize to standard structure
   */
  async detectAndNormalize(patchData) {
    // Handle different input formats

    // Format 1: Targeted modification
    if (patchData.patch_code && typeof patchData.patch_code === 'object' && patchData.patch_code.operation) {
      return this.normalizeModifyPatch(patchData);
    }

    // Format 2: Full override with experiment
    if (patchData.patch_type === 'override' && patchData.experiment) {
      return this.normalizeOverridePatch(patchData);
    }

    // Format 3: Standard hybrid patch
    if (patchData.patch_type && patchData.diff) {
      return this.normalizeHybridPatch(patchData);
    }

    // Format 4: Simple text replacement (legacy createHybridPatch format)
    if (patchData.originalCode && patchData.modifiedCode) {
      return this.normalizeLegacyPatch(patchData);
    }

    throw new Error('Unknown patch format');
  }

  /**
   * Normalize modify patch (targeted operations)
   */
  normalizeModifyPatch(patchData) {
    const {
      url_pattern,
      original_code,
      patch_code,
      storeId,
      filePath,
      createdBy,
      validation_rules = {},
      safety_checks = {}
    } = patchData;

    return {
      patch_type: 'modify',
      store_id: storeId,
      file_path: filePath || 'dynamic',
      url_pattern,
      patch_name: `Modify ${patch_code.target}: ${patch_code.match?.substring(0, 30)}...`,
      change_summary: `${patch_code.operation} operation on ${patch_code.target}`,
      change_description: `Targeted ${patch_code.operation} of ${patch_code.target}`,
      
      // Store original operation details
      patch_operation: {
        operation: patch_code.operation, // replace, insert, delete
        target: patch_code.target,       // ReturnStatement, FunctionDeclaration, etc.
        match: patch_code.match,         // Code pattern to match
        replacement: patch_code.replacement,
        selector: patch_code.selector    // Optional CSS/AST selector
      },

      // For modify patches, we store the transformation rule
      original_code,
      transformation_rule: patch_code,
      
      validation_rules: {
        must_contain: validation_rules.must_contain || [],
        cannot_contain: validation_rules.cannot_contain || ['process.exit'],
        preserve_functions: validation_rules.preserve_functions || [],
        ...validation_rules
      },

      safety_checks: {
        check_syntax: true,
        prevent_infinite_loops: true,
        validate_ast_changes: true,
        ...safety_checks
      },

      fallback_strategy: patchData.fallback_strategy || 'skip_on_conflict',
      created_by: createdBy,
      
      metadata: {
        input_format: 'modify_operation',
        target_type: patch_code.target,
        operation_type: patch_code.operation
      }
    };
  }

  /**
   * Normalize override patch (full replacement with A/B testing)
   */
  normalizeOverridePatch(patchData) {
    const {
      url_pattern,
      original_code,
      patch_code,
      experiment,
      storeId,
      filePath,
      createdBy,
      validation_rules = {},
      safety_checks = {}
    } = patchData;

    return {
      patch_type: 'override',
      store_id: storeId,
      file_path: filePath || 'dynamic',
      url_pattern,
      patch_name: `Override for ${experiment.name} - Variant ${experiment.variant}`,
      change_summary: `A/B test override: ${experiment.name}`,
      change_description: `Full override for experiment ${experiment.name}, variant ${experiment.variant}`,
      
      // Store experiment configuration
      experiment_config: {
        name: experiment.name,
        variant: experiment.variant,
        traffic_percentage: experiment.traffic_percentage,
        start_date: experiment.start_date,
        end_date: experiment.end_date,
        goals: experiment.goals || []
      },

      traffic_config: {
        percentage: experiment.traffic_percentage,
        distribution_method: 'hash_based',
        sticky_sessions: true
      },

      // For overrides, store both versions
      original_code,
      override_code: patch_code,
      
      validation_rules: {
        syntax_valid: true,
        preserve_exports: true,
        ...validation_rules
      },

      safety_checks: {
        check_syntax: true,
        validate_imports: true,
        prevent_xss: true,
        ...safety_checks
      },

      fallback_strategy: patchData.fallback_strategy || 'skip_on_conflict',
      created_by: createdBy,
      
      metadata: {
        input_format: 'override_with_experiment',
        experiment_type: 'ab_test'
      }
    };
  }

  /**
   * Normalize hybrid patch (standard diff + metadata)
   */
  normalizeHybridPatch(patchData) {
    return {
      patch_type: 'hybrid',
      ...patchData,
      metadata: {
        input_format: 'hybrid_patch',
        ...patchData.metadata
      }
    };
  }

  /**
   * Normalize legacy patch (backwards compatibility)
   */
  normalizeLegacyPatch(patchData) {
    const {
      storeId,
      filePath,
      originalCode,
      modifiedCode,
      patchName,
      changeType = 'text_change',
      changeSummary,
      changeDescription,
      createdBy,
      validationRules = {},
      safetyChecks = {},
      fallbackStrategy = 'skip_on_conflict',
      preConditions = [],
      postConditions = []
    } = patchData;

    return {
      patch_type: 'hybrid',
      store_id: storeId,
      file_path: filePath,
      patch_name: patchName,
      change_type: changeType,
      change_summary: changeSummary,
      change_description: changeDescription,
      original_code: originalCode,
      modified_code: modifiedCode,
      validation_rules: validationRules,
      safety_checks: safetyChecks,
      fallback_strategy: fallbackStrategy,
      pre_conditions: preConditions,
      post_conditions: postConditions,
      created_by: createdBy,
      metadata: {
        input_format: 'legacy_hybrid'
      }
    };
  }

  /**
   * Generate different representations of the patch
   * Always creates both unified diff and hybrid patch format
   */
  async generatePatchRepresentations(patch) {
    const representations = {
      unified_diff: null,
      ast_diff: null,
      operation_spec: null,
      hybrid_patch: null
    };

    try {
      switch (patch.patch_type) {
        case 'modify':
          representations.operation_spec = patch.patch_operation;
          if (patch.original_code) {
            const modifiedCode = await this.applyModifyOperation(
              patch.original_code, 
              patch.patch_operation
            );
            if (modifiedCode.success) {
              representations.unified_diff = unifiedDiffService.createDiff(
                patch.original_code,
                modifiedCode.result,
                patch.file_path
              ).unifiedDiff;
            }
          }
          break;

        case 'override':
          if (patch.original_code && patch.override_code) {
            representations.unified_diff = unifiedDiffService.createDiff(
              patch.original_code,
              patch.override_code,
              patch.file_path
            ).unifiedDiff;
          }
          break;

        case 'hybrid':
          if (patch.diff) {
            representations.unified_diff = patch.diff;
          } else if (patch.original_code && patch.modified_code) {
            representations.unified_diff = unifiedDiffService.createDiff(
              patch.original_code,
              patch.modified_code,
              patch.file_path
            ).unifiedDiff;
          }
          break;

        case 'unified_diff':
          if (patch.original_code && patch.modified_code) {
            representations.unified_diff = unifiedDiffService.createDiff(
              patch.original_code,
              patch.modified_code,
              patch.file_path
            ).unifiedDiff;
          }
          break;
      }

      // Generate AST diff for JavaScript files
      if (this.isJavaScriptFile(patch.file_path) && representations.unified_diff) {
        try {
          representations.ast_diff = await this.generateASTDiff(patch);
        } catch (error) {
          console.warn('AST diff generation failed:', error.message);
        }
      }

      // Always generate the hybrid patch format for storage and application
      if (representations.unified_diff) {
        representations.hybrid_patch = this.createHybridPatchFormat(patch, representations.unified_diff);
      }

    } catch (error) {
      console.warn('Error generating patch representations:', error.message);
    }

    return representations;
  }

  /**
   * Create the hybrid patch format with metadata
   * This is the standardized format we store and apply
   */
  createHybridPatchFormat(patch, unifiedDiff) {
    return {
      patch_type: "diff", // Always use 'diff' as the type in hybrid format
      diff: unifiedDiff,
      fallback_strategy: patch.fallback_strategy || "skip_on_conflict",
      validation_rules: {
        must_contain: patch.validation_rules?.must_contain || [],
        cannot_contain: patch.validation_rules?.cannot_contain || ["process.exit"],
        syntax_valid: patch.validation_rules?.syntax_valid !== false,
        preserve_functions: patch.validation_rules?.preserve_functions || [],
        ...patch.validation_rules
      },
      safety_checks: {
        check_syntax: true,
        prevent_infinite_loops: true,
        block_dangerous_apis: true,
        validate_imports: true,
        ...patch.safety_checks
      },
      metadata: {
        original_patch_type: patch.patch_type,
        file_path: patch.file_path,
        url_pattern: patch.url_pattern,
        created_at: new Date().toISOString(),
        checksum: this.generateChecksum(unifiedDiff),
        ...patch.metadata
      }
    };
  }

  /**
   * Store patch in database with all the new fields
   * Stores both the raw unified diff and the hybrid patch format
   */
  async storePatch(patch, representations) {
    const [result] = await this.sequelize.query(`
      INSERT INTO patch_diffs (
        store_id, file_path, patch_name, change_type, change_summary, change_description,
        unified_diff, ast_diff, patch_type, patch_operation, 
        url_pattern, experiment_config, traffic_config,
        validation_rules, safety_checks, fallback_strategy,
        pre_conditions, post_conditions, application_metadata, 
        created_by, status
      ) VALUES (
        :storeId, :filePath, :patchName, :changeType, :changeSummary, :changeDescription,
        :unifiedDiff, :astDiff, :patchType, :patchOperation,
        :urlPattern, :experimentConfig, :trafficConfig,
        :validationRules, :safetyChecks, :fallbackStrategy,
        :preConditions, :postConditions, :applicationMetadata, 
        :createdBy, 'open'
      ) RETURNING id
    `, {
      replacements: {
        storeId: patch.store_id,
        filePath: patch.file_path,
        patchName: patch.patch_name,
        changeType: patch.change_type || 'dynamic_patch',
        changeSummary: patch.change_summary,
        changeDescription: patch.change_description,
        unifiedDiff: representations.unified_diff,
        astDiff: JSON.stringify(representations.ast_diff),
        patchType: patch.patch_type,
        patchOperation: JSON.stringify(patch.patch_operation || {}),
        urlPattern: patch.url_pattern,
        experimentConfig: JSON.stringify(patch.experiment_config || {}),
        trafficConfig: JSON.stringify(patch.traffic_config || {}),
        validationRules: JSON.stringify(patch.validation_rules || {}),
        safetyChecks: JSON.stringify(patch.safety_checks || {}),
        fallbackStrategy: patch.fallback_strategy,
        preConditions: JSON.stringify(patch.pre_conditions || []),
        postConditions: JSON.stringify(patch.post_conditions || []),
        applicationMetadata: JSON.stringify({
          ...patch.metadata,
          hybrid_patch: representations.hybrid_patch // Store the hybrid format in metadata
        }),
        createdBy: patch.created_by
      },
      type: this.sequelize.QueryTypes.INSERT
    });

    console.log('💾 [HybridPatch] Stored patch with both unified diff and hybrid format:', {
      patchId: result[0].id,
      hasUnifiedDiff: !!representations.unified_diff,
      hasHybridFormat: !!representations.hybrid_patch,
      hybridPatchType: representations.hybrid_patch?.patch_type
    });

    return result[0].id;
  }

  /**
   * Legacy method for backwards compatibility
   */
  async createHybridPatch(options = {}) {
    console.log('⚠️ [HybridPatch] Using legacy createHybridPatch method, consider using createPatch()');
    return this.createPatch(options);
  }

  /**
   * Apply a patch based on its type (flexible patch application)
   */
  async applyPatch(patchId, context = {}) {
    try {
      // Get patch from database
      const [patches] = await this.sequelize.query(`
        SELECT * FROM patch_diffs WHERE id = :patchId
      `, {
        replacements: { patchId },
        type: this.sequelize.QueryTypes.SELECT
      });

      if (!patches.length) {
        throw new Error('Patch not found');
      }

      const patch = patches[0];
      
      // Route to appropriate application method based on type
      switch (patch.patch_type) {
        case 'modify':
          return await this.applyModifyPatch(patch, context);
        case 'override':
          return await this.applyOverridePatch(patch, context);
        case 'hybrid':
          return await this.applyHybridPatch(patch, context);
        default:
          return await this.applyStandardPatch(patch, context);
      }

    } catch (error) {
      console.error('❌ [HybridPatch] Failed to apply patch:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply modify patch (targeted operation)
   */
  async applyModifyPatch(patch, context) {
    const operation = JSON.parse(patch.patch_operation || '{}');
    const originalCode = context.baseCode || '';

    console.log('🔧 [HybridPatch] Applying modify patch:', operation.operation);

    const result = await this.applyModifyOperation(originalCode, operation);
    
    if (result.success) {
      // Apply validation rules using the validation engine
      const validationRules = JSON.parse(patch.validation_rules || '{}');
      const validation = await this.validationEngine.validateCode(
        result.result, 
        validationRules, 
        { originalCode, fileType: this.getFileType(patch.file_path) }
      );
      
      if (!validation.success) {
        return {
          success: false,
          error: 'Validation failed: ' + validation.errors.join(', '),
          validationResults: validation,
          appliedCode: null
        };
      }
    }

    return {
      success: result.success,
      error: result.error,
      appliedCode: result.result,
      patchType: 'modify',
      operation: operation.operation
    };
  }

  /**
   * Apply override patch (full replacement)
   */
  async applyOverridePatch(patch, context) {
    const experimentConfig = JSON.parse(patch.experiment_config || '{}');
    
    console.log('🔧 [HybridPatch] Applying override patch for experiment:', experimentConfig.name);

    // Check if user should see this variant
    const shouldApplyVariant = this.shouldApplyExperimentVariant(context, experimentConfig);
    
    if (!shouldApplyVariant) {
      return {
        success: true,
        appliedCode: context.baseCode,
        patchType: 'override',
        variant: 'control',
        experimentSkipped: true
      };
    }

    // Apply the override
    return {
      success: true,
      appliedCode: patch.override_code || context.baseCode,
      patchType: 'override',
      variant: experimentConfig.variant,
      experiment: experimentConfig.name
    };
  }

  /**
   * Apply hybrid patch with validation and fallback strategies (enhanced version)
   */
  async applyHybridPatch(patchOrId, context = {}) {
    // Handle both patch object and patch ID
    let patch;
    if (typeof patchOrId === 'string') {
      const [patches] = await this.sequelize.query(`
        SELECT * FROM patch_diffs WHERE id = :patchId AND patch_type = 'hybrid'
      `, {
        replacements: { patchId: patchOrId },
        type: this.sequelize.QueryTypes.SELECT
      });

      if (!patches.length) {
        throw new Error('Hybrid patch not found');
      }
      patch = patches[0];
    } else {
      patch = patchOrId;
    }

    const { baseCode, dryRun = false, skipValidation = false } = context;

    try {
      console.log('🔧 [HybridPatch] Applying hybrid patch:', patchId);

      // Get patch from database
      const [patches] = await this.sequelize.query(`
        SELECT * FROM patch_diffs WHERE id = :patchId AND patch_type = 'hybrid'
      `, {
        replacements: { patchId },
        type: sequelize.QueryTypes.SELECT
      });

      if (!patches.length) {
        throw new Error('Hybrid patch not found');
      }

      const patch = patches[0];
      const validationRules = JSON.parse(patch.validation_rules || '{}');
      const safetyChecks = JSON.parse(patch.safety_checks || '{}');
      const preConditions = JSON.parse(patch.pre_conditions || '[]');
      const postConditions = JSON.parse(patch.post_conditions || '[]');

      const result = {
        patchId,
        attempt: 1,
        status: 'processing',
        validationResults: {},
        appliedCode: null,
        warnings: [],
        errors: []
      };

      // Step 1: Pre-condition validation
      if (!skipValidation && preConditions.length > 0) {
        console.log('🔍 [HybridPatch] Checking pre-conditions...');
        const preValidation = await this.validateConditions(baseCode, preConditions, 'pre');
        result.validationResults.preConditions = preValidation;
        
        if (!preValidation.passed) {
          result.status = 'validation_failed';
          result.errors.push('Pre-conditions not met: ' + preValidation.failures.join(', '));
          return result;
        }
      }

      // Step 2: Apply the diff
      console.log('🔧 [HybridPatch] Applying unified diff...');
      const diffResult = unifiedDiffService.applyDiff(baseCode, patch.unified_diff);
      
      if (!diffResult.success) {
        // Handle conflict based on fallback strategy
        return await this.handlePatchConflict(patch, baseCode, diffResult, result);
      }

      let appliedCode = diffResult.result;

      // Step 3: Safety checks
      if (safetyChecks.check_syntax && this.isJavaScriptFile(patch.file_path)) {
        console.log('🔍 [HybridPatch] Checking syntax...');
        const syntaxValidation = await this.validateSyntax(appliedCode);
        result.validationResults.syntax = syntaxValidation;
        
        if (!syntaxValidation.valid) {
          result.status = 'validation_failed';
          result.errors.push('Syntax validation failed: ' + syntaxValidation.error);
          return result;
        }
      }

      // Step 4: Validation rules
      if (!skipValidation) {
        console.log('🔍 [HybridPatch] Applying validation rules...');
        const rulesValidation = await this.applyValidationRules(appliedCode, validationRules);
        result.validationResults.rules = rulesValidation;
        
        if (!rulesValidation.passed) {
          result.status = 'validation_failed';
          result.errors = result.errors.concat(rulesValidation.failures);
          return result;
        }
      }

      // Step 5: Post-condition validation
      if (!skipValidation && postConditions.length > 0) {
        console.log('🔍 [HybridPatch] Checking post-conditions...');
        const postValidation = await this.validateConditions(appliedCode, postConditions, 'post');
        result.validationResults.postConditions = postValidation;
        
        if (!postValidation.passed) {
          result.status = 'validation_failed';
          result.errors.push('Post-conditions not met: ' + postValidation.failures.join(', '));
          return result;
        }
      }

      // Step 6: Success
      result.status = 'success';
      result.appliedCode = appliedCode;

      // Store application result if not dry run
      if (!dryRun) {
        await this.recordApplicationResult(patchId, result, baseCode, appliedCode);
      }

      console.log('✅ [HybridPatch] Successfully applied hybrid patch');
      return result;

    } catch (error) {
      console.error('❌ [HybridPatch] Failed to apply hybrid patch:', error);
      return {
        patchId,
        status: 'failed',
        error: error.message,
        appliedCode: null
      };
    }
  }

  /**
   * Handle patch conflicts based on fallback strategy
   */
  async handlePatchConflict(patch, baseCode, diffResult, result) {
    console.log(`⚠️ [HybridPatch] Handling conflict with strategy: ${patch.fallback_strategy}`);
    
    result.status = 'conflict';
    result.conflictDetails = diffResult;

    switch (patch.fallback_strategy) {
      case 'skip_on_conflict':
        result.status = 'skipped';
        result.appliedCode = baseCode; // Return unchanged
        result.warnings.push('Patch skipped due to conflicts');
        break;

      case 'force_apply':
        result.warnings.push('Force applying patch despite conflicts');
        // Try to apply anyway (this is risky)
        result.appliedCode = diffResult.result || baseCode;
        break;

      case 'merge_conflict':
        result.status = 'merge_required';
        result.appliedCode = this.createMergeConflictMarkers(baseCode, diffResult);
        break;

      case 'revert_and_retry':
        result.warnings.push('Attempting patch revert and retry');
        // This would require more complex logic
        result.appliedCode = baseCode;
        break;

      default:
        result.status = 'failed';
        result.errors.push(`Unknown fallback strategy: ${patch.fallback_strategy}`);
    }

    return result;
  }

  /**
   * Generate AST diff for JavaScript files
   */
  async generateASTDiff(originalCode, modifiedCode) {
    try {
      const originalAst = parse(originalCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      const modifiedAst = parse(modifiedCode, {
        sourceType: 'module', 
        plugins: ['jsx', 'typescript']
      });

      // Simple AST comparison (can be enhanced)
      return {
        original: this.astToObject(originalAst),
        modified: this.astToObject(modifiedAst),
        changes: [] // This would contain detailed AST changes
      };
    } catch (error) {
      console.warn('AST diff generation failed:', error.message);
      return null;
    }
  }

  /**
   * Get default validation rules for a store and file type
   */
  async getDefaultValidationRules(storeId, filePath) {
    try {
      const [rules] = await this.sequelize.query(`
        SELECT rule_config, rule_type
        FROM hybrid_patch_validations 
        WHERE store_id = :storeId 
        AND is_active = true
        AND :filePath = ANY(file_patterns)
      `, {
        replacements: { storeId, filePath },
        type: sequelize.QueryTypes.SELECT
      });

      const mergedRules = {};
      rules.forEach(rule => {
        const config = JSON.parse(rule.rule_config);
        if (rule.rule_type === 'must_contain') {
          mergedRules.must_contain = (mergedRules.must_contain || []).concat(config.patterns || []);
        } else if (rule.rule_type === 'cannot_contain') {
          mergedRules.cannot_contain = (mergedRules.cannot_contain || []).concat(config.patterns || []);
        }
      });

      return mergedRules;
    } catch (error) {
      console.warn('Failed to get default validation rules:', error.message);
      return {};
    }
  }

  /**
   * Apply validation rules to code
   */
  async applyValidationRules(code, rules) {
    const result = { passed: true, failures: [] };

    // Must contain validation
    if (rules.must_contain && rules.must_contain.length > 0) {
      for (const pattern of rules.must_contain) {
        if (!code.includes(pattern)) {
          result.passed = false;
          result.failures.push(`Code must contain: ${pattern}`);
        }
      }
    }

    // Cannot contain validation
    if (rules.cannot_contain && rules.cannot_contain.length > 0) {
      for (const pattern of rules.cannot_contain) {
        if (code.includes(pattern)) {
          result.passed = false;
          result.failures.push(`Code cannot contain: ${pattern}`);
        }
      }
    }

    return result;
  }

  /**
   * Validate syntax of JavaScript code
   */
  async validateSyntax(code) {
    try {
      parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        strictMode: false
      });
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error.message,
        location: error.loc
      };
    }
  }

  /**
   * Validate conditions (pre/post)
   */
  async validateConditions(code, conditions, type) {
    const result = { passed: true, failures: [] };

    for (const condition of conditions) {
      switch (condition.type) {
        case 'contains':
          if (!code.includes(condition.value)) {
            result.passed = false;
            result.failures.push(`${type}-condition failed: must contain "${condition.value}"`);
          }
          break;
        case 'not_contains':
          if (code.includes(condition.value)) {
            result.passed = false;
            result.failures.push(`${type}-condition failed: must not contain "${condition.value}"`);
          }
          break;
        case 'function_exists':
          const functionRegex = new RegExp(`function\\s+${condition.value}\\s*\\(|const\\s+${condition.value}\\s*=|${condition.value}\\s*:\\s*function`);
          if (!functionRegex.test(code)) {
            result.passed = false;
            result.failures.push(`${type}-condition failed: function "${condition.value}" must exist`);
          }
          break;
      }
    }

    return result;
  }

  /**
   * Record application result in database
   */
  async recordApplicationResult(patchId, result, originalCode, finalCode) {
    try {
      await this.sequelize.query(`
        INSERT INTO patch_application_results (
          patch_id, store_id, application_status, validation_results,
          original_code_snippet, final_code_snippet, applied_at
        ) VALUES (
          :patchId, 
          (SELECT store_id FROM patch_diffs WHERE id = :patchId),
          :status, :validationResults, :originalCode, :finalCode, NOW()
        )
      `, {
        replacements: {
          patchId,
          status: result.status,
          validationResults: JSON.stringify(result.validationResults),
          originalCode: originalCode.substring(0, 1000), // Store snippet
          finalCode: finalCode.substring(0, 1000)
        },
        type: sequelize.QueryTypes.INSERT
      });
    } catch (error) {
      console.warn('Failed to record application result:', error.message);
    }
  }

  /**
   * Utility methods
   */
  isJavaScriptFile(filePath) {
    return /\.(js|jsx|ts|tsx)$/i.test(filePath);
  }

  getFileType(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const typeMap = {
      'js': 'javascript',
      'jsx': 'javascript-react', 
      'ts': 'typescript',
      'tsx': 'typescript-react',
      'css': 'css',
      'scss': 'scss',
      'html': 'html'
    };
    return typeMap[ext] || 'text';
  }

  generateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  astToObject(ast) {
    return JSON.parse(JSON.stringify(ast, (key, value) => {
      if (key === 'start' || key === 'end' || key === 'loc') {
        return undefined;
      }
      return value;
    }));
  }

  createMergeConflictMarkers(baseCode, diffResult) {
    return `<<<<<<< ORIGINAL\n${baseCode}\n=======\n${diffResult.result || baseCode}\n>>>>>>> MODIFIED`;
  }

  /**
   * Apply modify operation to generate modified code
   */
  async applyModifyOperation(originalCode, operation) {
    try {
      switch (operation.operation) {
        case 'replace':
          return this.applyReplaceOperation(originalCode, operation);
        case 'insert':
          return this.applyInsertOperation(originalCode, operation);
        case 'delete':
          return this.applyDeleteOperation(originalCode, operation);
        default:
          throw new Error(`Unknown operation: ${operation.operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply replace operation
   */
  applyReplaceOperation(code, operation) {
    try {
      if (operation.match && operation.replacement) {
        // Simple string replacement
        const modifiedCode = code.replace(operation.match, operation.replacement);
        return {
          success: true,
          result: modifiedCode
        };
      }

      if (operation.target && this.isJavaScriptFile()) {
        // AST-based replacement (more sophisticated)
        return this.applyASTReplacement(code, operation);
      }

      throw new Error('Invalid replace operation parameters');
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply AST-based replacement
   */
  applyASTReplacement(code, operation) {
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });

      let modified = false;

      traverse(ast, {
        [operation.target]: (path) => {
          if (operation.match) {
            const nodeCode = generate(path.node).code;
            if (nodeCode.includes(operation.match)) {
              // Replace the matched part
              const newNodeCode = nodeCode.replace(operation.match, operation.replacement);
              const newNode = parse(newNodeCode, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
              }).program.body[0];
              
              path.replaceWith(newNode);
              modified = true;
            }
          }
        }
      });

      if (!modified) {
        throw new Error(`No matching ${operation.target} found for pattern: ${operation.match}`);
      }

      const modifiedCode = generate(ast).code;
      return {
        success: true,
        result: modifiedCode
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine if experiment variant should be applied
   */
  shouldApplyExperimentVariant(context, experimentConfig) {
    const { userId, sessionId, url } = context;
    
    // Simple hash-based distribution
    const identifier = userId || sessionId || 'anonymous';
    const hash = crypto.createHash('md5').update(identifier + experimentConfig.name).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    const percentage = hashValue % 100;
    
    return percentage < experimentConfig.traffic_percentage;
  }

  /**
   * Get applicable patches for a given context (URL, file_path, etc.)
   */
  async getApplicablePatches(storeId, context = {}) {
    try {
      const { url, file_path, userId, sessionId } = context;
      
      let whereConditions = ['store_id = :storeId', 'status = :status'];
      let replacements = { storeId, status: 'open' };

      // Add URL pattern matching
      if (url) {
        whereConditions.push('(url_pattern IS NULL OR :url LIKE url_pattern)');
        replacements.url = url;
      }

      // Add file path matching
      if (file_path) {
        whereConditions.push('(file_path = :filePath OR file_path = \'dynamic\')');
        replacements.filePath = file_path;
      }

      const query = `
        SELECT * FROM patch_diffs 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY priority DESC, created_at ASC
      `;

      const patches = await this.sequelize.query(query, {
        replacements,
        type: this.sequelize.QueryTypes.SELECT
      });

      console.log(`🔍 [HybridPatch] Found ${patches.length} applicable patches for context:`, context);
      return patches;

    } catch (error) {
      console.error('❌ [HybridPatch] Error getting applicable patches:', error);
      return [];
    }
  }

  /**
   * Get patches by URL pattern
   */
  async getPatchesByUrl(storeId, url) {
    try {
      const patches = await this.sequelize.query(`
        SELECT id, patch_name, patch_type, url_pattern, change_summary, 
               experiment_config, status, created_at
        FROM patch_diffs 
        WHERE store_id = :storeId 
        AND (url_pattern IS NULL OR :url LIKE url_pattern)
        AND status IN ('open', 'published')
        ORDER BY created_at DESC
      `, {
        replacements: { storeId, url },
        type: this.sequelize.QueryTypes.SELECT
      });

      return patches;
    } catch (error) {
      console.error('❌ [HybridPatch] Error getting patches by URL:', error);
      return [];
    }
  }

  /**
   * Get detailed patch information
   */
  async getPatchDetails(patchId) {
    try {
      const [patches] = await this.sequelize.query(`
        SELECT pd.*, pr.version_name, pr.description as release_description,
               u.email as created_by_email
        FROM patch_diffs pd
        LEFT JOIN patch_releases pr ON pd.release_id = pr.id
        LEFT JOIN users u ON pd.created_by = u.id
        WHERE pd.id = :patchId
      `, {
        replacements: { patchId },
        type: this.sequelize.QueryTypes.SELECT
      });

      if (!patches.length) {
        return null;
      }

      const patch = patches[0];
      
      // Parse JSON fields
      try {
        patch.validation_rules = JSON.parse(patch.validation_rules || '{}');
        patch.safety_checks = JSON.parse(patch.safety_checks || '{}');
        patch.patch_operation = JSON.parse(patch.patch_operation || '{}');
        patch.experiment_config = JSON.parse(patch.experiment_config || '{}');
        patch.traffic_config = JSON.parse(patch.traffic_config || '{}');
        patch.application_metadata = JSON.parse(patch.application_metadata || '{}');
      } catch (error) {
        console.warn('Error parsing patch JSON fields:', error.message);
      }

      return patch;
    } catch (error) {
      console.error('❌ [HybridPatch] Error getting patch details:', error);
      return null;
    }
  }

  /**
   * Get the hybrid patch format for a patch
   * Returns the standardized hybrid patch with diff + metadata
   */
  async getHybridPatchFormat(patchId) {
    try {
      const patch = await this.getPatchDetails(patchId);
      if (!patch) {
        return null;
      }

      // Check if hybrid format is stored in metadata
      if (patch.application_metadata?.hybrid_patch) {
        return patch.application_metadata.hybrid_patch;
      }

      // Generate hybrid format on-the-fly if not stored
      if (patch.unified_diff) {
        return this.createHybridPatchFormat(patch, patch.unified_diff);
      }

      return null;
    } catch (error) {
      console.error('❌ [HybridPatch] Error getting hybrid patch format:', error);
      return null;
    }
  }

  /**
   * List patches with filtering
   */
  async listPatches(storeId, options = {}) {
    try {
      const {
        patch_type,
        status = 'open',
        limit = 50,
        offset = 0
      } = options;

      let whereConditions = ['store_id = :storeId'];
      let replacements = { storeId, limit, offset };

      if (patch_type) {
        whereConditions.push('patch_type = :patchType');
        replacements.patchType = patch_type;
      }

      if (status) {
        whereConditions.push('status = :status');
        replacements.status = status;
      }

      const query = `
        SELECT id, patch_name, patch_type, file_path, url_pattern,
               change_summary, status, created_at, updated_at,
               experiment_config, traffic_config
        FROM patch_diffs 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
      `;

      const patches = await this.sequelize.query(query, {
        replacements,
        type: this.sequelize.QueryTypes.SELECT
      });

      // Parse JSON fields for display
      patches.forEach(patch => {
        try {
          patch.experiment_config = JSON.parse(patch.experiment_config || '{}');
          patch.traffic_config = JSON.parse(patch.traffic_config || '{}');
        } catch (error) {
          // Ignore JSON parsing errors for listing
        }
      });

      return patches;
    } catch (error) {
      console.error('❌ [HybridPatch] Error listing patches:', error);
      return [];
    }
  }

  /**
   * Test patch application without applying it
   */
  async testPatch(patchId, baseCode, testContext = {}) {
    try {
      console.log('🧪 [HybridPatch] Testing patch:', patchId);

      const result = await this.applyPatch(patchId, {
        baseCode,
        dryRun: true,
        ...testContext
      });

      return {
        ...result,
        testMode: true,
        baseCodeLength: baseCode.length,
        resultCodeLength: result.appliedCode ? result.appliedCode.length : 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        testMode: true
      };
    }
  }

  /**
   * Utility methods
   */
  validatePatchStructure(patch) {
    const required = ['patch_type', 'store_id', 'created_by'];
    
    for (const field of required) {
      if (!patch[field]) {
        return {
          success: false,
          error: `Missing required field: ${field}`
        };
      }
    }

    return { success: true };
  }

  // Placeholder methods for insert and delete operations
  applyInsertOperation(code, operation) {
    return { success: false, error: 'Insert operation not implemented yet' };
  }

  applyDeleteOperation(code, operation) {
    return { success: false, error: 'Delete operation not implemented yet' };
  }

  async applyStandardPatch(patch, context) {
    return { success: false, error: 'Standard patch application not implemented yet' };
  }
}

module.exports = HybridPatchService;