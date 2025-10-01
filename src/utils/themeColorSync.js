/**
 * Theme Color Synchronization Utility
 *
 * Syncs hardcoded button colors in templates with theme settings.
 * When AI changes button colors to hardcoded values, this utility:
 * 1. Extracts the new colors
 * 2. Updates theme settings in the database
 * 3. Replaces hardcoded colors with template variables
 */

/**
 * Button color mappings between template actions and theme settings
 */
const BUTTON_COLOR_MAPPINGS = {
  'add-to-cart': {
    settingPath: 'theme.add_to_cart_button_color',
    templateVar: '{{settings.theme.add_to_cart_button_color}}',
    defaultColor: '#28a745'
  },
  'view-cart': {
    settingPath: 'theme.view_cart_button_color',
    templateVar: '{{settings.theme.view_cart_button_color}}',
    defaultColor: '#17a2b8'
  },
  'checkout': {
    settingPath: 'theme.checkout_button_color',
    templateVar: '{{settings.theme.checkout_button_color}}',
    defaultColor: '#007bff'
  },
  'place-order': {
    settingPath: 'theme.place_order_button_color',
    templateVar: '{{settings.theme.place_order_button_color}}',
    defaultColor: '#28a745'
  }
};

/**
 * Extract hardcoded colors from button elements in HTML template
 * @param {string} htmlContent - The HTML template content
 * @returns {Object} - Map of button actions to extracted colors
 */
export function extractButtonColors(htmlContent) {
  const extractedColors = {};

  // Regex to find buttons with data-action and inline background-color styles
  const buttonRegex = /<button[^>]*data-action="([^"]+)"[^>]*style="([^"]*background-color:\s*([^;"]+)[^"]*)"[^>]*>/gi;

  let match;
  while ((match = buttonRegex.exec(htmlContent)) !== null) {
    const action = match[1];
    const color = match[3].trim();

    // Check if this is a known button action and color is hardcoded (not a template variable)
    if (BUTTON_COLOR_MAPPINGS[action] && !color.includes('{{')) {
      extractedColors[action] = color;
    }
  }

  return extractedColors;
}

/**
 * Replace hardcoded button colors with template variables
 * @param {string} htmlContent - The HTML template content
 * @returns {string} - Updated HTML with template variables
 */
export function replaceColorsWithTemplateVars(htmlContent) {
  let updatedContent = htmlContent;

  Object.entries(BUTTON_COLOR_MAPPINGS).forEach(([action, config]) => {
    // Regex to find buttons with this action and hardcoded background-color
    const buttonRegex = new RegExp(
      `(<button[^>]*data-action="${action}"[^>]*style="[^"]*background-color:\\s*)([^;"]+)([^"]*"[^>]*>)`,
      'gi'
    );

    // Replace hardcoded color with template variable
    updatedContent = updatedContent.replace(
      buttonRegex,
      `$1${config.templateVar}$3`
    );
  });

  return updatedContent;
}

/**
 * Sync button colors from template to theme settings
 * @param {string} htmlContent - The HTML template content
 * @param {Object} currentSettings - Current store settings object
 * @returns {Object} - { updatedSettings, updatedContent, changes }
 */
export function syncButtonColorsToTheme(htmlContent, currentSettings = {}) {
  // Extract any hardcoded colors from the template
  const extractedColors = extractButtonColors(htmlContent);

  // If no hardcoded colors found, return original content unchanged
  if (Object.keys(extractedColors).length === 0) {
    return {
      updatedSettings: currentSettings,
      updatedContent: htmlContent,
      changes: []
    };
  }

  // Update theme settings with extracted colors
  const updatedSettings = JSON.parse(JSON.stringify(currentSettings)); // Deep clone
  const changes = [];

  if (!updatedSettings.theme) {
    updatedSettings.theme = {};
  }

  Object.entries(extractedColors).forEach(([action, color]) => {
    const mapping = BUTTON_COLOR_MAPPINGS[action];
    const settingKey = mapping.settingPath.split('.')[1]; // e.g., 'add_to_cart_button_color'

    // Only update if the color is different
    if (updatedSettings.theme[settingKey] !== color) {
      updatedSettings.theme[settingKey] = color;
      changes.push({
        button: action,
        settingKey,
        oldColor: currentSettings.theme?.[settingKey],
        newColor: color
      });
    }
  });

  // Replace hardcoded colors with template variables
  const updatedContent = replaceColorsWithTemplateVars(htmlContent);

  return {
    updatedSettings,
    updatedContent,
    changes
  };
}

export default {
  extractButtonColors,
  replaceColorsWithTemplateVars,
  syncButtonColorsToTheme
};
