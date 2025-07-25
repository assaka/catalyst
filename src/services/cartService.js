// Simplified Cart Service
class CartService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://catalyst-backend-fzhu.onrender.com';
    this.endpoint = `${this.baseURL}/api/cart`;
    this.isAddingItem = false;
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

      // Set flag to prevent updates while adding
      this.isAddingItem = true;

      const sessionId = this.getSessionId();
      console.log('🛒 CartService.addItem: Using session_id approach:', sessionId);

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
        
        // Small delay to ensure event propagates and clear flag
        setTimeout(() => {
          console.log('🛒 CartService.addItem: Dispatching delayed cartUpdated event');
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          this.isAddingItem = false;
        }, 500);
        
        return { success: true, cart: result.data };
      }

      console.error('🛒 CartService.addItem: API returned error:', result.message);
      this.isAddingItem = false;
      return { success: false, error: result.message };
    } catch (error) {
      console.error('🛒 CartService.addItem error:', error);
      this.isAddingItem = false;
      return { success: false, error: error.message };
    }
  }

  // Update cart (for quantity changes, removals, etc.) - simplified to always use session_id approach
  async updateCart(items, storeId) {
    try {
      // Don't update cart while adding items
      if (this.isAddingItem) {
        console.log('🛒 CartService.updateCart: Skipping update - item is being added');
        return { success: true, cart: null };
      }

      const sessionId = this.getSessionId();

      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const cartData = {
        store_id: storeId,
        items: items,
        session_id: sessionId // Always use session_id for simplicity
      };

      console.log('🛒 CartService.updateCart: Updating cart:', cartData);
      console.log('🛒 CartService.updateCart: Items count:', items?.length || 0);
      console.log('🛒 CartService.updateCart: Items detail:', JSON.stringify(items));

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