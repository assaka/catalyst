/**
 * Customization Engine - Frontend
 * Handles preview and live application of customizations
 */

import apiClient from '@/api/client';
import hookSystem from './HookSystem';
import eventSystem from './EventSystem';

class CustomizationEngine {
  constructor() {
    this.isPreviewMode = false;
    this.previewCustomizations = new Map();
    this.appliedCustomizations = new Set();
    this.cssInjections = new Set();
    this.jsInjections = new Set();
    this.componentReplacements = new Map();
    this.eventHandlers = new Map();
    
    // Create preview toggle UI
    this.createPreviewToggle();
    
    // Listen for preview mode changes
    eventSystem.on('customization.previewToggle', this.handlePreviewToggle.bind(this));
  }

  /**
   * Initialize customization engine for a page/component
   */
  async initialize(storeId, options = {}) {
    try {
      const { page, component, selectors = [], context = {} } = options;
      
      console.log('🎨 Initializing customization engine for:', { page, component });

      // Get and apply live customizations (published)
      if (!this.isPreviewMode) {
        await this.applyLiveCustomizations(storeId, component || page, {
          selectors,
          context: { ...context, page, component }
        });
      }

      // If in preview mode, apply preview customizations
      if (this.isPreviewMode && this.previewCustomizations.size > 0) {
        await this.applyPreviewCustomizations(storeId, component || page, {
          selectors,
          context: { ...context, page, component }
        });
      }

      // Set up real-time preview updates
      this.setupPreviewUpdates(storeId);

      return {
        success: true,
        customizationsApplied: this.appliedCustomizations.size,
        previewMode: this.isPreviewMode
      };

    } catch (error) {
      console.error('❌ Error initializing customization engine:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply live (published) customizations
   */
  async applyLiveCustomizations(storeId, targetComponent, options) {
    try {
      const response = await apiClient.post('customizations/apply', {
        targetComponent,
        context: options.context
      }, {
        params: { store_id: storeId }
      });

      if (response.success && response.data.applied) {
        for (const customization of response.data.applied) {
          await this.applyCustomization(customization, false); // not preview
        }
      }

      return response;

    } catch (error) {
      console.error('❌ Error applying live customizations:', error);
      throw error;
    }
  }

  /**
   * Apply preview customizations
   */
  async applyPreviewCustomizations(storeId, targetComponent, options) {
    try {
      // Apply customizations from preview state
      for (const [id, customization] of this.previewCustomizations) {
        if (this.matchesTarget(customization, targetComponent, options)) {
          await this.applyCustomization(customization, true); // is preview
        }
      }

    } catch (error) {
      console.error('❌ Error applying preview customizations:', error);
      throw error;
    }
  }

  /**
   * Apply a single customization
   */
  async applyCustomization(customization, isPreview = false) {
    const { type, data, customizationId } = customization;
    const prefix = isPreview ? 'preview-' : '';

    try {
      switch (type) {
        case 'layout':
          await this.applyLayoutChanges(data, `${prefix}${customizationId}`, isPreview);
          break;
          
        case 'css':
          await this.applyCSSChanges(data, `${prefix}${customizationId}`, isPreview);
          break;
          
        case 'javascript':
          await this.applyJavaScriptChanges(data, `${prefix}${customizationId}`, isPreview);
          break;
          
        case 'component_replacement':
          await this.applyComponentReplacement(data, `${prefix}${customizationId}`, isPreview);
          break;
          
        case 'event':
          await this.applyEventHandler(data, `${prefix}${customizationId}`, isPreview);
          break;
          
        default:
          // Try extension handlers
          const result = hookSystem.apply(`customization.apply.${type}`, data, { 
            customizationId, 
            isPreview 
          });
          if (result === data) {
            console.warn(`⚠️ Unknown customization type: ${type}`);
          }
      }

      this.appliedCustomizations.add(`${prefix}${customizationId}`);
      
      // Emit event
      eventSystem.emit('customization.applied', {
        customizationId,
        type,
        isPreview
      });

    } catch (error) {
      console.error(`❌ Error applying ${type} customization:`, error);
      throw error;
    }
  }

  /**
   * Apply layout changes
   */
  async applyLayoutChanges(data, id, isPreview) {
    const { changes } = data;
    const styleId = `layout-${id}`;

    let css = `/* Layout Customization ${id} ${isPreview ? '(PREVIEW)' : ''} */\n`;

    for (const change of changes) {
      const { action, selector, properties } = change;

      switch (action) {
        case 'modify':
          css += `${selector} {\n`;
          Object.entries(properties).forEach(([prop, value]) => {
            css += `  ${prop}: ${value} !important;\n`;
          });
          css += `}\n\n`;
          break;

        case 'hide':
          css += `${selector} { display: none !important; }\n\n`;
          break;

        case 'move':
          css += `${selector} {\n`;
          css += `  position: ${properties.position || 'absolute'} !important;\n`;
          if (properties.top) css += `  top: ${properties.top} !important;\n`;
          if (properties.left) css += `  left: ${properties.left} !important;\n`;
          if (properties.right) css += `  right: ${properties.right} !important;\n`;
          if (properties.bottom) css += `  bottom: ${properties.bottom} !important;\n`;
          css += `}\n\n`;
          break;

        case 'resize':
          css += `${selector} {\n`;
          if (properties.width) css += `  width: ${properties.width} !important;\n`;
          if (properties.height) css += `  height: ${properties.height} !important;\n`;
          if (properties.maxWidth) css += `  max-width: ${properties.maxWidth} !important;\n`;
          if (properties.maxHeight) css += `  max-height: ${properties.maxHeight} !important;\n`;
          css += `}\n\n`;
          break;
      }
    }

    this.injectCSS(css, styleId, isPreview);
  }

  /**
   * Apply CSS changes
   */
  async applyCSSChanges(data, id, isPreview) {
    const { css, media, scope } = data;
    const styleId = `css-${id}`;

    let finalCSS = `/* CSS Customization ${id} ${isPreview ? '(PREVIEW)' : ''} */\n`;
    
    if (scope && scope !== 'global') {
      finalCSS += `${scope} {\n${css}\n}\n`;
    } else {
      finalCSS += css;
    }

    this.injectCSS(finalCSS, styleId, isPreview, media);
  }

  /**
   * Apply JavaScript changes
   */
  async applyJavaScriptChanges(data, id, isPreview) {
    const { code, timing, dependencies } = data;
    const scriptId = `js-${id}`;

    // Load dependencies first
    if (dependencies && dependencies.length > 0) {
      await this.loadDependencies(dependencies);
    }

    const executeScript = () => {
      try {
        // Wrap code in preview context if needed
        const wrappedCode = isPreview ? 
          `(function() { 
            const isPreview = true; 
            const customizationId = "${id}";
            ${code} 
          })();` : code;

        // Create script element
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'text/javascript';
        script.innerHTML = wrappedCode;
        
        if (isPreview) {
          script.setAttribute('data-preview', 'true');
        }

        document.head.appendChild(script);
        this.jsInjections.add(scriptId);

        console.log(`✅ Executed JavaScript customization: ${id}`);

      } catch (error) {
        console.error(`❌ Error executing JavaScript customization ${id}:`, error);
      }
    };

    // Execute based on timing
    switch (timing) {
      case 'immediate':
        executeScript();
        break;
        
      case 'dom_ready':
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', executeScript);
        } else {
          executeScript();
        }
        break;
        
      case 'window_load':
        if (document.readyState === 'complete') {
          executeScript();
        } else {
          window.addEventListener('load', executeScript);
        }
        break;
        
      default:
        executeScript();
    }
  }

  /**
   * Apply component replacement
   */
  async applyComponentReplacement(data, id, isPreview) {
    const { targetComponent, replacementComponent, props } = data;

    // Store replacement for React component system to pick up
    this.componentReplacements.set(targetComponent, {
      id,
      component: replacementComponent,
      props,
      isPreview
    });

    // Emit event for component system
    eventSystem.emit('component.replacement', {
      targetComponent,
      replacementComponent,
      props,
      isPreview,
      customizationId: id
    });

    console.log(`🔄 Component replacement registered: ${targetComponent} -> ${replacementComponent}`);
  }

  /**
   * Apply event handler
   */
  async applyEventHandler(data, id, isPreview) {
    const { eventName, selector, handler, priority } = data;

    const eventHandler = (event) => {
      try {
        // Create safe execution context
        const context = {
          event,
          target: event.target,
          currentTarget: event.currentTarget,
          isPreview,
          customizationId: id,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation()
        };

        // Execute handler with context
        const handlerFunction = eval(`(${handler})`);
        handlerFunction.call(context.target, context);

      } catch (error) {
        console.error(`❌ Error in event handler ${id}:`, error);
      }
    };

    // Add event listeners
    if (selector === 'document' || selector === '*') {
      document.addEventListener(eventName, eventHandler);
    } else {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.addEventListener(eventName, eventHandler);
      });
    }

    this.eventHandlers.set(id, { eventName, selector, handler: eventHandler });

    console.log(`📡 Event handler registered: ${eventName} on ${selector}`);
  }

