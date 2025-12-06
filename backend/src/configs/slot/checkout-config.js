// Checkout Page Configuration
// Backend version - CommonJS format

const checkoutConfig = {
  page_name: 'Checkout',
  slot_type: 'checkout_layout',

  slots: {
    checkout_container: {
      id: 'checkout_container',
      type: 'container',
      content: '',
      className: 'max-w-7xl mx-auto px-4 py-8',
      styles: {},
      viewMode: ['default', 'processing']
    },

    checkout_header: {
      id: 'checkout_header',
      type: 'text',
      content: '{{t "common.checkout"}}',
      className: 'text-3xl font-bold text-gray-900 mb-8',
      styles: {},
      viewMode: ['default', 'processing']
    },

    checkout_steps: {
      id: 'checkout_steps',
      type: 'component',
      component: 'CheckoutStepsSlot',
      content: '',
      className: '',
      styles: {},
      viewMode: ['default']
    },

    content_grid: {
      id: 'content_grid',
      type: 'container',
      content: '',
      className: 'grid grid-cols-1 lg:grid-cols-3 gap-8',
      styles: {},
      viewMode: ['default', 'processing']
    },

    form_column: {
      id: 'form_column',
      type: 'container',
      content: '',
      className: 'lg:col-span-2 space-y-6',
      styles: {},
      viewMode: ['default']
    },

    shipping_form: {
      id: 'shipping_form',
      type: 'component',
      component: 'ShippingFormSlot',
      content: '',
      className: '',
      styles: {},
      viewMode: ['default']
    },

    payment_form: {
      id: 'payment_form',
      type: 'component',
      component: 'PaymentFormSlot',
      content: '',
      className: '',
      styles: {},
      viewMode: ['default']
    },

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
      content: '',
      className: '',
      styles: {},
      viewMode: ['default', 'processing']
    },

    processing_message: {
      id: 'processing_message',
      type: 'text',
      content: '{{t "common.processing_order"}}',
      className: 'text-center text-xl text-gray-600',
      styles: {},
      viewMode: ['processing']
    }
  },

  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'checkout'
  },

  views: [
    { id: 'default', label: 'Checkout Form', icon: null },
    { id: 'processing', label: 'Processing', icon: null }
  ],

  cmsBlocks: [
    'checkout_header',
    'checkout_above_form',
    'checkout_below_form',
    'checkout_sidebar',
    'checkout_footer'
  ]
};

module.exports = { checkoutConfig };
