/**
 * Secure Slot Binding System
 * Binds centralized JavaScript functionality to slots via data attributes
 */

/**
 * Central JavaScript controller for ProductDetail
 * All interactive logic lives here, slots just define HTML structure
 */
export class ProductDetailController {
  constructor(productContext) {
    this.productContext = productContext;
    this.state = {
      selectedOptions: productContext.selectedOptions || [],
      quantity: productContext.quantity || 1,
      activeTab: productContext.activeTab || 0,
      totalPrice: 0
    };
    this.listeners = [];
    this.boundElements = new WeakSet();
  }

  /**
   * Initialize controller and bind to DOM elements
   */
  initialize() {
    console.log('🚀 ProductDetailController initialize called', { product: this.productContext?.product?.name, hasSettings: !!this.productContext?.settings });
    this.calculateInitialPrice();
    this.calculateTotalPrice();
    this.updatePriceDisplays();
    this.bindAllElements();
    console.log('✅ ProductDetailController initialization complete');
  }

  /**
   * Bind JavaScript functionality to all elements with data-action attributes
   */
  bindAllElements() {
    // Find all elements with data-action attributes
    const actionElements = document.querySelectorAll('[data-action]');
    console.log('🔗 SecureSlotBinder: Found elements with data-action:', actionElements.length);

    // Log quantity-specific elements
    const quantityElements = document.querySelectorAll('[data-action*="quantity"], [data-action="increment"], [data-action="decrement"]');
    console.log('🔗 SecureSlotBinder: Found quantity-related elements:', quantityElements.length);

    actionElements.forEach(element => {
      if (this.boundElements.has(element)) return; // Already bound

      const action = element.getAttribute('data-action');
      console.log('🔗 SecureSlotBinder: Binding action:', action, 'to element:', element.tagName);
      this.bindElementAction(element, action);
      this.boundElements.add(element);
    });
  }

