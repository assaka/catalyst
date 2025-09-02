/**
 * CartSlots.jsx - SINGLE FILE FOR STORE OWNERS
 * 
 * This is the ONLY file you need to edit to customize your cart page.
 * Everything is in one place: components, layouts, and slot definitions.
 * 
 * 🎯 DRAG & DROP: Change the order in "slotOrder" arrays
 * 🎨 LAYOUTS: Choose layouts for each section  
 * 📱 RESPONSIVE: Different layouts for mobile/desktop
 * ✨ MICRO-SLOTS: Rearrange elements within cart items
 * 🧩 COMPONENTS: Modify components directly in this file
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';
import { formatDisplayPrice } from '@/utils/priceUtils';
import { getStoreBaseUrl, getExternalStoreUrl } from '@/utils/urlUtils';
import SlotWrapper from '@/core/slot-system/SlotWrapper.jsx';

// =============================================================================
// 🧩 SLOT COMPONENTS (Store owners can modify these - prefixed with 'Slot')
// =============================================================================

// Slot: Cart page container
export const SlotCartPageContainer = ({ children, className = "bg-gray-50 cart-page" }) => (
  <div className={className}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {children}
    </div>
  </div>
);

// Slot: Cart page header
export const SlotCartPageHeader = ({ title = "Your Cart", className = "text-3xl font-bold text-gray-900 mb-8" }) => (
  <h1 className={className}>{title}</h1>
);

// Slot: Empty cart display
export const SlotEmptyCartDisplay = ({ 
  store, 
  icon: Icon = ShoppingCart,
  title = "Your cart is empty",
  message = "Looks like you haven't added anything to your cart yet.",
  buttonText = "Continue Shopping"
}) => (
  <Card>
    <CardContent className="text-center py-12">
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <Button onClick={() => {
        const baseUrl = getStoreBaseUrl(store);
        window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
      }}>
        {buttonText}
      </Button>
    </CardContent>
  </Card>
);

// Slot: Cart items container
export const SlotCartItemsContainer = ({ children, className = "lg:col-span-2" }) => (
  <div className={className}>
    <Card>
      <CardContent className="px-4 divide-y divide-gray-200">
        {children}
      </CardContent>
    </Card>
  </div>
);

// Slot: Individual cart item
export const SlotCartItem = ({ 
  item, 
  product, 
  currencySymbol = '$', 
  store = {}, 
  taxes = null, 
  selectedCountry = null,
  onUpdateQuantity = () => {}, 
  onRemove = () => {},
  calculateItemTotal = () => 0,
  formatPrice = (price) => parseFloat(price) || 0
}) => {
  if (!product) return null;

  // Logic for basePrice for display
  let basePriceForDisplay;
  const itemPriceAsNumber = formatPrice(item.price);

  if (itemPriceAsNumber > 0) {
    basePriceForDisplay = itemPriceAsNumber;
  } else {
    let productCurrentPrice = formatPrice(product.sale_price || product.price);
    const comparePrice = formatPrice(product.compare_price);
    if (comparePrice > 0 && comparePrice < productCurrentPrice) {
      basePriceForDisplay = comparePrice;
    } else {
      basePriceForDisplay = productCurrentPrice;
    }
  }

  const itemTotal = calculateItemTotal(item, product);

  return (
    <div className="flex items-center space-x-4 py-6 border-b border-gray-200">
      <img 
        src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'} 
        alt={product.name}
        className="w-20 h-20 object-cover rounded-lg"
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-gray-600">
          {formatDisplayPrice(basePriceForDisplay, currencySymbol, store, taxes, selectedCountry)} each
        </p>
        
        {item.selected_options && item.selected_options.length > 0 && (
          <div className="text-sm text-gray-500 mt-1">
            {item.selected_options.map((option, idx) => (
              <div key={idx}>
                + {option.name} (+{formatDisplayPrice(option.price, currencySymbol, store, taxes, selectedCountry)})
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center space-x-3 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold">{item.quantity || 1}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemove(item.id)}
            className="ml-auto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold">
          {formatDisplayPrice(itemTotal, currencySymbol, store, taxes, selectedCountry)}
        </p>
      </div>
    </div>
  );
};

// Slot: Cart sidebar container
export const SlotCartSidebar = ({ children, className = "lg:col-span-1 space-y-6 mt-8 lg:mt-0" }) => (
  <div className={className}>
    {children}
  </div>
);

// Slot: Coupon section
export const SlotCouponSection = ({ 
  appliedCoupon, 
  couponCode = '', 
  onCouponCodeChange = () => {}, 
  onApplyCoupon = () => {}, 
  onRemoveCoupon = () => {}, 
  onKeyPress = () => {},
  currencySymbol = '$',
  safeToFixed = (val) => val?.toFixed(2) || '0.00'
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Apply Coupon</CardTitle>
    </CardHeader>
    <CardContent>
      {!appliedCoupon ? (
        <div className="flex space-x-2">
          <Input 
            placeholder="Enter coupon code" 
            value={couponCode || ''}
            onChange={(e) => onCouponCodeChange && onCouponCodeChange(e.target.value.toUpperCase())}
            onKeyPress={onKeyPress}
          />
          <Button 
            onClick={onApplyCoupon}
            disabled={!couponCode || !couponCode.trim()}
          >
            <Tag className="w-4 h-4 mr-2" /> Apply
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
          <div>
            <p className="text-sm font-medium text-green-800">Applied: {appliedCoupon.name}</p>
            <p className="text-xs text-green-600">
              {appliedCoupon.discount_type === 'fixed' 
                ? `${currencySymbol}${safeToFixed(appliedCoupon.discount_value)} off`
                : `${safeToFixed(appliedCoupon.discount_value)}% off`
              }
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRemoveCoupon}
            className="text-red-600 hover:text-red-800"
          >
            Remove
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

// Slot: Order summary
export const SlotOrderSummary = ({ 
  subtotal = 0, 
  discount = 0, 
  tax = 0, 
  total = 0, 
  currencySymbol = '$', 
  safeToFixed = (val) => val?.toFixed(2) || '0.00',
  children
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Order Summary</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{currencySymbol}{safeToFixed(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between">
          <span>Discount</span>
          <span className="text-green-600">-{currencySymbol}{safeToFixed(discount)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Tax</span>
        <span>{currencySymbol}{safeToFixed(tax)}</span>
      </div>
      {children} {/* For CMS blocks above total */}
      <div className="flex justify-between text-lg font-semibold border-t pt-4">
        <span>Total</span>
        <span>{currencySymbol}{safeToFixed(total)}</span>
      </div>
    </CardContent>
  </Card>
);

