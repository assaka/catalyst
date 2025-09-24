import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SlotManager } from '@/utils/slotUtils';
import { filterSlotsByViewMode, sortSlotsByGridCoordinates } from '@/hooks/useSlotConfiguration';

/**
 * ProductSlotRenderer - Renders slots with full product functionality
 * Extends the concept of HierarchicalSlotRenderer for product-specific needs
 */
export function ProductSlotRenderer({
  slots,
  parentId = null,
  viewMode = 'default',
  productContext = {}
}) {
  const {
    product,
    productTabs,
    customOptions,
    relatedProducts,
    store,
    settings,
    breadcrumbs,
    productLabels,
    selectedOptions,
    quantity,
    activeImageIndex,
    activeTab,
    isInWishlist,
    currencySymbol,
    setQuantity,
    setActiveImageIndex,
    setActiveTab,
    setIsInWishlist,
    handleAddToCart,
    handleOptionChange
  } = productContext;

  // Helper function to get product image URL
  const getProductImageUrl = (imageIndex = 0) => {
    if (!product || !product.images || !product.images[imageIndex]) {
      return 'https://placehold.co/600x600?text=No+Image';
    }
    return product.images[imageIndex];
  };

  // Get child slots for current parent
  let childSlots = SlotManager.getChildSlots(slots, parentId);

  // Filter slots by view mode
  const filteredSlots = filterSlotsByViewMode(childSlots, viewMode);

  // Sort slots by grid coordinates for proper rendering order
  const sortedSlots = sortSlotsByGridCoordinates(filteredSlots);

  // Function to render individual slot content
  const renderSlotContent = (slot) => {
    const { id, type, content, className, styles } = slot;

    // Breadcrumbs
    if (id === 'breadcrumbs') {
      return (
        <nav className={className} style={styles}>
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            breadcrumbs?.map((crumb, index) => (
              <span key={index}>
                {crumb.url ? (
                  <Link to={crumb.url} className="hover:text-gray-900">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-gray-900">{crumb.name}</span>
                )}
                {index < breadcrumbs.length - 1 && <span className="mx-2">&gt;</span>}
              </span>
            )) || 'Home > Category > Product'
          )}
        </nav>
      );
    }

    // Product Image
    if (id === 'product_image') {
      const currentImage = getProductImageUrl(activeImageIndex || 0);
      return (
        <img
          src={currentImage}
          alt={product?.name || 'Product'}
          className={className}
          style={styles}
        />
      );
    }

    // Product Labels
    if (id === 'product_labels') {
      return (
        <div className={className} style={styles}>
          {product?.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
            <Badge variant="destructive" className="bg-red-600 text-white">
              SALE
            </Badge>
          )}
          {productLabels?.map(label => (
            <Badge key={label.id} className="ml-2" style={{
              backgroundColor: label.background_color,
              color: label.text_color
            }}>
              {label.text}
            </Badge>
          ))}
        </div>
      );
    }

    // Thumbnail Gallery
    if (id === 'thumbnail_gallery') {
      if (!product?.images || product.images.length <= 1) return null;

      return (
        <div className={className} style={styles}>
          {product.images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveImageIndex && setActiveImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                (activeImageIndex || 0) === index ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`${product.name} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      );
    }

    // Product Title
    if (id === 'product_title') {
      return (
        <h1 className={className} style={styles}>
          {content || product?.name || 'Product Name'}
        </h1>
      );
    }

    // Product Price
    if (id === 'product_price') {
      const displayPrice = product?.price || '0.00';
      return (
        <span className={className} style={styles}>
          {content || `${currencySymbol || '$'}${parseFloat(displayPrice).toFixed(2)}`}
        </span>
      );
    }

    // Compare Price
    if (id === 'compare_price') {
      if (!product?.compare_price || parseFloat(product.compare_price) <= parseFloat(product.price)) {
        return null;
      }
      return (
        <span className={className} style={styles}>
          {content || `${currencySymbol || '$'}${parseFloat(product.compare_price).toFixed(2)}`}
        </span>
      );
    }

    // Stock Status
    if (id === 'stock_status') {
      let status = 'In Stock';
      let variant = 'outline';

      if (product) {
        if (product.infinite_stock) {
          status = 'In Stock';
          variant = 'outline';
        } else if (product.stock_quantity <= 0) {
          status = 'Out of Stock';
          variant = 'destructive';
        } else if (product.stock_quantity <= (product.low_stock_threshold || 5)) {
          status = `Only ${product.stock_quantity} left!`;
          variant = 'secondary';
        }
      }

      return (
        <Badge variant={variant} className={className} style={styles}>
          {content || status}
        </Badge>
      );
    }

    // Product SKU
    if (id === 'product_sku') {
      if (!product?.sku) return null;
      return (
        <p className={className} style={styles}>
          {content || `SKU: ${product.sku}`}
        </p>
      );
    }

    // Custom Options
    if (id === 'custom_options') {
      if (!customOptions || customOptions.length === 0) return null;

      return (
        <div className={className} style={styles}>
          {customOptions.map((option) => (
            <div key={option.id} className="space-y-2">
              <label className="block font-medium text-gray-900">
                {option.name}
                {option.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {option.type === 'select' && (
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  onChange={(e) => {
                    const selectedOpt = option.options.find(opt => opt.value === e.target.value);
                    handleOptionChange && handleOptionChange(option.id, selectedOpt);
                  }}
                  required={option.required}
                >
                  <option value="">Choose {option.name}...</option>
                  {option.options.map((opt) => (
                    <option key={opt.id} value={opt.value}>
                      {opt.name} {opt.price > 0 && `(+$${opt.price.toFixed(2)})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Quantity Label
    if (id === 'quantity_label') {
      return (
        <label htmlFor="quantity" className={className} style={styles}>
          {content || 'Qty:'}
        </label>
      );
    }

    // Quantity Input
    if (id === 'quantity_input') {
      return (
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity && setQuantity(Math.max(1, (quantity || 1) - 1))}
            className="p-2 hover:bg-gray-100 transition-colors"
            disabled={(quantity || 1) <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            id="quantity"
            type="number"
            value={quantity || 1}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) setQuantity && setQuantity(val);
            }}
            min="1"
            className={`px-2 py-2 font-medium w-16 text-center border-x-0 outline-none focus:ring-0 focus:border-transparent ${className}`}
            style={styles}
          />
          <button
            onClick={() => setQuantity && setQuantity((quantity || 1) + 1)}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // Add to Cart Button
    if (id === 'add_to_cart_button') {
      const isInStock = product?.infinite_stock || (product?.stock_quantity > 0);
      const canAddToCart = isInStock && (quantity || 1) > 0;

      return (
        <Button
          disabled={!canAddToCart}
          className={className}
          onClick={handleAddToCart}
          style={{
            backgroundColor: settings?.theme?.add_to_cart_button_color || '#16a34a',
            color: '#FFFFFF',
            ...styles
          }}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {content || (isInStock ? 'Add to Cart' : 'Out of Stock')}
        </Button>
      );
    }

    // Wishlist Button
    if (id === 'wishlist_button') {
      return (
        <Button
          onClick={() => setIsInWishlist && setIsInWishlist(!isInWishlist)}
          variant="outline"
          size="icon"
          className={className}
          style={styles}
        >
          <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
        </Button>
      );
    }

    // Tab Navigation
    if (id === 'tab_navigation') {
      if (!productTabs || productTabs.length === 0) return null;

      return (
        <nav className={className} style={styles}>
          {productTabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab && setActiveTab(index)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                (activeTab || 0) === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      );
    }

    // Tab Content
    if (id === 'tab_content') {
      if (!productTabs || productTabs.length === 0) return null;

      const currentTab = productTabs[activeTab || 0];
      if (!currentTab) return null;

      return (
        <div className={className} style={styles}>
          {/* Text content tab */}
          {currentTab.tab_type === 'text' && currentTab.content && (
            <div dangerouslySetInnerHTML={{ __html: currentTab.content }} />
          )}

          {/* Description tab */}
          {currentTab.tab_type === 'description' && product?.description && (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          )}

          {/* Attributes tab */}
          {currentTab.tab_type === 'attributes' && (
            product?.attributes && Object.keys(product.attributes).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    <span>{String(value ?? '')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No specifications available for this product.</p>
            )
          )}
        </div>
      );
    }

    // Related Products Title
    if (id === 'related_products_title') {
      return (
        <h2 className={className} style={styles}>
          {content || 'Recommended Products'}
        </h2>
      );
    }

    // Related Products Grid
    if (id === 'related_products_grid') {
      if (!relatedProducts || relatedProducts.length === 0) return null;

      return (
        <div className={className} style={styles}>
          {relatedProducts.slice(0, 4).map((relatedProduct) => (
            <Card key={relatedProduct.id} className="group hover:shadow-lg transition-shadow duration-200">
              <div className="relative aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={relatedProduct.images?.[0] || 'https://placehold.co/300x300?text=No+Image'}
                  alt={relatedProduct.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                {relatedProduct.compare_price && parseFloat(relatedProduct.compare_price) > parseFloat(relatedProduct.price) && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="bg-red-600 text-white text-xs">
                      SALE
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{relatedProduct.name}</h3>
                <div className="flex items-center space-x-2 mb-2">
                  {relatedProduct.compare_price && parseFloat(relatedProduct.compare_price) > parseFloat(relatedProduct.price) ? (
                    <>
                      <span className="font-bold text-red-600">
                        {currencySymbol}{parseFloat(relatedProduct.price).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {currencySymbol}{parseFloat(relatedProduct.compare_price).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-green-600">
                      {currencySymbol}{parseFloat(relatedProduct.price).toFixed(2)}
                    </span>
                  )}
                </div>
                {relatedProduct.rating && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(relatedProduct.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span>({relatedProduct.reviews_count || 0})</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Handle container types (grid, flex, container)
    if (type === 'container' || type === 'grid' || type === 'flex') {
      const containerClass = type === 'grid' ? 'grid grid-cols-12 gap-2' :
                            type === 'flex' ? 'flex' : '';
      return (
        <div className={`${containerClass} ${className}`} style={styles}>
          <ProductSlotRenderer
            slots={slots}
            parentId={slot.id}
            viewMode={viewMode}
            productContext={productContext}
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
            src={content || getProductImageUrl()}
            alt={product?.name || 'Product'}
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

      case 'input':
        return (
          <Input
            type="text"
            value={content || ''}
            className={className}
            style={styles}
            readOnly
          />
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
      {sortedSlots.map((slot) => {
        // Handle number, object with viewMode, and Tailwind responsive classes
        let colSpanClass = 'col-span-12'; // default Tailwind class
        let gridColumn = 'span 12 / span 12'; // default grid style

        if (typeof slot.colSpan === 'number') {
          // Old format: direct number
          colSpanClass = `col-span-${slot.colSpan}`;
          gridColumn = `span ${slot.colSpan} / span ${slot.colSpan}`;
        } else if (typeof slot.colSpan === 'object' && slot.colSpan !== null) {
          // New format: object with viewMode keys
          const viewModeValue = slot.colSpan[viewMode];

          if (typeof viewModeValue === 'number') {
            // Simple viewMode: number format
            colSpanClass = `col-span-${viewModeValue}`;
            gridColumn = `span ${viewModeValue} / span ${viewModeValue}`;
          } else if (typeof viewModeValue === 'string') {
            // Tailwind responsive class format: 'col-span-12 lg:col-span-8'
            colSpanClass = viewModeValue;
            gridColumn = null; // Let Tailwind handle it
          }
        }

        return (
          <div
            key={slot.id}
            className={colSpanClass}
            style={{
              ...(gridColumn ? { gridColumn } : {}),
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