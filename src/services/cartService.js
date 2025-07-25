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
      return await User.me();
    } catch (error) {
      return null;
    }
  }

  // Get cart
  async getCart() {
    try {
      const user = await this.getCurrentUser();
      const sessionId = this.getSessionId();
      
      const params = new URLSearchParams();
      if (user?.id) {
        params.append('user_id', user.id);
      } else {
        params.append('session_id', sessionId);
      }

      console.log('🛒 CartService.getCart: Fetching cart with params:', params.toString());
      
      const response = await fetch(`${this.endpoint}?${params.toString()}`);
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

  // Add item to cart
  async addItem(productId, quantity = 1, price = 0, selectedOptions = [], storeId) {
    try {
      const user = await this.getCurrentUser();
      const sessionId = this.getSessionId();

      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const cartData = {
        store_id: storeId,
        product_id: productId,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        selected_options: selectedOptions
      };

      if (user?.id) {
        cartData.user_id = user.id;
      } else {
        cartData.session_id = sessionId;
      }

      console.log('🛒 CartService.addItem: Adding item:', cartData);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      const result = await response.json();
      console.log('🛒 CartService.addItem: Response:', result);

      if (result.success) {
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return { success: true, cart: result.data };
      }

      return { success: false, error: result.message };
    } catch (error) {
      console.error('CartService.addItem error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update cart (for quantity changes, removals, etc.)
  async updateCart(items, storeId) {
    try {
      const user = await this.getCurrentUser();
      const sessionId = this.getSessionId();

      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const cartData = {
        store_id: storeId,
        items: items
      };

      if (user?.id) {
        cartData.user_id = user.id;
      } else {
        cartData.session_id = sessionId;
      }

      console.log('🛒 CartService.updateCart: Updating cart:', cartData);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

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

  // Clear cart
  async clearCart() {
    try {
      const sessionId = this.getSessionId();
      
      const response = await fetch(`${this.endpoint}?session_id=${sessionId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return { success: true };
      }

      return { success: false, error: result.message };
    } catch (error) {
      console.error('CartService.clearCart error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new CartService();