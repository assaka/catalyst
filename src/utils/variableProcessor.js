/**
 * Variable Processor - Handles template variable replacement for slot system
 *
 * Features:
 * - Simple variables: {{product.name}}
 * - Conditional variables: {{#if product.on_sale}}SALE{{/if}}
 * - Loop variables: {{#each product.images}}...{{/each}}
 * - Complex formatting: {{product.price_formatted}}
 * - Context-aware: editor (demo data) vs storefront (real data)
 */

/**
 * Process variables in content based on context
 */
export function processVariables(content, context, pageData = {}) {
  if (typeof content !== 'string') {
    return content;
  }

  let processedContent = content;

  // 1. Process conditional blocks first
  processedContent = processConditionals(processedContent, context, pageData);

  // 2. Process loops
  processedContent = processLoops(processedContent, context, pageData);

  // 3. Process simple variables
  processedContent = processSimpleVariables(processedContent, context, pageData);

  return processedContent;
}

/**
 * Process conditional blocks: {{#if condition}}content{{else}}alt{{/if}}
 */
function processConditionals(content, context, pageData) {
  const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

  let result = content;
  let hasMatches = true;

  // Process nested conditionals by running multiple passes
  while (hasMatches) {
    hasMatches = false;
    result = result.replace(conditionalRegex, (match, condition, trueContent, falseContent = '') => {
      hasMatches = true;
      const isTrue = evaluateCondition(condition, context, pageData);
      const selectedContent = isTrue ? trueContent : falseContent;

      // Recursively process any nested conditionals in the selected content
      return processConditionals(selectedContent, context, pageData);
    });
  }

  return result;
}

/**
 * Process loop blocks: {{#each array}}...{{/each}}
 */
function processLoops(content, context, pageData) {
  const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return content.replace(loopRegex, (match, arrayPath, template) => {
    const array = getNestedValue(arrayPath, context, pageData);

    if (!Array.isArray(array)) {
      return '';
    }

    return array.map((item, index) => {
      let itemContent = template;
      // Replace {{this}} with current item
      itemContent = itemContent.replace(/\{\{this\}\}/g, JSON.stringify(item));
      // Replace {{@index}} with current index
      itemContent = itemContent.replace(/\{\{@index\}\}/g, index);
      // Process nested variables within the item context
      return processSimpleVariables(itemContent, context, { ...pageData, this: item });
    }).join('');
  });
}

/**
 * Process simple variables: {{variable.path}}
 */
