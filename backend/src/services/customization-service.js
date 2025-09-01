/**
 * Customization System Service
 * Handles layout changes, JavaScript modifications, and extensible customizations
 */

const { sequelize } = require('../database/connection');
const hookSystem = require('./hook-system');

class CustomizationService {
  constructor() {
    this.cache = new Map();
    this.appliedCustomizations = new Set();
  }

  /**
   * Create a new customization
   */
  async createOrUpdateCustomization(data) {
    const {
      storeId,
      type,
      name,
      description,
      targetComponent,
      targetSelector,
      customizationData,
      priority = 10,
      dependencies = [],
      conflictsWith = [],
      createdBy,
      useUpsert = false
    } = data;

    try {
      // Get customization type (handle missing table gracefully)
      let customizationType = null;
      try {
        const [result] = await sequelize.query(`
          SELECT id FROM customization_types WHERE name = :type
        `, {
          replacements: { type },
          type: sequelize.QueryTypes.SELECT
        });
        customizationType = result;
      } catch (typeError) {
        console.log(`⚠️ customization_types table not found, creating customization without type_id`);
      }

      // Process customization data to create flexible diffs
      const processedData = await this.processDiffBasedCustomization(customizationData, type);

      if (useUpsert) {
        // Check if customization exists for upsert
        const [existing] = await sequelize.query(`
          SELECT id, version_number FROM customizations 
          WHERE store_id = :storeId AND target_component = :targetComponent AND type = :type
          LIMIT 1
        `, {
          replacements: { storeId, targetComponent, type },
          type: sequelize.QueryTypes.SELECT
        });

        let result;
        
        if (existing) {
          // Update existing customization
          [result] = await sequelize.query(`
            UPDATE customizations SET
              customization_data = :customizationData::jsonb,
              description = :description,
              updated_at = NOW(),
              version_number = version_number + 1
            WHERE id = :existingId
            RETURNING id, version_number as version
          `, {
            replacements: {
              existingId: existing.id,
              customizationData: JSON.stringify(processedData),
              description
            },
            type: sequelize.QueryTypes.UPDATE
          });
        } else {
          // Create new customization
          [result] = await sequelize.query(`
            INSERT INTO customizations (
              store_id, customization_type_id, type, name, description,
              target_component, target_selector, customization_data,
              priority, dependencies, conflicts_with, created_by, updated_at
            ) VALUES (
              :storeId, :typeId, :type, :name, :description,
              :targetComponent, :targetSelector, :customizationData::jsonb,
              :priority, '{}', '{}', :createdBy, NOW()
            )
            RETURNING id, version_number as version
          `, {
            replacements: {
              storeId,
              typeId: customizationType ? customizationType.id : null,
              type,
              name,
              description,
              targetComponent,
              targetSelector: targetSelector || null,
              customizationData: JSON.stringify(processedData),
              priority,
              createdBy
            },
            type: sequelize.QueryTypes.INSERT
          });
        }

        this.clearStoreCache(storeId);
        return {
          success: true,
          message: 'Customization upserted successfully',
          data: {
            id: result[0].id,
            version: result[0].version,
            isUpdate: !!existing
          }
        };
      }

      // Check for conflicts
      const conflicts = await this.checkConflicts(storeId, conflictsWith);
      if (conflicts.length > 0) {
        return {
          success: false,
          error: `Conflicts detected with: ${conflicts.join(', ')}`,
          conflicts
        };
      }

      // Create new customization
      const [result] = await sequelize.query(`
        INSERT INTO customizations (
          store_id, customization_type_id, type, name, description,
          target_component, target_selector, customization_data,
          priority, dependencies, conflicts_with, created_by
        ) VALUES (
          :storeId, :typeId, :type, :name, :description,
          :targetComponent, :targetSelector, :customizationData::jsonb,
          :priority, '{}', '{}', :createdBy
        ) RETURNING id, version_number as version
      `, {
        replacements: {
          storeId,
          typeId: customizationType ? customizationType.id : null,
          type,
          name,
          description,
          targetComponent,
          targetSelector: targetSelector || null,
          customizationData: JSON.stringify(processedData),
          priority,
          createdBy
        },
        type: sequelize.QueryTypes.INSERT
      });

      this.clearStoreCache(storeId);

      // Apply hooks
      hookSystem.do('customization.created', {
        customizationId: result[0].id,
        storeId,
        type,
        customizationData
      });

      return {
        success: true,
        customization: {
          id: result[0].id,
          version: result[0].version,
          name,
          type
        }
      };

    } catch (error) {
      console.error('❌ Error creating customization:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all customizations for a store
   */
  async getStoreCustomizations(storeId, options = {}) {
    const {
      category = null,
      isActive = true,
      includeTemplates = false
    } = options;

    const cacheKey = `store_${storeId}_${category}_${isActive}_${includeTemplates}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let whereClause = 'c.store_id = :storeId';
      const replacements = { storeId };

      if (isActive !== null) {
        whereClause += ' AND c.is_active = :isActive';
        replacements.isActive = isActive;
      }

      if (category) {
        whereClause += ' AND ct.category = :category';
        replacements.category = category;
      }

      const customizations = await sequelize.query(`
        SELECT 
          c.id,
          c.name,
          c.description,
          c.target_component,
          c.target_selector,
          c.customization_data,
          c.priority,
          c.dependencies,
          c.conflicts_with,
          c.version_number as version,
          c.is_active,
          c.created_at,
          c.updated_at,
          c.type,
          COALESCE(ct.category, 'uncategorized') as category,
          ct.description as type_description
        FROM customizations c
        LEFT JOIN customization_types ct ON c.customization_type_id = ct.id
        WHERE ${whereClause}
        ORDER BY c.priority ASC, c.created_at ASC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      const result = {
        success: true,
        customizations: customizations.map(c => ({
          ...c,
          customization_data: c.customization_data,
          dependencies: c.dependencies || [],
          conflicts_with: c.conflicts_with || []
        }))
      };

      // Cache for 5 minutes
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

      return result;

    } catch (error) {
      console.error('❌ Error getting store customizations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply customizations to a component/page
   */
  async applyCustomizations(storeId, targetComponent, context = {}) {
    try {
      const customizations = await this.getStoreCustomizations(storeId, {
        isActive: true
      });

      if (!customizations.success) {
        return customizations;
      }

      // Filter customizations for this target
      const applicableCustomizations = customizations.customizations.filter(c => 
        c.target_component === targetComponent || 
        c.target_component === '*' ||
        (c.target_selector && context.selectors?.includes(c.target_selector))
      );

      // Sort by priority and resolve dependencies
      const sortedCustomizations = await this.resolveDependencies(applicableCustomizations);
      
      const appliedResults = [];
      const errors = [];

      for (const customization of sortedCustomizations) {
        const startTime = Date.now();
        
        try {
          const result = await this.applyCustomization(customization, context);
          const executionTime = Date.now() - startTime;

          appliedResults.push({
            customizationId: customization.id,
            name: customization.name,
            type: customization.type,
            success: result.success,
            data: result.data,
            executionTime
          });

          // Log successful application
          await this.logCustomizationApplication(storeId, customization.id, {
            status: 'success',
            executionTime,
            context: context.page || 'unknown'
          });

          // Apply hooks
          hookSystem.do('customization.applied', {
            customizationId: customization.id,
            storeId,
            targetComponent,
            result: result.data
          });

        } catch (error) {
          const executionTime = Date.now() - startTime;
          
          errors.push({
            customizationId: customization.id,
            name: customization.name,
            error: error.message
          });

          // Log error
          await this.logCustomizationApplication(storeId, customization.id, {
            status: 'error',
            errorMessage: error.message,
            executionTime,
            context: context.page || 'unknown'
          });

          console.error(`❌ Error applying customization ${customization.name}:`, error);
        }
      }

      return {
        success: errors.length === 0,
        applied: appliedResults,
        errors: errors,
        totalCustomizations: applicableCustomizations.length
      };

    } catch (error) {
      console.error('❌ Error in applyCustomizations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply a single customization
   */
  async applyCustomization(customization, context) {
    const { type, customization_data } = customization;

    switch (type) {
      case 'layout_modification':
        return this.applyLayoutModification(customization_data, context);
      
      case 'css_injection':
        return this.applyCSSInjection(customization_data, context);
      
      case 'javascript_injection':
        return this.applyJavaScriptInjection(customization_data, context);
      
      case 'component_replacement':
        return this.applyComponentReplacement(customization_data, context);
      
      case 'hook_customization':
        return this.applyHookCustomization(customization_data, context);
      
      case 'event_handler':
        return this.applyEventHandler(customization_data, context);
      
      case 'file_modification':
        return this.applyFileModification(customization_data, context);
      
      default:
        // Try to find extension handler
        const extensionResult = hookSystem.apply(`customization.${type}`, customization_data, context);
        
        if (extensionResult !== customization_data) {
          return { success: true, data: extensionResult };
        }
        
        throw new Error(`Unknown customization type: ${type}`);
    }
  }

  /**
   * Layout modification handler
   */
  async applyLayoutModification(data, context) {
    const { modifications } = data;
    const result = {
      type: 'layout',
      changes: []
    };

    for (const mod of modifications || []) {
      const { action, selector, properties } = mod;
      
      result.changes.push({
        action, // 'modify', 'hide', 'move', 'resize'
        selector,
        properties,
        applied: true
      });
    }

    return { success: true, data: result };
  }

  /**
   * CSS injection handler
   */
  async applyCSSInjection(data, context) {
    const { css, media, scope } = data;
    
    return {
      success: true,
      data: {
        type: 'css',
        css: css,
        media: media || 'all',
        scope: scope || 'global',
        injected: true
      }
    };
  }

  /**
   * JavaScript injection handler
   */
  async applyJavaScriptInjection(data, context) {
    const { code, timing, dependencies } = data;
    
    return {
      success: true,
      data: {
        type: 'javascript',
        code: code,
        timing: timing || 'immediate', // 'immediate', 'dom_ready', 'window_load'
        dependencies: dependencies || [],
        executed: false // Will be executed client-side
      }
    };
  }

  /**
   * Component replacement handler
   */
  async applyComponentReplacement(data, context) {
    const { targetComponent, replacementComponent, props } = data;
    
    return {
      success: true,
      data: {
        type: 'component_replacement',
        targetComponent,
        replacementComponent,
        props: props || {},
        replaced: true
      }
    };
  }

  /**
   * Hook customization handler
   */
  async applyHookCustomization(data, context) {
    const { hookName, handler, priority } = data;
    
    // Register the hook
    hookSystem.register(hookName, eval(`(${handler})`), priority);
    
    return {
      success: true,
      data: {
        type: 'hook',
        hookName,
        priority,
        registered: true
      }
    };
  }

  /**
   * Event handler registration
   */
  async applyEventHandler(data, context) {
    const { eventName, handler, selector, priority } = data;
    
    return {
      success: true,
      data: {
        type: 'event',
        eventName,
        selector,
        handler,
        priority: priority || 10,
        registered: true
      }
    };
  }

  /**
   * File modification handler (replaces patch system)
   */
  async applyFileModification(data, context) {
    const { 
      filePath, 
      originalCode, 
      modifiedCode, 
      language = 'javascript',
      changeSummary = 'File modified',
      changeType = 'manual_edit'
    } = data;
    
    return {
      success: true,
      data: {
        type: 'file_modification',
        filePath,
        originalCode,
        modifiedCode,
        language,
        changeSummary,
        changeType,
        appliedAt: new Date().toISOString(),
        // Calculate basic diff stats
        linesAdded: this.calculateAddedLines(originalCode, modifiedCode),
        linesRemoved: this.calculateRemovedLines(originalCode, modifiedCode),
        linesModified: this.calculateModifiedLines(originalCode, modifiedCode)
      }
    };
  }

  /**
   * Check for conflicts between customizations
   */
  async checkConflicts(storeId, conflictsWith) {
    if (!conflictsWith || conflictsWith.length === 0) {
      return [];
    }

    const results = await sequelize.query(`
      SELECT name FROM customizations 
      WHERE store_id = :storeId 
      AND name = ANY(:conflictsWith) 
      AND is_active = true
    `, {
      replacements: {
        storeId,
        conflictsWith
      },
      type: sequelize.QueryTypes.SELECT
    });

    return results.map(r => r.name);
  }

  /**
   * Resolve dependencies and sort customizations
   */
  async resolveDependencies(customizations) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (customization) => {
      if (visiting.has(customization.id)) {
        throw new Error(`Circular dependency detected: ${customization.name}`);
      }
      
      if (visited.has(customization.id)) {
        return;
      }

      visiting.add(customization.id);

      // Process dependencies first
      const dependencies = customization.dependencies || [];
      for (const depName of dependencies) {
        const dep = customizations.find(c => c.name === depName);
        if (dep) {
          visit(dep);
        }
      }

      visiting.delete(customization.id);
      visited.add(customization.id);
      sorted.push(customization);
    };

    // Sort by priority first, then resolve dependencies
    const prioritySorted = [...customizations].sort((a, b) => a.priority - b.priority);
    
    for (const customization of prioritySorted) {
      visit(customization);
    }

    return sorted;
  }

  /**
   * Log customization application
   */
  async logCustomizationApplication(storeId, customizationId, logData) {
    try {
      await sequelize.query(`
        INSERT INTO customization_logs (
          store_id, customization_id, application_context,
          execution_time_ms, status, error_message, warning_message
        ) VALUES (
          :storeId, :customizationId, :context,
          :executionTime, :status, :errorMessage, :warningMessage
        )
      `, {
        replacements: {
          storeId,
          customizationId,
          context: logData.context || 'unknown',
          executionTime: logData.executionTime || 0,
          status: logData.status,
          errorMessage: logData.errorMessage || null,
          warningMessage: logData.warningMessage || null
        },
        type: sequelize.QueryTypes.INSERT
      });
    } catch (error) {
      console.error('❌ Error logging customization application:', error);
    }
  }

  /**
   * Clear cache for a store
   */
  clearStoreCache(storeId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`store_${storeId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Calculate added lines in diff
   */
  calculateAddedLines(original, modified) {
    const originalLines = (original || '').split('\n');
    const modifiedLines = (modified || '').split('\n');
    
    // Simple approximation - count lines that exist in modified but not in original
    const originalSet = new Set(originalLines.map(line => line.trim()));
    let added = 0;
    
    for (const line of modifiedLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !originalSet.has(trimmedLine)) {
        added++;
      }
    }
    
    return added;
  }

  /**
   * Calculate removed lines in diff
   */
  calculateRemovedLines(original, modified) {
    const originalLines = (original || '').split('\n');
    const modifiedLines = (modified || '').split('\n');
    
    // Simple approximation - count lines that exist in original but not in modified
    const modifiedSet = new Set(modifiedLines.map(line => line.trim()));
    let removed = 0;
    
    for (const line of originalLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !modifiedSet.has(trimmedLine)) {
        removed++;
      }
    }
    
    return removed;
  }

  /**
   * Calculate modified lines in diff
   */
  calculateModifiedLines(original, modified) {
    const originalLines = (original || '').split('\n');
    const modifiedLines = (modified || '').split('\n');
    
    // Simple approximation - total lines changed
    return Math.abs(modifiedLines.length - originalLines.length);
  }

  /**
   * Process customization data to create flexible, pattern-based diffs
   */
  async processDiffBasedCustomization(customizationData, type) {
    if (type !== 'file_modification') {
      return customizationData; // Non-file modifications don't need diff processing
    }

    const { originalCode, modifiedCode, filePath } = customizationData;
    
    if (!originalCode || !modifiedCode) {
      return customizationData; // Can't create diff without both versions
    }

    try {
      // Create semantic diffs instead of line-based diffs
      const semanticDiffs = await this.createSemanticDiffs(originalCode, modifiedCode, filePath);
      
      return {
        ...customizationData,
        semanticDiffs,
        diffType: 'semantic',
        // Keep original data for fallback
        originalCodeHash: this.createHash(originalCode),
        modifiedCodeHash: this.createHash(modifiedCode),
        // Remove full code to save space (keep only for debugging)
        originalCode: process.env.NODE_ENV === 'development' ? originalCode : undefined,
        modifiedCode: process.env.NODE_ENV === 'development' ? modifiedCode : undefined
      };
    } catch (error) {
      console.warn('Failed to create semantic diffs, falling back to basic storage:', error);
      return customizationData;
    }
  }

  /**
   * Create semantic, pattern-based diffs that are resilient to line number changes
   */
  async createSemanticDiffs(originalCode, modifiedCode, filePath) {
    const changes = [];
    
    // Split into logical segments (functions, components, imports, etc.)
    const originalSegments = this.parseCodeSegments(originalCode, filePath);
    const modifiedSegments = this.parseCodeSegments(modifiedCode, filePath);
    
    // Find changes by semantic meaning rather than line numbers
    for (const modifiedSegment of modifiedSegments) {
      const originalSegment = originalSegments.find(seg => 
        seg.name === modifiedSegment.name && seg.type === modifiedSegment.type
      );
      
      if (!originalSegment) {
        // New segment added
        changes.push({
          type: 'add',
          segmentType: modifiedSegment.type,
          segmentName: modifiedSegment.name,
          content: modifiedSegment.content,
          pattern: modifiedSegment.pattern,
          insertAfter: this.findInsertionPoint(modifiedSegments, modifiedSegment),
          metadata: modifiedSegment.metadata
        });
      } else if (originalSegment.content !== modifiedSegment.content) {
        // Segment modified
        changes.push({
          type: 'modify',
          segmentType: modifiedSegment.type,
          segmentName: modifiedSegment.name,
          originalContent: originalSegment.content,
          newContent: modifiedSegment.content,
          pattern: modifiedSegment.pattern,
          metadata: {
            ...modifiedSegment.metadata,
            changeSize: modifiedSegment.content.length - originalSegment.content.length
          }
        });
      }
    }
    
    // Find removed segments
    for (const originalSegment of originalSegments) {
      const stillExists = modifiedSegments.find(seg => 
        seg.name === originalSegment.name && seg.type === originalSegment.type
      );
      
      if (!stillExists) {
        changes.push({
          type: 'remove',
          segmentType: originalSegment.type,
          segmentName: originalSegment.name,
          pattern: originalSegment.pattern,
          metadata: originalSegment.metadata
        });
      }
    }
    
    return changes;
  }

  /**
   * Parse code into logical segments (functions, components, imports, etc.)
   */
  parseCodeSegments(code, filePath) {
    const segments = [];
    const lines = code.split('\n');
    let currentSegment = null;
    let currentContent = [];
    
    const isJavaScript = filePath.endsWith('.js') || filePath.endsWith('.jsx') || 
                        filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const originalLine = lines[i];
      
      if (isJavaScript) {
        // Detect React components
        if (line.match(/^(export\s+)?(default\s+)?const\s+\w+\s*=\s*\(/)) {
          if (currentSegment) segments.push(currentSegment);
          const componentName = line.match(/const\s+(\w+)/)?.[1];
          currentSegment = {
            type: 'component',
            name: componentName,
            pattern: `const ${componentName}`,
            startLine: i,
            content: '',
            metadata: { isReactComponent: true }
          };
          currentContent = [originalLine];
        }
        // Detect function declarations
        else if (line.match(/^(export\s+)?(async\s+)?function\s+\w+/)) {
          if (currentSegment) segments.push(currentSegment);
          const funcName = line.match(/function\s+(\w+)/)?.[1];
          currentSegment = {
            type: 'function',
            name: funcName,
            pattern: `function ${funcName}`,
            startLine: i,
            content: '',
            metadata: { isAsync: line.includes('async') }
          };
          currentContent = [originalLine];
        }
        // Detect imports
        else if (line.startsWith('import ')) {
          if (currentSegment && currentSegment.type !== 'imports') {
            segments.push(currentSegment);
            currentSegment = null;
          }
          if (!currentSegment || currentSegment.type !== 'imports') {
            currentSegment = {
              type: 'imports',
              name: 'imports',
              pattern: 'import',
              startLine: i,
              content: '',
              metadata: { importCount: 0 }
            };
            currentContent = [];
          }
          currentContent.push(originalLine);
          currentSegment.metadata.importCount++;
        }
        // Add to current segment
        else if (currentSegment) {
          currentContent.push(originalLine);
        }
        // Standalone code
        else {
          currentContent.push(originalLine);
        }
      }
      
      // Update content for current segment
      if (currentSegment) {
        currentSegment.content = currentContent.join('\n');
        currentSegment.endLine = i;
      }
    }
    
    // Add final segment
    if (currentSegment) {
      segments.push(currentSegment);
    }
    
    return segments;
  }

  /**
   * Find appropriate insertion point for new segments
   */
  findInsertionPoint(segments, newSegment) {
    // Logic to determine where new segment should be inserted
    // Based on type, dependencies, and conventions
    if (newSegment.type === 'imports') return 'beginning';
    if (newSegment.type === 'component') return 'before_export';
    return 'end';
  }

  /**
   * Create hash for content comparison
   */
  createHash(content) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Fetch customizations for a component/page when loading
   */
  async getCustomizationsForComponent(storeId, componentName, options = {}) {
    try {
      const { includeInactive = false, type = null } = options;
      
      let whereClause = 'store_id = :storeId AND target_component = :componentName';
      const replacements = { storeId, componentName };
      
      if (!includeInactive) {
        whereClause += ' AND is_active = true';
      }
      
      if (type) {
        whereClause += ' AND type = :type';
        replacements.type = type;
      }
      
      const [customizations] = await sequelize.query(`
        SELECT 
          id, type, name, description, target_component, target_selector,
          customization_data, priority, created_at, updated_at, version_number
        FROM customizations
        WHERE ${whereClause}
        ORDER BY priority ASC, created_at ASC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        success: true,
        customizations: customizations || [],
        count: customizations ? customizations.length : 0
      };
      
    } catch (error) {
      console.error('❌ Error fetching component customizations:', error);
      return {
        success: false,
        error: error.message,
        customizations: []
      };
    }
  }

  /**
   * Apply semantic diffs to current code
   */
  async applySemanticDiffs(baseCode, semanticDiffs, filePath) {
    if (!semanticDiffs || semanticDiffs.length === 0) {
      return baseCode;
    }
    
    let modifiedCode = baseCode;
    const segments = this.parseCodeSegments(baseCode, filePath);
    
    for (const diff of semanticDiffs) {
      try {
        if (diff.type === 'add') {
          modifiedCode = this.insertSegment(modifiedCode, diff, segments);
        } else if (diff.type === 'modify') {
          modifiedCode = this.modifySegment(modifiedCode, diff, segments);
        } else if (diff.type === 'remove') {
          modifiedCode = this.removeSegment(modifiedCode, diff, segments);
        }
      } catch (error) {
        console.warn(`Failed to apply diff ${diff.type} for ${diff.segmentName}:`, error);
      }
    }
    
    return modifiedCode;
  }

  /**
   * Insert a new segment into code
   */
  insertSegment(code, diff, segments) {
    // Implementation for inserting new code segments
    const lines = code.split('\n');
    const insertPoint = this.findActualInsertionPoint(lines, diff, segments);
    lines.splice(insertPoint, 0, diff.content);
    return lines.join('\n');
  }

  /**
   * Modify an existing segment
   */
  modifySegment(code, diff, segments) {
    // Find the segment by pattern rather than line number
    const segment = segments.find(s => 
      s.name === diff.segmentName && s.type === diff.segmentType
    );
    
    if (segment) {
      return code.replace(diff.originalContent, diff.newContent);
    }
    
    return code;
  }

  /**
   * Remove a segment from code
   */
  removeSegment(code, diff, segments) {
    const segment = segments.find(s => 
      s.name === diff.segmentName && s.type === diff.segmentType
    );
    
    if (segment) {
      const lines = code.split('\n');
      lines.splice(segment.startLine, segment.endLine - segment.startLine + 1);
      return lines.join('\n');
    }
    
    return code;
  }

  findActualInsertionPoint(lines, diff, segments) {
    // Smart insertion point detection based on code structure
    if (diff.insertAfter === 'beginning') return 0;
    if (diff.insertAfter === 'end') return lines.length;
    
    // Find export default line for 'before_export'
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith('export default')) {
        return i;
      }
    }
    
    return lines.length;
  }

  // Legacy method for backward compatibility
  async createCustomization(data) {
    return this.createOrUpdateCustomization(data);
  }

  /**
   * Get customization statistics
   */
  async getCustomizationStats(storeId) {
    try {
      const [stats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_customizations,
          COUNT(CASE WHEN c.is_active THEN 1 END) as active_customizations,
          COUNT(DISTINCT ct.category) as categories_used,
          AVG(c.priority) as avg_priority
        FROM customizations c
        LEFT JOIN customization_types ct ON c.customization_type_id = ct.id
        WHERE c.store_id = :storeId
      `, {
        replacements: { storeId },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        success: true,
        stats: stats[0] || {
          total_customizations: 0,
          active_customizations: 0,
          categories_used: 0,
          avg_priority: 0
        }
      };

    } catch (error) {
      console.error('❌ Error getting customization stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CustomizationService();