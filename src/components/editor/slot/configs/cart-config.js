import { ShoppingCart, Package } from 'lucide-react';

// Cart Page Configuration - Single source of truth with complete slot_configurations format
export const cartConfig = {
  page_name: 'Cart',
  slot_type: 'cart_layout',
  majorSlots: ['flashMessage', 'header', 'emptyCart', 'cartItem', 'coupon', 'orderSummary', 'recommendations', 'empty'],
  
  // Micro-slot definitions - Complete structure for all cart slots
  microSlotDefinitions: {
    flashMessage: {
      id: 'flashMessage',
      name: 'Flash Message',
      microSlots: ['flashMessage.content', 'flashMessage.message'],
      gridCols: 12,
      defaultSpans: {
        'flashMessage.content': { col: 12, row: 1 },
        'flashMessage.message': { col: 12, row: 1 }
      }
    },
    header: {
      id: 'header',
      name: 'Page Header',
      microSlots: ['header.title'],
      gridCols: 12,
      defaultSpans: {
        'header.title': { col: 12, row: 1 }
      }
    },
    emptyCart: {
      id: 'emptyCart',
      name: 'Empty Cart',
      microSlots: ['emptyCart.icon', 'emptyCart.title', 'emptyCart.text', 'emptyCart.button'],
      gridCols: 12,
      defaultSpans: {
        'emptyCart.icon': { col: 2, row: 1 },
        'emptyCart.title': { col: 10, row: 1 },
        'emptyCart.text': { col: 12, row: 1 },
        'emptyCart.button': { col: 12, row: 1 }
      }
    },
    cartItem: {
      id: 'cartItem',
      name: 'Cart Item',
      microSlots: ['cartItem.productImage', 'cartItem.productTitle', 'cartItem.quantityControl', 'cartItem.productPrice', 'cartItem.removeButton'],
      gridCols: 12,
      defaultSpans: {
        'cartItem.productImage': { col: 2, row: 2 },
        'cartItem.productTitle': { col: 6, row: 1 },
        'cartItem.quantityControl': { col: 2, row: 1 },
        'cartItem.productPrice': { col: 2, row: 1 },
        'cartItem.removeButton': { col: 12, row: 1 }
      }
    },
    coupon: {
      id: 'coupon',
      name: 'Coupon Section',
      microSlots: ['coupon.title', 'coupon.input', 'coupon.button', 'coupon.message', 'coupon.appliedCoupon'],
      gridCols: 12,
      defaultSpans: {
        'coupon.title': { col: 12, row: 1 },
        'coupon.input': { col: 8, row: 1 },
        'coupon.button': { col: 4, row: 1 },
        'coupon.message': { col: 12, row: 1 },
        'coupon.appliedCoupon': { col: 12, row: 1 }
      }
    },
    orderSummary: {
      id: 'orderSummary',
      name: 'Order Summary',
      microSlots: ['orderSummary.title', 'orderSummary.subtotal', 'orderSummary.discount', 'orderSummary.shipping', 'orderSummary.tax', 'orderSummary.total', 'orderSummary.checkoutButton'],
      gridCols: 12,
      defaultSpans: {
        'orderSummary.title': { col: 12, row: 1 },
        'orderSummary.subtotal': { col: 12, row: 1 },
        'orderSummary.discount': { col: 12, row: 1 },
        'orderSummary.shipping': { col: 12, row: 1 },
        'orderSummary.tax': { col: 12, row: 1 },
        'orderSummary.total': { col: 12, row: 1 },
        'orderSummary.checkoutButton': { col: 12, row: 1 }
      }
    },
    recommendations: {
      id: 'recommendations',
      name: 'Product Recommendations',
      microSlots: ['recommendations.title', 'recommendations.products'],
      gridCols: 12,
      defaultSpans: {
        'recommendations.title': { col: 12, row: 1 },
        'recommendations.products': { col: 12, row: 3 }
      }
    },
    empty: {
      id: 'empty',
      name: 'Empty Slot',
      microSlots: ['empty.content'],
      gridCols: 12,
      defaultSpans: {
        'empty.content': { col: 12, row: 2 }
      }
    }
  },
  
  // Slot configuration with content, styling and metadata (slot_configurations format)
  slots: {
    // Flash Message Slots
    'flashMessage.content': {
      content: `<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-yellow-800">Product Removed</h3>
      <p class="text-sm text-yellow-700">Nike Air Max 90 has been removed from your cart.</p>
    </div>
  </div>
</div>`,
      className: 'mb-4',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'flashMessage',
        description: 'Flash message content for notifications'
      }
    },
    'flashMessage.message': {
      content: 'Cart updated successfully!',
      className: 'text-sm text-blue-700',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'flashMessage',
        description: 'Flash message text content'
      }
    },
    
    // Header Slots
    'header.title': {
      content: 'My Cart',
      className: 'text-2xl font-bold text-gray-800',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'header',
        description: 'Main page title'
      }
    },
    
    // Empty Cart Slots
    'emptyCart.icon': {
      content: '🛒',
      className: 'text-6xl text-gray-400',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'emptyCart',
        description: 'Empty cart icon'
      }
    },
    'emptyCart.title': {
      content: 'Your cart is empty',
      className: 'text-xl font-bold text-gray-600',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'emptyCart',
        description: 'Empty cart title'
      }
    },
    'emptyCart.text': {
      content: "Looks like you haven't added anything to your cart yet.",
      className: 'text-gray-500 mb-4',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'emptyCart',
        description: 'Empty cart description text'
      }
    },
    'emptyCart.button': {
      content: 'Continue Shopping',
      className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'emptyCart',
        description: 'Continue shopping button'
      }
    },
    
    // Cart Item Slots (consistent naming with CartSlotsEditor)
    'cartItem.productImage': {
      content: 'Product Image',
      className: 'w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Product image placeholder'
      }
    },
    'cartItem.productTitle': {
      content: 'Product Name',
      className: 'font-semibold text-gray-900',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Product name/title'
      }
    },
    'cartItem.productPrice': {
      content: '$29.99',
      className: 'font-bold text-gray-900',
      parentClassName: 'text-right',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Product price'
      }
    },
    'cartItem.quantityControl': {
      content: '1',
      className: 'flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded',
      parentClassName: 'text-center',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Quantity control buttons'
      }
    },
    'cartItem.removeButton': {
      content: 'Remove',
      className: 'text-red-500 hover:text-red-700 text-sm',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'cartItem',
        description: 'Remove item button'
      }
    },
    
    // Coupon Slots
    'coupon.title': {
      content: 'Apply Coupon',
      className: 'text-lg font-bold text-gray-800',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Coupon section title'
      }
    },
    'coupon.input': {
      content: 'Enter coupon code',
      className: 'flex-1 px-3 py-2 border rounded bg-white text-gray-700',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Coupon input field'
      }
    },
    'coupon.button': {
      content: 'Apply',
      className: 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Apply coupon button'
      }
    },
    'coupon.message': {
      content: '',
      className: 'text-sm mt-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Coupon status/error message'
      }
    },
    'coupon.appliedCoupon': {
      content: '',
      className: 'bg-green-50 border border-green-200 rounded p-3',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'coupon',
        description: 'Applied coupon display'
      }
    },
    
    // Order Summary Slots
    'orderSummary.title': {
      content: 'Order Summary',
      className: 'text-lg font-bold text-gray-800 mb-4',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Order summary title'
      }
    },
    'orderSummary.subtotal': {
      content: 'Subtotal: $59.98',
      className: 'flex justify-between text-gray-600 mb-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Order subtotal line'
      }
    },
    'orderSummary.discount': {
      content: 'Discount: -$5.00',
      className: 'flex justify-between text-green-600 mb-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Discount amount line'
      }
    },
    'orderSummary.shipping': {
      content: 'Shipping: $9.99',
      className: 'flex justify-between text-gray-600 mb-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Shipping cost line'
      }
    },
    'orderSummary.tax': {
      content: 'Tax: $4.80',
      className: 'flex justify-between text-gray-600 mb-2',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Tax amount line'
      }
    },
    'orderSummary.total': {
      content: 'Total: $59.98',
      className: 'flex justify-between font-bold text-lg text-gray-900 border-t pt-4',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Order total line'
      }
    },
    'orderSummary.checkoutButton': {
      content: 'Proceed to Checkout',
      className: 'w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'orderSummary',
        description: 'Checkout button'
      }
    },
    
    // Recommendations Slots
    'recommendations.title': {
      content: 'You might also like',
      className: 'text-xl font-semibold mb-4',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'recommendations',
        description: 'Recommendations section title'
      }
    },
    'recommendations.products': {
      content: `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>`,
      className: '',
      parentClassName: '',
      styles: {},
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'recommendations',
        description: 'Product recommendations grid'
      }
    },
    
    // Empty Slots
    'empty.content': {
      content: '<div class="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 bg-gray-50"><p>This is an empty slot. Click to edit and add your custom content.</p></div>',
      className: 'empty-slot-content',
      parentClassName: 'empty-slot-wrapper',
      styles: {
        minHeight: '120px'
      },
      metadata: {
        lastModified: new Date().toISOString(),
        slotType: 'empty',
        description: 'Customizable empty slot for any content'
      }
    }
  },
  
  // Custom slots (empty by default)
  customSlots: {},
  
  // Component sizes configuration
  componentSizes: {},
  
  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'cart'
  },
  
  // View configuration
  views: [
    { id: 'empty', label: 'Empty Cart', icon: ShoppingCart },
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