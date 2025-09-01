/**
 * Default Slot Components for Cart Page
 * These components replace the monolithic Cart structure with micro-slots
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react';
import { formatDisplayPrice } from '@/utils/priceUtils';
import { getStoreBaseUrl, getExternalStoreUrl } from '@/utils/urlUtils';

// Cart page container
export const CartPageContainer = ({ children, className = "bg-gray-50 cart-page" }) => (
  <div className={className}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {children}
    </div>
  </div>
);

// Cart page header
export const CartPageHeader = ({ title = "My Cart", className = "text-3xl font-bold text-gray-900 mb-8" }) => (
  <h1 className={className}>{title}</h1>
);

// Empty cart display
export const EmptyCartDisplay = ({ 
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

// Cart items container
export const CartItemsContainer = ({ children, className = "lg:col-span-2" }) => (
  <div className={className}>
    <Card>
      <CardContent className="px-4 divide-y divide-gray-200">
        {children}
      </CardContent>
    </Card>
  </div>
);

// Individual cart item
export const CartItem = ({ 
  item, 
  product, 
  currencySymbol, 
  store, 
  taxes, 
  selectedCountry,
  onUpdateQuantity, 
  onRemove,
  calculateItemTotal,
  formatPrice
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

// Cart sidebar container
export const CartSidebar = ({ children, className = "lg:col-span-1 space-y-6 mt-8 lg:mt-0" }) => (
  <div className={className}>
    {children}
  </div>
);

// Coupon section
export const CouponSection = ({ 
  appliedCoupon, 
  couponCode, 
  onCouponCodeChange, 
  onApplyCoupon, 
  onRemoveCoupon, 
  onKeyPress,
  currencySymbol,
  safeToFixed
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
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
            onKeyPress={onKeyPress}
          />
          <Button 
            onClick={onApplyCoupon}
            disabled={!couponCode.trim()}
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

// Order summary
export const OrderSummary = ({ 
  subtotal, 
  discount, 
  tax, 
  total, 
  currencySymbol, 
  safeToFixed,
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

// Checkout button
export const CheckoutButton = ({ 
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
        color: '#FFFFFF',
      }}
    >
      {text}
    </Button>
  </div>
);

// Cart grid layout
export const CartGridLayout = ({ children, className = "lg:grid lg:grid-cols-3 lg:gap-8" }) => (
  <div className={className}>
    {children}
  </div>
);