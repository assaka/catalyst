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

  // Debug ALL order template processing
  if (content.includes('order-')) {
    console.log('🎨 ORDER TEMPLATE DEBUG:', {
      content: content,
      product_gallery_layout: context?.settings?.product_gallery_layout,
      vertical_gallery_position: context?.settings?.vertical_gallery_position,
      containsHorizontal: content.includes('horizontal'),
      containsVertical: content.includes('vertical')
    });
  }

  // Debug thumbnail gallery specifically - ENHANCED for admin sync debugging
  if (content.includes('thumbnail-gallery') || content.includes('product_gallery_layout')) {
    console.log('[THUMBNAIL-SYNC] 🖼️ VARIABLE PROCESSOR - GALLERY TEMPLATE DEBUG:', {
      originalContent: content.substring(0, 200) + '...',
      CONTEXT_SETTINGS: {
        product_gallery_layout: context?.settings?.product_gallery_layout,
        vertical_gallery_position: context?.settings?.vertical_gallery_position,
        settingsKeys: context?.settings ? Object.keys(context.settings) : 'No settings',
        hasSettings: !!context?.settings
      },
      TEMPLATE_CHECKS: {
        hasVerticalConditional: content.includes('(eq settings.product_gallery_layout "vertical")'),
        hasHorizontalConditional: content.includes('(eq settings.product_gallery_layout "horizontal")'),
        hasPositionConditional: content.includes('settings.vertical_gallery_position'),
        hasGalleryLayoutRef: content.includes('product_gallery_layout')
      },
      timestamp: new Date().toISOString()
    });
  }

  // Debug parent className processing for gallery ordering
  if (content.includes('order-') || (content.includes('vertical_gallery_position') && content.includes('order'))) {
    console.log('📐 PARENT CLASS PROCESSING:', {
      originalContent: content,
      product_gallery_layout: context?.settings?.product_gallery_layout,
      vertical_gallery_position: context?.settings?.vertical_gallery_position,
      isVertical: context?.settings?.product_gallery_layout === 'vertical',
      isLeft: context?.settings?.vertical_gallery_position === 'left',
      expectedOrder: context?.settings?.product_gallery_layout === 'vertical'
        ? (context?.settings?.vertical_gallery_position === 'left' ? 'order-first' : 'order-last')
        : 'order-2'
    });
  }

  let processedContent = content;

  // 1. Process conditional blocks first
  processedContent = processConditionals(processedContent, context, pageData);

  // 2. Process loops
  processedContent = processLoops(processedContent, context, pageData);

  // 3. Process simple variables
  processedContent = processSimpleVariables(processedContent, context, pageData);

  // Debug ALL order processing results with POSITION focus
  if (content.includes('order-')) {
    const isVerticalLayout = context?.settings?.product_gallery_layout === 'vertical';
    const position = context?.settings?.vertical_gallery_position;
    const isMainImage = content.includes('{{#if (eq settings.product_gallery_layout "vertical")}}');
    const isThumbnail = !isMainImage && content.includes('vertical_gallery_position');

    console.log('🎨 ORDER RESULT DEBUG:', {
      element: isMainImage ? 'MAIN_IMAGE' : isThumbnail ? 'THUMBNAILS' : 'UNKNOWN',
      original: content.substring(0, 100) + '...',
      processed: processedContent,
      isEmpty: !processedContent || processedContent.trim() === '',
      currentLayout: context?.settings?.product_gallery_layout,
      currentPosition: position,
      expectedForVerticalLeft: isVerticalLayout && position === 'left' ?
        (isMainImage ? 'Should be order-last' : isThumbnail ? 'Should be order-first' : 'N/A') : 'N/A',
      expectedForVerticalRight: isVerticalLayout && position === 'right' ?
        (isMainImage ? 'Should be order-first' : isThumbnail ? 'Should be order-last' : 'N/A') : 'N/A'
    });
  }

  // Debug thumbnail gallery result
  if (content.includes('thumbnail-gallery')) {
    console.log('🖼️ THUMBNAIL GALLERY RESULT:', {
      originalContent: content,
      processedContent: processedContent,
      changed: content !== processedContent,
      product_gallery_layout: context?.settings?.product_gallery_layout,
      isVerticalLayout: context?.settings?.product_gallery_layout === 'vertical',
      expectedClasses: context?.settings?.product_gallery_layout === 'vertical'
        ? 'flex flex-col space-y-2 w-24'
        : 'flex overflow-x-auto space-x-2 mt-4'
    });
  }

  return processedContent;
}

