import DOMPurify from 'dompurify';

/**
 * Secure HTML Parser with XSS Prevention
 * 
 * This utility provides secure HTML parsing and sanitization to prevent XSS attacks
 * while allowing safe HTML content for the editor.
 */

// Configuration for different security levels
const SECURITY_CONFIGS = {
  // Strict: Only basic text formatting allowed
  strict: {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'span', 'p', 'br'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
    FORBID_CONTENTS: ['script', 'object', 'embed', 'base', 'link'],
    FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta', 'style'],
    KEEP_CONTENT: true,
  },
  
  // Editor: Allows common editing elements
  editor: {
    ALLOWED_TAGS: [
      // Text formatting
      'b', 'i', 'u', 'strong', 'em', 'span', 'p', 'br', 'div',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Links (href will be sanitized)
      'a',
      // Interactive elements (with restrictions)
      'button', 'input',
      // Containers
      'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
      // Media
      'img', 'picture', 'figure', 'figcaption',
      // Table elements
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      // Form elements
      'form', 'label', 'select', 'option', 'textarea', 'fieldset', 'legend',
      // Other common elements
      'blockquote', 'code', 'pre', 'small', 'sub', 'sup', 'mark', 'del', 'ins'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'href', 'target', 'rel', 'src', 'alt', 'title',
      'width', 'height', 'type', 'name', 'value', 'placeholder', 'disabled',
      'checked', 'selected', 'readonly', 'required', 'multiple', 'min', 'max',
      'step', 'pattern', 'maxlength', 'minlength', 'autocomplete', 'autofocus',
      'for', 'colspan', 'rowspan', 'scope', 'headers',
      'data-slot-id', 'data-editable', 'data-*', // Allow all data attributes
      'aria-*', 'role' // Allow accessibility attributes
    ],
    ALLOW_DATA_ATTR: true,
    FORBID_CONTENTS: ['script', 'object', 'embed', 'base', 'link'],
    FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta'],
    KEEP_CONTENT: true,
    // Additional security for URLs
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  },
  
  // Permissive: For advanced users (still prevents XSS)
  permissive: {
    FORBID_CONTENTS: ['script'],
    FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta'],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: true,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  }
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} html - The HTML content to sanitize
 * @param {string} level - Security level: 'strict', 'editor', or 'permissive'
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHtml(html, level = 'editor') {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const config = SECURITY_CONFIGS[level] || SECURITY_CONFIGS.editor;
  
  try {
    // Configure DOMPurify with our security settings
    const cleanHtml = DOMPurify.sanitize(html, {
      ...config,
      // Return a string, not DOM nodes
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      // Preserve whitespace for better formatting
      WHOLE_DOCUMENT: false,
      // Additional security measures
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      // Log sanitization events in development
      ...(process.env.NODE_ENV === 'development' && {
        SANITIZE_NAMED_PROPS_PREFIX: 'user-',
      })
    });

    return cleanHtml;
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    // Return empty string on sanitization failure for security
    return '';
  }
}

/**
 * Safely parses HTML content for editor display
 * Specifically designed for the CartSlotsEditor HTML content feature
 * @param {string} html - Raw HTML from user input
 * @returns {Object} - Parsed and sanitized HTML info
 */
export function parseEditorHtml(html) {
  if (!html || typeof html !== 'string') {
    return {
      isValid: false,
      sanitizedHtml: '',
      textContent: '',
      error: 'Invalid HTML input'
    };
  }

  try {
    // Sanitize with editor-level security
    const sanitizedHtml = sanitizeHtml(html, 'editor');
    
    // Extract text content safely
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHtml;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Validate that some content remains after sanitization
    const isValid = sanitizedHtml.trim().length > 0;
    
    return {
      isValid,
      sanitizedHtml,
      textContent: textContent.trim(),
      error: null,
      // Additional info for debugging
      originalLength: html.length,
      sanitizedLength: sanitizedHtml.length,
      wasModified: html !== sanitizedHtml
    };
  } catch (error) {
    return {
      isValid: false,
      sanitizedHtml: '',
      textContent: '',
      error: `HTML parsing failed: ${error.message}`
    };
  }
}

/**
 * Validates if HTML is safe for editor use
 * @param {string} html - HTML to validate
 * @returns {Object} - Validation result
 */
export function validateEditorHtml(html) {
  const result = parseEditorHtml(html);
  
  return {
    isValid: result.isValid,
    isSafe: result.error === null,
    hasContent: result.textContent.length > 0,
    wasModified: result.wasModified,
    error: result.error,
    warnings: []
  };
}

/**
 * Creates a safe HTML element from sanitized content
 * @param {string} html - HTML content to create element from
 * @param {string} fallbackTag - Fallback tag if parsing fails
 * @returns {HTMLElement|null} - Created element or null
 */
export function createSafeElement(html, fallbackTag = 'div') {
  const parsed = parseEditorHtml(html);
  
  if (!parsed.isValid || !parsed.sanitizedHtml) {
    return null;
  }
  
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = parsed.sanitizedHtml;
    const element = tempDiv.firstElementChild;
    
    if (element) {
      return element;
    }
    
    // If no element found, create fallback with text content
    const fallbackElement = document.createElement(fallbackTag);
    fallbackElement.textContent = parsed.textContent;
    return fallbackElement;
  } catch (error) {
    console.error('Failed to create safe element:', error);
    return null;
  }
}

/**
 * Security levels explanation for UI
 */
export const SECURITY_LEVELS = {
  strict: {
    name: 'Strict',
    description: 'Only basic text formatting allowed',
    recommended: 'For user-generated content'
  },
  editor: {
    name: 'Editor',
    description: 'Allows common editing elements and attributes',
    recommended: 'For content editors (default)'
  },
  permissive: {
    name: 'Permissive',
    description: 'Most HTML allowed, still prevents XSS',
    recommended: 'For advanced users only'
  }
};

export default {
  sanitizeHtml,
  parseEditorHtml,
  validateEditorHtml,
  createSafeElement,
  SECURITY_LEVELS
};