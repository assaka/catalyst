import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createCategoryUrl } from "@/utils/urlUtils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import ProductItemCard from "@/components/storefront/ProductItemCard";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import { Package, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProductName, getProductShortDescription, getCurrentLanguage } from "@/utils/translationUtils";
import { useTranslation } from "@/contexts/TranslationContext";

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data === null || data === undefined) return [];
  return [];
};

export default function Homepage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const { store, settings, loading: storeLoading, categories, productLabels, taxes, selectedCountry } = useStore();
  const { t } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeLoading && store?.id) {
      if (searchQuery) {
        loadSearchResults(searchQuery);
      } else {
        loadFeaturedProducts();
      }

      // Track homepage view
      if (typeof window !== 'undefined' && window.catalyst?.trackEvent) {
        window.catalyst.trackEvent('page_view', {
          page_type: searchQuery ? 'search_results' : 'homepage',
          store_name: store.name,
          store_id: store.id,
          search_query: searchQuery || undefined
        });
      }
    }
  }, [store?.id, storeLoading, searchQuery]);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      if (!store) return;

      const featuredCacheKey = `featured-products-${store.id}`;
      let featuredData = [];
      try {
        featuredData = await cachedApiCall(
          featuredCacheKey,
          () => StorefrontProduct.getFeatured({ store_id: store.id, limit: 12 })
        );
      } catch (featuredError) {
        featuredData = []; // Use empty array as fallback
      }
      const featuredArray = ensureArray(featuredData);
      setFeaturedProducts(featuredArray);
    } catch (error) {
      console.error("Homepage: Error loading featured products:", error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSearchResults = async (query) => {
    try {
      setLoading(true);
      if (!store) return;

      // Get products from backend
      const products = await StorefrontProduct.list('-created_date', 50);

      // Filter by search query including translations
      const searchLower = query.toLowerCase();
      const currentLang = getCurrentLanguage();

      const filteredProducts = products.filter(product => {
        // Search in direct fields
        const matchesDirectFields =
          product.name?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.short_description?.toLowerCase().includes(searchLower);

        // Search in translated fields
        const translatedName = getProductName(product, currentLang);
        const translatedDescription = getProductShortDescription(product, currentLang);
        const matchesTranslations =
          translatedName?.toLowerCase().includes(searchLower) ||
          translatedDescription?.toLowerCase().includes(searchLower);

        return matchesDirectFields || matchesTranslations;
      });

      setSearchResults(filteredProducts);
    } catch (error) {
      console.error("Homepage: Error searching products:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on stock settings
  const getFilteredProducts = () => {
    let products = searchQuery ? searchResults : featuredProducts;
    
    // Apply stock filtering based on display_out_of_stock setting
    if (settings?.enable_inventory && !settings?.display_out_of_stock) {
      products = products.filter(product => {
        if (product.stock_quantity !== undefined && product.stock_quantity !== null) {
          return product.stock_quantity > 0;
        }
        return true; // Products without stock_quantity are always shown (unlimited stock)
      });
    }
    
    return products;
  };

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();
  const storeCode = store?.slug || store?.code;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <SeoHeadManager
        pageType={searchQuery ? "search" : "homepage"}
        pageData={store}
        pageTitle={searchQuery ? `Search results for "${searchQuery}"` : "Welcome to our Store"}
      />
      
      <div className="max-w-7xl mx-auto">
        {!searchQuery && (
          <>
            <CmsBlockRenderer position="homepage_above_hero" />

            {/* Hero section via CMS Block */}
            <CmsBlockRenderer position="homepage_hero" />

            <CmsBlockRenderer position="homepage_below_hero" />
          </>
        )}

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
            {!searchQuery && <CmsBlockRenderer position="homepage_above_featured" />}

            <div className="flex justify-between items-center my-8">
              <h2 className="text-3xl font-bold">
                {searchQuery ? (
                  <>
                    <SearchIcon className="inline-block w-8 h-8 mr-2 mb-1" />
                    {t('common.search_results_for', 'Search Results for')} "{searchQuery}"
                  </>
                ) : (
                  'Featured Products'
                )}
              </h2>
              {!searchQuery && categories && categories.length > 0 && (
                <Link to={createCategoryUrl(storeCode, categories[0]?.slug)}>
                  <Button variant="outline">View All Products</Button>
                </Link>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.slice(0, searchQuery ? filteredProducts.length : 8).map((product) => (
                  <ProductItemCard
                    key={product.id}
                    product={product}
                    settings={settings}
                    store={store}
                    taxes={taxes}
                    selectedCountry={selectedCountry}
                    productLabels={productLabels}
                    className="hover:shadow-lg transition-shadow rounded-lg"
                    viewMode="grid"
                    slotConfig={{}}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                {searchQuery ? (
                  <>
                    <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">No products match your search for "{searchQuery}".</p>
                    <p className="text-gray-600 mt-2">Try different keywords or browse all products.</p>
                  </>
                ) : (
                  <>
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Featured Products</h3>
                    <p className="text-gray-600">Mark some products as featured to display them here.</p>
                  </>
                )}
              </div>
            )}

            {!searchQuery && (
              <>
                <CmsBlockRenderer position="homepage_below_featured" />

                <CmsBlockRenderer position="homepage_above_content" />

                {/* Additional homepage content can go here */}

                <CmsBlockRenderer position="homepage_below_content" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}