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
import SeoHeadManager from "@/components/storefront//SeoHeadManager";
import FlashMessage from "@/components/storefront/FlashMessage";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Slot Components ---

function HeaderSlot({ flashMessage, setFlashMessage }) {
  return (
      <>
        <SeoHeadManager
            title="Your Cart"
            description="Review your shopping cart items before proceeding to checkout."
            keywords="cart, shopping cart, checkout, e-commerce, online store"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart</h1>
        <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        <CmsBlockRenderer position="cart_above_items" />
      </>
  );
}

function CartItemsSlot({
                         cartItems,
                         currencySymbol,
                         store,
                         taxes,
                         selectedCountry,
                         calculateItemTotal,
                         formatPrice,
                         formatDisplayPrice,
                         updateQuantity,
                         removeItem,
                         getStoreBaseUrl,
                         getExternalStoreUrl,
                       }) {
  return (
      <Card>
        <CardContent className="px-4 divide-y divide-gray-200">
          {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
                <Button onClick={() => {
                  const baseUrl = getStoreBaseUrl(store);
                  window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
                }}>
                  Continue Shopping
                </Button>
              </div>
          ) : (
              cartItems.map(item => {
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
              })
          )}
        </CardContent>
        <CmsBlockRenderer position="cart_below_items" />
      </Card>
  );
}

function CouponSectionSlot({
                             appliedCoupon,
                             couponCode,
                             setCouponCode,
                             handleApplyCoupon,
                             handleRemoveCoupon,
                             handleCouponKeyPress,
                             currencySymbol,
                             safeToFixed,
                           }) {
  return (
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
  );
}

function OrderSummarySlot({
                            subtotal,
                            discount,
                            tax,
                            total,
                            currencySymbol,
                            safeToFixed,
                            settings,
                            handleCheckout,
                            CmsBlockRenderer,
                          }) {
  return (
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
  );
}

function RecommendedProductsSlot() {
  return (
      <div className="mt-12">
        <RecommendedProducts />
      </div>
  );
}

// Dummy RecommendedProducts placeholder
function RecommendedProducts() {
  return <div>Recommended Products will appear here.</div>;
}

// --- Sortable wrapper for each slot ---

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
    border: "1px solid #ddd",
    padding: "1rem",
    marginBottom: "1rem",
    backgroundColor: "white",
    borderRadius: "8px",
  };

  return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {/* You can add a drag handle UI here if you want */}
        {children}
      </div>
  );
}

// --- Main CartSlots component ---

const DEFAULT_SLOTS = [
  "header",
  "cart_items",
  "coupon_section",
  "order_summary",
  "recommended_products",
];

// Map slot id to actual component
const SLOT_COMPONENTS = {
  header: HeaderSlot,
  cart_items: CartItemsSlot,
  coupon_section: CouponSectionSlot,
  order_summary: OrderSummarySlot,
  recommended_products: RecommendedProductsSlot,
};

export default function CartSlots({
                                    data,
                                    initialSlotOrder = DEFAULT_SLOTS,
                                    onSlotOrderChange,
                                  }) {
  const {
    store,
    cartItems,
    appliedCoupon,
    couponCode,
    subtotal,
    discount,
    tax,
    total,
    currencySymbol,
    settings,
    flashMessage,
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
    setFlashMessage,
  } = data;

  const [slotOrder, setSlotOrder] = useState(initialSlotOrder);

  const sensors = useSensors(
      useSensor(PointerSensor)
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = slotOrder.indexOf(active.id);
      const newIndex = slotOrder.indexOf(over.id);

      const newOrder = arrayMove(slotOrder, oldIndex, newIndex);
      setSlotOrder(newOrder);

      if (onSlotOrderChange) onSlotOrderChange(newOrder);
    }
  }

  // Helpers - stub implementations, replace with your logic
  function formatPrice(value) {
    return typeof value === "number" ? value : parseFloat(value) || 0;
  }
  function formatDisplayPrice(value, currencySymbol, store, taxes, selectedCountry) {
    return `${currencySymbol}${value.toFixed(2)}`;
  }
  function getStoreBaseUrl(store) {
    return store?.baseUrl || "/";
  }
  function getExternalStoreUrl(slug, path, baseUrl) {
    return `${baseUrl}${slug || ""}${path || ""}`;
  }

  return (
      <div className="bg-gray-50 cart-page" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
          >
            <SortableContext
                items={slotOrder}
                strategy={verticalListSortingStrategy}
            >
              {slotOrder.map(slotId => {
                const SlotComponent = SLOT_COMPONENTS[slotId];
                if (!SlotComponent) return null;

                return (
                    <SortableItem key={slotId} id={slotId}>
                      <SlotComponent
                          // pass relevant props to each slot
                          flashMessage={flashMessage}
                          setFlashMessage={setFlashMessage}
                          cartItems={cartItems}
                          currencySymbol={currencySymbol}
                          store={store}
                          taxes={null}
                          selectedCountry={selectedCountry}
                          calculateItemTotal={calculateItemTotal}
                          formatPrice={formatPrice}
                          formatDisplayPrice={formatDisplayPrice}
                          updateQuantity={updateQuantity}
                          removeItem={removeItem}
                          getStoreBaseUrl={getStoreBaseUrl}
                          getExternalStoreUrl={getExternalStoreUrl}
                          appliedCoupon={appliedCoupon}
                          couponCode={couponCode}
                          setCouponCode={setCouponCode}
                          handleApplyCoupon={handleApplyCoupon}
                          handleRemoveCoupon={handleRemoveCoupon}
                          handleCouponKeyPress={handleCouponKeyPress}
                          subtotal={subtotal}
                          discount={discount}
                          tax={tax}
                          total={total}
                          safeToFixed={safeToFixed}
                          settings={settings}
                          handleCheckout={handleCheckout}
                          CmsBlockRenderer={CmsBlockRenderer}
                      />
                    </SortableItem>
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      </div>
  );
}
