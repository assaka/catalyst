import { ShoppingCart, Package } from 'lucide-react';

// Cart Page Configuration with hierarchical support
export const cartConfig = {
  page_name: 'Cart',
  slot_type: 'cart_layout',
  
  
  
  // Slot configuration with content, styling and metadata (slot_configurations format)
  slots: {
    // Hierarchical structure defined via parentId and children properties
    // Main containers with parent-child relationships
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

    // Header slot
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
    
    // Empty cart hierarchical structure
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
    
    // Cart items using component
    cart_items: {
      id: 'cart_items',
      type: 'component',
      component: 'CartItemsSlot',
      content: `
        <div class="space-y-4 divide-y">
          {{#each cartItems}}
            <div class="cart-item py-4"
                 data-item-id="{{this.id}}"
                 data-product-name="{{this.product.name}}"
                 data-price="{{this.price}}"
                 data-quantity="{{this.quantity}}">

              <div class="grid grid-cols-12 gap-4">
                <!-- Product Image -->
                <div class="col-span-12 sm:col-span-2">
                  <div class="w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                    <img src="{{this.product.image_url}}" alt="{{this.product.name}}" class="w-full h-full object-cover" />
                  </div>
                </div>

                <!-- Product Details -->
                <div class="col-span-12 sm:col-span-6">
                  <h3 class="text-lg font-medium text-gray-900">{{this.product.name}}</h3>

                  <div class="mt-1 text-sm text-gray-600">
                    {{this.price}} × {{this.quantity}}
                  </div>

                  <!-- Selected Options -->
                  {{#if this.selected_options}}
                    <div class="mt-2 space-y-1 selected-options-container" data-selected-options="true">
                      <!-- Options will be rendered by JavaScript -->
                    </div>
                  {{/if}}

                  <!-- Quantity Controls -->
                  <div class="flex items-center space-x-2 mt-4">
                    <button class="h-8 w-8 border rounded flex items-center justify-center hover:bg-gray-100"
                            data-action="decrease-quantity" data-item-id="{{this.id}}">−</button>
                    <span class="w-12 text-center font-medium">{{this.quantity}}</span>
                    <button class="h-8 w-8 border rounded flex items-center justify-center hover:bg-gray-100"
                            data-action="increase-quantity" data-item-id="{{this.id}}">+</button>
                  </div>
                </div>

                <!-- Price and Remove -->
                <div class="col-span-12 sm:col-span-4 flex flex-col items-end justify-between">
                  <span class="text-lg font-bold text-green-600 item-total" data-item-total="true">
                    $0.00
                  </span>
                  <button class="text-red-600 hover:text-red-800 flex items-center space-x-1"
                          data-action="remove-item" data-item-id="{{this.id}}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    <span>{{t "common.remove"}}</span>
                  </button>
                </div>
              </div>
            </div>
          {{/each}}
        </div>
      `,
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
    
    // Coupon section using functional component
    coupon_section: {
      id: 'coupon_section',
      type: 'component',
      component: 'CartCouponSlot',
      content: `
          <h3 class="text-lg font-semibold mb-4">{{t "common.apply_coupon"}}</h3>

          <!-- Applied Coupon Section (hidden by default) -->
          <div data-applied-coupon-section style="display: none;">
            <div class="bg-green-50 p-3 rounded">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-sm font-medium text-green-800" data-coupon-name></p>
                  <p class="text-xs text-green-600" data-coupon-discount></p>

                  <!-- Collapsible Discount Details -->
                  <div class="mt-2">
                    <div class="flex items-center gap-2 cursor-pointer hover:bg-green-100 py-1 px-2 rounded -mx-2" data-discount-toggle>
                      <span class="text-xs text-green-700 font-medium">{{t "discount.view_eligible_products"}}</span>
                      <svg class="h-3 w-3 text-green-600 transition-transform duration-200" data-discount-chevron fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transform: rotate(0deg);">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                    <div class="hidden mt-2 ml-2 text-sm text-green-800" data-discount-details>
                      <ul class="space-y-1" data-eligible-products></ul>
                    </div>
                  </div>
                </div>
                <button class="text-red-600 hover:text-red-700 ml-2" data-action="remove-coupon">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Input Section (shown by default) -->
          <div data-coupon-input-section class="flex space-x-2">
            <input
              type="text"
              placeholder="{{t "common.enter_coupon_code"}}"
              class="w-1/2 border rounded px-3 py-2"
              data-coupon-input
            />
            <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded whitespace-nowrap" data-action="apply-coupon">
              {{t "common.apply"}}
            </button>
          </div>
      `,
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

    // Order summary using functional component
    order_summary: {
      id: 'order_summary',
      type: 'component',
      component: 'CartOrderSummarySlot',
      content: `
        <div class="mt-4">
          <h3 class="text-lg font-semibold mb-4">{{t "common.order_summary"}}</h3>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>{{t "common.subtotal"}}</span>
              <span data-subtotal>$0.00</span>
            </div>
            <div class="flex justify-between" data-custom-options-row style="display: none;">
              <span>{{t "common.additional_products"}}</span>
              <span data-custom-options-total>$0.00</span>
            </div>
            <div class="flex justify-between" data-discount-row style="display: none;">
              <span data-discount-label>{{t "common.discount"}}</span>
              <span data-discount class="text-green-600">$0.00</span>
            </div>
            <div class="flex justify-between">
              <span>{{t "common.tax"}}</span>
              <span data-tax>$0.00</span>
            </div>
            <div class="border-t pt-2 flex justify-between text-lg font-semibold">
              <span>{{t "common.total"}}</span>
              <span data-total>$0.00</span>
            </div>
          </div>
          <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded mt-4 transition-colors" data-action="checkout">
            {{t "common.proceed_now"}}
          </button>
        </div>
      `,
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
    },
  },
  
  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'cart'
  },
  
  // View configuration
  views: [
    { id: 'emptyCart', label: 'Empty Cart', icon: ShoppingCart },
    { id: 'withProducts', label: 'With Products', icon: Package }
  ],
  
  // CMS blocks for additional content areas
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

export default cartConfig;