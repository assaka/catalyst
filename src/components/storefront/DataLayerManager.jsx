
import { useEffect } from 'react';
import { useStore } from './StoreProvider';
import { CustomerActivity } from '@/api/entities';

// Initialize dataLayer
if (typeof window !== 'undefined' && !window.dataLayer) {
  window.dataLayer = [];
}

export const pushToDataLayer = (event) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
    
    // Also dispatch a custom event for debugging
    window.dispatchEvent(new CustomEvent('dataLayerPush', { detail: event }));
  }
};

export const trackEvent = (eventName, eventData = {}) => {
  const event = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...eventData
  };
  
  pushToDataLayer(event);
};

// Customer Activity Tracking - re-enabled with proper backend support
let sessionId = localStorage.getItem('guest_session_id');
let userId = localStorage.getItem('customer_user_id');

export const trackActivity = async (activityType, data = {}) => {
  try {
    
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest_session_id', sessionId);
    }
    
    // Get store ID from the data payload if provided, otherwise check context
    let storeId = data.store_id;
    if (!storeId) {
        try {
            const storeContext = window.__STORE_CONTEXT__;
            if (storeContext?.store?.id) {
                storeId = storeContext.store.id;
            }
        } catch (error) {
            console.warn('Could not get store context for activity tracking');
        }
    }

    const activityData = {
      user_id: userId,
      session_id: sessionId,
      store_id: storeId,
      activity_type: activityType,
      page_url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      ip_address: null, // Will be filled by server
      metadata: data,
      ...data
    };

    // Clean up undefined values
    Object.keys(activityData).forEach(key => {
      if (activityData[key] === undefined) {
        delete activityData[key];
      }
    });
    
    // Only track if we have store_id to prevent validation errors
    if (storeId) {
      console.log('📊 Tracking activity:', activityType, activityData);
      await CustomerActivity.create(activityData);
    } else {
      console.warn('Skipping activity tracking - no store_id available');
    }
    
  } catch (error) {
    console.warn('Failed to track activity:', error);
  }
};

// Enhanced event tracking functions
export const trackProductView = (product) => {
  trackEvent('view_item', {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category_name,
    price: product.price,
    currency: 'USD'
  });
  
  trackActivity('product_view', {
    product_id: product.id,
    product_name: product.name,
    product_price: product.price
  });
};

export const trackAddToCart = (product, quantity = 1) => {
  trackEvent('add_to_cart', {
    currency: 'USD',
    value: product.price * quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category_name,
      quantity: quantity,
      price: product.price
    }]
  });
  
  trackActivity('cart_add', {
    product_id: product.id,
    product_name: product.name,
    quantity: quantity,
    value: product.price * quantity
  });
};

export const trackRemoveFromCart = (product, quantity = 1) => {
  trackEvent('remove_from_cart', {
    currency: 'USD',
    value: product.price * quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category_name,
      quantity: quantity,
      price: product.price
    }]
  });
  
  trackActivity('cart_remove', {
    product_id: product.id,
    product_name: product.name,
    quantity: quantity,
    value: product.price * quantity
  });
};

export const trackPurchase = (order) => {
  trackEvent('purchase', {
    transaction_id: order.id,
    value: order.total,
    currency: 'USD',
    items: order.items?.map(item => ({
      item_id: item.product_id,
      item_name: item.product_name,
      item_category: item.category_name,
      quantity: item.quantity,
      price: item.price
    })) || []
  });
  
  trackActivity('purchase', {
    order_id: order.id,
    order_total: order.total,
    order_items_count: order.items?.length || 0
  });
};

export const trackSearch = (query, results_count = 0) => {
  trackEvent('search', {
    search_term: query,
    results_count: results_count
  });
  
  trackActivity('search', {
    search_query: query,
    results_count: results_count
  });
};

export default function DataLayerManager() {
  const { store, settings } = useStore();

  useEffect(() => {
    // Set global store context for activity tracking
    if (store) {
      window.__STORE_CONTEXT__ = { store, settings };
      
      // Make tracking functions globally available
      window.catalyst = {
        trackProductView,
        trackAddToCart,
        trackRemoveFromCart,
        trackPurchase,
        trackSearch,
        trackEvent,
        trackActivity
      };
      
      console.log('🔧 DataLayerManager: Catalyst tracking functions initialized', {
        store_name: store.name,
        store_id: store.id,
        functions: Object.keys(window.catalyst)
      });
    }

    // Initialize GTM dataLayer with basic info
    if (store && store.id) { // CRITICAL FIX: Ensure store.id exists before tracking
      pushToDataLayer({
        event: 'page_view',
        page_title: document.title,
        page_url: window.location.href,
        store_name: store.name,
        store_id: store.id,
        currency: store.currency || 'USD'
      });
      
      // Track page view activity
      trackActivity('page_view', {
        page_url: window.location.href,
        page_title: document.title,
        store_id: store.id // Pass store_id explicitly
      });
    }

    // Add enhanced event listener for debugging
    const handleDataLayerPush = (e) => {
      console.log('📊 DataLayer Event:', e.detail);
    };
    
    window.addEventListener('dataLayerPush', handleDataLayerPush);
    
    return () => {
      window.removeEventListener('dataLayerPush', handleDataLayerPush);
    };
  }, [store]);

  return null;
}
