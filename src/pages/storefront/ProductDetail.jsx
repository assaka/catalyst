
import React, { useState, useEffect, useCallback, Fragment } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createCategoryUrl } from "@/utils/urlUtils";
// Redirect handling moved to global RedirectHandler component
import { useNotFound } from "@/utils/notFoundUtils";
import { StorefrontProduct } from "@/api/storefront-entities";
import { User } from "@/api/entities";
import cartService from "@/services/cartService";
// ProductLabel entity is no longer imported directly as its data is now provided via useStore.
import { useStore, cachedApiCall } from "@/components/storefront/StoreProvider";
import { formatDisplayPrice, calculateDisplayPrice } from "@/utils/priceUtils";
import { getImageUrlByIndex, getPrimaryImageUrl } from "@/utils/imageUtils";
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
import BreadcrumbRenderer from "@/components/storefront/BreadcrumbRenderer";

// Slot system imports
import slotConfigurationService from '@/services/slotConfigurationService';
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import '@/components/editor/slot/UnifiedSlotComponents'; // Register unified components
import { productConfig } from '@/components/editor/slot/configs/product-config';
import { initializeProductSlotBinding } from '@/utils/secureSlotBinder';

// Product Label Component
const ProductLabelComponent = ({ label }) => {
  if (!label || !label.text) return null;

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }[label.position || 'top-left'];

  return (
    <div
      className={`absolute ${positionClasses} text-xs font-semibold px-2 py-1 rounded-md z-10`}
      style={{
        backgroundColor: label.background_color || '#000000',
        color: label.text_color || '#FFFFFF',
      }}
    >
      {label.text}
    </div>
  );
};

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
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Debug quantity changes
  useEffect(() => {
    console.log('🔄 ProductDetail: Quantity changed to:', quantity);
  }, [quantity]);
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
    if (product && productLabels && productLabels.length > 0) {
      const applicableLabels = evaluateProductLabels(product, productLabels);

      // Update product with new labels
      setProduct(prevProduct => ({
        ...prevProduct,
        labels: applicableLabels.map(label => label.text)
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
          setProductLayoutConfig(publishedConfig.configuration);
          setConfigLoaded(true);

        } else {
          // Fallback to product-config.js
          console.log('📋 No published config found, using default product-config.js');
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
          console.log('📋 Fallback config loaded:', fallbackConfig);
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

  // Initialize secure slot binding after product and configuration are loaded
  useEffect(() => {
    if (product && store && settings && configLoaded) {
      // Delay initialization to ensure DOM elements from UnifiedSlotRenderer are rendered
      const timeoutId = setTimeout(() => {
        const productContext = {
          product,
          store,
          settings,
          handleAddToCart: (cartData) => {
            console.log('Add to cart:', cartData);
            // TODO: Implement actual add to cart logic
          },
          handleWishlistToggle: (productToToggle) => {
            console.log('Wishlist toggle:', productToToggle);
            // TODO: Implement actual wishlist logic
          }
        };

        const controller = initializeProductSlotBinding(productContext);

        // Store controller in a ref or state for cleanup
        window._productController = controller;
      }, 0); // Use 0 to run after the current render cycle

      return () => {
        clearTimeout(timeoutId);
        if (window._productController && window._productController.destroy) {
          window._productController.destroy();
          window._productController = null;
        }
      };
    }
  }, [product, store, settings, configLoaded]);

  /**
   * Evaluate which labels apply to the product based on their conditions
   */
  const evaluateProductLabels = (product, labels) => {
    if (!labels || !Array.isArray(labels) || !product) {
      return [];
    }

    const applicableLabels = [];

    for (const label of labels) {
      if (!label.is_active) {
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
        for (const condition of conditions.attribute_conditions) {
          // Check both direct product properties and nested attributes
          let productValue = product[condition.attribute_code];

          // If not found directly, check in product.attributes
          if (productValue === undefined && product.attributes) {
            productValue = product.attributes[condition.attribute_code];

            // Handle attributes that are objects with value/label structure
            if (productValue && typeof productValue === 'object' && productValue.value) {
              productValue = productValue.value;
            }
          }


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
        applicableLabels.push(label);
      }
    }

    // Sort by priority if specified
    applicableLabels.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return applicableLabels;
  };

  const loadProductData = async () => {
    try {
      setLoading(true);

      if (!store?.id || !slug) {
        setProduct(null);
        setLoading(false);
        return;
      }

      const cacheKey = `product-detail-${slug}-${store.id}`;
      
      // First try to find by slug
      let products = await cachedApiCall(cacheKey, () =>
        StorefrontProduct.filter({ store_id: store.id, slug: slug, status: 'active' })
      );
      
      // If no product found by slug, try searching by SKU as fallback
      if (!products || products.length === 0) {
        const skuCacheKey = `product-detail-sku-${slug}-${store.id}`;
        products = await cachedApiCall(skuCacheKey, () =>
          StorefrontProduct.filter({ store_id: store.id, sku: slug, status: 'active' })
        );
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
          labels: applicableLabels.map(label => label.text)
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
                item_name: foundProduct.name,
                price: parseFloat(foundProduct.price || 0).toFixed(2),
                item_brand: foundProduct.brand, // Assuming product has a brand field
                item_category: categories.find(cat => cat.id === foundProduct.category_ids?.[0])?.name || '', // Find category name
                currency: settings?.currency_code || 'USD'
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
        console.warn(`Product with slug '${slug}' not found.`);
        setProduct(null);
      }
    } catch (error) {
      console.error("Failed to load product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomOptions = async (product) => {
    if (!product || !store?.id) return;
    try {
      console.log('Loading custom options for product:', product.sku, 'store:', store.id);

      // Import the CustomOptionRule entity
      const { CustomOptionRule } = await import('@/api/entities');

      // Check if we're authenticated
      const apiClient = (await import('@/api/client')).default;
      const hasToken = apiClient.getToken();
      console.log('Has auth token:', !!hasToken);

      // Try different API calls to debug the issue
      try {
        // First try to fetch all custom option rules without filters
        console.log('Testing: Fetching all custom option rules...');
        const allRules = await CustomOptionRule.filter({});
        console.log('All custom option rules result:', allRules);

        // Try fetching with store filter
        console.log('Testing: Fetching rules for store:', store.id);
        const storeRules = await CustomOptionRule.filter({ store_id: store.id });
        console.log('Store rules result:', storeRules);

        // Try fetching with active filter
        console.log('Testing: Fetching active rules for store...');
        const activeRules = await CustomOptionRule.filter({
          store_id: store.id,
          is_active: true
        });
        console.log('Active rules result:', activeRules);

        // Use the active rules as our main result
        const rules = activeRules;
        console.log('Final rules to process:', rules);

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
          console.log('Rule matches by SKU:', rule.name);
          return true;
        }

        // Check category conditions
        if (conditions?.categories?.length > 0 && product.category_ids?.length > 0) {
          const hasMatch = conditions.categories.some(catId => product.category_ids.includes(catId));
          if (hasMatch) {
            console.log('Rule matches by category:', rule.name);
            return true;
          }
        }

        // Check attribute conditions
        if (conditions?.attribute_conditions?.length > 0) {
          for (const condition of conditions.attribute_conditions) {
            if (product[condition.attribute_code] === condition.attribute_value) {
              console.log('Rule matches by attribute:', rule.name);
              return true;
            }
          }
        }

        return false;
      });

      console.log('Applicable rules:', applicableRules);

      if (applicableRules.length > 0) {
        const rule = applicableRules[0];
        setCustomOptionsLabel(rule.display_label || 'Custom Options');

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

        console.log('Loading custom option products:', productIds);

        if (productIds && productIds.length > 0) {
          const optionProducts = [];
          for (const productId of productIds) {
            try {
              const products = await StorefrontProduct.filter({
                id: productId,
                status: 'active'
              });
              if (products && products.length > 0) {
                const customOptionProduct = products[0];
                // Only include if it's marked as a custom option
                if (customOptionProduct.is_custom_option) {
                  optionProducts.push(customOptionProduct);
                }
              }
            } catch (err) {
              console.error(`Failed to load option product ${productId}:`, err);
            }
          }
          console.log('Loaded custom option products:', optionProducts);
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
      console.log('📋 Loading product tabs for store:', store.id);
      const tabs = await cachedApiCall(
        `product-tabs-${store.id}`,
        () => StorefrontProductTab.filter({ store_id: store.id, is_active: true })
      );
      console.log('📋 Product tabs loaded:', tabs);
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

    console.log('💰 getTotalPrice called with:', { quantity, selectedOptionsCount: selectedOptions.length });

    // Use the lower price (sale price) if compare_price exists and is different
    let basePrice = parseFloat(product.price);
    if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
      basePrice = Math.min(parseFloat(product.price), parseFloat(product.compare_price));
    }

    // Add selected options price
    const optionsPrice = selectedOptions.reduce((sum, option) => sum + (parseFloat(option.price) || 0), 0);

    // Calculate tax-inclusive price if needed
    const unitPrice = basePrice + optionsPrice;
    const displayUnitPrice = calculateDisplayPrice(unitPrice, store, taxes, selectedCountry);

    return displayUnitPrice * quantity;
  };

  const handleAddToCart = async () => {
    if (!product) return;

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

      // Calculate correct base price (use sale price if available)
      let basePrice = parseFloat(product.price);
      if (product.compare_price && parseFloat(product.compare_price) > 0 && parseFloat(product.compare_price) !== parseFloat(product.price)) {
        basePrice = Math.min(parseFloat(product.price), parseFloat(product.compare_price));
      }

      const result = await cartService.addItem(
        product.id,
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
                item_name: product.name,
                price: parseFloat(basePrice || 0).toFixed(2),
                quantity: quantity,
                item_brand: product.brand,
                item_category: categories.find(cat => cat.id === product.category_ids?.[0])?.name || '',
                currency: settings?.currency_code || 'USD'
              }]
            }
          });
        }

        setFlashMessage({
          type: 'success',
          message: `${product.name} added to cart successfully!`
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
  const trackStock = settings?.track_stock !== false; // Default to true if not explicitly false
  const isInStock = trackStock ? (product?.infinite_stock || product?.stock_quantity > 0) : true;
  const canAddToCart = !loading && isInStock && quantity > 0 && (!trackStock || product?.infinite_stock || product?.stock_quantity >= quantity);

  const currencySymbol = settings?.currency_symbol || '$';

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
      // Updated regex to handle {({quantity})} format
      return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
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
        // Remove quantity placeholder and any parentheses with numbers when hiding stock quantity
        // Updated regex to handle {({quantity})} format
        return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
      }
      // Replace {quantity} or ({quantity}) with actual number - handle both formats
      // Updated to handle {({quantity})} pattern and ({quantity}) pattern
      return label.replace(/\{\(\{quantity\}\)\}|\(\{quantity\}\)|\{quantity\}/g, (match) => {
        if (match === '{({quantity})}') {
          return `(${product.stock_quantity})`;
        }
        if (match === '({quantity})') {
          return `(${product.stock_quantity})`;
        }
        return match.includes('(') ? `(${product.stock_quantity})` : product.stock_quantity.toString();
      });
    }
    
    // Handle regular in stock
    const label = stockSettings.in_stock_label || "In Stock";
    if (hideStockQuantity) {
      // Remove quantity placeholder and any parentheses with numbers when hiding stock quantity
      // Updated regex to handle {({quantity})} format
      return label.replace(/\{\(\{quantity\}\)\}|\s*\{quantity\}|\s*\(\{quantity\}\)|\s*\(quantity\)|\s*\(\d+\)/g, '').trim();
    }
    // Replace {quantity} or ({quantity}) with actual number - handle both formats
    // Updated to handle {({quantity})} pattern and ({quantity}) pattern
    return label.replace(/\{\(\{quantity\}\)\}|\(\{quantity\}\)|\{quantity\}/g, (match) => {
      if (match === '{({quantity})}') {
        return `(${product.stock_quantity})`;
      }
      if (match === '({quantity})') {
        return `(${product.stock_quantity})`;
      }
      return match.includes('(') ? `(${product.stock_quantity})` : product.stock_quantity.toString();
    });
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


  return (
    <div>
      {flashMessage && (
        <div className="mb-6 max-w-6xl mx-auto px-4">
          <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        </div>
      )}

      <SeoHeadManager
        pageType="product"
        pageData={product}
        pageTitle={product?.name}
      />

      {/* Check if we should use slot configuration or fallback to traditional layout */}
      {(() => {
        // Determine if we should render with slots
        const hasConfig = productLayoutConfig && configLoaded;
        const hasSlots = hasConfig && productLayoutConfig.slots && Object.keys(productLayoutConfig.slots).length > 0;
        const slotCount = hasSlots ? Object.keys(productLayoutConfig.slots).length : 0;

        const shouldRender = true; // Force slot system usage

        // Debug logging
        console.log('🎯 Slot System Check:', {
          productLayoutConfig: !!productLayoutConfig,
          configLoaded,
          hasConfig,
          hasSlots,
          slotCount,
          shouldRender,
          slots: productLayoutConfig?.slots ? Object.keys(productLayoutConfig.slots) : 'none',
          productTabs: productTabs,
          productTabsCount: productTabs?.length || 0
        });

        return shouldRender;
      })() ? (
        <div className="grid grid-cols-12 gap-2 auto-rows-min">
          <UnifiedSlotRenderer
            slots={productLayoutConfig?.slots || productConfig}
            parentId={null}
            viewMode="default"
            context="storefront"
            productContext={{
              product,
              productTabs,
              customOptions: customOptions,
              relatedProducts: [], // TODO: Load related products
              store,
              settings,
              breadcrumbs: [
                { name: 'Home', url: '/' },
                // Add dynamic breadcrumbs based on categories
                ...(product?.category_ids?.map(catId => {
                  const cat = categories?.find(c => c.id === catId);
                  return cat ? { name: cat.name, url: `/category/${cat.slug}` } : null;
                }).filter(Boolean) || []),
                { name: product?.name, url: null }
              ],
              productLabels,
              selectedOptions,
              quantity,
              totalPrice: getTotalPrice(), // Pass calculated total price
              activeImageIndex: activeImage,
              activeTab,
              isInWishlist,
              currencySymbol: store?.currency_symbol || '$',
              canAddToCart: isInStock && quantity > 0,
              setQuantity,
              setSelectedOptions,
              setActiveImageIndex: setActiveImage,
              setActiveTab,
              setIsInWishlist,
              handleAddToCart: handleAddToCart,
              handleWishlistToggle: handleWishlistToggle,
              handleOptionChange: handleOptionChange,
              customOptionsLabel: customOptionsLabel
            }}
          />
        </div>
      ) : null
      }

    </div>
  );
}
