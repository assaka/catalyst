/**
 * stockLabelUtils.js - Centralized Stock Label Logic
 *
 * =====================================================================
 * PURPOSE: Single source of truth for stock label text, colors, and
 * visibility across all product displays
 * =====================================================================
 *
 * ARCHITECTURE ROLE:
 *
 * Stock label utilities provide **unified stock status display** for:
 * 1. Category product grids
 * 2. Product detail pages
 * 3. Cart items
 * 4. Editor previews
 * 5. Template variable processing
 *
 * DATA FLOW:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Component (Category, Product, Cart, etc.)                   │
 * │ - Has product object with stock_quantity, infinite_stock    │
 * │ - Has settings object with stock_settings from admin        │
 * └────────────────────┬────────────────────────────────────────┘
 *                      │
 *                      ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │ stockLabelUtils (THIS FILE)                                 │
 * │ 1. Check if stock labels should be shown                    │
 * │ 2. Determine stock status:                                  │
 * │    - Infinite stock → In Stock (no quantity)               │
 * │    - stock_quantity <= 0 → Out of Stock                    │
 * │    - stock_quantity <= threshold → Low Stock + quantity    │
 * │    - Otherwise → In Stock + quantity (if not hidden)       │
 * │ 3. Return { text, textColor, bgColor }                     │
 * └─────────────────────┬────────────────────────────────────────┘
 *                      │
 *                      ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Component renders: <Badge style={{...}}>{{text}}</Badge>   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * STOCK STATES:
 *
 * **Infinite Stock**:
 * - product.infinite_stock === true
 * - Shows: settings.stock_settings.in_stock_label
 * - Colors: in_stock_text_color, in_stock_bg_color
 * - Quantity blocks removed: "{only {quantity} left}" → ""
 *
 * **Out of Stock**:
 * - product.stock_quantity <= 0
 * - Shows: settings.stock_settings.out_of_stock_label
 * - Colors: out_of_stock_text_color, out_of_stock_bg_color
 *
 * **Low Stock**:
 * - product.stock_quantity <= lowStockThreshold
 * - Shows: settings.stock_settings.low_stock_label
 * - Colors: low_stock_text_color, low_stock_bg_color
 * - Processes quantity: "{only {quantity} left}" → "only 3 left"
 *
 * **In Stock**:
 * - product.stock_quantity > lowStockThreshold
 * - Shows: settings.stock_settings.in_stock_label
 * - Colors: in_stock_text_color, in_stock_bg_color
 * - Processes quantity if not hidden
 *
 * QUANTITY PLACEHOLDERS:
 *
 * Labels support flexible quantity formatting:
 * - {quantity} → Replaced with actual quantity
 * - {item} → "item" (singular) or "items" (plural)
 * - {unit} → "unit" (singular) or "units" (plural)
 * - {piece} → "piece" (singular) or "pieces" (plural)
 *
 * Examples:
 * - "{only {quantity} {item} left}" + quantity=3 → "only 3 items left"
 * - "{only {quantity} {item} left}" + quantity=1 → "only 1 item left"
 * - "{In Stock, {quantity} available}" + quantity=50 → "In Stock, 50 available"
 *
 * QUANTITY HIDING:
 *
 * If settings.hide_stock_quantity === true OR quantity === null:
 * - All blocks containing {quantity} are removed
 * - "{In Stock, {only {quantity} left}}" → "In Stock"
 *
 * ADMIN SETTINGS:
 *
 * Configured in Admin → Catalog → Stock Settings:
 * - show_stock_label: Boolean - Show/hide all stock labels
 * - in_stock_label: String - Text for in stock (default: "In Stock")
 * - out_of_stock_label: String - Text for out of stock (default: "Out of Stock")
 * - low_stock_label: String - Text for low stock (default: "Only {quantity} left!")
 * - in_stock_text_color: Hex color
 * - in_stock_bg_color: Hex color
 * - out_of_stock_text_color: Hex color
 * - out_of_stock_bg_color: Hex color
 * - low_stock_text_color: Hex color
 * - low_stock_bg_color: Hex color
 *
 * USAGE EXAMPLES:
 *
 * ```javascript
 * // Get label with colors
 * const label = getStockLabel(product, settings);
 * if (label) {
 *   <Badge style={{ backgroundColor: label.bgColor, color: label.textColor }}>
 *     {label.text}
 *   </Badge>
 * }
 *
 * // Get just the inline styles
 * const styles = getStockLabelStyle(product, settings);
 * <span style={styles}>{getStockLabel(product, settings)?.text}</span>
 *
 * // Get Tailwind classes
 * const classes = getStockLabelClass(product, settings);
 * <span className={classes} style={getStockLabelStyle(product, settings)}>
 *   {getStockLabel(product, settings)?.text}
 * </span>
 * ```
 *
 * RELATED FILES:
 * - CategorySlotRenderer.jsx: Uses getStockLabel() to format products
 * - variableProcessor.js: Uses getStockLabel() for {{product.stock_status}}
 * - CustomOptions.jsx: Could use getStockLabel() for option products
 * - Admin/StockSettings.jsx: Configures stock label settings
 *
 * CRITICAL PATTERNS:
 *
 * 1. **Always check return value**: getStockLabel() returns null if labels disabled
 *
 * 2. **Use centralized utility everywhere**: Don't implement stock label logic elsewhere
 *
 * 3. **Respect admin settings**: All text and colors come from settings object
 *
 * 4. **Process quantity placeholders**: Use processLabel() for flexible formatting
 *
 * @module stockLabelUtils
 */