  /**
   * Toggle preview mode
   */
  togglePreviewMode() {
    this.isPreviewMode = !this.isPreviewMode;
    
    if (this.isPreviewMode) {
      this.showPreviewIndicator();
    } else {
      this.hidePreviewIndicator();
      this.clearPreviewCustomizations();
    }

    eventSystem.emit('customization.previewToggle', { 
      isPreview: this.isPreviewMode 
    });

    console.log(`🔄 Preview mode ${this.isPreviewMode ? 'enabled' : 'disabled'}`);
    
    return this.isPreviewMode;
  }

  /**
   * Add customization to preview
   */
  addToPreview(customization) {
    this.previewCustomizations.set(customization.customizationId, customization);
    
    if (this.isPreviewMode) {
      // Apply immediately if in preview mode
      this.applyCustomization(customization, true);
    }
  }

  /**
   * Publish customizations (make them live)
   */
  async publishCustomizations(storeId, customizationIds) {
    try {
      // Move preview customizations to live
      for (const id of customizationIds) {
        if (this.previewCustomizations.has(id)) {
          const customization = this.previewCustomizations.get(id);
          
          // Apply as live customization
          await this.applyCustomization(customization, false);
          
          // Remove from preview
          this.previewCustomizations.delete(id);
        }
      }

      // Call backend to mark as published
      const response = await apiClient.post('customizations/publish', {
        customizationIds
      }, {
        params: { store_id: storeId }
      });

      eventSystem.emit('customizations.published', { 
        customizationIds,
        success: response.success 
      });

      return response;

    } catch (error) {
      console.error('❌ Error publishing customizations:', error);
      throw error;
    }
  }

