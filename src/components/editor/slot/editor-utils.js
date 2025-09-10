/**
 * Shared utilities for slot editors across all page types
 * These functions can be used by Cart, Category, ProductDetail, and other page editors
 */

import React from 'react';

/**
 * Toggle a Tailwind class on a className string
 * @param {string} currentClasses - Current className string
 * @param {string} classToToggle - Class to add/remove
 * @param {string} classCategory - Category to handle mutual exclusivity
 * @param {boolean} isWrapperSlot - Whether this is a wrapper element
 * @returns {string} Updated className string
 */
export function toggleClass(currentClasses, classToToggle, classCategory, isWrapperSlot = false) {
  let classes = currentClasses.split(' ').filter(c => c);
  
  switch(classCategory) {
    case 'font-weight':
      classes = classes.filter(c => !['font-normal', 'font-medium', 'font-semibold', 'font-bold'].includes(c));
      break;
      
    case 'font-style':
      classes = classes.filter(c => !['italic', 'not-italic'].includes(c));
      break;
      
    case 'text-align':
      if (isWrapperSlot) {
        // For wrapper slots, use flexbox justify classes
        classes = classes.filter(c => !['justify-start', 'justify-center', 'justify-end'].includes(c));
      } else {
        // For text elements, use text alignment classes
        classes = classes.filter(c => !['text-left', 'text-center', 'text-right'].includes(c));
      }
      break;
      
    case 'font-size':
      classes = classes.filter(c => !['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'].includes(c));
      break;
      
    case 'text-color':
      // Only remove text COLOR classes, keep text sizes and utilities
      classes = classes.filter(cls => {
        if (!cls.startsWith('text-')) return true;
        
        const parts = cls.split('-');
        // text-red-500 = ['text', 'red', '500'] - remove (color)
        // text-2xl = ['text', '2xl'] - keep (size)
        // text-center = ['text', 'center'] - keep (utility)
        
        if (parts.length === 3 && /^\d+$/.test(parts[2])) {
          return false; // Remove color classes
        }
        if (parts.length === 2 && ['black', 'white', 'transparent', 'current', 'inherit'].includes(parts[1])) {
          return false; // Remove special colors
        }
        return true; // Keep everything else
      });
      break;
      
    case 'bg-color':
      // Only remove background COLOR classes, keep bg utilities
      classes = classes.filter(cls => {
        if (!cls.startsWith('bg-')) return true;
        
        const parts = cls.split('-');
        if (parts.length === 3 && /^\d+$/.test(parts[2])) {
          return false; // Remove color classes
        }
        if (parts.length === 2 && ['black', 'white', 'transparent', 'current', 'inherit'].includes(parts[1])) {
          return false; // Remove special colors
        }
        return true; // Keep utilities like bg-cover, bg-gradient-to-r
      });
      break;
      
    case 'width':
      // Remove all width classes
      classes = classes.filter(c => !c.match(/^w-(\d+|px|0\.5|1\.5|2\.5|3\.5|auto|full|screen|min|max|fit)/));
      break;
      
    case 'height':
      // Remove all height classes
      classes = classes.filter(c => !c.match(/^h-(\d+|px|0\.5|1\.5|2\.5|3\.5|auto|full|screen|min|max|fit)/));
      break;
      
    case 'padding':
      // Remove all padding classes
      classes = classes.filter(c => !c.match(/^p[tblrxy]?-(\d+|px|0\.5|1\.5|2\.5|3\.5)/));
      break;
      
    case 'margin':
      // Remove all margin classes
      classes = classes.filter(c => !c.match(/^-?m[tblrxy]?-(\d+|px|0\.5|1\.5|2\.5|3\.5|auto)/));
      break;
  }
  
  // Add the new class if provided
  if (classToToggle) {
    classes.push(classToToggle);
  }
  
  return classes.join(' ');
}

/**
 * Check if a class string contains bold styling
 */
export function isBold(className) {
  return className.includes('font-bold') || className.includes('font-semibold');
}

/**
 * Check if a class string contains italic styling
 */
export function isItalic(className) {
  return className.includes('italic');
}

/**
 * Get current alignment from class string
 */
export function getCurrentAlign(className, isWrapperSlot = false) {
  if (isWrapperSlot) {
    if (className.includes('justify-center')) return 'center';
    if (className.includes('justify-end')) return 'right';
    return 'left';
  } else {
    if (className.includes('text-center')) return 'center';
    if (className.includes('text-right')) return 'right';
    return 'left';
  }
}

