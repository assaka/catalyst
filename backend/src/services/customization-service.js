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
  async createCustomization(data) {
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
      createdBy
    } = data;

    try {
      // Get customization type
      const [customizationType] = await sequelize.query(`
        SELECT id FROM customization_types WHERE name = :type
      `, {
        replacements: { type },
        type: sequelize.QueryTypes.SELECT
      });

      if (!customizationType) {
        return {
          success: false,
          error: `Invalid customization type: ${type}`
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

      // Create customization
      const [result] = await sequelize.query(`
        INSERT INTO store_customizations (
          store_id, customization_type_id, name, description,
          target_component, target_selector, customization_data,
          priority, dependencies, conflicts_with, created_by
        ) VALUES (
          :storeId, :typeId, :name, :description,
          :targetComponent, :targetSelector, :customizationData::jsonb,
          :priority, :dependencies::jsonb, :conflictsWith::jsonb, :createdBy
        ) RETURNING id, version
      `, {
        replacements: {
          storeId,
          typeId: customizationType.id,
          name,
          description,
          targetComponent,
          targetSelector,
          customizationData: JSON.stringify(customizationData),
          priority,
          dependencies: JSON.stringify(dependencies),
          conflictsWith: JSON.stringify(conflictsWith),
          createdBy
        },
        type: sequelize.QueryTypes.INSERT
      });

      // Clear cache for this store
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
      let whereClause = 'sc.store_id = :storeId';
      const replacements = { storeId };

      if (isActive !== null) {
        whereClause += ' AND sc.is_active = :isActive';
        replacements.isActive = isActive;
      }

      if (category) {
        whereClause += ' AND ct.category = :category';
        replacements.category = category;
      }

      const customizations = await sequelize.query(`
        SELECT 
          sc.id,
          sc.name,
          sc.description,
          sc.target_component,
          sc.target_selector,
          sc.customization_data,
          sc.priority,
          sc.dependencies,
          sc.conflicts_with,
          sc.version,
          sc.is_active,
          sc.created_at,
          sc.updated_at,
          ct.name as type,
          ct.category,
          ct.description as type_description
        FROM store_customizations sc
        JOIN customization_types ct ON sc.customization_type_id = ct.id
        WHERE ${whereClause}
        ORDER BY sc.priority ASC, sc.created_at ASC
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

    const [results] = await sequelize.query(`
      SELECT name FROM store_customizations 
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
   * Get customization statistics
   */
  async getCustomizationStats(storeId) {
    try {
      const [stats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_customizations,
          COUNT(CASE WHEN is_active THEN 1 END) as active_customizations,
          COUNT(DISTINCT ct.category) as categories_used,
          AVG(priority) as avg_priority
        FROM store_customizations sc
        JOIN customization_types ct ON sc.customization_type_id = ct.id
        WHERE sc.store_id = :storeId
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