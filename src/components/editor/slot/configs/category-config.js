import { Grid, List } from 'lucide-react';

// Category Page Configuration - mirrors exact Category.jsx layout structure
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',



  // Slot configuration matching exact Category.jsx structure
  slots: {
    // Main outer container (px-4 sm:px-6 lg:px-8 py-8)
    main_container: {
      id: 'main_container',
      type: 'container',
      content: '',
      className: 'px-4 sm:px-6 lg:px-8 py-8',
      styles: {},
      parentId: null,
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Header section (mb-8 max-w-7xl mx-auto)
    header_section: {
      id: 'header_section',
      type: 'container',
      content: '',
      className: 'mb-8 max-w-7xl mx-auto',
      styles: {},
      parentId: 'main_container',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Breadcrumb
    breadcrumbs: {
      id: 'breadcrumbs',
      type: 'text',
      content: '<nav class="flex items-center space-x-2 text-sm text-gray-600 mb-4"><a href="/" class="hover:text-gray-900">Home</a><span>/</span><span class="text-gray-900">Electronics</span></nav>',
      className: 'w-fit category-breadcrumbs',
      parentClassName: '',
      styles: {},
      parentId: 'header_section',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Page title (h1)
    header: {
      id: 'header',
      type: 'text',
      content: '<h1 class="text-4xl font-bold">Electronics</h1>',
      className: 'w-fit category-header',
      parentClassName: '',
      styles: {},
      parentId: 'header_section',
      position: { col: 1, row: 2 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Category description
    header_description: {
      id: 'header_description',
      type: 'text',
      content: '<p class="text-gray-600 mt-2">Browse our latest electronics and gadgets</p>',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'header_section',
      position: { col: 1, row: 3 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Main grid container that mimics Category.jsx exactly
    main_grid: {
      id: 'main_grid',
      type: 'container',
      content: '',
      className: 'grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto',
      styles: {},
      parentId: 'main_container',
      position: { col: 1, row: 2 },
      layout: 'grid',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Left sidebar for filters (exactly like Category.jsx line 244-254)
    filters_sidebar: {
      id: 'filters_sidebar',
      type: 'container',
      content: '',
      className: 'lg:col-span-1',
      styles: {},
      parentId: 'main_grid',
      position: { col: 1, row: 1 },
      layout: 'block',
      colSpan: {
        grid: 3,   // 1 of 4 columns = 3 of 12
        list: 0    // Hidden in list view
      },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    // CMS Block above filters
    cms_above_filters: {
      id: 'cms_above_filters',
      type: 'text',
      content: '<!-- CMS Block: category_above_filters -->',
      className: 'w-fit mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'filters_sidebar',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12
      },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    // Filters component
    filters: {
      id: 'filters',
      type: 'container',
      content: '',
      className: 'category-filters bg-white rounded-lg shadow-sm border p-6',
      styles: {},
      parentId: 'filters_sidebar',
      position: { col: 1, row: 2 },
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

    filters_content: {
      id: 'filters_content',
      type: 'text',
      content: '<div class="space-y-6"><div><h4 class="font-medium text-gray-700 mb-2">Price Range</h4><div class="space-y-2"><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Under $25</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">$25 - $50</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">$50 - $100</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Over $100</span></label></div></div><div><h4 class="font-medium text-gray-700 mb-2">Brand</h4><div class="space-y-2"><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Apple</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Samsung</span></label><label class="flex items-center"><input type="checkbox" class="mr-2"><span class="text-sm">Google</span></label></div></div></div>',
      className: 'w-fit',
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

    // CMS Block below filters
    cms_below_filters: {
      id: 'cms_below_filters',
      type: 'text',
      content: '<!-- CMS Block: category_below_filters -->',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'filters_sidebar',
      position: { col: 1, row: 3 },
      colSpan: {
        grid: 12
      },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    // Main content area (exactly like Category.jsx line 256-299)
    content_area: {
      id: 'content_area',
      type: 'container',
      content: '',
      className: 'lg:col-span-3',
      styles: {},
      parentId: 'main_grid',
      position: { col: 2, row: 1 },
      layout: 'block',
      colSpan: {
        grid: 9,   // 3 of 4 columns = 9 of 12
        list: 12   // Full width when no sidebar
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // CMS Block above products
    cms_above_products: {
      id: 'cms_above_products',
      type: 'text',
      content: '<!-- CMS Block: category_above_products -->',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Products toolbar (sorting, view toggle, product count)
    products_toolbar: {
      id: 'products_toolbar',
      type: 'container',
      content: '',
      className: 'flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 2 },
      layout: 'flex',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Product count
    product_count: {
      id: 'product_count',
      type: 'text',
      content: '<p class="text-gray-600">Showing 3 products</p>',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'products_toolbar',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 6,
        list: 6
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Sort dropdown
    sort_dropdown: {
      id: 'sort_dropdown',
      type: 'text',
      content: '<div class="flex items-center space-x-2"><span class="text-sm text-gray-600">Sort by:</span><select class="border border-gray-300 rounded px-3 py-1 text-sm"><option>Relevance</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Newest First</option><option>Name A-Z</option></select></div>',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'products_toolbar',
      position: { col: 7, row: 1 },
      colSpan: {
        grid: 6,
        list: 6
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Products grid container (grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[400px])
    products: {
      id: 'products',
      type: 'container',
      content: '',
      className: 'category-products grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[400px]',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 3 },
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
      className: 'product-card bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 4,    // 1 of 3 columns
        list: 12    // Full width in list view
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_1_image: {
      id: 'product_1_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x300',
      className: 'aspect-square bg-gray-100 rounded-t-lg w-full object-cover',
      parentClassName: '',
      styles: {},
      parentId: 'product_1',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_1_content: {
      id: 'product_1_content',
      type: 'container',
      content: '',
      className: 'p-4',
      styles: {},
      parentId: 'product_1',
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 8
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
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
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
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
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
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_1_button: {
      id: 'product_1_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors',
      parentClassName: '',
      styles: {},
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2: {
      id: 'product_2',
      type: 'container',
      content: '',
      className: 'product-card bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 4,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2_image: {
      id: 'product_2_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x300',
      className: 'aspect-square bg-gray-100 rounded-t-lg w-full object-cover',
      parentClassName: '',
      styles: {},
      parentId: 'product_2',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2_content: {
      id: 'product_2_content',
      type: 'container',
      content: '',
      className: 'p-4',
      styles: {},
      parentId: 'product_2',
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 8
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
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
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
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
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
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_2_button: {
      id: 'product_2_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors',
      parentClassName: '',
      styles: {},
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3: {
      id: 'product_3',
      type: 'container',
      content: '',
      className: 'product-card bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 4,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3_image: {
      id: 'product_3_image',
      type: 'image',
      content: 'https://via.placeholder.com/300x300',
      className: 'aspect-square bg-gray-100 rounded-t-lg w-full object-cover',
      parentClassName: '',
      styles: {},
      parentId: 'product_3',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3_content: {
      id: 'product_3_content',
      type: 'container',
      content: '',
      className: 'p-4',
      styles: {},
      parentId: 'product_3',
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 8
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
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
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
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
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
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    product_3_button: {
      id: 'product_3_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors',
      parentClassName: '',
      styles: {},
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Pagination
    pagination: {
      id: 'pagination',
      type: 'container',
      content: '',
      className: 'flex justify-center mt-8 bg-white p-4 rounded-lg shadow-sm',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 4 },
      layout: 'flex',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    pagination_content: {
      id: 'pagination_content',
      type: 'text',
      content: '<div class="flex items-center space-x-2"><button class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button><button class="px-3 py-2 bg-blue-600 text-white rounded-md">1</button><button class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">2</button><button class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">3</button><span class="px-2 text-gray-500">...</span><button class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">10</button><button class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button></div>',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'pagination',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // CMS Block below products
    cms_below_products: {
      id: 'cms_below_products',
      type: 'text',
      content: '<!-- CMS Block: category_below_products -->',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'content_area',
      position: { col: 1, row: 5 },
      colSpan: {
        grid: 12,
        list: 12
      },
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

  // CMS blocks matching Category.jsx exactly
  cmsBlocks: [
    'category_above_filters',
    'category_below_filters',
    'category_above_products',
    'category_below_products'
  ]
};

export default categoryConfig;