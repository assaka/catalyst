/**
 * UnifiedSlotComponents - Unified component implementations for both editor and storefront
 *
 * Components implement the unified interface:
 * - renderEditor(): Visual preview for editor
 * - renderStorefront(): Full functionality for storefront
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  Star,
} from 'lucide-react';
import { registerSlotComponent, createSlotComponent } from './UnifiedSlotRenderer';
import ProductTabsComponent from '@/components/storefront/ProductTabs';
import CustomOptionsComponent from '@/components/storefront/CustomOptions';
import TotalPriceDisplayComponent from '@/components/storefront/TotalPriceDisplay';
import StockStatusComponent from '@/components/storefront/StockStatus';

/**
 * QuantitySelector - Unified quantity selector component
 */
const QuantitySelector = createSlotComponent({
  name: 'QuantitySelector',

  // Editor version - visual preview only
  renderEditor: ({ slot, className, styles }) => {
    const labelText = slot?.metadata?.editable?.label?.default || 'Qty:';

    return (
      <div className={className} style={styles}>
        <div className="flex items-center space-x-2">
          <label className="font-medium text-sm">
            {labelText}
          </label>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button className="p-2 hover:bg-gray-100 transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value="1"
              readOnly
              className="px-2 py-2 font-medium w-16 text-center border-x-0 outline-none"
            />
            <button className="p-2 hover:bg-gray-100 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  },

  // Storefront version - full functionality
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { settings, quantity, setQuantity } = productContext;

    // Preserve settings check - hide if setting is enabled
    if (settings?.hide_quantity_selector) {
      return null;
    }

    const labelText = slot?.metadata?.editable?.label?.default || 'Qty:';

    return (
      <div className={className} style={styles}>
        <div className="flex items-center space-x-2">
          <label htmlFor="quantity-input" className="font-medium text-sm">
            {labelText}
          </label>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity && setQuantity(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-gray-100 transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              id="quantity-input"
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) setQuantity && setQuantity(val);
                else if (e.target.value === '') setQuantity && setQuantity('');
              }}
              min="1"
              className="px-2 py-2 font-medium w-16 text-center border-x-0 outline-none focus:ring-0 focus:border-transparent"
            />
            <button
              onClick={() => setQuantity && setQuantity(quantity + 1)}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  },

  metadata: {
    displayName: 'Quantity Selector',
    category: 'Product',
    editable: {
      label: {
        type: 'text',
        default: 'Qty:',
        placeholder: 'Enter quantity label'
      }
    }
  }
});

/**
 * ProductBreadcrumbs - Unified breadcrumb component
 */
const ProductBreadcrumbs = createSlotComponent({
  name: 'ProductBreadcrumbsSlot',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <nav className="text-sm text-gray-600">
          Home &gt; Category &gt; Product
        </nav>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { breadcrumbs } = productContext;

    return (
      <div className={className} style={styles}>
        <nav className="text-sm text-gray-600">
          {breadcrumbs?.map((crumb, index) => (
            <span key={index}>
              {crumb.url ? (
                <Link to={crumb.url} className="hover:text-gray-900 whitespace-nowrap">
                  {crumb.name}
                </Link>
              ) : (
                <span className="text-gray-900 whitespace-nowrap">{crumb.name}</span>
              )}
              {index < breadcrumbs.length - 1 && <span className="mx-2">&gt;</span>}
            </span>
          )) || 'Home > Category > Product'}
        </nav>
      </div>
    );
  }
});

/**
 * ProductGallery - Unified product gallery component
 */
