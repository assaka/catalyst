import { Grid, List } from 'lucide-react';

// Category Page Configuration with hierarchical support - mirrors cart-config.js exactly
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',



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
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
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
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    breadcrumbs_container: {
      id: 'breadcrumbs_container',
      type: 'container',
      content: '',
      className: 'breadcrumbs-container',
      styles: { gridColumn: '1 / -1', gridRow: '2' },
      parentId: 'main_layout',
      position: { col: 1, row: 2 },
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    content_area: {
      id: 'content_area',
      type: 'container',
      content: '',
      className: 'content-area',
      styles: { gridRow: '3' },
      parentId: 'main_layout',
      position: { col: 1, row: 3 },
      layout: 'block',
      colSpan: {
        grid: 'col-span-12 sm:col-span-9 lg:col-span-9',
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    sidebar_area: {
      id: 'sidebar_area',
      type: 'flex',
      content: '',
      className: 'sidebar-area',
      styles: { flexDirection: 'column', gridRow: '3' },
      parentId: 'main_layout',
      position: { col: 10, row: 3 },
      layout: 'flex',
      colSpan: {
        grid: 'col-span-12 sm:col-span-3 lg:col-span-3'
      },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    pagination_container: {
      id: 'pagination_container',
      type: 'container',
      content: '',
      className: 'pagination-container',
      styles: { gridColumn: '1 / -1', gridRow: '4' },
      parentId: 'main_layout',
      position: { col: 1, row: 4 },
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Header slot
    header: {
      id: 'header',
      type: 'text',
      content: '<h1 class="text-3xl font-bold text-gray-900">Electronics</h1><p class="text-gray-600 mt-2">Browse our latest electronics and gadgets</p>',
      className: 'w-fit category-header',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'header_container',
      position: { col: 1, row: 1 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Breadcrumbs navigation
    breadcrumbs: {
      id: 'breadcrumbs',
      type: 'text',
      content: '<nav class="flex items-center space-x-2 text-sm text-gray-600"><a href="/" class="hover:text-gray-900">Home</a><span>/</span><span class="text-gray-900">Electronics</span></nav>',
      className: 'w-fit category-breadcrumbs',
      parentClassName: '',
      styles: {},
      parentId: 'breadcrumbs_container',
      position: { col: 1, row: 1 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Products grid/list - main content
    products: {
      id: 'products',
      type: 'container',
      content: '',
      className: 'category-products',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 1 },
      layout: 'grid',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Sample products
    product_1: {
      id: 'product_1',
      type: 'container',
      content: '',
      className: 'product-card bg-white p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 'col-span-12 sm:col-span-6 lg:col-span-4',
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_1_image: {
      id: 'product_1_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x200',
      className: 'w-full h-48 object-cover rounded-lg mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'product_1',
      colSpan: {
        grid: 12,
        list: 'col-span-4'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_1_name: {
      id: 'product_1_name',
      type: 'text',
      content: 'Wireless Headphones',
      className: 'w-fit text-lg font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_1',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_1_description: {
      id: 'product_1_description',
      type: 'text',
      content: 'High-quality wireless headphones with noise cancellation',
      className: 'w-fit text-gray-600 text-sm mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_1',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_1_price: {
      id: 'product_1_price',
      type: 'text',
      content: '$199.99',
      className: 'w-fit text-xl font-bold text-gray-900 mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_1',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_1_button: {
      id: 'product_1_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-fit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      parentClassName: '',
      styles: {},
      parentId: 'product_1',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2: {
      id: 'product_2',
      type: 'container',
      content: '',
      className: 'product-card bg-white p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 'col-span-12 sm:col-span-6 lg:col-span-4',
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2_image: {
      id: 'product_2_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x200',
      className: 'w-full h-48 object-cover rounded-lg mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'product_2',
      colSpan: {
        grid: 12,
        list: 'col-span-4'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2_name: {
      id: 'product_2_name',
      type: 'text',
      content: 'Smartphone',
      className: 'w-fit text-lg font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_2',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2_description: {
      id: 'product_2_description',
      type: 'text',
      content: 'Latest model smartphone with advanced camera',
      className: 'w-fit text-gray-600 text-sm mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_2',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2_price: {
      id: 'product_2_price',
      type: 'text',
      content: '$799.99',
      className: 'w-fit text-xl font-bold text-gray-900 mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_2',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2_button: {
      id: 'product_2_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-fit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      parentClassName: '',
      styles: {},
      parentId: 'product_2',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3: {
      id: 'product_3',
      type: 'container',
      content: '',
      className: 'product-card bg-white p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 'col-span-12 sm:col-span-6 lg:col-span-4',
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3_image: {
      id: 'product_3_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x200',
      className: 'w-full h-48 object-cover rounded-lg mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'product_3',
      colSpan: {
        grid: 12,
        list: 'col-span-4'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3_name: {
      id: 'product_3_name',
      type: 'text',
      content: 'Tablet',
      className: 'w-fit text-lg font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_3',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3_description: {
      id: 'product_3_description',
      type: 'text',
      content: 'Portable tablet perfect for work and entertainment',
      className: 'w-fit text-gray-600 text-sm mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_3',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3_price: {
      id: 'product_3_price',
      type: 'text',
      content: '$299.99',
      className: 'w-fit text-xl font-bold text-gray-900 mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_3',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3_button: {
      id: 'product_3_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-fit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      parentClassName: '',
      styles: {},
      parentId: 'product_3',
      colSpan: {
        grid: 12,
        list: 'col-span-8'
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Filters sidebar (only show in grid view)
    filters: {
      id: 'filters',
      type: 'container',
      content: '',
      className: 'category-filters bg-white rounded-lg shadow p-6',
      styles: {},
      parentId: 'sidebar_area',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        grid: 12
      },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    filters_title: {
      id: 'filters_title',
      type: 'text',
      content: 'Filters',
      className: 'w-fit text-lg font-semibold mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'filters',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12
      },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    filters_price: {
      id: 'filters_price',
      type: 'text',
      content: '<h4 class="font-medium text-gray-700 mb-2">Price Range</h4><div class="space-y-2"><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Under $25</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">$25 - $50</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">$50 - $100</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Over $100</span></label></div>',
      className: 'w-fit mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters',
      position: { col: 1, row: 2 },
      colSpan: {
        grid: 12
      },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    filters_brand: {
      id: 'filters_brand',
      type: 'text',
      content: '<h4 class="font-medium text-gray-700 mb-2">Brand</h4><div class="space-y-2"><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Apple</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Samsung</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Google</span></label></div>',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'filters',
      position: { col: 1, row: 3 },
      colSpan: {
        grid: 12
      },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    // Pagination
    pagination: {
      id: 'pagination',
      type: 'text',
      content: '<div class="flex items-center justify-center space-x-2"><button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50" disabled>Previous</button><button class="px-3 py-1 bg-blue-600 text-white rounded">1</button><button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">2</button><button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">3</button><span class="px-2 text-gray-500">...</span><button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">10</button><button class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Next</button></div>',
      className: 'w-fit category-pagination',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'pagination_container',
      position: { col: 1, row: 1 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },
  },

  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'category'
  },

  // View configuration
  views: [
    { id: 'grid', label: 'Grid View', icon: Grid },
    { id: 'list', label: 'List View', icon: List }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    'category_header',
    'category_above_products',
    'category_below_products',
    'category_sidebar',
    'category_footer'
  ]
};

export default categoryConfig;