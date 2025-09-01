/**
 * Example Cart Page Customizations using Phoenix Slot System
 * These show how users can customize the cart without touching the core code
 */

import { loadUserConfiguration } from '@/core/slot-system';

// Example 1: Customize Cart Page Header
const customizeCartHeader = {
  version: "1.0",
  slots: {
    "cart.page.header": {
      enabled: true,
      order: 1,
      props: {
        title: "Shopping Bag", // Change "My Cart" to "Shopping Bag"
        className: "text-4xl font-bold text-blue-900 mb-8"
      }
    }
  }
};

// Example 2: Customize Checkout Button
const customizeCheckoutButton = {
  version: "1.0",
  slots: {
    "cart.checkout.button": {
      enabled: true,
      order: 9,
      props: {
        text: "Complete Purchase", // Change button text
        className: "w-full bg-green-600 hover:bg-green-700",
        size: "lg"
      }
    }
  }
};

// Example 3: Customize Empty Cart Message
const customizeEmptyCart = {
  version: "1.0",
  slots: {
    "cart.empty.display": {
      enabled: true,
      order: 2,
      props: {
        title: "Your shopping bag is empty",
        message: "Discover amazing products and add them to your bag.",
        buttonText: "Start Shopping"
      }
    }
  }
};

// Example 4: Hide Coupon Section
const hideCouponSection = {
  version: "1.0",
  slots: {
    "cart.coupon.section": {
      enabled: false // Simply disable the coupon section
    }
  }
};

// Example 5: Comprehensive Cart Customization
const comprehensiveCartCustomization = {
  version: "1.0",
  slots: {
    // Customize page container
    "cart.page.container": {
      enabled: true,
      order: 0,
      props: {
        className: "bg-gradient-to-br from-blue-50 to-indigo-100 cart-page"
      }
    },
    
    // Customize header
    "cart.page.header": {
      enabled: true,
      order: 1,
      props: {
        title: "🛍️ Your Shopping Bag",
        className: "text-3xl font-bold text-indigo-900 mb-8 text-center"
      }
    },
    
    // Customize empty cart
    "cart.empty.display": {
      enabled: true,
      order: 2,
      props: {
        title: "Your bag is waiting for something special",
        message: "Browse our curated collection and find items you'll love.",
        buttonText: "Explore Products"
      }
    },
    
    // Customize checkout button
    "cart.checkout.button": {
      enabled: true,
      order: 9,
      props: {
        text: "🚀 Secure Checkout",
        className: "w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105",
        size: "lg"
      }
    },
    
    // Disable coupon section for a cleaner look
    "cart.coupon.section": {
      enabled: false
    }
  },
  
  metadata: {
    name: "Premium Shopping Experience",
    description: "A modern, clean cart design with gradient backgrounds and enhanced visual appeal",
    createdAt: new Date().toISOString()
  }
};

// Function to apply any of these customizations
export const applyCartCustomization = (customizationType = 'comprehensive') => {
  const customizations = {
    header: customizeCartHeader,
    checkout: customizeCheckoutButton,
    empty: customizeEmptyCart,
    hideCoupon: hideCouponSection,
    comprehensive: comprehensiveCartCustomization
  };

  const config = customizations[customizationType];
  if (config) {
    loadUserConfiguration(config);
    console.log(`✅ Applied cart customization: ${customizationType}`);
    return true;
  } else {
    console.error(`❌ Unknown customization type: ${customizationType}`);
    return false;
  }
};

// Example of how this would be used:
/*
// In your application, after the slot system is initialized:
import { applyCartCustomization } from './example-cart-customizations.js';

// Apply comprehensive customization
applyCartCustomization('comprehensive');

// Or apply specific customizations
applyCartCustomization('header');
applyCartCustomization('checkout');
*/

export {
  customizeCartHeader,
  customizeCheckoutButton,
  customizeEmptyCart,
  hideCouponSection,
  comprehensiveCartCustomization
};