const ProductGallery = createSlotComponent({
  name: 'ProductGallerySlot',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src="https://placehold.co/600x600?text=Product+Image"
              alt="Product"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="bg-red-600 text-white">
                SALE
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-300"
              >
                <img
                  src={`https://placehold.co/100x100?text=Thumb+${index}`}
                  alt={`Thumbnail ${index}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { product, activeImageIndex, setActiveImageIndex } = productContext;

    if (!product) return null;

    const images = product.images || [];
    const currentImage = images[activeImageIndex] || images[0] || 'https://placehold.co/600x600?text=No+Image';

    return (
      <div className={className} style={styles}>
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Product Labels */}
            {product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="bg-red-600 text-white">
                  SALE
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex && setActiveImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    activeImageIndex === index ? 'border-blue-500' : 'border-gray-300'
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
          )}
        </div>
      </div>
    );
  }
});

/**
 * ProductInfo - Unified product information component
 */
const ProductInfo = createSlotComponent({
  name: 'ProductInfoSlot',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sample Product Name</h1>
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-3xl font-bold text-green-600">$99.99</span>
            <span className="text-xl text-gray-500 line-through">$129.99</span>
          </div>
          <Badge variant="outline" className="mb-2">In Stock</Badge>
          <p className="text-sm text-gray-600">SKU: PROD123</p>
          <p className="text-gray-700 leading-relaxed">
            This is a sample product description showing how the product information will appear.
          </p>
        </div>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { product, settings, currencySymbol } = productContext;

    if (!product) return null;

    const hasComparePrice = product.compare_price && parseFloat(product.compare_price) > 0 &&
                           parseFloat(product.compare_price) !== parseFloat(product.price);

    return (
      <div className={className} style={styles}>
        <div className="space-y-6">
          {/* Product Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

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
          {product.stock_quantity > 0 ? (
            <Badge variant="outline" className="mb-2">In Stock</Badge>
          ) : (
            <Badge variant="destructive" className="mb-2">Out of Stock</Badge>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          )}

          {/* Short Description */}
          {product.short_description && (
            <p className="text-gray-700 leading-relaxed">{product.short_description}</p>
          )}
        </div>
      </div>
    );
  }
});

/**
 * ProductOptions - Unified product options component
 */
const ProductOptions = createSlotComponent({
  name: 'ProductOptionsSlot',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block font-medium text-gray-900">Size *</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="">Choose Size...</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { customOptions, handleOptionChange } = productContext;

    return (
      <div className={className} style={styles}>
        {customOptions && customOptions.length > 0 && (
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
        )}
      </div>
    );
  }
});

/**
 * ProductTabs - Unified product tabs component
 */
const ProductTabs = createSlotComponent({
  name: 'ProductTabsSlot',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <div className="mt-12 border-t pt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                Description
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 font-medium text-sm">
                Specifications
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 font-medium text-sm">
                Reviews
              </button>
            </nav>
          </div>
          <div className="mt-6">
            <div className="prose max-w-none">
              <p>This is a sample product description that will be displayed in the tabs.</p>
            </div>
          </div>
        </div>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { productTabs, product, activeTab, setActiveTab } = productContext;

    console.log('🔍 ProductTabsSlot rendering:', {
      productTabs,
      productTabsLength: productTabs?.length,
      product: product?.name,
      activeTab
    });

    if (!productTabs || productTabs.length === 0) {
      console.log('⚠️ No product tabs to render');
      return null;
    }

    return (
      <div className={className} style={styles}>
        <div className="mt-12 border-t pt-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {productTabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab && setActiveTab(index)}
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
        </div>
      </div>
    );
  }
});

/**
 * ProductRecommendations - Unified product recommendations component
 */
const ProductRecommendations = createSlotComponent({
  name: 'ProductRecommendationsSlot',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow duration-200">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={`https://placehold.co/300x300?text=Product+${index}`}
                    alt={`Product ${index}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Sample Product {index}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-bold text-green-600">$99.99</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span>(12)</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { relatedProducts, currencySymbol } = productContext;

    if (!relatedProducts || relatedProducts.length === 0) return null;

    return (
      <div className={className} style={styles}>
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        </div>
      </div>
    );
  }
});

/**
 * CustomOptions - Unified custom options component
 */
const CustomOptions = createSlotComponent({
  name: 'CustomOptions',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Custom Options</h3>
          <div className="space-y-3">
            <div className="border rounded-lg p-4 cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5"></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">Sample Custom Option</h4>
                      <p className="text-sm text-gray-600 mt-1">Optional product description</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Badge variant="outline" className="font-semibold">+$10.00</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { product, store, settings, selectedOptions, handleOptionChange } = productContext;

    if (!product || !store) return null;

    return (
      <div className={className} style={styles}>
        <CustomOptionsComponent
          product={product}
          store={store}
          settings={settings}
          selectedOptions={selectedOptions}
          onSelectionChange={handleOptionChange}
        />
      </div>
    );
  }
});

/**
 * Standalone ProductTabs wrapper for slot system
 */
const ProductTabsStandalone = createSlotComponent({
  name: 'ProductTabs',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <ProductTabsComponent
          productTabs={[
            { id: 1, title: 'Description', content: 'Sample product description content' },
            { id: 2, title: 'Specifications', content: 'Sample specifications content' }
          ]}
          product={{ description: 'Sample description' }}
          className=""
        />
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { productTabs, product } = productContext;

    return (
      <div className={className} style={styles}>
        <ProductTabsComponent
          productTabs={productTabs || []}
          product={product}
          className=""
        />
      </div>
    );
  }
});

/**
 * TotalPriceDisplay - Shows price breakdown with custom options
 */
const TotalPriceDisplay = createSlotComponent({
  name: 'TotalPriceDisplay',

  // Editor version - shows example breakdown
  renderEditor: ({ slot, className, styles }) => (
    <div className={className} style={styles}>
      <div className="border-t pt-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Price Breakdown
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Product × 1</span>
            <span className="font-medium">$99.99</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="text-sm font-medium text-gray-700 mb-1">Selected Options:</div>
            <div className="flex justify-between items-center text-sm pl-4">
              <span className="text-gray-600">Extra Feature × 1</span>
              <span className="font-medium">+$19.99</span>
            </div>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Price:</span>
              <span className="text-lg font-bold text-green-600">$119.98</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),

  // Storefront version - uses actual product data
  renderStorefront: ({ slot, className, styles, productContext }) => (
    <div className={className} style={styles}>
      <TotalPriceDisplayComponent productContext={productContext} />
    </div>
  )
});

// Register all components
registerSlotComponent('QuantitySelector', QuantitySelector);
registerSlotComponent('ProductBreadcrumbsSlot', ProductBreadcrumbs);
registerSlotComponent('ProductGallerySlot', ProductGallery);
registerSlotComponent('ProductInfoSlot', ProductInfo);
registerSlotComponent('ProductOptionsSlot', ProductOptions);
registerSlotComponent('CustomOptions', CustomOptions);
registerSlotComponent('ProductTabsSlot', ProductTabs);
registerSlotComponent('ProductTabs', ProductTabsStandalone);
registerSlotComponent('ProductRecommendationsSlot', ProductRecommendations);
registerSlotComponent('TotalPriceDisplay', TotalPriceDisplay);
console.log('✅ TotalPriceDisplay component registered', TotalPriceDisplay);

// StockStatus - Dynamic stock status display
const StockStatus = createSlotComponent({
  name: 'StockStatus',

  // Editor version - shows static example
  renderEditor: ({ slot, className, styles }) => (
    <div className={className} style={styles}>
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        In Stock
      </span>
    </div>
  ),

  // Storefront version - uses actual product data
  renderStorefront: ({ slot, className, styles, productContext }) => (
    <div className={className} style={styles}>
      <StockStatusComponent productContext={productContext} />
    </div>
  )
});

registerSlotComponent('StockStatus', StockStatus);
console.log('✅ StockStatus component registered', StockStatus);

export {
  QuantitySelector,
  ProductBreadcrumbs,
  ProductGallery,
  ProductInfo,
  ProductOptions,
  CustomOptions,
  ProductTabs,
  ProductRecommendations,
  TotalPriceDisplay,
  StockStatus
};