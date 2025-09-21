import { Grid, FileText } from 'lucide-react';

// Category Page Configuration with hierarchical support (matching cart-config.js structure)
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',

  // Slot configuration with hierarchical structure (matching cart-config.js format)
  slots: {
    // Main layout container
    main_layout: {
      id: 'main_layout',
      type: 'grid',
      content: '',
      className: 'category-main-layout',
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

    // Header section
    header: {
      id: 'header',
      type: 'container',
      content: '<h1>Category Name</h1>',
      className: 'category-header',
      styles: { gridColumn: '1 / -1', gridRow: '1' },
      parentId: 'main_layout',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Breadcrumbs navigation
    breadcrumbs: {
      id: 'breadcrumbs',
      type: 'container',
      content: '<nav>Home > Category</nav>',
      className: 'category-breadcrumbs',
      styles: { gridColumn: '1 / -1', gridRow: '2' },
      parentId: 'main_layout',
      position: { col: 1, row: 2 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Content area with filters and products
    content_area: {
      id: 'content_area',
      type: 'grid',
      content: '',
      className: 'category-content',
      styles: { gridColumn: '1 / -1', gridRow: '3', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' },
      parentId: 'main_layout',
      position: { col: 1, row: 3 },
      layout: 'grid',
      gridCols: 2,
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Filters sidebar
    filters: {
      id: 'filters',
      type: 'container',
      content: '',
      className: 'category-filters',
      styles: { gridColumn: '1', gridRow: '1' },
      parentId: 'content_area',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 1,
        list: 1
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Products area container
    products_area: {
      id: 'products_area',
      type: 'container',
      content: '',
      className: 'category-products-area',
      styles: { gridColumn: '2', gridRow: '1' },
      parentId: 'content_area',
      position: { col: 2, row: 1 },
      layout: 'flex',
      colSpan: {
        grid: 1,
        list: 1
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Sorting controls
    sorting: {
      id: 'sorting',
      type: 'container',
      content: '',
      className: 'category-sorting',
      styles: {},
      parentId: 'products_area',
      position: { col: 1, row: 1 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Products grid/list
    products: {
      id: 'products',
      type: 'container',
      content: '',
      className: 'category-products',
      styles: {},
      parentId: 'products_area',
      position: { col: 1, row: 2 },
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
      className: 'category-pagination',
      styles: {},
      parentId: 'products_area',
      position: { col: 1, row: 3 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // SEO content (optional)
    seoContent: {
      id: 'seoContent',
      type: 'container',
      content: '<div class="seo-content">Category description...</div>',
      className: 'category-seo',
      styles: { gridColumn: '1 / -1', gridRow: '4' },
      parentId: 'main_layout',
      position: { col: 1, row: 4 },
      colSpan: {
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    }
  },

  // CMS block positions
  cmsBlocks: [
    'category_header',
    'category_above_products',
    'category_below_products',
    'category_sidebar',
    'category_footer'
  ],

  // View configuration (for compatibility)
  title: 'Category Layout Editor',
  defaultView: 'grid',
  views: [
    { id: 'grid', label: 'Grid View', icon: Grid },
    { id: 'list', label: 'List View', icon: FileText }
  ],
  defaultSlots: ['main_layout', 'header', 'breadcrumbs', 'content_area', 'filters', 'products_area', 'sorting', 'products', 'pagination']
};

export default categoryConfig;