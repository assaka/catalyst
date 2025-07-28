import React, { useState, useEffect } from 'react';
import { StorefrontProduct } from '@/api/storefront-entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { useStore, cachedApiCall } from '@/components/storefront/StoreProvider';
import cartService from '@/services/cartService';
import ProductLabelComponent from '@/components/storefront/ProductLabel';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Component-level cache to avoid repeated API calls
const componentCache = new Map();
const COMPONENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Global rate limiting flag to prevent all instances from hitting API simultaneously
let globalRateLimitFlag = false;
let globalRateLimitTimeout = null;

const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 5000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 || 
                         error.message?.includes('Rate limit') || 
                         error.message?.includes('429') ||
                         error.detail?.includes('Rate limit');
      
      const isCorsError = error.message?.includes('CORS') || 
                         error.message?.includes('Failed to fetch');
      
      if ((isRateLimit || isCorsError) && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`RecommendedProducts: Network error, waiting ${delayTime.toFixed(0)}ms before retry ${i + 1}/${maxRetries}`, error.message);
        await delay(delayTime);
        continue;
      }
      
      if (isRateLimit || isCorsError) {
        console.error('RecommendedProducts: Network error exceeded after all retries, falling back to empty recommendations');
        return [];
      }
      
      throw error;
    }
  }
};

// Optimized data fetcher that combines and caches multiple API calls
const fetchRecommendationData = async (storeId, context = 'default') => {
  const cacheKey = `recommendations-data-${storeId}-${context}`;
  const now = Date.now();
  
  // Check component cache first
  if (componentCache.has(cacheKey)) {
    const cached = componentCache.get(cacheKey);
    if (now - cached.timestamp < COMPONENT_CACHE_TTL) {
      return cached.data;
    }
  }
  
  try {
    // Run both API calls in parallel with caching
    const [cartResult, featuredProducts] = await Promise.all([
      // Cart data with shorter cache (30 seconds) since it changes frequently
      (async () => {
        try {
          return await cartService.getCart();
        } catch (error) {
          console.warn('Failed to load cart data:', error);
          return { success: false, items: [] };
        }
      })(),
      
      // Featured products with longer cache (5 minutes) since they're stable
      cachedApiCall(
        `featured-products-${storeId}`, 
        () => StorefrontProduct.getFeatured({ limit: 8 }),
        COMPONENT_CACHE_TTL
      ).catch(error => {
        console.warn('Failed to load featured products:', error);
        return [];
      })
    ]);
    
    const data = {
      cartItems: cartResult?.items || [],
      featuredProducts: featuredProducts || []
    };
    
    // Cache the combined result
    componentCache.set(cacheKey, {
      data,
      timestamp: now
    });
    
    return data;
  } catch (error) {
    console.error('Failed to fetch recommendation data:', error);
    return {
      cartItems: [],
      featuredProducts: []
    };
  }
};

// A simplified ProductCard for this component
const SimpleProductCard = ({ product, settings }) => {
    const { productLabels } = useStore();
    
    return (
        <Card className="group overflow-hidden">
            <CardContent className="p-0">
                <Link to={createPageUrl(`ProductDetail?slug=${product.slug}`)}>
                    <div className="relative">
                        <img
                            src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
                            alt={product.name}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Product labels */}
                        {(() => {
                          // Filter labels that match the product conditions (using same logic as other pages)
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

                          // Sort by sort_order (ASC) then by priority (DESC) and show only the first one
                          const sortedLabels = matchingLabels.sort((a, b) => {
                            const sortOrderA = a.sort_order || 0;
                            const sortOrderB = b.sort_order || 0;
                            if (sortOrderA !== sortOrderB) {
                              return sortOrderA - sortOrderB; // ASC
                            }
                            const priorityA = a.priority || 0;
                            const priorityB = b.priority || 0;
                            console.log('🔍 Priority sorting debug (recommended):', {
                              labelA: a.name,
                              priorityA,
                              labelB: b.name,
                              priorityB,
                              result: priorityB - priorityA
                            });
                            return priorityB - priorityA; // DESC
                          });

                          // Show only the first (highest priority, lowest sort_order) label
                          const labelToShow = sortedLabels[0];
                          
                          return labelToShow ? (
                            <ProductLabelComponent
                              key={labelToShow.id}
                              label={labelToShow}
                            />
                          ) : null;
                        })()}
                    </div>
                </Link>
            <div className="p-4">
                <h3 className="font-semibold text-lg truncate mt-1">
                    <Link to={createPageUrl(`ProductDetail?slug=${product.slug}`)}>{product.name}</Link>
                </h3>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline gap-2">
                        {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                            <>
                                <p className="font-bold text-red-600 text-xl">
                                    {!settings?.hide_currency_product && (settings?.currency_symbol || '$')}{Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)).toFixed(2)}
                                </p>
                                <p className="text-gray-500 line-through text-sm">
                                    {!settings?.hide_currency_product && (settings?.currency_symbol || '$')}{Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)).toFixed(2)}
                                </p>
                            </>
                        ) : (
                            <p className="font-bold text-xl text-gray-900">
                                {!settings?.hide_currency_product && (settings?.currency_symbol || '$')}{parseFloat(product.price || 0).toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
    );
};

