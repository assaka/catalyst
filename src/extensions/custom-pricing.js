/**
 * Custom Pricing Extension
 * Example extension that demonstrates custom pricing logic
 */

export default {
  name: 'custom-pricing',
  version: '1.0.0',
  description: 'Adds custom pricing rules and discounts',
  author: 'Store Admin',
  
  // Extension configuration
  config: {
    volumeDiscountEnabled: true,
    loyaltyDiscountEnabled: true,
    minimumOrderForDiscount: 100,
    volumeDiscountThreshold: 5,
    volumeDiscountPercent: 10,
    loyaltyDiscountPercent: 5
  },

  // Hook handlers
  hooks: {
    // Modify pricing calculation
    'pricing.calculate': function(basePrice, context) {
      let finalPrice = basePrice;
      
      // Volume discount
      if (this.config.volumeDiscountEnabled && context.quantity >= this.config.volumeDiscountThreshold) {
        const discount = basePrice * (this.config.volumeDiscountPercent / 100);
        finalPrice -= discount;
        
        console.log(`Volume discount applied: -$${discount.toFixed(2)}`);
      }
      
      // Loyalty customer discount
      if (this.config.loyaltyDiscountEnabled && context.user && context.user.isLoyaltyMember) {
        const loyaltyDiscount = finalPrice * (this.config.loyaltyDiscountPercent / 100);
        finalPrice -= loyaltyDiscount;
        
        console.log(`Loyalty discount applied: -$${loyaltyDiscount.toFixed(2)}`);
      }
      
      return Math.max(0, finalPrice); // Ensure price doesn't go negative
    },

    // Format prices with custom currency
    'pricing.format': function(price, context) {
      const { store } = context;
      
      // Custom formatting for specific stores
      if (store && store.currency_code === 'EUR') {
        return parseFloat(price).toFixed(2) + ' €';
      }
      
      return price; // Return unchanged for other currencies
    },

    // Add custom validation to cart items
    'cart.beforeAddItem': function(item, context) {
      // Check minimum order value
      if (item.price < 1) {
        throw new Error('Item price must be at least $1.00');
      }
      
      // Check stock availability
      if (item.stock_quantity !== undefined && item.stock_quantity < item.quantity) {
        throw new Error(`Only ${item.stock_quantity} items available in stock`);
      }
      
      return item;
    },

    // Custom cart total calculation
    'cart.calculateItemPrice': function(basePrice, context) {
      const { item, quantity } = context;
      
      // Bundle pricing - buy 2 get 1 free
      if (item.category === 'bundle' && quantity >= 3) {
        const freeItems = Math.floor(quantity / 3);
        const paidItems = quantity - freeItems;
        return basePrice * paidItems / quantity; // Adjust unit price
      }
      
      return basePrice;
    },

    // Apply coupon validation
    'cart.validateCoupon': function(validationResult, context) {
      const { code, cartItems, currentCoupons } = context;
      
      // Prevent stacking certain coupons
      if (code.startsWith('NEWCUSTOMER') && currentCoupons.length > 0) {
        return {
          valid: false,
          message: 'New customer coupons cannot be combined with other offers'
        };
      }
      
      // Minimum order requirement
      const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (code.startsWith('SAVE20') && totalValue < this.config.minimumOrderForDiscount) {
        return {
          valid: false,
          message: `Minimum order of $${this.config.minimumOrderForDiscount} required for this coupon`
        };
      }
      
      return validationResult;
    },

    // Customize checkout URL
    'cart.getCheckoutUrl': function(defaultUrl, context) {
      const { items, totals } = context;
      
      // Redirect high-value orders to premium checkout
      if (totals.total > 500) {
        return '/premium-checkout';
      }
      
      return defaultUrl;
    }
  },

  // Event listeners
  events: {
    // Track pricing changes
    'cart.itemsLoaded': function(data) {
      const { items, totals } = data;
      console.log('Custom Pricing: Cart loaded with', items.length, 'items, total:', totals.total);
      
      // Send analytics event
      if (window.gtag) {
        window.gtag('event', 'cart_viewed', {
          'custom_total': totals.total,
          'custom_item_count': items.length,
          'extension': 'custom-pricing'
        });
      }
    },

    // Log coupon applications
    'cart.couponApplied': function(data) {
      const { coupon, code } = data;
      console.log('Custom Pricing: Coupon applied:', code);
      
      // Track successful coupon usage
      if (window.gtag) {
        window.gtag('event', 'coupon_applied', {
          'coupon_code': code,
          'extension': 'custom-pricing'
        });
      }
    },

    // Monitor checkout starts
    'cart.checkoutStarted': function(data) {
      const { items, totals, checkoutUrl } = data;
      
      console.log('Custom Pricing: Checkout started with total:', totals.total);
      
      // Store checkout data for later analysis
      localStorage.setItem('custom_pricing_checkout_data', JSON.stringify({
        timestamp: Date.now(),
        total: totals.total,
        itemCount: items.length,
        checkoutUrl
      }));
    }
  },

  // Hook priorities (lower = higher priority)
  hookPriorities: {
    'pricing.calculate': 5, // Run before other pricing hooks
    'cart.validateCoupon': 8,
    'pricing.format': 10
  },

  // Event priorities
  eventPriorities: {
    'cart.itemsLoaded': 5,
    'cart.couponApplied': 10
  },

  // Initialization function
  async init() {
    console.log('🎯 Custom Pricing Extension initialized');
    
    // Load configuration from API if needed
    try {
      const response = await fetch('/api/extensions/custom-pricing/config');
      if (response.ok) {
        const serverConfig = await response.json();
        Object.assign(this.config, serverConfig);
        console.log('📋 Loaded custom pricing configuration:', this.config);
      }
    } catch (error) {
      console.warn('Could not load server configuration for custom pricing:', error.message);
    }
    
    // Set up any required DOM elements or styles
    if (this.config.showPricingBadges) {
      const style = document.createElement('style');
      style.textContent = `
        .custom-pricing-badge {
          background: linear-gradient(45deg, #ff6b6b, #ff8787);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: bold;
          margin-left: 8px;
        }
      `;
      document.head.appendChild(style);
    }
  },

  // Cleanup function
  async cleanup() {
    console.log('🧹 Custom Pricing Extension cleaned up');
    
    // Remove any DOM elements or event listeners
    const customStyles = document.querySelector('style[data-extension="custom-pricing"]');
    if (customStyles) {
      customStyles.remove();
    }
    
    // Clear any stored data
    localStorage.removeItem('custom_pricing_checkout_data');
  },

  // Dependencies (other extensions this depends on)
  dependencies: [],

  // Extension metadata
  metadata: {
    tags: ['pricing', 'discounts', 'loyalty'],
    category: 'commerce',
    screenshots: ['/images/extensions/custom-pricing-demo.png'],
    documentation: '/docs/extensions/custom-pricing',
    supportUrl: 'https://support.example.com/custom-pricing'
  }
};