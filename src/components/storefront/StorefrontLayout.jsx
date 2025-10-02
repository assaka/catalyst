
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl, createCategoryUrl } from '@/utils/urlUtils';
import { Auth } from '@/api/entities';
import { handleLogout } from '@/utils/auth';
import { StorefrontCategory } from '@/api/storefront-entities';
import { CustomerAuth } from '@/api/storefront-entities';
import { DeliverySettings, User, apiClient } from '@/api/entities';
import { ShoppingBag, User as UserIcon, Globe, Menu, Search, ChevronDown, Settings, Package, LogOut, X } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MiniCart from './MiniCart';
import WishlistDropdown from './WishlistDropdown';
import CategoryNav from './CategoryNav';
import HeaderSearch from './HeaderSearch';
import CmsBlockRenderer from './CmsBlockRenderer';
import { useStore } from '@/components/storefront/StoreProvider';
import RedirectHandler from '@/components/shared/RedirectHandler';
import { SeoSettingsProvider } from '@/components/storefront/SeoSettingsProvider';
import { CountrySelect } from "@/components/ui/country-select";
import SeoHeadManager from './SeoHeadManager';
import DataLayerManager from '@/components/storefront/DataLayerManager';
import CookieConsentBanner from '@/components/storefront/CookieConsentBanner';
import RoleSwitcher from '@/components/admin/RoleSwitcher';
import HeatmapTrackerComponent from '@/components/admin/heatmap/HeatmapTracker';
import FlashMessage from '@/components/storefront/FlashMessage';
import { HeaderSlotRenderer } from './HeaderSlotRenderer';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 5, baseDelay = 3000, defaultValueOnError = []) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 ||
                         error.message?.includes('Rate limit') ||
                         error.message?.includes('429');

      if (isRateLimit && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`StorefrontLayout: Rate limit hit, retrying in ${delayTime}ms...`);
        await delay(delayTime);
        continue;
      }
      if (isRateLimit) {
          console.error("StorefrontLayout: Rate limit error after all retries. Returning default value.", error);
          return defaultValueOnError;
      }
      throw error;
    }
  }
};

