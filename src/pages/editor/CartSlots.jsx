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
  layoutConfig: providedConfig = null, // Layout configuration from editor
  enableDragDrop = false, // Set to true to enable drag and drop
}) {
  // Load layout configuration from localStorage if not provided
  const [layoutConfig, setLayoutConfig] = React.useState(providedConfig);
  
  React.useEffect(() => {
    if (!providedConfig) {
      // Try to load from localStorage
      try {
        const savedConfig = localStorage.getItem('cart_slots_layout_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setLayoutConfig(config);
          console.log('Loaded cart layout configuration from localStorage:', config);
        }
      } catch (error) {
        console.error('Failed to load cart layout configuration:', error);
      }
    } else {
      setLayoutConfig(providedConfig);
    }
  }, [providedConfig]);
  
  // Debug: Log the received configuration
  console.log('CartSlots using layoutConfig:', layoutConfig);
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
      // For empty cart editor, we only have header and emptyCart slots
      // Map them to the actual rendering sections
      const slots = [];
      
      layoutConfig.majorSlots.forEach(slot => {
        if (slot === 'header') {
          slots.push('header');
        } else if (slot === 'emptyCart') {
          slots.push('emptyCart');
        }
      });
      
      console.log('Mapped slots for rendering:', slots);
      return slots.length > 0 ? slots : ['emptyCart']; // Default to emptyCart if no valid slots
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
  const getCustomText = (key, defaultValue, renderAsHtml = false) => {
    const content = layoutConfig?.slotContent?.[key];
    if (content) {
      const htmlText = content;
      
      if (renderAsHtml) {
        // Return the HTML as-is for rendering with dangerouslySetInnerHTML
        return htmlText;
      }
      
      // For plain text, strip HTML tags (SSR-safe)
      const textContent = htmlText.replace(/<[^>]*>/g, '').trim();
      return textContent || defaultValue;
    }
    return defaultValue;
  };
  
  // Get custom Tailwind classes for an element
  const getCustomClasses = (key, defaultClasses = '') => {
    if (layoutConfig?.elementClasses?.[key]) {
      return layoutConfig.elementClasses[key];
    }
    return defaultClasses;
  };
  
  // Helper to render text with custom classes and styles
  const renderCustomText = (key, defaultContent, defaultClasses = '') => {
    const htmlContent = layoutConfig?.slotContent?.[key];
    const classes = getCustomClasses(key, defaultClasses);
    const styles = layoutConfig?.elementStyles?.[key] || {};
    
    // Check if the content has HTML tags (indicating rich text)
    if (htmlContent && /<[^>]+>/.test(htmlContent)) {
      // Render as HTML to preserve formatting (including colors)
      return <span className={classes} style={styles} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    } else if (htmlContent) {
      // Render configured plain text without stripping
      return <span className={classes} style={styles}>{htmlContent}</span>;
    } else {
      // Use default content if nothing is configured
      return <span className={classes} style={styles}>{defaultContent}</span>;
    }
  };

  // Loading state matching Cart.jsx
  if (loading || storeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Empty cart view with custom text support and grid layout
  const EmptyCart = () => {
    // Get micro-slot configuration
    const microSlotOrders = layoutConfig?.microSlotOrders?.emptyCart || [
      'emptyCart.icon', 'emptyCart.title', 'emptyCart.text', 'emptyCart.button'
    ];
    const microSlotSpans = layoutConfig?.microSlotSpans?.emptyCart || {
      'emptyCart.icon': { col: 12, row: 1 },
      'emptyCart.title': { col: 12, row: 1 },
      'emptyCart.text': { col: 12, row: 1 },
      'emptyCart.button': { col: 12, row: 1 }
    };
    
    // Debug logging
    console.log('EmptyCart micro-slot configuration:', {
      orders: microSlotOrders,
      spans: microSlotSpans,
      sizes: {
        icon: layoutConfig?.componentSizes?.['emptyCart.icon'],
        button: layoutConfig?.componentSizes?.['emptyCart.button']
      },
      fullLayoutConfig: layoutConfig
    });
    
    // Get icon size from configuration
    const iconSize = layoutConfig?.componentSizes?.['emptyCart.icon'] || 64;
    const buttonSize = layoutConfig?.componentSizes?.['emptyCart.button'] || 'default';
    
    // Helper to get grid classes dynamically
    const getGridClasses = (spans) => {
      // Use style attribute for dynamic spans to avoid Tailwind purging issues
      return {
        gridColumn: `span ${spans.col || 12}`,
        gridRow: `span ${spans.row || 1}`
      };
    };
    
    return (
      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-12 gap-4 max-w-6xl mx-auto" style={{ 
            gridAutoRows: 'min-content',
            alignContent: 'start'
          }}>
            {microSlotOrders.map(slotId => {
              const spans = microSlotSpans[slotId] || { col: 12, row: 1 };
              const gridStyle = getGridClasses(spans);
              
              // Add visual debugging in development
              const debugStyle = process.env.NODE_ENV === 'development' ? {
                border: '1px dashed #e5e7eb',
                position: 'relative'
              } : {};
              
              switch(slotId) {
                case 'emptyCart.icon':
                  return (
                    <div 
                      key={slotId} 
                      style={{ ...gridStyle, ...debugStyle }} 
                      className="flex justify-center items-center"
                      title={`Icon: ${spans.col}x${spans.row}`}
                    >
                      <ShoppingCart 
                        className="text-gray-400" 
                        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                      />
                    </div>
                  );
                  
                case 'emptyCart.title':
                  const titleClasses = layoutConfig?.elementClasses?.['emptyCart.title'] || 'text-xl font-semibold text-center';
                  const titleStyles = layoutConfig?.elementStyles?.['emptyCart.title'] || {};
                  return (
                    <div 
                      key={slotId} 
                      style={{ ...gridStyle, ...debugStyle }} 
                      className="p-2"
                      title={`Title: ${spans.col}x${spans.row}`}
                    >
                      <div className={`w-full ${titleClasses}`} style={titleStyles}>
                        {renderCustomText('emptyCart.title', 'Your cart is empty', '')}
                      </div>
                    </div>
                  );
                  
                case 'emptyCart.text':
                  const textClasses = layoutConfig?.elementClasses?.['emptyCart.text'] || 'text-gray-600 text-center';
                  const textStyles = layoutConfig?.elementStyles?.['emptyCart.text'] || {};
                  return (
                    <div 
                      key={slotId} 
                      style={{ ...gridStyle, ...debugStyle }} 
                      className="p-2"
                      title={`Text: ${spans.col}x${spans.row}`}
                    >
                      <div className={`w-full ${textClasses}`} style={textStyles}>
                        {renderCustomText('emptyCart.text', "Looks like you haven't added anything to your cart yet.", '')}
                      </div>
                    </div>
                  );
                  
                case 'emptyCart.button':
                  // Check if we have HTML button content
                  const buttonContent = layoutConfig?.slotContent?.['emptyCart.button'];
                  const isHtmlButton = buttonContent && buttonContent.includes('<button');
                  
                  return (
                    <div 
                      key={slotId} 
                      style={{ ...gridStyle, ...debugStyle }} 
                      className="flex justify-center items-center"
                      title={`Button: ${spans.col}x${spans.row}`}
                    >
                      {isHtmlButton ? (
                        // Render the full HTML button
                        <div 
                          onClick={() => {
                            const baseUrl = getStoreBaseUrl(store);
                            window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
                          }}
                          dangerouslySetInnerHTML={{ __html: buttonContent }}
                        />
                      ) : (
                        // Fall back to default Button component
                        <Button 
                          size={buttonSize}
                          onClick={() => {
                            const baseUrl = getStoreBaseUrl(store);
                            window.location.href = getExternalStoreUrl(store?.slug, '', baseUrl);
                          }}
                        >
                          {buttonContent || 'Continue Shopping'}
                        </Button>
                      )}
                    </div>
                  );
                  
                default:
                  // Handle custom slots
                  if (slotId.startsWith('emptyCart.custom_')) {
                    const customSlot = layoutConfig?.customSlots?.[slotId];
                    if (!customSlot) return null;
                    
                    if (customSlot.type === 'text') {
                      return (
                        <div 
                          key={slotId} 
                          style={{ ...gridStyle, ...debugStyle }} 
                          className="flex items-center justify-center p-2 text-center"
                          title={`Custom Text: ${spans.col}x${spans.row}`}
                        >
                          <div className={layoutConfig?.elementClasses?.[slotId] || 'text-gray-600'}>
                            {layoutConfig?.slotContent?.[slotId] || customSlot.content}
                          </div>
                        </div>
                      );
                    } else if (customSlot.type === 'html') {
                      const htmlContent = layoutConfig?.slotContent?.[slotId] || customSlot.content;
                      return (
                        <div 
                          key={slotId} 
                          style={{ ...gridStyle, ...debugStyle }} 
                          className="flex items-center justify-center p-2"
                          title={`Custom HTML: ${spans.col}x${spans.row}`}
                        >
                          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                        </div>
                      );
                    } else if (customSlot.type === 'javascript') {
                      // For JavaScript, we need to safely execute it
                      // In production, this should be carefully sanitized
                      const jsCode = layoutConfig?.slotContent?.[slotId] || customSlot.content;
                      
                      // Create a container div with a unique ID
                      const containerId = `custom-js-${slotId.replace(/\./g, '-')}`;
                      
                      // Use useEffect to execute the JavaScript when component mounts
                      React.useEffect(() => {
                        try {
                          // Create a sandboxed function with limited scope
                          const executeCode = new Function('container', 'data', jsCode);
                          const container = document.getElementById(containerId);
                          if (container) {
                            executeCode(container, { store, cartItems });
                          }
                        } catch (error) {
                          console.error(`Error executing custom JavaScript for ${slotId}:`, error);
                        }
                      }, [jsCode]);
                      
                      return (
                        <div 
                          key={slotId} 
                          id={containerId}
                          style={{ ...gridStyle, ...debugStyle }} 
                          className="flex items-center justify-center p-2"
                          title={`Custom JavaScript: ${spans.col}x${spans.row}`}
                        />
                      );
                    }
                  }
                  return null;
              }
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

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
        {/* Only show default header if 'header' is not in section order */}
        {!sectionOrder.includes('header') && (
          <>
            <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
            <h1 className="mb-8">
              {renderCustomText('header.title', 'My Cart', 'text-3xl font-bold text-gray-900')}
            </h1>
            <CmsBlockRenderer position="cart_above_items" />
          </>
        )}
        
        {/* Render based on section order from layout configuration */}
        {sectionOrder.includes('emptyCart') || sectionOrder.includes('header') ? (
          // Render empty cart layout from editor
          <div className="space-y-8">
            {sectionOrder.map(sectionId => {
              switch (sectionId) {
                case 'header':
                  // Get header micro-slot configuration
                  const headerMicroSlots = layoutConfig?.microSlotOrders?.header || [
                    'header.flashMessage', 'header.title', 'header.cmsBlock'
                  ];
                  const headerSpans = layoutConfig?.microSlotSpans?.header || {};
                  
                  return (
                    <div key={sectionId} className="mb-8">
                      <div className="grid grid-cols-12 gap-4">
                        {headerMicroSlots.map(microSlotId => {
                          const spans = headerSpans[microSlotId] || { col: 12, row: 1 };
                          const gridStyle = {
                            gridColumn: `span ${spans.col || 12}`,
                            gridRow: `span ${spans.row || 1}`
                          };
                          
                          switch(microSlotId) {
                            case 'header.flashMessage':
                              return flashMessage ? (
                                <div key={microSlotId} style={gridStyle}>
                                  <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
                                </div>
                              ) : null;
                              
                            case 'header.title':
                              return (
                                <div key={microSlotId} style={gridStyle}>
                                  <h1 className="text-3xl font-bold text-gray-900">
                                    {renderCustomText('header.title', 'My Cart', 'text-3xl font-bold text-gray-900')}
                                  </h1>
                                </div>
                              );
                              
                            case 'header.cmsBlock':
                              return (
                                <div key={microSlotId} style={gridStyle}>
                                  <CmsBlockRenderer position="cart_above_items" />
                                </div>
                              );
                              
                            default:
                              return null;
                          }
                        })}
                      </div>
                    </div>
                  );
                case 'emptyCart':
                  return <EmptyCart key={sectionId} />;
                default:
                  return null;
              }
            })}
          </div>
        ) : cartItems.length === 0 ? (
          // Default empty cart if no layout config
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