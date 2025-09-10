import { ShoppingCart, Package } from 'lucide-react';

// Component code templates for micro-slots - HTML templates for each component
const MICRO_SLOT_TEMPLATES = {
  'flashMessage.content': `<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
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
  'emptyCart.icon': `🛒`,
  'emptyCart.title': `Your cart is empty`,
  'emptyCart.text': `Looks like you haven't added anything to your cart yet.`,
  'emptyCart.button': `Continue Shopping`,
  'header.title': `My Cart`,
  'cartItem.productImage': `Product Image`,
  'cartItem.productTitle': `Product Name`,
  'cartItem.quantityControl': `1`,
  'cartItem.productPrice': `$29.99`,
  'cartItem.removeButton': `Remove`,
  'coupon.title': `Apply Coupon`,
  'coupon.input': `Enter coupon code`,
  'coupon.button': `Apply`,
  'coupon.applied': `Applied: SAVE20`,
  'coupon.removeButton': `Remove`,
  'orderSummary.title': `Order Summary`,
  'orderSummary.subtotal': `Subtotal: $59.98`,
  'orderSummary.discount': `Discount: -$10.00`,
  'orderSummary.tax': `Tax: $4.80`,
  'orderSummary.shipping': `Shipping: Free`,
  'orderSummary.total': `Total: $54.78`,
  'orderSummary.checkoutButton': `Proceed to Checkout`,
  'recommendations.title': `You might also like`,
  'recommendations.products': ``
};

// Saved configuration from database - default styling and content
const SAVED_CART_CONFIG = {
  "configuration": "{\"slots\": {\"coupon.input\": {\"styles\": {}, \"content\": \"Enter coupon code\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"flex-1 px-3 py-2 border rounded bg-white text-gray-700\", \"parentClassName\": \"\"}, \"coupon.title\": {\"styles\": {}, \"content\": \"Apply Coupon\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"text-lg font-bold text-gray-800\", \"parentClassName\": \"\"}, \"header.title\": {\"styles\": {}, \"content\": \"My Cart\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.668Z\"}, \"className\": \"text-2xl font-bold text-gray-800\", \"parentClassName\": \"text-center\"}, \"coupon.button\": {\"styles\": {}, \"content\": \"Apply\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium\", \"parentClassName\": \"\"}, \"emptyCart.icon\": {\"styles\": {}, \"content\": \"🛒\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"text-6xl text-gray-400\", \"parentClassName\": \"text-center\"}, \"emptyCart.text\": {\"styles\": {}, \"content\": \"Looks like you haven't added anything to your cart yet.\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"text-gray-500 mb-4\", \"parentClassName\": \"text-center\"}, \"emptyCart.title\": {\"styles\": {}, \"content\": \"Your cart is empty\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"text-xl font-bold text-gray-600\", \"parentClassName\": \"text-center\"}, \"emptyCart.button\": {\"styles\": {}, \"content\": \"Continue Shopping\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold\", \"parentClassName\": \"text-center\"}, \"orderSummary.title\": {\"styles\": {}, \"content\": \"Order Summary\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"text-lg font-bold text-gray-800 mb-4\", \"parentClassName\": \"\"}, \"orderSummary.total\": {\"styles\": {}, \"content\": \"Total: $59.98\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"flex justify-between font-bold text-lg text-gray-900 border-t pt-4\", \"parentClassName\": \"\"}, \"cartItem.productImage\": {\"styles\": {}, \"content\": \"Product Image\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500\", \"parentClassName\": \"\"}, \"cartItem.productPrice\": {\"styles\": {}, \"content\": \"$29.99\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"font-bold text-gray-900\", \"parentClassName\": \"text-right\"}, \"cartItem.productTitle\": {\"styles\": {}, \"content\": \"Product Name\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"font-semibold text-gray-900\", \"parentClassName\": \"\"}, \"cartItem.removeButton\": {\"styles\": {}, \"content\": \"Remove\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"text-red-500 hover:text-red-700 text-sm\", \"parentClassName\": \"\"}, \"orderSummary.subtotal\": {\"styles\": {}, \"content\": \"Subtotal: $59.98\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"flex justify-between text-gray-600 mb-2\", \"parentClassName\": \"\"}, \"cartItem.quantityControl\": {\"styles\": {}, \"content\": \"1\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded\", \"parentClassName\": \"text-center\"}, \"orderSummary.checkoutButton\": {\"styles\": {}, \"content\": \"Proceed to Checkout\", \"metadata\": {\"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"className\": \"w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold\", \"parentClassName\": \"\"}}, \"metadata\": {\"created\": \"2025-09-10T04:29:27.669Z\", \"lastModified\": \"2025-09-10T04:29:27.669Z\"}, \"page_name\": \"Cart\", \"majorSlots\": [\"header\", \"emptyCart\", \"cartItems\"], \"customSlots\": {}, \"componentSizes\": {}, \"microSlotSpans\": {\"coupon\": {\"coupon.input\": {\"col\": 8, \"row\": 1}, \"coupon.title\": {\"col\": 12, \"row\": 1}, \"coupon.button\": {\"col\": 4, \"row\": 1}, \"coupon.message\": {\"col\": 12, \"row\": 1}, \"coupon.appliedCoupon\": {\"col\": 12, \"row\": 1}}, \"header\": {\"header.title\": {\"col\": 12, \"row\": 1}}, \"cartItem\": {\"cartItem.productImage\": {\"col\": 2, \"row\": 2}, \"cartItem.productPrice\": {\"col\": 2, \"row\": 1}, \"cartItem.productTitle\": {\"col\": 6, \"row\": 1}, \"cartItem.removeButton\": {\"col\": 12, \"row\": 1}, \"cartItem.quantityControl\": {\"col\": 2, \"row\": 1}}, \"emptyCart\": {\"emptyCart.icon\": {\"col\": 2, \"row\": 1}, \"emptyCart.text\": {\"col\": 12, \"row\": 1}, \"emptyCart.title\": {\"col\": 10, \"row\": 1}, \"emptyCart.button\": {\"col\": 12, \"row\": 1}}, \"flashMessage\": {\"flashMessage.message\": {\"col\": 12, \"row\": 1}}, \"orderSummary\": {\"orderSummary.tax\": {\"col\": 12, \"row\": 1}, \"orderSummary.title\": {\"col\": 12, \"row\": 1}, \"orderSummary.total\": {\"col\": 12, \"row\": 1}, \"orderSummary.discount\": {\"col\": 12, \"row\": 1}, \"orderSummary.shipping\": {\"col\": 12, \"row\": 1}, \"orderSummary.subtotal\": {\"col\": 12, \"row\": 1}, \"orderSummary.checkoutButton\": {\"col\": 12, \"row\": 1}}, \"recommendations\": {\"recommendations.title\": {\"col\": 12, \"row\": 1}, \"recommendations.products\": {\"col\": 12, \"row\": 3}}}, \"microSlotOrders\": {\"coupon\": [\"coupon.title\", \"coupon.input\", \"coupon.button\", \"coupon.message\", \"coupon.appliedCoupon\"], \"header\": [\"header.title\"], \"cartItem\": [\"cartItem.productImage\", \"cartItem.productTitle\", \"cartItem.quantityControl\", \"cartItem.productPrice\", \"cartItem.removeButton\"], \"emptyCart\": [\"emptyCart.icon\", \"emptyCart.title\", \"emptyCart.text\", \"emptyCart.button\"], \"flashMessage\": [\"flashMessage.message\"], \"orderSummary\": [\"orderSummary.title\", \"orderSummary.subtotal\", \"orderSummary.discount\", \"orderSummary.shipping\", \"orderSummary.tax\", \"orderSummary.total\", \"orderSummary.checkoutButton\"], \"recommendations\": [\"recommendations.title\", \"recommendations.products\"]}}"
};

