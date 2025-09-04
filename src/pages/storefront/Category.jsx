import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { createCategoryUrl } from "@/utils/urlUtils";
import { useNotFound } from "@/utils/notFoundUtils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import ProductCard from "@/components/storefront/ProductCard";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import LayeredNavigation from "@/components/storefront/LayeredNavigation";
import Breadcrumb from "@/components/storefront/Breadcrumb";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data === null || data === undefined) return [];
  return [];
};

export default function Category() {
  const { store, settings, loading: storeLoading, categories, filterableAttributes } = useStore();
  const { showNotFound } = useNotFound();
  
  const [products, setProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  
  const { storeCode, categorySlug: routeCategorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const categorySlug = searchParams.get('category') || routeCategorySlug;

  useEffect(() => {
    if (!storeLoading && store?.id && categorySlug) {
      loadCategoryProducts();
      
      // Track category view
      if (typeof window !== 'undefined' && window.catalyst?.trackEvent) {
        const category = categories?.find(c => c?.slug === categorySlug);
        if (category) {
          window.catalyst.trackEvent('page_view', {
            page_type: 'category',
            category_name: category.name,
            category_id: category.id,
            store_name: store.name,
            store_id: store.id
          });
        }
      }
    }
  }, [categorySlug, store?.id, storeLoading, categories]);

  const loadCategoryProducts = async () => {
    try {
      setLoading(true);
      setActiveFilters({});
      if (!store || !categorySlug) return;

      let category = null;
      if (categories) {
        category = categories.find(c => c?.slug === categorySlug);
      }
      
      if (!category) {
        console.warn(`Category with slug '${categorySlug}' not found.`);
        showNotFound(`Category "${categorySlug}" not found`);
        return;
      }
      
      setCurrentCategory(category);
      
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
          console.warn("Failed to get products by category, falling back to filtered approach");
        }
        
        const allProducts = await cachedApiCall(`all-active-products-${store.id}`, () => 
          StorefrontProduct.filter({ store_id: store.id })
        );
        
        const filtered = (allProducts || []).filter(product => {
          const hasCategories = product.category_ids && Array.isArray(product.category_ids);
          const includesCategory = hasCategories && product.category_ids.includes(category.id);
          return includesCategory;
        });
        return filtered;
      });
      
      setProducts(ensureArray(productsData));
    } catch (error) {
      console.error("Category: Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredProducts = useMemo(() => {
    let currentProducts = products;
    
    // First apply stock filtering based on display_out_of_stock setting
    if (settings?.enable_inventory && !settings?.display_out_of_stock) {
      currentProducts = currentProducts.filter(product => {
        if (product.stock_quantity !== undefined && product.stock_quantity !== null) {
          return product.stock_quantity > 0;
        }
        return true; // Products without stock_quantity are always shown (unlimited stock)
      });
    }
    
    // Then apply user filters
    if (Object.keys(activeFilters).length === 0) return currentProducts;

    return currentProducts.filter(product => {
      // Price range filtering
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

      // Attribute filtering
      for (const key in activeFilters) {
        if (key !== 'priceRange') {
          const filterValues = activeFilters[key];
          if (!filterValues || filterValues.length === 0) continue;
          
          const productAttributes = product.attributes || product.attribute_values || {};
          
          // Try multiple possible keys for the attribute
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
          
          if (productValue === undefined || productValue === null) {
            return false;
          }
          
          productValue = String(productValue);
          
          const hasMatch = filterValues.some(filterVal => String(filterVal) === productValue);
          if (!hasMatch) {
            return false;
          }
        }
      }
      return true;
    });
  }, [products, activeFilters, settings]);

  // Build breadcrumb items for category pages
  const getBreadcrumbItems = () => {
    if (!currentCategory || !categories) return [];
    
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
    
    // Filter out root categories (categories with no parent_id or level 0)
    const filteredChain = categoryChain.filter(cat => cat.parent_id !== null && cat.level > 0);
    
    // Convert to breadcrumb items
    return filteredChain.map((cat, index) => ({
      name: cat.name,
      url: createCategoryUrl(storeCode, cat.slug)
    }));
  };

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pageTitle = currentCategory?.name || (categorySlug ? "Category Not Found" : "All Products");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <SeoHeadManager 
        pageType="category"
        pageData={currentCategory ? {
          ...currentCategory,
          category_ids: [currentCategory.id],
          categories: [currentCategory.id]
        } : store}
        pageTitle={pageTitle}
      />
      
      <div className="mb-8 max-w-7xl mx-auto">
        <Breadcrumb items={getBreadcrumbItems()} />
        <h1 className="text-4xl font-bold">{pageTitle}</h1>
        {currentCategory?.description && (
          <p className="text-gray-600 mt-2">{currentCategory.description}</p>
        )}
      </div>

      <div className={`grid ${(settings?.enable_product_filters !== false && filterableAttributes?.length > 0) ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-8 max-w-7xl mx-auto`}>
        {(settings?.enable_product_filters !== false && filterableAttributes?.length > 0) && (
          <div className="lg:col-span-1 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <CmsBlockRenderer position="category_above_filters" />
            <LayeredNavigation
              products={products}
              attributes={filterableAttributes}
              onFilterChange={setActiveFilters}
            />
            <CmsBlockRenderer position="category_below_filters" />
          </div>
        )}
        
        <div className={(settings?.enable_product_filters !== false && filterableAttributes?.length > 0) ? "lg:col-span-3" : "lg:col-span-1"}>
          <CmsBlockRenderer position="category_above_products" />
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
          <CmsBlockRenderer position="category_below_products" />
        </div>
      </div>
    </div>
  );
}