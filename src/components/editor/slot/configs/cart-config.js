import { ShoppingCart, Package } from 'lucide-react';

// Helper function to create slot with hierarchical properties
const createSlot = (id, type = 'text', config = {}) => {
  return {
    id,
    type,
    content: config.content || '',
    className: config.className || '',
    styles: config.styles || {},
    
    // Hierarchical properties
    parentId: config.parentId || null,
    children: config.children || [],
    
    // Layout properties for containers
    layout: config.layout || (type === 'grid' ? 'grid' : type === 'flex' ? 'flex' : 'block'),
    gridCols: config.gridCols || 12,
    gap: config.gap || 2,
    
    // Relative sizing
    colSpan: config.colSpan || 12,
    rowSpan: config.rowSpan || 1,
    
    // Constraints
    allowedChildren: config.allowedChildren || ['container', 'text', 'button', 'image', 'input', 'grid', 'flex'],
    maxDepth: config.maxDepth || 5,
    minChildren: config.minChildren || 0,
    maxChildren: config.maxChildren || null,
    
    // Metadata
    locked: config.locked || false,
    collapsed: config.collapsed || false,
    metadata: config.metadata || {}
  };
};

// Cart Page Configuration - Hierarchical structure
export const cartConfig = {
  page_name: 'Cart',
  slot_type: 'cart_layout',
  
  // Slot definitions for metadata and properties (replaces microSlotDefinitions)
  slotDefinitions: {
    flashMessage: {
      id: 'flashMessage',
      name: 'Flash Message',
      gridCols: 12,
      type: 'container'
    },
    header: {
      id: 'header',
      name: 'Page Header',
      gridCols: 12,
      type: 'container'
    },
    emptyCart: {
      id: 'emptyCart',
      name: 'Empty Cart',
      gridCols: 12,
      type: 'container'
    },
    cartItem: {
      id: 'cartItem',
      name: 'Cart Item',
      gridCols: 12,
      type: 'container'
    },
    coupon: {
      id: 'coupon',
      name: 'Coupon Section',
      gridCols: 12,
      type: 'container'
    },
    orderSummary: {
      id: 'orderSummary',
      name: 'Order Summary',
      gridCols: 12,
      type: 'container'
    },
    recommendations: {
      id: 'recommendations',
      name: 'Product Recommendations',
      gridCols: 12,
      type: 'container'
    },
    empty: {
      id: 'empty',
      name: 'Empty Slot',
      gridCols: 12,
      type: 'container'
    }
  },
  
  // Hierarchical slot configuration
  slots: {
    // Main layout container
    main_layout: createSlot('main_layout', 'grid', {
      className: 'main-layout',
      layout: 'grid',
      gridCols: 12,
      children: ['header_container', 'content_area', 'sidebar_area'],
      colSpan: 12
    }),
    
    // Header container
    header_container: createSlot('header_container', 'flex', {
      className: 'header-container',
      parentId: 'main_layout',
      layout: 'flex',
      children: ['header_title'],
      colSpan: 12
    }),
    
    header_title: createSlot('header_title', 'text', {
      content: 'My Cart',
      className: 'text-3xl font-bold text-gray-900 mb-4',
      parentId: 'header_container',
      colSpan: 12
    }),
    
    // Content area (8 columns)
    content_area: createSlot('content_area', 'container', {
      className: 'content-area',
      parentId: 'main_layout',
      layout: 'block',
      children: ['empty_cart_container'],
      colSpan: 8
    }),
    
    // Empty cart container
    empty_cart_container: createSlot('empty_cart_container', 'container', {
      className: 'empty-cart-container text-center',
      parentId: 'content_area',
      layout: 'block',
      children: ['empty_cart_icon', 'empty_cart_title', 'empty_cart_text', 'empty_cart_button'],
      colSpan: 12
    }),
    
    empty_cart_icon: createSlot('empty_cart_icon', 'image', {
      content: 'shopping-cart-icon',
      className: 'w-16 h-16 mx-auto text-gray-400 mb-4',
      parentId: 'empty_cart_container',
      colSpan: 12
    }),
    
    empty_cart_title: createSlot('empty_cart_title', 'text', {
      content: 'Your cart is empty',
      className: 'text-xl font-semibold text-gray-900 mb-2',
      parentId: 'empty_cart_container',
      colSpan: 12
    }),
    
    empty_cart_text: createSlot('empty_cart_text', 'text', {
      content: "Looks like you haven't added anything to your cart yet.",
      className: 'text-gray-600 mb-6',
      parentId: 'empty_cart_container',
      colSpan: 12
    }),
    
    empty_cart_button: createSlot('empty_cart_button', 'button', {
      content: 'Continue Shopping',
      className: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded',
      parentId: 'empty_cart_container',
      colSpan: 12
    }),
    
    // Sidebar area (4 columns)
    sidebar_area: createSlot('sidebar_area', 'flex', {
      className: 'sidebar-area',
      parentId: 'main_layout',
      layout: 'flex',
      styles: { flexDirection: 'column' },
      children: ['coupon_container', 'order_summary_container'],
      colSpan: 4
    }),
    
    // Coupon container
    coupon_container: createSlot('coupon_container', 'grid', {
      className: 'coupon-container bg-white p-4 rounded-lg shadow',
      parentId: 'sidebar_area',
      layout: 'grid',
      gridCols: 12,
      children: ['coupon_title', 'coupon_input', 'coupon_button'],
      colSpan: 12
    }),
    
    coupon_title: createSlot('coupon_title', 'text', {
      content: 'Apply Coupon',
      className: 'text-lg font-semibold mb-4',
      parentId: 'coupon_container',
      colSpan: 12
    }),
    
    coupon_input: createSlot('coupon_input', 'input', {
      content: 'Enter coupon code',
      className: 'border rounded px-3 py-2',
      parentId: 'coupon_container',
      colSpan: 8
    }),
    
    coupon_button: createSlot('coupon_button', 'button', {
      content: 'Apply',
      className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      parentId: 'coupon_container',
      colSpan: 4
    }),
    
    // Order summary container
    order_summary_container: createSlot('order_summary_container', 'container', {
      className: 'order-summary-container bg-white p-4 rounded-lg shadow mt-4',
      parentId: 'sidebar_area',
      layout: 'block',
      children: ['order_summary_title', 'order_summary_subtotal', 'order_summary_tax', 'order_summary_total', 'checkout_button'],
      colSpan: 12
    }),
    
    order_summary_title: createSlot('order_summary_title', 'text', {
      content: 'Order Summary',
      className: 'text-lg font-semibold mb-4',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    
    order_summary_subtotal: createSlot('order_summary_subtotal', 'text', {
      content: '<span>Subtotal</span><span>$79.97</span>',
      className: 'flex justify-between mb-2',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    
    order_summary_tax: createSlot('order_summary_tax', 'text', {
      content: '<span>Tax</span><span>$6.40</span>',
      className: 'flex justify-between mb-2',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    
    order_summary_total: createSlot('order_summary_total', 'text', {
      content: '<span>Total</span><span>$81.37</span>',
      className: 'flex justify-between text-lg font-semibold border-t pt-4 mb-4',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    
    checkout_button: createSlot('checkout_button', 'button', {
      content: 'Proceed to Checkout',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-lg',
      parentId: 'order_summary_container',
      colSpan: 12
    }),
    // Flash Message Slots
    'flashMessage.content': {
      content: `<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-yellow-800">Product Removed</h3>
      <p class="text-sm text-yellow-700">Nike Air Max 90 has been removed from your cart.</p>
    </div>
  </div>
</div>`,
      className: 'mb-4',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'flashMessage',
        description: 'Flash message content for notifications'
      }
    },
    'flashMessage.message': {
      content: 'Cart updated successfully!',
      className: 'text-sm text-blue-700',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'flashMessage',
        description: 'Flash message text content'
      }
    },
    
    // Header Slots
    'header.title': {
      content: 'My Cart',
      className: 'text-2xl font-bold text-gray-800',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'header',
        description: 'Main page title'
      }
    },
    
    // Empty Cart Slots
    'emptyCart.icon': {
      content: '🛒',
      className: 'text-6xl text-gray-400',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'emptyCart',
        description: 'Empty cart icon'
      }
    },
    'emptyCart.title': {
      content: 'Your cart is empty',
      className: 'text-xl font-bold text-gray-600',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'emptyCart',
        description: 'Empty cart title'
      }
    },
    'emptyCart.text': {
      content: "Looks like you haven't added anything to your cart yet.",
      className: 'text-gray-500 mb-4',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'emptyCart',
        description: 'Empty cart description text'
      }
    },
    'emptyCart.button': {
      content: 'Continue Shopping',
      className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'emptyCart',
        description: 'Continue shopping button'
      }
    },
    
    // Cart Item Slots (consistent naming with CartSlotsEditor)
    'cartItem.productImage': {
      content: 'Product Image',
      className: 'w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Product image placeholder'
      }
    },
    'cartItem.productTitle': {
      content: 'Product Name',
      className: 'font-semibold text-gray-900',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Product name/title'
      }
    },
    'cartItem.productPrice': {
      content: '$29.99',
      className: 'font-bold text-gray-900',
      parentClassName: 'text-right',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Product price'
      }
    },
    'cartItem.quantityControl': {
      content: '1',
      className: 'flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Quantity control buttons'
      }
    },
    'cartItem.removeButton': {
      content: 'Remove',
      className: 'text-red-500 hover:text-red-700 text-sm',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Remove item button'
      }
    },
    
    // Coupon Slots
    'coupon.title': {
      content: 'Apply Coupon',
      className: 'text-lg font-bold text-gray-800',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Coupon section title'
      }
    },
    // Nested coupon title children (example of deep nesting)
    'coupon.title.icon': {
      content: '🎫',
      className: 'text-lg',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Coupon title icon'
      }
    },
    'coupon.title.label': {
      content: 'Apply Coupon',
      className: 'font-bold text-gray-800',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Coupon title label'
      }
    },
    'coupon.input': {
      content: 'Enter coupon code',
      className: 'flex-1 px-3 py-2 border rounded bg-white text-gray-700',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Coupon input field'
      }
    },
    'coupon.button': {
      content: 'Apply',
      className: 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Apply coupon button'
      }
    },
    'coupon.message': {
      content: '',
      className: 'text-sm mt-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Coupon status/error message'
      }
    },
    'coupon.appliedCoupon': {
      content: '',
      className: 'bg-green-50 border border-green-200 rounded p-3',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Applied coupon display'
      }
    },
    
    // Order Summary Slots
    'orderSummary.title': {
      content: 'Order Summary',
      className: 'text-lg font-bold text-gray-800 mb-4',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Order summary title'
      }
    },
    'orderSummary.subtotal': {
      content: 'Subtotal: $59.98',
      className: 'flex justify-between text-gray-600 mb-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Order subtotal line'
      }
    },
    'orderSummary.discount': {
      content: 'Discount: -$5.00',
      className: 'flex justify-between text-green-600 mb-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Discount amount line'
      }
    },
    'orderSummary.shipping': {
      content: 'Shipping: $9.99',
      className: 'flex justify-between text-gray-600 mb-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Shipping cost line'
      }
    },
    'orderSummary.tax': {
      content: 'Tax: $4.80',
      className: 'flex justify-between text-gray-600 mb-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Tax amount line'
      }
    },
    'orderSummary.total': {
      content: 'Total: $59.98',
      className: 'flex justify-between font-bold text-lg text-gray-900 border-t pt-4',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Order total line'
      }
    },
    'orderSummary.checkoutButton': {
      content: 'Proceed to Checkout',
      className: 'w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Checkout button'
      }
    },
    
    // Recommendations Slots
    'recommendations.title': {
      content: 'You might also like',
      className: 'text-xl font-semibold mb-4',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'recommendations',
        description: 'Recommendations section title'
      }
    },
    'recommendations.products': {
      content: `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>`,
      className: '',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'recommendations',
        description: 'Product recommendations grid'
      }
    },
    
    // Empty Slots
    'empty.content': {
      content: '<div class="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 bg-gray-50"><p>This is an empty slot. Click to edit and add your custom content.</p></div>',
      className: 'empty-slot-content',
      parentClassName: 'empty-slot-wrapper',
      styles: {
        minHeight: '120px'
      },
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'empty',
        description: 'Customizable empty slot for any content'
      }
    }
  },
  
  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'cart'
  },
  
  // View configuration
  views: [
    { id: 'empty', label: 'Empty Cart', icon: ShoppingCart },
    { id: 'withProducts', label: 'With Products', icon: Package }
  ],
  
  // CMS blocks for additional content areas
  cmsBlocks: [
    'cart_header',
    'cart_above_items',
    'cart_below_items',
    'cart_sidebar',
    'cart_above_total',
    'cart_below_total',
    'cart_footer'
  ]
};

export default cartConfig;