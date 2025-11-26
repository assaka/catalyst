// Global cache to prevent duplicate cart fetches (use window to share across chunks)
if (typeof window !== 'undefined') {
  if (!window.__cartCache) {
    window.__cartCache = { data: null, timestamp: 0, fetching: false, pendingCallbacks: [] };
  }
}

const CART_CACHE_TTL = 30000; // 30 seconds - cache cart data to prevent duplicates

// Helper to invalidate cart cache
const invalidateCartCache = () => {
  if (typeof window !== 'undefined') {
    window.__cartCache = { data: null, timestamp: 0, fetching: false, pendingCallbacks: [] };
  }
};

// Simplified Cart Service
class CartService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
    this.endpoint = `${this.baseURL}/api/cart`;
  }

  // Get session ID consistently - use same as StorefrontApiClient
  getSessionId() {
    let sessionId = localStorage.getItem('guest_session_id');
    if (!sessionId) {
      sessionId = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('guest_session_id', sessionId);
    }

    return sessionId;
  }

  // Get current user
  async getCurrentUser() {
    try {
      // Try customer auth first (for storefront)
      const { CustomerAuth } = await import('@/api/storefront-entities');
      if (CustomerAuth.isAuthenticated()) {
        const user = await CustomerAuth.me();
        if (user && user.role === 'customer') {
          return user;
        }
      }

      // Only try admin auth if we're in admin context (not storefront)
      // Check if we're on an admin route
      const isAdminContext = window.location.pathname.startsWith('/admin');
      if (isAdminContext) {
        const { User } = await import('@/api/entities');
        const user = await User.me();
        return user;
      }

      // For storefront guests, return null
      return null;
    } catch (error) {
      return null;
    }
  }

  // Get cart - simplified to always use session_id approach with aggressive cache busting
  async getCart(bustCache = false, storeId = null) {
    // Check global cache (unless busting cache)
    if (!bustCache && window.__cartCache?.data && (Date.now() - window.__cartCache.timestamp < CART_CACHE_TTL)) {
      return window.__cartCache.data; // Return cached data
    }

    // If already fetching, wait for that request to complete
    if (window.__cartCache?.fetching) {
      return new Promise((resolve) => {
        window.__cartCache.pendingCallbacks.push(resolve);
        // Timeout after 10 seconds
        setTimeout(() => resolve({ success: false, items: [] }), 10000);
      });
    }

    // Mark as fetching
    window.__cartCache.fetching = true;
    window.__cartCache.pendingCallbacks = [];

    const sessionId = this.getSessionId();
    let fullUrl = '';

    try {
      const user = await this.getCurrentUser();

      const params = new URLSearchParams();
      params.append('session_id', sessionId);

      // Add user_id only for admin users (not customers) to enable cart merging
      // Customers use session_id only to avoid foreign key constraint issues
      if (user?.id && user?.role !== 'customer') {
        params.append('user_id', user.id);
      }

      // CRITICAL: Add store_id to filter cart by store (fixes multi-store cart issue)
      if (storeId) {
        params.append('store_id', storeId);
      }

      // Add cache busting for fresh data requests
      if (bustCache) {
        params.append('_t', Date.now().toString());
      }

      fullUrl = `${this.endpoint}?${params.toString()}`;

      let response;
      try {
        // Build headers object without undefined values to avoid CORS issues
        const headers = {
          'Cache-Control': bustCache ? 'no-cache, no-store, must-revalidate' : 'max-age=30'
        };

        // Only add Pragma for cache busting, don't add Expires (causes CORS issues)
        if (bustCache) {
          headers['Pragma'] = 'no-cache';
        }

        response = await fetch(fullUrl, {
          cache: bustCache ? 'no-store' : 'default',
          headers: headers
        });
      } catch (fetchError) {
        console.error('🚫 CartService.getCart: Network error during fetch:', {
          error: fetchError.message,
          name: fetchError.name,
          url: fullUrl,
          stack: fetchError.stack?.split('\n')[0]
        });
        throw fetchError; // Re-throw to be caught by outer try-catch
      }

      if (!response.ok) {
        console.error('🛒 CartService.getCart: Response not ok:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl
        });
        return { success: false, cart: null, items: [] };
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Handle both direct data.items and data.dataValues.items structures
        const cartData = result.data.dataValues || result.data;
        let items = Array.isArray(cartData.items) ? cartData.items : [];

        // Migrate existing items that don't have IDs
        let needsUpdate = false;
        items = items.map(item => {
          if (!item.id) {
            needsUpdate = true;
            return {
              ...item,
              id: `item_${item.product_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
          }
          return item;
        });

        // If we added IDs, update the cart in the background
        if (needsUpdate && storeId) {
          this.updateCart(items, storeId).catch(err =>
            console.warn('Failed to persist item IDs:', err)
          );
        }

        const cartResult = {
          success: true,
          cart: { ...cartData, items },
          items: items
        };

        // Resolve any pending callbacks BEFORE updating cache
        const callbacks = window.__cartCache?.pendingCallbacks || [];

        // Cache the result
        window.__cartCache = {
          data: cartResult,
          timestamp: Date.now(),
          fetching: false,
          pendingCallbacks: []
        };

        // Resolve callbacks after cache is updated
        callbacks.forEach(cb => cb(cartResult));

        return cartResult;
      }

      const emptyResult = { success: false, cart: null, items: [] };

      // Resolve any pending callbacks BEFORE updating cache
      const callbacks = window.__cartCache?.pendingCallbacks || [];

      window.__cartCache = {
        data: emptyResult,
        timestamp: Date.now(),
        fetching: false,
        pendingCallbacks: []
      };

      // Resolve callbacks after cache is updated
      callbacks.forEach(cb => cb(emptyResult));

      return emptyResult;
    } catch (error) {
      console.error('🛒 CartService.getCart error:', {
        message: error.message,
        name: error.name,
        url: fullUrl,
        sessionId: sessionId,
        stack: error.stack?.split('\n').slice(0, 3)
      });

      // For network errors, indicate the specific problem
      if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
        console.error('🌐 Network connectivity issue - check backend server status');
      }

      const errorResult = {
        success: false,
        cart: null,
        items: [],
        error: error.message,
        errorType: error.name
      };

      // Resolve any pending callbacks BEFORE updating cache
      const callbacks = window.__cartCache?.pendingCallbacks || [];

      // Reset fetching state
      if (window.__cartCache) {
        window.__cartCache.fetching = false;
        window.__cartCache.pendingCallbacks = [];
      }

      // Resolve callbacks
      callbacks.forEach(cb => cb(errorResult));

      return errorResult;
    }
  }

  // Add item to cart - simplified to always use session_id approach
  async addItem(productId, quantity = 1, price = 0, selectedOptions = [], storeId) {
    try {
      if (!storeId) {
        console.error('🛒 CartService.addItem: Store ID is required');
        throw new Error('Store ID is required');
      }

      // Fetch product to validate stock before adding to cart
      try {
        const { StorefrontProduct } = await import('@/api/storefront-entities');
        const { isProductOutOfStock, getAvailableQuantity } = await import('@/utils/stockUtils');
        const product = await StorefrontProduct.findById(productId);

        if (product) {
          // Check if product is out of stock
          if (isProductOutOfStock(product)) {
            return {
              success: false,
              error: 'This product is currently out of stock.',
              outOfStock: true
            };
          }

          // Check if requested quantity exceeds available stock
          const availableQty = getAvailableQuantity(product);
          if (availableQty !== Infinity && quantity > availableQty) {
            return {
              success: false,
              error: `Only ${availableQty} items available in stock.`,
              insufficientStock: true,
              availableQuantity: availableQty
            };
          }
        }
      } catch (productError) {
        console.warn('⚠️ Could not validate product stock:', productError.message);
        // Continue with add to cart - let backend handle validation
      }

      const sessionId = this.getSessionId();
      const user = await this.getCurrentUser();

      // CRITICAL FIX: Get existing cart first, then add new item to items array
      const existingCart = await this.getCart(true, storeId);
      const currentItems = existingCart?.items || [];

      // Check if product already exists in cart
      const existingItemIndex = currentItems.findIndex(item =>
        item.product_id === productId &&
        JSON.stringify(item.selected_options || []) === JSON.stringify(selectedOptions)
      );

      let updatedItems;
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + parseInt(quantity)
        };
      } else {
        // Add new item to cart with unique ID
        const newItemId = `item_${productId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        updatedItems = [
          ...currentItems,
          {
            id: newItemId,
            product_id: productId,
            quantity: parseInt(quantity),
            price: parseFloat(price),
            selected_options: selectedOptions
          }
        ];
      }

      const cartData = {
        store_id: storeId,
        items: updatedItems,
        session_id: sessionId
      };

      // Add user_id only if authenticated as admin user (not customer)
      // Customers use session_id only to avoid foreign key constraint issues
      if (user?.id && user?.role !== 'customer') {
        cartData.user_id = user.id;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🛒 CartService.addItem: HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();

      if (result.success) {
        // Extract fresh cart data from the response
        const freshCartData = result.data;
        const cartItems = Array.isArray(freshCartData?.items) ? freshCartData.items :
                         Array.isArray(freshCartData?.dataValues?.items) ? freshCartData.dataValues.items : [];

        // Invalidate cache when cart changes
        invalidateCartCache();

        // Dispatch cart update event with the fresh cart data
        window.dispatchEvent(new CustomEvent('cartUpdated', {
          detail: {
            action: 'add_from_service',
            timestamp: Date.now(),
            source: 'cartService.addItem',
            freshCartData: {
              success: true,
              items: cartItems,
              cart: freshCartData
            }
          }
        }));

        return { success: true, cart: result.data };
      }

      console.error('🛒 CartService.addItem: API returned error:', result.message);
      return { success: false, error: result.message };
    } catch (error) {
      console.error('🛒 CartService.addItem error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update cart (for quantity changes, removals, etc.) - simplified to always use session_id approach
  async updateCart(items, storeId) {
    try {
      const sessionId = this.getSessionId();
      const user = await this.getCurrentUser();

      if (!storeId) {
        throw new Error('Store ID is required');
      }


      const cartData = {
        store_id: storeId,
        items: items,
        session_id: sessionId
      };

      // Add user_id only if authenticated as admin user (not customer)
      // Customers use session_id only to avoid foreign key constraint issues
      if (user?.id && user?.role !== 'customer') {
        cartData.user_id = user.id;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('CartService.updateCart: HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();

      if (result.success) {
        // Extract fresh cart data from the response
        const freshCartData = result.data;
        const cartItems = Array.isArray(freshCartData?.items) ? freshCartData.items :
                         Array.isArray(freshCartData?.dataValues?.items) ? freshCartData.dataValues.items : [];

        // Dispatch cart update event with fresh cart data (same pattern as addItem)
        // Invalidate cache when cart changes
        invalidateCartCache();

        window.dispatchEvent(new CustomEvent('cartUpdated', {
          detail: {
            action: 'update_from_service',
            timestamp: Date.now(),
            source: 'cartService.updateCart',
            freshCartData: {
              success: true,
              items: cartItems,
              cart: freshCartData
            }
          }
        }));

        return { success: true, cart: result.data };
      }

      return { success: false, error: result.message };
    } catch (error) {
      console.error('CartService.updateCart error:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear cart (explicit clearing operation)
  async clearCart(storeId) {
    try {
      // Use updateCart with empty array for explicit clearing
      return await this.updateCartExplicit([], storeId);
    } catch (error) {
      console.error('CartService.clearCart error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update cart without safety checks (for explicit clearing operations)
  async updateCartExplicit(items, storeId) {
    try {
      const sessionId = this.getSessionId();
      const user = await this.getCurrentUser();

      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const cartData = {
        store_id: storeId,
        items: items,
        session_id: sessionId
      };

      // Add user_id only if authenticated as admin user (not customer)
      // Customers use session_id only to avoid foreign key constraint issues
      if (user?.id && user?.role !== 'customer') {
        cartData.user_id = user.id;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('CartService.updateCartExplicit: HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();

      if (result.success) {
        // Extract fresh cart data from the response
        const freshCartData = result.data;
        const cartItems = Array.isArray(freshCartData?.items) ? freshCartData.items :
                         Array.isArray(freshCartData?.dataValues?.items) ? freshCartData.dataValues.items : [];

        // Invalidate cache when cart changes
        invalidateCartCache();

        // Dispatch cart update event with fresh cart data (same pattern as other methods)
        window.dispatchEvent(new CustomEvent('cartUpdated', {
          detail: {
            action: 'update_explicit_from_service',
            timestamp: Date.now(),
            source: 'cartService.updateCartExplicit',
            freshCartData: {
              success: true,
              items: cartItems,
              cart: freshCartData
            }
          }
        }));

        return { success: true, cart: result.data };
      }

      return { success: false, error: result.message };
    } catch (error) {
      console.error('CartService.updateCartExplicit error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new CartService();