/**
 * Process conditional blocks: {{#if condition}}content{{else}}alt{{/if}}
 */
function processConditionals(content, context, pageData) {
  let result = content;
  let hasMatches = true;

  // Process nested conditionals by running multiple passes
  while (hasMatches) {
    hasMatches = false;

    // Find and process conditionals from inside out (deepest first)
    result = processConditionalsStep(result, context, pageData);

    // Continue until no more conditionals found
    hasMatches = result.includes('{{#if');
  }

  return result;
}

/**
 * Process one step of conditionals, handling proper bracket counting for nested structures
 */
function processConditionalsStep(content, context, pageData) {
  let result = content;
  let startIndex = 0;

  while (true) {
    // Find the next {{#if
    const ifIndex = result.indexOf('{{#if', startIndex);
    if (ifIndex === -1) break;

    // Extract condition
    const conditionStart = ifIndex + 5; // after {{#if
    const conditionEnd = result.indexOf('}}', conditionStart);
    if (conditionEnd === -1) break;

    const condition = result.substring(conditionStart, conditionEnd).trim();

    // Find matching {{/if}} by counting brackets
    let bracketCount = 1;
    let searchIndex = conditionEnd + 2; // after }}
    let elseIndex = -1;
    let endIndex = -1;

    while (bracketCount > 0 && searchIndex < result.length) {
      // Find all potential tags from current position
      const nextIf = result.indexOf('{{#if', searchIndex);
      const nextElse = result.indexOf('{{else}}', searchIndex);
      const nextEndif = result.indexOf('{{/if}}', searchIndex);

      // Build candidates list with proper filtering
      const candidates = [];
      if (nextIf !== -1) candidates.push({ pos: nextIf, type: 'if', len: 5 });
      if (nextElse !== -1) candidates.push({ pos: nextElse, type: 'else', len: 8 });
      if (nextEndif !== -1) candidates.push({ pos: nextEndif, type: 'endif', len: 7 });

      // Sort by position to process in order
      candidates.sort((a, b) => a.pos - b.pos);

      if (candidates.length === 0) {
        console.warn('No closing {{/if}} found for conditional starting at', ifIndex);
        break;
      }

      const nextTag = candidates[0];

      if (nextTag.type === 'if') {
        // Nested if - increase bracket count
        bracketCount++;
        searchIndex = nextTag.pos + nextTag.len;
      } else if (nextTag.type === 'else' && bracketCount === 1 && elseIndex === -1) {
        // This else belongs to our current if (not a nested one)
        elseIndex = nextTag.pos;
        searchIndex = nextTag.pos + nextTag.len;
      } else if (nextTag.type === 'endif') {
        // Closing if - decrease bracket count
        bracketCount--;
        if (bracketCount === 0) {
          // This is our matching closing tag
          endIndex = nextTag.pos;
          break;
        }
        searchIndex = nextTag.pos + nextTag.len;
      } else {
        // else for a nested if - skip it
        searchIndex = nextTag.pos + nextTag.len;
      }
    }

    if (endIndex === -1) {
      startIndex = ifIndex + 1;
      continue;
    }

    // Extract content parts
    let trueContent, falseContent = '';

    if (elseIndex !== -1) {
      trueContent = result.substring(conditionEnd + 2, elseIndex);
      falseContent = result.substring(elseIndex + 8, endIndex);
    } else {
      trueContent = result.substring(conditionEnd + 2, endIndex);
    }

    // Evaluate condition and select content
    const isTrue = evaluateCondition(condition, context, pageData);
    const selectedContent = isTrue ? trueContent : falseContent;

    // Log gallery-related conditionals
    if (condition.includes('product_gallery_layout') || condition.includes('vertical_gallery_position') || condition.includes('horizontal') || condition.includes('vertical')) {
      const isPositionCheck = condition.includes('vertical_gallery_position');
      console.log('[THUMBNAIL-SYNC] 🔄 CONDITIONAL DEBUG FIXED:', {
        condition,
        isTrue,
        ifIndex,
        elseIndex,
        endIndex,
        fullTemplate: result.substring(ifIndex, Math.min(ifIndex + 150, result.length)),
        trueContent: trueContent.length > 50 ? trueContent.substring(0, 50) + '...' : trueContent,
        falseContent: falseContent.length > 50 ? falseContent.substring(0, 50) + '...' : falseContent,
        selectedContent: selectedContent.length > 50 ? selectedContent.substring(0, 50) + '...' : selectedContent,
        currentLayout: context?.settings?.product_gallery_layout,
        currentPosition: context?.settings?.vertical_gallery_position
      });
    }

    // Replace the entire conditional block with the selected content
    const fullMatch = result.substring(ifIndex, endIndex + 7); // include {{/if}}
    result = result.substring(0, ifIndex) + selectedContent + result.substring(endIndex + 7);

    // Continue from the beginning to handle any newly exposed conditionals
    startIndex = 0;
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


    if (!Array.isArray(array) || array.length === 0) {
      // For product.labels specifically, since it's null/undefined, just return empty
      if (arrayPath === 'product.labels') {
        return ''; // Don't show anything if no labels
      }
      return '';
    }

    return array.map((item, index) => {
      let itemContent = template;
      // Replace {{this}} with current item (as string, not JSON)
      const itemValue = typeof item === 'string' ? item : String(item);
      itemContent = itemContent.replace(/\{\{this\}\}/g, itemValue);
      // Replace {{@index}} with current index
      itemContent = itemContent.replace(/\{\{@index\}\}/g, index);

      // Process nested variables within the item context
      // If item is an object, spread its properties to make them available at root level
      // This allows {{color}} instead of requiring {{this.color}}
      const itemContext = typeof item === 'object' && item !== null
        ? { ...pageData, this: item, ...item }
        : { ...pageData, this: item };

      return processSimpleVariables(itemContent, context, itemContext);
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

    // Debug color field specifically
    if (trimmedPath === 'color' || trimmedPath === 'background_color') {
      console.log('🎨 Processing color variable:', {
        variablePath: trimmedPath,
        pageData: pageData,
        pageDataKeys: pageData ? Object.keys(pageData) : 'No pageData',
        contextKeys: context ? Object.keys(context) : 'No context',
        directPageDataValue: pageData?.[trimmedPath],
        directContextValue: context?.[trimmedPath]
      });
    }


    // Handle formatted price paths directly when they don't exist in data
    if (trimmedPath === 'product.compare_price_formatted' || trimmedPath === 'product.price_formatted') {
      const value = getNestedValue(trimmedPath, context, pageData);

      // Always call formatValue for formatted prices, even if null
      return formatValue(value, trimmedPath, context, pageData);
    }

    // Handle short_description fallback to description
    if (trimmedPath === 'product.short_description') {
      const product = context.product || pageData.product;
      if (product) {
        const shortDesc = product.short_description;
        if (shortDesc && shortDesc.trim()) {
          return formatValue(shortDesc, trimmedPath, context, pageData);
        } else {
          // Fallback to full description if short_description is null/empty
          const fullDesc = product.description;
          if (fullDesc && fullDesc.trim()) {
            return formatValue(fullDesc, trimmedPath, context, pageData);
          }
        }
      }
      return '';
    }

    // Handle stock_status to return proper HTML with JavaScript binding
    if (trimmedPath === 'product.stock_status') {
      // Return HTML template with data-bind for JavaScript controller to update
      return '<span class="stock-badge w-fit inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600" data-bind="stock-status">Loading...</span>';
    }

    const value = getNestedValue(trimmedPath, context, pageData);
    const result = formatValue(value, trimmedPath, context, pageData);

    return result;
  });
}

/**
 * Evaluate conditional expressions
 */
function evaluateCondition(condition, context, pageData) {
  try {
    // 🔧 ENHANCED DEBUG: Always log vertical_gallery_position evaluations
    if (condition.includes('vertical_gallery_position')) {
      console.log('[THUMBNAIL-SYNC] 🚨 POSITION CONDITION FOUND:', {
        condition,
        context: context ? Object.keys(context) : 'No context',
        contextSettings: context?.settings,
        pageData: pageData ? Object.keys(pageData) : 'No pageData'
      });
    }

    // Handle eq helper function: (eq variable "value") - FIXED to handle both single and double quotes
    const eqMatch = condition.match(/\(eq\s+([^"'\s]+)\s+['"]([^'"]+)['"]\)/);

    // 🔧 DEBUG: Log regex match results for vertical_gallery_position
    if (condition.includes('vertical_gallery_position')) {
      console.log('[THUMBNAIL-SYNC] 🔍 REGEX MATCH DEBUG:', {
        condition,
        eqMatch,
        regexMatched: !!eqMatch,
        variablePath: eqMatch ? eqMatch[1] : 'No match',
        expectedValue: eqMatch ? eqMatch[2] : 'No match'
      });
    }

    if (eqMatch) {
      const [, variablePath, expectedValue] = eqMatch;
      const actualValue = getNestedValue(variablePath, context, pageData);
      // Only log gallery-related evaluations - ENHANCED debugging for position issue
      if (variablePath.includes('gallery') || variablePath.includes('position')) {
        console.log('[THUMBNAIL-SYNC] 🔍 GALLERY EVAL:', {
          condition,
          variablePath,
          actualValue,
          actualValueType: typeof actualValue,
          expectedValue,
          expectedValueType: typeof expectedValue,
          result: actualValue === expectedValue,
          strictResult: actualValue === expectedValue,
          looseResult: actualValue == expectedValue,
          actualRaw: JSON.stringify(actualValue),
          expectedRaw: JSON.stringify(expectedValue)
        });
      }
      return actualValue === expectedValue;
    }

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

  // 🔧 ENHANCED DEBUG: Always log vertical_gallery_position lookups
  if (path.includes('vertical_gallery_position')) {
    console.log('[THUMBNAIL-SYNC] 🔍 GET NESTED VALUE DEBUG:', {
      path,
      fullDataKeys: Object.keys(fullData),
      hasSettings: 'settings' in fullData,
      settingsKeys: fullData.settings ? Object.keys(fullData.settings) : 'No settings',
      directSettingsAccess: fullData.settings?.vertical_gallery_position,
      contextKeys: context ? Object.keys(context) : 'No context',
      contextSettings: context?.settings?.vertical_gallery_position,
      pageDataKeys: pageData ? Object.keys(pageData) : 'No pageData'
    });
  }

  const result = path.split('.').reduce((obj, key) => {
    const value = obj && obj[key] !== undefined ? obj[key] : null;

    // 🔧 DEBUG: Log each step of the path traversal for vertical_gallery_position
    if (path.includes('vertical_gallery_position')) {
      console.log(`[THUMBNAIL-SYNC] 🔍 PATH STEP: ${key} = ${JSON.stringify(value)} (type: ${typeof value})`);
    }

    return value;
  }, fullData);

  // 🔧 DEBUG: Log final result for vertical_gallery_position
  if (path.includes('vertical_gallery_position')) {
    console.log(`[THUMBNAIL-SYNC] 🔍 FINAL RESULT: ${path} = ${JSON.stringify(result)} (type: ${typeof result})`);
  }

  return result;
}

/**
 * Format values based on their type and path
 */
function formatValue(value, path, context, pageData) {
  if (value === null || value === undefined) {
    // Don't return empty for formatted prices - process them
    if (!path.includes('price_formatted')) {
      return '';
    }
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
export const generateDemoData = (pageType, settings = {}) => {
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

    // Product Labels with admin-configurable positioning
    productLabels: [
      {
        id: 1,
        text: 'SALE',
        position: 'top-right',
        background_color: '#ef4444',
        text_color: '#ffffff',
        is_active: true,
        priority: 1
      },
      {
        id: 2,
        text: 'NEW',
        position: 'top-left',
        background_color: '#22c55e',
        text_color: '#ffffff',
        is_active: true,
        priority: 2
      },
      {
        id: 3,
        text: 'POPULAR',
        position: 'bottom-right',
        background_color: '#3b82f6',
        text_color: '#ffffff',
        is_active: true,
        priority: 3
      }
    ],

    settings: {
      currency_symbol: '$',
      display_low_stock_threshold: 10,
      product_gallery_layout: 'horizontal',
      vertical_gallery_position: 'left',
      mobile_gallery_layout: 'below',
      stock_settings: {
        show_stock_label: true,
        in_stock_label: 'In Stock',
        out_of_stock_label: 'Out of Stock',
        low_stock_label: 'Only {quantity} left!'
      },
      ...settings // Merge any passed-in settings to override defaults
    }
  };

  return demoData;
};

export default { processVariables, generateDemoData };