/**
 * Slot Component Registry
 * Central registry for unified slot components
 * This file must be imported before any component implementations to avoid circular dependencies
 */

/**
 * Component Registry Interface
 * All slot components must implement the unified render interface for WYSIWYG consistency
 */
export const createSlotComponent = (config) => {
  // Require unified render method - no backward compatibility
  if (!config.render) {
    throw new Error(`Component ${config.name} must implement a unified 'render' method for WYSIWYG consistency. Separate renderEditor/renderStorefront methods are no longer supported.`);
  }

  return {
    name: config.name,
    render: config.render,
    metadata: config.metadata || {}
  };
};

/**
 * Default Component Registry
 * Components register themselves here for use in both contexts
 */
export const ComponentRegistry = new Map();

/**
 * Register a unified slot component
 */
export const registerSlotComponent = (name, component) => {
  ComponentRegistry.set(name, component);
};