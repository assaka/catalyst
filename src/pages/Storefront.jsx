
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { CmsBlock } from "@/api/entities";
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import ProductLabelComponent from "@/components/storefront/ProductLabel";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import LayeredNavigation from "@/components/storefront/LayeredNavigation";
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
  const { store, settings, loading: storeLoading, productLabels, categories: storeCategories, filterableAttributes } = useStore();
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
    if (!storeLoading && store?.id) {
        const homepage = !categorySlug;
        setIsHomepage(homepage);
        loadData(homepage);
    }
  }, [categorySlug, store?.id, storeLoading, categories]);

  const loadData = async (isHome = false) => {
    try {
      setLoading(true);
      setActiveFilters({});
      if (!store) return;

      console.log('Storefront: Loading data...', isHome ? 'homepage' : `category: ${categorySlug}`);

      if (isHome) {
        setCurrentCategory(null);
        const featuredCacheKey = `featured-products-${store.id}`;
        const featuredData = await cachedApiCall(
          featuredCacheKey, 
          () => Product.filter({ store_id: store.id, featured: true, status: 'active' }, '-created_date', 12)
        );
        const featuredArray = ensureArray(featuredData);
        if (featuredArray.length > 0) {
          console.log('🔍 Stock Debug - Featured product sample:', {
            name: featuredArray[0].name,
            stock_quantity: featuredArray[0].stock_quantity,
            infinite_stock: featuredArray[0].infinite_stock,
            manage_stock: featuredArray[0].manage_stock
          });
        }
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
            const exact = await Product.filter({ 
              store_id: store.id, 
              status: 'active',
              category_ids: { contains: [category.id] }
            });
            
            if (exact && exact.length > 0) {
              console.log(`Found ${exact?.length || 0} products for category ${category.name} via exact filter.`);
              return exact;
            }
          } catch (e) {
            console.warn('Storefront: Exact category filter failed, trying alternative:', e);
          }
          
          console.log('Storefront: Trying manual category filtering...');
          const allProducts = await cachedApiCall(`all-active-products-${store.id}`, () => 
            Product.filter({ store_id: store.id, status: 'active' })
          );
          
          const filtered = (allProducts || []).filter(product => 
            product.category_ids && 
            Array.isArray(product.category_ids) && 
            product.category_ids.includes(category.id)
          );
          console.log(`Storefront: Manual filtering found ${filtered.length} products`);
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
      if (activeFilters.priceRange) {
        const [min, max] = activeFilters.priceRange;
        const price = parseFloat(product.price || 0);
        if (price < min || price > max) {
          return false;
        }
      }

      for (const key in activeFilters) {
        if (key !== 'priceRange' && product.attributes) {
          const filterValues = activeFilters[key];
          const productValue = product.attributes[key];
          if (filterValues && !filterValues.includes(productValue)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [products, featuredProducts, activeFilters, isHomepage]);

  // Helper function to get stock label based on settings and quantity
  const getStockLabel = (product) => {
    // Default behavior if no stock settings are found
    if (!store?.settings?.stock_settings) {
      if (product.stock_quantity <= 0 && !product.infinite_stock) {
        return "Out of Stock";
      }
      return "In Stock";
    }

    const stockSettings = store.settings.stock_settings;

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
    
    // Handle low stock
    const lowStockThreshold = product.low_stock_threshold || settings?.display_low_stock_threshold || 0;
    if (lowStockThreshold > 0 && product.stock_quantity <= lowStockThreshold) {
      const label = stockSettings.low_stock_label || "Low stock, just {quantity} left";
      return label.replace('{quantity}', product.stock_quantity.toString());
    }
    
    // Handle regular in stock
    const label = stockSettings.in_stock_label || "In Stock";
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
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
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
                          {productLabels && productLabels.map((label) => {
                            let showLabel = false;
                            // FIXED: Simplified product label condition
                            if (!label.conditions || Object.keys(label.conditions).length === 0) {
                                showLabel = true; 
                            } else {
                                if (label.conditions.price_conditions) {
                                    const conditions = label.conditions.price_conditions;
                                    if (conditions.has_sale_price && product.compare_price && product.compare_price > product.price) {
                                        showLabel = true;
                                    }
                                    if (conditions.is_new && conditions.days_since_created) {
                                        const productCreatedDate = new Date(product.created_date);
                                        const now = new Date();
                                        const daysSince = Math.floor((now.getTime() - productCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
                                        if (daysSince <= conditions.days_since_created) {
                                            showLabel = true;
                                        }
                                    }
                                }
                                if (label.conditions.attribute_conditions && product.attributes) {
                                    const attributeMatch = label.conditions.attribute_conditions.some(cond => 
                                        product.attributes[cond.attribute_code] === cond.attribute_value
                                    );
                                    if (attributeMatch) {
                                        showLabel = true;
                                    }
                                }
                            }
                            if (showLabel) {
                              return (
                                <ProductLabelComponent
                                  key={label.id}
                                  label={label}
                                />
                              );
                            }
                            return null;
                          })}
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
                        <div className="flex justify-between items-center">
                          <div className="flex items-baseline gap-2">
                            {/* FIXED: Inverted price logic to always show lowest price first */}
                            {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                              <>
                                <p className="font-bold text-red-600 text-3xl">
                                  {!settings?.hide_currency_category && '$'}{Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)).toFixed(2)}
                                </p>
                                <p className="text-gray-500 line-through text-xl">
                                  {!settings?.hide_currency_category && '$'}{Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)).toFixed(2)}
                                </p>
                              </>
                            ) : (
                              <p className="font-bold text-gray-800 text-lg">
                                {!settings?.hide_currency_category && '$'}{parseFloat(product.price || 0).toFixed(2)}
                              </p>
                            )}
                          </div>
                          <Badge variant={getStockVariant(product)}>
                            {getStockLabel(product)}
                          </Badge>
                        </div>
                        <Button asChild className="w-full mt-3" disabled={product.stock_quantity <= 0 && !product.infinite_stock}>
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
                                    {/* FIXED: Simplified product label condition */}
                                    {productLabels && productLabels.map((label) => {
                                        let showLabel = false;
                                        if (!label.conditions || Object.keys(label.conditions).length === 0) {
                                            showLabel = true;
                                        } else {
                                            if (label.conditions.price_conditions) {
                                                const conditions = label.conditions.price_conditions;
                                                if (conditions.has_sale_price && product.compare_price && product.compare_price > product.price) {
                                                    showLabel = true;
                                                }
                                                if (conditions.is_new && conditions.days_since_created) {
                                                    const productCreatedDate = new Date(product.created_date);
                                                    const now = new Date();
                                                    const daysSince = Math.floor((now.getTime() - productCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
                                                    if (daysSince <= conditions.days_since_created) {
                                                        showLabel = true;
                                                    }
                                                }
                                            }
                                            if (label.conditions.attribute_conditions && product.attributes) {
                                                const attributeMatch = label.conditions.attribute_conditions.some(cond => 
                                                    product.attributes[cond.attribute_code] === cond.attribute_value
                                                );
                                                if (attributeMatch) {
                                                    showLabel = true;
                                                }
                                            }
                                        }
                                        if (showLabel) {
                                          return (
                                            <ProductLabelComponent
                                              key={label.id}
                                              label={label}
                                            />
                                          );
                                        }
                                        return null;
                                      })}
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
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-baseline gap-2">
                                      {/* FIXED: Inverted price logic to always show lowest price first */}
                                      {product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price) ? (
                                        <>
                                          <p className="font-bold text-red-600 text-3xl">
                                            {!settings?.hide_currency_category && '$'}{Math.min(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)).toFixed(2)}
                                          </p>
                                          <p className="text-gray-500 line-through text-xl">
                                            {!settings?.hide_currency_category && '$'}{Math.max(parseFloat(product.price || 0), parseFloat(product.compare_price || 0)).toFixed(2)}
                                          </p>
                                        </>
                                      ) : (
                                        <p className="font-bold text-gray-800 text-lg">
                                          {!settings?.hide_currency_category && '$'}{parseFloat(product.price || 0).toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                    <Badge variant={getStockVariant(product)}>
                                        {getStockLabel(product)}
                                    </Badge>
                                </div>
                                <Button asChild className="w-full" disabled={product.stock_quantity <= 0 && !product.infinite_stock}>
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
