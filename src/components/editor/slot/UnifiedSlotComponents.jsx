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
  Home,
  Trash2,
} from 'lucide-react';
import { registerSlotComponent, createSlotComponent } from './SlotComponentRegistry';
import ProductTabsComponent from '@/components/storefront/ProductTabs';
import CustomOptionsComponent from '@/components/storefront/CustomOptions';
import TotalPriceDisplayComponent from '@/components/storefront/TotalPriceDisplay';
import BreadcrumbRendererComponent from '@/components/storefront/BreadcrumbRenderer';
// import StockStatusComponent from '@/components/storefront/StockStatus'; // Temporarily commented out

// Import category slot components to register them
import './CategorySlotComponents.jsx';

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
 * AddToCartButton - Unified add to cart button component
 */
const AddToCartButton = createSlotComponent({
  name: 'AddToCartButton',

  // Editor version - visual preview only
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <button className="flex-1 h-12 text-lg bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium">
          Add to Cart
        </button>
      </div>
    );
  },

  // Storefront version - full functionality
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { handleAddToCart, canAddToCart, product } = productContext;

    return (
      <div className={className} style={styles}>
        <Button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className="flex-1 h-12 text-lg bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </Button>
      </div>
    );
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
        <nav className="flex items-center text-sm text-gray-600">
          <Home className="w-4 h-4 mr-2" />
          <span>Home &gt; Category &gt; Product</span>
        </nav>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { breadcrumbs } = productContext;


    return (
      <div className={className} style={styles}>
        <nav className="flex items-center text-sm text-gray-600">
          {/* Home Icon */}
          <Link to="/" className="flex items-center hover:text-gray-900 mr-2">
            <Home className="w-4 h-4" />
          </Link>

          {/* Breadcrumb Items */}
          {breadcrumbs && breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center">
                <span className="mx-2 text-gray-400">&gt;</span>
                {crumb.url ? (
                  <Link to={crumb.url} className="hover:text-gray-900 whitespace-nowrap">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-gray-900 whitespace-nowrap">{crumb.name}</span>
                )}
              </span>
            ))
          ) : (
            <>
              <span className="mx-2 text-gray-400">&gt;</span>
              <span>Product</span>
            </>
          )}
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
          {/* Thumbnail Gallery removed - handled by separate ProductThumbnails component */}
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

          {/* Thumbnail Gallery removed - handled by separate ProductThumbnails component */}
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

    if (!productTabs || productTabs.length === 0) {
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
        <div className="bg-gray-50 rounded-lg py-4 space-y-2">
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
registerSlotComponent('AddToCartButton', AddToCartButton);

/**
 * CartItemsSlot - Cart items listing with selected options breakdown
 */
const CartItemsSlot = createSlotComponent({
  name: 'CartItemsSlot',

  // Editor version - visual preview
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-400 text-xs">Product</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Sample Product</h3>
              <div className="mt-1 text-sm text-gray-600">
                + Option 1 (+$5.00)
              </div>
              <div className="mt-1">
                <span className="text-lg font-medium text-gray-900">$25.00</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">1</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  },

  // Storefront version - full functionality
  renderStorefront: ({ slot, cartContext, className, styles }) => {
    if (!cartContext) {
      return <div className={className} style={styles}>Cart context not available</div>;
    }

    const {
      cartItems = [],
      calculateItemTotal = () => 0,
      updateQuantity = () => {},
      removeItem = () => {},
      currencySymbol = '$',
      safeToFixed = (value) => parseFloat(value || 0).toFixed(2)
    } = cartContext;

    if (cartItems.length === 0) {
      return (
        <div className={`${className} text-center py-12`} style={styles}>
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
      <div className={className} style={styles}>
        <div className="space-y-4">
          {cartItems.map(item => (
            <Card key={item.id} className="p-4">
              <div className="grid grid-cols-12 gap-4">
                {/* Product Image */}
                <div className="col-span-12 sm:col-span-2">
                  <div className="w-24 h-24">
                    {(() => {
                      const imageUrl = item.product?.image_url ||
                                     (item.product?.images && item.product.images.length > 0 ?
                                       (typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0]?.url || item.product.images[0]?.src)
                                     : null);
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Product Details */}
                <div className="col-span-12 sm:col-span-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {item.product?.name || 'Product'}
                  </h3>

                  {/* Base Price */}
                  <div className="mt-1 text-sm text-gray-600">
                    {currencySymbol}{safeToFixed(item.price || 0)} × {item.quantity}
                  </div>

                  {/* Selected Options as Additional Products */}
                  {item.selected_options && item.selected_options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {item.selected_options.map((option, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <div>+ {option.name}</div>
                          <div className="ml-2 text-xs">{currencySymbol}{safeToFixed(option.price)} × {item.quantity}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 mt-4">
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
                </div>

                {/* Remove Button and Price */}
                <div className="col-span-12 sm:col-span-4 flex flex-col items-end justify-between">
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">
                      {currencySymbol}{safeToFixed(calculateItemTotal ? calculateItemTotal(item, item.product) : (item.price * item.quantity) || 0)}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0 mt-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
});

/**
 * CartCouponSlot - Functional coupon component
 */
const CartCouponSlot = createSlotComponent({
  name: 'CartCouponSlot',

  // Editor version
  renderEditor: ({ slot, className, styles }) => (
    <div className={className} style={styles}>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Apply Coupon</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter coupon code"
            className="w-1/2 border rounded px-3 py-2"
            readOnly
          />
          <button className="w-1/2 bg-blue-600 text-white px-4 py-2 rounded whitespace-nowrap">Apply</button>
        </div>
      </div>
    </div>
  ),

  // Storefront version
  renderStorefront: ({ slot, cartContext, className, styles }) => {
    const {
      couponCode = '',
      setCouponCode = () => {},
      handleApplyCoupon = () => {},
      handleRemoveCoupon = () => {},
      appliedCoupon = null,
      handleCouponKeyPress = () => {}
    } = cartContext || {};

    return (
      <div className={className} style={styles}>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Apply Coupon</h3>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-3">
              <div>
                <span className="font-medium text-green-800">
                  {appliedCoupon.name} applied
                </span>
                <p className="text-sm text-green-600">
                  {appliedCoupon.discount_type === 'percentage'
                    ? `${appliedCoupon.discount_value}% off`
                    : `$${appliedCoupon.discount_value} off`}
                </p>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyPress={handleCouponKeyPress}
                placeholder="Enter coupon code"
                className="w-1/2 border rounded px-3 py-2"
              />
              <button
                onClick={handleApplyCoupon}
                className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
});

/**
 * CartOrderSummarySlot - Functional order summary component
 */
const CartOrderSummarySlot = createSlotComponent({
  name: 'CartOrderSummarySlot',

  // Editor version
  renderEditor: ({ slot, className, styles }) => (
    <div className={className} style={styles}>
      <div className="bg-white rounded-lg shadow p-4 mt-4">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>$99.99</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>$8.00</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>$107.99</span>
          </div>
        </div>
        <button className="w-full bg-blue-600 text-white py-3 rounded mt-4">
          Proceed to Checkout
        </button>
      </div>
    </div>
  ),

  // Storefront version
  renderStorefront: ({ slot, cartContext, className, styles }) => {
    const {
      subtotal = 0,
      discount = 0,
      tax = 0,
      total = 0,
      customOptionsTotal = 0,
      currencySymbol = '$',
      safeToFixed = (val) => parseFloat(val || 0).toFixed(2),
      handleCheckout = () => {},
      appliedCoupon = null
    } = cartContext || {};

    return (
      <div className={className} style={styles}>
        <div className="bg-white rounded-lg shadow p-4 mt-4">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currencySymbol}{safeToFixed(subtotal)}</span>
            </div>
            {customOptionsTotal > 0 && (
              <div className="flex justify-between">
                <span>Additional Products</span>
                <span>+{currencySymbol}{safeToFixed(customOptionsTotal)}</span>
              </div>
            )}
            {appliedCoupon && discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedCoupon.name})</span>
                <span>-{currencySymbol}{safeToFixed(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{currencySymbol}{safeToFixed(tax)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{currencySymbol}{safeToFixed(total)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded mt-4 transition-colors"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    );
  }
});

registerSlotComponent('CartItemsSlot', CartItemsSlot);
registerSlotComponent('CartCouponSlot', CartCouponSlot);
registerSlotComponent('CartOrderSummarySlot', CartOrderSummarySlot);
registerSlotComponent('ProductBreadcrumbsSlot', ProductBreadcrumbs);
registerSlotComponent('ProductGallerySlot', ProductGallery);
registerSlotComponent('ProductInfoSlot', ProductInfo);
registerSlotComponent('ProductOptionsSlot', ProductOptions);
registerSlotComponent('CustomOptions', CustomOptions);
registerSlotComponent('ProductTabsSlot', ProductTabs);
registerSlotComponent('ProductTabs', ProductTabsStandalone);
registerSlotComponent('ProductRecommendationsSlot', ProductRecommendations);
registerSlotComponent('TotalPriceDisplay', TotalPriceDisplay);

// StockStatus - Dynamic stock status display
const StockStatus = createSlotComponent({
  name: 'StockStatus',

  // Editor version - shows static example
  renderEditor: ({ slot, className, styles }) => (
    <div className={className} style={styles}>
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        In Stock (Editor)
      </span>
    </div>
  ),

  // Storefront version - full stock status logic
  renderStorefront: ({ slot, className, styles, productContext }) => {
    const { product, settings } = productContext || {};

    if (!product) {
      return (
        <div className={className} style={styles}>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
            Loading...
          </span>
        </div>
      );
    }

    // Helper function to get stock label based on settings and quantity
    const getStockLabel = (product, settings) => {
      // Check if stock labels should be shown at all
      const showStockLabel = settings?.stock_settings?.show_stock_label !== false;
      if (!showStockLabel) return null;

      // Default behavior if no stock settings are found
      if (!settings?.stock_settings) {
        if (product.stock_quantity <= 0 && !product.infinite_stock) {
          return "Out of Stock";
        }
        return "In Stock";
      }

      const stockSettings = settings.stock_settings;

      // Handle infinite stock
      if (product.infinite_stock) {
        const label = stockSettings.in_stock_label || "In Stock";
        return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
      }

      // Handle out of stock
      if (product.stock_quantity <= 0) {
        return stockSettings.out_of_stock_label || "Out of Stock";
      }

      // Check if stock quantity should be hidden
      const hideStockQuantity = settings?.hide_stock_quantity === true;

      // Handle low stock
      const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
      if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
        const label = stockSettings.low_stock_label || "Low stock, {just {quantity} left}";

        if (hideStockQuantity) {
          // Remove any {...} blocks that contain {quantity}
          return label.replace(/\{[^}]*\{quantity\}[^}]*\}/gi, '')
            // Clean up spacing and punctuation
            .replace(/\s+/g, ' ')
            .replace(/,\s*$/, '')
            .trim();
        }

        // Process any {...} blocks and replace placeholders inside them
        // Handle nested braces by processing outer {...} blocks first
        let processedLabel = label;
        let depth = 0;
        let start = -1;

        for (let i = 0; i < processedLabel.length; i++) {
          if (processedLabel[i] === '{') {
            if (depth === 0) start = i;
            depth++;
          } else if (processedLabel[i] === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
              const content = processedLabel.substring(start + 1, i);
              const processed = content
                .replace(/\{quantity\}/gi, product.stock_quantity)
                .replace(/\{item\}/gi, product.stock_quantity === 1 ? 'item' : 'items')
                .replace(/\{unit\}/gi, product.stock_quantity === 1 ? 'unit' : 'units')
                .replace(/\{piece\}/gi, product.stock_quantity === 1 ? 'piece' : 'pieces');

              processedLabel = processedLabel.substring(0, start) + processed + processedLabel.substring(i + 1);
              i = start + processed.length - 1; // Adjust index after replacement
              start = -1;
            }
          }
        }

        return processedLabel;
      }

      // Handle regular in stock
      const label = stockSettings.in_stock_label || "In Stock";
      if (hideStockQuantity) {
        // Remove any {...} blocks that contain {quantity}
        return label.replace(/\{[^}]*\{quantity\}[^}]*\}/gi, '')
          // Clean up spacing and punctuation
          .replace(/\s+/g, ' ')
          .replace(/,\s*$/, '')
          .trim();
      }

      // Process any {...} blocks and replace placeholders inside them
      // Handle nested braces by processing outer {...} blocks first
      let processedLabel = label;
      let depth = 0;
      let start = -1;

      for (let i = 0; i < processedLabel.length; i++) {
        if (processedLabel[i] === '{') {
          if (depth === 0) start = i;
          depth++;
        } else if (processedLabel[i] === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            const content = processedLabel.substring(start + 1, i);
            const processed = content
              .replace(/\{quantity\}/gi, product.stock_quantity)
              .replace(/\{item\}/gi, product.stock_quantity === 1 ? 'item' : 'items')
              .replace(/\{unit\}/gi, product.stock_quantity === 1 ? 'unit' : 'units')
              .replace(/\{piece\}/gi, product.stock_quantity === 1 ? 'piece' : 'pieces');

            processedLabel = processedLabel.substring(0, start) + processed + processedLabel.substring(i + 1);
            i = start + processed.length - 1; // Adjust index after replacement
            start = -1;
          }
        }
      }

      return processedLabel;
    };

    // Helper function to get stock variant (for styling)
    const getStockVariant = (product, settings) => {
      if (product.infinite_stock) return "outline";
      if (product.stock_quantity <= 0) return "destructive";

      const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
      if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
        return "secondary";
      }

      return "outline";
    };

    const stockLabel = getStockLabel(product, settings);
    const stockVariant = getStockVariant(product, settings);

    if (!stockLabel) {
      return null;
    }

    // Style classes based on variant
    let badgeClasses = "w-fit inline-flex items-center px-2 py-1 rounded-full text-xs";

    if (stockVariant === 'destructive') {
      badgeClasses += " bg-red-100 text-red-800";
    } else if (stockVariant === 'secondary') {
      badgeClasses += " bg-yellow-100 text-yellow-800";
    } else {
      badgeClasses += " bg-green-100 text-green-800";
    }

    return (
      <div className={className} style={styles}>
        <span className={badgeClasses}>
          {stockLabel}
        </span>
      </div>
    );
  }
});

/**
 * BreadcrumbRenderer - Unified breadcrumb component for all page types
 */
const BreadcrumbRenderer = createSlotComponent({
  name: 'BreadcrumbRenderer',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <div className={className} style={styles}>
        <nav className="flex items-center text-sm text-gray-600">
          <Home className="w-4 h-4 mr-2" />
          <span>Home &gt; Category &gt; Product</span>
        </nav>
      </div>
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, categoryContext, className, styles }) => {
    // Determine context and page type
    let pageType, pageData, storeCode, categories, settings;

    if (productContext) {
      pageType = 'product';
      pageData = productContext.product;
      storeCode = productContext.store?.slug || productContext.store?.code;
      categories = productContext.categories;
      settings = productContext.settings;
    } else if (categoryContext) {
      pageType = 'category';
      pageData = categoryContext.category;
      storeCode = categoryContext.store?.slug || categoryContext.store?.code;
      categories = categoryContext.categories;
      settings = categoryContext.settings;
    } else {
      return null;
    }

    return (
      <div className={className} style={styles}>
        <BreadcrumbRendererComponent
          pageType={pageType}
          pageData={pageData}
          storeCode={storeCode}
          categories={categories}
          settings={settings}
          className="text-sm text-gray-600"
        />
      </div>
    );
  }
});

/**
 * ProductImage - Main product image component
 */
const ProductImage = createSlotComponent({
  name: 'ProductImage',

  // Editor version
  renderEditor: ({ slot, className, styles }) => {
    return (
      <img
        src="https://placehold.co/600x600?text=Product+Image"
        alt="Product"
        className={className}
        style={styles}
      />
    );
  },

  // Storefront version
  renderStorefront: ({ slot, productContext, className, styles }) => {
    const { product, activeImageIndex } = productContext;

    if (!product) {
      return (
        <img
          src="https://placehold.co/600x600?text=No+Product"
          alt="No product"
          className={className}
          style={styles}
        />
      );
    }

    const getImageUrl = () => {
      if (!product.images || product.images.length === 0) {
        return 'https://placehold.co/600x600?text=No+Image';
      }

      const index = activeImageIndex || 0;
      const image = product.images[index];

      // Only handle new format - object with url property
      if (typeof image === 'object' && image !== null) {
        return image.url || 'https://placehold.co/600x600?text=No+Image';
      }

      return 'https://placehold.co/600x600?text=Invalid+Format';
    };

    const imageUrl = getImageUrl();
    const currentImageData = product.images[activeImageIndex || 0];

    return (
      <div className="relative w-full h-full group">
        <img
          src={imageUrl}
          alt={product.name || 'Product image'}
          className={`${className} transition-transform duration-300 group-hover:scale-105`}
          style={styles}
          onError={(e) => {
            console.error('Image load error:', imageUrl);
            e.target.src = 'https://placehold.co/600x600?text=Image+Error';
          }}
        />

        {/* Image info overlay for hover */}
        {typeof currentImageData === 'object' && currentImageData?.filepath && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="truncate">{currentImageData.filepath}</p>
            {currentImageData.filesize && (
              <p>{(currentImageData.filesize / 1024).toFixed(1)} KB</p>
            )}
          </div>
        )}
      </div>
    );
  }
});

/**
 * ProductThumbnails - Image gallery thumbnails component
 */
const ProductThumbnails = createSlotComponent({
  name: 'ProductThumbnails',

  // Unified render method for both editor and storefront - ensures WYSIWYG
  render: ({ slot, productContext, className, styles, variableContext, context }) => {
    const { product, activeImageIndex, setActiveImageIndex } = productContext;

    // Always use processVariables for consistent template processing in both contexts
    const templateClassName = 'thumbnail-gallery {{#if (eq settings.product_gallery_layout "vertical")}}flex flex-col space-y-2 w-24 {{else}}flex overflow-x-auto space-x-2 mt-4{{/if}}';
    const processedTemplateClassName = processVariables(templateClassName, variableContext);

    // Use processed template result, fall back to provided className
    const finalClassName = processedTemplateClassName && !processedTemplateClassName.includes('{{')
      ? processedTemplateClassName
      : className || 'thumbnail-gallery flex overflow-x-auto space-x-2 mt-4';

    // Get images: real data in storefront, demo data in editor from variableContext
    const images = product?.images || [];

    // In editor, always show thumbnails for layout preview
    // In storefront, only show if multiple images exist
    const shouldShow = context === 'editor' || (images && images.length > 1);

    if (!shouldShow) {
      return null;
    }

    // Use demo images in editor (from variableContext), real images in storefront
    const thumbnailImages = context === 'editor'
      ? Array.from({ length: 4 }, (_, i) => ({
          url: `https://placehold.co/100x100?text=Thumb+${i + 1}`,
          name: `Demo Thumbnail ${i + 1}`
        }))
      : images;

    const getImageUrl = (image, index) => {
      if (context === 'editor') {
        return image.url; // Already set above for demo
      }

      // Storefront: handle real image data
      if (typeof image === 'object' && image !== null) {
        return image.url || 'https://placehold.co/100x100?text=No+Image';
      }
      return 'https://placehold.co/100x100?text=Invalid';
    };

    // Debug logging
    console.log('🖼️ UNIFIED THUMBNAILS:', {
      context,
      finalClassName,
      imageCount: thumbnailImages.length,
      activeIndex: activeImageIndex,
      layout: variableContext?.settings?.product_gallery_layout,
      position: variableContext?.settings?.vertical_gallery_position
    });

    return (
      <div className={finalClassName} style={styles}>
        {thumbnailImages.map((image, index) => (
          <button
            key={context === 'editor' ? index : (image?.attribute_code || index)}
            onClick={() => setActiveImageIndex && setActiveImageIndex(index)}
            className={`relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:shadow-md ${
              activeImageIndex === index
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <img
              src={getImageUrl(image, index)}
              alt={context === 'editor' ? `Demo Thumbnail ${index + 1}` : `${product?.name || 'Product'} ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.target.src = 'https://placehold.co/100x100?text=Error';
              }}
            />

            {/* Thumbnail overlay info - only in storefront for real images */}
            {context === 'storefront' && typeof image === 'object' && image?.filesize && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-center">{(image.filesize / 1024).toFixed(0)}KB</p>
              </div>
            )}

            {/* Active indicator */}
            {activeImageIndex === index && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    );
  }
});

registerSlotComponent('BreadcrumbRenderer', BreadcrumbRenderer);
registerSlotComponent('StockStatus', StockStatus);
registerSlotComponent('ProductImage', ProductImage);
registerSlotComponent('ProductThumbnails', ProductThumbnails);

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
  StockStatus,
  ProductImage,
  ProductThumbnails
};