  /**
   * Clear all preview customizations
   */
  clearPreviewCustomizations() {
    // Remove preview styles
    document.querySelectorAll('[id^="preview-"]').forEach(el => el.remove());
    
    // Remove preview scripts
    document.querySelectorAll('script[data-preview="true"]').forEach(el => el.remove());
    
    // Clear collections
    this.previewCustomizations.clear();
    
    // Remove preview-specific applied customizations
    for (const id of this.appliedCustomizations) {
      if (id.startsWith('preview-')) {
        this.appliedCustomizations.delete(id);
      }
    }
  }

  /**
   * Utility: Inject CSS
   */
  injectCSS(css, id, isPreview = false, media = 'all') {
    // Remove existing style if it exists
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = id;
    style.type = 'text/css';
    style.media = media;
    style.innerHTML = css;
    
    if (isPreview) {
      style.setAttribute('data-preview', 'true');
      style.innerHTML = `/* PREVIEW MODE */\n${css}`;
    }

    document.head.appendChild(style);
    this.cssInjections.add(id);
  }

  /**
   * Utility: Load JavaScript dependencies
   */
  async loadDependencies(dependencies) {
    const promises = dependencies.map(dep => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${dep}"]`)) {
          resolve(); // Already loaded
          return;
        }

        const script = document.createElement('script');
        script.src = dep;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    });

    await Promise.all(promises);
  }

  /**
   * Utility: Check if customization matches target
   */
  matchesTarget(customization, targetComponent, options) {
    const { targetComponent: custTarget, targetSelector } = customization;
    
    return custTarget === targetComponent || 
           custTarget === '*' ||
           (targetSelector && options.selectors?.includes(targetSelector));
  }

  /**
   * Create preview mode toggle UI
   */
  createPreviewToggle() {
    // Only create in development or for store owners
    if (process.env.NODE_ENV === 'development' || window.__CATALYST_PREVIEW_MODE) {
      const toggle = document.createElement('div');
      toggle.id = 'catalyst-preview-toggle';
      toggle.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-family: monospace;
        font-size: 12px;
        display: none;
      `;
      toggle.innerHTML = '👁️ Preview Mode: OFF';
      toggle.addEventListener('click', () => {
        this.togglePreviewMode();
        toggle.innerHTML = `👁️ Preview Mode: ${this.isPreviewMode ? 'ON' : 'OFF'}`;
        toggle.style.background = this.isPreviewMode ? '#007bff' : '#333';
      });

      document.body.appendChild(toggle);

      // Show toggle when customizations are being edited
      eventSystem.on('customization.editing', () => {
        toggle.style.display = 'block';
      });
    }
  }

  /**
   * Show preview indicator
   */
  showPreviewIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'catalyst-preview-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #007bff, #28a745, #007bff);
      background-size: 200% 100%;
      animation: previewPulse 2s linear infinite;
      z-index: 10001;
      pointer-events: none;
    `;
    
    // Add animation keyframes
    if (!document.getElementById('preview-animations')) {
      const style = document.createElement('style');
      style.id = 'preview-animations';
      style.innerHTML = `
        @keyframes previewPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(indicator);
  }

  /**
   * Hide preview indicator
   */
  hidePreviewIndicator() {
    const indicator = document.getElementById('catalyst-preview-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Setup real-time preview updates
   */
  setupPreviewUpdates(storeId) {
    // Listen for customization updates via hooks
    hookSystem.register('customization.update', (customization) => {
      if (this.isPreviewMode) {
        this.addToPreview(customization);
      }
    });
  }

  /**
   * Get component replacement for React integration
   */
  getComponentReplacement(componentName) {
    return this.componentReplacements.get(componentName) || null;
  }

  /**
   * Cleanup - remove all customizations
   */
  cleanup() {
    // Remove all injected styles
    this.cssInjections.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.remove();
    });

    // Remove all injected scripts
    this.jsInjections.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.remove();
    });

    // Remove event handlers
    this.eventHandlers.forEach((handler, id) => {
      // Note: This is a simplified cleanup. Real implementation would need
      // to track individual elements and remove specific event listeners
    });

    // Clear all collections
    this.cssInjections.clear();
    this.jsInjections.clear();
    this.eventHandlers.clear();
    this.componentReplacements.clear();
    this.appliedCustomizations.clear();
    this.previewCustomizations.clear();
  }
}

// Create global instance
const customizationEngine = new CustomizationEngine();

export default customizationEngine;