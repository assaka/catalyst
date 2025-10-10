/**
 * Stock Label Utilities - Centralized stock label logic
 *
 * This utility provides a uniform function for calculating stock labels
 * across all components (category, product detail, editor, etc.)
 *
 * Features:
 * - Respects admin stock settings (label text, colors)
 * - Handles In Stock, Out of Stock, and Low Stock states
 * - Supports quantity placeholders with flexible formatting
 * - Returns both label text and color styling
 */

/**
 * Get stock label and color based on product and settings
 *
 * @param {Object} product - Product object with stock_quantity, infinite_stock, etc.
 * @param {Object} settings - Store settings object with stock_settings
 * @returns {Object} { text: string, color: string, bgColor: string } or null if label should not be shown
 */
export function getStockLabel(product, settings = {}) {
  // Check if stock labels should be shown at all
  const showStockLabel = settings?.stock_settings?.show_stock_label !== false;
  if (!showStockLabel) return null;

  if (!product) return null;

  // Stock settings are required - no fallbacks needed as StockSettings.jsx handles defaults
  const stockSettings = settings?.stock_settings || {};

  // Handle infinite stock
  if (product.infinite_stock) {
    const label = stockSettings.in_stock_label;
    const text = processLabel(label, null, settings); // Remove quantity blocks
    const textColor = stockSettings.in_stock_text_color;
    const bgColor = stockSettings.in_stock_bg_color;

    return { text, textColor, bgColor };
  }

  // Handle out of stock
  if (product.stock_quantity <= 0) {
    const text = stockSettings.out_of_stock_label;
    const textColor = stockSettings.out_of_stock_text_color;
    const bgColor = stockSettings.out_of_stock_bg_color;

    return { text, textColor, bgColor };
  }

  // Check if stock quantity should be hidden
  const hideStockQuantity = settings?.hide_stock_quantity === true;

  // Handle low stock
  const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
  if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
    const label = stockSettings.low_stock_label;
    const text = processLabel(label, hideStockQuantity ? null : product.stock_quantity, settings);
    const textColor = stockSettings.low_stock_text_color;
    const bgColor = stockSettings.low_stock_bg_color;

    return { text, textColor, bgColor };
  }

  // Handle regular in stock
  const label = stockSettings.in_stock_label;
  const text = processLabel(label, hideStockQuantity ? null : product.stock_quantity, settings);
  const textColor = stockSettings.in_stock_text_color;
  const bgColor = stockSettings.in_stock_bg_color;

  return { text, textColor, bgColor };
}

/**
 * Process label template with quantity placeholders
 * Handles flexible formatting blocks like {just {quantity} left}
 *
 * @param {string} label - Label template with placeholders
 * @param {number|null} quantity - Stock quantity (null to remove quantity blocks)
 * @param {Object} settings - Store settings
 * @returns {string} Processed label text
 */
function processLabel(label, quantity, settings) {
  if (!label) return '';

  let processedLabel = label;

  // If quantity is null (infinite stock or hidden), remove all blocks containing {quantity}
  if (quantity === null) {
    return processedLabel
      .replace(/\{[^}]*\{quantity\}[^}]*\}/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/,\s*$/, '')
      .trim();
  }

  // Process nested braces by finding outer {...} blocks first
  let depth = 0;
  let start = -1;

  for (let i = 0; i < processedLabel.length; i++) {
    if (processedLabel[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (processedLabel[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const content = processedLabel.substring(start + 1, i);
        const processed = content
          .replace(/\{quantity\}/gi, quantity)
          .replace(/\{item\}/gi, quantity === 1 ? 'item' : 'items')
          .replace(/\{unit\}/gi, quantity === 1 ? 'unit' : 'units')
          .replace(/\{piece\}/gi, quantity === 1 ? 'piece' : 'pieces');

        processedLabel = processedLabel.substring(0, start) + processed + processedLabel.substring(i + 1);
        i = start + processed.length - 1;
        start = -1;
      }
    }
  }

  return processedLabel;
}

/**
 * Get stock label class name for styling
 * Returns Tailwind CSS classes for color styling
 *
 * @param {Object} product - Product object
 * @param {Object} settings - Store settings
 * @returns {string} Tailwind CSS class string
 */
export function getStockLabelClass(product, settings = {}) {
  const stockLabel = getStockLabel(product, settings);
  if (!stockLabel) return '';

  // Return inline style object instead of classes for custom colors
  return `inline-flex items-center px-2 py-1 rounded-full text-xs`;
}

/**
 * Get inline styles for stock label (for custom colors from admin)
 *
 * @param {Object} product - Product object
 * @param {Object} settings - Store settings
 * @returns {Object} Style object with backgroundColor and color
 */
export function getStockLabelStyle(product, settings = {}) {
  const stockLabel = getStockLabel(product, settings);
  if (!stockLabel) return {};

  return {
    backgroundColor: stockLabel.bgColor,
    color: stockLabel.textColor
  };
}

export default {
  getStockLabel,
  getStockLabelClass,
  getStockLabelStyle
};
