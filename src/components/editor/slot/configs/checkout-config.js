// Checkout Page Configuration
export const checkoutConfig = {
  title: 'Checkout Layout Editor',
  defaultView: 'default',
  defaultSlots: ['header', 'steps', 'form', 'summary', 'payment'],
  slots: {
    header: {
      name: 'Checkout Header',
      defaultContent: '<h1>Checkout</h1>',
      component: null
    },
    steps: {
      name: 'Checkout Steps',
      defaultContent: '',
      component: null
    },
    form: {
      name: 'Checkout Form',
      defaultContent: '',
      component: null
    },
    summary: {
      name: 'Order Summary',
      defaultContent: '',
      component: null
    },
    payment: {
      name: 'Payment Methods',
      defaultContent: '',
      component: null
    },
    shipping: {
      name: 'Shipping Methods',
      defaultContent: '',
      component: null
    }
  },
  cmsBlocks: [
    'checkout_header',
    'checkout_above_form',
    'checkout_below_form',
    'checkout_sidebar',
    'checkout_footer'
  ]
};

export default checkoutConfig;