// Slot: Checkout button
export const SlotCheckoutButton = ({ 
  onCheckout, 
  settings,
  text = "Proceed to Checkout",
  className = "w-full",
  size = "lg"
}) => (
  <div className="border-t mt-6 pt-6">
    <Button 
      size={size} 
      className={className}
      onClick={onCheckout}
      style={{
        backgroundColor: settings?.theme?.checkout_button_color || '#007bff',
        color: '#f00',
      }}
    >
      {text}
    </Button>
  </div>
);

// Slot: Cart grid layout
export const SlotCartGridLayout = ({ children, className = "lg:grid lg:grid-cols-3 lg:gap-8" }) => (
  <div className={className}>
    {children}
  </div>
);

// =============================================================================
// 🎯 SLOT CONFIGURATION (Store owners customize this)
// =============================================================================

// Slot definitions - what can be rearranged
export const CART_SLOT_DEFINITIONS = {
  // Page structure slots
  'cart-page-container': {
    id: 'cart-page-container',
    type: 'component',
    component: SlotCartPageContainer,
    name: 'Page Container',
    description: 'Main cart page wrapper'
  },
  
  'cart-page-header': {
    id: 'cart-page-header', 
    type: 'component',
    component: SlotCartPageHeader,
    name: 'Page Header',
    description: 'Cart title and main heading'
  },
  
  'cart-grid-layout': {
    id: 'cart-grid-layout',
    type: 'component', 
    component: SlotCartGridLayout,
    name: 'Grid Layout',
    description: 'Responsive grid container'
  },
  
  // Content slots
  'cart-items-container': {
    id: 'cart-items-container',
    type: 'component',
    component: SlotCartItemsContainer,
    name: 'Items Container', 
    description: 'Container for all cart items'
  },
  
  'cart-item-single': {
    id: 'cart-item-single',
    type: 'component',
    component: SlotCartItem,
    name: 'Individual Item',
    description: 'Each product in the cart'
  },
  
  'cart-sidebar': {
    id: 'cart-sidebar',
    type: 'component',
    component: SlotCartSidebar,
    name: 'Sidebar Container',
    description: 'Right sidebar container'
  },
  
  'cart-coupon-section': {
    id: 'cart-coupon-section',
    type: 'component',
    component: SlotCouponSection,
    name: 'Coupon Code',
    description: 'Discount code input area'
  },
  
  'cart-order-summary': {
    id: 'cart-order-summary',
    type: 'component', 
    component: SlotOrderSummary,
    name: 'Order Summary',
    description: 'Subtotal, tax, and total'
  },
  
  'cart-checkout-button': {
    id: 'cart-checkout-button',
    type: 'component',
    component: SlotCheckoutButton,
    name: 'Checkout Button', 
    description: 'Primary checkout action'
  },
  
  'cart-empty-display': {
    id: 'cart-empty-display',
    type: 'component',
    component: SlotEmptyCartDisplay,
    name: 'Empty Cart Message',
    description: 'Shown when cart has no items'
  }
};