export default function StorefrontLayout({ children }) {
    const { store, settings, loading, selectedCountry, setSelectedCountry, categories } = useStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [languages, setLanguages] = useState([]);
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [gtmScript, setGtmScript] = useState(null);
    const [expandedMobileCategories, setExpandedMobileCategories] = useState(new Set());

    // Flash message state
    const [flashMessage, setFlashMessage] = useState(null);

    // Load header slot configuration
    const { headerSlots, headerConfigLoaded } = useHeaderConfig(store);

    // Toggle function for mobile category expansion
    const toggleMobileCategory = (categoryId) => {
        setExpandedMobileCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    // Custom logout handler for storefront - just reload the page
    const handleCustomerLogout = async () => {
        try {
            await CustomerAuth.logout();
            window.location.reload();
        } catch (error) {
            console.error('Customer logout error:', error);
            window.location.reload();
        }
    };

    // Apply store theme settings to CSS variables
    useEffect(() => {
      if (store?.settings?.theme) {
        const theme = store.settings.theme;
        const root = document.documentElement;
        
        if (theme.primary_button_color) {
          root.style.setProperty('--theme-primary-button', theme.primary_button_color);
        }
        if (theme.secondary_button_color) {
          root.style.setProperty('--theme-secondary-button', theme.secondary_button_color);
        }
        if (theme.add_to_cart_button_color) {
          root.style.setProperty('--theme-add-to-cart-button', theme.add_to_cart_button_color);
        }
        if (theme.font_family) {
          root.style.setProperty('--theme-font-family', theme.font_family);
        }
      }
    }, [store?.settings?.theme]);

    useEffect(() => {
        const fetchData = async () => {
            if (loading || !store) return;

            try {
                // Languages feature temporarily disabled for storefront
                setLanguages([]);

                // Google Tag Manager plugin temporarily disabled
                try {
                    if (false) { // Disabled until backend supports public plugin endpoints
                        setGtmScript(plugins[0].configuration.gtm_script);
                    }
                } catch (error) {
                    console.warn('StorefrontLayout: Could not load GTM plugin, skipping:', error.message);
                }
                
                try {
                    await delay(200 + Math.random() * 300);
                    const userData = await retryApiCall(async () => {
                        return await CustomerAuth.me();
                    }, 5, 3000, null);
                    
                    // Only show user as logged in if they are a customer in storefront context
                    if (userData && userData.role === 'customer') {
                        setUser(userData);
                    } else {
                        // Store owners/admins should not appear as logged in on storefront
                        setUser(null);
                    }
                } catch (e) {
                    setUser(null);
                } finally {
                    setUserLoading(false);
                }

            } catch (error) {
                setUser(null);
                setUserLoading(false);
            }
        };
        fetchData();
    }, [loading, store]);


    // Flash message event listener
    useEffect(() => {
      const handleShowFlashMessage = (event) => {
        const { type, message } = event.detail;
        setFlashMessage({ type, message });

        // Auto-hide flash message after 5 seconds
        setTimeout(() => {
          setFlashMessage(null);
        }, 5000);
      };

      window.addEventListener('showFlashMessage', handleShowFlashMessage);
      return () => window.removeEventListener('showFlashMessage', handleShowFlashMessage);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
                    <p className="text-gray-600">The store you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const path = location.pathname.toLowerCase();
    // FIXED: Apply store settings properly  
    const hideHeaderOnCart = settings?.hide_header_cart && path.includes('/cart');
    const hideHeaderOnCheckout = settings?.hide_header_checkout && path.includes('/checkout');
    const hideHeader = hideHeaderOnCart || hideHeaderOnCheckout;

    const getCurrentPage = () => {
        if (path.includes('/cart')) return 'storefront_cart';
        if (path.includes('/checkout')) return 'storefront_checkout';
        if (path.includes('/productdetail')) return 'storefront_product';
        if (path.includes('/storefront') && location.search.includes('category=')) return 'storefront_category';
        if (path.includes('/storefront')) return 'storefront_home';
        return 'all_pages';
    };

    // FIXED: Apply show permanent search setting
    const showPermanentSearch = settings?.show_permanent_search !== false;

    const googleFontLink = settings?.theme?.font_family 
      ? `https://fonts.googleapis.com/css2?family=${settings.theme.font_family.replace(/ /g, '+')}:wght@400;700&display=swap`
      : '';

    // FIXED: Apply theme colors to cart buttons
    const themeStyles = `
      :root {
        --theme-primary-button: ${settings?.theme?.primary_button_color || '#007bff'};
        --theme-secondary-button: ${settings?.theme?.secondary_button_color || '#6c757d'};
        --theme-add-to-cart-button: ${settings?.theme?.add_to_cart_button_color || '#28a745'};
        --theme-view-cart-button: ${settings?.theme?.view_cart_button_color || '#17a2b8'};
        --theme-checkout-button: ${settings?.theme?.checkout_button_color || '#007bff'};
        --theme-place-order-button: ${settings?.theme?.place_order_button_color || '#28a745'};
        --theme-font-family: ${settings?.theme?.font_family || 'Inter'}, sans-serif;
      }
      body {
          font-family: var(--theme-font-family);
      }
      /* Apply theme colors to buttons */
      .btn-primary, .bg-blue-600 {
          background-color: var(--theme-primary-button);
      }
      .btn-secondary, .bg-gray-600 {
          background-color: var(--theme-secondary-button);
      }
      .btn-add-to-cart, .bg-green-600 {
          background-color: var(--theme-add-to-cart-button);
      }
      .btn-view-cart {
          background-color: var(--theme-view-cart-button);
      }
      .btn-checkout {
          background-color: var(--theme-checkout-button);
      }
      .btn-place-order {
          background-color: var(--theme-place-order-button);
      }
    `;

    const cookieConsentSettings = settings?.cookie_consent;

    return (
        <SeoSettingsProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
                <RoleSwitcher />
                <DataLayerManager />
                
                {/* Heatmap Tracker - Track all customer interactions */}
                <HeatmapTrackerComponent 
                    storeId={store?.id}
                    config={{
                        trackClicks: true,
                        trackHovers: true,
                        trackScrolls: true,
                        trackTouches: true,
                        trackFocus: true,
                        batchSize: 10,
                        batchTimeout: 3000,
                        excludeSelectors: ['.heatmap-exclude', '[data-heatmap-exclude]', '.role-switcher']
                    }}
                />
            {googleFontLink && (
              <link href={googleFontLink} rel="stylesheet" />
            )}
            {settings?.theme?.font_script && ( 
              <div dangerouslySetInnerHTML={{ __html: settings.theme.font_script }} />
            )}
            {gtmScript && (
                <div dangerouslySetInnerHTML={{ __html: gtmScript }} />
            )}
            <style>{themeStyles}</style>
            
            <SeoHeadManager title={store?.name || 'Catalyst Commerce'} description={store?.description || 'Welcome to our store.'} />

            {!hideHeader && headerConfigLoaded && headerSlots ? (
                <>
                    {/* New slot-based header */}
                    <HeaderSlotRenderer
                        slots={headerSlots}
                        parentId={null}
                        viewMode={window.innerWidth < 768 ? 'mobile' : 'desktop'}
                        headerContext={{
                            store,
                            settings,
                            user,
                            userLoading,
                            categories,
                            languages,
                            currentLanguage,
                            selectedCountry,
                            mobileMenuOpen,
                            mobileSearchOpen,
                            setCurrentLanguage,
                            setSelectedCountry,
                            setMobileMenuOpen,
                            setMobileSearchOpen,
                            handleCustomerLogout,
                            navigate,
                            location
                        }}
                    />
                </>
            ) : !hideHeader && (
                <>
                    {/* Fallback to old hardcoded header */}
                    <header className="bg-white shadow-md sticky top-0 z-40">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between h-16">
                                <div className="flex items-center">
                                    <Link to={createPublicUrl(store.slug, 'STOREFRONT')} className="flex items-center space-x-2">
                                        {store?.logo_url ? (
                                            <img src={store.logo_url} alt={store.name || 'Store Logo'} className="h-8 w-8 object-contain" />
                                        ) : (
                                            <ShoppingBag className="h-8 w-8 text-blue-600" />
                                        )}
                                        <span className="text-xl font-bold text-gray-800">{store?.name || 'Catalyst'}</span>
                                    </Link>
                                </div>

                                {/* FIXED: Apply hide search setting */}
                                {!settings?.hide_header_search && (
                                    <div className="hidden md:flex flex-1 justify-center px-8">
                                        <div className="w-full max-w-lg">
                                            <HeaderSearch />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1 md:hidden">
                                        {!showPermanentSearch && !settings?.hide_header_search && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                                            >
                                                <Search className="w-5 h-5" />
                                            </Button>
                                        )}
                                        {user ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={userLoading}
                                                    >
                                                        <UserIcon className="w-5 h-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-48">
                                                    <DropdownMenuLabel>
                                                        {user.first_name || user.name || user.email} ({user.role})
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {user.role === 'customer' ? (
                                                        <>
                                                            <DropdownMenuItem onClick={() => {
                                                                navigate(createPublicUrl(store.slug, 'CUSTOMER_ACCOUNT'));
                                                            }}>
                                                                <Settings className="mr-2 h-4 w-4" />
                                                                <span>My Account</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => {
                                                                handleCustomerLogout();
                                                            }}>
                                                                <LogOut className="mr-2 h-4 w-4" />
                                                                <span>Logout</span>
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DropdownMenuItem onClick={() => {
                                                                window.location.href = createPageUrl('Dashboard');
                                                            }}>
                                                                <Settings className="mr-2 h-4 w-4" />
                                                                <span>Admin Dashboard</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => {
                                                                handleLogout();
                                                            }}>
                                                                <LogOut className="mr-2 h-4 w-4" />
                                                                <span>Logout</span>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => {
                                                    // Save store info for redirect after login
                                                    localStorage.setItem('customer_auth_store_id', store.id);
                                                    localStorage.setItem('customer_auth_store_code', store.slug);
                                                    navigate(createPublicUrl(store.slug, 'CUSTOMER_AUTH'));
                                                }}
                                                disabled={userLoading}
                                            >
                                                <UserIcon className="w-5 h-5" />
                                            </Button>
                                        )}
                                        <WishlistDropdown />
                                     </div>

                                     <div className="hidden md:flex items-center space-x-3">
                                        {Array.isArray(languages) && languages.length > 1 && (
                                            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                                                <SelectTrigger className="w-auto border-none bg-transparent space-x-2">
                                                    <Globe className="w-4 h-4" />
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {languages.map(language => (
                                                        <SelectItem key={language.id} value={language.code}>
                                                            <div className="flex items-center space-x-2">
                                                                <span>{language.flag_icon}</span>
                                                                <span>{language.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {settings.allowed_countries && Array.isArray(settings.allowed_countries) && settings.allowed_countries.length > 1 && (
                                            <CountrySelect
                                                value={selectedCountry}
                                                onValueChange={setSelectedCountry}
                                                allowedCountries={settings.allowed_countries}
                                            />
                                        )}
                                        {user ? (
                                            <div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-1"
                                                        >
                                                            <UserIcon className="w-4 h-4" />
                                                            <span>{user.first_name || user.name || user.email} ({user.role})</span>
                                                            <ChevronDown className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-56">
                                                        <DropdownMenuLabel>
                                                            {user.first_name || user.name || user.email} ({user.role})
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {user.role === 'customer' ? (
                                                            <>
                                                                <DropdownMenuItem onClick={() => {
                                                                    navigate(createPublicUrl(store.slug, 'CUSTOMER_DASHBOARD'));
                                                                }}>
                                                                    <Settings className="mr-2 h-4 w-4" />
                                                                    <span>My Account</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    handleCustomerLogout();
                                                                }}>
                                                                    <LogOut className="mr-2 h-4 w-4" />
                                                                    <span>Logout</span>
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem onClick={() => {
                                                                    window.location.href = '/admin/dashboard';
                                                                }}>
                                                                    <Settings className="mr-2 h-4 w-4" />
                                                                    <span>Admin Dashboard</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    handleLogout();
                                                                }}>
                                                                    <LogOut className="mr-2 h-4 w-4" />
                                                                    <span>Logout</span>
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ) : (
                                            <Button
                                                onClick={() => {
                                                    // Save store info for redirect after login
                                                    localStorage.setItem('customer_auth_store_id', store.id);
                                                    localStorage.setItem('customer_auth_store_code', store.slug);
                                                    navigate(createPublicUrl(store.slug, 'CUSTOMER_AUTH'));
                                                }}
                                                disabled={userLoading}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                                            >
                                                <UserIcon className="w-5 h-5 mr-2" />
                                                <span>Sign In</span>
                                            </Button>
                                        )}
                                        <WishlistDropdown />
                                     </div>

                                     {/* Single responsive MiniCart for both mobile and desktop */}
                                     {!settings?.hide_header_cart && (
                                         <MiniCart />
                                     )}

                                     <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    >
                                        <Menu className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* FIXED: Apply permanent search and hide search settings */}
                        {!settings?.hide_header_search && (mobileSearchOpen || showPermanentSearch) && (
                            <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3">
                                <HeaderSearch />
                            </div>
                        )}

                        {mobileMenuOpen && (
                            <div className="md:hidden border-t border-gray-200 bg-white">
                                <div className="px-4 py-3 space-y-2">
                                    {Array.isArray(categories) && store && (() => {
                                        // Build hierarchical tree for mobile menu
                                        const buildMobileCategoryTree = (categories) => {
                                            const categoryMap = new Map();
                                            const rootCategories = [];
                                            let visibleCategories = categories.filter(c => !c.hide_in_menu);

                                            // If store has a root category, filter to only show that category tree
                                            if (store?.settings?.rootCategoryId && store.settings.rootCategoryId !== 'none') {
                                                const filterCategoryTree = (categoryId, allCategories) => {
                                                    const children = allCategories.filter(c => c.parent_id === categoryId);
                                                    let result = children.slice();
                                                    children.forEach(child => {
                                                        result = result.concat(filterCategoryTree(child.id, allCategories));
                                                    });
                                                    return result;
                                                };
                                                
                                                const rootCategory = visibleCategories.find(c => c.id === store.settings.rootCategoryId);
                                                if (rootCategory) {
                                                    const descendants = filterCategoryTree(store.settings.rootCategoryId, visibleCategories);
                                                    
                                                    // Check if we should exclude root category from menu
                                                    if (store.settings.excludeRootFromMenu) {
                                                        visibleCategories = descendants; // Only show descendants, not the root
                                                    } else {
                                                        visibleCategories = [rootCategory, ...descendants]; // Include root and descendants
                                                    }
                                                } else {
                                                    visibleCategories = [];
                                                }
                                            }

                                            visibleCategories.forEach(category => {
                                                categoryMap.set(category.id, { ...category, children: [] });
                                            });

                                            visibleCategories.forEach(category => {
                                                const categoryNode = categoryMap.get(category.id);
                                                if (category.parent_id && categoryMap.has(category.parent_id)) {
                                                    const parent = categoryMap.get(category.parent_id);
                                                    parent.children.push(categoryNode);
                                                } else {
                                                    rootCategories.push(categoryNode);
                                                }
                                            });

                                            return rootCategories;
                                        };

                                        const renderMobileCategory = (category, depth = 0) => {
                                            const hasChildren = category.children && category.children.length > 0;
                                            const isExpanded = expandedMobileCategories.has(category.id);
                                            const shouldShowAllSubcategories = store?.settings?.expandAllMenuItems;
                                            
                                            return (
                                                <div key={category.id}>
                                                    <div className="flex items-center">
                                                        {hasChildren && !shouldShowAllSubcategories && (
                                                            <button
                                                                onClick={() => toggleMobileCategory(category.id)}
                                                                className="p-1 mr-1 hover:bg-gray-200 rounded touch-manipulation"
                                                                style={{ marginLeft: `${12 + depth * 16}px` }}
                                                            >
                                                                {isExpanded ? '▼' : '▶'}
                                                            </button>
                                                        )}
                                                        <Link
                                                            to={createCategoryUrl(store.slug, category.slug)}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className="flex-1 block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md touch-manipulation"
                                                            style={{ 
                                                                paddingLeft: hasChildren && !shouldShowAllSubcategories 
                                                                    ? '8px' 
                                                                    : `${12 + depth * 16}px` 
                                                            }}
                                                        >
                                                            {category.name}
                                                        </Link>
                                                    </div>
                                                    {hasChildren && (shouldShowAllSubcategories || isExpanded) && 
                                                        category.children.map(child => renderMobileCategory(child, depth + 1))
                                                    }
                                                </div>
                                            );
                                        };

                                        // Always show categories in hamburger menu - this is the mobile navigation
                                        return buildMobileCategoryTree(categories).map(category => renderMobileCategory(category));
                                    })()}

                                    {Array.isArray(languages) && languages.length > 1 && (
                                        <div className="pt-3 mt-3 border-t border-gray-200">
                                            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                                                <SelectTrigger className="w-full">
                                                    <Globe className="w-4 h-4 mr-2" />
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {languages.map(language => (
                                                        <SelectItem key={language.id} value={language.code}>
                                                            <div className="flex items-center space-x-2">
                                                                <span>{language.flag_icon}</span>
                                                                <span>{language.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {settings.allowed_countries && Array.isArray(settings.allowed_countries) && settings.allowed_countries.length > 1 && (
                                        <div className="pt-3 mt-3 border-t border-gray-200">
                                            <CountrySelect 
                                                value={selectedCountry} 
                                                onValueChange={setSelectedCountry} 
                                                allowedCountries={settings.allowed_countries}
                                            />
                                        </div>
                                    )}
                                    
                                    {user && (
                                        <div className="pt-3 mt-3 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    if (user.account_type === 'agency' || user.role === 'admin' || user.role === 'store_owner') {
                                                        window.location.href = '/admin/dashboard';
                                                    } else {
                                                        navigate(createPublicUrl(store.slug, 'CUSTOMER_ACCOUNT'));
                                                    }
                                                }}
                                                className="w-full flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md"
                                            >
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>Dashboard</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (user.role === 'customer') {
                                                        handleCustomerLogout();
                                                    } else {
                                                        handleLogout();
                                                    }
                                                }}
                                                className="w-full flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 rounded-md"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </header>

                    <nav className={`${store?.settings?.expandAllMenuItems ? 'block' : 'hidden md:block'} bg-gray-50 border-b border-gray-200`}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-center py-3">
                                <CategoryNav categories={categories} />
                            </div>
                        </div>
                    </nav>
                </>
            )}

            <CmsBlockRenderer position="header" page={getCurrentPage()} />

            <div className="flex-1">
                {/* Main Content - Full Width */}
                <main className="w-full px-4 sm:px-6 lg:px-8 pb-8">
                    <CmsBlockRenderer position="before_content" page={getCurrentPage()} />

                    {/* Global Flash Message */}
                    {flashMessage && (
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                            <FlashMessage
                                message={flashMessage}
                                onClose={() => setFlashMessage(null)}
                            />
                        </div>
                    )}

                    <RedirectHandler storeId={store?.id}>
                        {children}
                    </RedirectHandler>
                    <CmsBlockRenderer position="after_content" page={getCurrentPage()} />
                </main>
            </div>

            <CmsBlockRenderer position="footer" page={getCurrentPage()} />

            <footer className="bg-gray-800 text-white">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold tracking-wider uppercase">Shop</h3>
                            <ul className="mt-4 space-y-2">
                                {Array.isArray(categories) && store && (() => {
                                    let footerCategories = categories.filter(c => !c.hide_in_menu);
                                    
                                    // If store has a root category, filter to only show that category tree
                                    if (store?.settings?.rootCategoryId && store.settings.rootCategoryId !== 'none') {
                                        const filterCategoryTree = (categoryId, allCategories) => {
                                            const children = allCategories.filter(c => c.parent_id === categoryId);
                                            let result = children.slice();
                                            children.forEach(child => {
                                                result = result.concat(filterCategoryTree(child.id, allCategories));
                                            });
                                            return result;
                                        };
                                        
                                        const rootCategory = footerCategories.find(c => c.id === store.settings.rootCategoryId);
                                        if (rootCategory) {
                                            const descendants = filterCategoryTree(store.settings.rootCategoryId, footerCategories);
                                            
                                            // Check if we should exclude root category from menu
                                            if (store.settings.excludeRootFromMenu) {
                                                footerCategories = descendants; // Only show descendants, not the root
                                            } else {
                                                footerCategories = [rootCategory, ...descendants]; // Include root and descendants
                                            }
                                        } else {
                                            footerCategories = [];
                                        }
                                    }
                                    
                                    // Only show root categories in footer (first level of visible categories)
                                    return footerCategories
                                        .filter(c => {
                                            if (store?.settings?.rootCategoryId && store.settings.rootCategoryId !== 'none') {
                                                // If excluding root from menu, show direct children of root category
                                                if (store.settings.excludeRootFromMenu) {
                                                    return c.parent_id === store.settings.rootCategoryId;
                                                } else {
                                                    // Show the root category itself or direct children of root category
                                                    return c.parent_id === store.settings.rootCategoryId || c.id === store.settings.rootCategoryId;
                                                }
                                            } else {
                                                // Show all root categories when no root category is set
                                                return !c.parent_id;
                                            }
                                        })
                                        .slice(0, 4)
                                        .map(c => (
                                            <li key={c.id}>
                                                <Link to={createCategoryUrl(store.slug, c.slug)} className="text-base text-gray-300 hover:text-white">{c.name}</Link>
                                            </li>
                                        ));
                                })()}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold tracking-wider uppercase">About</h3>
                            <ul className="mt-4 space-y-2">
                                <li><Link to="#" className="text-base text-gray-300 hover:text-white">Our Story</Link></li>
                                <li><Link to="#" className="text-base text-gray-300 hover:text-white">Careers</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold tracking-wider uppercase">Support</h3>
                            <ul className="mt-4 space-y-2">
                                <li><Link to="#" className="text-base text-gray-300 hover:text-white">Contact Us</Link></li>
                                <li><Link to="#" className="text-base text-gray-300 hover:text-white">Shipping & Returns</Link></li>
                                <li><Link to={createPublicUrl(store.slug, 'SITEMAP')} className="text-base text-gray-300 hover:text-white">Sitemap</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold tracking-wider uppercase">Connect</h3>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-700 pt-8 text-center">
                        <p className="text-base text-gray-400">&copy; {new Date().getFullYear()} {store?.name || 'Catalyst Commerce'}. All rights reserved.</p>
                    </div>
                </div>
            </footer>
            
            {settings?.cookie_consent?.enabled && (
                <CookieConsentBanner />
            )}
            </div>
        </SeoSettingsProvider>
    );
}
