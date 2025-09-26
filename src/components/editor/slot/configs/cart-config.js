import { ShoppingCart, Package } from 'lucide-react';

// Cart Page Configuration with hierarchical support
export const cartConfig = {
  page_name: 'Cart',
  slot_type: 'cart_layout',
  
  
  
  // Slot configuration with content, styling and metadata (slot_configurations format)
  slots: {
    // Hierarchical structure defined via parentId and children properties
    // Main containers with parent-child relationships
    main_layout: {
      id: 'main_layout',
      type: 'grid',
      content: '',
      className: 'grid grid-cols-1 lg:grid-cols-12 gap-4',
      styles: {},
      parentId: null,
      layout: 'grid',
      gridCols: 12,
      colSpan: {
        emptyCart: 12,
        withProducts: 12
      },
      viewMode: ['emptyCart', 'withProducts'],
      metadata: { hierarchical: true }
    },

    header_container: {
      id: 'header_container',
      type: 'flex',
      content: '',
      className: 'header-container',
      styles: { gridColumn: '1 / -1', gridRow: '1' },
      parentId: 'main_layout',
      position: { col: 1, row: 1 },
      layout: 'flex',
      colSpan: {
        emptyCart: 12,
        withProducts: 12
      },
      viewMode: ['emptyCart', 'withProducts'],
      metadata: { hierarchical: true }
    },

    content_area: {
      id: 'content_area',
      type: 'container',
      content: '',
      className: 'content-area',
      styles: { gridRow: '2' },
      parentId: 'main_layout',
      position: { col: 1, row: 2 },
      layout: 'block',
      colSpan: {
        emptyCart: 12,
        withProducts: 'col-span-12 lg:col-span-9'
      },
      viewMode: ['emptyCart', 'withProducts'],
      metadata: { hierarchical: true }
    },

    sidebar_area: {
      id: 'sidebar_area',
      type: 'flex',
      content: '',
      className: 'sidebar-area space-y-4',
      styles: { flexDirection: 'column', gridRow: '2' },
      parentId: 'main_layout',
      position: { col: 9, row: 2 },
      layout: 'flex',
      colSpan: {
        withProducts: 'col-span-12 lg:col-span-3'
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },

    // Header slot
    header_title: {
      id: 'header_title',
      type: 'text',
      content: 'My Cart',
      className: 'w-fit text-3xl font-bold text-gray-900 mb-4',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'header_container',
      position: { col: 1, row: 1 },
      viewMode: ['emptyCart', 'withProducts'],
      metadata: { hierarchical: true }
    },
    
    // Empty cart hierarchical structure
    empty_cart_container: {
      id: 'empty_cart_container',
      type: 'container',
      content: '',
      className: 'empty-cart-container text-center',
      styles: { gridRow: '2' },
      parentId: 'main_layout',
      position: { col: 1, row: 2 },
      layout: 'block',
      colSpan: {
        emptyCart: 12
      },
      viewMode: ['emptyCart'],
      metadata: { hierarchical: true }
    },
    
    empty_cart_icon: {
      id: 'empty_cart_icon',
      type: 'image',
      content: 'shopping-cart-icon',
      className: 'w-fit w-16 h-16 mx-auto text-gray-400 mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'empty_cart_container',
      position: { col: 1, row: 1 },
      colSpan: {
        emptyCart: 12
      },
      viewMode: ['emptyCart'],
      metadata: { hierarchical: true }
    },
    
    empty_cart_title: {
      id: 'empty_cart_title',
      type: 'text',
      content: 'Your cart is empty',
      className: 'w-fit text-xl font-semibold text-gray-900 mb-2',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'empty_cart_container',
      position: { col: 1, row: 2 },
      colSpan: {
        emptyCart: 12
      },
      viewMode: ['emptyCart'],
      metadata: { hierarchical: true }
    },
    
    empty_cart_text: {
      id: 'empty_cart_text',
      type: 'text',
      content: "Looks like you haven't added anything to your cart yet.",
      className: 'w-fit text-gray-600 mb-6',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'empty_cart_container',
      position: { col: 1, row: 3 },
      colSpan: {
        emptyCart: 12
      },
      viewMode: ['emptyCart'],
      metadata: { hierarchical: true }
    },
    
    empty_cart_button: {
      id: 'empty_cart_button',
      type: 'button',
      content: 'Continue Shopping',
      className: 'w-fit bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'empty_cart_container',
      position: { col: 1, row: 4 },
      colSpan: {
        emptyCart: 12
      },
      viewMode: ['emptyCart'],
      metadata: { hierarchical: true }
    },
    
    // Cart items using component
    cart_items: {
      id: 'cart_items',
      type: 'component',
      component: 'CartItemsSlot',
      content: '',
      className: 'cart-items-container',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    // Coupon section using functional component
    coupon_section: {
      id: 'coupon_section',
      type: 'component',
      component: 'CartCouponSlot',
      content: '',
      className: '',
      styles: {},
      parentId: 'sidebar_area',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },

    // Order summary using functional component
    order_summary: {
      id: 'order_summary',
      type: 'component',
      component: 'CartOrderSummarySlot',
      content: '',
      className: '',
      styles: {},
      parentId: 'sidebar_area',
      position: { col: 1, row: 2 },
      layout: 'block',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
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
    { id: 'emptyCart', label: 'Empty Cart', icon: ShoppingCart },
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