// =============================================================================
// 🎨 LAYOUT CONFIGURATION (Store owners customize this)  
// =============================================================================

// 🎯 CHANGE SLOT ORDER HERE - This controls what appears and in what sequence
export const CART_SLOT_ORDER = [
  'cart-page-header',      // 1. Page title first
  'cart-grid-layout',      // 2. Then main grid container
  'cart-items-container',  // 3. Items list (left side)
  'cart-sidebar',          // 4. Sidebar (right side)
  'cart-order-summary',    // 5. Summary in sidebar  
  'cart-coupon-section',   // 6. Coupon in sidebar
  'cart-checkout-button'   // 7. Checkout button last
];

// 🎯 CART ITEM MICRO-SLOTS - Rearrange elements within each cart item
export const CART_ITEM_LAYOUT = {
  // Change this order to move button next to title!
  elementOrder: [
    'image',           // Product image
    'details',         // Title, price, options
    'quantity',        // Quantity controls  
    'total',          // Item total price
    'remove'          // Remove button
    // To move button next to title, change to: ['image', 'title', 'quantity', 'price', 'total', 'remove']
  ],
  
  layout: 'flex', // 'flex' | 'grid' | 'stack'
  direction: 'row', // 'row' | 'column'  
  gap: 4,
  align: 'center'
};

// 🎯 SIDEBAR ORDER - Rearrange sidebar sections
export const CART_SIDEBAR_ORDER = [
  'cart-order-summary',    // Summary first
  'cart-coupon-section',   // Coupon second
  'cart-checkout-button'   // Button last
];

// Layout presets for quick switching
export const CART_LAYOUT_PRESETS = {
  'default': {
    slotOrder: CART_SLOT_ORDER,
    sidebarOrder: CART_SIDEBAR_ORDER,
    itemLayout: CART_ITEM_LAYOUT
  },
  
  'compact': {
    slotOrder: [
      'cart-page-header',
      'cart-items-container', 
      'cart-order-summary',
      'cart-checkout-button'
    ],
    itemLayout: {
      ...CART_ITEM_LAYOUT,
      direction: 'column',
      gap: 2
    }
  },
  
  'checkout-first': {
    slotOrder: CART_SLOT_ORDER,
    sidebarOrder: [
      'cart-checkout-button',  // Button first!
      'cart-order-summary',
      'cart-coupon-section'
    ],
    itemLayout: CART_ITEM_LAYOUT
  }
};

// =============================================================================
// 🚀 MAIN CART COMPONENT (Uses SlotWrapper automatically)
// =============================================================================

const CartSlotted = (props) => {
  const currentLayout = CART_LAYOUT_PRESETS.default; // Change to 'compact' or 'checkout-first'
  
  return (
    <SlotWrapper
      slotDefinitions={CART_SLOT_DEFINITIONS}
      slotOrder={currentLayout.slotOrder}
      layoutConfig={{
        sidebarOrder: currentLayout.sidebarOrder,
        itemLayout: currentLayout.itemLayout
      }}
      data={props.data || {}}
      {...props}
    />
  );
};

export default CartSlotted;

// =============================================================================
// 📖 CUSTOMIZATION GUIDE
// =============================================================================

/**
 * 🎯 HOW TO CUSTOMIZE YOUR CART:
 * 
 * 1. MOVE BUTTON NEXT TO PRODUCT TITLE:
 *    Change CART_ITEM_LAYOUT.elementOrder to:
 *    ['image', 'title', 'quantity', 'price', 'total', 'remove']
 *    
 * 2. REARRANGE MAIN SECTIONS:
 *    Modify CART_SLOT_ORDER array - drag items up/down in the list
 *    
 * 3. REARRANGE SIDEBAR:
 *    Change CART_SIDEBAR_ORDER to put checkout button first, etc.
 *    
 * 4. USE PRESET LAYOUTS:
 *    Change `CART_LAYOUT_PRESETS.default` to `.compact` or `.checkout-first`
 *    
 * 5. MODIFY COMPONENTS:
 *    Edit the component functions above (CartItem, OrderSummary, etc.)
 *    
 * 6. ADD NEW SLOTS:
 *    Add to CART_SLOT_DEFINITIONS and CART_SLOT_ORDER
 *    
 * 7. CUSTOM LAYOUTS:
 *    Modify layout objects (direction: 'column', gap: 2, etc.)
 */