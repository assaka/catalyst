// Product Page Configuration with hierarchical support
// Backend version - CommonJS format without lucide-react icons

const productConfig = {
  page_name: 'Product Detail',
  slot_type: 'product_layout',

  // Slot configuration with hierarchical structure (slot_configurations format)
  slots: {
    // CMS Block - Product Above (at the very top)
    cms_block_product_above: {
      id: 'cms_block_product_above',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: 'cms-block-product-above',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 0 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'CMS Block - Product Above',
        cmsPosition: 'product_above',
        props: {
          position: 'product_above'
        }
      }
    },

    // Main containers with parent-child relationships
    main_layout: {
      id: 'main_layout',
      type: 'grid',
      content: '',
      className: 'main-layout max-w-6xl mx-auto sm:px-4 py-8',
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
      type: 'grid',
      content: '',
      className: 'breadcrumbs-container grid grid-cols-12 gap-2 mb-6',
      styles: { gridColumn: '1 / -1', gridRow: '1' },
      parentId: 'main_layout',
      position: { col: 1, row: 1 },
      layout: 'grid',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    breadcrumbs: {
      id: 'breadcrumbs',
      type: 'component',
      component: 'Breadcrumbs',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'breadcrumbs_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Product Breadcrumb Navigation'
      }
    },

    // Main product content area
    content_area: {
      id: 'content_area',
      type: 'grid',
      content: '',
      className: 'content-area grid md:grid-cols-12 md:gap-8',
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

    // PRODUCT TITLE - Mobile only (appears above gallery)
    product_title_mobile: {
      id: 'product_title_mobile',
      type: 'text',
      content: '{{product.name}}',
      className: 'w-full text-2xl font-bold text-gray-900 mb-4 sm:hidden',
      parentClassName: '',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 0 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        htmlTag: 'h1',
        htmlAttributes: {
          'data-product-title-mobile': ''
        }
      }
    },

    // PRODUCT GALLERY - React Component with Interactive Thumbnails
    product_gallery_container: {
      id: 'product_gallery_container',
      type: 'component',
      component: 'ProductGallery',
      content: '',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 1 },
      layout: 'flex',
      colSpan: {
        default: 'col-span-12 lg:col-span-6'
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Product Image Gallery',
        component: 'ProductGallery'
      }
    },

    // Product Information Section
    info_container: {
      id: 'info_container',
      type: 'grid',
      content: '',
      className: 'info-container col-span-12 lg:col-span-6 grid grid-cols-12 gap-2 space-y-6',
      styles: {},
      parentId: 'content_area',
      position: { col: 7, row: 1 },
      layout: 'grid',
      colSpan: {
        default: 'col-span-12 lg:col-span-6'
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    product_title: {
      id: 'product_title',
      type: 'text',
      content: '{{product.name}}',
      className: 'w-fit text-3xl font-bold text-gray-900 mb-2 hidden sm:block',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        htmlTag: 'h1',
        htmlAttributes: {
          'data-product-title': ''
        }
      }
    },

    // CMS Block - Product Above Price
    cms_block_product_above_price: {
      id: 'cms_block_product_above_price',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: 'cms-block-product-above-price',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 2 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'CMS Block - Above Price',
        cmsPosition: 'product_above_price',
        props: {
          position: 'product_above_price'
        }
      }
    },

    price_container: {
      id: 'price_container',
      type: 'flex',
      content: '',
      className: 'price-container flex items-center space-x-4 mb-4',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 3 },
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
      content: '{{#unless settings.hide_currency_product}}{{settings.currency_symbol}}{{/unless}}{{#if product.compare_price}}{{product.compare_price_number}}{{else}}{{product.price_number}}{{/if}}',
      className: 'w-fit text-3xl font-bold text-green-600',
      parentClassName: '',
      styles: {},
      parentId: 'price_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        htmlTag: 'span',
        htmlAttributes: {
          'data-main-price': ''
        }
      }
    },

    original_price: {
      id: 'original_price',
      type: 'text',
      content: '{{#if product.compare_price}}{{#unless settings.hide_currency_product}}{{settings.currency_symbol}}{{/unless}}{{product.price_number}}{{/if}}',
      className: 'w-fit text-xl text-gray-500 line-through',
      parentClassName: '',
      styles: {},
      parentId: 'price_container',
      position: { col: 2, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        htmlTag: 'span',
        htmlAttributes: {
          'data-original-price': ''
        }
      }
    },

    stock_status: {
      id: 'stock_status',
      type: 'component',
      component: 'StockStatus',
      content: '',
      className: 'stock-container',
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
      content: '{{#if product.sku}}{{t "sku"}}: {{product.sku}}{{/if}}',
      className: 'w-fit text-base text-gray-900',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 4 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        htmlTag: 'span',
        htmlAttributes: {
          'class': 'product-sku'
        }
      }
    },

    product_short_description: {
      id: 'product_short_description',
      type: 'text',
      content: '{{product.short_description}}',
      className: 'w-fit text-gray-700 leading-relaxed',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 5 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Custom Options Section
    options_container: {
      id: 'options_container',
      type: 'grid',
      content: '',
      className: 'options-container grid grid-cols-12 gap-2 space-y-4',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 7 },
      layout: 'grid',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    configurable_product_selector: {
      id: 'configurable_product_selector',
      type: 'component',
      component: 'ConfigurableProductSelector',
      content: '',
      className: 'configurable-product-selector mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'options_container',
      position: { col: 1, row: 0 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'Configurable Product Selector',
        component: 'ConfigurableProductSelector'
      }
    },

    custom_options: {
      id: 'custom_options',
      type: 'component',
      component: 'CustomOptions',
      content: '',
      className: 'custom-options',
      parentClassName: '',
      styles: {},
      parentId: 'options_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        component: 'CustomOptions'
      }
    },

    // Add to Cart Section
    actions_container: {
      id: 'actions_container',
      type: 'grid',
      content: '',
      className: 'actions-container grid grid-cols-12 gap-2 border-t pt-6',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 8 },
      layout: 'grid',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    quantity_selector: {
      id: 'quantity_selector',
      type: 'component',
      component: 'QuantitySelector',
      content: '',
      className: 'quantity-selector mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'actions_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        component: 'QuantitySelector'
      }
    },

    total_price_display: {
      id: 'total_price_display',
      type: 'component',
      component: 'TotalPriceDisplay',
      content: '',
      className: 'total-price-container',
      parentClassName: '',
      styles: {},
      parentId: 'actions_container',
      position: { col: 1, row: 2 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    buttons_container: {
      id: 'buttons_container',
      type: 'flex',
      content: '',
      className: 'buttons-container w-full flex items-center space-x-4',
      styles: {},
      parentId: 'actions_container',
      position: { col: 1, row: 3 },
      layout: 'flex',
      colSpan: {},
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    add_to_cart_button: {
      id: 'add_to_cart_button',
      type: 'button',
      content: '{{t "product.add_to_cart"}}',
      className: 'w-fit h-12 text-lg text-white px-6 py-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2 transition-colors duration-200 hover:brightness-90',
      parentClassName: '',
      styles: {
        backgroundColor: '{{settings.theme.add_to_cart_button_color}}'
      },
      parentId: 'buttons_container',
      position: { col: 1, row: 1 },
      colSpan: {},
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        action: 'addToCart',
        stockAware: true
      }
    },

    wishlist_button: {
      id: 'wishlist_button',
      type: 'button',
      content: '♥',
      className: 'w-fit h-12 w-12 border border-gray-300 rounded text-gray-500 hover:text-red-500 bg-white hover:bg-white',
      parentClassName: '',
      styles: {},
      parentId: 'buttons_container',
      position: { col: 1, row: 1 },
      colSpan: {
        default: 'w-12'
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Product Tabs Section
    product_tabs: {
      id: 'product_tabs',
      type: 'component',
      component: 'ProductTabsSlot',
      content: '',
      className: 'product-tabs-container mt-12 border-t pt-8',
      styles: { gridRow: '3' },
      parentId: 'main_layout',
      position: { col: 1, row: 3 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        component: 'ProductTabsSlot'
      }
    },

    // Related Products Section
    related_products_container: {
      id: 'related_products_container',
      type: 'grid',
      content: '',
      className: 'related-products-container grid grid-cols-12 gap-2 mt-16',
      styles: { gridRow: '4' },
      parentId: 'main_layout',
      position: { col: 1, row: 4 },
      layout: 'grid',
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    related_products_title: {
      id: 'related_products_title',
      type: 'text',
      content: '{{t "recommended_products"}}',
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
    },

    // CMS Block - Product Below (at the very bottom)
    cms_block_product_below: {
      id: 'cms_block_product_below',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: 'cms-block-product-below',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 5 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        displayName: 'CMS Block - Product Below',
        cmsPosition: 'product_below',
        props: {
          position: 'product_below'
        }
      }
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
    { id: 'default', label: 'Default View', icon: null }
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

module.exports = { productConfig };
