
import { useEffect } from 'react';
import { useStore } from './StoreProvider';

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

// Customer Activity Tracking
export const trackActivity = async (activityType, data = {}) => {
  try {
    const { CustomerActivity } = await import('@/api/entities');
    const { User } = await import('@/api/entities');
    
    // Get user info
    let userId = null;
    let sessionId = localStorage.getItem('guest_session_id');
    
    try {
      const user = await User.me();
      userId = user?.id;
    } catch (error) {
      // User not logged in
    }
    
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
      await CustomerActivity.create(activityData);
    } else {
      console.warn('Skipping activity tracking - no store_id available');
    }
    
  } catch (error) {
    console.error('Failed to track activity:', error);
  }
};

export default function DataLayerManager() {
  const { store, settings } = useStore();

  useEffect(() => {
    // Set global store context for activity tracking
    if (store) {
      window.__STORE_CONTEXT__ = { store, settings };
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

    // Add event listener for debugging
    const handleDataLayerPush = (e) => {
    };
    
    window.addEventListener('dataLayerPush', handleDataLayerPush);
    
    return () => {
      window.removeEventListener('dataLayerPush', handleDataLayerPush);
    };
  }, [store]);

  return null;
}
