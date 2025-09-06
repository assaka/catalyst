import { ShoppingCart, Package } from 'lucide-react';

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

export default cartConfig;