  /**
   * Bind specific action to an element
   */
  bindElementAction(element, action) {
    switch (action) {
      case 'increment':
        this.bindIncrement(element);
        break;
      case 'decrement':
        this.bindDecrement(element);
        break;
      case 'change-quantity':
        this.bindQuantityChange(element);
        break;
      case 'select-option':
        this.bindOptionSelect(element);
        break;
      case 'switch-tab':
        this.bindTabSwitch(element);
        break;
      case 'add-to-cart':
        this.bindAddToCart(element);
        break;
      case 'add-to-wishlist':
        this.bindAddToWishlist(element);
        break;
      case 'toggle':
        this.bindToggle(element);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Bind increment functionality
   */
  bindIncrement(element) {
    const target = element.getAttribute('data-target') || '[data-bind="quantity"]';
    console.log('🔗 SecureSlotBinder: Binding increment button, target:', target);

    element.addEventListener('click', () => {
      console.log('➕ SecureSlotBinder: Increment button clicked!');
      // Use React state as source of truth instead of DOM
      const currentValue = this.productContext.quantity || 1;
      const newValue = currentValue + 1;
      console.log('➕ SecureSlotBinder: Incrementing from', currentValue, 'to', newValue);
      this.updateQuantity(newValue);
    });
  }

  /**
   * Bind decrement functionality
   */
  bindDecrement(element) {
    const target = element.getAttribute('data-target') || '[data-bind="quantity"]';
    console.log('🔗 SecureSlotBinder: Binding decrement button, target:', target);

    element.addEventListener('click', () => {
      console.log('➖ SecureSlotBinder: Decrement button clicked!');
      // Use React state as source of truth instead of DOM
      const currentValue = this.productContext.quantity || 1;
      const newValue = Math.max(1, currentValue - 1);
      console.log('➖ SecureSlotBinder: Decrementing from', currentValue, 'to', newValue);
      this.updateQuantity(newValue);
    });
  }

  /**
   * Bind quantity change functionality
   */
  bindQuantityChange(element) {
    element.addEventListener('change', (e) => {
      const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
      this.updateQuantity(newQuantity);
    });

    element.addEventListener('input', (e) => {
      const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
      e.target.value = newQuantity; // Prevent invalid values
    });
  }

  /**
   * Bind option selection functionality
   */
  bindOptionSelect(element) {
    const optionId = element.getAttribute('data-option');

    element.addEventListener('change', (e) => {
      const value = e.target.value;
      const priceModifier = parseFloat(element.getAttribute('data-price')) || 0;

      this.updateOption(optionId, value, priceModifier);
    });
  }

  /**
   * Bind tab switching functionality
   */
  bindTabSwitch(element) {
    const tabIndex = parseInt(element.getAttribute('data-tab')) || 0;

    element.addEventListener('click', () => {
      this.switchTab(tabIndex);
    });
  }

  /**
   * Bind add to cart functionality
   */
  bindAddToCart(element) {
    element.addEventListener('click', () => {
      this.addToCart();
    });
  }

  /**
   * Bind add to wishlist functionality
   */
  bindAddToWishlist(element) {
    element.addEventListener('click', () => {
      this.addToWishlist();
    });
  }

  /**
   * Bind toggle functionality
   */
  bindToggle(element) {
    const target = element.getAttribute('data-target');

    element.addEventListener('click', () => {
      if (target) {
        const targetElement = document.querySelector(target);
        if (targetElement) {
          targetElement.classList.toggle('hidden');
        }
      }
    });
  }

  /**
   * Update quantity and recalculate price
   */
  updateQuantity(newQuantity) {
    this.state.quantity = newQuantity;

    // Update React state if available
    if (this.productContext.setQuantity) {
      console.log('🔄 SecureSlotBinder: Calling setQuantity with:', newQuantity);
      this.productContext.setQuantity(newQuantity);
    } else {
      console.warn('⚠️ SecureSlotBinder: setQuantity not available in productContext');
    }

    // Update all quantity displays
    document.querySelectorAll('[data-bind="quantity"]').forEach(el => {
      if (el.tagName === 'INPUT') {
        el.value = newQuantity;
      } else {
        el.textContent = newQuantity;
      }
    });

    this.calculateTotalPrice();
    this.updatePriceDisplays();
  }

  /**
   * Update selected option
   */
  updateOption(optionId, value, priceModifier) {
    const existingIndex = this.state.selectedOptions.findIndex(opt => opt.option_id === optionId);

    if (existingIndex >= 0) {
      if (value) {
        this.state.selectedOptions[existingIndex] = {
          option_id: optionId,
          option_value: value,
          price_modifier: priceModifier
        };
      } else {
        this.state.selectedOptions.splice(existingIndex, 1);
      }
    } else if (value) {
      this.state.selectedOptions.push({
        option_id: optionId,
        option_value: value,
        price_modifier: priceModifier
      });
    }

    // Update React state if available (this will trigger a re-render)
    if (this.productContext.setSelectedOptions) {
      this.productContext.setSelectedOptions([...this.state.selectedOptions]);
    }

    this.calculateTotalPrice();
    this.updatePriceDisplays();
  }

  /**
   * Switch active tab
   */
  switchTab(tabIndex) {
    this.state.activeTab = tabIndex;

    // Update tab navigation
    document.querySelectorAll('[data-bind="tab-nav"]').forEach((nav, index) => {
      nav.classList.toggle('active', index === tabIndex);
    });

    // Update tab content
    document.querySelectorAll('[data-bind="tab-content"]').forEach((content, index) => {
      content.classList.toggle('hidden', index !== tabIndex);
    });
  }

  /**
   * Calculate initial price
   */
  calculateInitialPrice() {
    const product = this.productContext.product;
    if (!product) return;

    const basePrice = product.compare_price ?
      parseFloat(product.compare_price) :
      parseFloat(product.price || 0);

    this.state.totalPrice = basePrice * this.state.quantity;
  }

  /**
   * Calculate total price including options
   */
  calculateTotalPrice() {
    const product = this.productContext.product;
    if (!product) return;

    // Use the lower price (sale price) if compare_price exists and is different
    let basePrice = parseFloat(product.price);
    if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
      basePrice = Math.min(parseFloat(product.price), parseFloat(product.compare_price));
    }

    let optionsPrice = 0;
    this.state.selectedOptions.forEach(option => {
      optionsPrice += parseFloat(option.price_modifier || 0);
    });

    this.state.totalPrice = (basePrice + optionsPrice) * this.state.quantity;
  }

  /**
   * Update all price displays (simplified - React components handle most of this now)
   */
  updatePriceDisplays() {
    // Most price display logic is now handled by React components
    // This method kept for legacy DOM-based price displays if any exist

    const currency = this.productContext.settings?.currency_symbol || '$';

    // Update any legacy total price displays that might still exist
    document.querySelectorAll('[data-bind="total-price"]').forEach(el => {
      el.textContent = `${currency}${this.state.totalPrice.toFixed(2)}`;
    });

    // Legacy support for has-options binding (kept for backward compatibility)
    const product = this.productContext.product;
    const basePrice = parseFloat(product?.price || 0);
    if (this.state.totalPrice !== basePrice * this.state.quantity) {
      document.querySelectorAll('[data-bind="has-options"]').forEach(el => {
        el.classList.remove('hidden');
      });
    } else {
      document.querySelectorAll('[data-bind="has-options"]').forEach(el => {
        el.classList.add('hidden');
      });
    }
  }

  /**
   * Add to cart
   */
  addToCart() {
    const { product } = this.productContext;

    if (this.productContext.handleAddToCart) {
      this.productContext.handleAddToCart({
        product,
        quantity: this.state.quantity,
        selectedOptions: this.state.selectedOptions,
        totalPrice: this.state.totalPrice
      });
    }
  }

  /**
   * Add to wishlist
   */
  addToWishlist() {
    const { product } = this.productContext;

    if (this.productContext.handleWishlistToggle) {
      this.productContext.handleWishlistToggle(product);
    }
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
    this.boundElements = new WeakSet();
  }
}

/**
 * Initialize secure slot binding for a product page
 */
export function initializeProductSlotBinding(productContext) {
  console.log('🔧 initializeProductSlotBinding called with context:', {
    timestamp: new Date().toISOString(),
    hasProduct: !!productContext.product,
    hasSetQuantity: !!productContext.setQuantity,
    hasSetSelectedOptions: !!productContext.setSelectedOptions,
    currentQuantity: productContext.quantity,
    selectedOptionsCount: productContext.selectedOptions?.length || 0
  });

  const controller = new ProductDetailController(productContext);
  controller.initialize();

  return controller;
}

export default {
  ProductDetailController,
  initializeProductSlotBinding
};