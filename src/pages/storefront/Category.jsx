import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { createCategoryUrl } from "@/utils/urlUtils";
import { useNotFound } from "@/utils/notFoundUtils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import ProductCard from "@/components/storefront/ProductCard";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import LayeredNavigation from "@/components/storefront/LayeredNavigation";
import Breadcrumb from "@/components/storefront/Breadcrumb";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import { CategorySlotRenderer } from "@/components/storefront/CategorySlotRenderer";
import { usePagination, useSorting } from "@/hooks/useUrlUtils";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import slotConfigurationService from '@/services/slotConfigurationService';

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
  const [itemsPerPage] = useState(12);
  const [categorySlots, setCategorySlots] = useState(null);

  const { storeCode, categorySlug } = useParams();
  const { currentPage, setPage } = usePagination();
  const { currentSort, setSort } = useSorting();

  // Load category slot configuration
  const loadCategorySlotConfiguration = async () => {
    if (!store?.id) return;

    try {
      const config = await slotConfigurationService.getConfiguration(store.id, 'category_layout');

      if (config?.slots && Object.keys(config.slots).length > 0) {
        // Use the saved configuration from editor
        setCategorySlots(config.slots);
      } else {
        // Load default configuration and ensure header slots exist for styling
        const { categoryConfig } = await import('@/components/editor/slot/configs/category-config');

        // Extract just the header-related slots from the default config
        const headerSlots = {
          breadcrumbs: categoryConfig.slots.breadcrumbs,
          header: categoryConfig.slots.header,
          header_description: categoryConfig.slots.header_description
        };

        setCategorySlots(headerSlots);
      }
    } catch (error) {
      console.warn('Could not load category slot configuration:', error);

      // Fallback: create minimal header slots that can receive styling
      const fallbackSlots = {
        breadcrumbs: {
          id: 'breadcrumbs',
          type: 'text',
          content: '',
          className: 'w-full flex mb-8',
          styles: {},
          parentId: null,
          colSpan: { grid: 12, list: 12 },
          viewMode: ['grid', 'list']
        },
        header: {
          id: 'header',
          type: 'text',
          content: '',
          className: 'text-4xl font-bold',
          styles: {},
          parentId: null,
          colSpan: { grid: 12, list: 12 },
          viewMode: ['grid', 'list']
        },
        header_description: {
          id: 'header_description',
          type: 'text',
          content: '',
          className: 'w-full mb-8',
          styles: {},
          parentId: null,
          colSpan: { grid: 12, list: 12 },
          viewMode: ['grid', 'list']
        }
      };

      setCategorySlots(fallbackSlots);
    }
  };

  useEffect(() => {
    if (!storeLoading && store?.id && categorySlug) {
      loadCategoryProducts();
      loadCategorySlotConfiguration();

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

      if (!store || !categorySlug) {
        return;
      }

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
        } catch {
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

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (currentSort) {
      case 'name-asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'price-asc':
        return sorted.sort((a, b) => {
          // Use the same logic as ProductCard for actual selling price
          let priceA = parseFloat(a.price || 0);
          let priceB = parseFloat(b.price || 0);

          // If there's a compare_price, use the lower of the two prices (sale price)
          if (a.compare_price && parseFloat(a.compare_price) > 0) {
            priceA = Math.min(priceA, parseFloat(a.compare_price));
          }
          if (b.compare_price && parseFloat(b.compare_price) > 0) {
            priceB = Math.min(priceB, parseFloat(b.compare_price));
          }

          return priceA - priceB;
        });
      case 'price-desc':
        return sorted.sort((a, b) => {
          // Use the same logic as ProductCard for actual selling price
          let priceA = parseFloat(a.price || 0);
          let priceB = parseFloat(b.price || 0);

          // If there's a compare_price, use the lower of the two prices (sale price)
          if (a.compare_price && parseFloat(a.compare_price) > 0) {
            priceA = Math.min(priceA, parseFloat(a.compare_price));
          }
          if (b.compare_price && parseFloat(b.compare_price) > 0) {
            priceB = Math.min(priceB, parseFloat(b.compare_price));
          }

          return priceB - priceA;
        });
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      default:
        return sorted;
    }
  }, [filteredProducts, currentSort]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const handleSortChange = (newSort) => {
    setSort(newSort);
  };

  const handlePageChange = (page) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build breadcrumb items for category pages
  const getBreadcrumbItems = () => {
    if (!currentCategory || !categories) return [];
    
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
    return filteredChain.map((cat) => ({
      name: cat.name,
      url: createCategoryUrl(storeCode, cat.slug)
    }));
  };

  // Create category context for CategorySlotRenderer
  const categoryContext = {
    category: currentCategory,
    products: paginatedProducts,
    filters: {},
    sortOption: currentSort,
    currentPage,
    totalPages,
    subcategories: [],
    breadcrumbs: getBreadcrumbItems(),
    selectedFilters: activeFilters,
    priceRange: {},
    currencySymbol: settings?.currency_symbol || '$',
    settings,
    store,
    taxes: [],
    selectedCountry: null,
    handleFilterChange: setActiveFilters,
    handleSortChange: handleSortChange,
    handlePageChange: handlePageChange,
    clearFilters: () => setActiveFilters({}),
    formatDisplayPrice: (price) => `${settings?.currency_symbol || '$'}${price}`,
    getProductImageUrl: (product) => product?.images?.[0] || '/placeholder-product.jpg',
    navigate: (url) => window.location.href = url,
    onProductClick: (product) => window.location.href = createCategoryUrl(store?.code, product.slug)
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
        {categorySlots ? (
          // Always render using CategorySlotRenderer to enable styling
          <CategorySlotRenderer
            slots={categorySlots}
            parentId={null}
            viewMode="list"
            categoryContext={categoryContext}
          />
        ) : (
          // Loading state - show nothing until slots are loaded
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
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

          {/* Sorting and Results Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="text-sm text-gray-600">
              Showing {sortedProducts.length > 0 ? Math.min((currentPage - 1) * itemsPerPage + 1, sortedProducts.length) : 0}-{Math.min(currentPage * itemsPerPage, sortedProducts.length)} of {sortedProducts.length} products
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[400px]">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => (
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(1)}
                            isActive={1 === currentPage}
                            className="cursor-pointer"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {currentPage > 4 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      </>
                    )}

                    {/* Page numbers around current page */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      if (pageNumber < 1 || pageNumber > totalPages) return null;
                      if (pageNumber === 1 && currentPage > 3) return null;
                      if (pageNumber === totalPages && currentPage < totalPages - 2) return null;

                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={pageNumber === currentPage}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            isActive={totalPages === currentPage}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
          <CmsBlockRenderer position="category_below_products" />
        </div>
      </div>
    </div>
  );
}