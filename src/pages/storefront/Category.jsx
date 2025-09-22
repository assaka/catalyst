import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { createCategoryUrl, createProductUrl } from "@/utils/urlUtils";
import { useNotFound } from "@/utils/notFoundUtils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import { CategorySlotRenderer } from "@/components/storefront/CategorySlotRenderer";
import { usePagination, useSorting } from "@/hooks/useUrlUtils";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import slotConfigurationService from '@/services/slotConfigurationService';
import { categoryConfig } from '@/components/editor/slot/configs/category-config';
import { buildBreadcrumbItems } from "@/utils/breadcrumbUtils";

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
  const [categoryLayoutConfig, setCategoryLayoutConfig] = useState(null);
  const [categoryConfigLoaded, setCategoryConfigLoaded] = useState(false);

  const { storeCode, categorySlug } = useParams();
  const { currentPage, setPage } = usePagination();
  const { currentSort, setSort } = useSorting();

  // Load category layout configuration directly
  useEffect(() => {
    const loadCategoryLayoutConfig = async () => {
      if (!store?.id) {
        return;
      }

      try {
        // Load published configuration using the new versioning API
        const response = await slotConfigurationService.getPublishedConfiguration(store.id, 'category');

        // Check for various "no published config" scenarios
        if (response.success && response.data &&
            response.data.configuration &&
            response.data.configuration.slots &&
            Object.keys(response.data.configuration.slots).length > 0) {

          const publishedConfig = response.data;
          setCategoryLayoutConfig(publishedConfig.configuration);
          setCategoryConfigLoaded(true);

        } else {
          // Fallback to category-config.js
          const fallbackConfig = {
            slots: { ...categoryConfig.slots },
            metadata: {
              ...categoryConfig.metadata,
              fallbackUsed: true,
              fallbackReason: `No valid published configuration`
            }
          };

          setCategoryLayoutConfig(fallbackConfig);
          setCategoryConfigLoaded(true);
        }
      } catch (error) {
        console.error('❌ Error loading published slot configuration:', error);

        // Fallback to category-config.js
        const fallbackConfig = {
          slots: { ...categoryConfig.slots },
          metadata: {
            ...categoryConfig.metadata,
            fallbackUsed: true,
            fallbackReason: `Error loading configuration: ${error.message}`
          }
        };

        setCategoryLayoutConfig(fallbackConfig);
        setCategoryConfigLoaded(true);
      }
    };

    loadCategoryLayoutConfig();

    // Listen for configuration updates from editor
    const handleStorageChange = (e) => {
      if (e.key === 'slot_config_updated' && e.newValue) {
        const updateData = JSON.parse(e.newValue);
        if (updateData.storeId === store?.id && updateData.pageType === 'category') {
          loadCategoryLayoutConfig();
          // Clear the notification
          localStorage.removeItem('slot_config_updated');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [store?.id]);

  // Extract slots from the loaded configuration
  const categorySlots = categoryLayoutConfig?.slots || null;

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

      if (!store || !categorySlug) {
        setLoading(false);
        return;
      }

      let category = null;
      if (categories) {
        category = categories.find(c => c?.slug === categorySlug);
      }

      if (!category) {
        console.warn(`Category with slug '${categorySlug}' not found.`);
        showNotFound(`Category "${categorySlug}" not found`);
        setLoading(false);
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

          // Extract value from object if needed (same logic as in CategorySlotRenderer)
          let extractedValue = productValue;
          if (typeof productValue === 'object' && productValue !== null) {
            extractedValue = productValue.value || productValue.label || productValue.name;
          } else if (Array.isArray(productValue)) {
            // For arrays, check if any value matches
            const arrayMatch = productValue.some(val => {
              const valToCheck = typeof val === 'object' && val !== null
                ? (val.value || val.label || val.name)
                : val;
              return filterValues.some(filterVal => String(filterVal) === String(valToCheck));
            });
            if (!arrayMatch) {
              return false;
            }
            continue; // Skip the single value check below
          }

          extractedValue = String(extractedValue);

          const hasMatch = filterValues.some(filterVal => String(filterVal) === extractedValue);
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

  // Reset to page 1 when filters change
  useEffect(() => {
    if (Object.keys(activeFilters).length > 0) {
      setPage(1);
    }
  }, [activeFilters, setPage]);

  // Build breadcrumb items for category pages using generic utility
  const getBreadcrumbItems = () => {
    return buildBreadcrumbItems('category', currentCategory, storeCode, categories, settings);
  };

  // Build dynamic filters from filterable attributes (matching LayeredNavigation logic)
  const buildFilters = () => {
    const filters = {};

    if (!filterableAttributes) {
      console.log('CategoryPage: No filterableAttributes found');
      return filters;
    }

    console.log('CategoryPage: filterableAttributes:', filterableAttributes);

    filterableAttributes.forEach(attr => {
      // Check if attribute is filterable (handle different possible properties)
      const isFilterable = attr.is_filterable || attr.filterable || attr.use_for_filter;

      if (isFilterable) {
        const filterKey = attr.code || attr.name || attr.attribute_name;
        console.log(`CategoryPage: Processing filterable attribute: ${filterKey}`, attr);

        const values = new Set();

        // Add values from products - try multiple possible attribute keys (like LayeredNavigation)
        if (products && products.length > 0) {
          products.forEach(p => {
            const productAttributes = p.attributes || p.attribute_values || {};

            // Try multiple possible keys for the attribute (expanded list like LayeredNavigation)
            const possibleKeys = [
              attr.code,
              attr.name,
              attr.attribute_name,
              attr.code?.toLowerCase(),
              attr.name?.toLowerCase(),
              attr.attribute_name?.toLowerCase(),
              // Add more variations
              attr.code?.toLowerCase().replace(/[_-\s]/g, ''),
              attr.name?.toLowerCase().replace(/[_-\s]/g, ''),
              attr.attribute_name?.toLowerCase().replace(/[_-\s]/g, ''),
              // Common attribute variations
              filterKey,
              filterKey?.toLowerCase(),
              filterKey?.toLowerCase().replace(/[_-\s]/g, ''),
              // Common color attribute variations (from LayeredNavigation)
              'color', 'Color', 'COLOR',
              'colour', 'Colour', 'COLOUR'
            ].filter(Boolean);

            let attributeValue = null;
            for (const key of possibleKeys) {
              if (key && (productAttributes[key] !== undefined || p[key] !== undefined)) {
                attributeValue = productAttributes[key] || p[key];
                break;
              }
            }

            if (attributeValue !== undefined && attributeValue !== null && attributeValue !== '') {
              if (Array.isArray(attributeValue)) {
                attributeValue.forEach(val => {
                  if (val) {
                    // Handle object values properly
                    if (typeof val === 'object' && val !== null) {
                      const extractedValue = val.value || val.label || val.name;
                      if (extractedValue) values.add(String(extractedValue));
                    } else {
                      values.add(String(val));
                    }
                  }
                });
              } else if (typeof attributeValue === 'object' && attributeValue !== null) {
                // Handle object attribute values
                const extractedValue = attributeValue.value || attributeValue.label || attributeValue.name;
                if (extractedValue) values.add(String(extractedValue));
              } else {
                values.add(String(attributeValue));
              }
            }
          });
        }

        // IMPORTANT: Also add predefined options from attribute definition (like LayeredNavigation)
        // Store as objects to preserve labels
        const optionObjects = [];
        if (attr.options && Array.isArray(attr.options)) {
          attr.options.forEach(option => {
            if (typeof option === 'object' && option !== null) {
              // Preserve the original structure
              const value = String(option.value || option.label || option.name || '');
              const label = option.label || option.name || value;
              if (value !== '') {
                optionObjects.push({ value, label });
                values.add(value);
              }
            } else if (option !== null && option !== undefined && option !== '') {
              // Simple value - use it for both value and label
              const value = String(option);
              optionObjects.push({ value, label: value });
              values.add(value);
            }
          });
        }

        // Include all filterable attributes, even if they have no values yet
        // This ensures all 'use for filter' attributes are shown
        if (values.size > 0 || isFilterable) {
          // Create a map to store the best label for each value
          const valueToLabel = {};

          // First, add labels from predefined options
          optionObjects.forEach(opt => {
            valueToLabel[opt.value] = opt.label;
          });

          // Then add any values found in products (these might not have labels)
          Array.from(values).forEach(value => {
            if (!valueToLabel[value]) {
              valueToLabel[value] = value; // Use value as label if no label exists
            }
          });

          // Create the final filter array with proper labels
          filters[filterKey] = Object.entries(valueToLabel).sort(([a], [b]) => a.localeCompare(b)).map(([value, label]) => ({
            value,
            label,
            count: 0 // Will be calculated in CategorySlotRenderer
          }));

          console.log(`CategoryPage: Added filter ${filterKey} with ${values.size} values:`, Array.from(values));
        }
      }
    });

    console.log('CategoryPage: Built filters:', filters);
    return filters;
  };

  // Debug logging for products
  console.log('Category: Product counts:', {
    totalProducts: products.length,
    filteredProducts: filteredProducts.length,
    sortedProducts: sortedProducts.length,
    paginatedProducts: paginatedProducts.length,
    currentPage,
    totalPages
  });

  // Create category context for CategorySlotRenderer
  const categoryContext = {
    category: currentCategory,
    products: paginatedProducts,
    allProducts: products, // Use unfiltered products for filter counting
    filters: buildFilters(),
    filterableAttributes, // Pass filterable attributes for reference
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
    onProductClick: (product) => window.location.href = createProductUrl(storeCode, product.slug)
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
    <div className="px-4 sm:px-6 lg:px-8">
      <SeoHeadManager
        pageType="category"
        pageData={currentCategory ? {
          ...currentCategory,
          category_ids: [currentCategory.id],
          categories: [currentCategory.id]
        } : store}
        pageTitle={pageTitle}
      />

      {/* Dynamic layout using CategorySlotRenderer for everything below header */}
      <div className="max-w-7xl mx-auto">
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
            {(settings?.enable_product_filters !== false && filterableAttributes?.length > 0) ? (
              <CategorySlotRenderer
                slots={categorySlots}
                parentId={null}
                viewMode="grid"
                categoryContext={categoryContext}
              />
            ) : (
              <div className="flex flex-col justify-center items-center bg-white rounded-lg shadow-sm p-16">
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
          </>
        )}
      </div>
    </div>
  );
}