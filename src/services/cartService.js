// Simplified Cart Service
class CartService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
    this.endpoint = `${this.baseURL}/api/cart`;
  }

  // Get session ID consistently
  getSessionId() {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { User } = await import('@/api/entities');
      const user = await User.me();
      console.log('🛒 CartService.getCurrentUser: User found:', user?.id || 'null');
      return user;
    } catch (error) {
      console.log('🛒 CartService.getCurrentUser: No user (guest mode)');
      return null;
    }
  }

  // Get cart - simplified to always use session_id approach
  async getCart() {
    try {
      const sessionId = this.getSessionId();
      
      const params = new URLSearchParams();
      params.append('session_id', sessionId);

      console.log('🛒 CartService.getCart: Fetching cart with session_id:', sessionId);
      console.log('🛒 CartService.getCart: Full URL:', `${this.endpoint}?${params.toString()}`);
      
      const response = await fetch(`${this.endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        console.error('🛒 CartService.getCart: HTTP error:', response.status);
        return { success: false, cart: null, items: [] };
      }
      
      const result = await response.json();
      console.log('🛒 CartService.getCart: Response:', result);
      
      if (result.success && result.data) {
        return {
          success: true,
          cart: result.data,
          items: Array.isArray(result.data.items) ? result.data.items : []
        };
      }
      
      return { success: false, cart: null, items: [] };
    } catch (error) {
      console.error('CartService.getCart error:', error);
      return { success: false, cart: null, items: [] };
    }
  }

  // Add item to cart - simplified to always use session_id approach
  async addItem(productId, quantity = 1, price = 0, selectedOptions = [], storeId) {
    try {
      console.log('🛒 CartService.addItem: Starting with params:', {
        productId, quantity, price, selectedOptions, storeId
      });

      if (!storeId) {
        console.error('🛒 CartService.addItem: Store ID is required');
        throw new Error('Store ID is required');
      }


      const sessionId = this.getSessionId();
      console.log('🛒 CartService.addItem: Using session_id approach:', sessionId);
      console.log('🛒 CartService.addItem: Current localStorage session_id:', localStorage.getItem('cart_session_id'));

      const cartData = {
        store_id: storeId,
        product_id: productId,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        selected_options: selectedOptions,
        session_id: sessionId // Always use session_id for simplicity
      };

      console.log('🛒 CartService.addItem: Final cart data:', cartData);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      console.log('🛒 CartService.addItem: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🛒 CartService.addItem: HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('🛒 CartService.addItem: Response data:', result);
      console.log('🛒 CartService.addItem: Cart items in response:', result.data?.items);

      if (result.success) {
        // Dispatch cart update event
        console.log('🛒 CartService.addItem: Dispatching cartUpdated event');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
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

      // Prevent updating cart with empty items unless explicitly clearing
      if (!items || (Array.isArray(items) && items.length === 0)) {
        console.warn('🛒 CartService.updateCart: Preventing update with empty items array');
        // Get current cart to verify if it's actually empty
        const currentCart = await this.getCart();
        if (currentCart.success && currentCart.items && currentCart.items.length > 0) {
          console.error('🛒 CartService.updateCart: Attempted to clear non-empty cart - blocking update');
          return { success: false, error: 'Cannot update cart with empty items when cart has items' };
        }
      }

      const cartData = {
        store_id: storeId,
        items: items,
        session_id: sessionId // Always use session_id for simplicity
      };

      console.log('🛒 CartService.updateCart: Updating cart:', cartData);
      console.log('🛒 CartService.updateCart: Items count:', items?.length || 0);
      console.log('🛒 CartService.updateCart: Items detail:', JSON.stringify(items));
      console.log('🛒 CartService.updateCart: Session ID:', sessionId);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🛒 CartService.updateCart: HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('🛒 CartService.updateCart: Response:', result);

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

      console.log('🛒 CartService.updateCartExplicit: Explicit update with:', cartData);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🛒 CartService.updateCartExplicit: HTTP error:', response.status, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      const result = await response.json();
      console.log('🛒 CartService.updateCartExplicit: Response:', result);

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