/**
 * Get current font size from class string
 */
export function getCurrentFontSize(className) {
  const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  return sizes.find(size => className.includes(size)) || 'text-base';
}

/**
 * Handle bold toggle
 */
export function handleBoldToggle(className) {
  const bold = isBold(className);
  return toggleClass(className, bold ? 'font-normal' : 'font-bold', 'font-weight');
}

/**
 * Handle italic toggle
 */
export function handleItalicToggle(className) {
  const italic = isItalic(className);
  return toggleClass(className, italic ? 'not-italic' : 'italic', 'font-style');
}

/**
 * Handle alignment change
 */
export function handleAlignmentChange(className, alignment, isWrapperSlot = false) {
  let alignClass;
  
  if (isWrapperSlot) {
    const alignMap = {
      'left': 'justify-start',
      'center': 'justify-center',
      'right': 'justify-end'
    };
    alignClass = alignMap[alignment];
  } else {
    const alignMap = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right'
    };
    alignClass = alignMap[alignment];
  }
  
  return toggleClass(className, alignClass, 'text-align', isWrapperSlot);
}

/**
 * Handle font size change
 */
export function handleFontSizeChange(className, size) {
  return toggleClass(className, size, 'font-size');
}

/**
 * Format price for display
 */
export function formatPrice(value) {
  return typeof value === "number" ? value : parseFloat(value) || 0;
}

/**
 * Color palette for Tailwind color picker
 */
export const COLOR_PALETTE = [
  // Grayscale
  { hex: '#000000', tailwind: 'black', label: 'Black' },
  { hex: '#374151', tailwind: 'gray-700', label: 'Dark Gray' },
  { hex: '#6B7280', tailwind: 'gray-500', label: 'Gray' },
  { hex: '#D1D5DB', tailwind: 'gray-300', label: 'Light Gray' },
  // Primary colors
  { hex: '#DC2626', tailwind: 'red-600', label: 'Red' },
  { hex: '#EA580C', tailwind: 'orange-600', label: 'Orange' },
  { hex: '#D97706', tailwind: 'amber-600', label: 'Amber' },
  { hex: '#CA8A04', tailwind: 'yellow-600', label: 'Yellow' },
  { hex: '#16A34A', tailwind: 'green-600', label: 'Green' },
  { hex: '#059669', tailwind: 'emerald-600', label: 'Emerald' },
  { hex: '#0891B2', tailwind: 'cyan-600', label: 'Cyan' },
  { hex: '#2563EB', tailwind: 'blue-600', label: 'Blue' },
  { hex: '#4F46E5', tailwind: 'indigo-600', label: 'Indigo' },
  { hex: '#7C3AED', tailwind: 'purple-600', label: 'Purple' },
  { hex: '#C026D3', tailwind: 'fuchsia-600', label: 'Fuchsia' },
  { hex: '#DB2777', tailwind: 'pink-600', label: 'Pink' },
  { hex: '#E11D48', tailwind: 'rose-600', label: 'Rose' },
];

/**
 * Font size options
 */
export const FONT_SIZES = [
  { label: 'XS', value: 'text-xs' },
  { label: 'SM', value: 'text-sm' },
  { label: 'Base', value: 'text-base' },
  { label: 'LG', value: 'text-lg' },
  { label: 'XL', value: 'text-xl' },
  { label: '2XL', value: 'text-2xl' },
  { label: '3XL', value: 'text-3xl' },
  { label: '4XL', value: 'text-4xl' },
];

/**
 * Font weight options
 */
export const FONT_WEIGHTS = [
  { label: 'Normal', value: 'font-normal' },
  { label: 'Medium', value: 'font-medium' },
  { label: 'Semibold', value: 'font-semibold' },
  { label: 'Bold', value: 'font-bold' },
];

/**
 * Size options for elements
 */
export const SIZE_OPTIONS = [
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '8', value: '8' },
  { label: '10', value: '10' },
  { label: '12', value: '12' },
  { label: '14', value: '14' },
  { label: '16', value: '16' },
  { label: '20', value: '20' },
  { label: '24', value: '24' },
  { label: '32', value: '32' },
  { label: '40', value: '40' },
  { label: '48', value: '48' },
  { label: '56', value: '56' },
  { label: '64', value: '64' }
];

