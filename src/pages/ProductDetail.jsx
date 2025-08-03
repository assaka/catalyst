
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { checkMultiplePathsForRedirect, getPossiblePaths, extractSlugFromRedirectUrl } from "@/utils/redirectUtils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { User } from "@/api/entities";
import cartService from "@/services/cartService";
// ProductLabel entity is no longer imported directly as its data is now provided via useStore.
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import { formatDisplayPrice, calculateDisplayPrice } from "@/utils/priceUtils";
import {
  ShoppingCart, Star, ChevronLeft, ChevronRight, Minus, Plus, Heart, Download, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import { Skeleton } from "@/components/ui/skeleton";
import { StorefrontProductTab } from "@/api/storefront-entities";
import { CustomerWishlist } from "@/api/storefront-entities";
import FlashMessage from "@/components/storefront/FlashMessage";
// New imports for enhanced functionality
import CustomOptions from "@/components/storefront/CustomOptions";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import RecommendedProducts from "@/components/storefront/RecommendedProducts";
import Breadcrumb from "@/components/storefront/Breadcrumb";

// Product Label Component
const ProductLabelComponent = ({ label }) => {
  if (!label || !label.text) return null;

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }[label.position || 'top-left'];

  return (
    <div
      className={`absolute ${positionClasses} text-xs font-semibold px-2 py-1 rounded-md z-10`}
      style={{
        backgroundColor: label.background_color || '#000000',
        color: label.text_color || '#FFFFFF',
      }}
    >
      {label.text}
    </div>
  );
};