/**
 * getStockLabel - Get stock label text and colors
 *
 * Main function for determining stock status display. Checks stock quantity,
 * infinite_stock flag, and low stock threshold to determine appropriate label.
 * Processes quantity placeholders and respects admin settings.
 *
 * @param {Object} product - Product object
 * @param {boolean} product.infinite_stock - True if product has infinite stock
 * @param {number} product.stock_quantity - Current stock quantity
 * @param {number} [product.low_stock_threshold] - Custom low stock threshold for this product
 * @param {Object} settings - Store settings
 * @param {Object} settings.stock_settings - Stock label settings from admin
 * @param {boolean} settings.stock_settings.show_stock_label - Show/hide stock labels globally
 * @param {string} settings.stock_settings.in_stock_label - In stock label text
 * @param {string} settings.stock_settings.out_of_stock_label - Out of stock label text
 * @param {string} settings.stock_settings.low_stock_label - Low stock label text (with placeholders)
 * @param {string} settings.stock_settings.in_stock_text_color - In stock text color (hex)
 * @param {string} settings.stock_settings.in_stock_bg_color - In stock background color (hex)
 * @param {string} settings.stock_settings.out_of_stock_text_color - Out of stock text color
 * @param {string} settings.stock_settings.out_of_stock_bg_color - Out of stock background color
 * @param {string} settings.stock_settings.low_stock_text_color - Low stock text color
 * @param {string} settings.stock_settings.low_stock_bg_color - Low stock background color
 * @param {boolean} [settings.hide_stock_quantity] - Hide quantity numbers in labels
 * @param {number} [settings.display_low_stock_threshold] - Default low stock threshold
 * @param {string} [lang] - Language code (default: current browser language)
 * @returns {Object|null} { text: string, textColor: string, bgColor: string } or null if disabled
 *
 * @example
 * // Infinite stock
 * getStockLabel({ infinite_stock: true }, settings)
 * // { text: "In Stock", textColor: "#22c55e", bgColor: "#dcfce7" }
 *
 * @example
 * // Low stock with quantity
 * getStockLabel({ stock_quantity: 3, low_stock_threshold: 5 }, settings)
 * // { text: "Only 3 left!", textColor: "#f59e0b", bgColor: "#fef3c7" }
 *
 * @example
 * // Out of stock
 * getStockLabel({ stock_quantity: 0 }, settings)
 * // { text: "Out of Stock", textColor: "#ef4444", bgColor: "#fee2e2" }
 */
