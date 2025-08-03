
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
      
      // CRITICAL DEBUG: Add explicit check for execution path
      console.log('🚀 ENTERING API CALL SECTION - storeId check passed:', storeId);
      
      try {
        // Use direct fetch instead of CustomerActivity.create to avoid auth issues
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const apiUrl = `${apiBaseUrl}/api/customer-activity`;
        
        console.log('🌐 Environment variables check:', {
          VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
          apiBaseUrl: apiBaseUrl,
          finalApiUrl: apiUrl
        });
        
        console.log('🌐 Sending POST request to:', apiUrl);
        console.log('📦 Request payload:', JSON.stringify(activityData, null, 2));
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityData),
          credentials: 'include'
        });
        
        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error response:', errorText);
          console.error('❌ Full response details:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: errorText
          });
          throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const responseData = await response.json();
        console.log('✅ Activity tracked successfully:', responseData);
        
        // Additional verification
        if (responseData.success && responseData.data && responseData.data.id) {
          console.log('🎯 Customer activity record created with ID:', responseData.data.id);
        } else {
          console.warn('⚠️ Unexpected response format:', responseData);
        }
        
      } catch (apiError) {
        console.error('❌ CRITICAL ERROR - API call failed:', {
          error: apiError,
          message: apiError.message,
          stack: apiError.stack,
          apiUrl: apiUrl,
          activityData: activityData
        });
        
        // Check if it's a network error
        if (apiError.name === 'TypeError' && apiError.message.includes('fetch')) {
          console.error('🚨 Network connectivity issue detected!');
        }
        
        // Log the error to ensure it's visible
        alert('API Error: ' + apiError.message);
      }
    } else {
      console.warn('🚫 CRITICAL: Skipping activity tracking - no store_id available', {
        storeId: storeId,
        activityType: activityType,
        activityData: activityData
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to track activity:', error);
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
  
  trackActivity('add_to_cart', {
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
  
  trackActivity('remove_from_cart', {
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
  
  trackActivity('order_completed', {
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
