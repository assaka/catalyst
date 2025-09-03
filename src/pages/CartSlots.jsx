/**
 * CartSlots.jsx - Exact layout matching Cart.jsx
 * This component provides the same layout structure as Cart.jsx
 * with drag-and-drop capability for rearranging sections
 */

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import FlashMessage from "@/components/storefront/FlashMessage";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import RecommendedProducts from "@/components/storefront/RecommendedProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Minus, Plus, Trash2, Tag } from "lucide-react";

// --- Sortable wrapper for draggable sections ---
function SortableSection({ id, children, isDraggable = true }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    disabled: !isDraggable 
  });

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : {};

  return (
    <div ref={setNodeRef} style={style} {...(isDraggable ? { ...attributes, ...listeners } : {})}>
      {children}
    </div>
  );
}

// Main CartSlots component matching Cart.jsx layout exactly
export default function CartSlots({
  data = {},
  layoutConfig = null, // Layout configuration from editor
  enableDragDrop = false, // Set to true to enable drag and drop
}) {
  // Debug: Log the received configuration
  console.log('CartSlots received layoutConfig:', layoutConfig);
  // Destructure all props with defaults matching Cart.jsx
  const {
    store = {},
    cartItems = [],
    appliedCoupon = null,
    couponCode = '',
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    currencySymbol = '$',
    settings = {},
    flashMessage = null,
    selectedCountry = '',
    taxes = [],
    loading = false,
    storeLoading = false,
    calculateItemTotal = () => 0,
    safeToFixed = (val) => (val || 0).toFixed(2),
    updateQuantity = () => {},
    removeItem = () => {},
    handleCheckout = () => {},
    handleApplyCoupon = () => {},
    handleRemoveCoupon = () => {},
    handleCouponKeyPress = () => {},
    setCouponCode = () => {},
    setFlashMessage = () => {},
    formatDisplayPrice = (value, symbol) => `${symbol}${(value || 0).toFixed(2)}`,
    getStoreBaseUrl = (store) => store?.baseUrl || "/",
    getExternalStoreUrl = (slug, path, baseUrl) => `${baseUrl}${slug || ""}${path || ""}`,
  } = data;

  // Define sections for potential reordering, using layoutConfig if available
  const [sectionOrder, setSectionOrder] = useState(() => {
    if (layoutConfig?.majorSlots) {
      console.log('Using saved majorSlots configuration:', layoutConfig.majorSlots);
      // Map the editor slot names to the actual component names used in this file
      const slotMapping = {
        'header': 'header',
        'cartItems': 'cartItems',
        'coupon': 'sidebar', // Coupon and orderSummary are in sidebar
        'orderSummary': 'sidebar',
        'recommendedProducts': 'recommendedProducts'
      };
      
      // Filter and map to valid slots, ensuring sidebar is included if coupon or orderSummary are present
      const mappedSlots = layoutConfig.majorSlots.map(slot => slotMapping[slot] || slot);
      const uniqueSlots = [...new Set(mappedSlots)]; // Remove duplicates
      
      // For now, use simple cartItems and sidebar layout
      return ['cartItems', 'sidebar'];
    }
    // Default order
    return ['cartItems', 'sidebar'];
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // Helper function for price formatting
  const formatPrice = (value) => {
    return typeof value === "number" ? value : parseFloat(value) || 0;
  };

  // Extract custom text from layoutConfig if available
  const getCustomText = (key, defaultValue) => {
    if (layoutConfig?.textContent?.[key]) {
      // Remove HTML tags for plain text
      const htmlText = layoutConfig.textContent[key];
      // Simple regex to remove HTML tags (SSR-safe)
      const textContent = htmlText.replace(/<[^>]*>/g, '').trim();
      return textContent || defaultValue;
    }
    return defaultValue;
  };

  // Loading state matching Cart.jsx
  if (loading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Empty cart view with custom text support
  const EmptyCart = () => (
    <Card>
      <CardContent className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {getCustomText('emptyCart.title', 'Your cart is empty')}
        </h2>
        <p className="text-gray-600 mb-6">
          {getCustomText('emptyCart.text', "Looks like you haven't added anything to your cart yet.")}
        </p>
        <Button onClick={() => {
          const baseUrl = getStoreBaseUrl(store);
          window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
        }}>
          {getCustomText('emptyCart.button', 'Continue Shopping')}
        </Button>
      </CardContent>
    </Card>
  );

  // Cart items section
  const CartItemsSection = () => (
    <div className="lg:col-span-2">
      <Card>
        <CardContent className="px-4 divide-y divide-gray-200">
          {cartItems.map(item => {
            const product = item.product;
            if (!product) return null;

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
              <div key={item.id} className="flex items-center space-x-4 py-6 border-b border-gray-200">
                <img
                  src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-gray-600">{formatDisplayPrice(basePriceForDisplay, currencySymbol, store, taxes, selectedCountry)} each</p>

                  {item.selected_options && item.selected_options.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      {item.selected_options.map((option, idx) => (
                        <div key={idx}>+ {option.name} (+{formatDisplayPrice(option.price, currencySymbol, store, taxes, selectedCountry)})</div>
                      ))}
                    </div>
                  )}

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
                  <p className="text-xl font-bold">{formatDisplayPrice(itemTotal, currencySymbol, store, taxes, selectedCountry)}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <CmsBlockRenderer position="cart_below_items" />
    </div>
  );

  // Sidebar with coupon and order summary
  const SidebarSection = () => (
    <div className="lg:col-span-1 space-y-6 mt-8 lg:mt-0">
      {/* Coupon Card */}
      <Card>
        <CardHeader><CardTitle>Apply Coupon</CardTitle></CardHeader>
        <CardContent>
          {!appliedCoupon ? (
            <div className="flex space-x-2">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleCouponKeyPress}
              />
              <Button
                onClick={handleApplyCoupon}
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
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Summary Card */}
      <Card>
        <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{safeToFixed(subtotal)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between"><span>Discount</span><span className="text-green-600">-{currencySymbol}{safeToFixed(discount)}</span></div>
          )}
          <div className="flex justify-between"><span>Tax</span><span>{currencySymbol}{safeToFixed(tax)}</span></div>
          <CmsBlockRenderer position="cart_above_total" />
          <div className="flex justify-between text-lg font-semibold border-t pt-4">
            <span>Total</span>
            <span>{currencySymbol}{safeToFixed(total)}</span>
          </div>
          <CmsBlockRenderer position="cart_below_total" />
          <div className="border-t mt-6 pt-6">
            <Button
              size="lg"
              className="w-full"
              onClick={handleCheckout}
              style={{
                backgroundColor: settings?.theme?.checkout_button_color || '#007bff',
                color: '#FFFFFF',
              }}
            >
              Proceed to Checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Main render - matching Cart.jsx structure exactly
  return (
    <div className="bg-gray-50 cart-page" style={{ backgroundColor: '#f9fafb' }}>
      <SeoHeadManager
        title="Your Cart"
        description="Review your shopping cart items before proceeding to checkout."
        keywords="cart, shopping cart, checkout, e-commerce, online store"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {getCustomText('header.title', 'My Cart')}
        </h1>
        <CmsBlockRenderer position="cart_above_items" />
        
        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {enableDragDrop ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sectionOrder}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                    {sectionOrder.map(sectionId => {
                      switch (sectionId) {
                        case 'cartItems':
                          return (
                            <SortableSection key={sectionId} id={sectionId}>
                              <CartItemsSection />
                            </SortableSection>
                          );
                        case 'sidebar':
                          return (
                            <SortableSection key={sectionId} id={sectionId}>
                              <SidebarSection />
                            </SortableSection>
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                <CartItemsSection />
                <SidebarSection />
              </div>
            )}
          </>
        )}
        
        {store && store.id && (
          <div className="mt-12">
            <RecommendedProducts storeId={store.id} />
          </div>
        )}
      </div>
    </div>
  );
}