export default function RecommendedProducts({ product: currentProduct, storeId, products: providedProducts, selectedOptions = [] }) {
    const { settings, store } = useStore();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState([]);
    const [rateLimitHit, setRateLimitHit] = useState(false);

    // Helper function to compare two option arrays
    const areOptionsEqual = (options1, options2) => {
        if (!options1 && !options2) return true;
        if (!options1 || !options2) return false;
        if (options1.length !== options2.length) return false;
        
        // Sort both arrays by name to ensure consistent comparison
        const sorted1 = [...options1].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        const sorted2 = [...options2].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        return sorted1.every((option1, index) => {
            const option2 = sorted2[index];
            return option1.name === option2.name && 
                   parseFloat(option1.price || 0) === parseFloat(option2.price || 0);
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            // Skip if we've hit rate limits recently (local or global)
            if (rateLimitHit || globalRateLimitFlag) {
                setLoading(false);
                return;
            }
            
            // Use store ID from context or fallback to prop
            const currentStoreId = store?.id || storeId;
            if (!currentStoreId) {
                console.warn('RecommendedProducts: No store ID available');
                setLoading(false);
                return;
            }
            
            // Skip if we have provided products and no current product (CMS page case)
            // This prevents unnecessary API calls on CMS pages
            if (providedProducts && !currentProduct) {
                setProducts(providedProducts.slice(0, 4));
                setLoading(false);
                return;
            }
            
            try {
                // Add minimal delay (reduced from 3-5 seconds since we're caching)
                const randomDelay = 500 + Math.random() * 1000; // 0.5-1.5 seconds
                await delay(randomDelay);
                
                let cartItems = [];
                let cartProductIds = [];
                let productsToFilter = [];
                
                // If specific products are provided (like from CMS page), use them
                if (providedProducts && Array.isArray(providedProducts)) {
                    productsToFilter = providedProducts;
                    
                    // Still need cart data for filtering
                    try {
                        const cartResult = await cartService.getCart();
                        cartItems = cartResult.items || [];
                        cartProductIds = cartItems.map(item => item.product_id);
                        setCartItems(cartProductIds);
                    } catch (cartError) {
                        console.warn('RecommendedProducts: Failed to load cart data, continuing without cart exclusions');
                    }
                } else {
                    // Use optimized combined fetcher for cart + featured products
                    // Create context-aware cache key
                    const context = currentProduct ? 'product-detail' : 'general';
                    const { cartItems: fetchedCartItems, featuredProducts } = await fetchRecommendationData(currentStoreId, context);
                    
                    cartItems = fetchedCartItems;
                    cartProductIds = cartItems.map(item => item.product_id);
                    productsToFilter = featuredProducts;
                    setCartItems(cartProductIds);
                }
                
                // Filter out current product, cart items, and products with same custom options
                const filteredProducts = productsToFilter.filter(product => {
                    // Exclude current product if provided
                    if (currentProduct && product.id === currentProduct.id) {
                        return false;
                    }
                    
                    // Exclude products that are in cart
                    if (cartProductIds.includes(product.id)) {
                        return false;
                    }
                    
                    // Exclude products with same custom options as current product
                    if (currentProduct && selectedOptions && selectedOptions.length > 0) {
                        // Check if this product with same custom options is already in cart
                        const matchingCartItem = cartItems.find(cartItem => 
                            cartItem.product_id === product.id && 
                            areOptionsEqual(cartItem.selected_options, selectedOptions)
                        );
                        if (matchingCartItem) {
                            return false;
                        }
                        
                        // If this is the same product with same options as currently being viewed, exclude it
                        if (product.id === currentProduct.id && selectedOptions.length > 0) {
                            return false;
                        }
                    }
                    
                    return true;
                });
                
                // Take only 4 products after filtering
                setProducts(filteredProducts.slice(0, 4));
            } catch (error) {
                console.error("Failed to load recommended products:", error);
                
                // Check if this is a rate limiting error
                if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
                    setRateLimitHit(true);
                    // Set global rate limit flag to prevent all instances from trying
                    globalRateLimitFlag = true;
                    
                    // Clear existing timeout if any
                    if (globalRateLimitTimeout) {
                        clearTimeout(globalRateLimitTimeout);
                    }
                    
                    // Reset both flags after 5 minutes
                    globalRateLimitTimeout = setTimeout(() => {
                        setRateLimitHit(false);
                        globalRateLimitFlag = false;
                    }, 5 * 60 * 1000);
                }
                
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        
        // Only listen for cart updates on product detail pages (not on cart/cms pages)
        // This prevents excessive API calls when cart updates
        let cartUpdateHandler = null;
        if (currentProduct) {
            cartUpdateHandler = () => {
                if (!rateLimitHit) {
                    // Debounce cart updates to prevent rapid-fire API calls
                    setTimeout(() => fetchData(), 1000);
                }
            };
            window.addEventListener('cartUpdated', cartUpdateHandler);
        }
        
        return () => {
            if (cartUpdateHandler) {
                window.removeEventListener('cartUpdated', cartUpdateHandler);
            }
        };
    }, [currentProduct?.id, providedProducts, rateLimitHit, store?.id]); // Removed selectedOptions to reduce triggers

    if (loading || products.length === 0) {
        return null;
    }

    return (
        <div className="py-12">
            <h2 className="text-3xl font-bold text-center mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map(product => (
                    <SimpleProductCard key={product.id} product={product} settings={settings} />
                ))}
            </div>
        </div>
    );
}