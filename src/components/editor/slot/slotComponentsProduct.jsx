import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  Star,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download
} from 'lucide-react';
import { formatDisplayPrice } from '@/utils/priceUtils';
import { getImageUrlByIndex, getPrimaryImageUrl } from '@/utils/imageUtils';

// ============================================
// Product-specific Slot Components
// ============================================

// ProductBreadcrumbsSlot Component
export function ProductBreadcrumbsSlot({ productContext, content }) {
  const { breadcrumbs } = productContext;

  return (
    <div className="product-breadcrumbs">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <nav className="text-sm text-gray-600">
          {breadcrumbs?.map((crumb, index) => (
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
          )) || 'Home > Category > Product'}
        </nav>
      )}
    </div>
  );
}

// ProductGallerySlot Component - Product images and gallery
export function ProductGallerySlot({ productContext, content }) {
  const { product, activeImageIndex, setActiveImageIndex } = productContext;

  if (!product) return null;

  // Handle both old format (array of URLs) and new format (array of objects with url property)
  const images = product.images || [];
  const processedImages = images.map(image => {
    if (typeof image === 'string') {
      return image; // Old format - just URL
    }
    return image.url || image; // New format - object with url property
  });

  const currentImageUrl = processedImages[activeImageIndex] || processedImages[0] || 'https://placehold.co/600x600?text=No+Image';
  const currentImageData = images[activeImageIndex] || images[0];

  return (
    <div className="product-gallery space-y-4">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
            <img
              src={currentImageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Product Labels */}
            {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="bg-red-600 text-white">
                  SALE
                </Badge>
              </div>
            )}

            {/* Image info overlay for new format */}
            {typeof currentImageData === 'object' && currentImageData?.filepath && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="truncate">{currentImageData.filepath}</p>
                {currentImageData.filesize && (
                  <p>{(currentImageData.filesize / 1024).toFixed(1)} KB</p>
                )}
              </div>
            )}

            {/* Navigation arrows for multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex(activeImageIndex > 0 ? activeImageIndex - 1 : images.length - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-800" />
                </button>
                <button
                  onClick={() => setActiveImageIndex(activeImageIndex < images.length - 1 ? activeImageIndex + 1 : 0)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4 text-gray-800" />
                </button>
              </>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {activeImageIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery - Enhanced like Product Editor */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-32 overflow-y-auto">
              {processedImages.map((imageUrl, index) => {
                const imageData = images[index];
                return (
                  <button
                    key={imageData?.attribute_code || index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative group flex-shrink-0 aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-md ${
                      activeImageIndex === index
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Thumbnail overlay info for new format */}
                    {typeof imageData === 'object' && imageData?.filesize && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="text-center">{(imageData.filesize / 1024).toFixed(0)}KB</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {images.length === 0 && (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No images available</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ProductInfoSlot Component - Product information, pricing, and details
export function ProductInfoSlot({ productContext, content }) {
  const { product, settings } = productContext;

  if (!product) return null;

  const currencySymbol = settings?.currency_symbol || '$';
  const hasComparePrice = product.compare_price && parseFloat(product.compare_price) > 0 &&
                         parseFloat(product.compare_price) !== parseFloat(product.price);

  // Helper function to get stock label
  const getStockLabel = () => {
    if (!settings?.stock_settings?.show_stock_label) return null;

    if (product.infinite_stock) {
      return settings.stock_settings.in_stock_label?.replace(/\{.*?\}/g, '') || 'In Stock';
    }

    if (product.stock_quantity <= 0) {
      return settings.stock_settings.out_of_stock_label || 'Out of Stock';
    }

    const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
    if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
      return (settings.stock_settings.low_stock_label || 'Only {quantity} left!')
        .replace(/\{.*?quantity.*?\}/g, product.stock_quantity);
    }

    return (settings.stock_settings.in_stock_label || 'In Stock')
      .replace(/\{.*?quantity.*?\}/g, product.stock_quantity);
  };

  const getStockVariant = () => {
    if (product.infinite_stock) return "outline";
    if (product.stock_quantity <= 0) return "destructive";

    const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
    if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
      return "secondary";
    }

    return "outline";
  };

  return (
    <div className="product-info space-y-6">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          {/* Product Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          </div>

          {/* Price Section */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-baseline space-x-2">
              {hasComparePrice ? (
                <>
                  <span className="text-3xl font-bold text-red-600">
                    {currencySymbol}{Math.min(parseFloat(product.price), parseFloat(product.compare_price)).toFixed(2)}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    {currencySymbol}{Math.max(parseFloat(product.price), parseFloat(product.compare_price)).toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-green-600">
                  {currencySymbol}{parseFloat(product.price || 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Stock Status */}
          {getStockLabel() && (
            <Badge variant={getStockVariant()} className="mb-2">
              {getStockLabel()}
            </Badge>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          )}

          {/* Short Description */}
          {product.short_description && (
            <p className="text-gray-700 leading-relaxed">{product.short_description}</p>
          )}

          {/* Key Attributes */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Key Features:</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(product.attributes).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ProductOptionsSlot Component - Custom options and variants
export function ProductOptionsSlot({ productContext, content }) {
  const { customOptions } = productContext;
  const [selectedOptions, setSelectedOptions] = React.useState({});

  const handleOptionChange = (optionId, selectedValue) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: selectedValue
    }));
  };

  return (
    <div className="product-options">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        customOptions && customOptions.length > 0 && (
          <div className="space-y-4">
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
                      handleOptionChange(option.id, selectedOpt);
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
        )
      )}
    </div>
  );
}

// ProductTabsSlot Component - Product tabs (description, specs, reviews)
export function ProductTabsSlot({ productContext, content }) {
  const { productTabs, product } = productContext;
  const [activeTab, setActiveTab] = React.useState(0);

  if (!productTabs || productTabs.length === 0) return null;

  return (
    <div className="product-tabs mt-12 border-t pt-8">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {productTabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === index
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {productTabs[activeTab] && (
              <div className="prose max-w-none">
                {/* Text content tab */}
                {productTabs[activeTab].tab_type === 'text' && productTabs[activeTab].content && (
                  <div dangerouslySetInnerHTML={{ __html: productTabs[activeTab].content }} />
                )}

                {/* Description tab */}
                {productTabs[activeTab].tab_type === 'description' && product?.description && (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                )}

                {/* Attributes tab */}
                {productTabs[activeTab].tab_type === 'attributes' && (
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
            )}
          </div>
        </>
      )}
    </div>
  );
}

// QuantitySelector Component - Product quantity selector with +/- buttons
export function QuantitySelector({ productContext, content, slot }) {
  const [quantity, setQuantity] = React.useState(1);

  // Get editable label from slot metadata or use default
  const labelText = slot?.metadata?.editable?.label?.default || 'Qty:';

  return (
    <div className="quantity-selector">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div className="flex items-center space-x-2">
          <label htmlFor="quantity" className="font-medium text-sm">
            {labelText}
          </label>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-gray-100 transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) setQuantity(val);
              }}
              min="1"
              className="px-2 py-2 font-medium w-16 text-center border-x-0 outline-none focus:ring-0 focus:border-transparent"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ProductRecommendationsSlot Component - Related/recommended products
export function ProductRecommendationsSlot({ productContext, content }) {
  const { relatedProducts, settings } = productContext;

  if (!relatedProducts || relatedProducts.length === 0) return null;

  const currencySymbol = settings?.currency_symbol || '$';

  return (
    <div className="product-recommendations mt-16">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-200">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={product.images?.[0] || 'https://placehold.co/300x300?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="bg-red-600 text-white text-xs">
                        SALE
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) ? (
                      <>
                        <span className="font-bold text-red-600">
                          {currencySymbol}{parseFloat(product.price).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {currencySymbol}{parseFloat(product.compare_price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-green-600">
                        {currencySymbol}{parseFloat(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.rating && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span>({product.reviews_count || 0})</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}