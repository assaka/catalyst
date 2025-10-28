// src/constants/PluginEvents.js

export const PLUGIN_EVENTS = {
  // Product Events
  'product.before_save': {
    description: 'Before product is saved to database',
    location: 'backend/src/controllers/ProductController.js:save',
    payload: { product: 'Product object before save' }
  },
  'product.after_save': {
    description: 'After product is saved to database',
    location: 'backend/src/controllers/ProductController.js:save',
    payload: { product: 'Saved product object', isNew: 'boolean' }
  },
  'product.view': {
    description: 'When product page is rendered',
    location: 'frontend/src/pages/ProductDetail.jsx',
    payload: { product: 'Product object', user: 'Current user' }
  },
  'product.list': {
    description: 'When product list is rendered',
    location: 'frontend/src/pages/Category.jsx',
    payload: { products: 'Array of products', filters: 'Applied filters' }
  },

  // Cart Events
  'cart.viewed': {
    description: 'Cart page loads',
    location: 'frontend/src/pages/storefront/Cart.jsx:1051',
    payload: { items: 'Cart items array', subtotal: 'number', discount: 'number', tax: 'number', total: 'number' }
  },
  'cart.itemsLoaded': {
    description: 'Cart items loaded from API',
    location: 'frontend/src/pages/storefront/Cart.jsx:450',
    payload: { items: 'Cart items array', success: 'boolean' }
  },
  'cart.add_item': {
    description: 'When item is added to cart',
    location: 'frontend/src/contexts/CartContext.jsx:addToCart',
    payload: { product: 'Product object', quantity: 'number', cart: 'Current cart' }
  },
  'cart.remove_item': {
    description: 'When item is removed from cart',
    location: 'frontend/src/contexts/CartContext.jsx:removeFromCart',
    payload: { productId: 'string', cart: 'Current cart' }
  },
  'cart.itemRemoved': {
    description: 'Item removed from cart',
    location: 'frontend/src/pages/storefront/Cart.jsx:590',
    payload: { itemId: 'string', cart: 'Cart object' }
  },
  'cart.update_quantity': {
    description: 'When cart item quantity is updated',
    location: 'frontend/src/contexts/CartContext.jsx:updateQuantity',
    payload: { productId: 'string', oldQuantity: 'number', newQuantity: 'number' }
  },
  'cart.quantityUpdated': {
    description: 'Item quantity changed',
    location: 'frontend/src/pages/storefront/Cart.jsx:525',
    payload: { itemId: 'string', newQuantity: 'number', cart: 'Cart object' }
  },
  'cart.checkoutStarted': {
    description: 'User clicks checkout',
    location: 'frontend/src/pages/storefront/Cart.jsx:1022',
    payload: { cart: 'Cart object', total: 'number' }
  },
  'cart.checkoutBlocked': {
    description: 'Checkout blocked (empty cart)',
    location: 'frontend/src/pages/storefront/Cart.jsx',
    payload: { reason: 'string' }
  },
  'cart.before_checkout': {
    description: 'Before checkout process starts',
    location: 'frontend/src/pages/Checkout.jsx:handleCheckout',
    payload: { cart: 'Cart object', user: 'Current user' }
  },

  // Order Events
  'order.before_create': {
    description: 'Before order is created',
    location: 'backend/src/controllers/OrderController.js:create',
    payload: { orderData: 'Order data object', user: 'User object' }
  },
  'order.after_create': {
    description: 'After order is created',
    location: 'backend/src/controllers/OrderController.js:create',
    payload: { order: 'Created order object', user: 'User object' }
  },
  'order.status_change': {
    description: 'When order status changes',
    location: 'backend/src/controllers/OrderController.js:updateStatus',
    payload: { order: 'Order object', oldStatus: 'string', newStatus: 'string' }
  },
  'order.cancel': {
    description: 'When order is cancelled',
    location: 'backend/src/controllers/OrderController.js:cancel',
    payload: { order: 'Order object', reason: 'Cancellation reason' }
  },

  // Customer Events
  'customer.login': {
    description: 'After customer logs in',
    location: 'backend/src/controllers/AuthController.js:login',
    payload: { user: 'User object', session: 'Session data' }
  },
  'customer.register': {
    description: 'After customer registration',
    location: 'backend/src/controllers/AuthController.js:register',
    payload: { user: 'New user object' }
  },
  'customer.before_save': {
    description: 'Before customer data is saved',
    location: 'backend/src/controllers/CustomerController.js:update',
    payload: { user: 'User object', changes: 'Changed fields' }
  },
  'customer.after_save': {
    description: 'After customer data is saved',
    location: 'backend/src/controllers/CustomerController.js:update',
    payload: { user: 'Updated user object' }
  },

  // Page/UI Events
  'page.render_before': {
    description: 'Before page renders',
    location: 'frontend/src/App.jsx',
    payload: { route: 'Current route', user: 'Current user' }
  },
  'page.render_after': {
    description: 'After page renders',
    location: 'frontend/src/App.jsx',
    payload: { route: 'Current route', user: 'Current user' }
  },
  'widget.render': {
    description: 'When a widget is rendered',
    location: 'frontend/src/components/*',
    payload: { widgetType: 'string', config: 'Widget config' }
  },

  // Admin Events
  'admin.page_load': {
    description: 'When admin page loads',
    location: 'frontend/src/pages/admin/*',
    payload: { page: 'Page identifier', user: 'Admin user' }
  }
};

export const PLUGIN_HOOKS = {
  // Product Hooks
  'product.price': {
    description: 'Filter product price',
    type: 'filter',
    location: 'frontend/src/components/ProductCard.jsx',
    params: { price: 'number', product: 'Product object' },
    returns: 'Modified price (number)'
  },
  'product.data': {
    description: 'Filter product data before display',
    type: 'filter',
    location: 'frontend/src/pages/ProductDetail.jsx',
    params: { product: 'Product object' },
    returns: 'Modified product object'
  },

  // Cart Hooks
  'cart.item_price': {
    description: 'Filter cart item price',
    type: 'filter',
    location: 'frontend/src/contexts/CartContext.jsx',
    params: { price: 'number', item: 'Cart item object' },
    returns: 'Modified price (number)'
  },
  'cart.total': {
    description: 'Filter cart total',
    type: 'filter',
    location: 'frontend/src/contexts/CartContext.jsx',
    params: { total: 'number', cart: 'Cart object' },
    returns: 'Modified total (number)'
  },

  // Checkout Hooks
  'checkout.fields': {
    description: 'Filter checkout form fields',
    type: 'filter',
    location: 'frontend/src/pages/Checkout.jsx',
    params: { fields: 'Array of field objects' },
    returns: 'Modified fields array'
  },

  // Email Hooks
  'email.content': {
    description: 'Filter email content before sending',
    type: 'filter',
    location: 'backend/src/services/EmailService.js',
    params: { content: 'Email HTML/text', type: 'Email type', data: 'Email data' },
    returns: 'Modified email content'
  }
};
