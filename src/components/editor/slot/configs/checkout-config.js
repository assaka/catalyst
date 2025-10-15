import { ShoppingBag, CreditCard } from 'lucide-react';

// Checkout Page Configuration
export const checkoutConfig = {
  page_name: 'Checkout',
  slot_type: 'checkout_layout',

  // Slot configuration
  slots: {
    // Main layout container
    checkout_container: {
      id: 'checkout_container',
      type: 'container',
      content: '',
      className: 'max-w-7xl mx-auto px-4 py-8',
      styles: {},
      viewMode: ['default', 'processing']
    },

    // Page header
    checkout_header: {
      id: 'checkout_header',
      type: 'text',
      content: '{{t "common.checkout"}}',
      className: 'text-3xl font-bold text-gray-900 mb-8',
      styles: {},
      viewMode: ['default', 'processing']
    },

    // Progress steps
    checkout_steps: {
      id: 'checkout_steps',
      type: 'component',
      component: 'CheckoutStepsSlot',
      content: `
        <div class="flex justify-between mb-8">
          <div class="flex-1 text-center">
            <div class="w-10 h-10 bg-blue-600 text-white rounded-full mx-auto mb-2 flex items-center justify-center">1</div>
            <p class="text-sm font-medium">Shipping</p>
          </div>
          <div class="flex-1 text-center">
            <div class="w-10 h-10 bg-gray-200 text-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">2</div>
            <p class="text-sm">Payment</p>
          </div>
          <div class="flex-1 text-center">
            <div class="w-10 h-10 bg-gray-200 text-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">3</div>
            <p class="text-sm">Review</p>
          </div>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['default']
    },

    // Main content grid
    content_grid: {
      id: 'content_grid',
      type: 'container',
      content: '',
      className: 'grid grid-cols-1 lg:grid-cols-3 gap-8',
      styles: {},
      viewMode: ['default', 'processing']
    },

    // Left column - Forms (2/3 width)
    form_column: {
      id: 'form_column',
      type: 'container',
      content: '',
      className: 'lg:col-span-2 space-y-6',
      styles: {},
      viewMode: ['default']
    },

    // Shipping form
    shipping_form: {
      id: 'shipping_form',
      type: 'component',
      component: 'ShippingFormSlot',
      content: `
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Shipping Information</h2>
          <form class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
          </form>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['default']
    },

    // Payment form
    payment_form: {
      id: 'payment_form',
      type: 'component',
      component: 'PaymentFormSlot',
      content: `
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Payment Information</h2>
          <form class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="1234 5678 9012 3456" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="MM/YY" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input type="text" required class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="123" />
              </div>
            </div>
          </form>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['default']
    },

    // Right column - Order Summary (1/3 width)
    summary_column: {
      id: 'summary_column',
      type: 'container',
      content: '',
      className: 'lg:col-span-1',
      styles: {},
      viewMode: ['default', 'processing']
    },

    order_summary: {
      id: 'order_summary',
      type: 'component',
      component: 'OrderSummarySlot',
      content: `
        <div class="bg-white rounded-lg shadow p-6 sticky top-4">
          <h2 class="text-xl font-semibold mb-4">Order Summary</h2>
          <div class="space-y-3 mb-4">
            <div class="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>$0.00</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>Shipping</span>
              <span>$0.00</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>Tax</span>
              <span>$0.00</span>
            </div>
            <div class="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>$0.00</span>
            </div>
          </div>
          <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md">
            Place Order
          </button>
        </div>
      `,
      className: '',
      styles: {},
      viewMode: ['default', 'processing']
    },

    // Processing state
    processing_message: {
      id: 'processing_message',
      type: 'text',
      content: '{{t "common.processing_order"}}',
      className: 'text-center text-xl text-gray-600',
      styles: {},
      viewMode: ['processing']
    }
  },

  // Configuration metadata
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'checkout'
  },

  // View configuration
  views: [
    { id: 'default', label: 'Checkout Form', icon: ShoppingBag },
    { id: 'processing', label: 'Processing', icon: CreditCard }
  ],

  // CMS blocks for additional content areas
  cmsBlocks: [
    'checkout_header',
    'checkout_above_form',
    'checkout_below_form',
    'checkout_sidebar',
    'checkout_footer'
  ]
};

export default checkoutConfig;