/**
 * Padding options
 */
export const PADDING_OPTIONS = [
  { label: '0', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '6', value: '6' },
  { label: '8', value: '8' },
  { label: '12', value: '12' },
  { label: '16', value: '16' },
  { label: '20', value: '20' },
  { label: '24', value: '24' }
];

/**
 * Get current width from class string
 */
export function getCurrentWidth(className) {
  const widthMatch = className.match(/w-(\d+|px|0\.5|1\.5|2\.5|3\.5|auto|full|screen|min|max|fit)/);
  return widthMatch ? widthMatch[1] : '16';
}

/**
 * Get current height from class string
 */
export function getCurrentHeight(className) {
  const heightMatch = className.match(/h-(\d+|px|0\.5|1\.5|2\.5|3\.5|auto|full|screen|min|max|fit)/);
  return heightMatch ? heightMatch[1] : '16';
}

/**
 * Get current padding from class string
 */
export function getCurrentPadding(className) {
  const paddingMatch = className.match(/p-(\d+|px|0\.5|1\.5|2\.5|3\.5)/);
  return paddingMatch ? paddingMatch[1] : '4';
}

/**
 * Handle width change
 */
export function handleWidthChange(className, width) {
  return toggleClass(className, `w-${width}`, 'width');
}

/**
 * Handle height change
 */
export function handleHeightChange(className, height) {
  return toggleClass(className, `h-${height}`, 'height');
}

/**
 * Handle padding change
 */
export function handlePaddingChange(className, padding) {
  return toggleClass(className, `p-${padding}`, 'padding');
}

/**
 * Check if element is likely an icon, image, or button based on className or element type
 */
export function isResizableElement(className = '', elementType = 'div') {
  const isIcon = className.includes('lucide') || className.includes('icon') || className.includes('w-4') || className.includes('h-4');
  const isImage = elementType === 'img' || className.includes('image');
  const isButton = elementType === 'button' || className.includes('btn') || className.includes('Button');
  const hasSize = className.match(/[wh]-(\d+)/);
  
  return isIcon || isImage || isButton || hasSize;
}

/**
 * Trigger a custom save event for any page type
 */
export function triggerSave(pageType = 'cart') {
  window.dispatchEvent(new CustomEvent(`force-save-${pageType}-layout`));
}

// =============================================================================
// GENERIC JAVASCRIPT UTILITY FUNCTIONS
// =============================================================================

/**
 * DOM Manipulation Utilities
 */

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null if not found
 */
export function getElement(id) {
  try {
    return document.getElementById(id);
  } catch (error) {
    console.warn(`Element with ID "${id}" not found:`, error);
    return null;
  }
}

/**
 * Get elements by class name with error handling
 * @param {string} className - Class name
 * @param {HTMLElement} parent - Parent element (optional)
 * @returns {HTMLElement[]} Array of elements
 */
export function getElementsByClass(className, parent = document) {
  try {
    return Array.from(parent.getElementsByClassName(className));
  } catch (error) {
    console.warn(`Elements with class "${className}" not found:`, error);
    return [];
  }
}

/**
 * Create element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string|HTMLElement|HTMLElement[]} content - Element content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Set content
  if (typeof content === 'string') {
    element.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    element.appendChild(content);
  } else if (Array.isArray(content)) {
    content.forEach(child => {
      if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });
  }
  
  return element;
}

/**
 * Add class to element with existence check
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to add
 */
export function addClass(element, className) {
  if (element && element.classList && className) {
    element.classList.add(className);
  }
}

/**
 * Remove class from element with existence check
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to remove
 */
export function removeClass(element, className) {
  if (element && element.classList && className) {
    element.classList.remove(className);
  }
}

/**
 * Toggle class on element with existence check
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to toggle
 * @returns {boolean} True if class was added, false if removed
 */
export function toggleDomClass(element, className) {
  if (element && element.classList && className) {
    return element.classList.toggle(className);
  }
  return false;
}

/**
 * Check if element has class
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class to check
 * @returns {boolean} True if element has class
 */
export function hasClass(element, className) {
  return element && element.classList && element.classList.contains(className);
}

/**
 * Array and Object Utilities
 */

