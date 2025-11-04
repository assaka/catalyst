/**
 * Script Handler for Dynamic JavaScript Execution
 * Manages the execution of JavaScript code attached to slots
 */

import { formatPrice, getPriceDisplay } from './priceUtils';
import cartService from '@/services/cartService';

/**
 * Store for registered script handlers
 */
const scriptHandlers = new Map();

/**
 * Execute a script in a safe context
 * @param {string} scriptCode - The JavaScript code to execute
 * @param {Object} context - The context object containing slot data and element reference
 * @returns {Function|null} - Returns cleanup function if provided by the script
 */
export function executeScript(scriptCode, context) {
  try {
    // Create a function from the script code with context parameters
    const scriptFunction = new Function(
      'element',
      'slotData',
      'productData',
      'productContext',
      'variableContext',
      'utils',
      'stateManager',
      scriptCode
    );

    // Utility functions available to scripts
    const utils = {
      // DOM utilities
      querySelector: (selector) => context.element?.querySelector(selector),
      querySelectorAll: (selector) => context.element?.querySelectorAll(selector),
      addClass: (className) => context.element?.classList.add(className),
      removeClass: (className) => context.element?.classList.remove(className),
      toggleClass: (className) => context.element?.classList.toggle(className),

      // Event utilities
      on: (event, handler) => {
        context.element?.addEventListener(event, handler);
        return () => context.element?.removeEventListener(event, handler);
      },

      // Data utilities
      formatPrice: (price, currency) => {
        return formatPrice(price);
      },
      getPriceDisplay: (product) => {
        return getPriceDisplay(product);
      },

      // Cart utilities
      cartService: cartService,

      // Animation utilities
      animate: (keyframes, options) => {
        return context.element?.animate(keyframes, options);
      },

      // Storage utilities
      getStorage: (key) => localStorage.getItem(key),
      setStorage: (key, value) => localStorage.setItem(key, value),

      // Fetch utility for AJAX
      fetch: (url, options) => fetch(url, options),

      // Delay utility
      delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
    };

    // Execute the script and return cleanup function if any
    return scriptFunction(
      context.element,
      context.slotData,
      context.productData,
      context.productContext || context.productData, // fallback for backward compatibility
      context.variableContext,
      utils,
      context.stateManager
    );
  } catch (error) {
    console.error('Error executing slot script:', error);
    return null;
  }
}

/**
 * Register a named script handler
 * @param {string} name - Handler name
 * @param {Function} handler - Handler function
 */
export function registerScriptHandler(name, handler) {
  scriptHandlers.set(name, handler);
}

/**
 * Get a registered script handler
 * @param {string} name - Handler name
 * @returns {Function|undefined}
 */
export function getScriptHandler(name) {
  return scriptHandlers.get(name);
}

/**
 * Execute a named script handler
 * @param {string} name - Handler name
 * @param {Object} context - Execution context
 * @returns {any} - Handler result
 */
export function executeHandler(name, context) {
  const handler = scriptHandlers.get(name);
  if (handler) {
    return handler(context);
  }
  console.warn(`Script handler "${name}" not found`);
  return null;
}

/**
 * Common script patterns as reusable handlers
 */

// Price formatter handler
registerScriptHandler('priceFormatter', (context) => {
  const { element, slotData, productContext } = context;

  if (!element) return;

  const priceElements = element.querySelectorAll('[data-price]');
  priceElements.forEach(el => {
    const priceType = el.dataset.price;
    const price = productContext?.product?.[priceType];

    if (price) {
      const formatted = formatPrice(price);
      el.textContent = formatted;
    }
  });
});

// Countdown timer handler
registerScriptHandler('countdown', (context) => {
  const { element, slotData } = context;

  if (!element) return;

  const endTime = slotData.endTime || Date.now() + 3600000; // Default 1 hour

  const updateCountdown = () => {
    const now = Date.now();
    const diff = endTime - now;

    if (diff <= 0) {
      element.textContent = 'Expired';
      clearInterval(interval);
      return;
    }

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    element.textContent = `${hours}h ${minutes}m ${seconds}s`;
  };

  const interval = setInterval(updateCountdown, 1000);
  updateCountdown();

  // Return cleanup function
  return () => clearInterval(interval);
});

// Click tracker handler
registerScriptHandler('clickTracker', (context) => {
  const { element, slotData } = context;

  if (!element) return;

  const trackClick = (e) => {
    // Send analytics event
    if (window.gtag) {
      window.gtag('event', 'slot_click', {
        slot_id: slotData.id,
        slot_type: slotData.type,
        page_type: slotData.pageType
      });
    }
  };

  element.addEventListener('click', trackClick);

  // Return cleanup function
  return () => element.removeEventListener('click', trackClick);
});

// Image lazy loader handler
registerScriptHandler('lazyLoad', (context) => {
  const { element } = context;

  if (!element) return;

  const images = element.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    // Return cleanup function
    return () => {
      images.forEach(img => imageObserver.unobserve(img));
    };
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
});

export default {
  executeScript,
  registerScriptHandler,
  getScriptHandler,
  executeHandler
};