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
      className: 'main-layout',
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
        withProducts: 8
      },
      viewMode: ['emptyCart', 'withProducts'],
      metadata: { hierarchical: true }
    },

    sidebar_area: {
      id: 'sidebar_area',
      type: 'flex',
      content: '',
      className: 'sidebar-area',
      styles: { flexDirection: 'column', gridRow: '2' },
      parentId: 'main_layout',
      position: { col: 9, row: 2 },
      layout: 'flex',
      colSpan: {
        withProducts: 4
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
    
    // Cart items hierarchical structure
    cart_items_container: {
      id: 'cart_items_container',
      type: 'container',
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
    
    cart_item_1: {
      id: 'cart_item_1',
      type: 'container',
      content: '',
      className: 'cart-item bg-white p-4 border-b border-gray-200 flex items-center space-x-4',
      styles: {},
      parentId: 'cart_items_container',
      layout: 'flex',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_image: {
      id: 'cart_item_1_image',
      type: 'image',
      content: 'https://via.placeholder.com/80x80',
      className: 'w-fit w-20 h-20 object-cover rounded',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_1',
      colSpan: {
        withProducts: 2
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_details: {
      id: 'cart_item_1_details',
      type: 'container',
      content: '',
      className: 'flex-1',
      styles: {},
      parentId: 'cart_item_1',
      layout: 'block',
      colSpan: {
        withProducts: 6
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_name: {
      id: 'cart_item_1_name',
      type: 'text',
      content: 'Wireless Headphones',
      className: 'w-fit text-lg font-semibold text-gray-900',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_1_details',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_description: {
      id: 'cart_item_1_description',
      type: 'text',
      content: 'Premium noise-canceling wireless headphones with 30-hour battery life',
      className: 'w-fit text-gray-600 text-sm mt-1',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_1_details',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_quantity: {
      id: 'cart_item_1_quantity',
      type: 'container',
      content: '',
      className: 'flex items-center space-x-2 mt-2',
      styles: {},
      parentId: 'cart_item_1_details',
      layout: 'flex',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_qty_label: {
      id: 'cart_item_1_qty_label',
      type: 'text',
      content: 'Qty:',
      className: 'w-fit text-sm text-gray-600',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_1_quantity',
      colSpan: {
        withProducts: 2
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_qty_input: {
      id: 'cart_item_1_qty_input',
      type: 'input',
      content: '1',
      className: 'w-16 px-2 py-1 border border-gray-300 rounded text-center',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_1_quantity',
      colSpan: {
        withProducts: 4
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_price: {
      id: 'cart_item_1_price',
      type: 'text',
      content: '$49.99',
      className: 'w-fit text-lg font-semibold text-gray-900',
      parentClassName: 'text-right',
      styles: {},
      parentId: 'cart_item_1',
      colSpan: {
        withProducts: 2
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_1_remove: {
      id: 'cart_item_1_remove',
      type: 'button',
      content: '×',
      className: 'w-fit text-red-500 hover:text-red-700 text-xl font-bold',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'cart_item_1',
      colSpan: {
        withProducts: 2
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2: {
      id: 'cart_item_2',
      type: 'container',
      content: '',
      className: 'cart-item bg-white p-4 border-b border-gray-200 flex items-center space-x-4',
      styles: {},
      parentId: 'cart_items_container',
      layout: 'flex',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_image: {
      id: 'cart_item_2_image',
      type: 'image',
      content: 'https://via.placeholder.com/80x80',
      className: 'w-fit w-20 h-20 object-cover rounded',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_2',
      colSpan: {
        withProducts: 2
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_details: {
      id: 'cart_item_2_details',
      type: 'container',
      content: '',
      className: 'flex-1',
      styles: {},
      parentId: 'cart_item_2',
      layout: 'block',
      colSpan: {
        withProducts: 6
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_name: {
      id: 'cart_item_2_name',
      type: 'text',
      content: 'Smart Watch',
      className: 'w-fit text-lg font-semibold text-gray-900',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_2_details',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_description: {
      id: 'cart_item_2_description',
      type: 'text',
      content: 'Fitness tracking smartwatch with heart rate monitor and GPS',
      className: 'w-fit text-gray-600 text-sm mt-1',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_2_details',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_quantity: {
      id: 'cart_item_2_quantity',
      type: 'container',
      content: '',
      className: 'flex items-center space-x-2 mt-2',
      styles: {},
      parentId: 'cart_item_2_details',
      layout: 'flex',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_qty_label: {
      id: 'cart_item_2_qty_label',
      type: 'text',
      content: 'Qty:',
      className: 'w-fit text-sm text-gray-600',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_2_quantity',
      colSpan: {
        withProducts: 2
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_qty_input: {
      id: 'cart_item_2_qty_input',
      type: 'input',
      content: '2',
      className: 'w-16 px-2 py-1 border border-gray-300 rounded text-center',
      parentClassName: '',
      styles: {},
      parentId: 'cart_item_2_quantity',
      colSpan: {
        withProducts: 4
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_price: {
      id: 'cart_item_2_price',
      type: 'text',
      content: '$29.98',
      className: 'w-fit text-lg font-semibold text-gray-900',
      parentClassName: 'text-right',
      styles: {},
      parentId: 'cart_item_2',
      colSpan: {
        withProducts: 2
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    cart_item_2_remove: {
      id: 'cart_item_2_remove',
      type: 'button',
      content: '×',
      className: 'w-fit text-red-500 hover:text-red-700 text-xl font-bold',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'cart_item_2',
      colSpan: {
        withProducts: 2
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    // Sidebar hierarchical structure
    coupon_container: {
      id: 'coupon_container',
      type: 'grid',
      content: '',
      className: 'coupon-container bg-white rounded-lg shadow',
      styles: {},
      parentId: 'sidebar_area',
      position: { col: 1, row: 1 },
      layout: 'grid',
      gridCols: 12,
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    coupon_title: {
      id: 'coupon_title',
      type: 'text',
      content: 'Apply Coupon',
      className: 'w-fit text-lg font-semibold mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      position: { col: 1, row: 1 },
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    coupon_input: {
      id: 'coupon_input',
      type: 'input',
      content: 'Enter coupon code',
      className: 'w-1/2 border rounded px-3 py-2',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      position: { col: 1, row: 2 },
      colSpan: {
        withProducts: 8
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    coupon_button: {
      id: 'coupon_button',
      type: 'button',
      content: 'Apply',
      className: 'w-fit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      position: { col: 9, row: 2 },
      colSpan: {
        withProducts: 4
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    order_summary_container: {
      id: 'order_summary_container',
      type: 'container',
      content: '',
      className: 'order-summary-container bg-white p-4 rounded-lg shadow mt-4',
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
    
    order_summary_title: {
      id: 'order_summary_title',
      type: 'text',
      content: 'Order Summary',
      className: 'w-fit text-lg font-semibold mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      position: { col: 1, row: 1 },
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    order_summary_subtotal: {
      id: 'order_summary_subtotal',
      type: 'text',
      content: '<span>Subtotal</span><span>$79.97</span>',
      className: 'w-full flex justify-between mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      position: { col: 1, row: 2 },
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    order_summary_tax: {
      id: 'order_summary_tax',
      type: 'text',
      content: '<span>Tax</span><span>$6.40</span>',
      className: 'w-full flex justify-between mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      position: { col: 1, row: 3 },
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    order_summary_total: {
      id: 'order_summary_total',
      type: 'text',
      content: '<span>Total</span><span>$81.37</span>',
      className: 'w-full flex justify-between text-lg font-semibold border-t pt-4 mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      position: { col: 1, row: 4 },
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    checkout_button: {
      id: 'checkout_button',
      type: 'button',
      content: 'Proceed to Checkout',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-lg',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      position: { col: 1, row: 5 },
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