/**
 * Analytics Tracker Extension
 * Example extension that demonstrates event tracking and analytics
 */

export default {
  name: 'analytics-tracker',
  version: '1.2.0',
  description: 'Advanced analytics tracking for user behavior and commerce events',
  author: 'Analytics Team',
  
  config: {
    googleAnalyticsId: 'GA_MEASUREMENT_ID',
    facebookPixelId: null,
    customEventsEnabled: true,
    debugMode: false,
    trackUserJourney: true,
    trackScrollDepth: true,
    trackTimeOnPage: true,
    ecommerceTracking: true
  },

  hooks: {
    // Add tracking data to component renders
    'component.beforeRender': function(componentName, props) {
      if (this.config.debugMode) {
        console.log(`🎯 Analytics: Rendering ${componentName}`, props);
      }
      
      // Add tracking attributes to components
      if (props && typeof props === 'object') {
        props['data-analytics-component'] = componentName;
        props['data-analytics-timestamp'] = Date.now();
      }
      
      return props;
    },

    // Track page views
    'router.navigationComplete': function(routeData) {
      const { path, params, query } = routeData;
      
      this.trackPageView(path, {
        page_title: document.title,
        page_location: window.location.href,
        custom_parameters: params,
        query_parameters: query
      });
      
      if (this.config.trackUserJourney) {
        this.updateUserJourney(path);
      }
    },

    // Enhance API requests with tracking
    'api.beforeRequest': function(url, options) {
      if (this.config.customEventsEnabled) {
        // Track API requests for debugging
        this.trackEvent('api_request', {
          endpoint: url,
          method: options.method || 'GET',
          timestamp: Date.now()
        });
      }
      
      return options;
    },

    // Track API response times
    'api.afterResponse': function(response, context) {
      if (this.config.customEventsEnabled && context.startTime) {
        const duration = Date.now() - context.startTime;
        
        this.trackEvent('api_response', {
          endpoint: context.url,
          status: response.status,
          duration_ms: duration,
          success: response.ok
        });
      }
      
      return response;
    }
  },

  events: {
    // Track cart events
    'cart.itemsLoaded': function(data) {
      const { items, totals } = data;
      
      if (this.config.ecommerceTracking) {
        this.trackEvent('view_cart', {
          currency: data.currencySymbol?.replace(/[^A-Z]/g, '') || 'USD',
          value: totals.total,
          items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price
          }))
        });
      }
      
      // Track cart abandonment prevention
      this.startCartAbandonmentTimer(totals.total);
    },

    'cart.itemAdded': function(data) {
      const { item, quantity } = data;
      
      if (this.config.ecommerceTracking) {
        this.trackEvent('add_to_cart', {
          currency: data.currencySymbol?.replace(/[^A-Z]/g, '') || 'USD',
          value: item.price * quantity,
          items: [{
            item_id: item.id,
            item_name: item.name,
            category: item.category,
            quantity: quantity,
            price: item.price
          }]
        });
      }
    },

    'cart.itemRemoved': function(data) {
      const { removedItem } = data;
      
      if (this.config.ecommerceTracking) {
        this.trackEvent('remove_from_cart', {
          currency: data.currencySymbol?.replace(/[^A-Z]/g, '') || 'USD',
          value: removedItem.price * removedItem.quantity,
          items: [{
            item_id: removedItem.id,
            item_name: removedItem.name,
            category: removedItem.category,
            quantity: removedItem.quantity,
            price: removedItem.price
          }]
        });
      }
    },

    'cart.checkoutStarted': function(data) {
      const { items, totals } = data;
      
      if (this.config.ecommerceTracking) {
        this.trackEvent('begin_checkout', {
          currency: data.currencySymbol?.replace(/[^A-Z]/g, '') || 'USD',
          value: totals.total,
          items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price
          }))
        });
      }
      
      // Clear cart abandonment timer
      this.clearCartAbandonmentTimer();
    },

    'cart.couponApplied': function(data) {
      const { coupon, code } = data;
      
      this.trackEvent('coupon_applied', {
        coupon_name: code,
        discount_amount: coupon.discount_amount,
        discount_type: coupon.discount_type
      });
    },

    // Track user interactions
    'user.login': function(data) {
      const { userId, email } = data;
      
      this.trackEvent('login', {
        method: data.loginMethod || 'email',
        user_id: userId
      });
      
      // Set user properties for enhanced tracking
      this.setUserProperties({
        user_id: userId,
        user_email: email,
        login_timestamp: Date.now()
      });
    },

    'user.register': function(data) {
      const { userId, email, registrationMethod } = data;
      
      this.trackEvent('sign_up', {
        method: registrationMethod || 'email',
        user_id: userId
      });
    },

    // Track product views
    'product.viewed': function(data) {
      const { product, userId } = data;
      
      if (this.config.ecommerceTracking) {
        this.trackEvent('view_item', {
          currency: data.currencySymbol?.replace(/[^A-Z]/g, '') || 'USD',
          value: product.price,
          items: [{
            item_id: product.id,
            item_name: product.name,
            category: product.category,
            price: product.price
          }]
        });
      }
    },

    // Track search events
    'search.performed': function(data) {
      const { query, results, filters } = data;
      
      this.trackEvent('search', {
        search_term: query,
        results_count: results?.length || 0,
        filters_applied: Object.keys(filters || {}).length,
        has_results: (results?.length || 0) > 0
      });
    }
  },

  eventPriorities: {
    'cart.itemsLoaded': 1, // Track immediately
    'user.login': 1,
    'user.register': 1,
    'cart.checkoutStarted': 1
  },

  // Internal state
  state: {
    userJourney: [],
    pageStartTime: null,
    cartAbandonmentTimer: null,
    scrollDepthTracked: []
  },

  // Analytics methods
  trackPageView(path, data = {}) {
    if (window.gtag && this.config.googleAnalyticsId) {
      window.gtag('config', this.config.googleAnalyticsId, {
        page_path: path,
        page_title: data.page_title,
        custom_map: data.custom_parameters
      });
    }
    
    if (window.fbq && this.config.facebookPixelId) {
      window.fbq('track', 'PageView');
    }
    
    // Track with custom analytics
    this.trackEvent('page_view', {
      page_path: path,
      page_title: data.page_title || document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    });
    
    if (this.config.debugMode) {
      console.log('📊 Page view tracked:', path, data);
    }
  },

  trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (window.gtag && this.config.googleAnalyticsId) {
      window.gtag('event', eventName, {
        ...parameters,
        custom_map: { extension: 'analytics-tracker' }
      });
    }
    
    // Facebook Pixel
    if (window.fbq && this.config.facebookPixelId) {
      const fbEventName = this.mapToFacebookEvent(eventName);
      if (fbEventName) {
        window.fbq('track', fbEventName, parameters);
      }
    }
    
    // Custom analytics endpoint
    this.sendToCustomAnalytics(eventName, parameters);
    
    if (this.config.debugMode) {
      console.log('📊 Event tracked:', eventName, parameters);
    }
  },

  mapToFacebookEvent(eventName) {
    const mapping = {
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'Purchase',
      'view_item': 'ViewContent',
      'search': 'Search',
      'sign_up': 'CompleteRegistration',
      'login': 'Login'
    };
    
    return mapping[eventName] || null;
  },

  async sendToCustomAnalytics(eventName, parameters) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          parameters: {
            ...parameters,
            timestamp: Date.now(),
            session_id: this.getSessionId(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            extension: 'analytics-tracker'
          }
        })
      });
    } catch (error) {
      if (this.config.debugMode) {
        console.warn('📊 Failed to send custom analytics:', error);
      }
    }
  },

  setUserProperties(properties) {
    if (window.gtag && this.config.googleAnalyticsId) {
      window.gtag('config', this.config.googleAnalyticsId, {
        custom_map: properties
      });
    }
    
    // Store user properties for session
    sessionStorage.setItem('analytics_user_properties', JSON.stringify(properties));
  },

  updateUserJourney(path) {
    this.state.userJourney.push({
      path,
      timestamp: Date.now(),
      timeOnPrevious: this.state.pageStartTime ? Date.now() - this.state.pageStartTime : 0
    });
    
    // Keep only last 20 pages
    if (this.state.userJourney.length > 20) {
      this.state.userJourney.shift();
    }
    
    this.state.pageStartTime = Date.now();
  },

  startCartAbandonmentTimer(cartValue) {
    this.clearCartAbandonmentTimer();
    
    // Track cart abandonment after 15 minutes of inactivity
    this.state.cartAbandonmentTimer = setTimeout(() => {
      this.trackEvent('cart_abandoned', {
        value: cartValue,
        minutes_inactive: 15
      });
    }, 15 * 60 * 1000);
  },

  clearCartAbandonmentTimer() {
    if (this.state.cartAbandonmentTimer) {
      clearTimeout(this.state.cartAbandonmentTimer);
      this.state.cartAbandonmentTimer = null;
    }
  },

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  },

  setupScrollTracking() {
    if (!this.config.trackScrollDepth) return;
    
    let maxScroll = 0;
    const milestones = [25, 50, 75, 90, 100];
    
    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        for (const milestone of milestones) {
          if (scrollPercent >= milestone && !this.state.scrollDepthTracked.includes(milestone)) {
            this.state.scrollDepthTracked.push(milestone);
            this.trackEvent('scroll_depth', {
              scroll_depth: milestone,
              page_path: window.location.pathname
            });
          }
        }
      }
    };
    
    window.addEventListener('scroll', trackScroll, { passive: true });
  },

  async init() {
    console.log('📊 Analytics Tracker Extension initialized');
    
    // Load configuration
    try {
      const response = await fetch('/api/extensions/analytics-tracker/config');
      if (response.ok) {
        const serverConfig = await response.json();
        Object.assign(this.config, serverConfig);
      }
    } catch (error) {
      console.warn('Could not load analytics configuration:', error.message);
    }
    
    // Initialize Google Analytics
    if (this.config.googleAnalyticsId && this.config.googleAnalyticsId !== 'GA_MEASUREMENT_ID') {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`;
      script.async = true;
      document.head.appendChild(script);
      
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function() { dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', this.config.googleAnalyticsId);
    }
    
    // Initialize Facebook Pixel
    if (this.config.facebookPixelId) {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      window.fbq('init', this.config.facebookPixelId);
      window.fbq('track', 'PageView');
    }
    
    // Set up scroll tracking
    this.setupScrollTracking();
    
    // Track initial page load
    this.trackPageView(window.location.pathname);
    
    if (this.config.debugMode) {
      console.log('📊 Analytics configuration:', this.config);
    }
  },

  async cleanup() {
    console.log('📊 Analytics Tracker Extension cleaned up');
    
    // Clear timers
    this.clearCartAbandonmentTimer();
    
    // Send final events
    if (this.state.pageStartTime) {
      const timeOnPage = Date.now() - this.state.pageStartTime;
      this.trackEvent('time_on_page', {
        duration_ms: timeOnPage,
        page_path: window.location.pathname
      });
    }
    
    // Send user journey data
    if (this.config.trackUserJourney && this.state.userJourney.length > 0) {
      this.trackEvent('user_journey_complete', {
        journey: this.state.userJourney,
        total_pages: this.state.userJourney.length
      });
    }
  },

  dependencies: [],

  metadata: {
    tags: ['analytics', 'tracking', 'gtag', 'facebook-pixel'],
    category: 'analytics',
    documentation: '/docs/extensions/analytics-tracker',
    privacy_policy: '/privacy/analytics-tracking',
    data_usage: 'Collects user interaction data for analytics purposes'
  }
};