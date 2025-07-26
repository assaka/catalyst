
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { User } from "@/api/entities";
import cartService from "@/services/cartService";
// ProductLabel entity is no longer imported directly as its data is now provided via useStore.
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import {
  ShoppingCart, Star, ChevronLeft, ChevronRight, Minus, Plus, Heart, Download, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductTab } from "@/api/entities";
import { Wishlist } from "@/api/entities";
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
  const { slug: paramSlug } = useParams();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug') || paramSlug;
  
  console.log('🚨 PRODUCTDETAIL DEBUG: Slug extracted:', slug, 'from URL:', window.location.href);

  // Updated useStore destructuring: productLabels is now sourced directly from the store context.
  const { store, settings, loading: storeLoading, categories, productLabels } = useStore();
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
      console.log('🚨 CRITICAL DEBUG: About to load product with slug:', slug, 'for store:', store.id);
      console.log('🔐 AUTH DEBUG: Current user and token status:', {
        hasUser: !!user,
        userEmail: user?.email,
        userRole: user?.role,
        hasAuthToken: !!localStorage.getItem('auth_token'),
        storeId: store.id,
        storeName: store.name,
        storeOwnerEmail: store.owner_email
      });
      
      // First try to find by slug
      let products = await cachedApiCall(cacheKey, () =>
        Product.filter({ store_id: store.id, slug: slug, status: 'active' })
      );
      
      console.log('🚨 CRITICAL DEBUG: API returned for slug', slug, ':', products);

      // If no product found by slug, try searching by SKU as fallback
      if (!products || products.length === 0) {
        console.log('🔍 No product found by slug, trying SKU fallback for:', slug);
        const skuCacheKey = `product-detail-sku-${slug}-${store.id}`;
        products = await cachedApiCall(skuCacheKey, () =>
          Product.filter({ store_id: store.id, sku: slug, status: 'active' })
        );
        console.log('🔍 SKU search results for', slug, ':', products);
      }

      if (products && products.length > 0) {
        const foundProduct = products[0];
        console.log('🔍 ProductDetail: Found product details:', {
          id: foundProduct.id,
          name: foundProduct.name,
          slug: foundProduct.slug,
          sku: foundProduct.sku,
          store_id: foundProduct.store_id,
          status: foundProduct.status
        });
        
        // Critical check: verify the product matches the request
        // Allow match by either slug OR SKU (since SKU can be used as a fallback identifier)
        const matchesBySlug = foundProduct.slug === slug;
        const matchesBySku = foundProduct.sku === slug;
        
        if (!matchesBySlug && !matchesBySku) {
          console.error('🚨 PRODUCT MISMATCH DETECTED!', {
            requestedIdentifier: slug,
            foundProductSlug: foundProduct.slug,
            foundProductSku: foundProduct.sku,
            foundProductName: foundProduct.name
          });
          // Show "not found" instead of wrong product
          console.log('🚨 Setting product to null due to identifier mismatch');
          setProduct(null);
          setLoading(false);
          return;
        }
        
        if (matchesBySku && !matchesBySlug) {
          console.log('✅ Product found by SKU fallback:', {
            requestedIdentifier: slug,
            foundProductSlug: foundProduct.slug,
            foundProductSku: foundProduct.sku
          });
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
        () => ProductTab.filter({ store_id: store.id, is_active: true })
      );
      setProductTabs(tabs || []);
    } catch (error) {
      console.error('Error loading product tabs:', error);
      setProductTabs([]);
    }
  };

  const checkWishlistStatus = async (productId) => {
    if (!store?.id || !productId) return;
    try {
      let sessionId = localStorage.getItem('guest_session_id');
      if (!sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guest_session_id', sessionId);
      }

      const wishlistFilter = {
        product_id: productId,
        store_id: store.id,
      };

      if (user?.id) {
        wishlistFilter.user_id = user.id;
      } else {
        wishlistFilter.session_id = sessionId;
      }

      const wishlistItems = await Wishlist.filter(wishlistFilter);
      setIsInWishlist(wishlistItems && wishlistItems.length > 0);
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

    return (basePrice + optionsPrice) * quantity;
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

      console.log('🛒 ProductDetail: Adding to cart with simplified service');
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
      let sessionId = localStorage.getItem('guest_session_id');
      if (!sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guest_session_id', sessionId);
      }

      const wishlistFilter = {
        product_id: product.id,
        store_id: store.id,
      };

      if (user?.id) {
        wishlistFilter.user_id = user.id;
      } else {
        wishlistFilter.session_id = sessionId;
      }

      const wishlistItems = await Wishlist.filter(wishlistFilter);

      if (isInWishlist) {
        if (wishlistItems && wishlistItems.length > 0) {
          await Wishlist.delete(wishlistItems[0].id);
        }
        setIsInWishlist(false);
        setFlashMessage({
          type: 'success',
          message: 'Product removed from wishlist'
        });
      } else {
        await Wishlist.create({
          product_id: product.id,
          store_id: store.id,
          user_id: user?.id || null,
          session_id: sessionId
        });
        setIsInWishlist(true);
        setFlashMessage({
          type: 'success',
          message: 'Product added to wishlist'
        });
      }

      window.dispatchEvent(new CustomEvent('wishlistUpdated'));

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
    console.log('🎯 ProductDetail: Custom options changed:', newSelectedOptions);
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
            {productLabels && productLabels.length > 0 && productLabels.map((label) => {
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

              if (shouldShow) {
                return (
                  <ProductLabelComponent
                    key={label.id}
                    label={label}
                  />
                );
              }
              return null;
            })}
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
            <h1 className="text-3xl font-bold mb-2">{product?.name}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-baseline space-x-2">
                {/* Inverted price logic to always show lowest price first */}
                {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                  <>
                    <span className="text-3xl font-bold text-red-600">
                      {!settings?.hide_currency_product && currencySymbol}{Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)).toFixed(2)}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {!settings?.hide_currency_product && currencySymbol}{Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-green-600">
                    {!settings?.hide_currency_product && currencySymbol}{parseFloat(product.price || 0).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
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
          <CmsBlockRenderer position="above_add_to_cart" page="storefront_product" storeId={store?.id} />

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
              {console.log('🔍 DEBUG ProductDetail - settings.hide_quantity_selector:', settings?.hide_quantity_selector) || !settings?.hide_quantity_selector && (
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
          <CmsBlockRenderer position="below_add_to_cart" page="storefront_product" storeId={store?.id} />
        </div>
      </div>

      <div className="mt-16">
        {/* CMS Block Renderer for "above product tabs" position */}
        <CmsBlockRenderer position="above_product_tabs" page="storefront_product" storeId={store?.id} />
        {/* Recommended Products component */}
        <RecommendedProducts product={product} storeId={store?.id} />
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
                  {tab.title}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            {productTabs[activeTab] && (
              <div className="prose max-w-none">
                {productTabs[activeTab].content_type === 'description' && product?.description && (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                )}
                {productTabs[activeTab].content_type === 'attributes' ? (
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
                ) : null}
                {productTabs[activeTab].content_type === 'reviews' && (
                  <div className="text-gray-500">
                    Reviews functionality coming soon...
                  </div>
                )}
                {productTabs[activeTab].content_type === 'custom' && productTabs[activeTab].content && (
                  <div dangerouslySetInnerHTML={{ __html: productTabs[activeTab].content }} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
