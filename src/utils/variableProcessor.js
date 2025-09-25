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

  return content.replace(conditionalRegex, (match, condition, trueContent, falseContent = '') => {
    const isTrue = evaluateCondition(condition, context, pageData);
    return isTrue ? trueContent : falseContent;
  });
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
    const value = getNestedValue(variablePath.trim(), context, pageData);
    return formatValue(value, variablePath, context, pageData);
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

  return path.split('.').reduce((obj, key) => {
    return obj && obj[key] !== undefined ? obj[key] : null;
  }, fullData);
}

/**
 * Format values based on their type and path
 */
function formatValue(value, path, context, pageData) {
  if (value === null || value === undefined) {
    return '';
  }

  // Special formatting based on variable path
  if (path.includes('price') && typeof value === 'number') {
    const currency = context.settings?.currency_symbol || '$';
    return `${currency}${value.toFixed(2)}`;
  }

  if (path.includes('stock_status')) {
    return formatStockStatus(value, context, pageData);
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
 * Format stock status with proper logic
 */
function formatStockStatus(stockQuantity, context, pageData) {
  const product = pageData.product || context.product;
  const settings = context.settings || {};

  if (!settings?.stock_settings?.show_stock_label) {
    return '';
  }

  if (product?.infinite_stock) {
    return settings.stock_settings.in_stock_label?.replace(/\{.*?\}/g, '') || 'In Stock';
  }

  if (stockQuantity <= 0) {
    return settings.stock_settings.out_of_stock_label || 'Out of Stock';
  }

  const lowStockThreshold = product?.low_stock_threshold || settings?.display_low_stock_threshold || 0;
  if (lowStockThreshold > 0 && stockQuantity <= lowStockThreshold) {
    return (settings.stock_settings.low_stock_label || 'Only {quantity} left!')
      .replace(/\{.*?quantity.*?\}/g, stockQuantity);
  }

  return (settings.stock_settings.in_stock_label || 'In Stock')
    .replace(/\{.*?quantity.*?\}/g, stockQuantity);
}

/**
 * Generate demo data for editor context
 */
export const generateDemoData = (pageType) => {
  const demoData = {
    product: {
      name: 'Sample Product Name',
      price: 99.99,
      price_formatted: '$99.99',
      compare_price: 129.99,
      compare_price_formatted: '$129.99',
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