/**
 * Slot State Manager
 * Manages state and interactions between slots
 */

class SlotStateManager {
  constructor(initialState = {}) {
    this.state = {
      selectedOptions: [],
      quantity: 1,
      activeTab: 0,
      totalPrice: 0,
      ...initialState
    };
    this.listeners = new Map();
    this.slotInstances = new Map();
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state and notify listeners
   */
  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Notify all listeners
    this.listeners.forEach((callback, key) => {
      callback(this.state, prevState);
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    this.listeners.set(key, callback);
    return () => this.listeners.delete(key);
  }

  /**
   * Register a slot instance
   */
  registerSlot(slotId, instance) {
    this.slotInstances.set(slotId, instance);
  }

  /**
   * Get slot instance
   */
  getSlot(slotId) {
    return this.slotInstances.get(slotId);
  }

  /**
   * Calculate total price based on product and selected options
   */
  calculateTotalPrice(product, selectedOptions, quantity) {
    let basePrice = product.compare_price ? parseFloat(product.compare_price) : parseFloat(product.price || 0);
    let optionsPrice = 0;

    // Add option prices
    selectedOptions.forEach(option => {
      if (option.price_modifier) {
        optionsPrice += parseFloat(option.price_modifier);
      }
    });

    const totalPrice = (basePrice + optionsPrice) * quantity;
    return totalPrice;
  }

  /**
   * Handle option selection
   */
  handleOptionChange(optionId, value, priceModifier = 0) {
    const selectedOptions = [...this.state.selectedOptions];
    const existingIndex = selectedOptions.findIndex(opt => opt.option_id === optionId);

    if (existingIndex >= 0) {
      if (value) {
        // Update existing option
        selectedOptions[existingIndex] = {
          option_id: optionId,
          option_value: value,
          price_modifier: priceModifier
        };
      } else {
        // Remove option
        selectedOptions.splice(existingIndex, 1);
      }
    } else if (value) {
      // Add new option
      selectedOptions.push({
        option_id: optionId,
        option_value: value,
        price_modifier: priceModifier
      });
    }

    this.setState({ selectedOptions });
  }

  /**
   * Handle quantity change
   */
  handleQuantityChange(newQuantity) {
    const quantity = Math.max(1, parseInt(newQuantity) || 1);
    this.setState({ quantity });
  }

  /**
   * Handle tab change
   */
  handleTabChange(tabIndex) {
    this.setState({ activeTab: tabIndex });
  }

  /**
   * Handle add to cart
   */
  handleAddToCart(product, addToCartFunction) {
    const { selectedOptions, quantity } = this.state;

    if (addToCartFunction) {
      addToCartFunction({
        product,
        quantity,
        selectedOptions
      });
    }
  }

  /**
   * Initialize state from product context
   */
  initializeFromProduct(productContext) {
    const { product } = productContext;
    if (!product) return;

    const totalPrice = this.calculateTotalPrice(product, this.state.selectedOptions, this.state.quantity);

    this.setState({
      totalPrice,
      productId: product.id
    });
  }

  /**
   * Update total price when state changes
   */
  updateTotalPrice(product) {
    if (!product) return;

    const totalPrice = this.calculateTotalPrice(product, this.state.selectedOptions, this.state.quantity);
    this.setState({ totalPrice });
  }
}

// Global state manager instance
export const globalSlotState = new SlotStateManager();

// Hook for React components
export function useSlotState() {
  const [state, setState] = React.useState(globalSlotState.getState());

  React.useEffect(() => {
    const unsubscribe = globalSlotState.subscribe('react-hook', (newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return [state, globalSlotState];
}

export default SlotStateManager;