import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';
import { SlotManager } from '@/utils/slotUtils';
import { formatDisplayPrice } from '@/utils/priceUtils';

/**
 * CartSlotRenderer - Renders cart slots with full functionality
 * This is specifically designed for the storefront cart page
 */
export function CartSlotRenderer({
  slots,
  parentId = null,
  cartData
}) {
  const {
    cartItems,
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
    getStoreBaseUrl,
    navigate
  } = cartData;

  // Get child slots using SlotManager to maintain order
  const childSlots = SlotManager.getChildSlots(slots, parentId);

  const renderSlotContent = (slot) => {
    const { type, content, className = '', styles = {} } = slot;

    // Apply slot styling
    const slotClasses = className || '';
    const slotStyles = styles || {};

    switch (type) {
      case 'text':
        return (
          <div
            className={slotClasses}
            style={slotStyles}
            dangerouslySetInnerHTML={{ __html: content || '' }}
          />
        );

      case 'image':
        return (
          <img
            src={content || 'https://via.placeholder.com/300x200'}
            alt="Cart content"
            className={slotClasses}
            style={slotStyles}
          />
        );

      case 'link':
        return (
          <a
            href="#"
            className={slotClasses}
            style={slotStyles}
          >
            {content || 'Link'}
          </a>
        );

      case 'button':
        return (
          <Button
            className={slotClasses}
            style={slotStyles}
          >
            {content || 'Button'}
          </Button>
        );

      case 'input':
        return (
          <Input
            placeholder={content || 'Input'}
            className={slotClasses}
            style={slotStyles}
          />
        );

      // Cart-specific functional components
      case 'cart_items':
        return (
          <div className={slotClasses} style={slotStyles}>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Your cart is empty</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {cartItems.map(item => {
                  const product = item.product;
                  if (!product) return null;

                  const itemTotal = calculateItemTotal(item, product);
                  const basePrice = item.price > 0 ? item.price : (product.sale_price || product.price);

                  return (
                    <div key={item.id} className="flex items-center space-x-4 py-6">
                      <img
                        src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="text-gray-600">
                          {formatDisplayPrice(basePrice, currencySymbol, store, taxes, selectedCountry)} each
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
              </div>
            )}
          </div>
        );

      case 'coupon_section':
        return (
          <Card className={slotClasses} style={slotStyles}>
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

      case 'order_summary':
        return (
          <Card className={slotClasses} style={slotStyles}>
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

      case 'empty_cart':
        return cartItems.length === 0 ? (
          <div className={`text-center py-12 ${slotClasses}`} style={slotStyles}>
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {content || 'Your cart is empty'}
            </h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Button
              onClick={() => navigate(getStoreBaseUrl(store))}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue Shopping
            </Button>
          </div>
        ) : null;

      case 'container':
      case 'grid':
      case 'flex':
        // Render children for container types
        return (
          <div className={slotClasses} style={slotStyles}>
            <CartSlotRenderer
              slots={slots}
              parentId={slot.id}
              cartData={cartData}
            />
          </div>
        );

      default:
        // For any other slot type, render content as text
        return (
          <div className={slotClasses} style={slotStyles}>
            {content || `${type} slot`}
          </div>
        );
    }
  };

  return (
    <>
      {childSlots.map((slot) => {
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