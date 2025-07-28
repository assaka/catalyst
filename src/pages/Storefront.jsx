
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { CmsBlock } from "@/api/entities";
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import ProductLabelComponent from "@/components/storefront/ProductLabel";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import LayeredNavigation from "@/components/storefront/LayeredNavigation";
import Breadcrumb from "@/components/storefront/Breadcrumb";
import { formatDisplayPrice, calculateDisplayPrice } from "@/utils/priceUtils";
import {
  ShoppingCart,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data === null || data === undefined) return [];
  return [];
};

export default function Storefront() {
  const { store, settings, loading: storeLoading, productLabels, categories: storeCategories, filterableAttributes, taxes, selectedCountry } = useStore();
  
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  const [isHomepage, setIsHomepage] = useState(true);
  
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  
  const categorySlug = searchParams.get('category') || slug;
  

  const categories = useMemo(() => storeCategories || [], [storeCategories]);

  useEffect(() => {
    console.log('🔍 Storefront useEffect:', { storeLoading, storeId: store?.id, categorySlug });
    if (!storeLoading && store?.id) {
        const homepage = !categorySlug;
        console.log('📍 Storefront: Loading data, homepage:', homepage);
        setIsHomepage(homepage);
        loadData(homepage);
    }
  }, [categorySlug, store?.id, storeLoading, categories]);

  const loadData = async (isHome = false) => {
    try {
      console.log('🔍 Storefront loadData called:', { isHome, storeId: store?.id });
      setLoading(true);
      setActiveFilters({});
      if (!store) {
        console.log('❌ Storefront: No store, returning');
        return;
      }

      if (isHome) {
        console.log('🏠 Storefront: Loading homepage data');
        setCurrentCategory(null);
        const featuredCacheKey = `featured-products-${store.id}`;
        console.log('🔍 Storefront: Calling StorefrontProduct.getFeatured()');
        let featuredData = [];
        try {
          featuredData = await cachedApiCall(
            featuredCacheKey, 
            () => StorefrontProduct.getFeatured({ store_id: store.id, limit: 12 })
          );
          console.log('📊 Storefront: Featured products result:', featuredData);
        } catch (featuredError) {
          console.error('❌ Storefront: Featured products call failed:', featuredError);
          console.error('❌ Storefront: This likely means the backend is not deployed or not accessible');
          featuredData = []; // Use empty array as fallback
        }
        const featuredArray = ensureArray(featuredData);
        setFeaturedProducts(featuredArray);
        setProducts([]);
      } else {
        let category = null;
        if (categorySlug) {
          category = categories.find(c => c?.slug === categorySlug);
        }
        
        if (!category) {
          console.warn(`Category with slug '${categorySlug}' not found.`);
          setProducts([]);
          setCurrentCategory(null);
          setLoading(false);
          return;
        }
        
        setCurrentCategory(category);
        setFeaturedProducts([]);
        
        const cacheKey = `products-category-${category.id}-v3`;
        let productsData = await cachedApiCall(cacheKey, async () => {
          try {
            const exact = await StorefrontProduct.getByCategory(category.id, { 
              store_id: store.id
            });
            
            if (exact && exact.length > 0) {
              return exact;
            }
          } catch (e) {
          }
          
          const allProducts = await cachedApiCall(`all-active-products-${store.id}`, () => 
            StorefrontProduct.filter({ store_id: store.id })
          );
          
          const filtered = (allProducts || []).filter(product => {
            const hasCategories = product.category_ids && Array.isArray(product.category_ids);
            const includesCategory = hasCategories && product.category_ids.includes(category.id);
            console.log(`🔍 Product "${product.name}": category_ids=${JSON.stringify(product.category_ids)}, looking for ${category.id}, match=${includesCategory}`);
            return includesCategory;
          });
          console.log(`📊 Category filtering: ${allProducts?.length || 0} total products, ${filtered.length} match category "${category.name}"`);
          return filtered;
        });
        
        setProducts(ensureArray(productsData));
      }

    } catch (error) {
      console.error("Storefront: Error loading data:", error);
      setProducts([]);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredProducts = useMemo(() => {
    const currentProducts = isHomepage ? featuredProducts : products;
    if (Object.keys(activeFilters).length === 0) return currentProducts;

    return currentProducts.filter(product => {
      // Price range filtering - consider both price and compare_price
      if (activeFilters.priceRange) {
        const [min, max] = activeFilters.priceRange;
        let price = parseFloat(product.price || 0);
        
        // Use the lowest price if compare_price exists and is lower
        if (product.compare_price && parseFloat(product.compare_price) > 0) {
          price = Math.min(price, parseFloat(product.compare_price));
        }
        
        if (price < min || price > max) {
          return false;
        }
      }

      // Attribute filtering - check multiple possible attribute locations
      for (const key in activeFilters) {
        if (key !== 'priceRange') {
          const filterValues = activeFilters[key];
          if (!filterValues || filterValues.length === 0) continue;
          
          // Look for attribute value in multiple possible locations with various key formats
          const productAttributes = product.attributes || product.attribute_values || {};
          
          // Try multiple possible keys for the attribute (matching LayeredNavigation logic)
          const possibleKeys = [
            key,
            key.toLowerCase(),
            key.replace(/[_-]/g, '')
          ];
          
          let productValue = null;
          for (const possibleKey of possibleKeys) {
            if (productAttributes[possibleKey] !== undefined || product[possibleKey] !== undefined) {
              productValue = productAttributes[possibleKey] || product[possibleKey];
              break;
            }
          }
          
          // Handle undefined/null values
          if (productValue === undefined || productValue === null) {
            return false;
          }
          
          // Convert to string for comparison
          productValue = String(productValue);
          
          // Check if any of the filter values match
          const hasMatch = filterValues.some(filterVal => String(filterVal) === productValue);
          if (!hasMatch) {
            return false;
          }
        }
      }
      return true;
    });
  }, [products, featuredProducts, activeFilters, isHomepage]);

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

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pageTitle = isHomepage ? "Welcome to our Store" : 
                   currentCategory?.name || (categorySlug ? "Category Not Found" : "All Products");

  // Build breadcrumb items for category pages
  const getBreadcrumbItems = () => {
    if (isHomepage || !currentCategory) return [];
    
    const items = [];
    
    // Build hierarchy from current category up to root
    let category = currentCategory;
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
    
    // Convert to breadcrumb items
    return categoryChain.map((cat, index) => ({
      name: cat.name,
      url: createPageUrl(`Storefront?category=${cat.slug}`)
    }));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <SeoHeadManager 
        pageType={isHomepage ? "homepage" : "category"}
        pageData={isHomepage ? store : (currentCategory || store)}
        pageTitle={pageTitle}
      />
      
      
      {isHomepage ? (
        <div className="max-w-7xl mx-auto">
          <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 mb-12 rounded-lg">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{store?.name || "Welcome"}</h1>
              <p className="text-xl mb-8">{store?.description || "Discover amazing products"}</p>
              {categories.length > 0 && (
                <Link to={createPageUrl('Storefront') + `?category=${categories[0]?.slug}`}>
                  <Button size="lg" className="btn-primary text-white">
                    Shop Now
                  </Button>
                </Link>
              )}
            </div>
          </section>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Featured Products</h2>
                {categories.length > 0 && (
                  <Link to={createPageUrl('Storefront') + `?category=${categories[0]?.slug}`}>
                    <Button variant="outline">View All Products</Button>
                  </Link>
                )}
              </div>
              
              {featuredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.slice(0, 8).map((product) => (
                    <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow rounded-lg">
                      <Link to={createPageUrl(`ProductDetail`) + `?slug=${product.slug}`}>
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {(() => {
                            // Filter labels that match the product conditions (using same logic as ProductDetail)
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
                              console.log('🔍 Priority sorting debug:', {
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
                          {product.stock_quantity <= 0 && !product.infinite_stock && (
                            <Badge variant="destructive" className="absolute top-2 left-2">Out of Stock</Badge>
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold truncate">
                          <Link to={createPageUrl(`ProductDetail`) + `?slug=${product.slug}`} className="hover:text-blue-600">
                            {product.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-500 mb-3 h-10 overflow-hidden">{product.short_description}</p>
                        {getStockLabel(product) &&
                          <Badge variant={getStockVariant(product)}>
                            {getStockLabel(product)}
                          </Badge>
                        }
                        <div className="py-4 flex items-baseline gap-2">
                          {/* Tax-aware price display for homepage */}
                          {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                            <>
                              <p className="font-bold text-red-600 text-3xl">
                                {formatDisplayPrice(
                                  Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                  settings?.hide_currency_product ? '' : (settings?.currency_symbol || '$'),
                                  store,
                                  taxes,
                                  selectedCountry
                                )}
                              </p>
                              <p className="text-gray-500 line-through text-xl">
                                {formatDisplayPrice(
                                  Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                  settings?.hide_currency_product ? '' : (settings?.currency_symbol || '$'),
                                  store,
                                  taxes,
                                  selectedCountry
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="font-bold text-gray-800 text-lg">
                              {formatDisplayPrice(
                                parseFloat(product.price || 0),
                                settings?.hide_currency_product ? '' : (settings?.currency_symbol || '$'),
                                store,
                                taxes,
                                selectedCountry
                              )}
                            </p>
                          )}
                        </div>
                        <Button asChild className="w-full mt-3 btn-primary" disabled={product.stock_quantity <= 0 && !product.infinite_stock}>
                          <Link to={createPageUrl(`ProductDetail`) + `?slug=${product.slug}`}>
                            <ShoppingCart className="w-4 h-4 mr-2" /> View Product
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Featured Products</h3>
                  <p className="text-gray-600">Mark some products as featured to display them here.</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="mb-8 max-w-7xl mx-auto">
            <Breadcrumb items={getBreadcrumbItems()} />
            <h1 className="text-4xl font-bold">{pageTitle}</h1>
            {currentCategory?.description && (
              <p className="text-gray-600 mt-2">{currentCategory.description}</p>
            )}
          </div>

          <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-1">
              <LayeredNavigation
                products={products}
                attributes={filterableAttributes}
                onFilterChange={setActiveFilters}
              />
            </div>
            {/* FIXED: Maintain grid structure even when no products found */}
            <div className="lg:col-span-3">
              {loading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[400px]">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                            <CardContent className="p-4 space-y-3">
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-10 bg-gray-300 rounded w-full mt-2"></div>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[400px]">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow rounded-lg">
                            <Link to={createPageUrl(`ProductDetail`) + `?slug=${product.slug}`}>
                                <div className="relative aspect-square bg-gray-100">
                                    <img
                                        src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {(() => {
                                      // Filter labels that match the product conditions (using same logic as ProductDetail)
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

                                      console.log('🏷️ Storefront matching labels debug:', {
                                        productId: product.id,
                                        productName: product.name,
                                        isHomepage: isHomepage,
                                        matchingLabelsCount: matchingLabels.length,
                                        matchingLabels: matchingLabels.map(l => ({ 
                                          id: l.id, 
                                          name: l.name, 
                                          position: l.position,
                                          priority: l.priority,
                                          conditions: l.conditions
                                        }))
                                      });

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
                                          console.log('🔍 Priority sorting debug (category):', {
                                            productId: product.id,
                                            productName: product.name,
                                            isHomepage: isHomepage,
                                            position: a.position,
                                            labelA: a.name,
                                            priorityA,
                                            labelB: b.name,
                                            priorityB,
                                            result: priorityB - priorityA
                                          });
                                          return priorityB - priorityA; // DESC
                                        });
                                        return sortedLabels[0]; // Return highest priority label for this position
                                      }).filter(Boolean);

                                      console.log('🏷️ Storefront final labels to show:', {
                                        productId: product.id,
                                        productName: product.name,
                                        isHomepage: isHomepage,
                                        labelsToShowCount: labelsToShow.length,
                                        labelsToShow: labelsToShow.map(l => ({ 
                                          id: l.id, 
                                          name: l.name, 
                                          position: l.position 
                                        }))
                                      });

                                      // Show all labels (one per position)
                                      console.log('🚨 CRITICAL: About to render labels:', {
                                        productId: product.id,
                                        isHomepage,
                                        labelsToShowLength: labelsToShow.length,
                                        labelsToShow: labelsToShow
                                      });
                                      
                                      return labelsToShow.map(label => (
                                        <ProductLabelComponent
                                          key={label.id}
                                          label={label}
                                        />
                                      ));
                                    })()}
                                    {product.stock_quantity <= 0 && !product.infinite_stock && (
                                        <Badge variant="destructive" className="absolute top-2 left-2">Out of Stock</Badge>
                                    )}
                                </div>
                            </Link>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold truncate">
                                  <Link to={createPageUrl(`ProductDetail`) + `?slug=${product.slug}`} className="hover:text-blue-600">
                                    {product.name}
                                  </Link>
                                </h3>
                                <p className="text-sm text-gray-500 mb-3 h-10 overflow-hidden">{product.short_description}</p>
                                {getStockLabel(product) &&
                                    <Badge variant={getStockVariant(product)}>
                                      {getStockLabel(product)}
                                    </Badge>
                                }
                                <div className="flex items-baseline gap-2 my-4">
                                  {/* Tax-aware price display with compare_price logic */}
                                  {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                                      <>
                                        <p className="font-bold text-red-600 text-3xl">
                                          {formatDisplayPrice(
                                            Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                            settings?.hide_currency_category ? '' : (settings?.currency_symbol || '$'),
                                            store,
                                            taxes,
                                            selectedCountry
                                          )}
                                        </p>
                                        <p className="text-gray-500 line-through text-xl">
                                          {formatDisplayPrice(
                                            Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)),
                                            settings?.hide_currency_category ? '' : (settings?.currency_symbol || '$'),
                                            store,
                                            taxes,
                                            selectedCountry
                                          )}
                                        </p>
                                      </>
                                  ) : (
                                      <p className="font-bold text-gray-800 text-lg">
                                        {formatDisplayPrice(
                                          parseFloat(product.price || 0),
                                          settings?.hide_currency_category ? '' : (settings?.currency_symbol || '$'),
                                          store,
                                          taxes,
                                          selectedCountry
                                        )}
                                      </p>
                                  )}
                                </div>
                                <Button asChild className="w-full btn-primary" disabled={product.stock_quantity <= 0 && !product.infinite_stock}>
                                    <Link to={createPageUrl(`ProductDetail`) + `?slug=${product.slug}`}>
                                        <ShoppingCart className="w-4 h-4 mr-2" /> View Product
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col justify-center items-center bg-white rounded-lg shadow-sm p-16">
                      <Package className="w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800">No Products Found</h3>
                      <p className="text-gray-500 mt-2 text-center">
                        {currentCategory ? 
                          `No products found in the "${currentCategory.name}" category.` :
                          "No products match your current filters."
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
    </div>
  );
}
