/**
 * Migration Validator - Ensures migration success and DOM output consistency
 * Validates that the new slot-based components render identically to the old diff-based ones
 */

import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';

class MigrationValidator {
  constructor() {
    this.validationResults = new Map();
    this.thresholds = {
      domSimilarity: 0.95,      // 95% similarity required
      performanceRatio: 1.2,    // New system can't be more than 20% slower
      errorRate: 0.01           // Less than 1% error rate allowed
    };
  }

  /**
   * Validate that a migration was successful by comparing DOM outputs
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  async validateMigration(options) {
    const {
      userId,
      componentName,
      originalComponent: OriginalComponent,
      slottedComponent: SlottedComponent,
      testProps,
      userConfig
    } = options;

    try {
      // Render original component
      const originalOutput = await this.renderComponent(OriginalComponent, testProps);
      
      // Render new slotted component with user config
      const slottedOutput = await this.renderSlottedComponent(
        SlottedComponent, 
        testProps, 
        userConfig
      );

      // Compare DOM outputs
      const domComparison = await this.compareDOMOutputs(originalOutput, slottedOutput);
      
      // Performance comparison
      const performanceComparison = await this.comparePerformance(
        OriginalComponent,
        SlottedComponent,
        testProps,
        userConfig
      );

      // Accessibility comparison
      const accessibilityComparison = await this.compareAccessibility(
        originalOutput,
        slottedOutput
      );

      // Generate validation result
      const result = {
        userId,
        componentName,
        timestamp: new Date().toISOString(),
        success: true,
        score: 0,
        details: {
          dom: domComparison,
          performance: performanceComparison,
          accessibility: accessibilityComparison
        },
        issues: [],
        recommendations: []
      };

      // Calculate overall score and check thresholds
      result.score = this.calculateOverallScore(result.details);
      result.success = this.checkThresholds(result);
      result.issues = this.identifyIssues(result.details);
      result.recommendations = this.generateRecommendations(result);

      this.validationResults.set(`${userId}-${componentName}`, result);

      return result;

    } catch (error) {
      return {
        userId,
        componentName,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Render a React component to DOM string
   * @param {React.Component} Component - Component to render
   * @param {Object} props - Props to pass to component
   * @returns {string} Rendered DOM string
   */
  async renderComponent(Component, props) {
    return new Promise((resolve, reject) => {
      try {
        // Create virtual DOM
        const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>');
        global.document = dom.window.document;
        global.window = dom.window;

        const container = document.getElementById('root');
        const root = createRoot(container);

        // Render component
        root.render(React.createElement(Component, props));

        // Wait for render to complete
        setTimeout(() => {
          const html = container.innerHTML;
          root.unmount();
          resolve(html);
        }, 100);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Render slotted component with user configuration
   * @param {React.Component} SlottedComponent - Slotted component
   * @param {Object} props - Component props
   * @param {Object} userConfig - User slot configuration
   * @returns {string} Rendered DOM string
   */
  async renderSlottedComponent(SlottedComponent, props, userConfig) {
    // Apply user configuration to slot registry
    if (userConfig) {
      const { loadUserConfiguration } = await import('../slot-system');
      loadUserConfiguration(userConfig);
    }

    return this.renderComponent(SlottedComponent, props);
  }

  /**
   * Compare DOM outputs for similarity
   * @param {string} originalHTML - Original component HTML
   * @param {string} slottedHTML - Slotted component HTML
   * @returns {Object} Comparison result
   */
  async compareDOMOutputs(originalHTML, slottedHTML) {
    const comparison = {
      similarity: 0,
      differences: [],
      structuralChanges: [],
      contentChanges: [],
      styleChanges: []
    };

    try {
      // Parse HTML
      const originalDOM = new JSDOM(originalHTML);
      const slottedDOM = new JSDOM(slottedHTML);
      
      const originalDoc = originalDOM.window.document;
      const slottedDoc = slottedDOM.window.document;

      // Compare structure
      comparison.structuralChanges = this.compareStructure(
        originalDoc.body,
        slottedDoc.body
      );

      // Compare content
      comparison.contentChanges = this.compareContent(
        originalDoc.body,
        slottedDoc.body
      );

      // Compare styles
      comparison.styleChanges = this.compareStyles(
        originalDoc.body,
        slottedDoc.body
      );

      // Calculate similarity score
      comparison.similarity = this.calculateSimilarity(
        comparison.structuralChanges,
        comparison.contentChanges,
        comparison.styleChanges
      );

      // Combine all differences
      comparison.differences = [
        ...comparison.structuralChanges,
        ...comparison.contentChanges,
        ...comparison.styleChanges
      ];

    } catch (error) {
      console.error('Error comparing DOM outputs:', error);
      comparison.error = error.message;
    }

    return comparison;
  }

  /**
   * Compare DOM structure between two elements
   * @param {Element} original - Original element
   * @param {Element} slotted - Slotted element
   * @returns {Array} Array of structural differences
   */
  compareStructure(original, slotted) {
    const differences = [];

    // Compare tag names
    if (original.tagName !== slotted.tagName) {
      differences.push({
        type: 'tag_mismatch',
        original: original.tagName,
        slotted: slotted.tagName,
        severity: 'high'
      });
    }

    // Compare child count
    if (original.children.length !== slotted.children.length) {
      differences.push({
        type: 'child_count_mismatch',
        original: original.children.length,
        slotted: slotted.children.length,
        severity: 'medium'
      });
    }

    // Compare attributes
    const originalAttrs = Array.from(original.attributes || []);
    const slottedAttrs = Array.from(slotted.attributes || []);

    originalAttrs.forEach(attr => {
      if (!slotted.hasAttribute(attr.name)) {
        differences.push({
          type: 'missing_attribute',
          attribute: attr.name,
          value: attr.value,
          severity: 'low'
        });
      } else if (slotted.getAttribute(attr.name) !== attr.value) {
        differences.push({
          type: 'attribute_value_mismatch',
          attribute: attr.name,
          original: attr.value,
          slotted: slotted.getAttribute(attr.name),
          severity: 'medium'
        });
      }
    });

    // Recursively compare children
    const minChildren = Math.min(original.children.length, slotted.children.length);
    for (let i = 0; i < minChildren; i++) {
      const childDifferences = this.compareStructure(
        original.children[i],
        slotted.children[i]
      );
      differences.push(...childDifferences.map(diff => ({
        ...diff,
        path: `child[${i}].${diff.path || ''}`
      })));
    }

    return differences;
  }

  /**
   * Compare text content between elements
   * @param {Element} original - Original element
   * @param {Element} slotted - Slotted element
   * @returns {Array} Array of content differences
   */
  compareContent(original, slotted) {
    const differences = [];

    const originalText = original.textContent?.trim() || '';
    const slottedText = slotted.textContent?.trim() || '';

    if (originalText !== slottedText) {
      differences.push({
        type: 'text_content_mismatch',
        original: originalText,
        slotted: slottedText,
        severity: this.calculateTextChangeSeverity(originalText, slottedText)
      });
    }

    return differences;
  }

  /**
   * Compare styles between elements
   * @param {Element} original - Original element
   * @param {Element} slotted - Slotted element
   * @returns {Array} Array of style differences
   */
  compareStyles(original, slotted) {
    const differences = [];

    // Compare computed styles (simplified - in real implementation would use getComputedStyle)
    const originalStyle = original.getAttribute('style') || '';
    const slottedStyle = slotted.getAttribute('style') || '';

    if (originalStyle !== slottedStyle) {
      differences.push({
        type: 'inline_style_mismatch',
        original: originalStyle,
        slotted: slottedStyle,
        severity: 'low'
      });
    }

    // Compare class names
    const originalClasses = original.className?.split(' ').sort() || [];
    const slottedClasses = slotted.className?.split(' ').sort() || [];

    const classesMatch = JSON.stringify(originalClasses) === JSON.stringify(slottedClasses);
    if (!classesMatch) {
      differences.push({
        type: 'class_mismatch',
        original: originalClasses,
        slotted: slottedClasses,
        severity: 'medium'
      });
    }

    return differences;
  }

  /**
   * Calculate similarity score based on differences
   * @param {Array} structuralChanges - Structural differences
   * @param {Array} contentChanges - Content differences
   * @param {Array} styleChanges - Style differences
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(structuralChanges, contentChanges, styleChanges) {
    const weights = {
      structural: 0.5,  // Structural changes are most important
      content: 0.3,     // Content changes are moderately important
      style: 0.2        // Style changes are least important
    };

    const penalties = {
      high: 0.3,
      medium: 0.15,
      low: 0.05
    };

    let totalPenalty = 0;

    // Apply penalties for each type of change
    [structuralChanges, contentChanges, styleChanges].forEach((changes, index) => {
      const weight = Object.values(weights)[index];
      
      changes.forEach(change => {
        const penalty = penalties[change.severity] || penalties.low;
        totalPenalty += penalty * weight;
      });
    });

    return Math.max(0, 1 - totalPenalty);
  }

  /**
   * Calculate text change severity
   * @param {string} original - Original text
   * @param {string} slotted - Slotted text
   * @returns {string} Severity level
   */
  calculateTextChangeSeverity(original, slotted) {
    // If only whitespace differences, it's low severity
    if (original.replace(/\s/g, '') === slotted.replace(/\s/g, '')) {
      return 'low';
    }

    // If lengths are very different, it's high severity
    const lengthDiff = Math.abs(original.length - slotted.length);
    if (lengthDiff > Math.max(original.length, slotted.length) * 0.5) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Compare performance between components
   * @param {React.Component} OriginalComponent - Original component
   * @param {React.Component} SlottedComponent - Slotted component
   * @param {Object} props - Test props
   * @param {Object} userConfig - User configuration
   * @returns {Object} Performance comparison
   */
  async comparePerformance(OriginalComponent, SlottedComponent, props, userConfig) {
    const runs = 10; // Number of test runs
    const results = {
      original: { times: [], average: 0 },
      slotted: { times: [], average: 0 },
      ratio: 0,
      improvement: 0
    };

    try {
      // Benchmark original component
      for (let i = 0; i < runs; i++) {
        const startTime = performance.now();
        await this.renderComponent(OriginalComponent, props);
        const endTime = performance.now();
        results.original.times.push(endTime - startTime);
      }

      // Benchmark slotted component
      for (let i = 0; i < runs; i++) {
        const startTime = performance.now();
        await this.renderSlottedComponent(SlottedComponent, props, userConfig);
        const endTime = performance.now();
        results.slotted.times.push(endTime - startTime);
      }

      // Calculate averages
      results.original.average = results.original.times.reduce((a, b) => a + b) / runs;
      results.slotted.average = results.slotted.times.reduce((a, b) => a + b) / runs;

      // Calculate ratio and improvement
      results.ratio = results.slotted.average / results.original.average;
      results.improvement = ((results.original.average - results.slotted.average) / results.original.average) * 100;

    } catch (error) {
      console.error('Performance comparison error:', error);
      results.error = error.message;
    }

    return results;
  }

  /**
   * Compare accessibility between outputs
   * @param {string} originalHTML - Original HTML
   * @param {string} slottedHTML - Slotted HTML
   * @returns {Object} Accessibility comparison
   */
  async compareAccessibility(originalHTML, slottedHTML) {
    // Simplified accessibility check - in real implementation would use axe-core
    const comparison = {
      ariaLabels: { original: 0, slotted: 0, match: false },
      altTexts: { original: 0, slotted: 0, match: false },
      headings: { original: 0, slotted: 0, match: false },
      issues: []
    };

    try {
      const originalDOM = new JSDOM(originalHTML);
      const slottedDOM = new JSDOM(slottedHTML);

      // Count ARIA labels
      comparison.ariaLabels.original = originalDOM.window.document.querySelectorAll('[aria-label]').length;
      comparison.ariaLabels.slotted = slottedDOM.window.document.querySelectorAll('[aria-label]').length;
      comparison.ariaLabels.match = comparison.ariaLabels.original === comparison.ariaLabels.slotted;

      // Count alt texts
      comparison.altTexts.original = originalDOM.window.document.querySelectorAll('img[alt]').length;
      comparison.altTexts.slotted = slottedDOM.window.document.querySelectorAll('img[alt]').length;
      comparison.altTexts.match = comparison.altTexts.original === comparison.altTexts.slotted;

      // Count headings
      comparison.headings.original = originalDOM.window.document.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
      comparison.headings.slotted = slottedDOM.window.document.querySelectorAll('h1,h2,h3,h4,h5,h6').length;
      comparison.headings.match = comparison.headings.original === comparison.headings.slotted;

      // Identify issues
      if (!comparison.ariaLabels.match) {
        comparison.issues.push('ARIA label count mismatch');
      }
      if (!comparison.altTexts.match) {
        comparison.issues.push('Alt text count mismatch');
      }
      if (!comparison.headings.match) {
        comparison.issues.push('Heading structure changed');
      }

    } catch (error) {
      comparison.error = error.message;
    }

    return comparison;
  }

  /**
   * Calculate overall validation score
   * @param {Object} details - Validation details
   * @returns {number} Overall score (0-1)
   */
  calculateOverallScore(details) {
    const weights = {
      dom: 0.5,
      performance: 0.3,
      accessibility: 0.2
    };

    let score = 0;

    // DOM similarity score
    if (details.dom && !details.dom.error) {
      score += details.dom.similarity * weights.dom;
    }

    // Performance score (penalize if slower than threshold)
    if (details.performance && !details.performance.error) {
      const perfScore = Math.min(1, this.thresholds.performanceRatio / details.performance.ratio);
      score += perfScore * weights.performance;
    }

    // Accessibility score (simple: 1 if no issues, 0.5 if some issues)
    if (details.accessibility && !details.accessibility.error) {
      const accessScore = details.accessibility.issues.length === 0 ? 1 : 0.5;
      score += accessScore * weights.accessibility;
    }

    return score;
  }

  /**
   * Check if validation meets thresholds
   * @param {Object} result - Validation result
   * @returns {boolean} Whether thresholds are met
   */
  checkThresholds(result) {
    const { details, score } = result;

    // Check DOM similarity threshold
    if (details.dom && details.dom.similarity < this.thresholds.domSimilarity) {
      return false;
    }

    // Check performance threshold
    if (details.performance && details.performance.ratio > this.thresholds.performanceRatio) {
      return false;
    }

    // Check overall score
    if (score < 0.8) { // 80% minimum overall score
      return false;
    }

    return true;
  }

  /**
   * Identify issues from validation details
   * @param {Object} details - Validation details
   * @returns {Array} Array of issues
   */
  identifyIssues(details) {
    const issues = [];

    // DOM issues
    if (details.dom && details.dom.differences) {
      details.dom.differences
        .filter(diff => diff.severity === 'high')
        .forEach(diff => {
          issues.push({
            category: 'DOM',
            severity: diff.severity,
            message: `${diff.type}: ${diff.original} → ${diff.slotted}`
          });
        });
    }

    // Performance issues
    if (details.performance && details.performance.ratio > this.thresholds.performanceRatio) {
      issues.push({
        category: 'Performance',
        severity: 'medium',
        message: `Performance degraded by ${((details.performance.ratio - 1) * 100).toFixed(1)}%`
      });
    }

    // Accessibility issues
    if (details.accessibility && details.accessibility.issues.length > 0) {
      details.accessibility.issues.forEach(issue => {
        issues.push({
          category: 'Accessibility',
          severity: 'high',
          message: issue
        });
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on validation results
   * @param {Object} result - Validation result
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(result) {
    const recommendations = [];

    result.issues.forEach(issue => {
      switch (issue.category) {
        case 'DOM':
          if (issue.message.includes('tag_mismatch')) {
            recommendations.push('Review slot component to ensure correct HTML elements are used');
          }
          if (issue.message.includes('class_mismatch')) {
            recommendations.push('Verify CSS classes are correctly mapped in slot configuration');
          }
          break;

        case 'Performance':
          recommendations.push('Optimize slot rendering performance or review slot configuration complexity');
          break;

        case 'Accessibility':
          recommendations.push('Ensure all accessibility attributes are preserved in slot components');
          break;
      }
    });

    // Add general recommendations for low scores
    if (result.score < 0.9) {
      recommendations.push('Consider manual review of this migration before proceeding to production');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Generate validation report
   * @param {string} userId - User ID
   * @param {string} componentName - Component name
   * @returns {Object|null} Validation report
   */
  getValidationReport(userId, componentName) {
    const key = `${userId}-${componentName}`;
    return this.validationResults.get(key) || null;
  }

  /**
   * Get summary statistics
   * @returns {Object} Summary statistics
   */
  getSummaryStats() {
    const results = Array.from(this.validationResults.values());
    
    return {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length,
      commonIssues: this.getCommonIssues(results)
    };
  }

  /**
   * Identify common issues across validations
   * @param {Array} results - Validation results
   * @returns {Array} Common issues
   */
  getCommonIssues(results) {
    const issueCount = {};
    
    results.forEach(result => {
      if (result.issues) {
        result.issues.forEach(issue => {
          const key = `${issue.category}: ${issue.message}`;
          issueCount[key] = (issueCount[key] || 0) + 1;
        });
      }
    });

    return Object.entries(issueCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));
  }
}

export default MigrationValidator;