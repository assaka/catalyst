import { Grid, List } from 'lucide-react';

// Category Page Configuration - EXACT Category.jsx layout structure
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',

  // Slot configuration matching EXACT Category.jsx structure (lines 224-300)
  slots: {
    // Line 235-241: Header section with breadcrumb, title, description
    breadcrumbs: {
      id: 'breadcrumbs',
      type: 'text',
      content: '',
      className: 'flex items-center space-x-1 text-sm text-gray-500 mb-6',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    header: {
      id: 'header',
      type: 'text',
      content: '',
      className: 'text-4xl font-bold',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 2 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    header_description: {
      id: 'header_description',
      type: 'text',
      content: '',
      className: 'text-gray-600 mt-2',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 3 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    // Line 245-253: Filters sidebar (lg:col-span-1) - matches LayeredNavigation component
    filters: {
      id: 'filters',
      type: 'container',
      content: '',
      className: 'category-filters',
      styles: {},
      parentId: null,
      position: { col: 1, row: 4 },
      layout: 'block',
      colSpan: {
        grid: 3,   // lg:col-span-1 = 3 of 12
        list: 3    // Still visible in list view
      },
      viewMode: ['grid', 'list'],  // Show in both views
      metadata: { hierarchical: false }
    },

    // LayeredNavigation Card structure
    filters_card: {
      id: 'filters_card',
      type: 'container',
      content: '',
      className: 'rounded-lg border bg-card text-card-foreground shadow-sm',
      styles: {},
      parentId: 'filters',
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    // Card Header with "Filter By" title
    filters_header: {
      id: 'filters_header',
      type: 'container',
      content: '',
      className: 'flex flex-col space-y-1.5 p-6',
      styles: {},
      parentId: 'filters_card',
      layout: 'block',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    filters_title: {
      id: 'filters_title',
      type: 'text',
      content: '<h3 class="text-2xl font-semibold leading-none tracking-tight">Filter By</h3>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'filters_header',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    // Card Content with accordion filters - more compact
    filters_content: {
      id: 'filters_content',
      type: 'text',
      content: '<div class="p-6 pt-0"><div class="space-y-3"><div class="pb-3"><h4 class="font-semibold mb-2 text-sm">Price</h4><div class="space-y-1"><input type="range" class="w-full h-1" min="0" max="1000" /><div class="flex justify-between text-xs text-gray-600"><span>$0</span><span>$1000</span></div></div></div><div class="pb-3 border-t pt-3"><h4 class="font-semibold mb-2 text-sm">Brand</h4><div class="space-y-1"><label class="flex items-center text-sm"><input type="checkbox" class="mr-2 h-3 w-3"><span>Apple</span></label><label class="flex items-center text-sm"><input type="checkbox" class="mr-2 h-3 w-3"><span>Samsung</span></label></div></div></div></div>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'filters_card',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    // Sorting and Results Info Bar
    products_toolbar: {
      id: 'products_toolbar',
      type: 'container',
      content: '',
      className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4',
      styles: {},
      parentId: null,
      position: { col: 4, row: 4 },
      layout: 'flex',
      colSpan: {
        grid: 9,
        list: 9
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    products_count: {
      id: 'products_count',
      type: 'text',
      content: '<div class="text-sm text-gray-600">Showing 1-3 of 3 products</div>',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'products_toolbar',
      colSpan: {
        grid: 6,
        list: 6
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    sort_dropdown: {
      id: 'sort_dropdown',
      type: 'text',
      content: '<div class="flex items-center gap-2"><span class="text-sm text-gray-600">Sort by:</span><select class="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"><option>Name (A-Z)</option><option>Name (Z-A)</option><option>Price (Low to High)</option><option>Price (High to Low)</option><option>Newest First</option><option>Oldest First</option></select></div>',
      className: 'w-fit',
      parentClassName: '',
      styles: {},
      parentId: 'products_toolbar',
      colSpan: {
        grid: 6,
        list: 6
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    // Line 273: Products grid (lg:col-span-3)
    products: {
      id: 'products',
      type: 'container',
      content: '',
      className: 'category-products grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[400px]',
      styles: {},
      parentId: null,
      position: { col: 4, row: 5 },
      layout: 'grid',
      gridCols: 3,  // Specify 3 columns for the products grid
      colSpan: {
        grid: 9,   // lg:col-span-3 = 9 of 12
        list: 9   // Full width in list view
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    // Product Card 1 - matches ProductCard component structure
    product_1: {
      id: 'product_1',
      type: 'container',
      content: '',
      className: 'group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 1,    // Takes 1 column in the 3-column products grid
        list: 12    // Full width in list view
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_image: {
      id: 'product_1_image',
      type: 'image',
      content: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      className: 'w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105',
      parentClassName: '',
      styles: {},
      parentId: 'product_1',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
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
      metadata: { hierarchical: false }
    },

    product_1_name: {
      id: 'product_1_name',
      type: 'text',
      content: '<h3 class="font-semibold text-lg truncate mt-1">Wireless Headphones</h3>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_price: {
      id: 'product_1_price',
      type: 'text',
      content: '<div class="space-y-3 mt-4"><div class="flex items-baseline gap-2"><p class="font-bold text-xl text-gray-900">$199.99</p></div></div>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_1_button: {
      id: 'product_1_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full text-white border-0 hover:brightness-90 transition-all duration-200 px-4 py-2 rounded-md text-sm font-medium',
      styles: { backgroundColor: '#3B82F6' },
      parentId: 'product_1_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2: {
      id: 'product_2',
      type: 'container',
      content: '',
      className: 'group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 1,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_image: {
      id: 'product_2_image',
      type: 'image',
      content: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
      className: 'w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105',
      parentClassName: '',
      styles: {},
      parentId: 'product_2',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
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
      metadata: { hierarchical: false }
    },

    product_2_name: {
      id: 'product_2_name',
      type: 'text',
      content: '<h3 class="font-semibold text-lg truncate mt-1">Smartphone</h3>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_price: {
      id: 'product_2_price',
      type: 'text',
      content: '<div class="space-y-3 mt-4"><div class="flex items-baseline gap-2"><p class="font-bold text-xl text-gray-900">$799.99</p></div></div>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_2_button: {
      id: 'product_2_button',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full text-white border-0 hover:brightness-90 transition-all duration-200 px-4 py-2 rounded-md text-sm font-medium',
      styles: { backgroundColor: '#3B82F6' },
      parentClassName: '',
      parentId: 'product_2_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3: {
      id: 'product_3',
      type: 'container',
      content: '',
      className: 'bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow',
      styles: {},
      parentId: 'products',
      layout: 'block',
      colSpan: {
        grid: 1,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_image: {
      id: 'product_3_image',
      type: 'image',
      content: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
      className: 'aspect-square bg-gray-100 rounded-t-lg w-full object-cover',
      parentClassName: '',
      styles: {},
      parentId: 'product_3',
      colSpan: {
        grid: 12,
        list: 4
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
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
      metadata: { hierarchical: false }
    },

    product_3_name: {
      id: 'product_3_name',
      type: 'text',
      content: 'Tablet',
      className: 'text-lg font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_description: {
      id: 'product_3_description',
      type: 'text',
      content: 'Portable tablet perfect for work and entertainment',
      className: 'text-gray-600 text-sm mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    product_3_price: {
      id: 'product_3_price',
      type: 'text',
      content: '$299.99',
      className: 'text-xl font-bold text-gray-900 mb-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_3_content',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
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
      metadata: { hierarchical: false }
    },
    // Pagination Controls
    pagination: {
      id: 'pagination',
      type: 'container',
      content: '',
      className: 'flex justify-center items-center mt-8 gap-2',
      styles: {},
      parentId: null,
      position: { col: 4, row: 6 },
      layout: 'flex',
      colSpan: {
        grid: 9,
        list: 9
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
    },

    pagination_content: {
      id: 'pagination_content',
      type: 'text',
      content: '<div class="flex justify-center items-center gap-2"><button class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50" disabled><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>Previous</button><div class="flex items-center gap-1"><button class="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white">1</button><button class="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50">2</button><button class="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50">3</button></div><button class="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50">Next<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button></div>',
      className: 'w-full',
      parentClassName: '',
      styles: {},
      parentId: 'pagination',
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false }
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

  // CMS blocks matching Category.jsx exactly (lines 246, 252, 257, 297)
  cmsBlocks: [
    'category_above_filters',
    'category_below_filters',
    'category_above_products',
    'category_below_products'
  ]
};

export default categoryConfig;