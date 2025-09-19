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
      console.log('🆔 CartService: Created new guest_session_id:', sessionId);
    } else {
      console.log('🆔 CartService: Using existing guest_session_id:', sessionId);
    }

    // Also check for old cart_session_id and log if it exists
    const oldSessionId = localStorage.getItem('cart_session_id');
    if (oldSessionId) {
      console.log('⚠️ CartService: Found old cart_session_id in localStorage:', oldSessionId);
    }

    return sessionId;
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { User } = await import('@/api/entities');
      const user = await User.me();
      return user;
    } catch (error) {
      return null;
    }
  }

  // Get cart - simplified to always use session_id approach with smart caching
  async getCart() {
    try {
      const sessionId = this.getSessionId();

      const params = new URLSearchParams();
      params.append('session_id', sessionId);

      const fullUrl = `${this.endpoint}?${params.toString()}`;

      // Reduced logging for performance
      if (process.env.NODE_ENV === 'development') {
        console.log('🛒 CartService.getCart: Session ID:', sessionId);
      }

      // Use short cache for cart data (30 seconds) to balance freshness and performance
      const response = await fetch(fullUrl, {
        cache: 'default',
        headers: {
          'Cache-Control': 'max-age=30'
        }
      });

      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🛒 CartService.getCart: Response not ok:', response.status);
        }
        return { success: false, cart: null, items: [] };
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Handle both direct data.items and data.dataValues.items structures
        const cartData = result.data.dataValues || result.data;
        const items = Array.isArray(cartData.items) ? cartData.items : [];

        if (process.env.NODE_ENV === 'development') {
          console.log('🛒 CartService.getCart: Found cart with items:', items.length);
        }

        return {
          success: true,
          cart: cartData,
          items: items
        };
      }
      return { success: false, cart: null, items: [] };
    } catch (error) {
      console.error('🛒 CartService.getCart error:', error);
      return { success: false, cart: null, items: [] };
    }
  }

  // Add item to cart - simplified to always use session_id approach
  async addItem(productId, quantity = 1, price = 0, selectedOptions = [], storeId) {
    try {
      if (!storeId) {
        console.error('🛒 CartService.addItem: Store ID is required');
        throw new Error('Store ID is required');
      }

      const sessionId = this.getSessionId();

      const cartData = {
        store_id: storeId,
        product_id: productId,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        selected_options: selectedOptions,
        session_id: sessionId // Always use session_id for simplicity
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🛒 CartService.addItem: Adding product:', productId);
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
        if (process.env.NODE_ENV === 'development') {
          console.log('🛒 CartService.addItem: Successfully added item');
        }

        // Dispatch cart update event with detailed information
        const updateEvent = new CustomEvent('cartUpdated', {
          detail: {
            action: 'add_from_service',
            timestamp: Date.now(),
            source: 'cartService.addItem'
          }
        });
        window.dispatchEvent(updateEvent);

        // Also dispatch a more specific MiniCart refresh event
        window.dispatchEvent(new CustomEvent('refreshMiniCart', {
          detail: { source: 'cartService.addItem', timestamp: Date.now() }
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

      if (!storeId) {
        throw new Error('Store ID is required');
      }


      const cartData = {
        store_id: storeId,
        items: items,
        session_id: sessionId // Always use session_id for simplicity
      };

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
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
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

      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const cartData = {
        store_id: storeId,
        items: items,
        session_id: sessionId
      };

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
        window.dispatchEvent(new CustomEvent('cartUpdated'));
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