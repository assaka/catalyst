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

    breadcrumbs_content: {
      id: 'breadcrumbs_content',
      type: 'component',
      component: 'CategoryBreadcrumbs',
      content: '',
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'page_header',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        displayName: 'Breadcrumb Navigation',
        // All breadcrumb styling - edit these colors!
        itemTextColor: '#22C55E',      // green for parent category links
        itemHoverColor: '#16A34A',     // darker green on hover
        activeItemColor: '#DC2626',    // red for current category
        separatorColor: '#9CA3AF',     // gray for separators
        fontSize: '0.875rem',
        fontWeight: '700'              // bold
      }
    },

    category_title: {
      id: 'category_title',
      type: 'text',
      content: '{{category.name}}',
      className: 'w-fit text-4xl font-bold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'page_header',
      position: { col: 1, row: 2 },
      colSpan: {
        default: 12,
        grid: 12,
        list: 12
      },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: true,
        htmlTag: 'h1',
        htmlAttributes: {
          'data-category-title': ''
        }
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

    // Products section
    products_container: {
      id: 'products_container',
      type: 'container',
      content: '',
      className: 'ml-6',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 4, row: 2 },
      colSpan: { grid: 9, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
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
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // CMS blocks above products
    products_above_cms: {
      id: 'products_above_cms',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: 'mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_above_products',
        displayName: 'CMS Block - Above Products',
        props: {
          position: 'category_above_products'
        }
      }
    },

    // Product count info
    product_count_info: {
      id: 'product_count_info',
      type: 'component',
      component: 'ProductCountInfo',
      content: `
        <div class="text-sm text-blue-600 font-bold">
          Hamid {{pagination.start}}-{{pagination.end}} of {{pagination.total}} products
        </div>
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'sorting_controls',
      position: { col: 1, row: 1 },
      colSpan: { grid: 6, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: true,
        component: 'ProductCountInfo',
        displayName: 'Product Count Display'
      }
    },

    // Product count text configuration
    product_count_text: {
      id: 'product_count_text',
      type: 'text',
      content: 'Hamid {{pagination.start}}-{{pagination.end}} of {{pagination.total}} products',
      className: 'text-sm text-blue-600 font-bold',
      parentClassName: '',
      styles: {
        fontSize: '0.875rem', // text-sm
        color: '#2563EB', // blue-600
        fontWeight: '700' // bold
      },
      parentId: 'product_count_info',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Product Count Text',
        customizable: ['content', 'fontSize', 'color', 'fontWeight']
      }
    },

    // Sort selector
    sort_selector: {
      id: 'sort_selector',
      type: 'component',
      component: 'SortSelector',
      content: `
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-700 font-medium">Sort by:</label>
          <select class="border border-gray-300 rounded px-3 py-1.5 text-sm"
                  data-action="change-sort">
            <option value="position" {{#if (eq sorting.current "position")}}selected{{/if}}>Position</option>
            <option value="name_asc" {{#if (eq sorting.current "name_asc")}}selected{{/if}}>Name (A-Z)</option>
            <option value="name_desc" {{#if (eq sorting.current "name_desc")}}selected{{/if}}>Name (Z-A)</option>
            <option value="price_asc" {{#if (eq sorting.current "price_asc")}}selected{{/if}}>Price (Low to High)</option>
            <option value="price_desc" {{#if (eq sorting.current "price_desc")}}selected{{/if}}>Price (High to Low)</option>
            <option value="created_desc" {{#if (eq sorting.current "created_desc")}}selected{{/if}}>Newest First</option>
          </select>
        </div>
      `,
      className: '',
      parentClassName: 'text-right',
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

    // Active filters display (below Filter Now heading)
    active_filters: {
      id: 'active_filters',
      type: 'component',
      component: 'ActiveFilters',
      content: `
        {{#if activeFilters.length}}
          <div class="mb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Active Filters</h4>
            <div class="flex flex-wrap gap-2">
              {{#each activeFilters}}
                <div class="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span>{{this.label}}: {{this.value}}</span>
                  <button class="ml-1 hover:text-blue-900"
                          data-action="remove-filter"
                          data-filter-type="{{this.type}}"
                          data-filter-value="{{this.value}}"
                          data-attribute-code="{{this.attributeCode}}">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              {{/each}}
            </div>
            <div class="mt-2">
              <button class="text-sm text-red-600 hover:text-red-800 underline"
                      data-action="clear-all-filters">
                Clear All
              </button>
            </div>
          </div>
        {{/if}}
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 2.5 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'ActiveFilters',
        displayName: 'Active Filters Display'
      }
    },

    // Active filter tag styling
    active_filter_tag_styles: {
      id: 'active_filter_tag_styles',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        backgroundColor: '#DBEAFE', // Default blue-100
        textColor: '#1E40AF', // Default blue-800
        hoverColor: '#1E3A8A', // Default blue-900
        borderRadius: '9999px', // Full rounded
        fontSize: '0.875rem', // text-sm
        padding: '0.25rem 0.75rem' // py-1 px-3
      },
      parentId: 'active_filters',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Active Filter Tag Styling',
        labelType: 'styling',
        customizable: ['backgroundColor', 'textColor', 'hoverColor', 'borderRadius', 'fontSize', 'padding']
      }
    },

    // Clear all button styling
    clear_all_button_styles: {
      id: 'clear_all_button_styles',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        textColor: '#DC2626', // Default red-600
        hoverColor: '#991B1B', // Default red-800
        fontSize: '0.875rem', // text-sm
        fontWeight: 'normal'
      },
      parentId: 'active_filters',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Clear All Button Styling',
        labelType: 'styling',
        customizable: ['textColor', 'hoverColor', 'fontSize', 'fontWeight']
      }
    },

    // Main products display using HTML template with processVariables

    /*
      ============================================
      AI EDITING INSTRUCTIONS FOR BUTTON COLORS
      ============================================

      This template uses dynamic button colors from theme settings.

      BUTTON COLOR MAPPINGS:
      - Add to Cart button → settings.theme.add_to_cart_button_color
      - View Cart button → settings.theme.view_cart_button_color
      - Checkout button → settings.theme.checkout_button_color
      - Place Order button → settings.theme.place_order_button_color

      TO CHANGE A BUTTON COLOR:
      1. Update the corresponding database setting (e.g., settings.theme.add_to_cart_button_color = '#ff0000')
      2. Keep the template variable in the HTML (e.g., style="background-color: {{settings.theme.add_to_cart_button_color}};")
      3. DO NOT hardcode colors like style="background-color: #ff0000;" - this breaks global theme control

      This ensures users can change all button colors from Admin > Store > Theme & Layout.
      ============================================
    */

    product_items: {
      id: 'product_items',
      type: 'component',
      component: 'ProductItemsGrid',
      content: `{{#each products}}
            <div class="group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow p-4 product-card"
                 data-product-id="{{this.id}}"
                 data-product-name="{{this.name}}"
                 data-product-price="{{this.price}}">

              <!-- Product Image -->
              <div class="relative overflow-hidden mb-4">
                <a href="{{this.url}}" class="block">
                  <img src="{{this.image_url}}"
                       alt="{{this.name}}"
                       class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" />
                </a>

                <!-- Product Labels -->
                {{#if this.labels}}
                  <div class="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    {{#each this.labels}}
                      <span class="px-2 py-1 text-xs font-semibold rounded {{this.className}}">
                        {{this.text}}
                      </span>
                    {{/each}}
                  </div>
                {{/if}}
              </div>

              <!-- Product Name -->
              <a href="{{this.url}}" class="block">
                <h3 class="font-semibold text-lg truncate mb-2 text-red-600">{{this.name}}</h3>
              </a>

              <!-- Price Container -->
              <div class="flex items-baseline gap-2 mb-4">
                <!-- Main price (sale price if compare_price exists, otherwise regular) -->
                <span class="text-lg font-bold text-red-600">
                  {{this.price_formatted}}
                </span>
                <!-- Original price with strikethrough (only shown when compare_price exists) -->
                <span class="text-sm text-gray-500 line-through">
                  {{this.compare_price_formatted}}
                </span>
              </div>

              <!-- Add to Cart Button -->
              <!-- AI INSTRUCTION: To change this button color, update the database setting: settings.theme.add_to_cart_button_color -->
              <!-- DO NOT hardcode colors here - always use the template variable {{settings.theme.add_to_cart_button_color}} -->
              <!-- This ensures the color can be changed globally from Admin > Store > Theme & Layout -->
              {{#if this.in_stock}}
                <button class="w-full text-white border-0 transition-colors duration-200 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
                        style="background-color: {{settings.theme.add_to_cart_button_color}};"
                        data-action="add-to-cart"
                        data-product-id="{{this.id}}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  Add to Cart
                </button>
              {{else}}
                <button class="w-full bg-gray-400 text-white cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium" disabled>
                  Out of Stock
                </button>
              {{/if}}
            </div>
          {{/each}}
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: true,
        displayName: 'Product Items Grid',
        description: 'Product grid using HTML template with processVariables'
      }
    },

    // CMS blocks below products
    products_below_cms: {
      id: 'products_below_cms',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: 'mt-8',
      parentClassName: '',
      styles: {},
      parentId: 'products_container',
      position: { col: 1, row: 4 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_below_products',
        displayName: 'CMS Block - Below Products',
        props: {
          position: 'category_below_products'
        }
      }
    },

    // Pagination
    pagination_container: {
      id: 'pagination_container',
      type: 'component',
      component: 'PaginationComponent',
      content: `
        {{#if pagination.totalPages}}
          <div class="flex justify-center mt-8">
            <nav class="flex items-center gap-1">
              <!-- Previous Button -->
              <button class="px-3 py-2 border rounded hover:bg-gray-50 {{#unless pagination.hasPrev}}opacity-50 cursor-not-allowed{{/unless}}"
                      data-action="go-to-page"
                      data-page="{{pagination.prevPage}}"
                      {{#unless pagination.hasPrev}}disabled{{/unless}}>
                Previous
              </button>

              <!-- Page Numbers -->
              {{#each pagination.pages}}
                {{#if this.isEllipsis}}
                  <span class="px-3 py-2">...</span>
                {{else}}
                  <button class="px-3 py-2 border rounded {{#if this.isCurrent}}bg-blue-600 text-white{{else}}hover:bg-gray-50{{/if}}"
                          data-action="go-to-page"
                          data-page="{{this.number}}"
                          {{#if this.isCurrent}}disabled{{/if}}>
                    {{this.number}}
                  </button>
                {{/if}}
              {{/each}}

              <!-- Next Button -->
              <button class="px-3 py-2 border rounded hover:bg-gray-50 {{#unless pagination.hasNext}}opacity-50 cursor-not-allowed{{/unless}}"
                      data-action="go-to-page"
                      data-page="{{pagination.nextPage}}"
                      {{#unless pagination.hasNext}}disabled{{/unless}}>
                Next
              </button>
            </nav>
          </div>
        {{/if}}
      `,
      className: '',
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

    // Filters section
    filters_container: {
      id: 'filters_container',
      type: 'container',
      content: '',
      className: 'lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto',
      parentClassName: '',
      styles: {},
      parentId: null,
      position: { col: 1, row: 2 },
      colSpan: { grid: 3, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: { hierarchical: true }
    },

    // CMS blocks in filters
    filters_above_cms: {
      id: 'filters_above_cms',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: 'mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_above_filters',
        displayName: 'CMS Block - Above Filters',
        props: {
          position: 'category_above_filters'
        }
      }
    },

    // Filter heading - separate from layered navigation
    filter_heading: {
      id: 'filter_heading',
      type: 'text',
      content: 'Filter Now',
      className: 'text-lg font-semibold text-gray-900 mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        htmlTag: 'h3',
        displayName: 'Filter Heading'
      }
    },

    // Simplified Layered Navigation - Filter options only (no heading)
    layered_navigation: {
      id: 'layered_navigation',
      type: 'component',
      component: 'LayeredNavigation',
      content: `
        <div class="space-y-3">
          <!-- Price Filter Slider -->
          {{#if filters.price.min}}
            <div class="border-b border-gray-200 pb-2" data-filter-section="price">
              <button class="w-full flex items-center justify-between font-semibold text-base text-gray-900 mb-3"
                      data-action="toggle-filter-section"
                      data-section="price">
                <span>Price</span>
                <svg class="w-5 h-5 transform transition-transform filter-chevron {{#unless settings.collapse_filters}}rotate-180{{/unless}}"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>_label
              </button>
              <div class="filter-content px-2 {{#unless settings.collapse_filters}}block{{/unless}}"
                   style="{{#if settings.collapse_filters}}display: none;{{/if}}">
                <div class="flex justify-between items-center mb-4 text-sm">
                  <span class="text-gray-700 font-medium">€<span id="selected-min">{{filters.price.min}}</span></span>
                  <span class="text-gray-400">-</span>
                  <span class="text-gray-700 font-medium">€<span id="selected-max">{{filters.price.max}}</span></span>
                </div>
                <div class="relative h-2 mb-2">
                  <div class="absolute w-full h-2 bg-gray-200 rounded-lg"></div>
                  <div id="price-range-track" class="absolute h-2 bg-blue-500 rounded-lg" style="left: 0%; width: 100%;"></div>
                  <input type="range"
                         id="price-slider-min"
                         min="{{filters.price.min}}"
                         max="{{filters.price.max}}"
                         value="{{filters.price.min}}"
                         class="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer"
                         style="z-index: 3;"
                         data-action="price-slider"
                         data-slider-type="min" />
                  <input type="range"
                         id="price-slider-max"
                         min="{{filters.price.min}}"
                         max="{{filters.price.max}}"
                         value="{{filters.price.max}}"
                         class="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer"
                         style="z-index: 4;"
                         data-action="price-slider"
                         data-slider-type="max" />
                </div>
                <style>
                  input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  }
                </style>
              </div>
            </div>
          {{/if}}

          <!-- Attribute Filters (Brand, Color, Size, Material, etc.) -->
          {{#each filters.attributes}}
            <div class="border-b border-gray-200 pb-2" data-filter-section="{{this.code}}">
              <button class="w-full flex items-center justify-between font-semibold text-base text-gray-900 mb-3"
                      data-action="toggle-filter-section"
                      data-section="{{this.code}}">
                <span>{{this.label}}</span>
                <svg class="w-5 h-5 transform transition-transform filter-chevron {{#unless settings.collapse_filters}}rotate-180{{/unless}}"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div class="filter-content space-y-2 max-h-48 overflow-y-auto {{#unless settings.collapse_filters}}block{{/unless}}"
                   style="{{#if settings.collapse_filters}}display: none;{{/if}}"
                   data-max-visible="{{settings.max_visible_attributes}}"
                   data-attribute-code="{{this.code}}">
                {{#each this.options}}
                  <label class="flex items-center gap-2 cursor-pointer hover:text-gray-900 filter-option"
                         data-option-index="{{@index}}">
                    <input type="checkbox"
                           class="rounded border-gray-300 text-blue-600"
                           data-action="toggle-filter"
                           data-filter-type="attribute"
                           data-attribute-code="{{this.attributeCode}}"
                           data-filter-value="{{this.value}}"
                           {{#if this.active}}checked{{/if}} />
                    <span class="text-gray-700">{{this.label}}</span>
                    <span class="text-gray-400 text-sm ml-auto">({{this.count}})</span>
                  </label>
                {{/each}}
                <button class="text-sm text-blue-600 hover:text-blue-800 mt-2 show-more-btn hidden"
                        data-action="toggle-show-more"
                        data-attribute-code="{{this.code}}">
                  Show More
                </button>
              </div>
            </div>
          {{/each}}
        </div>
      `,
      className: '',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        component: 'LayeredNavigation',
        displayName: 'Product Filters (Price, Brand, Size, etc.)'
      }
    },

    // Editable labels for layered navigation with color customization
    filter_by_label: {
      id: 'filter_by_label',
      type: 'text',
      content: 'Filter Now',
      className: 'text-lg font-semibold text-gray-900',
      parentClassName: '',
      styles: {
        color: '#1F2937' // Default dark gray
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Filter By Label',
        labelType: 'header',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    price_filter_label: {
      id: 'price_filter_label',
      type: 'text',
      content: 'Price',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Price Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    // Shared attribute filter label for all attribute filters (Brand, Color, Size, Material)
    attribute_filter_label: {
      id: 'attribute_filter_label',
      type: 'text',
      content: 'Attribute Filter',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'All Attribute Filter Labels (Brand, Color, Size, Material)',
        labelType: 'attribute_shared',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    brand_filter_label: {
      id: 'brand_filter_label',
      type: 'text',
      content: 'Brand',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 4 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Brand Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    color_filter_label: {
      id: 'color_filter_label',
      type: 'text',
      content: 'Color',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 5 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Color Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    size_filter_label: {
      id: 'size_filter_label',
      type: 'text',
      content: 'Size',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 6 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Size Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    material_filter_label: {
      id: 'material_filter_label',
      type: 'text',
      content: 'Material',
      className: 'font-semibold text-base text-gray-900',
      parentClassName: '',
      styles: {
        color: '#374151' // Default gray-700
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 7 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Material Filter Label',
        labelType: 'attribute',
        customizable: ['color', 'fontSize', 'fontWeight']
      }
    },

    // Customizable filter option styles
    filter_option_styles: {
      id: 'filter_option_styles',
      type: 'style_config',
      content: '',
      className: '',
      parentClassName: '',
      styles: {
        optionTextColor: '#374151', // Default gray-700 for option text
        optionHoverColor: '#1F2937', // Default gray-800 for hover
        optionCountColor: '#9CA3AF', // Default gray-400 for count
        checkboxColor: '#3B82F6', // Default blue-500 for checkbox
        activeFilterBgColor: '#DBEAFE', // Default blue-100 for active filter background
        activeFilterTextColor: '#1E40AF' // Default blue-800 for active filter text
      },
      parentId: 'layered_navigation',
      position: { col: 1, row: 8 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Filter Options Styling',
        labelType: 'styling',
        customizable: ['optionTextColor', 'optionHoverColor', 'optionCountColor', 'checkboxColor', 'activeFilterBgColor', 'activeFilterTextColor']
      }
    },

    filters_below_cms: {
      id: 'filters_below_cms',
      type: 'component',
      component: 'CmsBlockRenderer',
      content: '',
      className: 'mt-6',
      parentClassName: '',
      styles: {},
      parentId: 'filters_container',
      position: { col: 1, row: 4 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        cmsPosition: 'category_below_filters',
        displayName: 'CMS Block - Below Filters',
        props: {
          position: 'category_below_filters'
        }
      }
    },

    // Product Element Style Controls (for editor)
    product_name_style: {
      id: 'product_name_style',
      type: 'text',
      content: 'Product Name',
      className: 'font-semibold text-lg text-red-600',
      parentClassName: '',
      styles: {
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#DC2626'
      },
      parentId: 'product_items',
      position: { col: 1, row: 1 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Product Name Style',
        editableProperties: ['fontSize', 'fontWeight', 'color']
      }
    },

    product_price_style: {
      id: 'product_price_style',
      type: 'text',
      content: '$99.99',
      className: 'text-lg font-bold text-red-600',
      parentClassName: '',
      styles: {
        fontSize: '1.125rem',
        fontWeight: '700',
        color: '#DC2626'
      },
      parentId: 'product_items',
      position: { col: 1, row: 2 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Product Price Style',
        editableProperties: ['fontSize', 'fontWeight', 'color']
      }
    },

    product_add_to_cart_style: {
      id: 'product_add_to_cart_style',
      type: 'button',
      content: 'Add to Cart',
      className: 'w-full text-white px-4 py-2 rounded-md text-sm font-medium',
      parentClassName: '',
      styles: {
        fontSize: '0.875rem',
        fontWeight: '500',
        backgroundColor: '#3B82F6',
        color: '#FFFFFF',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem'
      },
      parentId: 'product_items',
      position: { col: 1, row: 3 },
      colSpan: { grid: 12, list: 12 },
      viewMode: ['grid', 'list'],
      metadata: {
        hierarchical: false,
        microslot: true,
        displayName: 'Add to Cart Button Style',
        editableProperties: ['fontSize', 'fontWeight', 'backgroundColor', 'color', 'borderRadius', 'padding']
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