/**
 * Deep clone an object or array
 * @param {any} obj - Object to clone
 * @returns {any} Deep cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    Object.keys(obj).forEach(key => {
      clonedObj[key] = deepClone(obj[key]);
    });
    return clonedObj;
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Get nested object property safely
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot notation path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} Value at path or default value
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  if (!obj || !path) return defaultValue;
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
}

/**
 * Set nested object property safely
 * @param {Object} obj - Object to modify
 * @param {string} path - Dot notation path (e.g., 'user.profile.name')
 * @param {any} value - Value to set
 * @returns {Object} Modified object
 */
export function setNestedValue(obj, path, value) {
  if (!obj || !path) return obj;
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
  return obj;
}

/**
 * Remove duplicates from array
 * @param {Array} array - Array with potential duplicates
 * @param {string|Function} key - Key to use for comparison (optional)
 * @returns {Array} Array without duplicates
 */
export function removeDuplicates(array, key = null) {
  if (!Array.isArray(array)) return array;
  
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const keyValue = typeof key === 'function' ? key(item) : item[key];
      if (seen.has(keyValue)) return false;
      seen.add(keyValue);
      return true;
    });
  }
  
  return [...new Set(array)];
}

/**
 * Group array of objects by key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}

/**
 * Sort array of objects by multiple keys
 * @param {Array} array - Array to sort
 * @param {Array} keys - Array of {key, direction} objects
 * @returns {Array} Sorted array
 */
