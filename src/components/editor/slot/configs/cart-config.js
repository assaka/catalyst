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
      colSpan: 12,
      viewMode: ['empty', 'withProducts'],
      metadata: { hierarchical: true }
    },
    
    header_container: {
      id: 'header_container', 
      type: 'flex',
      content: '',
      className: 'header-container',
      styles: {},
      parentId: 'main_layout',
      layout: 'flex',
      colSpan: 12,
      viewMode: ['empty', 'withProducts'],
      metadata: { hierarchical: true }
    },
    
    content_area: {
      id: 'content_area',
      type: 'container', 
      content: '',
      className: 'content-area',
      styles: {},
      parentId: 'main_layout',
      layout: 'block',
      colSpan: 8,
      viewMode: ['empty', 'withProducts'],
      metadata: { hierarchical: true }
    },
    
    sidebar_area: {
      id: 'sidebar_area',
      type: 'flex',
      content: '',
      className: 'sidebar-area', 
      styles: { flexDirection: 'column' },
      parentId: 'main_layout',
      layout: 'flex',
      colSpan: 4,
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    // Header slot
    header_title: {
      id: 'header_title',
      type: 'text',
      content: 'My Cart',
      className: 'text-3xl font-bold text-gray-900 mb-4',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'header_container',
      viewMode: ['empty', 'withProducts'],
      metadata: { hierarchical: true }
    },
    
    // Empty cart hierarchical structure
    empty_cart_container: {
      id: 'empty_cart_container',
      type: 'container',
      content: '',
      className: 'empty-cart-container text-center',
      styles: {},
      parentId: 'content_area',
      layout: 'block',
      colSpan: 12,
      viewMode: ['empty'],
      metadata: { hierarchical: true }
    },
    
    empty_cart_icon: {
      id: 'empty_cart_icon', 
      type: 'image',
      content: 'shopping-cart-icon',
      className: 'w-16 h-16 mx-auto text-gray-400 mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'empty_cart_container',
      colSpan: 12,
      viewMode: ['empty'],
      metadata: { hierarchical: true }
    },
    
    empty_cart_title: {
      id: 'empty_cart_title',
      type: 'text', 
      content: 'Your cart is empty',
      className: 'text-xl font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'empty_cart_container',
      colSpan: 12,
      viewMode: ['empty'],
      metadata: { hierarchical: true }
    },
    
    empty_cart_text: {
      id: 'empty_cart_text',
      type: 'text',
      content: "Looks like you haven't added anything to your cart yet.",
      className: 'text-gray-600 mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'empty_cart_container', 
      colSpan: 12,
      viewMode: ['empty'],
      metadata: { hierarchical: true }
    },
    
    empty_cart_button: {
      id: 'empty_cart_button',
      type: 'button',
      content: 'Continue Shopping',
      className: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'empty_cart_container',
      colSpan: 12,
      viewMode: ['empty'],
      metadata: { hierarchical: true }
    },
    
    // Sidebar hierarchical structure
    coupon_container: {
      id: 'coupon_container',
      type: 'grid',
      content: '',
      className: 'coupon-container bg-white p-4 rounded-lg shadow',
      styles: {},
      parentId: 'sidebar_area',
      layout: 'grid',
      gridCols: 12,
      colSpan: 12,
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    coupon_title: {
      id: 'coupon_title',
      type: 'text',
      content: 'Apply Coupon',
      className: 'text-lg font-semibold mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      colSpan: 12,
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    coupon_input: {
      id: 'coupon_input',
      type: 'input',
      content: 'Enter coupon code',
      className: 'border rounded px-3 py-2',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      colSpan: 8,
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    coupon_button: {
      id: 'coupon_button',
      type: 'button',
      content: 'Apply',
      className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      colSpan: 4,
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
      layout: 'block',
      colSpan: 12,
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    order_summary_title: {
      id: 'order_summary_title',
      type: 'text',
      content: 'Order Summary',
      className: 'text-lg font-semibold mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    order_summary_subtotal: {
      id: 'order_summary_subtotal',
      type: 'text',
      content: '<span>Subtotal</span><span>$79.97</span>',
      className: 'flex justify-between mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    order_summary_tax: {
      id: 'order_summary_tax',
      type: 'text',
      content: '<span>Tax</span><span>$6.40</span>',
      className: 'flex justify-between mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },
    
    order_summary_total: {
      id: 'order_summary_total',
      type: 'text',
      content: '<span>Total</span><span>$81.37</span>',
      className: 'flex justify-between text-lg font-semibold border-t pt-4 mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
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
      colSpan: 12,
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