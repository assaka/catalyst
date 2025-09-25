/**
 * Secure Content Sanitizer
 * Prevents XSS attacks while allowing safe HTML and binding points
 */

import DOMPurify from 'dompurify';

/**
 * Allowed HTML tags for slot content
 */
const ALLOWED_TAGS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'button', 'input', 'label', 'select', 'option', 'textarea',
  'img', 'a', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
  'form', 'strong', 'em', 'br', 'hr', 'small', 'code', 'pre'
];

/**
 * Allowed attributes (including data attributes for binding)
 */
const ALLOWED_ATTRIBUTES = [
  'class', 'id', 'src', 'alt', 'href', 'title', 'type', 'value',
  'placeholder', 'name', 'min', 'max', 'step', 'disabled', 'readonly',
  'data-bind', 'data-action', 'data-target', 'data-value', 'data-option',
  'data-quantity', 'data-price', 'data-tab', 'data-toggle', 'data-validate'
];

/**
 * Safe CSS properties that can be used in style attributes
 */
const ALLOWED_CSS_PROPERTIES = [
  'color', 'background-color', 'font-size', 'font-weight', 'text-align',
  'margin', 'padding', 'border', 'border-radius', 'width', 'height',
  'display', 'flex', 'grid', 'position', 'top', 'left', 'right', 'bottom',
  'opacity', 'transform', 'transition', 'cursor'
];

/**
 * Configure DOMPurify with safe settings
 */
const sanitizerConfig = {
  ALLOWED_TAGS,
  ALLOWED_ATTR: ALLOWED_ATTRIBUTES,
  ALLOW_DATA_ATTR: true,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_TAGS: [],
  ADD_ATTR: [],
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'frame', 'frameset'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  FORCE_BODY: false
};

/**
 * Sanitize HTML content for slots
 */
export function sanitizeSlotContent(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  // First pass: basic sanitization
  let sanitized = DOMPurify.sanitize(htmlContent, sanitizerConfig);

  // Second pass: validate data attributes for binding
  sanitized = validateBindingAttributes(sanitized);

  return sanitized;
}

/**
 * Validate and whitelist data attributes used for JavaScript binding
 */
function validateBindingAttributes(htmlContent) {
  // Parse HTML to validate data attributes
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const elements = doc.querySelectorAll('[data-bind], [data-action], [data-target]');

  elements.forEach(element => {
    // Validate data-bind values (only allow alphanumeric and underscores)
    const bindValue = element.getAttribute('data-bind');
    if (bindValue && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(bindValue)) {
      element.removeAttribute('data-bind');
    }

    // Validate data-action values (only allow predefined actions)
    const actionValue = element.getAttribute('data-action');
    if (actionValue && !isAllowedAction(actionValue)) {
      element.removeAttribute('data-action');
    }

    // Validate data-target values (only allow safe selectors)
    const targetValue = element.getAttribute('data-target');
    if (targetValue && !isAllowedSelector(targetValue)) {
      element.removeAttribute('data-target');
    }
  });

  return doc.body.innerHTML;
}

/**
 * Check if action is in whitelist of allowed actions
 */
function isAllowedAction(action) {
  const allowedActions = [
    'increment', 'decrement', 'toggle', 'select', 'submit',
    'add-to-cart', 'add-to-wishlist', 'change-quantity', 'select-option',
    'switch-tab', 'toggle-modal', 'update-price', 'validate-form'
  ];

  return allowedActions.includes(action);
}

/**
 * Check if CSS selector is safe to use
 */
function isAllowedSelector(selector) {
  // Only allow simple selectors with data attributes, IDs, and classes
  const safePattern = /^[a-zA-Z0-9\[\]="'\-_\s.#:]+$/;

  // Block potentially dangerous selectors
  const dangerousPatterns = [
    /javascript:/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /onload/i,
    /onerror/i
  ];

  if (!safePattern.test(selector)) {
    return false;
  }

  return !dangerousPatterns.some(pattern => pattern.test(selector));
}

/**
 * Sanitize CSS properties for inline styles
 */
export function sanitizeStyleAttribute(styleValue) {
  if (!styleValue || typeof styleValue !== 'string') {
    return '';
  }

  const styles = styleValue.split(';').map(style => style.trim()).filter(Boolean);
  const safeStyles = [];

  styles.forEach(style => {
    const [property, value] = style.split(':').map(s => s.trim());

    if (property && value && isAllowedCSSProperty(property) && isAllowedCSSValue(value)) {
      safeStyles.push(`${property}: ${value}`);
    }
  });

  return safeStyles.join('; ');
}

/**
 * Check if CSS property is allowed
 */
function isAllowedCSSProperty(property) {
  return ALLOWED_CSS_PROPERTIES.includes(property.toLowerCase());
}

/**
 * Check if CSS value is safe
 */
function isAllowedCSSValue(value) {
  // Block dangerous CSS values
  const dangerousPatterns = [
    /javascript:/i,
    /expression\s*\(/i,
    /url\s*\(\s*["']?javascript:/i,
    /url\s*\(\s*["']?data:/i,
    /import/i,
    /@/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(value));
}

/**
 * Generate Content Security Policy for slot content
 */
export function generateSlotCSP() {
  return {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline'", // Only for slot binding, not arbitrary scripts
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'font-src': "'self' https:",
    'connect-src': "'self'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'frame-ancestors': "'none'"
  };
}

/**
 * Validate slot configuration for security
 */
export function validateSlotConfig(slotConfig) {
  const errors = [];

  if (slotConfig.content) {
    // Validate HTML content
    const sanitizedContent = sanitizeSlotContent(slotConfig.content);
    if (sanitizedContent !== slotConfig.content) {
      errors.push(`Slot ${slotConfig.id}: Content was sanitized for security`);
    }
  }

  if (slotConfig.script) {
    errors.push(`Slot ${slotConfig.id}: Script field not allowed for security. Use data-action attributes instead.`);
  }

  if (slotConfig.styles && typeof slotConfig.styles === 'object') {
    Object.entries(slotConfig.styles).forEach(([property, value]) => {
      if (!isAllowedCSSProperty(property) || !isAllowedCSSValue(String(value))) {
        errors.push(`Slot ${slotConfig.id}: Unsafe CSS property/value: ${property}: ${value}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedConfig: {
      ...slotConfig,
      content: slotConfig.content ? sanitizeSlotContent(slotConfig.content) : slotConfig.content
    }
  };
}

export default {
  sanitizeSlotContent,
  sanitizeStyleAttribute,
  validateSlotConfig,
  generateSlotCSP
};