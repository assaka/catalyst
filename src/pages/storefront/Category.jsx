import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { createCategoryUrl, createProductUrl } from "@/utils/urlUtils";
import { buildCategoryBreadcrumbs } from "@/utils/breadcrumbUtils";
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
import { formatPrice } from '@/utils/priceUtils';
import { getCategoryName, getCurrentLanguage } from "@/utils/translationUtils";
import { useTranslation } from '@/contexts/TranslationContext';

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data === null || data === undefined) return [];
  return [];
};

export default function Category() {
  const { store, settings, loading: storeLoading, categories, filterableAttributes } = useStore();
  const { showNotFound } = useNotFound();
  const { t } = useTranslation();
  
  const [products, setProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  // Detect current breakpoint based on window width
  const getCurrentBreakpoint = () => {
    if (typeof window === 'undefined') return 'default';

    const width = window.innerWidth;

    // Tailwind breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
    if (width >= 1536) return '2xl';
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 640) return 'sm';
    return 'default';
  };

  // Calculate dynamic items per page based on current breakpoint and grid configuration
  const calculateItemsPerPage = () => {
    const gridConfig = settings?.product_grid;
    if (!gridConfig) return 12;

    const rows = gridConfig.rows || 4;
    if (rows === 0) return -1; // Infinite scroll

    const breakpoints = gridConfig.breakpoints || {};
    const currentBreakpoint = getCurrentBreakpoint();

    // Get the columns for the current breakpoint, with fallback logic
    let currentColumns = 1;

    // Tailwind CSS cascade: start from current breakpoint and fall back to smaller ones
    const breakpointOrder = ['2xl', 'xl', 'lg', 'md', 'sm', 'default'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

    // Look for the first defined breakpoint starting from current and going down
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (breakpoints[bp] && breakpoints[bp] > 0) {
        currentColumns = breakpoints[bp];
        break;
      }
    }

    return currentColumns * rows;
  };

  const [itemsPerPage, setItemsPerPage] = useState(calculateItemsPerPage());
  const [categoryLayoutConfig, setCategoryLayoutConfig] = useState(null);
  const [categoryConfigLoaded, setCategoryConfigLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const { storeCode } = useParams();
  const location = useLocation();

  // Update viewMode when settings are loaded
  useEffect(() => {
    if (settings?.default_view_mode) {
      setViewMode(settings.default_view_mode);
    }
  }, [settings?.default_view_mode]);

  // Extract category path from URL: /public/storeCode/category/path/to/category
  const categoryPath = location.pathname.split('/').slice(4).join('/');
  const categorySlug = categoryPath.split('/').pop(); // Get the last segment as the actual category slug

  const { currentPage, setPage } = usePagination();
  const { currentSort, setSort } = useSorting();

  // Update items per page when window resizes (breakpoint changes) or settings change
  useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = calculateItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
        // Reset to page 1 when items per page changes
        setPage(1);
      }
    };

    // Recalculate when settings change
    if (settings?.product_grid) {
      const newItemsPerPage = calculateItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
        setPage(1);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [settings?.product_grid, itemsPerPage, setPage]);

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

  // Generate grid classes from store settings
  const getGridClasses = () => {
    const gridConfig = settings?.product_grid;

    if (gridConfig) {
      let classes = [];
      const breakpoints = gridConfig.breakpoints || {};
      const customBreakpoints = gridConfig.customBreakpoints || [];

      // Standard breakpoints
      Object.entries(breakpoints).forEach(([breakpoint, columns]) => {
        if (columns > 0) {
          if (breakpoint === 'default') {
            if (columns === 1) classes.push('grid-cols-1');
            else if (columns === 2) classes.push('grid-cols-2');
          } else {
            if (columns === 1) classes.push(`${breakpoint}:grid-cols-1`);
            else if (columns === 2) classes.push(`${breakpoint}:grid-cols-2`);
            else if (columns === 3) classes.push(`${breakpoint}:grid-cols-3`);
            else if (columns === 4) classes.push(`${breakpoint}:grid-cols-4`);
            else if (columns === 5) classes.push(`${breakpoint}:grid-cols-5`);
            else if (columns === 6) classes.push(`${breakpoint}:grid-cols-6`);
          }
        }
      });

      // Custom breakpoints
      customBreakpoints.forEach(({ name, columns }) => {
        if (name && columns > 0) {
          if (columns === 1) classes.push(`${name}:grid-cols-1`);
          else if (columns === 2) classes.push(`${name}:grid-cols-2`);
          else if (columns === 3) classes.push(`${name}:grid-cols-3`);
          else if (columns === 4) classes.push(`${name}:grid-cols-4`);
          else if (columns === 5) classes.push(`${name}:grid-cols-5`);
          else if (columns === 6) classes.push(`${name}:grid-cols-6`);
        }
      });

      return classes.length > 0 ? classes.join(' ') : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
    }

    // Fallback to default grid
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
  };

    useEffect(() => {
    if (!storeLoading && store?.id && categorySlug) {
      loadCategoryProducts();

      // Track category view
      if (typeof window !== 'undefined' && window.catalyst?.trackEvent) {
        const category = categories?.find(c => c?.slug === categorySlug);
        if (category) {
          window.catalyst.trackEvent('page_view', {
            page_type: 'category',
            category_name: getCategoryName(category, getCurrentLanguage()),
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
      
      const cacheKey = `products-category-${category.id}-v5`;
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
    // If infinite scroll is enabled (itemsPerPage = -1), show all products
    if (itemsPerPage === -1) {
      return sortedProducts;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(sortedProducts.length / itemsPerPage);

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


  // Build dynamic filters from database attributes where is_filterable = true
  // Only show options that have products (count > 0)
  const buildFilters = () => {
    const filters = {};

    // Define min and max price from entire product collection first
    const allPrices = products.map(p => {
      let price = parseFloat(p.price || 0);
      // Use the lowest price if compare_price exists and is lower
      if (p.compare_price && parseFloat(p.compare_price) > 0) {
        price = Math.min(price, parseFloat(p.compare_price));
      }
      return price;
    }).filter(p => p > 0);

    const minPrice = allPrices.length > 0 ? Math.floor(Math.min(...allPrices)) : 0;
    const maxPrice = allPrices.length > 0 ? Math.ceil(Math.max(...allPrices)) : 0;

    // Use filterableAttributes from database (where is_filterable = true)
    if (!filterableAttributes || filterableAttributes.length === 0) {
      return filters;
    }

    // Process each filterable attribute from database (already filtered by is_filterable = true)
    filterableAttributes.forEach(attr => {
      const attrCode = attr.code || attr.name || attr.attribute_name;

      // Extract values from products only (dynamic from DB)
      const valueCountMap = new Map(); // Map<value, count>

      if (products && products.length > 0) {
        products.forEach(p => {
          const productAttributes = p.attributes || p.attribute_values || {};

          // Try multiple possible keys for the attribute
          const possibleKeys = [
            attrCode,
            attr.code,
            attr.name,
            attr.attribute_name,
            attrCode?.toLowerCase(),
            attr.code?.toLowerCase(),
            attr.name?.toLowerCase(),
            attr.attribute_name?.toLowerCase(),
            attrCode?.toLowerCase().replace(/[_-\s]/g, ''),
            attr.code?.toLowerCase().replace(/[_-\s]/g, ''),
            attr.name?.toLowerCase().replace(/[_-\s]/g, ''),
            // Common variations
            'color', 'Color', 'COLOR',
            'colour', 'Colour', 'COLOUR',
            'brand', 'Brand', 'BRAND',
            'size', 'Size', 'SIZE',
            'material', 'Material', 'MATERIAL'
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
                  let extractedValue;
                  if (typeof val === 'object' && val !== null) {
                    extractedValue = val.value || val.label || val.name;
                  } else {
                    extractedValue = val;
                  }

                  if (extractedValue) {
                    const valueStr = String(extractedValue);
                    valueCountMap.set(valueStr, (valueCountMap.get(valueStr) || 0) + 1);
                  }
                }
              });
            } else if (typeof attributeValue === 'object' && attributeValue !== null) {
              const extractedValue = attributeValue.value || attributeValue.label || attributeValue.name;
              if (extractedValue) {
                const valueStr = String(extractedValue);
                valueCountMap.set(valueStr, (valueCountMap.get(valueStr) || 0) + 1);
              }
            } else {
              const valueStr = String(attributeValue);
              valueCountMap.set(valueStr, (valueCountMap.get(valueStr) || 0) + 1);
            }
          }
        });
      }

      // Handle price attribute with slider filter type
      if (attrCode === 'price' && (attr.filter_type === 'slider' || attr.filter_input_type === 'slider')) {
        if (minPrice > 0 && maxPrice > 0) {
          filters[attrCode] = {
            min: minPrice,
            max: maxPrice,
            type: 'slider'
          };
        }
      }
      // Only include attributes that have values with count > 0
      else if (valueCountMap.size > 0) {
        // Create the final filter array with counts, sorted alphabetically
        filters[attrCode] = Array.from(valueCountMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([value, count]) => ({
            value,
            label: value, // Use value as label (can be enhanced with DB labels later)
            count
          }));
      }
    });
    return filters;
  };

  // Build active filters array for display
  const buildActiveFiltersArray = () => {
    const activeFiltersArray = [];

    Object.entries(activeFilters).forEach(([attributeCode, values]) => {
      if (attributeCode === 'priceRange') {
        return;
      }

      // Find the attribute name from filterableAttributes
      const attr = filterableAttributes?.find(a => a.code === attributeCode);
      const attributeLabel = attr?.name || attributeCode;

      // Add each selected value as a separate active filter
      if (Array.isArray(values)) {
        values.forEach(value => {
          activeFiltersArray.push({
            type: 'attribute',
            attributeCode: attributeCode,
            label: attributeLabel,
            value: value
          });
        });
      }
    });
    return activeFiltersArray;
  };

  // Create category context for CategorySlotRenderer
  const categoryContext = {
    category: currentCategory,
    products: paginatedProducts,
    allProducts: products, // Use unfiltered products for filter counting
    filteredProductsCount: sortedProducts.length, // Count of products after filtering
    filters: buildFilters(),
    filterableAttributes, // Pass database filterable attributes directly
    activeFilters: buildActiveFiltersArray(), // Array of active filter objects for display
    sortOption: currentSort,
    currentPage,
    totalPages,
    itemsPerPage, // Add dynamic items per page
    subcategories: [],
    breadcrumbs: buildCategoryBreadcrumbs(currentCategory, storeCode, categories, settings),
    selectedFilters: activeFilters,
    priceRange: {},
    currencySymbol: settings?.currency_symbol, // Currency symbol from StoreProvider
    settings: {
      ...settings,
      // Ensure defaults for view mode toggle
      enable_view_mode_toggle: settings?.enable_view_mode_toggle ?? true,
      default_view_mode: settings?.default_view_mode || 'grid',
      show_stock_label: settings?.show_stock_label ?? false,
      // Preserve theme settings including breadcrumb colors
      theme: settings?.theme || {}
    },
    store,
    categories,
    slots: categorySlots, // Add slots to context for breadcrumb configuration access
    taxes: [],
    selectedCountry: null,
    handleFilterChange: setActiveFilters,
    handleSortChange: handleSortChange,
    handlePageChange: handlePageChange,
    onViewModeChange: setViewMode,
    clearFilters: () => setActiveFilters({}),
    formatDisplayPrice: (product) => {
      // Handle if product is passed instead of price value
      const priceValue = typeof product === 'object' ? product.price : product;
      return formatPrice(priceValue);
    },
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

  const pageTitle = currentCategory ? getCategoryName(currentCategory, getCurrentLanguage()) : (categorySlug ? "Category Not Found" : "All Products");

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

      {/* Dynamic layout using CategorySlotRenderer for everything below header */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className={`grid ${getGridClasses()} gap-8 min-h-[400px]`}>
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
            {sortedProducts.length > 0 || loading ? (
              <>
                <div className="grid grid-cols-12 gap-2 auto-rows-min">
                  <CategorySlotRenderer
                    slots={categorySlots}
                    parentId={null}
                    viewMode={viewMode}
                    categoryContext={categoryContext}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-center items-center bg-white rounded-lg shadow-sm p-16">
                <Package className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800">
                  {t('category.no_products_found', 'No Products Found')}
                </h3>
                <p className="text-gray-500 mt-2 text-center">
                  {currentCategory ?
                    t('category.no_products_in_category', `No products found in the "{category}" category.`).replace('{category}', getCategoryName(currentCategory, getCurrentLanguage()) || currentCategory.name) :
                    t('category.no_products_match_filters', 'No products match your current filters.')
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