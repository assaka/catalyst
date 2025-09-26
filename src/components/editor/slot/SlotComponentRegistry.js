/**
 * Slot Component Registry
 * Central registry for unified slot components
 * This file must be imported before any component implementations to avoid circular dependencies
 */

/**
 * Component Registry Interface
 * All slot components must implement this interface
 */
export const createSlotComponent = (config) => ({
  name: config.name,
  renderEditor: config.renderEditor || config.render,
  renderStorefront: config.renderStorefront || config.render,
  metadata: config.metadata || {}
});

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