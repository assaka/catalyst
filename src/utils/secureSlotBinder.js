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
      selectedOptions: [],
      quantity: 1,
      activeTab: 0,
      totalPrice: 0
    };
    this.listeners = [];
    this.boundElements = new WeakSet();
  }

  /**
   * Initialize controller and bind to DOM elements
   */
  initialize() {
    this.calculateInitialPrice();
    this.updateStockDisplay();
    this.bindAllElements();
  }

  /**
   * Bind JavaScript functionality to all elements with data-action attributes
   */
  bindAllElements() {
    // Find all elements with data-action attributes
    const actionElements = document.querySelectorAll('[data-action]');

    actionElements.forEach(element => {
      if (this.boundElements.has(element)) return; // Already bound

      const action = element.getAttribute('data-action');
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

    element.addEventListener('click', () => {
      const targetElement = document.querySelector(target);
      if (targetElement) {
        const currentValue = parseInt(targetElement.value || targetElement.textContent) || 0;
        const newValue = currentValue + 1;
        this.updateQuantity(newValue);
      }
    });
  }

  /**
   * Bind decrement functionality
   */
  bindDecrement(element) {
    const target = element.getAttribute('data-target') || '[data-bind="quantity"]';

    element.addEventListener('click', () => {
      const targetElement = document.querySelector(target);
      if (targetElement) {
        const currentValue = parseInt(targetElement.value || targetElement.textContent) || 0;
        const newValue = Math.max(1, currentValue - 1);
        this.updateQuantity(newValue);
      }
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

    const basePrice = product.compare_price ?
      parseFloat(product.compare_price) :
      parseFloat(product.price || 0);

    let optionsPrice = 0;
    this.state.selectedOptions.forEach(option => {
      optionsPrice += parseFloat(option.price_modifier || 0);
    });

    this.state.totalPrice = (basePrice + optionsPrice) * this.state.quantity;
  }

  /**
   * Update all price displays
   */
  updatePriceDisplays() {
    const currency = this.productContext.settings?.currency_symbol || '$';

    // Update total price displays
    document.querySelectorAll('[data-bind="total-price"]').forEach(el => {
      el.textContent = `${currency}${this.state.totalPrice.toFixed(2)}`;
    });

    // Update options price if different from base price
    const product = this.productContext.product;
    const basePrice = product?.compare_price ?
      parseFloat(product.compare_price) :
      parseFloat(product?.price || 0);

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
   * Helper function to get stock label based on settings and quantity
   */
  getStockLabel(product, settings) {
    // Check if stock labels should be shown at all
    const showStockLabel = settings?.stock_settings?.show_stock_label !== false;
    if (!showStockLabel) return null;

    // Default behavior if no stock settings are found
    if (!settings?.stock_settings) {
      if (product.stock_quantity <= 0 && !product.infinite_stock) {
        return "Out of Stock";
      }
      return "In Stock";
    }

    const stockSettings = settings.stock_settings;

    // Handle infinite stock
    if (product.infinite_stock) {
      const label = stockSettings.in_stock_label || "In Stock";
      // Remove quantity placeholder if present, as it's not applicable
      // Updated regex to handle {({quantity})} format
      return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
    }

    // Handle out of stock
    if (product.stock_quantity <= 0) {
      return stockSettings.out_of_stock_label || "Out of Stock";
    }

    // Check if stock quantity should be hidden
    const hideStockQuantity = settings?.hide_stock_quantity === true;

    // Handle low stock
    const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
    if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
      const label = stockSettings.low_stock_label || "Low stock, just {quantity} left";
      if (hideStockQuantity) {
        // Remove quantity placeholder and any parentheses with numbers when hiding stock quantity
        // Updated regex to handle {({quantity})} format
        return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
      }
      // Replace {quantity} or ({quantity}) with actual number - handle both formats
      // Updated to handle {({quantity})} pattern and ({quantity}) pattern
      return label.replace(/\{\(\{quantity\}\)\}|\(\{quantity\}\)|\{quantity\}/g, (match) => {
        if (match === '{({quantity})}') {
          return `(${product.stock_quantity})`;
        }
        if (match === '({quantity})') {
          return `(${product.stock_quantity})`;
        }
        return match.includes('(') ? `(${product.stock_quantity})` : product.stock_quantity.toString();
      });
    }

    // Handle regular in stock
    const label = stockSettings.in_stock_label || "In Stock";
    if (hideStockQuantity) {
      // Remove quantity placeholder and any parentheses with numbers when hiding stock quantity
      // Updated regex to handle {({quantity})} format
      return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
    }
    // Replace {quantity} or ({quantity}) with actual number - handle both formats
    // Updated to handle {({quantity})} pattern and ({quantity}) pattern
    return label.replace(/\{\(\{quantity\}\)\}|\(\{quantity\}\)|\{quantity\}/g, (match) => {
      if (match === '{({quantity})}') {
        return `(${product.stock_quantity})`;
      }
      if (match === '({quantity})') {
        return `(${product.stock_quantity})`;
      }
      return match.includes('(') ? `(${product.stock_quantity})` : product.stock_quantity.toString();
    });
  }

  /**
   * Helper function to get stock variant (for styling)
   */
  getStockVariant(product, settings) {
    if (product.infinite_stock) return "outline";
    if (product.stock_quantity <= 0) return "destructive";

    const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
    if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
      return "secondary"; // Warning color for low stock
    }

    return "outline"; // Default for in stock
  }

  /**
   * Update stock display elements
   */
  updateStockDisplay() {
    const { product, settings } = this.productContext;
    if (!product) return;

    const stockLabel = this.getStockLabel(product, settings);
    const stockVariant = this.getStockVariant(product, settings);

    console.log('ProductDetailController updating stock display:', {
      stockLabel,
      stockVariant,
      foundElements: document.querySelectorAll('[data-bind="stock-status"]').length,
      productStockQuantity: product.stock_quantity,
      lowStockThreshold: product.low_stock_threshold || settings?.display_low_stock_threshold
    });

    // Update all stock status displays
    document.querySelectorAll('[data-bind="stock-status"]').forEach(el => {
      if (stockLabel) {
        el.textContent = stockLabel;
        el.classList.remove('hidden');

        // Apply styling based on variant
        el.classList.remove('bg-green-100', 'text-green-800', 'bg-yellow-100', 'text-yellow-800', 'bg-red-100', 'text-red-800');

        if (stockVariant === 'destructive') {
          el.classList.add('bg-red-100', 'text-red-800');
        } else if (stockVariant === 'secondary') {
          el.classList.add('bg-yellow-100', 'text-yellow-800');
        } else {
          el.classList.add('bg-green-100', 'text-green-800');
        }
      } else {
        el.classList.add('hidden');
      }
    });
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
  const controller = new ProductDetailController(productContext);
  controller.initialize();

  return controller;
}

export default {
  ProductDetailController,
  initializeProductSlotBinding
};