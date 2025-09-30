import { Package } from 'lucide-react';

// Product Page Configuration with hierarchical support
export const productConfig = {
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
      component: 'BreadcrumbRenderer',
      content: '',
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
      className: 'content-area grid md:grid-cols-12 gap-8',
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

    // Product Gallery Section - Pure Handlebars/HTML No-Code Approach

    // PRODUCT GALLERY - Simplified dynamic layout
    product_gallery_container: {
      id: 'product_gallery_container',
      type: 'html',
      content: `
        {{#if (eq settings.product_gallery_layout "horizontal")}}
          <!-- HORIZONTAL LAYOUT -->
          <!-- Mobile: Respect mobile_gallery_layout setting, Desktop: Always flex-col -->
          {{#if (eq settings.mobile_gallery_layout "above")}}
            <div class="flex flex-col-reverse sm:flex-col gap-4 w-full items-start">
          {{else}}
            <div class="flex flex-col gap-4 w-full items-start">
          {{/if}}
            <!-- MAIN IMAGE FIRST - FULL WIDTH -->
            <div class="w-full relative">
              <div class="aspect-square bg-gray-50 rounded-lg overflow-hidden w-full relative">
                {{#if product.images}}
                  <img src="{{product.images.[0]}}" alt="{{product.name}}" class="w-full h-full object-cover" />
                {{else}}
                  <img src="https://placehold.co/600x600?text=Product" alt="Demo Product" class="w-full h-full object-cover" />
                {{/if}}

                <!-- PRODUCT LABELS -->
                {{#if productLabels}}
                  {{#each productLabels}}
                    <div class="label-{{position}} absolute z-10 px-2 py-1 text-xs font-bold rounded shadow-lg pointer-events-none" style="background-color: {{background_color}}; color: {{color}};">
                      {{text}}
                    </div>
                  {{/each}}
                {{else}}
                  <!-- Editor demo labels -->
                  <div class="absolute top-2 right-2 z-10 px-2 py-1 text-xs font-bold rounded shadow-lg" style="background-color: #dc2626; color: #ffffff;">
                    Sale
                  </div>
                  <div class="absolute top-2 left-2 z-10 px-2 py-1 text-xs font-bold rounded shadow-lg" style="background-color: #059669; color: #ffffff;">
                    New
                  </div>
                {{/if}}
                <style>
                  .label-top-left { top: 0.5rem; left: 0.5rem; }
                  .label-top-right { top: 0.5rem; right: 0.5rem; }
                  .label-top-center { top: 0.5rem; left: 50%; transform: translateX(-50%); }
                  .label-center-left { top: 50%; left: 0.5rem; transform: translateY(-50%); }
                  .label-center-right { top: 50%; right: 0.5rem; transform: translateY(-50%); }
                  .label-bottom-left { bottom: 0.5rem; left: 0.5rem; }
                  .label-bottom-right { bottom: 0.5rem; right: 0.5rem; }
                  .label-bottom-center { bottom: 0.5rem; left: 50%; transform: translateX(-50%); }
                </style>
              </div>
            </div>

            <!-- THUMBNAILS BELOW -->
            <div class="flex flex-row space-x-2 overflow-x-auto w-full">
              {{#if product.images}}
                {{#each product.images}}
                  {{#if @index < 10}}
                    <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                      <img src="{{this}}" alt="Thumbnail {{@index}}" class="w-full h-full object-cover" />
                    </button>
                  {{/if}}
                {{/each}}
              {{else}}
                <!-- Editor demo thumbnails -->
                <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                  <img src="https://placehold.co/100x100?text=1" alt="Demo 1" class="w-full h-full object-cover" />
                </button>
                <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                  <img src="https://placehold.co/100x100?text=2" alt="Demo 2" class="w-full h-full object-cover" />
                </button>
                <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                  <img src="https://placehold.co/100x100?text=3" alt="Demo 3" class="w-full h-full object-cover" />
                </button>
                <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                  <img src="https://placehold.co/100x100?text=4" alt="Demo 4" class="w-full h-full object-cover" />
                </button>
              {{/if}}
            </div>
          </div>
        {{else}}
          <!-- VERTICAL LAYOUT -->
          {{#if (eq settings.vertical_gallery_position "right")}}
            <!-- VERTICAL RIGHT: Main image left, thumbnails right -->
            <!-- Mobile: Respect mobile_gallery_layout setting, Desktop: Always sm:flex-row-reverse -->
            {{#if (eq settings.mobile_gallery_layout "above")}}
              <div class="flex flex-col-reverse sm:flex-row-reverse gap-4 w-full items-start">
            {{else}}
              <div class="flex flex-col sm:flex-row-reverse gap-4 w-full items-start">
            {{/if}}
              <!-- THUMBNAILS -->
              <div class="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 w-full sm:w-20 lg:w-24 flex-shrink-0 overflow-x-auto sm:overflow-x-visible">
                {{#if product.images}}
                  {{#each product.images}}
                    {{#if @index < 10}}
                      <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                        <img src="{{this}}" alt="Thumbnail {{@index}}" class="w-full h-full object-cover" />
                      </button>
                    {{/if}}
                  {{/each}}
                {{else}}
                  <!-- Editor demo thumbnails -->
                  <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <img src="https://placehold.co/100x100?text=1" alt="Demo 1" class="w-full h-full object-cover" />
                  </button>
                  <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <img src="https://placehold.co/100x100?text=2" alt="Demo 2" class="w-full h-full object-cover" />
                  </button>
                  <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <img src="https://placehold.co/100x100?text=3" alt="Demo 3" class="w-full h-full object-cover" />
                  </button>
                  <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <img src="https://placehold.co/100x100?text=4" alt="Demo 4" class="w-full h-full object-cover" />
                  </button>
                {{/if}}
              </div>

              <!-- MAIN IMAGE -->
              <div class="flex-1 relative min-w-0">
                <div class="aspect-square bg-gray-50 rounded-lg overflow-hidden w-full max-w-full relative">
                  {{#if product.images}}
                    <img src="{{product.images.[0]}}" alt="{{product.name}}" class="w-full h-full object-cover" />
                  {{else}}
                    <img src="https://placehold.co/600x600?text=Product" alt="Demo Product" class="w-full h-full object-cover" />
                  {{/if}}

                  <!-- PRODUCT LABELS -->
                  {{#if productLabels}}
                    {{#each productLabels}}
                      <div data-position="{{this.position}}" class="product-label-{{this.position}} absolute z-10 px-2 py-1 text-xs font-bold rounded shadow-lg pointer-events-none" style="background-color: {{this.background_color}}; color: {{#if this.color}}{{this.color}}{{else}}#FFFFFF{{/if}};">
                        {{this.text}}
                      </div>
                    {{/each}}
                  {{else}}
                    <!-- Editor demo labels -->
                    <div class="absolute top-2 right-2 z-10 px-2 py-1 text-xs font-bold rounded shadow-lg" style="background-color: #dc2626; color: #ffffff;">
                      Sale
                    </div>
                    <div class="absolute top-2 left-2 z-10 px-2 py-1 text-xs font-bold rounded shadow-lg" style="background-color: #059669; color: #ffffff;">
                      New
                    </div>
                  {{/if}}
                  <style>
                    .product-label-top-left { top: 0.5rem; left: 0.5rem; }
                    .product-label-top-right { top: 0.5rem; right: 0.5rem; }
                    .product-label-top-center { top: 0.5rem; left: 50%; transform: translateX(-50%); }
                    .product-label-center-left { top: 50%; left: 0.5rem; transform: translateY(-50%); }
                    .product-label-center-right { top: 50%; right: 0.5rem; transform: translateY(-50%); }
                    .product-label-bottom-left { bottom: 0.5rem; left: 0.5rem; }
                    .product-label-bottom-right { bottom: 0.5rem; right: 0.5rem; }
                    .product-label-bottom-center { bottom: 0.5rem; left: 50%; transform: translateX(-50%); }
                  </style>
                </div>
              </div>
            </div>
          {{else}}
            <!-- VERTICAL LEFT: Thumbnails left, main image right -->
            <!-- Mobile: Respect mobile_gallery_layout setting, Desktop: Always sm:flex-row -->
            {{#if (eq settings.mobile_gallery_layout "above")}}
              <div class="flex flex-col-reverse sm:flex-row gap-4 w-full items-start">
            {{else}}
              <div class="flex flex-col sm:flex-row gap-4 w-full items-start">
            {{/if}}
              <!-- THUMBNAILS -->
              <div class="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 w-full sm:w-20 lg:w-24 flex-shrink-0 overflow-x-auto sm:overflow-x-visible">
                {{#if product.images}}
                  {{#each product.images}}
                    {{#if @index < 10}}
                      <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                        <img src="{{this}}" alt="Thumbnail {{@index}}" class="w-full h-full object-cover" />
                      </button>
                    {{/if}}
                  {{/each}}
                {{else}}
                  <!-- Editor demo thumbnails -->
                  <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <img src="https://placehold.co/100x100?text=1" alt="Demo 1" class="w-full h-full object-cover" />
                  </button>
                  <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <img src="https://placehold.co/100x100?text=2" alt="Demo 2" class="w-full h-full object-cover" />
                  </button>
                  <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <img src="https://placehold.co/100x100?text=3" alt="Demo 3" class="w-full h-full object-cover" />
                  </button>
                  <button class="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <img src="https://placehold.co/100x100?text=4" alt="Demo 4" class="w-full h-full object-cover" />
                  </button>
                {{/if}}
              </div>

              <!-- MAIN IMAGE -->
              <div class="flex-1 relative min-w-0">
                <div class="aspect-square bg-gray-50 rounded-lg overflow-hidden w-full max-w-full relative">
                  {{#if product.images}}
                    <img src="{{product.images.[0]}}" alt="{{product.name}}" class="w-full h-full object-cover" />
                  {{else}}
                    <img src="https://placehold.co/600x600?text=Product" alt="Demo Product" class="w-full h-full object-cover" />
                  {{/if}}

                  <!-- PRODUCT LABELS -->
                  {{#if productLabels}}
                    {{#each productLabels}}
                      <div data-position="{{this.position}}" class="product-label-{{this.position}} absolute z-10 px-2 py-1 text-xs font-bold rounded shadow-lg pointer-events-none" style="background-color: {{this.background_color}}; color: {{#if this.color}}{{this.color}}{{else}}#FFFFFF{{/if}};">
                        {{this.text}}
                      </div>
                    {{/each}}
                  {{else}}
                    <!-- Editor demo labels -->
                    <div class="absolute top-2 right-2 z-10 px-2 py-1 text-xs font-bold rounded shadow-lg" style="background-color: #dc2626; color: #ffffff;">
                      Sale
                    </div>
                    <div class="absolute top-2 left-2 z-10 px-2 py-1 text-xs font-bold rounded shadow-lg" style="background-color: #059669; color: #ffffff;">
                      New
                    </div>
                  {{/if}}
                  <style>
                    .product-label-top-left { top: 0.5rem; left: 0.5rem; }
                    .product-label-top-right { top: 0.5rem; right: 0.5rem; }
                    .product-label-top-center { top: 0.5rem; left: 50%; transform: translateX(-50%); }
                    .product-label-center-left { top: 50%; left: 0.5rem; transform: translateY(-50%); }
                    .product-label-center-right { top: 50%; right: 0.5rem; transform: translateY(-50%); }
                    .product-label-bottom-left { bottom: 0.5rem; left: 0.5rem; }
                    .product-label-bottom-right { bottom: 0.5rem; right: 0.5rem; }
                    .product-label-bottom-center { bottom: 0.5rem; left: 50%; transform: translateX(-50%); }
                  </style>
                </div>
              </div>
            </div>
          {{/if}}
        {{/if}}`,
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
      metadata: { hierarchical: true }
    },

    // REMOVED: Now using single combined gallery container above

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
      className: 'w-fit text-3xl font-bold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 6 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: {
        hierarchical: true,
        htmlTag: 'h3',
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
      content: '{{#if product.compare_price}}{{product.compare_price_formatted}}{{else}}{{product.price_formatted}}{{/if}}',
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
      content: '{{#if product.compare_price}}{{product.price_formatted}}{{/if}}',
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
      position: { col: 1, row: 4 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    product_sku: {
      id: 'product_sku',
      type: 'text',
      content: '{{#if product.sku}}SKU: {{product.sku}}{{/if}}',
      className: 'w-fit text-3xl text-gray-600 italic font-bold',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 5 },
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
      className: 'w-fit text-gray-700 leading-relaxed bg-red-100',
      parentClassName: '',
      styles: {},
      parentId: 'info_container',
      position: { col: 1, row: 6 },
      colSpan: {
        default: 12
      },
      viewMode: ['default'],
      metadata: { hierarchical: true }
    },

    // Product labels now integrated directly into product_main_image above

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

    custom_options: {
      id: 'custom_options',
      type: 'component',
      component: 'CustomOptions',
      content: `
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-yellow-600">{{displayLabel}}</h3>
          <div class="space-y-3">
            {{#if customOptions}}
              {{#each customOptions}}
                <div
                  class="border rounded-lg p-4 cursor-pointer transition-all duration-200 {{#if this.isSelected}}border-purple-500 bg-purple-50 shadow-sm{{else}}border-purple-200 hover:border-purple-300 hover:shadow-sm{{/if}}"
                  data-option-id="{{this.id}}"
                  data-action="toggle-option"
                >
                  <div class="flex items-start space-x-3">
                    <div class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 {{#if this.isSelected}}border-purple-500 bg-purple-500{{else}}border-purple-300{{/if}}">
                      {{#if this.isSelected}}
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      {{/if}}
                    </div>

                    <div class="flex-1 flex items-start space-x-3">
                      {{#if this.images}}
                        <div class="flex-shrink-0">
                          <img src="{{this.images.[0]}}" alt="{{this.name}}" class="w-16 h-16 object-cover rounded-md" />
                        </div>
                      {{/if}}

                      <div class="flex-1">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <h4 class="text-red-600 font-medium">{{this.name}}</h4>
                            {{#if this.short_description}}
                              <p class="text-sm text-gray-600 mt-1">{{this.short_description}}</p>
                            {{/if}}
                          </div>
                          <div class="ml-4 flex-shrink-0">
                            {{#if this.hasSpecialPrice}}
                              <div class="text-right">
                                <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 border-blue-300">
                                  +{{this.displayPrice}}
                                </span>
                                <div class="text-xs text-gray-500 line-through mt-1">
                                  +{{this.originalPrice}}
                                </div>
                              </div>
                            {{else}}
                              <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold text-purple-800 {{#if this.isSelected}}bg-purple-600 text-white border-purple-600{{else}}bg-purple-100 border-purple-300{{/if}}">
                                +{{this.displayPrice}}
                              </span>
                            {{/if}}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {{/each}}
            {{else}}
              <!-- Editor preview -->
              <div class="border rounded-lg p-4 cursor-pointer">
                <div class="flex items-start space-x-3">
                  <div class="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5"></div>
                  <div class="flex-1">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900">Sample Custom Option</h4>
                        <p class="text-sm text-gray-600 mt-1">Optional product description</p>
                      </div>
                      <div class="ml-4 flex-shrink-0">
                        <span class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 border-blue-300">+$10.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {{/if}}
          </div>
        </div>
      `,
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
      content: `
        <div class="flex items-center space-x-2">
          <label for="quantity-input" class="font-bold text-sm text-red-600">Amount</label>
          <div class="flex items-center border rounded-lg overflow-hidden">
            <button class="p-2 hover:bg-gray-100 transition-colors" data-action="decrease">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <path d="M5 12h14"></path>
              </svg>
            </button>
            <input id="quantity-input" type="number" min="1" class="px-2 py-2 font-medium w-16 text-center border-x-0 outline-none focus:ring-0 focus:border-transparent" data-quantity-input />
            <button class="p-2 hover:bg-gray-100 transition-colors" data-action="increase">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
            </button>
          </div>
        </div>
      `,
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

    // Total Price Display - positioned above Add to Cart button
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
      type: 'html',
      content: `
        <button class="w-full h-12 text-lg bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap" data-add-to-cart>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mr-2 inline">
            <circle cx="8" cy="21" r="1"></circle>
            <circle cx="19" cy="21" r="1"></circle>
            <path d="m2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43h-15.44"></path>
          </svg>
          Add to Cart
        </button>
      `,
      className: 'add-to-cart-container',
      parentClassName: '',
      styles: {},
      parentId: 'buttons_container',
      position: { col: 1, row: 1 },
      colSpan: {},
      viewMode: ['default'],
      metadata: { hierarchical: true }
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
      content: `
        <div class="product-tabs w-full">
          <div class="tabs-list grid w-full grid-cols-1 md:grid-cols-auto border-b border-gray-200">
            {{#each tabs}}
              <button
                class="py-2 px-4 text-sm font-medium transition-colors {{#if this.isActive}}border-b-2 border-blue-500 text-blue-600{{else}}text-gray-600 hover:text-gray-900{{/if}}"
                data-action="switch-tab"
                data-tab-id="{{this.id}}">
                {{this.title}}
              </button>
            {{/each}}
          </div>

          <div class="tabs-content mt-6">
            {{#each tabs}}
              <div
                class="tab-content {{#unless this.isActive}}hidden{{/unless}}"
                data-tab-content="{{this.id}}">
                <div class="prose max-w-none text-gray-700 leading-relaxed">
                  {{#if (eq this.tab_type "text")}}
                    {{{this.content}}}
                  {{/if}}

                  {{#if (eq this.tab_type "description")}}
                    {{{../product.description}}}
                  {{/if}}

                  {{#if (eq this.tab_type "attributes")}}
                    {{#if ../product.attributes}}
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {{#each ../product.attributes}}
                          <div class="flex justify-between py-2 border-b border-gray-100">
                            <span class="font-medium capitalize">{{@key}}</span>
                            <span>{{this}}</span>
                          </div>
                        {{/each}}
                      </div>
                    {{else}}
                      <p class="text-gray-500">No specifications available for this product.</p>
                    {{/if}}
                  {{/if}}

                  {{#if (eq this.tab_type "attribute_sets")}}
                    <div class="space-y-6">
                      {{#if this.attribute_set_ids}}
                        {{#each this.attribute_set_ids}}
                          <div class="border-b border-gray-100 pb-4">
                            <h4 class="font-medium text-gray-900 mb-2">Attribute Set {{@index}}</h4>
                            <p class="text-gray-500">Attribute set content would be displayed here.</p>
                          </div>
                        {{/each}}
                      {{else}}
                        <p class="text-gray-500">No attribute sets configured for this tab.</p>
                      {{/if}}
                    </div>
                  {{/if}}
                </div>
              </div>
            {{/each}}
          </div>
        </div>
      `,
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