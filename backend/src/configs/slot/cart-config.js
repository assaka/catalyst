// Cart Page Configuration with hierarchical support
// Backend version - CommonJS format

const cartConfig = {
  page_name: 'Cart',
  slot_type: 'cart_layout',

  // Slot configuration with content, styling and metadata
  slots: {
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
      type: 'grid',
      content: '',
      className: 'header-container grid grid-cols-12 gap-2',
      styles: { gridColumn: '1 / -1', gridRow: '1' },
      parentId: 'main_layout',
      position: { col: 1, row: 1 },
      layout: 'grid',
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
      layout: 'grid',
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

    header_title: {
      id: 'header_title',
      type: 'text',
      content: '{{t "common.my_cart"}}',
      className: 'w-fit text-3xl font-bold text-gray-900 mb-4',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'header_container',
      position: { col: 1, row: 1 },
      viewMode: ['emptyCart', 'withProducts'],
      metadata: { hierarchical: true }
    },

    empty_cart_container: {
      id: 'empty_cart_container',
      type: 'grid',
      content: '',
      className: 'empty-cart-container grid grid-cols-12 gap-2',
      styles: { gridRow: '2' },
      parentId: 'main_layout',
      position: { col: 1, row: 2 },
      layout: 'grid',
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
      parentClassName: 'text-center',
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
      content: '{{t "cart.cart_empty"}}',
      className: 'w-fit text-xl font-semibold text-gray-900 mb-2 mx-auto',
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
      content: '{{t "cart.cart_empty_message"}}',
      className: 'w-fit text-gray-600 mb-6 mx-auto',
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
      content: '{{t "common.continue_shopping"}}',
      className: 'w-fit bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mx-auto',
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

    cart_items: {
      id: 'cart_items',
      type: 'component',
      component: 'CartItemsSlot',
      content: '',
      className: 'cart-items-container bg-white divide-y divide-gray-400',
      styles: { padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
      parentId: 'content_area',
      position: { col: 1, row: 1 },
      layout: 'grid',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },

    coupon_section: {
      id: 'coupon_section',
      type: 'component',
      component: 'CartCouponSlot',
      content: '',
      className: 'bg-white',
      styles: { padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
      parentId: 'sidebar_area',
      position: { col: 1, row: 1 },
      layout: 'grid',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    },

    order_summary: {
      id: 'order_summary',
      type: 'component',
      component: 'CartOrderSummarySlot',
      content: '',
      className: 'bg-white',
      styles: { padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
      parentId: 'sidebar_area',
      position: { col: 1, row: 2 },
      layout: 'grid',
      colSpan: {
        withProducts: 12
      },
      viewMode: ['withProducts'],
      metadata: { hierarchical: true }
    }
  },

  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'cart'
  },

  views: [
    { id: 'emptyCart', label: 'Empty Cart', icon: null },
    { id: 'withProducts', label: 'With Products', icon: null }
  ],

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

module.exports = { cartConfig };
