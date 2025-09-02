/**
 * CartPageSlots.jsx - STORE OWNER EDITABLE FILE
 * 
 * This is the ONLY file you need to edit to customize your cart page layout.
 * You can rearrange slots, change layouts, and customize positioning here.
 * 
 * 🎯 DRAG & DROP: Change the order in the "order" arrays
 * 🎨 LAYOUTS: Choose 'flex', 'grid', or 'stack' for each section  
 * 📱 RESPONSIVE: Different layouts for mobile/desktop
 * ✨ MICRO-SLOTS: Rearrange elements within cart items
 */

export const CART_SLOT_DEFINITIONS = {
  // Root page layout
  'page-root': {
    id: 'page-root',
    type: 'layout', 
    defaultLayout: 'stack',
    slots: ['page-container', 'page-content']
  },

  // Page container (wrapper)
  'page-container': {
    id: 'page-container',
    type: 'component',
    component: 'CartPageContainer',
    className: 'bg-gray-50 cart-page',
    children: ['page-content']
  },

  // Page content area
  'page-content': {
    id: 'page-content', 
    type: 'container',
    component: 'div',
    className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12',
    children: ['page-header', 'main-content']
  },

  // Page header
  'page-header': {
    id: 'page-header',
    type: 'component',
    component: 'CartPageHeader',
    defaultProps: {
      title: 'My Cart',
      className: 'text-3xl font-bold text-gray-900 mb-8'
    }
  },

  // Main content grid
  'main-content': {
    id: 'main-content',
    type: 'layout',
    defaultLayout: 'grid', 
    slots: ['cart-items-section', 'cart-sidebar-section']
  },

  // Cart items section
  'cart-items-section': {
    id: 'cart-items-section',
    type: 'container',
    component: 'CartItemsContainer',
    className: 'lg:col-span-2',
    children: ['cart-items-list']
  },

  // Individual cart items (with micro-slots!)
  'cart-items-list': {
    id: 'cart-items-list', 
    type: 'micro-slot',
    container: 'div',
    className: 'divide-y divide-gray-200',
    
    // 🎯 MICRO-SLOTS: Rearrange these to change cart item layout!
    defaultOrder: [
      'item-image',
      'item-details', 
      'item-controls',
      'item-total'
    ],
    
    microSlots: {
      'item-image': {
        id: 'item-image',
        type: 'component', 
        component: 'ItemImage',
        className: 'w-20 h-20 object-cover rounded-lg'
      },
      
      'item-details': {
        id: 'item-details',
        type: 'layout',
        defaultLayout: 'stack',
        className: 'flex-1',
        slots: ['item-title', 'item-price', 'item-options']
      },
      
      'item-title': {
        id: 'item-title',
        type: 'component',
        component: 'ItemTitle', 
        className: 'text-lg font-semibold'
      },
      
      'item-price': {
        id: 'item-price',
        type: 'component',
        component: 'ItemPrice',
        className: 'text-gray-600'
      },
      
      'item-options': {
        id: 'item-options',
        type: 'component',
        component: 'div',
        className: 'text-sm text-gray-500'
      },
      
      'item-controls': {
        id: 'item-controls',
        type: 'layout',
        defaultLayout: 'flex',
        className: 'flex items-center space-x-3 mt-3',
        slots: ['quantity-controls', 'remove-button']
      },
      
      'quantity-controls': {
        id: 'quantity-controls',
        type: 'component',
        component: 'QuantityControls'
      },
      
      'remove-button': {
        id: 'remove-button', 
        type: 'component',
        component: 'RemoveButton',
        className: 'ml-auto'
      },
      
      'item-total': {
        id: 'item-total',
        type: 'component',
        component: 'div',
        className: 'text-right',
        defaultProps: {
          children: <p className="text-xl font-bold">$0.00</p>
        }
      }
    }
  },

  // Sidebar section
  'cart-sidebar-section': {
    id: 'cart-sidebar-section',
    type: 'container',
    component: 'CartSidebar', 
    className: 'lg:col-span-1 space-y-6 mt-8 lg:mt-0',
    
    // 🎯 REARRANGE SIDEBAR: Change this order to rearrange sidebar sections!
    children: [
      'coupon-section',
      'order-summary', 
      'checkout-button'
    ]
  },

  // Coupon section
  'coupon-section': {
    id: 'coupon-section',
    type: 'component',
    component: 'CouponSection'
  },

  // Order summary
  'order-summary': {
    id: 'order-summary', 
    type: 'component',
    component: 'OrderSummary'
  },

  // Checkout button
  'checkout-button': {
    id: 'checkout-button',
    type: 'component',
    component: 'CheckoutButton',
    defaultProps: {
      text: 'Proceed to Checkout',
      className: 'w-full',
      size: 'lg'
    }
  },

  // Empty cart display
  'empty-cart': {
    id: 'empty-cart',
    type: 'component', 
    component: 'EmptyCartDisplay',
    defaultProps: {
      title: 'Your cart is empty',
      message: 'Looks like you haven\'t added anything to your cart yet.',
      buttonText: 'Continue Shopping'
    }
  }
};