export default function ProductDetail() {
  const { slug: paramSlug, productSlug: routeProductSlug } = useParams();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug') || routeProductSlug || paramSlug;
  

  // Updated useStore destructuring: productLabels is now sourced directly from the store context.
  const { store, settings, loading: storeLoading, categories, productLabels, taxes, selectedCountry } = useStore();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [user, setUser] = useState(null);
  // customOptions and customOptionsLabel states are removed as their logic is moved to the CustomOptions component.
  const [selectedOptions, setSelectedOptions] = useState([]); // This state remains to track selected options for price and cart.
  const [flashMessage, setFlashMessage] = useState(null);
  const [productTabs, setProductTabs] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  // productLabels state is removed as it's now managed by the useStore context.

  // Load user once
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  // Load product data with aggressive caching
  useEffect(() => {
    if (!storeLoading && store?.id && slug) {
      loadProductData();
    }
  }, [slug, store?.id, storeLoading]);

  const loadProductData = async () => {
    try {
      setLoading(true);

      if (!store?.id || !slug) {
        setProduct(null);
        setLoading(false);
        return;
      }

      const cacheKey = `product-detail-${slug}-${store.id}`;
      
      // First try to find by slug
      let products = await cachedApiCall(cacheKey, () =>
        StorefrontProduct.filter({ store_id: store.id, slug: slug, status: 'active' })
      );
      
      // If no product found by slug, try searching by SKU as fallback
      if (!products || products.length === 0) {
        const skuCacheKey = `product-detail-sku-${slug}-${store.id}`;
        products = await cachedApiCall(skuCacheKey, () =>
          StorefrontProduct.filter({ store_id: store.id, sku: slug, status: 'active' })
        );
      }

      if (products && products.length > 0) {
        const foundProduct = products[0];
        
        // Critical check: verify the product matches the request
        // Allow match by either slug OR SKU (since SKU can be used as a fallback identifier)
        const matchesBySlug = foundProduct.slug === slug;
        const matchesBySku = foundProduct.sku === slug;
        
        if (!matchesBySlug && !matchesBySku) {
          // Show "not found" instead of wrong product
          setProduct(null);
          setLoading(false);
          return;
        }
        
        
        setProduct(foundProduct);

        // Send Google Analytics 'view_item' event
        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'view_item',
            ecommerce: {
              items: [{
                item_id: foundProduct.id,
                item_name: foundProduct.name,
                price: parseFloat(foundProduct.price || 0).toFixed(2),
                item_brand: foundProduct.brand, // Assuming product has a brand field
                item_category: categories.find(cat => cat.id === foundProduct.category_ids?.[0])?.name || '', // Find category name
                currency: settings?.currency_code || 'USD'
              }]
            }
          });
        }

        // Load additional data in parallel (Custom options and product labels are now handled by separate components/context)
        Promise.all([
          loadProductTabs(),
          checkWishlistStatus(foundProduct.id)
        ]);
      } else {
        // No product found - check for redirects before showing 404
        console.warn(`Product with slug '${slug}' not found. Checking for redirects...`);
        
        const possiblePaths = getPossiblePaths('product', slug);
        const redirectTo = await checkMultiplePathsForRedirect(possiblePaths, store.id);
        
        if (redirectTo) {
          console.log(`🔀 Redirecting from product ${slug} to ${redirectTo}`);
          const newSlug = extractSlugFromRedirectUrl(redirectTo);
          // Navigate to the new product URL
          navigate(`/store/${store.slug}/product/${newSlug}`, { replace: true });
          return;
        }
        
        // No redirect found - show 404
        setProduct(null);
      }
    } catch (error) {
      console.error("Failed to load product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // The loadCustomOptions and loadProductLabels functions are removed
  // as their responsibilities are now handled by the CustomOptions component and the useStore context, respectively.

  const loadProductTabs = async () => {
    if (!store?.id) return;
    try {
      const tabs = await cachedApiCall(
        `product-tabs-${store.id}`,
        () => StorefrontProductTab.filter({ store_id: store.id, is_active: true })
      );
      setProductTabs(tabs || []);
    } catch (error) {
      console.error('❌ ProductDetail: Error loading product tabs:', error);
      setProductTabs([]);
    }
  };

  const checkWishlistStatus = async (productId) => {
    if (!store?.id || !productId) return;
    try {
      const wishlistItems = await CustomerWishlist.getItems(store?.id);
      // Check if this specific product is in the wishlist
      const isProductInWishlist = wishlistItems && wishlistItems.some(item => 
        item.product_id === productId || item.product_id === parseInt(productId)
      );
      
      
      setIsInWishlist(isProductInWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      setIsInWishlist(false);
    }
  };

  const getTotalPrice = () => {
    if (!product) return 0;

    // Use the lower price (sale price) if compare_price exists and is different
    let basePrice = parseFloat(product.price);
    if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
      basePrice = Math.min(parseFloat(product.price), parseFloat(product.compare_price));
    }

    // Add selected options price
    const optionsPrice = selectedOptions.reduce((sum, option) => sum + (parseFloat(option.price) || 0), 0);

    // Calculate tax-inclusive price if needed
    const unitPrice = basePrice + optionsPrice;
    const displayUnitPrice = calculateDisplayPrice(unitPrice, store, taxes, selectedCountry);

    return displayUnitPrice * quantity;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setLoading(true);

      // Validate store context
      if (!store?.id) {
        console.error('ProductDetail: No store context available');
        setFlashMessage({
          type: 'error',
          message: 'Store information not available. Please refresh the page.'
        });
        return;
      }

      // Calculate correct base price (use sale price if available)
      let basePrice = parseFloat(product.price);
      if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
        basePrice = Math.min(parseFloat(product.price), parseFloat(product.compare_price));
      }

      const result = await cartService.addItem(
        product.id,
        quantity,
        basePrice,
        selectedOptions,
        store.id
      );
      
      if (result.success) {
        // Send Google Analytics 'add_to_cart' event
        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
              items: [{
                item_id: product.id,
                item_name: product.name,
                price: parseFloat(basePrice || 0).toFixed(2),
                quantity: quantity,
                item_brand: product.brand,
                item_category: categories.find(cat => cat.id === product.category_ids?.[0])?.name || '',
                currency: settings?.currency_code || 'USD'
              }]
            }
          });
        }

        setFlashMessage({
          type: 'success',
          message: `${product.name} added to cart successfully!`
        });
      } else {
        setFlashMessage({
          type: 'error',
          message: result.error || 'Failed to add product to cart. Please try again.'
        });
      }

    } catch (error) {
      console.error('Failed to add to cart:', error);
      setFlashMessage({
        type: 'error',
        message: 'Failed to add product to cart. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product || !store?.id) return;

    try {
      if (isInWishlist) {
        await CustomerWishlist.removeItem(product.id, store.id);
        setIsInWishlist(false);
        setFlashMessage({
          type: 'success',
          message: 'Product removed from wishlist'
        });
      } else {
        try {
          await CustomerWishlist.addItem(product.id, store.id);
          setIsInWishlist(true);
          setFlashMessage({
            type: 'success',
            message: 'Product added to wishlist'
          });
        } catch (addError) {
          // Handle "Item already in wishlist" as a success case
          if (addError.message?.includes('already in wishlist')) {
            setIsInWishlist(true);
            setFlashMessage({
              type: 'success',
              message: 'Product is already in your wishlist'
            });
          } else {
            throw addError; // Re-throw other errors
          }
        }
      }

      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      
      // Add a small delay to ensure backend persistence completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh wishlist status to ensure UI is in sync
      if (product?.id) {
        checkWishlistStatus(product.id);
      }

    } catch (error) {
      console.error("Error toggling wishlist:", error);
      setFlashMessage({
        type: 'error',
        message: 'Failed to update wishlist. Please try again.'
      });
    }
  };

  // useCallback is used to memoize handleOptionChange, preventing unnecessary re-renders in CustomOptions
  const handleOptionChange = useCallback((newSelectedOptions) => {
    setSelectedOptions(newSelectedOptions);
  }, []); // Empty dependency array ensures this function is stable

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
        <Link to={createPageUrl(`Storefront?slug=${store?.slug}`)}>
          <Button>Back to Store</Button>
        </Link>
      </div>
    );
  }

  // Determine stock status based on product and store settings
  const trackStock = settings?.track_stock !== false; // Default to true if not explicitly false
  const isInStock = trackStock ? (product?.infinite_stock || product?.stock_quantity > 0) : true;
  const canAddToCart = !loading && isInStock && quantity > 0 && (!trackStock || product?.infinite_stock || product?.stock_quantity >= quantity);

  const currencySymbol = settings?.currency_symbol || '$';

  // Helper function to get stock label based on settings and quantity
  const getStockLabel = (product) => {
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
      // Remove quantity placeholder if present, as it's not applicable
      return label.replace(/ \{quantity\}| \({quantity}\)|\({quantity}\)/g, '');
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
      const label = stockSettings.low_stock_label || "Low stock, just {quantity} left";
      if (hideStockQuantity) {
        // Remove quantity placeholder when hiding stock quantity
        return label.replace(/ \{quantity\}| \({quantity}\)|\({quantity}\)/g, '');
      }
      return label.replace('{quantity}', product.stock_quantity.toString());
    }
    
    // Handle regular in stock
    const label = stockSettings.in_stock_label || "In Stock";
    if (hideStockQuantity) {
      // Remove quantity placeholder when hiding stock quantity
      return label.replace(/ \{quantity\}| \({quantity}\)|\({quantity}\)/g, '');
    }
    return label.replace('{quantity}', product.stock_quantity.toString());
  };

  // Helper function to get stock variant (for styling)
  const getStockVariant = (product) => {
    if (product.infinite_stock) return "outline";
    if (product.stock_quantity <= 0) return "destructive";
    
    const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
    if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
      return "secondary"; // Warning color for low stock
    }
    
    return "outline"; // Default for in stock
  };

  // Build breadcrumb items for product pages
  const getBreadcrumbItems = () => {
    if (!product) return [];
    
    const items = [];
    
    // Add category hierarchy if product has categories and setting is enabled
    if (settings?.show_category_in_breadcrumb && product.category_ids && product.category_ids.length > 0) {
      const primaryCategoryId = product.category_ids[0];
      const primaryCategory = categories.find(c => c.id === primaryCategoryId);
      
      if (primaryCategory) {
        // Build category hierarchy
        let category = primaryCategory;
        const categoryChain = [category];
        
        // Find parent categories
        while (category?.parent_id) {
          const parent = categories.find(c => c.id === category.parent_id);
          if (parent) {
            categoryChain.unshift(parent);
            category = parent;
          } else {
            break;
          }
        }
        
        // Add category items to breadcrumb
        categoryChain.forEach(cat => {
          items.push({
            name: cat.name,
            url: createPageUrl(`Storefront?category=${cat.slug}`)
          });
        });
      }
    }
    
    // Add current product as last item
    items.push({
      name: product.name,
      url: createPageUrl(`ProductDetail?slug=${product.slug}`)
    });
    
    return items;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {flashMessage && (
        <div className="mb-6">
          <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        </div>
      )}

      <SeoHeadManager
        pageType="product"
        pageData={product}
        pageTitle={product?.name}
      />

      <Breadcrumb items={getBreadcrumbItems()} />

      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.images?.[activeImage] || product.images?.[0] || 'https://placehold.co/600x600?text=No+Image'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Product labels positioned on top of image (labels now from useStore) */}
            {(() => {
              // Filter labels that match the product conditions
              const matchingLabels = productLabels?.filter((label) => {
                let shouldShow = true; // Assume true, prove false (AND logic)

                if (label.conditions && Object.keys(label.conditions).length > 0) {
                  // Check product_ids condition
                  if (shouldShow && label.conditions.product_ids && Array.isArray(label.conditions.product_ids) && label.conditions.product_ids.length > 0) {
                    if (!label.conditions.product_ids.includes(product.id)) {
                      shouldShow = false;
                    }
                  }

                  // Check category_ids condition
                  if (shouldShow && label.conditions.category_ids && Array.isArray(label.conditions.category_ids) && label.conditions.category_ids.length > 0) {
                    if (!product.category_ids || !product.category_ids.some(catId => label.conditions.category_ids.includes(catId))) {
                      shouldShow = false;
                    }
                  }

                  // Check price conditions
                  if (shouldShow && label.conditions.price_conditions) {
                    const conditions = label.conditions.price_conditions;
                    if (conditions.has_sale_price) {
                      const hasComparePrice = product.compare_price && parseFloat(product.compare_price) > 0;
                      const pricesAreDifferent = hasComparePrice && parseFloat(product.compare_price) !== parseFloat(product.price);
                      if (!pricesAreDifferent) {
                        shouldShow = false;
                      }
                    }
                    if (shouldShow && conditions.is_new && conditions.days_since_created) {
                      const productCreatedDate = new Date(product.created_date);
                      const now = new Date();
                      const daysSince = Math.floor((now.getTime() - productCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
                      if (daysSince > conditions.days_since_created) {
                        shouldShow = false;
                      }
                    }
                  }

                  // Check attribute conditions
                  if (shouldShow && label.conditions.attribute_conditions && Array.isArray(label.conditions.attribute_conditions) && label.conditions.attribute_conditions.length > 0) {
                    const attributeMatch = label.conditions.attribute_conditions.every(cond => {
                      if (product.attributes && product.attributes[cond.attribute_code]) {
                        const productAttributeValue = String(product.attributes[cond.attribute_code]).toLowerCase();
                        const conditionValue = String(cond.attribute_value).toLowerCase();
                        return productAttributeValue === conditionValue;
                      }
                      return false;
                    });
                    if (!attributeMatch) {
                      shouldShow = false;
                    }
                  }
                }

                return shouldShow;
              }) || [];

              // Group labels by position and show one label per position
              const labelsByPosition = matchingLabels.reduce((acc, label) => {
                const position = label.position || 'top-right';
                if (!acc[position]) {
                  acc[position] = [];
                }
                acc[position].push(label);
                return acc;
              }, {});

              // For each position, sort by sort_order (ASC) then by priority (DESC) and take the first one
              const labelsToShow = Object.values(labelsByPosition).map(positionLabels => {
                const sortedLabels = positionLabels.sort((a, b) => {
                  const sortOrderA = a.sort_order || 0;
                  const sortOrderB = b.sort_order || 0;
                  if (sortOrderA !== sortOrderB) {
                    return sortOrderA - sortOrderB; // ASC
                  }
                  const priorityA = a.priority || 0;
                  const priorityB = b.priority || 0;
                  return priorityB - priorityA; // DESC
                });
                return sortedLabels[0]; // Return highest priority label for this position
              }).filter(Boolean);

              // Show all labels (one per position)
              return labelsToShow.map(label => (
                <ProductLabelComponent
                  key={label.id}
                  label={label}
                />
              ));
            })()}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    activeImage === index ? 'border-blue-500' : 'border-gray-300'
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <CmsBlockRenderer position="product_above_title" />
            <h1 className="text-3xl font-bold mb-2">{product?.name}</h1>
            <CmsBlockRenderer position="product_below_title" />
            <CmsBlockRenderer position="product_above_price" />
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-baseline space-x-2">
                {/* Inverted price logic to always show lowest price first */}
                {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                  <>
                    <span className="text-3xl font-bold text-red-600">
                      {formatDisplayPrice(
                        Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                        settings?.hide_currency_product ? '' : currencySymbol,
                        store,
                        taxes,
                        selectedCountry
                      )}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {formatDisplayPrice(
                        Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                        settings?.hide_currency_product ? '' : currencySymbol,
                        store,
                        taxes,
                        selectedCountry
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-green-600">
                    {formatDisplayPrice(
                      parseFloat(product.price || 0),
                      settings?.hide_currency_product ? '' : currencySymbol,
                      store,
                      taxes,
                      selectedCountry
                    )}
                  </span>
                )}
              </div>
            </div>
            <CmsBlockRenderer position="product_below_price" />
            {/* Stock status badge, updated to reflect track_stock setting */}
            {getStockLabel(product) && (
              <Badge variant={getStockVariant(product)} className="mb-2">
                {getStockLabel(product)}
              </Badge>
            )}
            {product?.sku && (
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            )}
          </div>

          {product?.short_description && (
            <p className="text-gray-700 text-lg">{product.short_description}</p>
          )}

          {/* Custom Options Display - Now handled by the CustomOptions component */}
          <CustomOptions
            product={product}
            onSelectionChange={handleOptionChange}
            selectedOptions={selectedOptions} // Pass selected options to the component for UI
            store={store} // Pass store for rule evaluation within CustomOptions
            settings={settings} // Pass settings for currency symbol or other display logic
          />

          {/* CMS Block Renderer for "above add to cart" position */}
          <CmsBlockRenderer position="product_above_cart_button" />

          {/* Total Price - positioned above Add to Cart button */}
          {(getTotalPrice() > parseFloat(product.price) * quantity || selectedOptions.length > 0) && (
            <div className="text-lg font-semibold text-gray-800 mb-4">
              Total Price: {currencySymbol}{getTotalPrice().toFixed(2)}
              {selectedOptions.length > 0 && (
                <span className="text-sm text-gray-500 block">(includes selected options)</span>
              )}
            </div>
          )}

          {/* Quantity, Add to Cart, and Wishlist */}
          <div className="border-t pt-6">
            <div className="flex items-center space-x-4">
              {!settings?.hide_quantity_selector && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="quantity-input" className="font-medium text-sm">Qty:</label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
                        if (!isNaN(val) && val >= 1) setQuantity(val);
                        else if (e.target.value === '') setQuantity('');
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

              <Button
                onClick={handleAddToCart}
                disabled={!canAddToCart} // Use the new canAddToCart state based on stock settings
                className="flex-1 h-12 text-lg"
                style={{
                  backgroundColor: settings?.theme?.add_to_cart_button_color || '#28a745',
                  color: '#FFFFFF',
                }}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isInStock ? (loading ? 'Adding...' : 'Add to Cart') : 'Out of Stock'}
              </Button>

              <Button
                onClick={handleWishlistToggle}
                variant="outline"
                size="icon"
                className="h-12 w-12"
              >
                {isInWishlist ? (
                  <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                ) : (
                  <Heart className="w-6 h-6 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          {/* CMS Block Renderer for "below add to cart" position */}
          <CmsBlockRenderer position="product_below_cart_button" />
        </div>
      </div>

      {/* Product Tabs */}
      {productTabs.length > 0 && (
        <div className="mt-12 border-t pt-8">
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

          <div className="mt-6">
            {productTabs[activeTab] && (
              <div className="prose max-w-none">
                {/* Text content tab */}
                {productTabs[activeTab].tab_type === 'text' && productTabs[activeTab].content && (
                  <div dangerouslySetInnerHTML={{ __html: productTabs[activeTab].content }} />
                )}
                
                {/* Description tab */}
                {productTabs[activeTab].tab_type === 'description' && product?.description && (
                  <>
                    <CmsBlockRenderer position="product_above_description" />
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    <CmsBlockRenderer position="product_below_description" />
                  </>
                )}
                
                {/* Attributes tab */}
                {productTabs[activeTab].tab_type === 'attributes' && (
                  product?.attributes && Object.keys(product.attributes).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          <span>
                            {value && typeof value === 'object' && (value.url || value.name) ? (
                              <div className="flex space-x-2">
                                {value.url && (
                                  <>
                                    <a
                                      href={value.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </a>
                                    <a
                                      href={value.url}
                                      download={value.name || 'file'}
                                      className="text-green-600 hover:underline flex items-center"
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </a>
                                  </>
                                )}
                              </div>
                            ) : (
                              String(value ?? '')
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No additional attributes available for this product.</p>
                  )
                )}
                
                {/* Attribute sets tab */}
                {productTabs[activeTab].tab_type === 'attribute_sets' && (
                  <div className="text-gray-500">
                    Attribute sets functionality will be implemented to show attributes from the selected attribute sets.
                  </div>
                )}
                
                {/* Fallback for empty content */}
                {!productTabs[activeTab].content && 
                 productTabs[activeTab].tab_type === 'text' && (
                  <p className="text-gray-500">No content available for this tab.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-16">
        {/* CMS Block Renderer for "above product tabs" position */}
        <CmsBlockRenderer position="above_product_tabs" page="storefront_product" storeId={store?.id} />
        {/* Recommended Products component */}
        <RecommendedProducts 
          product={product} 
          storeId={store?.id} 
          selectedOptions={selectedOptions} 
        />
      </div>

    </div>
  );
}
