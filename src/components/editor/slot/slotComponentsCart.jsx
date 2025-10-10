import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';
import { formatPrice, safeNumber } from '@/utils/priceUtils';

// ============================================
// Cart-specific Slot Components
// ============================================

// CartHeaderSlot Component
export function CartHeaderSlot({ cartContext, content }) {
  const { cartItems } = cartContext;

  return (
    <div className="cart-header">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            {cartItems.length === 0 ? 'Your cart is empty' : `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart`}
          </p>
        </>
      )}
    </div>
  );
}

// CartItemsSlot Component - Main cart items listing
export function CartItemsSlot({ cartContext, content }) {
  const {
    cartItems,
    calculateItemTotal,
    updateQuantity,
    removeItem,
    getStoreBaseUrl
  } = cartContext;

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-items">
      <div className="space-y-4">
        {cartItems.map(item => (
          <Card key={item.id} className="p-4">
            <div className="flex items-center space-x-4">
              {/* Product Image */}
              <div className="flex-shrink-0 w-20 h-20">
                {item.product?.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {item.product?.name || 'Product'}
                </h3>

                {/* Selected Options */}
                {item.selected_options && item.selected_options.length > 0 && (
                  <div className="mt-1">
                    {item.selected_options.map((option, index) => (
                      <span key={index} className="text-sm text-gray-600">
                        {option.name}: {option.value}
                        {option.price > 0 && ` (+${formatPrice(option.price)})`}
                        {index < item.selected_options.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price */}
                <div className="mt-1">
                  <span className="text-lg font-medium text-gray-900">
                    {formatPrice(calculateItemTotal(item, item.product))}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-sm text-gray-600 ml-2">
                      ({formatPrice(item.price)} each)
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="w-12 text-center font-medium">{item.quantity}</span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// CartSummarySlot Component - Cart totals and checkout
export function CartSummarySlot({ cartContext, content }) {
  const {
    subtotal,
    discount,
    tax,
    total,
    handleCheckout,
    cartItems
  } = cartContext;

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <Card className="cart-summary">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        {/* Tax */}
        {tax > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}

        <hr />

        {/* Total */}
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          className="w-full"
          size="lg"
        >
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
}

// CartCouponSlot Component - Coupon application
export function CartCouponSlot({ cartContext, content }) {
  const {
    couponCode,
    setCouponCode,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleCouponKeyPress,
    appliedCoupon,
    cartItems
  } = cartContext;

  // Debug: log the coupon state
  console.log('🎫 CartCouponSlot - appliedCoupon:', appliedCoupon);
  console.log('🎫 CartCouponSlot - couponCode:', couponCode);

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <Card className="cart-coupon">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tag className="w-4 h-4 mr-2" />
          Coupon Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appliedCoupon ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
              <div>
                <span className="font-medium text-green-800">
                  {appliedCoupon.name}
                </span>
                <p className="text-sm text-green-600">
                  Coupon applied successfully
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyPress={handleCouponKeyPress}
                className="flex-1"
              />
              <Button onClick={handleApplyCoupon}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// CartRecommendationsSlot Component - Recommended products
export function CartRecommendationsSlot({ cartContext, content }) {
  // This would typically fetch recommended products based on cart contents
  // For now, return a placeholder
  return (
    <Card className="cart-recommendations">
      <CardHeader>
        <CardTitle>You might also like</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Recommended products will appear here</p>
        </div>
      </CardContent>
    </Card>
  );
}

// CartEmptyStateSlot Component - Empty cart message
export function CartEmptyStateSlot({ cartContext, content }) {
  const { cartItems } = cartContext;

  if (cartItems.length > 0) {
    return null;
  }

  return (
    <div className="cart-empty-state text-center py-12">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Start Shopping
          </Link>
        </>
      )}
    </div>
  );
}

export default {
  CartHeaderSlot,
  CartItemsSlot,
  CartSummarySlot,
  CartCouponSlot,
  CartRecommendationsSlot,
  CartEmptyStateSlot
};