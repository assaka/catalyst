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
// Displays as tabs on desktop, accordion on mobile
export function ProductTabsSlot({ productContext, content }) {
  const { productTabs, product } = productContext;
  const [activeTab, setActiveTab] = React.useState(0);
  const [openAccordions, setOpenAccordions] = React.useState([0]); // First item open by default on mobile

  if (!productTabs || productTabs.length === 0) return null;

  const toggleAccordion = (index) => {
    setOpenAccordions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const renderTabContent = (tab) => {
    return (
      <div className="prose max-w-none">
        {/* Text content tab */}
        {tab.tab_type === 'text' && tab.content && (
          <div dangerouslySetInnerHTML={{ __html: tab.content }} />
        )}

        {/* Description tab */}
        {tab.tab_type === 'description' && product?.description && (
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        )}

        {/* Attributes tab */}
        {tab.tab_type === 'attributes' && (
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
  };

  return (
    <div className="product-tabs mt-12 border-t pt-8">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <>
          {/* Desktop: Tab Navigation - Hidden on mobile */}
          <div className="hidden md:block border-b border-gray-200">
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

          {/* Desktop: Tab Content - Hidden on mobile */}
          <div className="hidden md:block mt-6">
            {productTabs[activeTab] && renderTabContent(productTabs[activeTab])}
          </div>

          {/* Mobile: Accordion - Hidden on desktop */}
          <div className="md:hidden space-y-2">
            {productTabs.map((tab, index) => (
              <div key={tab.id} className="border border-gray-200 rounded-lg">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="font-medium text-sm text-gray-900">{tab.name}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      openAccordions.includes(index) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Accordion Content */}
                {openAccordions.includes(index) && (
                  <div className="sm:p-4 pt-0 border-t border-gray-200">
                    {renderTabContent(tab)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
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