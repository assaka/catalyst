/**
 * Shared utilities for slot editors across all page types
 * These functions can be used by Cart, Category, ProductDetail, and other page editors
 */

import React from 'react';

/**
 * Event Handling Utilities
 */

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// =============================================================================
// GENERIC EDITOR UTILITY FUNCTIONS FOR SLOT EDITORS
// =============================================================================