export function multiSort(array, keys) {
  if (!Array.isArray(array) || !Array.isArray(keys)) return array;
  
  return array.sort((a, b) => {
    for (const { key, direction = 'asc' } of keys) {
      const aVal = getNestedValue(a, key);
      const bVal = getNestedValue(b, key);
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Merge objects deeply
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects
 * @returns {Object} Merged object
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Check if value is an object (not array, null, or primitive)
 * @param {any} item - Value to check
 * @returns {boolean} True if object
 */
export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Validation and Formatting Utilities
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL format
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate hex color format
 * @param {string} color - Color to validate
 * @returns {boolean} True if valid hex color
 */
export function isValidHexColor(color) {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Format currency value
 * @param {number} value - Numeric value
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format date
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale (default: 'en-US')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'en-US', options = {}) {
  try {
    const dateObj = new Date(date);
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch {
    return String(date);
  }
}

/**
 * Format number with separators
 * @param {number} num - Number to format
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted number string
 */
export function formatNumber(num, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return String(num);
  }
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} CamelCase string
 */
export function toCamelCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Convert string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} Kebab-case string
 */
export function toKebabCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength, suffix = '...') {
  if (!str || typeof str !== 'string') return str;
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Generate random ID string
 * @param {number} length - Length of ID (default: 8)
 * @returns {string} Random ID string
 */
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate UUID v4
 * @returns {string} UUID string
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Sanitize HTML string
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  return tempDiv.innerHTML;
}

/**
 * Extract text from HTML string
 * @param {string} html - HTML string
 * @returns {string} Plain text content
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

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

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Add event listener with cleanup
 * @param {HTMLElement|Window|Document} element - Element to attach listener to
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object|boolean} options - Event listener options
 * @returns {Function} Cleanup function to remove listener
 */
export function addEventListener(element, event, handler, options = false) {
  if (!element || !element.addEventListener) return () => {};
  
  element.addEventListener(event, handler, options);
  
  return () => {
    element.removeEventListener(event, handler, options);
  };
}

/**
 * Add multiple event listeners at once
 * @param {HTMLElement|Window|Document} element - Element to attach listeners to
 * @param {Object} events - Object with event names as keys and handlers as values
 * @param {Object|boolean} options - Event listener options
 * @returns {Function} Cleanup function to remove all listeners
 */
export function addEventListeners(element, events, options = false) {
  if (!element || !events) return () => {};
  
  const cleanupFunctions = Object.entries(events).map(([event, handler]) => 
    addEventListener(element, event, handler, options)
  );
  
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

/**
 * Dispatch custom event
 * @param {HTMLElement|Window|Document} element - Element to dispatch event on
 * @param {string} eventName - Event name
 * @param {any} detail - Event detail data
 * @param {Object} options - Event options
 * @returns {boolean} True if event was dispatched successfully
 */
export function dispatchEvent(element, eventName, detail = null, options = {}) {
  if (!element || !element.dispatchEvent) return false;
  
  const event = new CustomEvent(eventName, {
    bubbles: true,
    cancelable: true,
    detail,
    ...options
  });
  
  return element.dispatchEvent(event);
}

/**
 * Wait for DOM element to exist
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @param {HTMLElement} parent - Parent element to search in (default: document)
 * @returns {Promise<HTMLElement>} Promise that resolves with the element
 */
export function waitForElement(selector, timeout = 5000, parent = document) {
  return new Promise((resolve, reject) => {
    const element = parent.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = parent.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(parent, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element '${selector}' not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Wait for DOM to be ready
 * @returns {Promise<void>} Promise that resolves when DOM is ready
 */
export function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

// =============================================================================
// GENERIC EDITOR UTILITY FUNCTIONS FOR SLOT EDITORS
// =============================================================================

/**
 * Generic drag and drop handlers for slot editors
 */

/**
 * Create drag start handler for slot editors
 * @param {Function} setActiveDragSlot - State setter for active drag slot
 * @returns {Function} Drag start handler
 */
export function createDragStartHandler(setActiveDragSlot) {
  return (event) => {
    setActiveDragSlot(event.active.id);
  };
}

/**
 * Create drag end handler for slot editors with major and micro slot support
 * @param {Object} config - Configuration object
 * @param {Function} config.setActiveDragSlot - State setter for active drag slot
 * @param {Function} config.setMajorSlots - State setter for major slots
 * @param {Function} config.setLayoutConfig - State setter for layout configuration
 * @param {Function} config.saveConfiguration - Function to save configuration
 * @param {Array} config.majorSlots - Current major slots array
 * @param {Object} config.layoutConfig - Current layout configuration
 * @param {Function} config.arrayMove - Array move utility function
 * @returns {Function} Drag end handler
 */
export function createDragEndHandler({
  setActiveDragSlot,
  setMajorSlots,
  setLayoutConfig,
  saveConfiguration,
  majorSlots,
  layoutConfig,
  arrayMove
}) {
  return (event) => {
    const { active, over } = event;
    setActiveDragSlot(null);

    if (!over || active.id === over.id) return;

    // Determine if this is a majorSlot or microSlot drag
    const activeId = active.id;
    const overId = over.id;

    // Check if dragging majorSlots
    if (majorSlots.includes(activeId) && majorSlots.includes(overId)) {
      setMajorSlots((slots) => {
        const oldIndex = slots.indexOf(activeId);
        const newIndex = slots.indexOf(overId);
        const newSlots = arrayMove(slots, oldIndex, newIndex);
        
        // Auto-save after reordering
        setTimeout(saveConfiguration, 100);
        
        return newSlots;
      });
      return;
    }

    // Check if dragging microSlots
    const activeSlotParts = activeId.split('.');
    const overSlotParts = overId.split('.');
    
    if (activeSlotParts.length >= 2 && overSlotParts.length >= 2) {
      const activeMajorSlot = activeSlotParts[0];
      const overMajorSlot = overSlotParts[0];
      
      // Only allow reordering within the same majorSlot
      if (activeMajorSlot === overMajorSlot && layoutConfig?.microSlotOrders?.[activeMajorSlot]) {
        setLayoutConfig(prevConfig => {
          const currentOrder = prevConfig.microSlotOrders[activeMajorSlot] || [];
          const oldIndex = currentOrder.indexOf(activeId);
          const newIndex = currentOrder.indexOf(overId);
          
          if (oldIndex === -1 || newIndex === -1) return prevConfig;
          
          const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
          
          const updatedConfig = {
            ...prevConfig,
            microSlotOrders: {
              ...prevConfig.microSlotOrders,
              [activeMajorSlot]: newOrder
            }
          };
          
          // Auto-save after reordering
          setTimeout(saveConfiguration, 100);
          
          return updatedConfig;
        });
      }
    }
  };
}

/**
 * Generic slot editing handlers
 */

/**
 * Create edit slot handler
 * @param {Function} setEditingComponent - State setter for editing component
 * @param {Function} setTempCode - State setter for temporary code
 * @returns {Function} Edit slot handler
 */
export function createEditSlotHandler(setEditingComponent, setTempCode) {
  return (slotId, content) => {
    setEditingComponent(slotId);
    setTempCode(content || '');
  };
}

/**
 * Create inline text change handler with auto-save
 * @param {Object} config - Configuration object
 * @param {Function} config.setLayoutConfig - State setter for layout configuration
 * @param {Function} config.saveConfiguration - Function to save configuration
 * @param {Object} config.layoutConfig - Current layout configuration
 * @param {string} config.slotContentKey - Key for slot content in config (e.g., 'slots')
 * @param {number} config.debounceMs - Debounce time in milliseconds (default: 500)
 * @returns {Function} Inline text change handler
 */
export function createInlineTextChangeHandler({
  setLayoutConfig,
  saveConfiguration,
  layoutConfig,
  slotContentKey = 'slots',
  debounceMs = 500
}) {
  return (slotId, newText) => {
    if (!layoutConfig) return;
    
    // Update the layout configuration with the new text content
    const updatedConfig = {
      ...layoutConfig,
      [slotContentKey]: {
        ...layoutConfig[slotContentKey],
        [slotId]: {
          ...layoutConfig[slotContentKey]?.[slotId],
          content: newText,
          metadata: {
            ...layoutConfig[slotContentKey]?.[slotId]?.metadata,
            lastModified: new Date().toISOString()
          }
        }
      }
    };
    
    // Update state immediately for responsive UI
    setLayoutConfig(updatedConfig);
    
    // Auto-save with debouncing (save after user stops typing)
    if (window.inlineEditTimeout) {
      clearTimeout(window.inlineEditTimeout);
    }
    window.inlineEditTimeout = setTimeout(() => {
      saveConfiguration();
      console.log('🔄 Auto-saved inline text change for:', slotId);
    }, debounceMs);
  };
}

/**
 * Create inline class change handler with auto-save (for toolbar actions)
 * @param {Object} config - Configuration object
 * @param {Function} config.setLayoutConfig - State setter for layout configuration
 * @param {Function} config.saveConfiguration - Function to save configuration
 * @param {Object} config.layoutConfig - Current layout configuration
 * @param {number} config.debounceMs - Debounce time in milliseconds (default: 300)
 * @returns {Function} Inline class change handler
 */
export function createInlineClassChangeHandler({
  setLayoutConfig,
  saveConfiguration,
  layoutConfig,
  debounceMs = 300
}) {
  return (slotId, newClassName, newStyles = {}) => {
    if (!layoutConfig) return;
    
    // Update the layout configuration with the new styling
    const updatedConfig = {
      ...layoutConfig,
      elementClasses: {
        ...layoutConfig.elementClasses,
        [slotId]: newClassName
      },
      elementStyles: {
        ...layoutConfig.elementStyles,
        [slotId]: {
          ...layoutConfig.elementStyles?.[slotId],
          ...newStyles
        }
      }
    };
    
    // Update state immediately for responsive UI
    setLayoutConfig(updatedConfig);
    
    // Auto-save with debouncing (save after user stops clicking toolbar)
    if (window.classChangeTimeout) {
      clearTimeout(window.classChangeTimeout);
    }
    window.classChangeTimeout = setTimeout(() => {
      saveConfiguration();
      console.log('🎨 Auto-saved style change for:', slotId, { className: newClassName, styles: newStyles });
    }, debounceMs);
  };
}

/**
 * Create save edit handler for Monaco editor
 * @param {Object} config - Configuration object
 * @param {Function} config.setLayoutConfig - State setter for layout configuration
 * @param {Function} config.setEditingComponent - State setter for editing component
 * @param {Function} config.setTempCode - State setter for temporary code
 * @param {Function} config.saveConfiguration - Function to save configuration
 * @param {string} config.slotContentKey - Key for slot content in config (e.g., 'slots')
 * @returns {Function} Save edit handler
 */
export function createSaveEditHandler({
  setLayoutConfig,
  setEditingComponent,
  setTempCode,
  saveConfiguration,
  slotContentKey = 'slots'
}) {
  return (editingComponent, tempCode, layoutConfig) => {
    if (editingComponent && layoutConfig) {
      // Update the layout configuration with the new content
      const updatedConfig = {
        ...layoutConfig,
        [slotContentKey]: {
          ...layoutConfig[slotContentKey],
          [editingComponent]: {
            ...layoutConfig[slotContentKey]?.[editingComponent],
            content: tempCode,
            metadata: {
              ...layoutConfig[slotContentKey]?.[editingComponent]?.metadata,
              lastModified: new Date().toISOString()
            }
          }
        }
      };
      
      setLayoutConfig(updatedConfig);
      setEditingComponent(null);
      setTempCode('');
      
      // Save the updated configuration
      setTimeout(() => saveConfiguration(), 100);
    }
  };
}

/**
 * Generic slot rendering helpers
 */

/**
 * Create micro slot styling helper
 * @param {Object} layoutConfig - Current layout configuration
 * @returns {Function} Micro slot styling getter
 */
export function createMicroSlotStyling(layoutConfig) {
  return (microSlotId) => {
    return {
      elementClasses: layoutConfig?.elementClasses?.[microSlotId] || '',
      elementStyles: layoutConfig?.elementStyles?.[microSlotId] || {}
    };
  };
}

/**
 * Create slot positioning helper with grid support
 * @param {Object} layoutConfig - Current layout configuration
 * @returns {Function} Slot positioning getter
 */
export function createSlotPositioning(layoutConfig) {
  return (slotId, parentSlot) => {
    const microSlotSpans = layoutConfig?.microSlotSpans?.[parentSlot]?.[slotId] || { col: 12, row: 1 };
    const elementClasses = layoutConfig?.elementClasses?.[slotId] || '';
    const elementStyles = layoutConfig?.elementStyles?.[slotId] || {};
    
    // Build grid positioning classes with alignment support
    let gridClasses = `col-span-${Math.min(12, Math.max(1, microSlotSpans.col || 12))} row-span-${Math.min(4, Math.max(1, microSlotSpans.row || 1))}`;
    
    // Add horizontal alignment classes to parent container
    if (microSlotSpans.align) {
      switch (microSlotSpans.align) {
        case 'left':
          gridClasses += ' justify-self-start';
          break;
        case 'center':  
          gridClasses += ' justify-self-center';
          break;
        case 'right':
          gridClasses += ' justify-self-end';
          break;
      }
    }
    
    // Add margin and padding support from configuration
    const spacingStyles = {
      ...(microSlotSpans.margin ? { margin: microSlotSpans.margin } : {}),
      ...(microSlotSpans.padding ? { padding: microSlotSpans.padding } : {}),
      ...(microSlotSpans.marginTop ? { marginTop: microSlotSpans.marginTop } : {}),
      ...(microSlotSpans.marginRight ? { marginRight: microSlotSpans.marginRight } : {}),
      ...(microSlotSpans.marginBottom ? { marginBottom: microSlotSpans.marginBottom } : {}),
      ...(microSlotSpans.marginLeft ? { marginLeft: microSlotSpans.marginLeft } : {}),
      ...(microSlotSpans.paddingTop ? { paddingTop: microSlotSpans.paddingTop } : {}),
      ...(microSlotSpans.paddingRight ? { paddingRight: microSlotSpans.paddingRight } : {}),
      ...(microSlotSpans.paddingBottom ? { paddingBottom: microSlotSpans.paddingBottom } : {}),
      ...(microSlotSpans.paddingLeft ? { paddingLeft: microSlotSpans.paddingLeft } : {}),
      ...elementStyles
    };
    
    return {
      gridClasses,
      elementClasses,
      elementStyles: spacingStyles,
      microSlotSpans
    };
  };
}

/**
 * Create custom slot renderer with ALL editor customizations
 * @param {Object} config - Configuration object
 * @param {Object} config.layoutConfig - Current layout configuration
 * @param {Function} config.getMicroSlotStyling - Function to get micro slot styling
 * @param {Function} config.getSlotPositioning - Function to get slot positioning
 * @param {Function} config.handleEditSlot - Function to handle slot editing
 * @param {string} config.mode - Editor mode ('edit' or 'preview')
 * @returns {Function} Custom slot renderer
 */
export function createCustomSlotRenderer({
  layoutConfig,
  getMicroSlotStyling,
  getSlotPositioning,
  handleEditSlot,
  mode
}) {
  return (slotId, parentSlot) => {
    if (!layoutConfig?.customSlots?.[slotId]) return null;
    
    const customSlot = layoutConfig.customSlots[slotId];
    const slotContent = layoutConfig.slotContent?.[slotId] || customSlot?.content || '';
    
    // Get all editor customizations
    const elementClasses = layoutConfig.elementClasses?.[slotId] || '';
    const elementStyles = layoutConfig.elementStyles?.[slotId] || {};
    const microSlotSpans = layoutConfig.microSlotSpans?.[parentSlot]?.[slotId] || { col: 12, row: 1 };
    
    // Debug: Log what customizations are being applied
    console.log(`🎨 Rendering custom slot ${slotId}:`);
    console.log('  - elementClasses:', elementClasses);
    console.log('  - elementStyles:', elementStyles);
    console.log('  - microSlotSpans:', microSlotSpans);
    console.log('  - slotContent:', slotContent);
    
    // Build container styles with positioning from slot configuration
    const containerStyle = {
      ...elementStyles,
      // Get positioning from slot configuration instead of fixed grid spans
      ...(microSlotSpans.position ? { position: microSlotSpans.position } : {}),
      ...(microSlotSpans.left ? { left: microSlotSpans.left } : {}),
      ...(microSlotSpans.top ? { top: microSlotSpans.top } : {}),
      ...(microSlotSpans.right ? { right: microSlotSpans.right } : {}),
      ...(microSlotSpans.bottom ? { bottom: microSlotSpans.bottom } : {}),
      ...(microSlotSpans.width ? { width: microSlotSpans.width } : {}),
      ...(microSlotSpans.height ? { height: microSlotSpans.height } : {}),
      // Only apply grid spans if they exist in configuration
      ...(microSlotSpans.col ? { gridColumn: `span ${Math.min(12, Math.max(1, microSlotSpans.col))}` } : {}),
      ...(microSlotSpans.row ? { gridRow: `span ${Math.min(4, Math.max(1, microSlotSpans.row))}` } : {})
    };
    
    const renderContent = () => {
      // Get wrapper styling
      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
      
      // Combine inline styles with container positioning
      const combinedStyles = {
        ...elementStyles,
        ...containerStyle
      };
      
      console.log(`🎨 Final styles for ${slotId}:`, combinedStyles);
      console.log(`🎨 Final classes for ${slotId}:`, elementClasses);
      console.log(`🎯 Wrapper styling for ${slotId}_wrapper:`, wrapperStyling);
      
      if (customSlot.type === 'text') {
        return React.createElement('div', null,
          React.createElement('div', { className: wrapperStyling.elementClasses, style: wrapperStyling.elementStyles },
            React.createElement('div', { 
              className: `custom-slot-content ${elementClasses || 'text-gray-600'}`,
              style: combinedStyles
            }, slotContent)
          )
        );
      } else if (customSlot.type === 'html' || customSlot.type === 'javascript') {
        return React.createElement('div', null,
          React.createElement('div', { className: wrapperStyling.elementClasses, style: wrapperStyling.elementStyles },
            React.createElement('div', { 
              className: `custom-slot-content ${elementClasses || ''}`,
              style: combinedStyles,
              dangerouslySetInnerHTML: { __html: slotContent }
            })
          )
        );
      }
      return null;
    };
    
    const positioning = getSlotPositioning(slotId, parentSlot);
    
    return React.createElement('div', {
      key: slotId,
      className: `custom-slot ${customSlot.type}-slot ${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`,
      'data-slot-id': slotId,
      'data-parent-slot': parentSlot,
      style: positioning.elementStyles
    },
      // Editor action bar - only show in edit mode
      mode === 'edit' && React.createElement('div', {
        className: 'absolute top-0 right-0 bg-blue-600 text-white px-2 py-1 text-xs rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-10'
      },
        React.createElement('button', {
          onClick: () => handleEditSlot(slotId, slotContent),
          className: 'mr-2 hover:underline'
        }, 'Edit')
      ),
      renderContent()
    );
  };
}

/**
 * Performance and Utility Functions
 */

/**
 * Measure function execution time
 * @param {Function} func - Function to measure
 * @param {...any} args - Function arguments
 * @returns {Object} Object with result and execution time
 */
export function measureTime(func, ...args) {
  const start = performance.now();
  const result = func(...args);
  const end = performance.now();
  
  return {
    result,
    time: end - start
  };
}

/**
 * Create a promise that resolves after specified delay
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>} Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} func - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<any>} Promise with function result
 */
export async function retry(func, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        await sleep(initialDelay * Math.pow(2, i));
      }
    }
  }
  
  throw lastError;
}

/**
 * Local Storage Utilities with error handling
 */

/**
 * Set item in localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON.stringify'd)
 * @returns {boolean} True if successful
 */
export function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Failed to set localStorage:', error);
    return false;
  }
}

/**
 * Get item from localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key not found
 * @returns {any} Parsed value or default value
 */
export function getLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to get localStorage:', error);
    return defaultValue;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} True if successful
 */
export function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('Failed to remove localStorage:', error);
    return false;
  }
}