// 🎯 PAGE LAYOUT CONFIGURATION
// Store owners can change these settings to customize the entire page layout
export const CART_PAGE_CONFIG = {
  layout: 'stack', // 'flex', 'grid', or 'stack'
  
  slots: {
    'main-content': {
      // 🎨 DESKTOP LAYOUT: 2-column grid (items + sidebar)  
      layoutType: 'grid',
      layout: {
        display: 'grid',
        cols: 3,
        gap: 8,
        className: 'lg:grid lg:grid-cols-3 lg:gap-8'
      }
    },
    
    'cart-items-list': {
      // 🎯 CART ITEM LAYOUT: Horizontal flex layout
      layoutType: 'flex', 
      layout: {
        display: 'flex',
        direction: 'row',
        align: 'center',
        gap: 4,
        className: 'flex items-center space-x-4 py-6'
      },
      
      // 🎨 MICRO-SLOT ORDERING: Rearrange cart item elements!
      order: [
        'item-image',      // Image first
        'item-details',    // Title, price, options
        'item-controls',   // Quantity controls  
        'item-total'       // Price last
      ]
    },
    
    'cart-sidebar-section': {
      // 🎯 SIDEBAR ORDERING: Change sidebar section order!
      order: [
        'order-summary',    // Summary first
        'coupon-section',   // Coupon second  
        'checkout-button'   // Button last
      ]
    }
  }
};

// 🎨 LAYOUT PRESETS
// Store owners can choose from these preset layouts
export const CART_LAYOUT_PRESETS = {
  // Default layout
  'default': {
    ...CART_PAGE_CONFIG
  },
  
  // Compact layout - everything in one column
  'compact': {
    ...CART_PAGE_CONFIG,
    slots: {
      ...CART_PAGE_CONFIG.slots,
      'main-content': {
        layoutType: 'stack',
        layout: {
          display: 'flex',
          direction: 'column',
          gap: 6
        }
      }
    }
  },
  
  // Minimal layout - sidebar at top
  'minimal': {
    ...CART_PAGE_CONFIG,
    slots: {
      ...CART_PAGE_CONFIG.slots,
      'cart-sidebar-section': {
        order: [
          'checkout-button',   // Button first
          'order-summary',     // Summary second
          'coupon-section'     // Coupon last (or remove entirely)
        ]
      }
    }
  }
};

/**
 * 🎯 HOW TO CUSTOMIZE YOUR CART:
 * 
 * 1. REARRANGE SIDEBAR SECTIONS:
 *    Change the order in 'cart-sidebar-section' → children array
 *    
 * 2. REARRANGE CART ITEM ELEMENTS:
 *    Change the order in 'cart-items-list' → defaultOrder array
 *    
 * 3. CHANGE LAYOUTS:
 *    Modify layoutType: 'flex', 'grid', or 'stack' 
 *    
 * 4. MOVE BUTTON NEXT TO TITLE:
 *    In cart-items-list → order, put 'item-controls' after 'item-title'
 *    
 * 5. USE PRESET LAYOUTS:
 *    Change CART_PAGE_CONFIG to one of CART_LAYOUT_PRESETS
 *    
 * 6. CUSTOM SPACING:
 *    Adjust gap, padding, margin in layout configs
 */