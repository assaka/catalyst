import { Grid, List, Package, Image, DollarSign, ShoppingCart } from 'lucide-react';

// Category Page Configuration - Slot-based layout with microslots
export const categoryConfig = {
  page_name: 'Category',
  slot_type: 'category_layout',

  // Main layout slots
  slots: {
    // Main header container for all header elements
    page_header: {
      id: 'page_header',
      type: 'container',
      content: '',
      className: 'w-full mb-8',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Breadcrumbs section
    // breadcrumbs: {
    //   id: 'breadcrumbs',
    //   type: 'container',
    //   content: '',
    //   className: 'w-full flex mb-6 items-center',
    //   parentClassName: '',
    //   styles: {},
    //   parentId: 'page_header',
    //   position: { col: 1, row: 1 },
    //   colSpan: { grid: 12, list: 12 },
    //   viewMode: ['grid', 'list'],
    //   metadata: { hierarchical: true }
    // },

    breadcrumbs_content: {
      id: 'breadcrumbs_content',
      type: 'breadcrumbs',
      content: '',
      className: 'flex items-center space-x-2 text-sm text-gray-600 mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'page_header',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'CategoryBreadcrumbs',
        displayName: 'Breadcrumb Navigation'
      }
    },

    // Category header section
    // category_header: {
    //   id: 'category_header',
    //   type: 'container',
    //   content: '',
    //   className: 'mb-4',
    //   parentClassName: '',
    //   styles: {},
    //   parentId: 'page_header',
    //   position: { col: 1, row: 2 },
    //   colSpan: { grid: 12, list: 12 },
    //   viewMode: ['grid', 'list'],
    //   metadata: { hierarchical: true }
    // },

    category_title: {
      id: 'category_title',
      type: 'text',
      content: 'Category Name',
      className: 'text-4xl font-bold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'page_header',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        displayName: 'Category Title'
      }
    },

    category_description: {
      id: 'category_description',
      type: 'text',
      content: 'Discover our amazing collection of products in this category. Browse through our curated selection and find exactly what you need.',
      className: 'text-gray-600 mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'page_header',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        displayName: 'Category Description'
      }
    },

    // Filters section
    filters_container: {
      id: 'filters_container',
      type: 'container',
      content: '',
      className: 'lg:col-span-1 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 2 },
      colSpan: { grid: 3, list: 12 },
      viewMode: ['grid'],
      metadata: { hierarchical: true }
    },

    // CMS blocks in filters
    filters_above_cms: {
      id: 'filters_above_cms',
      type: 'cms_block',
      content: '',
      className: 'mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_above_filters',
        displayName: 'CMS Block - Above Filters'
      }
    },

    // Layered Navigation (filters)
    layered_navigation: {
      id: 'layered_navigation',
      type: 'container',
      content: '',
      className: 'space-y-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: true,
        component: 'LayeredNavigation',
        displayName: 'Product Filters (Price, Brand, Size, etc.)'
      }
    },

    // LayeredNavigation Microslots
    filter_card_header: {
      id: 'filter_card_header',
      type: 'text',
      content: 'Filter By',
      className: 'text-lg font-semibold',
      parentClassName: '',
      styles: {},
      parentId: 'layered_navigation',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Filter By Title'
      }
    },

    filter_clear_all_button: {
      id: 'filter_clear_all_button',
      type: 'button',
      content: 'Clear All',
      className: 'text-xs border border-gray-300 hover:bg-gray-50 px-2 py-1 rounded',
      parentClassName: '',
      styles: {},
      parentId: 'layered_navigation',
      position: { col: 2, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Clear All Button'
      }
    },

    filter_active_filters: {
      id: 'filter_active_filters',
      type: 'container',
      content: '',
      className: 'mb-4 p-2',
      parentClassName: '',
      styles: {},
      parentId: 'layered_navigation',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Active Filters Container'
      }
    },

    filter_active_filters_label: {
      id: 'filter_active_filters_label',
      type: 'text',
      content: 'Active Filters:',
      className: 'text-sm font-medium text-gray-700 mr-2',
      parentClassName: '',
      styles: {},
      parentId: 'filter_active_filters',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Active Filters Label'
      }
    },

    filter_price_section: {
      id: 'filter_price_section',
      type: 'container',
      content: '',
      className: 'border-b border-gray-200 pb-4 mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'layered_navigation',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Price Filter Section'
      }
    },

    filter_price_title: {
      id: 'filter_price_title',
      type: 'text',
      content: 'Price',
      className: 'font-semibold text-base',
      parentClassName: '',
      styles: {},
      parentId: 'filter_price_section',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Price Filter Title'
      }
    },

    filter_attribute_section: {
      id: 'filter_attribute_section',
      type: 'container',
      content: '',
      className: 'space-y-4',
      parentClassName: '',
      styles: {},
      parentId: 'layered_navigation',
      position: { col: 1, row: 4 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Attribute Filters Section',
        isTemplate: true,
        repeatable: true
      }
    },

    filter_attribute_title: {
      id: 'filter_attribute_title',
      type: 'text',
      content: 'Brand',
      className: 'font-semibold text-base',
      parentClassName: '',
      styles: {},
      parentId: 'filter_attribute_section',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Attribute Filter Title',
        isTemplate: true
      }
    },

    filter_attribute_option: {
      id: 'filter_attribute_option',
      type: 'container',
      content: '',
      className: 'flex items-center justify-between py-1',
      parentClassName: '',
      styles: {},
      parentId: 'filter_attribute_section',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Attribute Filter Option',
        isTemplate: true,
        repeatable: true
      }
    },

    filter_option_checkbox: {
      id: 'filter_option_checkbox',
      type: 'checkbox',
      content: '',
      className: 'h-4 w-4 text-blue-600',
      parentClassName: '',
      styles: {},
      parentId: 'filter_attribute_option',
      position: { col: 1, row: 1 },
      colSpan: { grid: 6, list: 6 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Filter Option Checkbox',
        isTemplate: true
      }
    },

    filter_option_label: {
      id: 'filter_option_label',
      type: 'text',
      content: 'Apple',
      className: 'text-sm text-gray-700',
      parentClassName: '',
      styles: {},
      parentId: 'filter_attribute_option',
      position: { col: 2, row: 1 },
      colSpan: { grid: 4, list: 4 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Filter Option Label',
        isTemplate: true
      }
    },

    filter_option_count: {
      id: 'filter_option_count',
      type: 'text',
      content: '(12)',
      className: 'text-xs text-gray-400',
      parentClassName: '',
      styles: {},
      parentId: 'filter_attribute_option',
      position: { col: 3, row: 1 },
      colSpan: { grid: 2, list: 2 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Filter Option Count',
        isTemplate: true
      }
    },

    filters_below_cms: {
      id: 'filters_below_cms',
      type: 'cms_block',
      content: '',
      className: 'mt-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_below_filters',
        displayName: 'CMS Block - Below Filters'
      }
    },

    // Products section
    products_container: {
      id: 'products_container',
      type: 'container',
      content: '',
      className: 'lg:col-span-3',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 4, row: 2 },
      colSpan: { grid: 9, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // CMS blocks above products
    products_above_cms: {
      id: 'products_above_cms',
      type: 'cms_block',
      content: '',
      className: 'mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_above_products',
        displayName: 'CMS Block - Above Products'
      }
    },

    // Sorting controls and product count
    sorting_controls: {
      id: 'sorting_controls',
      type: 'container',
      content: '',
      className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Product count info
    product_count_info: {
      id: 'product_count_info',
      type: 'text',
      content: 'Showing 1-12 of 48 products',
      className: 'text-sm text-gray-600',
      parentClassName: '',
      styles: {},
      parentId: 'sorting_controls',
      position: { col: 1, row: 1 },
      colSpan: { grid: 6, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'ProductCountInfo'
      }
    },

    // Sort selector
    sort_selector: {
      id: 'sort_selector',
      type: 'select',
      content: '',
      className: 'flex items-center gap-2',
      parentClassName: '',
      styles: {},
      parentId: 'sorting_controls',
      position: { col: 7, row: 1 },
      colSpan: { grid: 6, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'SortSelector'
      }
    },

    // Active filters display (at top of sidebar below Filter By)
    active_filters: {
      id: 'active_filters',
      type: 'active_filters',
      content: '',
      className: 'mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid'],
      metadata: {
        hierarchical: false,
        component: 'ActiveFilters'
      }
    },

    // Main products display using ProductItemCard component
    product_item_card: {
      id: 'product_item_card',
      type: 'container',
      content: '',
      className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'ProductItemCard',
        displayName: 'Product Grid',
        itemsToShow: 12
      }
    },


    // Product Item Cards - Alternative product display
    // product_item_card: {
    //   id: 'product_item_card',
    //   type: 'container',
    //   content: '',
    //   className: 'mb-8',
    //   parentClassName: '',
    //   styles: {},
    //   parentId: 'products_container',
    //   position: { col: 1, row: 4 },
    //   colSpan: { grid: 12, list: 12 },
    //   viewMode: ['grid', 'list'],
    //   metadata: {
    //     hierarchical: false,
    //     component: 'ProductItemCard',
    //     displayName: 'Product Item Cards',
    //     itemsToShow: 3
    //   }
    // },


    // Products grid (alternative layout - kept for flexibility)
    products_grid: {
      id: 'products_grid',
      type: 'container',
      content: '',
      className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 4 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // Single product template with microslots
    product_template: {
      id: 'product_template',
      type: 'container',
      content: '',
      className: 'group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow',
      parentClassName: '',
      styles: {},
      parentId: 'products_grid',
      position: { col: 1, row: 1 },
      colSpan: { grid: 4, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: true,
        isTemplate: true,
        repeatable: true
      }
    },

    // Product microslots
    product_image_container: {
      id: 'product_image_container',
      type: 'container',
      content: '',
      className: 'relative overflow-hidden',
      parentClassName: '',
      styles: {},
      parentId: 'product_template',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 4 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true, microslot: true }
    },

    product_image: {
      id: 'product_image',
      type: 'image',
      content: '',
      className: 'w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105',
      parentClassName: '',
      styles: {},
      parentId: 'product_image_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    product_labels: {
      id: 'product_labels',
      type: 'container',
      content: '',
      className: 'absolute top-2 left-2 z-10 flex flex-col gap-1',
      parentClassName: '',
      styles: {},
      parentId: 'product_image_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true, microslot: true, overlay: true }
    },

    product_content: {
      id: 'product_content',
      type: 'container',
      content: '',
      className: 'p-4 space-y-3',
      parentClassName: '',
      styles: {},
      parentId: 'product_template',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 8 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true, microslot: true }
    },

    product_name: {
      id: 'product_name',
      type: 'text',
      content: 'Sample Product Name',
      className: 'font-semibold text-lg truncate',
      parentClassName: '',
      styles: {},
      parentId: 'product_content',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    product_price_container: {
      id: 'product_price_container',
      type: 'container',
      content: '',
      className: 'flex items-baseline gap-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_content',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true, microslot: true }
    },

    product_price: {
      id: 'product_price',
      type: 'text',
      content: '$29.99',
      className: 'text-lg font-bold text-green-600',
      parentClassName: '',
      styles: {},
      parentId: 'product_price_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 6, list: 6 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    product_compare_price: {
      id: 'product_compare_price',
      type: 'text',
      content: '$39.99',
      className: 'text-sm text-gray-500 line-through',
      parentClassName: '',
      styles: {},
      parentId: 'product_price_container',
      position: { col: 7, row: 1 },
      colSpan: { grid: 6, list: 6 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    product_add_to_cart: {
      id: 'product_add_to_cart',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full bg-blue-600 text-white border-0 hover:bg-blue-700 transition-colors duration-200 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2',
      parentClassName: '',
      styles: {},
      parentId: 'product_content',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: false, microslot: true }
    },

    // Pagination
    pagination_container: {
      id: 'pagination_container',
      type: 'pagination',
      content: '',
      className: 'flex justify-center mt-8',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 5 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'PaginationComponent'
      }
    },

    // CMS blocks below products
    products_below_cms: {
      id: 'products_below_cms',
      type: 'cms_block',
      content: '',
      className: 'mt-8',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 6 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_below_products',
        displayName: 'CMS Block - Below Products'
      }
    }
  },

  // View configuration
  views: [
    { id: 'grid', label: 'Grid View', icon: Grid },
    { id: 'list', label: 'List View', icon: List }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    'category_header',
    'category_above_filters',
    'category_below_filters',
    'category_above_products',
    'category_below_products',
    'category_footer'
  ],

  // Microslot definitions for category and product components
  microslots: {
    breadcrumbs_content: {
      type: 'breadcrumbs',
      editable: true,
      dataBinding: 'category.breadcrumbs',
      categoryBinding: 'category'
    },
    category_title: {
      type: 'text',
      editable: true,
      dataBinding: 'category.name',
      fallback: 'Category Name'
    },
    product_image: {
      type: 'image',
      editable: true,
      dataBinding: 'product.images[0]',
      altBinding: 'product.name'
    },
    product_name: {
      type: 'text',
      editable: true,
      dataBinding: 'product.name',
      linkBinding: 'product.url'
    },
    product_price: {
      type: 'price',
      editable: true,
      dataBinding: 'product.price',
      formatBinding: 'formatDisplayPrice'
    },
    product_compare_price: {
      type: 'price',
      editable: true,
      dataBinding: 'product.compare_price',
      conditionalDisplay: 'product.compare_price > product.price'
    },
    product_add_to_cart: {
      type: 'button',
      editable: true,
      actionBinding: 'addToCart',
      conditionalDisplay: 'product.in_stock'
    }
  }
};

export default categoryConfig;