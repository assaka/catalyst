
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { CmsBlock } from "@/api/entities";
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import ProductCard from "@/components/storefront/ProductCard";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import LayeredNavigation from "@/components/storefront/LayeredNavigation";
import Breadcrumb from "@/components/storefront/Breadcrumb";
import AttributeDebug from "@/components/debug/AttributeDebug";
import {
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      settings={settings}
                      className="hover:shadow-lg transition-shadow rounded-lg"
                    />
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

          {/* Temporary debug component */}
          <AttributeDebug attributes={filterableAttributes} products={products} />

          <div className={`grid ${(settings?.enable_product_filters !== false && filterableAttributes?.length > 0) ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-8 max-w-7xl mx-auto`}>
            {/* Debug logging for layered navigation */}
            {console.log('🔍 Storefront layered navigation debug:', {
              enable_product_filters: settings?.enable_product_filters,
              filterableAttributesCount: filterableAttributes?.length,
              productsCount: products?.length,
              settings: settings
            })}
            {(settings?.enable_product_filters !== false && filterableAttributes?.length > 0) && (
              <div className="lg:col-span-1">
                <LayeredNavigation
                  products={products}
                  attributes={filterableAttributes}
                  onFilterChange={setActiveFilters}
                />
              </div>
            )}
            {/* FIXED: Maintain grid structure even when no products found */}
            <div className={(settings?.enable_product_filters !== false && filterableAttributes?.length > 0) ? "lg:col-span-3" : "lg:col-span-1"}>
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
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        settings={settings}
                        className="hover:shadow-lg transition-shadow rounded-lg"
                      />
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
