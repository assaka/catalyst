import { Package, Image, ShoppingCart, Info, FileText, Star } from 'lucide-react';

// Product Page Configuration with hierarchical support
export const productConfig = {
  page_name: 'Product Detail',
  slot_type: 'product_layout',

  // Slot configuration with hierarchical structure (slot_configurations format)
  slots: {
    // Main containers with parent-child relationships
    main_layout: {
      id: 'main_layout',
      type: 'grid',
      content: '',
      className: 'main-layout max-w-6xl mx-auto px-4 py-8',
      styles: {},
      parentId: null,
      layout: 'grid',
      gridCols: 12,
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Breadcrumbs section
    breadcrumbs_container: {
      id: 'breadcrumbs_container',
      type: 'container',
      content: '',
      className: 'breadcrumbs-container mb-6',
      styles: { gridColumn: '1 / -1', gridRow: '1' },
      parentId: 'main_layout',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    breadcrumbs: {
      id: 'breadcrumbs',
      type: 'text',
      content: '<nav>Home > Category > Product</nav>',
      className: 'w-fit text-sm text-gray-600',
      parentClassName: '',
      styles: {},
      parentId: 'breadcrumbs_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Main product content area
    content_area: {
      id: 'content_area',
      type: 'grid',
      content: '',
      className: 'content-area grid md:grid-cols-2 gap-8',
      styles: { gridRow: '2' },
      parentId: 'main_layout',
      position: { col: 1, row: 2 },
      layout: 'grid',
      gridCols: 2,
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Product Images Section
    gallery_container: {
      id: 'gallery_container',
      type: 'container',
      content: '',
      className: 'gallery-container space-y-4',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        default: 6
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    main_image: {
      id: 'main_image',
      type: 'container',
      content: '',
      className: 'main-image relative aspect-square bg-gray-100 rounded-lg overflow-hidden',
      styles: {},
      parentId: 'gallery_container',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    product_image: {
      id: 'product_image',
      type: 'image',
      content: 'product-main-image',
      className: 'w-full h-full object-cover',
      parentClassName: '',
      styles: {},
      parentId: 'main_image',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    product_labels: {
      id: 'product_labels',
      type: 'container',
      content: '',
      className: 'product-labels absolute top-2 right-2',
      styles: {},
      parentId: 'main_image',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    thumbnail_gallery: {
      id: 'thumbnail_gallery',
      type: 'flex',
      content: '',
      className: 'thumbnail-gallery flex space-x-2 overflow-x-auto',
      styles: {},
      parentId: 'gallery_container',
      position: { col: 1, row: 2 },
      layout: 'flex',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Product Information Section
    info_container: {
      id: 'info_container',
      type: 'container',
      content: '',
      className: 'info-container space-y-6',
      styles: {},
      parentId: 'content_area',
      position: { col: 2, row: 1 },
      layout: 'block',
      colSpan: {
        default: 6
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    product_title: {
      id: 'product_title',
      type: 'text',
      content: 'Product Name',
      className: 'w-fit text-3xl font-bold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    price_container: {
      id: 'price_container',
      type: 'flex',
      content: '',
      className: 'price-container flex items-center space-x-4 mb-4',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 2 },
      layout: 'flex',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    product_price: {
      id: 'product_price',
      type: 'text',
      content: '$99.99',
      className: 'w-fit text-3xl font-bold text-green-600',
      parentClassName: '',
      styles: {},
      parentId: 'price_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    compare_price: {
      id: 'compare_price',
      type: 'text',
      content: '$129.99',
      className: 'w-fit text-xl text-gray-500 line-through',
      parentClassName: '',
      styles: {},
      parentId: 'price_container',
      position: { col: 2, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    stock_status: {
      id: 'stock_status',
      type: 'text',
      content: 'In Stock',
      className: 'w-fit inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 3 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    product_sku: {
      id: 'product_sku',
      type: 'text',
      content: 'SKU: PROD123',
      className: 'w-fit text-sm text-gray-600',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 4 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Custom Options Section
    options_container: {
      id: 'options_container',
      type: 'container',
      content: '',
      className: 'options-container space-y-4',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 5 },
      layout: 'block',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    custom_options: {
      id: 'custom_options',
      type: 'component',
      content: 'CustomOptions',
      className: 'custom-options',
      parentClassName: '',
      styles: {},
      parentId: 'options_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Add to Cart Section
    actions_container: {
      id: 'actions_container',
      type: 'container',
      content: '',
      className: 'actions-container border-t pt-6',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 6 },
      layout: 'block',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    quantity_selector: {
      id: 'quantity_selector',
      type: 'flex',
      content: '',
      className: 'quantity-selector flex items-center space-x-2 mb-4',
      styles: {},
      parentId: 'actions_container',
      position: { col: 1, row: 1 },
      layout: 'flex',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    quantity_label: {
      id: 'quantity_label',
      type: 'text',
      content: 'Qty:',
      className: 'w-fit font-medium text-sm',
      parentClassName: '',
      styles: {},
      parentId: 'quantity_selector',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 'col-span-2'
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    quantity_input: {
      id: 'quantity_input',
      type: 'input',
      content: '1',
      className: 'px-2 py-2 w-16 text-center border rounded-lg',
      parentClassName: '',
      styles: {},
      parentId: 'quantity_selector',
      position: { col: 2, row: 1 },
      colSpan: {
        default: 'col-span-3'
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    buttons_container: {
      id: 'buttons_container',
      type: 'flex',
      content: '',
      className: 'buttons-container flex items-center space-x-4',
      styles: {},
      parentId: 'actions_container',
      position: { col: 1, row: 2 },
      layout: 'flex',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    add_to_cart_button: {
      id: 'add_to_cart_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-fit flex-1 h-12 text-lg bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium',
      parentClassName: '',
      styles: {},
      parentId: 'buttons_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 'flex-1'
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    wishlist_button: {
      id: 'wishlist_button',
      type: 'button',
      content: '♥',
      className: 'w-fit h-12 w-12 border border-gray-300 rounded text-gray-500 hover:text-red-500',
      parentClassName: '',
      styles: {},
      parentId: 'buttons_container',
      position: { col: 2, row: 1 },
      colSpan: {
        default: 'w-12'
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Product Tabs Section
    tabs_container: {
      id: 'tabs_container',
      type: 'container',
      content: '',
      className: 'tabs-container mt-12 border-t pt-8',
      styles: { gridRow: '3' },
      parentId: 'main_layout',
      position: { col: 1, row: 3 },
      layout: 'block',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    tab_navigation: {
      id: 'tab_navigation',
      type: 'flex',
      content: '',
      className: 'tab-navigation border-b border-gray-200',
      styles: {},
      parentId: 'tabs_container',
      position: { col: 1, row: 1 },
      layout: 'flex',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    tab_content: {
      id: 'tab_content',
      type: 'container',
      content: '',
      className: 'tab-content mt-6 prose max-w-none',
      styles: {},
      parentId: 'tabs_container',
      position: { col: 1, row: 2 },
      layout: 'block',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Related Products Section
    related_products_container: {
      id: 'related_products_container',
      type: 'container',
      content: '',
      className: 'related-products-container mt-16',
      styles: { gridRow: '4' },
      parentId: 'main_layout',
      position: { col: 1, row: 4 },
      layout: 'block',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    related_products_title: {
      id: 'related_products_title',
      type: 'text',
      content: 'Recommended Products',
      className: 'w-fit text-2xl font-bold text-gray-900 mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'related_products_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    related_products_grid: {
      id: 'related_products_grid',
      type: 'grid',
      content: '',
      className: 'related-products-grid grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6',
      styles: {},
      parentId: 'related_products_container',
      position: { col: 1, row: 2 },
      layout: 'grid',
      gridCols: 4,
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    }
  },

  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'product'
  },

  // View configuration
  views: [
    { id: 'default', label: 'Default View', icon: Package }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    'product_above_title',
    'product_below_title',
    'product_above_price',
    'product_below_price',
    'product_above_cart_button',
    'product_below_cart_button',
    'product_above_description',
    'product_below_description',
    'above_product_tabs',
    'product_footer'
  ]
};

export default productConfig;