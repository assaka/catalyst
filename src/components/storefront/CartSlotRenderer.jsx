import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';
import { SlotManager } from '@/utils/slotUtils';

/**
 * CartSlotRenderer - Renders slots with full cart functionality
 * Extends the concept of HierarchicalSlotRenderer for cart-specific needs
 */
export function CartSlotRenderer({
  slots,
  parentId = null,
  viewMode = 'emptyCart',
  cartContext = {}
}) {
  const {
    cartItems = [],
    appliedCoupon,
    couponCode,
    subtotal,
    discount,
    tax,
    total,
    currencySymbol,
    settings,
    store,
    taxes,
    selectedCountry,
    calculateItemTotal,
    safeToFixed,
    updateQuantity,
    removeItem,
    handleCheckout,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleCouponKeyPress,
    setCouponCode,
    formatDisplayPrice,
    getStoreBaseUrl,
    navigate
  } = cartContext;

  // Get child slots for current parent
  const childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter by viewMode
  const filteredSlots = childSlots.filter(slot => {
    if (!slot.viewMode || !Array.isArray(slot.viewMode) || slot.viewMode.length === 0) {
      return true; // Show if no viewMode specified
    }
    return slot.viewMode.includes(viewMode);
  });

  const renderSlotContent = (slot) => {
    const { id, type, content, className = '', styles = {} } = slot;

    // Handle text content slots
    if (id === 'header_title') {
      return (
        <h1 className={className || "text-3xl font-bold text-gray-900 mb-4"} style={styles}>
          {content || 'My Cart'}
        </h1>
      );
    }

    if (id === 'empty_cart_title') {
      return (
        <h2 className={className || "text-xl font-semibold text-gray-900 mb-2"} style={styles}>
          {content || 'Your cart is empty'}
        </h2>
      );
    }

    if (id === 'empty_cart_text') {
      return (
        <p className={className || "text-gray-600 mb-6"} style={styles}>
          {content || "Looks like you haven't added anything to your cart yet."}
        </p>
      );
    }

    if (id === 'empty_cart_button') {
      return (
        <Button
          onClick={() => navigate(getStoreBaseUrl(store))}
          className={className || "bg-blue-600 hover:bg-blue-700"}
          style={styles}
        >
          {content || 'Continue Shopping'}
        </Button>
      );
    }

    if (id === 'empty_cart_icon') {
      return (
        <ShoppingCart className={className || "w-16 h-16 mx-auto text-gray-400 mb-4"} style={styles} />
      );
    }

    // Cart items container - render actual cart items
    if (id === 'cart_items_container' || id.includes('cart_item')) {
      if (id === 'cart_items_container') {
        return (
          <Card className={className} style={styles}>
            <CardContent className="px-4 divide-y divide-gray-200">
              {cartItems.map(item => {
                const product = item.product;
                if (!product) return null;

                let basePriceForDisplay = item.price > 0 ? item.price : (product.sale_price || product.price);
                const itemTotal = calculateItemTotal(item, product);

                return (
                  <div key={item.id} className="flex items-center space-x-4 py-6 border-b border-gray-200">
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
                      <div className="flex items-center space-x-3 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-lg font-semibold">{item.quantity || 1}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItem(item.id)}
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
              })}
            </CardContent>
          </Card>
        );
      }
    }

    // Coupon container
    if (id === 'coupon_container' || id === 'coupon_input' || id === 'coupon_button') {
      if (id === 'coupon_container') {
        return (
          <Card className={className} style={styles}>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Apply Coupon</h3>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyPress={handleCouponKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                  >
                    <Tag className="w-4 h-4 mr-2" /> Apply
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="bg-green-50 p-3 rounded-lg flex-1 mr-2">
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
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }
    }

    // Order summary container
    if (id === 'order_summary_container' || id === 'checkout_button') {
      if (id === 'order_summary_container') {
        return (
          <Card className={className} style={styles}>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{safeToFixed(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{currencySymbol}{safeToFixed(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="text-green-600">-{currencySymbol}{safeToFixed(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-4">
                  <span>Total</span>
                  <span>{currencySymbol}{safeToFixed(total)}</span>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  style={{
                    backgroundColor: settings?.theme?.checkout_button_color || '#007bff',
                    color: '#FFFFFF'
                  }}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }
    }

    // Handle container types (grid, flex, container)
    if (type === 'container' || type === 'grid' || type === 'flex') {
      const containerClass = type === 'grid' ? 'grid grid-cols-12 gap-2' :
                            type === 'flex' ? 'flex' : '';
      return (
        <div className={`${containerClass} ${className}`} style={styles}>
          <CartSlotRenderer
            slots={slots}
            parentId={slot.id}
            viewMode={viewMode}
            cartContext={cartContext}
          />
        </div>
      );
    }

    // Handle basic element types
    switch (type) {
      case 'text':
        return (
          <div
            className={className}
            style={styles}
            dangerouslySetInnerHTML={{ __html: content || '' }}
          />
        );

      case 'image':
        return (
          <img
            src={content || 'https://via.placeholder.com/300x200'}
            alt="Cart content"
            className={className}
            style={styles}
          />
        );

      case 'link':
        return (
          <a
            href="#"
            className={className}
            style={styles}
          >
            {content || 'Link'}
          </a>
        );

      case 'button':
        return (
          <Button
            className={className}
            style={styles}
          >
            {content || 'Button'}
          </Button>
        );

      default:
        // For any unknown slot type, render as text
        return (
          <div className={className} style={styles}>
            {content || `[${type} slot]`}
          </div>
        );
    }
  };

  return (
    <>
      {filteredSlots.map((slot) => {
        const colSpan = slot.colSpan || 12;
        const gridColumn = `span ${colSpan} / span ${colSpan}`;

        return (
          <div
            key={slot.id}
            className={`col-span-${colSpan}`}
            style={{
              gridColumn,
              ...slot.containerStyles
            }}
          >
            {renderSlotContent(slot)}
          </div>
        );
      })}
    </>
  );
}