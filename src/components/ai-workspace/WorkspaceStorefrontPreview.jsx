import React, { useState, useEffect, useMemo } from 'react';
import { useAIWorkspace, PAGE_TYPES } from '@/contexts/AIWorkspaceContext';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { useStore } from '@/components/storefront/StoreProvider';
import { HeaderSlotRenderer } from '@/components/storefront/HeaderSlotRenderer';
import slotConfigurationService from '@/services/slotConfigurationService';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import slot renderers for different page types
import { UnifiedSlotRenderer } from '@/components/editor/slot/UnifiedSlotRenderer';
import { CategorySlotRenderer } from '@/components/storefront/CategorySlotRenderer';

// Import page-specific configs for defaults
import { productConfig } from '@/components/editor/slot/configs/product-config';
import { categoryConfig } from '@/components/editor/slot/configs/category-config';
import { cartConfig } from '@/components/editor/slot/configs/cart-config';
import { checkoutConfig } from '@/components/editor/slot/configs/checkout-config';
import { accountConfig } from '@/components/editor/slot/configs/account-config';
import { loginConfig } from '@/components/editor/slot/configs/login-config';
import { successConfig } from '@/components/editor/slot/configs/success-config';
import { headerConfig } from '@/components/editor/slot/configs/header-config';

/**
 * WorkspaceStorefrontPreview - Full storefront preview using draft configurations
 * Shows header, page content, and footer exactly like the public storefront
 */
