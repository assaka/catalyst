
import React, { useState, useEffect, useCallback, Fragment } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { buildProductBreadcrumbs } from "@/utils/breadcrumbUtils";
import { getCategoryName as getTranslatedCategoryName, getProductName, getCurrentLanguage, getTranslatedField } from "@/utils/translationUtils";
import { useTranslation } from '@/contexts/TranslationContext';
// Redirect handling moved to global RedirectHandler component
import { useNotFound } from "@/utils/notFoundUtils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { User } from "@/api/entities";
import cartService from "@/services/cartService";
// ProductLabel entity is no longer imported directly as its data is now provided via useStore.
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import { formatPriceWithTax, calculateDisplayPrice, safeNumber, formatPrice, getPriceDisplay } from "@/utils/priceUtils";
import { getImageUrlByIndex, getPrimaryImageUrl } from "@/utils/imageUtils";
import { getStockLabel as getStockLabelUtil, getStockLabelStyle } from "@/utils/stockLabelUtils";
import {
  ShoppingCart, Star, ChevronLeft, ChevronRight, Minus, Plus, Heart, Download, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SeoHeadManager from "@/components/storefront/SeoHeadManager";
import { Skeleton } from "@/components/ui/skeleton";
import { StorefrontProductTab } from "@/api/storefront-entities";
import { CustomerWishlist } from "@/api/storefront-entities";
import FlashMessage from "@/components/storefront/FlashMessage";
// New imports for enhanced functionality
import CustomOptions from "@/components/storefront/CustomOptions";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import RecommendedProducts from "@/components/storefront/RecommendedProducts";
import ConfigurableProductSelector from "@/components/storefront/ConfigurableProductSelector";

// Slot system imports
import slotConfigurationService from '@/services/slotConfigurationService';
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import '@/components/editor/slot/UnifiedSlotComponents'; // Register unified components
import { productConfig } from '@/components/editor/slot/configs/product-config';

// Utility function to generate a product name from attributes
const generateProductName = (product, basePrefix = '') => {
  if (!product?.attributes) return '';
  
  const nameComponents = [];
  
  // Add base prefix if provided
  if (basePrefix) {
    nameComponents.push(basePrefix);
  }
  
  // Define priority order of attributes for name generation
  const priorityAttributes = [
    'brand', 'manufacturer', 'model', 'color', 'size', 'material', 'style', 'type'
  ];
  
  // Add attributes in priority order
  priorityAttributes.forEach(attrCode => {
    const value = product.attributes[attrCode];
    if (value && typeof value === 'string' && value.trim()) {
      nameComponents.push(value.trim());
    }
  });

  // Add any other string attributes not yet included
  Object.entries(product.attributes).forEach(([code, value]) => {
    if (!priorityAttributes.includes(code) && 
        value && 
        typeof value === 'string' && 
        value.trim() && 
        !nameComponents.includes(value.trim())) {
      nameComponents.push(value.trim());
    }
  });
  
  return nameComponents.join(' ');
};

export default function ProductDetail() {
  const { slug: paramSlug, productSlug: routeProductSlug, storeCode } = useParams();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug') || routeProductSlug || paramSlug;


  // Updated useStore destructuring: productLabels is now sourced directly from the store context.
  const { store, settings, loading: storeLoading, categories, productLabels, taxes, selectedCountry } = useStore();
  const navigate = useNavigate();
  const { showNotFound } = useNotFound();
  const { t } = useTranslation();
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
  const [customOptions, setCustomOptions] = useState([]);
  const [customOptionsLabel, setCustomOptionsLabel] = useState('Custom Options');
  // productLabels state is removed as it's now managed by the useStore context.

  // State for product layout configuration
  const [productLayoutConfig, setProductLayoutConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // State for configurable products
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [displayProduct, setDisplayProduct] = useState(null);

  // Update display product when product or selected variant changes
  useEffect(() => {
    if (product) {
      // For configurable products, show variant if selected, otherwise show parent
      if (product.type === 'configurable' && selectedVariant) {
        setDisplayProduct(selectedVariant);
      } else {
        setDisplayProduct(product);
      }
    }
  }, [product, selectedVariant]);

  // Handler for variant selection
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

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

  // Re-evaluate labels when productLabels are loaded
  useEffect(() => {
    console.log('🏷️ productLabels changed:', {
      hasProduct: !!product,
      productLabelsCount: productLabels?.length,
      productLabels: productLabels
    });

    if (product && productLabels && productLabels.length > 0) {
      const applicableLabels = evaluateProductLabels(product, productLabels);

      // Update product with new labels
      setProduct(prevProduct => ({
        ...prevProduct,
        labels: applicableLabels.map(label => label.text),
        applicableLabels: applicableLabels // Keep full label objects for styling
      }));
    }
  }, [productLabels]);

  // Load product layout configuration directly
  useEffect(() => {
    const loadProductLayoutConfig = async () => {
      if (!store?.id) {
        return;
      }

      try {
        // Load published configuration using the new versioning API
        const response = await slotConfigurationService.getPublishedConfiguration(store.id, 'product');
        // Check for various "no published config" scenarios
        if (response.success && response.data &&
            response.data.configuration &&
            response.data.configuration.slots &&
            Object.keys(response.data.configuration.slots).length > 0) {

          const publishedConfig = response.data;

          // Merge published config with default config to ensure new slots are available
          // This ensures that when we add new slots to product-config.js, they appear even if
          // there's an existing published configuration
          const mergedSlots = {
            ...productConfig.slots, // Start with default slots
            ...publishedConfig.configuration.slots // Override with published customizations
          };

          const mergedConfig = {
            ...publishedConfig.configuration,
            slots: mergedSlots
          };

          setProductLayoutConfig(mergedConfig);
          setConfigLoaded(true);

        } else {
          // Fallback to product-config.js
          const fallbackConfig = {
            slots: { ...productConfig.slots },
            metadata: {
              ...productConfig.metadata,
              fallbackUsed: true,
              fallbackReason: `No valid published configuration`
            }
          };

          setProductLayoutConfig(fallbackConfig);
          setConfigLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load product layout config:', error);

        // Final fallback to default config
        const fallbackConfig = {
          slots: { ...productConfig.slots },
          metadata: {
            ...productConfig.metadata,
            fallbackUsed: true,
            fallbackReason: `Error loading configuration: ${error.message}`
          }
        };

        setProductLayoutConfig(fallbackConfig);
        setConfigLoaded(true);
      }
    };

    if (!storeLoading) {
      loadProductLayoutConfig();
    }
  }, [store?.id, storeLoading]);


  /**
   * Evaluate which labels apply to the product based on their conditions
   */
  const evaluateProductLabels = (product, labels) => {
    if (!labels || !Array.isArray(labels) || !product) {
      console.log('🏷️ evaluateProductLabels: Missing data', { hasProduct: !!product, labelsCount: labels?.length });
      return [];
    }

    // Extract key attributes for logging
    const manufacturerAttr = product.attributes?.find(attr => attr.code === 'manufacturer');
    const brandAttr = product.attributes?.find(attr => attr.code === 'brand');

    console.log('🏷️ evaluateProductLabels: Starting evaluation', {
      productSku: product.sku,
      productName: product.name,
      productAttributesCount: product.attributes?.length || 0,
      manufacturer: manufacturerAttr?.value || manufacturerAttr,
      brand: brandAttr?.value || brandAttr,
      allAttributeCodes: product.attributes?.map(a => a.code || a.attribute_code),
      labelsCount: labels.length
    });

    const applicableLabels = [];

    for (const label of labels) {
      console.log('🏷️ Evaluating label:', {
        labelText: label.text,
        isActive: label.is_active,
        conditions: label.conditions
      });

      if (!label.is_active) {
        console.log('🏷️ Label skipped: not active');
        continue;
      }

      let conditions;
      try {
        conditions = typeof label.conditions === 'string'
          ? JSON.parse(label.conditions)
          : label.conditions;
      } catch (e) {
        console.error('Failed to parse label conditions:', e);
        continue;
      }

      let shouldApply = true;


      // Check attribute conditions
      if (conditions?.attribute_conditions?.length > 0) {
        console.log('🏷️ Checking attribute conditions:', conditions.attribute_conditions);

        for (const condition of conditions.attribute_conditions) {
          // Check both direct product properties and nested attributes
          let productValue = product[condition.attribute_code];

          // If not found directly, check in product.attributes
          if (productValue === undefined && product.attributes) {
            console.log('🔍 Looking for attribute in product.attributes:', {
              isArray: Array.isArray(product.attributes),
              attributeCode: condition.attribute_code,
              sampleAttributes: product.attributes.slice(0, 3), // Show first 3 attributes
              totalCount: product.attributes.length
            });

            // Handle both array and object structures for attributes
            if (Array.isArray(product.attributes)) {
              // Attributes stored as array - find by code or attribute_code
              const attrObj = product.attributes.find(
                attr => attr.code === condition.attribute_code || attr.attribute_code === condition.attribute_code
              );

              console.log('🔍 Found attribute object:', attrObj);

              if (attrObj) {
                // Handle different attribute structures
                productValue = attrObj.value || attrObj.label || attrObj;
                console.log('🔍 Extracted value:', productValue);
              } else {
                // Try to find by searching all possible property names
                console.log('🔍 Searching all attributes for manufacturer...');
                product.attributes.forEach((attr, index) => {
                  if (index < 5) { // Log first 5 for debugging
                    console.log(`Attribute ${index}:`, attr);
                  }
                });
              }
            } else {
              // Attributes stored as object - direct property access
              productValue = product.attributes[condition.attribute_code];

              // Handle attributes that are objects with value/label structure
              if (productValue && typeof productValue === 'object' && productValue.value) {
                productValue = productValue.value;
              }
            }
          }

          console.log('🏷️ Attribute condition check:', {
            attributeCode: condition.attribute_code,
            expectedValue: condition.attribute_value,
            actualValue: productValue,
            productValueType: typeof productValue,
            matches: productValue === condition.attribute_value
          });

          if (productValue !== condition.attribute_value) {
            shouldApply = false;
            break;
          }
        }
      }

      // Check price conditions
      if (conditions?.price_conditions && Object.keys(conditions.price_conditions).length > 0) {
        const priceConditions = conditions.price_conditions;

        // Check if product has sale price
        if (priceConditions.has_sale_price === true && !product.compare_price) {
          shouldApply = false;
        }

        // Check if product is new
        if (priceConditions.is_new === true && priceConditions.days_since_created) {
          const productDate = new Date(product.created_at);
          const daysSinceCreated = Math.floor((Date.now() - productDate) / (1000 * 60 * 60 * 24));
          if (daysSinceCreated > priceConditions.days_since_created) {
            shouldApply = false;
          }
        }
      }

      if (shouldApply) {
        console.log('✅ Label APPLIES:', label.text);
        applicableLabels.push(label);
      } else {
        console.log('❌ Label DOES NOT apply:', label.text);
      }
    }

    console.log('🏷️ Final applicable labels:', {
      count: applicableLabels.length,
      labels: applicableLabels.map(l => l.text)
    });

    // Sort by priority if specified
    applicableLabels.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return applicableLabels;
  };

  const loadProductData = async () => {
    try {
      setLoading(true);

      console.log('🔍 ProductDetail: Loading product data', {
        storeId: store?.id,
        storeName: store?.name,
        slug,
        storeCode
      });

      if (!store?.id || !slug) {
        console.warn('❌ ProductDetail: Missing store or slug', { store: store?.id, slug });
        setProduct(null);
        setLoading(false);
        return;
      }

      const cacheKey = `product-detail-${slug}-${store.id}`;
      const currentLang = getCurrentLanguage();

      // First try to find by slug (don't send status - backend handles it)
      console.log('🔎 ProductDetail: Calling API with', { store_id: store.id, slug, lang: currentLang });
      let products = await StorefrontProduct.filter({ store_id: store.id, slug: slug, lang: currentLang });
      console.log('📦 ProductDetail: API returned', products?.length || 0, 'products');

      // If no product found by slug, try searching by SKU as fallback
      if (!products || products.length === 0) {
        console.log('🔎 ProductDetail: Trying SKU fallback with', { store_id: store.id, sku: slug, lang: currentLang });
        products = await StorefrontProduct.filter({ store_id: store.id, sku: slug, lang: currentLang });
      }

      if (products && products.length > 0) {
        const foundProduct = products[0];
        
        // Critical check: verify the product matches the request
        // Allow match by either slug OR SKU (since SKU can be used as a fallback identifier)
        const matchesBySlug = foundProduct.slug === slug;
        const matchesBySku = foundProduct.sku === slug;
        
        if (!matchesBySlug && !matchesBySku) {
          // Show "not found" instead of wrong product
          setProduct(null);
          setLoading(false);
          return;
        }
        
        
        // Evaluate and apply product labels based on conditions
        const applicableLabels = evaluateProductLabels(foundProduct, productLabels);
        const productWithLabels = {
          ...foundProduct,
          labels: applicableLabels.map(label => label.text),
          applicableLabels: applicableLabels // Keep full label objects for styling
        };

        setProduct(productWithLabels);

        // Track product view with enhanced analytics
        if (typeof window !== 'undefined' && window.catalyst?.trackProductView) {
          window.catalyst.trackProductView(foundProduct);
        }

        // Send Google Analytics 'view_item' event
        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'view_item',
            ecommerce: {
              items: [{
                item_id: foundProduct.id,
                item_name: getProductName(foundProduct, getCurrentLanguage()) || foundProduct.name,
                price: safeNumber(foundProduct.price),
                item_brand: foundProduct.brand, // Assuming product has a brand field
                item_category: (() => {
                  const category = categories.find(cat => cat.id === foundProduct.category_ids?.[0]);
                  return category ? getTranslatedCategoryName(category) : '';
                })(),
                currency: settings?.currency_code || 'No Currency'
              }]
            }
          });
        }

        // Load additional data in parallel
        await Promise.all([
          loadProductTabs(),
          loadCustomOptions(foundProduct),
          checkWishlistStatus(foundProduct.id)
        ]);
      } else {
        // Global redirect handler already checked - just show 404
        console.warn(`❌ ProductDetail: Product with slug '${slug}' not found in store ${store.id}`);
        setProduct(null);
      }
    } catch (error) {
      console.error("❌ ProductDetail: Failed to load product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomOptions = async (product) => {
    if (!product || !store?.id) {
      return;
    }

    try {

      // Import the CustomOptionRule entity
      const { CustomOptionRule } = await import('@/api/entities');

      // Check if we're authenticated
      const apiClient = (await import('@/api/client')).default;
      const hasToken = apiClient.getToken();

      try {
        // Fetch active custom option rules for this store
        const rules = await CustomOptionRule.filter({
          store_id: store.id,
          is_active: true
        });

        // Find applicable rules for this product
        const applicableRules = rules.filter(rule => {
          let conditions;
        try {
          conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
        } catch (e) {
          console.error('Failed to parse conditions:', e);
          return false;
        }

        // Check SKU conditions
        if (conditions?.skus?.includes(product.sku)) {
          return true;
        }

        // Check category conditions
        if (conditions?.categories?.length > 0 && product.category_ids?.length > 0) {
          const hasMatch = conditions.categories.some(catId => product.category_ids.includes(catId));
          if (hasMatch) {
            return true;
          }
        }

        // Check attribute conditions
        if (conditions?.attribute_conditions?.length > 0) {
          for (const condition of conditions.attribute_conditions) {
            if (product[condition.attribute_code] === condition.attribute_value) {
              return true;
            }
          }
        }

        return false;
      });

      if (applicableRules.length > 0) {
        const rule = applicableRules[0];
        const currentLang = getCurrentLanguage();
        setCustomOptionsLabel(getTranslatedField(rule, 'display_label', currentLang) || 'Custom Options');

        // Parse optional_product_ids
        let productIds = [];
        try {
          productIds = typeof rule.optional_product_ids === 'string'
            ? JSON.parse(rule.optional_product_ids)
            : rule.optional_product_ids;
        } catch (e) {
          console.error('Failed to parse optional_product_ids:', e);
          productIds = [];
        }

        if (productIds && productIds.length > 0) {
          const currentLang = getCurrentLanguage();
          const optionProducts = [];
          for (const productId of productIds) {
            try {
              const products = await StorefrontProduct.filter({
                id: productId,
                status: 'active',
                lang: currentLang
              });
              if (products && products.length > 0) {
                const customOptionProduct = products[0];

                // Only include if it's marked as a custom option
                if (!customOptionProduct.is_custom_option) {
                  continue;
                }

                // IMPORTANT: Check stock availability - only show if in stock
                // Only check products.stock_quantity and products.infinite_stock
                const trackStock = settings?.track_stock !== false; // Default to true
                const isInStock = trackStock
                  ? (customOptionProduct.infinite_stock === true || customOptionProduct.stock_quantity > 0)
                  : true; // If not tracking stock, always show

                // Only add to optionProducts if in stock
                if (isInStock) {
                  // Enrich with price display properties for the template
                  const priceInfo = getPriceDisplay(customOptionProduct);
                  const enrichedProduct = {
                    ...customOptionProduct,
                    displayPrice: formatPrice(priceInfo.displayPrice),
                    hasSpecialPrice: priceInfo.hasComparePrice,
                    originalPrice: priceInfo.hasComparePrice ? formatPrice(priceInfo.originalPrice) : null,
                    isSelected: false // Default to not selected
                  };
                  optionProducts.push(enrichedProduct);
                }
              }
            } catch (err) {
              console.error(`Failed to load option product ${productId}:`, err);
            }
          }
          setCustomOptions(optionProducts);
        }
      }
      } catch (apiError) {
        console.error('Error with CustomOptionRule API calls:', apiError);
        setCustomOptions([]);
      }
    } catch (error) {
      console.error('Error loading custom options:', error);
      setCustomOptions([]);
    }
  };

  const loadProductTabs = async () => {
    if (!store?.id) return;
    try {
      const tabs = await cachedApiCall(
        `product-tabs-${store.id}`,
        () => StorefrontProductTab.filter({ store_id: store.id, is_active: true })
      );
      console.log('✅ ProductDetail: Loaded product tabs:', {
        count: tabs?.length,
        tabs: tabs?.map(t => ({ id: t.id, name: t.name, translations: t.translations }))
      });
      setProductTabs(tabs || []);
    } catch (error) {
      console.error('❌ ProductDetail: Error loading product tabs:', error);
      setProductTabs([]);
    }
  };

  const checkWishlistStatus = async (productId) => {
    if (!store?.id || !productId) return;
    try {
      const wishlistItems = await CustomerWishlist.getItems(store?.id);
      // Check if this specific product is in the wishlist
      const isProductInWishlist = wishlistItems && wishlistItems.some(item => 
        item.product_id === productId || item.product_id === parseInt(productId)
      );
      
      
      setIsInWishlist(isProductInWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      setIsInWishlist(false);
    }
  };

  const getTotalPrice = () => {
    if (!product) return 0;

    // For configurable products, use the selected variant's price
    // For simple products or when no variant is selected, use the base product price
    const productForPrice = displayProduct || product;

    // Get the correct base price using utility function
    const priceInfo = getPriceDisplay(productForPrice);
    const basePrice = priceInfo.displayPrice;

    // Add selected options price
    const optionsPrice = selectedOptions.reduce((sum, option) => sum + safeNumber(option.price), 0);

    // Calculate tax-inclusive price if needed
    const unitPrice = basePrice + optionsPrice;
    const displayUnitPrice = calculateDisplayPrice(unitPrice);

    return displayUnitPrice * quantity;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // For configurable products, ensure a variant is selected
    if (product.type === 'configurable' && !selectedVariant) {
      setFlashMessage({
        type: 'error',
        message: 'Please select product options before adding to cart.'
      });
      return;
    }

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

      // For configurable products, use the selected variant
      const productToAdd = displayProduct || product;

      // Get the correct base price using utility function
      const priceInfo = getPriceDisplay(productToAdd);
      const basePrice = priceInfo.displayPrice;

      const result = await cartService.addItem(
        productToAdd.id,
        quantity,
        basePrice,
        selectedOptions,
        store.id
      );
      
      if (result.success) {
        // Track add to cart with enhanced analytics
        if (typeof window !== 'undefined' && window.catalyst?.trackAddToCart) {
          window.catalyst.trackAddToCart(product, quantity);
        }

        // Send Google Analytics 'add_to_cart' event
        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
              items: [{
                item_id: product.id,
                item_name: getProductName(product, getCurrentLanguage()) || product.name,
                price: safeNumber(basePrice),
                quantity: quantity,
                item_brand: product.brand,
                item_category: (() => {
                  const category = categories.find(cat => cat.id === product.category_ids?.[0]);
                  return category ? getTranslatedCategoryName(category) : '';
                })(),
                currency: settings?.currency_code || 'No Currency'
              }]
            }
          });
        }

        const translatedProductName = getProductName(product, getCurrentLanguage()) || product.name;
        setFlashMessage({
          type: 'success',
          message: `${translatedProductName} ${t('common.added_to_cart_success', ' added to cart successfully!')}`
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
      if (isInWishlist) {
        await CustomerWishlist.removeItem(product.id, store.id);
        setIsInWishlist(false);
        setFlashMessage({
          type: 'success',
          message: 'Product removed from wishlist'
        });
      } else {
        try {
          await CustomerWishlist.addItem(product.id, store.id);
          setIsInWishlist(true);
          setFlashMessage({
            type: 'success',
            message: 'Product added to wishlist'
          });
        } catch (addError) {
          // Handle "Item already in wishlist" as a success case
          if (addError.message?.includes('already in wishlist')) {
            setIsInWishlist(true);
            setFlashMessage({
              type: 'success',
              message: 'Product is already in your wishlist'
            });
          } else {
            throw addError; // Re-throw other errors
          }
        }
      }

      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      
      // Add a small delay to ensure backend persistence completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh wishlist status to ensure UI is in sync
      if (product?.id) {
        checkWishlistStatus(product.id);
      }

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

  if (!product && !loading) {
    // Trigger 404 page display
    showNotFound(`Product "${slug}" not found`);
    return null;
  }

  // Determine stock status based on product and store settings
  // For configurable products, use the selected variant's stock
  const productForStock = displayProduct || product;
  const trackStock = settings?.track_stock !== false; // Default to true if not explicitly false
  const isInStock = trackStock ? (productForStock?.infinite_stock || productForStock?.stock_quantity > 0) : true;
  const canAddToCart = !loading && isInStock && quantity > 0 && (!trackStock || productForStock?.infinite_stock || productForStock?.stock_quantity >= quantity);

  // For configurable products without a selected variant, prevent adding to cart
  const canAddToCartFinal = product?.type === 'configurable' && !selectedVariant ? false : canAddToCart;


  return (
    <div>
      {flashMessage && (
        <div className="mb-6 max-w-6xl mx-auto px-4">
          <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        </div>
      )}

      <SeoHeadManager
        pageType="product"
        pageData={{
          ...product,
          breadcrumbs: buildProductBreadcrumbs(product, storeCode, categories, settings)
        }}
        pageTitle={product?.name}
      />

      {/* Check if we should use slot configuration or fallback to traditional layout */}
      {(() => {
        // Determine if we should render with slots
        const hasConfig = productLayoutConfig && configLoaded;
        const hasSlots = hasConfig && productLayoutConfig.slots && Object.keys(productLayoutConfig.slots).length > 0;
        const slotCount = hasSlots ? Object.keys(productLayoutConfig.slots).length : 0;

        const shouldRender = true; // Force slot system usage


        return shouldRender;
      })() ? (
        <div className="grid grid-cols-12 gap-2 auto-rows-min">
          <UnifiedSlotRenderer
            slots={productLayoutConfig?.slots || productConfig.slots}
            parentId={null}
            viewMode="default"
            context="storefront"
            productData={{
              product: product ? (() => {
                // Calculate the final name to use
                const translatedName = getProductName(product, getCurrentLanguage());
                const attributeName = product.attributes?.name;
                const directName = product.name;
                const finalName = translatedName || attributeName || directName;

                console.log('🔍 ProductDetail product name Debug:', {
                  translatedName,
                  attributeName,
                  directName,
                  finalName
                });

                // Create a modified product with the correct name
                return {
                  ...product,
                  name: finalName
                };
              })() : (displayProduct || product),
              baseProduct: product, // Keep reference to parent for configurable products
              productTabs,
              customOptions: customOptions,
              relatedProducts: [], // TODO: Load related products
              store,
              settings,
              breadcrumbs: buildProductBreadcrumbs(product, storeCode, categories, settings),
              productLabels: product?.applicableLabels || productLabels,
              selectedOptions,
              quantity,
              totalPrice: getTotalPrice(), // Pass calculated total price
              activeImageIndex: activeImage,
              activeTab,
              isInWishlist,
              // currencySymbol removed - now handled by priceUtils context
              canAddToCart: canAddToCartFinal,
              setQuantity,
              setSelectedOptions,
              setActiveImageIndex: setActiveImage,
              setActiveTab,
              setIsInWishlist,
              handleAddToCart: handleAddToCart,
              handleWishlistToggle: handleWishlistToggle,
              handleOptionChange: handleOptionChange,
              customOptionsLabel: customOptionsLabel,
              // Configurable product support
              selectedVariant,
              handleVariantChange,
              ConfigurableProductSelector // Pass the component itself
            }}
          />
        </div>
      ) : null
      }

    </div>
  );
}