export function getStockLabel(product, settings = {}, lang = null) {
  // Check if stock labels should be shown at all
  const showStockLabel = settings?.stock_settings?.show_stock_label !== false;
  if (!showStockLabel) return null;

  if (!product) return null;

  // For configurable products, don't show stock label until a variant is selected
  // The parent configurable product typically has stock_quantity: 0 since it's not sold directly
  if (product.type === 'configurable') {
    return null;
  }

  // Get current language if not provided
  if (!lang) {
    lang = typeof localStorage !== 'undefined'
      ? localStorage.getItem('catalyst_language') || 'en'
      : 'en';
  }

  // Stock settings are required - no fallbacks needed as StockSettings.jsx handles defaults
  const stockSettings = settings?.stock_settings || {};

  // Helper function to get translated label from translations JSON
  const getTranslatedLabel = (labelField) => {
    const translations = stockSettings.translations;

    // Try current language translation
    if (translations && translations[lang] && translations[lang][labelField]) {
      return translations[lang][labelField];
    }

    // Fallback to English if current language not available
    if (translations && translations.en && translations.en[labelField]) {
      return translations.en[labelField];
    }

    // Final fallback: use the direct label field from stockSettings (non-translated)
    // This ensures labels still work even when translations haven't been set up
    return stockSettings[labelField] || '';
  };

  // Handle infinite stock
  if (product.infinite_stock) {
    const label = getTranslatedLabel('in_stock_label');
    const text = processLabel(label, null, settings); // Remove quantity blocks
    const textColor = stockSettings.in_stock_text_color;
    const bgColor = stockSettings.in_stock_bg_color;

    return { text, textColor, bgColor };
  }

  // Handle out of stock
  if (product.stock_quantity <= 0) {
    const text = getTranslatedLabel('out_of_stock_label');
    const textColor = stockSettings.out_of_stock_text_color;
    const bgColor = stockSettings.out_of_stock_bg_color;

    return { text, textColor, bgColor };
  }

  // Check if stock quantity should be hidden
  const hideStockQuantity = settings?.hide_stock_quantity === true;

  // Handle low stock
  const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
  if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
    const label = getTranslatedLabel('low_stock_label');
    const text = processLabel(label, hideStockQuantity ? null : product.stock_quantity, settings);
    const textColor = stockSettings.low_stock_text_color;
    const bgColor = stockSettings.low_stock_bg_color;

    return { text, textColor, bgColor };
  }

  // Handle regular in stock
  const label = getTranslatedLabel('in_stock_label');
  const text = processLabel(label, hideStockQuantity ? null : product.stock_quantity, settings);
  const textColor = stockSettings.in_stock_text_color;
  const bgColor = stockSettings.in_stock_bg_color;

  return { text, textColor, bgColor };
}

/**
 * processLabel - Process label template with quantity placeholders
 *
 * Handles nested braces and multiple placeholder types.
 * Removes blocks containing {quantity} when quantity is null or hidden.
 *
 * Supported placeholders:
 * - {quantity} → Actual quantity number
 * - {item} / {items} → Singular/plural
 * - {unit} / {units} → Singular/plural
 * - {piece} / {pieces} → Singular/plural
 *
 * @param {string} label - Label template with {placeholders}
 * @param {number|null} quantity - Stock quantity (null removes quantity blocks)
 * @param {Object} settings - Store settings (currently unused, reserved for future)
 * @returns {string} Processed label text
 *
 * @example
 * processLabel("In Stock, {only {quantity} {item} left}", 3, settings)
 * // "In Stock, only 3 items left"
 *
 * @example
 * processLabel("In Stock, {only {quantity} {item} left}", 1, settings)
 * // "In Stock, only 1 item left"
 *
 * @example
 * processLabel("In Stock, {only {quantity} {item} left}", null, settings)
 * // "In Stock"
 * @private
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
 * getStockLabelClass - Get Tailwind CSS classes for stock label
 *
 * Returns base Tailwind classes for stock label styling. Use with
 * getStockLabelStyle() for custom colors from admin settings.
 *
 * @param {Object} product - Product object
 * @param {Object} settings - Store settings
 * @returns {string} Tailwind CSS class string
 *
 * @example
 * const classes = getStockLabelClass(product, settings);
 * const styles = getStockLabelStyle(product, settings);
 * <span className={classes} style={styles}>
 *   {getStockLabel(product, settings)?.text}
 * </span>
 */
export function getStockLabelClass(product, settings = {}) {
  const stockLabel = getStockLabel(product, settings);
  if (!stockLabel) return '';

  // Return inline style object instead of classes for custom colors
  return `inline-flex items-center px-2 py-1 rounded-full text-xs`;
}

/**
 * getStockLabelStyle - Get inline styles for stock label
 *
 * Returns object with backgroundColor and color properties based on
 * stock status and admin-configured colors. Use with JSX style prop.
 *
 * @param {Object} product - Product object
 * @param {Object} settings - Store settings with stock_settings
 * @returns {Object} Style object { backgroundColor: string, color: string }
 *
 * @example
 * // In Stock
 * getStockLabelStyle({ stock_quantity: 50 }, settings)
 * // { backgroundColor: "#dcfce7", color: "#22c55e" }
 *
 * @example
 * // Low Stock
 * getStockLabelStyle({ stock_quantity: 3, low_stock_threshold: 5 }, settings)
 * // { backgroundColor: "#fef3c7", color: "#f59e0b" }
 *
 * @example
 * // Out of Stock
 * getStockLabelStyle({ stock_quantity: 0 }, settings)
 * // { backgroundColor: "#fee2e2", color: "#ef4444" }
 *
 * @example
 * // Usage in component
 * <Badge style={getStockLabelStyle(product, settings)}>
 *   {getStockLabel(product, settings)?.text}
 * </Badge>
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
