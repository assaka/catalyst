/**
 * Diff-to-Slot Translator - The Heart of Phoenix Migration
 * Analyzes unified diffs and translates them into slot configurations
 * This is the most critical component for seamless migration
 */

class DiffToSlotTranslator {
  constructor() {
    // Mapping rules: diff patterns -> slot configurations
    this.translationRules = new Map();
    this.componentMappings = new Map();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default translation rules for common diff patterns
   */
  initializeDefaultRules() {
    // ProductCard Button Text Changes
    this.addTranslationRule('product_card_button_text', {
      pattern: /Add to Cart/g,
      component: 'ProductCard',
      slotId: 'product.card.add_to_cart',
      type: 'props',
      transform: (match, replacement) => ({
        text: replacement
      })
    });

    // Button Background Color Changes
    this.addTranslationRule('product_card_button_color', {
      pattern: /backgroundColor:\s*['"]([^'"]+)['"]/g,
      component: 'ProductCard',
      slotId: 'product.card.add_to_cart',
      type: 'style',
      transform: (match, color) => ({
        style: { backgroundColor: color }
      })
    });

    // Currency Symbol Changes
    this.addTranslationRule('pricing_currency', {
      pattern: /\$(\d+)/g,
      component: 'ProductCard',
      slotId: 'product.card.pricing',
      type: 'props',
      transform: (match, amount, newSymbol = '€') => ({
        currencySymbol: newSymbol
      })
    });

    // Image Styling Changes
    this.addTranslationRule('product_image_styling', {
      pattern: /className="([^"]*w-full h-48[^"]*)"/g,
      component: 'ProductCard',
      slotId: 'product.card.image',
      type: 'props',
      transform: (match, className) => ({
        className
      })
    });

    // Hiding Elements (display: none)
    this.addTranslationRule('element_hiding', {
      pattern: /display:\s*none/g,
      component: '*',
      slotId: '*',
      type: 'visibility',
      transform: () => ({
        enabled: false
      })
    });

    // Text Content Changes (generic)
    this.addTranslationRule('text_content', {
      pattern: /textContent\s*=\s*['"]([^'"]+)['"]/g,
      component: '*',
      slotId: '*',
      type: 'content',
      transform: (match, newText) => ({
        text: newText
      })
    });
  }

  /**
   * Add a new translation rule
   * @param {string} ruleId - Unique identifier for the rule
   * @param {Object} rule - Translation rule configuration
   */
  addTranslationRule(ruleId, rule) {
    this.translationRules.set(ruleId, rule);
  }

  /**
   * Main translation method: Convert unified diff to slot configuration
   * @param {string} unifiedDiff - The unified diff to translate
   * @param {string} filePath - Path to the modified file
   * @returns {Object} Slot configuration
   */
  translateDiff(unifiedDiff, filePath = '') {
    
    try {
      // Parse the unified diff
      const diffAnalysis = this.parseDiff(unifiedDiff);
      
      // Determine the target component
      const targetComponent = this.identifyTargetComponent(filePath, diffAnalysis);
      
      // Extract changes and map to slots
      const slotChanges = this.extractSlotChanges(diffAnalysis, targetComponent);
      
      // Build final configuration
      const slotConfig = this.buildSlotConfiguration(slotChanges);

      return {
        success: true,
        config: slotConfig,
        analysis: {
          targetComponent,
          changesDetected: diffAnalysis.changes.length,
          rulesMatched: slotChanges.length
        }
      };

    } catch (error) {
      console.error('❌ Error translating diff:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse unified diff into structured data
   * @param {string} unifiedDiff - Raw unified diff string
   * @returns {Object} Parsed diff analysis
   */
  parseDiff(unifiedDiff) {
    const lines = unifiedDiff.split('\n');
    const changes = [];
    let currentHunk = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Hunk header: @@ -1,4 +1,4 @@
      if (line.startsWith('@@')) {
        const hunkMatch = line.match(/@@\s*-(\d+)(?:,(\d+))?\s*\+(\d+)(?:,(\d+))?\s*@@(.*)$/);
        if (hunkMatch) {
          currentHunk = {
            oldStart: parseInt(hunkMatch[1]),
            oldLines: parseInt(hunkMatch[2] || '1'),
            newStart: parseInt(hunkMatch[3]),
            newLines: parseInt(hunkMatch[4] || '1'),
            context: hunkMatch[5].trim(),
            changes: []
          };
        }
        continue;
      }

      // Skip file headers
      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff ')) {
        continue;
      }

      // Parse change lines
      if (currentHunk && line.length > 0) {
        const changeType = line[0];
        const content = line.slice(1);

        if (changeType === '+') {
          currentHunk.changes.push({
            type: 'addition',
            content: content,
            lineNumber: currentHunk.newStart + currentHunk.changes.filter(c => c.type !== 'deletion').length
          });
        } else if (changeType === '-') {
          currentHunk.changes.push({
            type: 'deletion',
            content: content,
            lineNumber: currentHunk.oldStart + currentHunk.changes.filter(c => c.type !== 'addition').length
          });
        } else if (changeType === ' ') {
          currentHunk.changes.push({
            type: 'context',
            content: content
          });
        }
      }
    }

    if (currentHunk) {
      changes.push(currentHunk);
    }

    return {
      changes,
      summary: {
        totalHunks: changes.length,
        totalAdditions: changes.reduce((sum, hunk) => 
          sum + hunk.changes.filter(c => c.type === 'addition').length, 0),
        totalDeletions: changes.reduce((sum, hunk) => 
          sum + hunk.changes.filter(c => c.type === 'deletion').length, 0)
      }
    };
  }

  /**
   * Identify target component from file path and diff content
   * @param {string} filePath - File path
   * @param {Object} diffAnalysis - Parsed diff
   * @returns {string} Component name
   */
  identifyTargetComponent(filePath, diffAnalysis) {
    // Extract component name from file path
    const fileName = filePath.split('/').pop() || '';
    const componentMatch = fileName.match(/^([A-Z][a-zA-Z]*)/);
    
    if (componentMatch) {
      return componentMatch[1];
    }

    // Try to identify from diff content
    const allContent = diffAnalysis.changes
      .flatMap(hunk => hunk.changes)
      .map(change => change.content)
      .join(' ');

    // Look for component patterns
    if (allContent.includes('ProductCard') || allContent.includes('product-card')) {
      return 'ProductCard';
    }
    
    if (allContent.includes('MiniCart') || allContent.includes('mini-cart')) {
      return 'MiniCart';
    }
    
    if (allContent.includes('Checkout') || allContent.includes('checkout')) {
      return 'Checkout';
    }

    return 'Unknown';
  }

  /**
   * Extract slot changes from diff analysis
   * @param {Object} diffAnalysis - Parsed diff
   * @param {string} targetComponent - Target component name
   * @returns {Array} Array of slot changes
   */
  extractSlotChanges(diffAnalysis, targetComponent) {
    const slotChanges = [];

    // Process each hunk
    diffAnalysis.changes.forEach(hunk => {
      // Look for addition/deletion pairs (modifications)
      const modifications = this.findModifications(hunk.changes);
      
      modifications.forEach(modification => {
        // Try to match against translation rules
        const matchedRules = this.matchTranslationRules(
          modification, 
          targetComponent
        );
        
        slotChanges.push(...matchedRules);
      });

      // Process standalone additions (new elements)
      const additions = hunk.changes.filter(c => c.type === 'addition');
      additions.forEach(addition => {
        const matchedRules = this.matchTranslationRules(
          { type: 'addition', old: '', new: addition.content }, 
          targetComponent
        );
        slotChanges.push(...matchedRules);
      });
    });

    return slotChanges;
  }

  /**
   * Find modifications (deletion + addition pairs)
   * @param {Array} changes - Array of changes from a hunk
   * @returns {Array} Array of modifications
   */
  findModifications(changes) {
    const modifications = [];
    const deletions = changes.filter(c => c.type === 'deletion');
    const additions = changes.filter(c => c.type === 'addition');

    // Simple pairing: match deletions with additions
    const maxPairs = Math.min(deletions.length, additions.length);
    
    for (let i = 0; i < maxPairs; i++) {
      modifications.push({
        type: 'modification',
        old: deletions[i].content,
        new: additions[i].content,
        oldLine: deletions[i].lineNumber,
        newLine: additions[i].lineNumber
      });
    }

    return modifications;
  }

  /**
   * Match a modification against translation rules
   * @param {Object} modification - The modification to match
   * @param {string} targetComponent - Target component
   * @returns {Array} Array of matched slot changes
   */
  matchTranslationRules(modification, targetComponent) {
    const matches = [];

    this.translationRules.forEach((rule, ruleId) => {
      // Check if rule applies to this component
      if (rule.component !== '*' && rule.component !== targetComponent) {
        return;
      }

      let content = modification.new || modification.old || '';
      let matchResult;

      // Reset regex to avoid issues with global flag
      rule.pattern.lastIndex = 0;
      
      while ((matchResult = rule.pattern.exec(content)) !== null) {
        try {
          // Apply transformation
          const transformResult = rule.transform(
            matchResult[0], 
            ...matchResult.slice(1)
          );

          // Determine slot ID
          const slotId = this.resolveSlotId(rule.slotId, modification, targetComponent);

          matches.push({
            ruleId,
            slotId,
            type: rule.type,
            props: transformResult,
            confidence: this.calculateConfidence(rule, modification),
            context: {
              originalContent: modification.old,
              newContent: modification.new,
              matchedText: matchResult[0]
            }
          });

        } catch (error) {
          console.error(`Error applying rule ${ruleId}:`, error);
        }

        // Prevent infinite loop with global regex
        if (!rule.pattern.global) break;
      }
    });

    return matches;
  }

  /**
   * Resolve slot ID (handle wildcards)
   * @param {string} ruleSlotId - Slot ID from rule (may contain wildcards)
   * @param {Object} modification - The modification context
   * @param {string} targetComponent - Target component
   * @returns {string} Resolved slot ID
   */
  resolveSlotId(ruleSlotId, modification, targetComponent) {
    if (ruleSlotId === '*') {
      // Try to infer slot from content
      const content = modification.new || modification.old || '';
      
      if (content.includes('Add to Cart') || content.includes('ShoppingCart')) {
        return 'product.card.add_to_cart';
      }
      
      if (content.includes('price') || content.includes('$') || content.includes('€')) {
        return 'product.card.pricing';
      }
      
      if (content.includes('img') || content.includes('image')) {
        return 'product.card.image';
      }
      
      // Default fallback
      return `${targetComponent.toLowerCase()}.unknown`;
    }

    return ruleSlotId;
  }

  /**
   * Calculate confidence score for a rule match
   * @param {Object} rule - The matched rule
   * @param {Object} modification - The modification
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(rule, modification) {
    let confidence = 0.5; // Base confidence

    // Higher confidence for specific patterns
    if (rule.pattern.source.length > 10) {
      confidence += 0.2;
    }

    // Higher confidence for modifications vs additions/deletions
    if (modification.type === 'modification' && modification.old && modification.new) {
      confidence += 0.2;
    }

    // Lower confidence for wildcards
    if (rule.component === '*' || rule.slotId === '*') {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Build final slot configuration from slot changes
   * @param {Array} slotChanges - Array of slot changes
   * @returns {Object} Slot configuration
   */
  buildSlotConfiguration(slotChanges) {
    const config = {
      version: '1.0',
      slots: {},
      metadata: {
        generatedAt: new Date().toISOString(),
        translator: 'DiffToSlotTranslator',
        totalChanges: slotChanges.length
      }
    };

    // Group changes by slot ID
    const slotGroups = slotChanges.reduce((groups, change) => {
      if (!groups[change.slotId]) {
        groups[change.slotId] = [];
      }
      groups[change.slotId].push(change);
      return groups;
    }, {});

    // Build configuration for each slot
    Object.entries(slotGroups).forEach(([slotId, changes]) => {
      const slotConfig = {
        enabled: true,
        order: this.inferSlotOrder(slotId),
        props: {}
      };

      // Merge props from all changes
      changes.forEach(change => {
        if (change.type === 'props' || change.type === 'content') {
          Object.assign(slotConfig.props, change.props);
        } else if (change.type === 'style') {
          if (!slotConfig.props.style) {
            slotConfig.props.style = {};
          }
          Object.assign(slotConfig.props.style, change.props.style);
        } else if (change.type === 'visibility') {
          slotConfig.enabled = change.props.enabled;
        }
      });

      config.slots[slotId] = slotConfig;
    });

    return config;
  }

  /**
   * Infer slot order from slot ID
   * @param {string} slotId - Slot identifier
   * @returns {number} Inferred order
   */
  inferSlotOrder(slotId) {
    const orderMap = {
      'image': 1,
      'name': 2,
      'pricing': 3,
      'add_to_cart': 4,
      'actions': 5
    };

    const parts = slotId.split('.');
    const lastPart = parts[parts.length - 1];
    
    return orderMap[lastPart] || 10;
  }

  /**
   * Export translation state for debugging
   * @returns {Object}
   */
  exportState() {
    return {
      rules: Object.fromEntries(this.translationRules),
      componentMappings: Object.fromEntries(this.componentMappings)
    };
  }
}

// Create singleton instance
const diffToSlotTranslator = new DiffToSlotTranslator();

export default diffToSlotTranslator;