function processSimpleVariables(content, context, pageData) {
  const variableRegex = /\{\{([^#\/][^}]*)\}\}/g;

  return content.replace(variableRegex, (match, variablePath) => {
    const trimmedPath = variablePath.trim();
    const value = getNestedValue(trimmedPath, context, pageData);
    return formatValue(value, trimmedPath, context, pageData);
  });
}

/**
 * Evaluate conditional expressions
 */
function evaluateCondition(condition, context, pageData) {
  try {
    // Handle simple property checks
    if (condition.includes('>') || condition.includes('<') || condition.includes('==')) {
      // Parse comparison operators
      const operators = ['>=', '<=', '>', '<', '==', '!='];

      for (const op of operators) {
        if (condition.includes(op)) {
          const [left, right] = condition.split(op).map(s => s.trim());
          const leftValue = getNestedValue(left, context, pageData);
          const rightValue = isNaN(right) ? getNestedValue(right, context, pageData) : parseFloat(right);

          switch (op) {
            case '>': return leftValue > rightValue;
            case '<': return leftValue < rightValue;
            case '>=': return leftValue >= rightValue;
            case '<=': return leftValue <= rightValue;
            case '==': return leftValue == rightValue;
            case '!=': return leftValue != rightValue;
          }
        }
      }
    }

    // Simple property existence check
    const value = getNestedValue(condition, context, pageData);
    return !!value;
  } catch (error) {
    console.warn('Error evaluating condition:', condition, error);
    return false;
  }
}

/**
 * Get nested value from object path (e.g., 'product.name')
 */
function getNestedValue(path, context, pageData) {
  const fullData = { ...pageData, ...context };

  // Special handling for formatted price paths that don't exist in data
  if (path === 'product.compare_price_formatted' || path === 'product.price_formatted') {
    const result = path.split('.').reduce((obj, key) => {
      return obj && obj[key] !== undefined ? obj[key] : null;
    }, fullData);

    // If formatted price doesn't exist, return a marker so formatValue gets called
    if (result === null) {
      return '[FORMAT_NEEDED]';
    }
    return result;
  }

  return path.split('.').reduce((obj, key) => {
    return obj && obj[key] !== undefined ? obj[key] : null;
  }, fullData);
}

/**
 * Format values based on their type and path
 */
function formatValue(value, path, context, pageData) {
  // Debug: Log what's being processed
  if (path.includes('price')) {
    console.log('formatValue called with:', { path, value, hasProduct: !!(pageData.product || context.product) });
  }

  if (value === null || value === undefined) {
    return '';
  }

  // Handle special marker for formatted prices that need processing
  if (value === '[FORMAT_NEEDED]' && (path.includes('price_formatted') || path.includes('compare_price_formatted'))) {
    // Force processing through the price formatting logic below
    value = null;
  }

  // Special handling for compare_price_formatted
  if (path.trim() === 'product.compare_price_formatted') {
    const product = pageData.product || context.product;
    if (!product || !product.compare_price) {
      return ''; // Don't show compare price if it doesn't exist
    }

    // Check if we already have a formatted version
    if (product.compare_price_formatted && typeof product.compare_price_formatted === 'string' &&
        product.compare_price_formatted !== '[Text placeholder]' && product.compare_price_formatted !== '') {
      return product.compare_price_formatted;
    }

    // Otherwise format the raw compare_price with currency
    const currency = context.settings?.currency_symbol || '€';
    const price = typeof product.compare_price === 'number' ? product.compare_price : parseFloat(product.compare_price);
    if (!isNaN(price) && price > 0) {
      return `${currency}${price.toFixed(2)}`;
    }

    return '';
  }

  // Handle price_formatted (original price, shown with strikethrough when compare_price exists)
  if (path.trim() === 'product.price_formatted') {
    const product = pageData.product || context.product;
    if (!product || !product.price) {
      return '';
    }

    // Check if we already have a formatted version
    if (product.price_formatted && typeof product.price_formatted === 'string' &&
        product.price_formatted !== '[Text placeholder]' && product.price_formatted !== '') {
      return product.price_formatted;
    }

    // Otherwise format the raw price with currency
    const currency = context.settings?.currency_symbol || '€';
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
    if (!isNaN(price) && price > 0) {
      return `${currency}${price.toFixed(2)}`;
    }

    return '';
  }

  // Handle raw price numbers
  if (path.includes('price') && typeof value === 'number') {
    const currency = context.settings?.currency_symbol || '$';
    return `${currency}${value.toFixed(2)}`;
  }

  if (path.includes('stock_status')) {
    return formatStockStatus(pageData.product || context.product, context, pageData);
  }

  if (path.includes('labels') && Array.isArray(value)) {
    return value.join(', ');
  }

  if (path.includes('date')) {
    return new Date(value).toLocaleDateString();
  }

  return String(value);
}

/**
 * Format stock status with proper logic respecting admin settings
 */
function formatStockStatus(product, context, pageData) {
  if (!product) return '';

  const settings = context.settings || {};
  const stockSettings = settings.stock_settings || {};
  const stockQuantity = product.stock_quantity || 0;

  // Check if stock labels should be shown
  if (!stockSettings.show_stock_label) {
    return '';
  }

  // Handle infinite stock or unmanaged stock
  if (product.infinite_stock || (product.manage_stock === false)) {
    return stockSettings.in_stock_label?.replace(/\{.*?\}/g, '') || 'In Stock';
  }

  // Out of stock
  if (stockQuantity <= 0) {
    return stockSettings.out_of_stock_label || 'Out of Stock';
  }

  // Low stock threshold check
  const lowStockThreshold = product.low_stock_threshold || settings.display_low_stock_threshold || 5;
  if (stockQuantity <= lowStockThreshold && stockSettings.low_stock_label) {
    return stockSettings.low_stock_label.replace(/\{.*?quantity.*?\}/g, stockQuantity);
  }

  // In stock
  return stockSettings.in_stock_label?.replace(/\{.*?quantity.*?\}/g, stockQuantity) || 'In Stock';
}

/**
 * Generate demo data for editor context
 */
export const generateDemoData = (pageType) => {
  const demoData = {
    product: {
      name: 'Sample Product Name',
      price: 1349.00,  // Original price (shown with strikethrough)
      price_formatted: '$1349.00',
      compare_price: 1049.00,  // Special/sale price (shown as main price)
      compare_price_formatted: '$1049.00',
      on_sale: true,
      stock_quantity: 15,
      stock_status: 'In Stock',
      sku: 'PROD-123',
      short_description: 'This is a sample product description showing how the content will appear.',
      labels: ['Sale', 'New Arrival', 'Popular'],
      images: [
        'https://placehold.co/600x600?text=Main+Image',
        'https://placehold.co/150x150?text=Thumb+1',
        'https://placehold.co/150x150?text=Thumb+2',
        'https://placehold.co/150x150?text=Thumb+3'
      ],
      tabs: [
        { name: 'Description', tab_type: 'text', content: 'This is a detailed product description...' },
        { name: 'Specifications', tab_type: 'attributes', content: '' },
        { name: 'Reviews', tab_type: 'text', content: 'Customer reviews will appear here...' }
      ],
      related_products: [
        { name: 'Related Product 1', price: 79.99, image: 'https://placehold.co/300x300?text=Related+1' },
        { name: 'Related Product 2', price: 119.99, image: 'https://placehold.co/300x300?text=Related+2' },
        { name: 'Related Product 3', price: 89.99, image: 'https://placehold.co/300x300?text=Related+3' }
      ],
      attributes: {
        brand: 'Sample Brand',
        material: 'Premium Material',
        color: 'Blue',
        size: 'Medium'
      }
    },

    category: {
      name: 'Electronics',
      description: 'This is a sample category description.',
      product_count: 24,
      products: Array.from({ length: 8 }, (_, i) => ({
        name: `Product ${i + 1}`,
        price: 50 + (i * 10),
        image: `https://placehold.co/300x300?text=Product+${i + 1}`
      }))
    },

    cart: {
      item_count: 3,
      subtotal: 249.97,
      tax: 20.00,
      shipping: 9.99,
      total: 279.96,
      items: [
        { name: 'Cart Item 1', price: 99.99, quantity: 1 },
        { name: 'Cart Item 2', price: 149.98, quantity: 2 }
      ]
    },

    settings: {
      currency_symbol: '$',
      display_low_stock_threshold: 10,
      stock_settings: {
        show_stock_label: true,
        in_stock_label: 'In Stock',
        out_of_stock_label: 'Out of Stock',
        low_stock_label: 'Only {quantity} left!'
      }
    }
  };

  return demoData;
};

export default { processVariables, generateDemoData };