const WorkspaceStorefrontPreview = () => {
  const { selectedPageType, viewportMode, currentConfiguration } = useAIWorkspace();
  const { getSelectedStoreId } = useStoreSelection();
  const { store, settings } = useStore();

  const [headerSlots, setHeaderSlots] = useState(null);
  const [pageSlots, setPageSlots] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const storeId = getSelectedStoreId();

  // Get default config for page type
  const getDefaultConfigForPage = (pageType) => {
    switch (pageType) {
      case PAGE_TYPES.PRODUCT: return productConfig;
      case PAGE_TYPES.CATEGORY: return categoryConfig;
      case PAGE_TYPES.CART: return cartConfig;
      case PAGE_TYPES.CHECKOUT: return checkoutConfig;
      case PAGE_TYPES.ACCOUNT: return accountConfig;
      case PAGE_TYPES.LOGIN: return loginConfig;
      case PAGE_TYPES.SUCCESS: return successConfig;
      case PAGE_TYPES.HEADER: return headerConfig;
      default: return productConfig;
    }
  };

  // Load draft configurations for header and selected page
  useEffect(() => {
    const loadDraftConfigurations = async () => {
      if (!storeId) {
        // No store selected - use default configs
        setHeaderSlots(headerConfig.slots);
        setPageSlots(getDefaultConfigForPage(selectedPageType).slots);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load header draft config
        try {
          const headerResponse = await slotConfigurationService.getDraftConfiguration(
            storeId,
            'header',
            headerConfig
          );
          if (headerResponse?.data?.configuration?.slots) {
            setHeaderSlots(headerResponse.data.configuration.slots);
          } else {
            // Fallback to default header config
            setHeaderSlots(headerConfig.slots);
          }
        } catch (headerErr) {
          console.warn('Using default header config:', headerErr.message);
          setHeaderSlots(headerConfig.slots);
        }

        // For page content, use currentConfiguration if available (from editor context)
        // Otherwise load from API
        if (currentConfiguration?.slots && selectedPageType !== PAGE_TYPES.HEADER) {
          setPageSlots(currentConfiguration.slots);
        } else if (selectedPageType !== PAGE_TYPES.HEADER) {
          try {
            const pageResponse = await slotConfigurationService.getDraftConfiguration(
              storeId,
              selectedPageType,
              getDefaultConfigForPage(selectedPageType)
            );
            if (pageResponse?.data?.configuration?.slots) {
              setPageSlots(pageResponse.data.configuration.slots);
            } else {
              // Fallback to default page config
              setPageSlots(getDefaultConfigForPage(selectedPageType).slots);
            }
          } catch (pageErr) {
            console.warn('Using default page config:', pageErr.message);
            setPageSlots(getDefaultConfigForPage(selectedPageType).slots);
          }
        }
      } catch (err) {
        console.error('Error loading draft configurations:', err);
        // Use default configs on error instead of showing error
        setHeaderSlots(headerConfig.slots);
        setPageSlots(getDefaultConfigForPage(selectedPageType).slots);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraftConfigurations();
  }, [storeId, selectedPageType, currentConfiguration]);

  // Update page slots when currentConfiguration changes
  useEffect(() => {
    if (currentConfiguration?.slots && selectedPageType !== PAGE_TYPES.HEADER) {
      setPageSlots(currentConfiguration.slots);
    }
  }, [currentConfiguration, selectedPageType]);

  // Theme colors from store settings
  const themeColors = useMemo(() => {
    const theme = settings?.theme || {};
    return {
      primary: theme.primary_color || '#3b82f6',
      secondary: theme.secondary_color || '#10b981',
      background: theme.background_color || '#ffffff',
      text: theme.text_color || '#1f2937'
    };
  }, [settings]);

  // Viewport width based on mode
  const viewportWidth = useMemo(() => {
    switch (viewportMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  }, [viewportMode]);

  // Mock data for slot renderers
  const mockProduct = {
    id: 1,
    name: 'Sample Product',
    description: 'This is a sample product for preview purposes.',
    price: 99.99,
    images: [{ url: 'https://placehold.co/600x400', alt: 'Product Image' }],
    sku: 'SAMPLE-001',
    stock_quantity: 10
  };

  const mockCategory = {
    id: 1,
    name: 'Sample Category',
    description: 'This is a sample category for preview.',
    products: [mockProduct, mockProduct, mockProduct]
  };

  const mockCart = {
    items: [
      { product: mockProduct, quantity: 2 }
    ],
    total: 199.98,
    subtotal: 199.98
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-sm text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error is now handled gracefully with fallback to default configs
  // Only show error if we have no slots at all
  if (error && !headerSlots && !pageSlots) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Render page content based on type
  const renderPageContent = () => {
    if (!pageSlots && selectedPageType !== PAGE_TYPES.HEADER) {
      return (
        <div className="p-8 text-center text-gray-500">
          No slot configuration available for {selectedPageType}
        </div>
      );
    }

    // For header preview, show the header in the main area too
    if (selectedPageType === PAGE_TYPES.HEADER) {
      return (
        <div className="p-8 text-center text-gray-500">
          <p className="mb-4">Header preview is shown above.</p>
          <p className="text-sm">Edit the header using the Editor mode to see changes reflected here.</p>
        </div>
      );
    }

    // Use appropriate renderer based on page type
    switch (selectedPageType) {
      case PAGE_TYPES.CATEGORY:
        return (
          <CategorySlotRenderer
            slots={pageSlots}
            category={mockCategory}
            products={mockCategory.products}
            mode="preview"
          />
        );

      case PAGE_TYPES.PRODUCT:
      case PAGE_TYPES.CART:
      case PAGE_TYPES.CHECKOUT:
      case PAGE_TYPES.ACCOUNT:
      case PAGE_TYPES.LOGIN:
      case PAGE_TYPES.SUCCESS:
      default:
        return (
          <UnifiedSlotRenderer
            slots={pageSlots}
            pageType={selectedPageType}
            viewMode="default"
            product={mockProduct}
            cart={mockCart}
            mode="preview"
          />
        );
    }
  };

  return (
    <div className="h-full overflow-auto bg-gray-200 dark:bg-gray-900">
      {/* Viewport container for responsive preview */}
      <div
        className={cn(
          'mx-auto bg-white shadow-lg transition-all duration-300',
          viewportMode !== 'desktop' && 'my-4 rounded-lg overflow-hidden'
        )}
        style={{
          width: viewportWidth,
          minHeight: viewportMode === 'desktop' ? '100%' : 'calc(100% - 2rem)'
        }}
      >
        {/* Apply theme colors */}
        <style>{`
          .storefront-preview {
            --primary-color: ${themeColors.primary};
            --secondary-color: ${themeColors.secondary};
            --background-color: ${themeColors.background};
            --text-color: ${themeColors.text};
          }
        `}</style>

        <div className="storefront-preview flex flex-col min-h-full" style={{ backgroundColor: themeColors.background, color: themeColors.text }}>
          {/* Header */}
          {headerSlots && (
            <HeaderSlotRenderer
              slots={headerSlots}
              isPreview={true}
              previewMode={true}
            />
          )}

          {/* Main Content */}
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {renderPageContent()}
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{store?.name || 'Store'}</h3>
                  <p className="text-gray-400 text-sm">
                    {store?.description || 'Your trusted online store.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Shop</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><span className="hover:text-white cursor-pointer">All Products</span></li>
                    <li><span className="hover:text-white cursor-pointer">Categories</span></li>
                    <li><span className="hover:text-white cursor-pointer">New Arrivals</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Customer Service</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><span className="hover:text-white cursor-pointer">Contact Us</span></li>
                    <li><span className="hover:text-white cursor-pointer">Shipping Info</span></li>
                    <li><span className="hover:text-white cursor-pointer">Returns</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">About</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><span className="hover:text-white cursor-pointer">Our Story</span></li>
                    <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
                    <li><span className="hover:text-white cursor-pointer">Terms of Service</span></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} {store?.name || 'Store'}. All rights reserved.</p>
                <p className="mt-2 text-xs text-yellow-500">Preview Mode - Using Draft Configurations</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceStorefrontPreview;