// Micro-slot definitions for cart page - extracted from CartSlotsEditor
const MICRO_SLOT_DEFINITIONS = {
  flashMessage: {
    id: 'flashMessage',
    name: 'Flash Message',
    microSlots: ['flashMessage.content'],
    gridCols: 12,
    defaultSpans: {
      'flashMessage.content': { col: 12, row: 1 }
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
  header: {
    id: 'header',
    name: 'Page Header',
    microSlots: ['header.title'],
    gridCols: 12,
    defaultSpans: {
      'header.title': { col: 12, row: 1 }
    }
  },
  cartItem: {
    id: 'cartItem',
    name: 'Cart Item',
    microSlots: ['cartItem.image', 'cartItem.details', 'cartItem.quantity', 'cartItem.price', 'cartItem.remove'],
    gridCols: 12,
    defaultSpans: {
      'cartItem.image': { col: 2, row: 2 },
      'cartItem.details': { col: 4, row: 2 },
      'cartItem.quantity': { col: 3, row: 1 },
      'cartItem.price': { col: 2, row: 1 },
      'cartItem.remove': { col: 1, row: 1 }
    }
  },
  coupon: {
    id: 'coupon',
    name: 'Coupon Section',
    microSlots: ['coupon.title', 'coupon.input', 'coupon.button', 'coupon.applied', 'coupon.removeButton'],
    gridCols: 12,
    defaultSpans: {
      'coupon.title': { col: 12, row: 1 },
      'coupon.input': { col: 8, row: 1 },
      'coupon.button': { col: 4, row: 1 },
      'coupon.applied': { col: 8, row: 1 },
      'coupon.removeButton': { col: 4, row: 1 }
    }
  },
  orderSummary: {
    id: 'orderSummary',
    name: 'Order Summary',
    microSlots: ['orderSummary.title', 'orderSummary.subtotal', 'orderSummary.tax', 'orderSummary.shipping', 'orderSummary.discount', 'orderSummary.total', 'orderSummary.checkout'],
    gridCols: 12,
    defaultSpans: {
      'orderSummary.title': { col: 12, row: 1 },
      'orderSummary.subtotal': { col: 12, row: 1 },
      'orderSummary.tax': { col: 12, row: 1 },
      'orderSummary.shipping': { col: 12, row: 1 },
      'orderSummary.discount': { col: 12, row: 1 },
      'orderSummary.total': { col: 12, row: 1 },
      'orderSummary.checkout': { col: 12, row: 1 }
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
  }
};

// Cart Page Configuration
export const cartConfig = {
  title: 'Cart Layout Editor',
  defaultView: 'empty',
  views: [
    { id: 'empty', label: 'Empty Cart', icon: ShoppingCart },
    { id: 'withProducts', label: 'With Products', icon: Package }
  ],
  defaultSlots: ['flashMessage', 'header', 'emptyCart', 'cartItem', 'coupon', 'orderSummary'],
  microSlotDefinitions: MICRO_SLOT_DEFINITIONS,
  slots: {
    flashMessage: {
      name: 'Flash Messages',
      views: ['empty', 'withProducts'],
      defaultContent: '<div class="alert alert-info">Cart updated successfully!</div>',
      component: null,
      microSlots: MICRO_SLOT_DEFINITIONS.flashMessage.microSlots,
      gridCols: MICRO_SLOT_DEFINITIONS.flashMessage.gridCols,
      defaultSpans: MICRO_SLOT_DEFINITIONS.flashMessage.defaultSpans
    },
    header: {
      name: 'Page Header',
      views: ['empty', 'withProducts'],
      defaultContent: '<h1 class="text-2xl font-bold">Shopping Cart</h1>',
      component: null,
      microSlots: MICRO_SLOT_DEFINITIONS.header.microSlots,
      gridCols: MICRO_SLOT_DEFINITIONS.header.gridCols,
      defaultSpans: MICRO_SLOT_DEFINITIONS.header.defaultSpans
    },
    emptyCart: {
      name: 'Empty Cart Message',
      views: ['empty'],
      defaultContent: '<div class="empty-cart text-center py-8"><p class="text-gray-500 mb-4">Your cart is empty</p><button class="btn btn-primary">Continue Shopping</button></div>',
      component: null,
      microSlots: MICRO_SLOT_DEFINITIONS.emptyCart.microSlots,
      gridCols: MICRO_SLOT_DEFINITIONS.emptyCart.gridCols,
      defaultSpans: MICRO_SLOT_DEFINITIONS.emptyCart.defaultSpans
    },
    cartItem: {
      name: 'Cart Items',
      views: ['withProducts'],
      defaultContent: '',
      component: null,
      microSlots: MICRO_SLOT_DEFINITIONS.cartItem.microSlots,
      gridCols: MICRO_SLOT_DEFINITIONS.cartItem.gridCols,
      defaultSpans: MICRO_SLOT_DEFINITIONS.cartItem.defaultSpans
    },
    coupon: {
      name: 'Coupon Section',
      views: ['withProducts'],
      defaultContent: '<div class="coupon-section"><input type="text" placeholder="Enter coupon code" class="form-control"><button class="btn btn-secondary">Apply</button></div>',
      component: null,
      microSlots: MICRO_SLOT_DEFINITIONS.coupon.microSlots,
      gridCols: MICRO_SLOT_DEFINITIONS.coupon.gridCols,
      defaultSpans: MICRO_SLOT_DEFINITIONS.coupon.defaultSpans
    },
    orderSummary: {
      name: 'Order Summary',
      views: ['withProducts'],
      defaultContent: '<div class="order-summary"><h3>Order Summary</h3><div class="summary-line">Subtotal: $0.00</div><div class="summary-line">Tax: $0.00</div><div class="summary-total">Total: $0.00</div><button class="btn btn-primary btn-block">Proceed to Checkout</button></div>',
      component: null,
      microSlots: MICRO_SLOT_DEFINITIONS.orderSummary.microSlots,
      gridCols: MICRO_SLOT_DEFINITIONS.orderSummary.gridCols,
      defaultSpans: MICRO_SLOT_DEFINITIONS.orderSummary.defaultSpans
    },
    recommendations: {
      name: 'Product Recommendations',
      views: ['empty', 'withProducts'],
      defaultContent: '<div class="recommendations"><h3>You might also like</h3></div>',
      component: null,
      microSlots: MICRO_SLOT_DEFINITIONS.recommendations.microSlots,
      gridCols: MICRO_SLOT_DEFINITIONS.recommendations.gridCols,
      defaultSpans: MICRO_SLOT_DEFINITIONS.recommendations.defaultSpans
    }
  },
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

// Export all cart configurations
export {
  MICRO_SLOT_DEFINITIONS,
  MICRO_SLOT_TEMPLATES,
  SAVED_CART_CONFIG
};

export default cartConfig;