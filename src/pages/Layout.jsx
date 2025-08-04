

import React, { useState, useEffect, Fragment } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createAdminUrl, getExternalStoreUrl, getStoreBaseUrl } from "@/utils/urlUtils";
import { User, Auth } from "@/api/entities";
import apiClient from "@/api/client";
import { Store } from "@/api/entities";
import { hasBothRolesLoggedIn, handleLogout } from "@/utils/auth";
import StorefrontLayout from '@/components/storefront/StorefrontLayout';
import StoreSelector from '@/components/admin/StoreSelector';
import useRoleProtection from '@/hooks/useRoleProtection';
import RoleSwitcher from '@/components/RoleSwitcher';

import {
  Menu,
  X,
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Tag,
  ClipboardList,
  CreditCard,
  Ticket,
  FileText,
  Megaphone,
  Settings as SettingsIcon,
  ChevronDown,
  Store as StoreIcon,
  Palette,
  Globe,
  DollarSign,
  KeyRound,
  FileCode,
  Box,
  Users,
  BarChart2,
  BookOpen,
  Mail,
  Shield,
  LifeBuoy,
  Plus,
  Package,
  Puzzle,
  ChevronRight,
  Home,
  Building2,
  Crown,
  Receipt,
  Truck,
  Calendar,
  Upload,
  Camera,
  Search,
  BarChart3,
  Bot,
  Wallet,
  RefreshCw,
  Link2 as LinkIcon,
  Share2,
  Activity,
  FlaskConical,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StoreProvider } from "@/components/storefront/StoreProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreSelection } from "@/contexts/StoreSelectionContext";


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 5, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 ||
                         error.message?.includes('Rate limit') ||
                         error.message?.includes('429');

      if (isRateLimit && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`Layout: Rate limit hit, retrying in ${delayTime}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
};

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedStore } = useStoreSelection();
  
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gtmConfig, setGtmConfig] = useState(null);
  const [openGroups, setOpenGroups] = useState({
    "Overview": true,
    "Catalog": false,
    "Sales": false,
    "Content": false,
    "Marketing": false,
    "SEO": false, // Added new group for SEO
    "Store": false,
  });

  // Add this block to handle the RobotsTxt page
  if (currentPageName === 'RobotsTxt') {
    return <>{children}</>;
  }
  // End of new block

  useEffect(() => {
    const loadData = async () => {
        await loadUserAndHandleCredits(); // Combined function
        await loadGTMConfig();
    }
    loadData();
    
    // Listen for user data ready event
    const handleUserDataReady = () => {
      loadUserAndHandleCredits();
    };
    
    // Add global click detector to debug logout issues
    const globalClickHandler = (e) => {
      if (e.target.textContent?.includes('Logout') || e.target.closest('[data-testid="logout"]')) {
        // Logout click detected
      }
    };
    
    document.addEventListener('click', globalClickHandler, true);
    window.addEventListener('userDataReady', handleUserDataReady);
    
    return () => {
      document.removeEventListener('click', globalClickHandler, true);
      window.removeEventListener('userDataReady', handleUserDataReady);
    };
  }, []);

  const loadUserAndHandleCredits = async () => {
    try {
      
      // Use token-only validation like RoleProtectedRoute to avoid User.me() calls
      const hasStoreOwnerToken = !!localStorage.getItem('store_owner_auth_token');
      const storeOwnerUserData = localStorage.getItem('store_owner_user_data');
      
      if (hasStoreOwnerToken && storeOwnerUserData) {
        try {
          const userData = JSON.parse(storeOwnerUserData);
          setUser(userData);
        } catch (parseError) {
          console.error('🔍 Layout.jsx: Error parsing user data:', parseError);
          setUser(null);
        }
      } else {
        console.error('🔍 Layout.jsx: No valid store owner token or user data found');
        setUser(null);
      }
    } catch (error) {
      console.error('🔍 Layout.jsx: Error in token validation:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGTMConfig = async () => {
    try {
      if (!user) return;
      
      const { StorePlugin } = await import("@/api/entities");

      const userStores = await retryApiCall(() => Store.findAll());
      
      if (userStores && Array.isArray(userStores) && userStores.length > 0) {
        const selectedStore = userStores[0];
        const storePlugins = await retryApiCall(() => 
          StorePlugin.filter({ 
            is_active: true, 
            store_id: selectedStore.id 
          })
        );
        
        if (storePlugins && Array.isArray(storePlugins) && storePlugins.length > 0) {
          const gtmPlugin = storePlugins.find(p => p.plugin_slug === 'google-tag-manager');
          if (gtmPlugin && gtmPlugin.configuration?.gtm_script) {
            setGtmConfig(gtmPlugin.configuration);
          }
        }
      }
    } catch (error) {
    }
  };

  const publicPages = ['Landing', 'Auth', 'CustomerAuth', 'Pricing', 'Onboarding'];
  const storefrontPages = ['Storefront', 'ProductDetail', 'Cart', 'Checkout', 'CustomerDashboard', 'CmsPageViewer', 'OrderSuccess', 'HtmlSitemap'];
  const isPublicPage = publicPages.includes(currentPageName);
  const isStorefrontPage = storefrontPages.includes(currentPageName);
  const isCustomerDashboard = currentPageName === 'CustomerDashboard';
  const isAdminPage = !isPublicPage && !isStorefrontPage && !isCustomerDashboard;
  
  // Apply role-based access control only for admin pages
  useRoleProtection(isAdminPage);

  if (isLoading && isAdminPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isStorefrontPage || isCustomerDashboard) {
      return (
        <StoreProvider>
            <StorefrontLayout>{children}</StorefrontLayout>
        </StoreProvider>
      );
  }
  
  // Role-based access control is now handled by RoleProtectedRoute at the route level

  // Handle admin pages
  if (isAdminPage) {
      
      // Use token-only validation for admin access like RoleProtectedRoute
      const hasStoreOwnerToken = !!localStorage.getItem('store_owner_auth_token');
      
      if (!isLoading && !hasStoreOwnerToken) {
          navigate(createAdminUrl('ADMIN_AUTH'));
          return (
              <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                  <p className="text-lg text-gray-700 mb-4">Redirecting...</p>
              </div>
          );
      }
  }

  // For public pages
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RoleSwitcher />
        {gtmConfig?.gtm_script && (
          <div dangerouslySetInnerHTML={{ __html: gtmConfig.gtm_script }} />
        )}

        <style>{`
          :root {
            --primary: 220 90% 56%;
            --primary-foreground: 220 90% 98%;
            --secondary: 45 93% 58%;
            --secondary-foreground: 45 93% 15%;
            --accent: 262 83% 58%;
            --accent-foreground: 210 40% 98%;
            --destructive: 0 84% 60%;
            --destructive-foreground: 210 40% 98%;
            --muted: 210 40% 96%;
            --muted-foreground: 215 16% 47%;
            --card: 0 0% 100%;
            --card-foreground: 222 84% 5%;
            --popover: 0 0% 100%;
            --popover-foreground: 222 84% 5%;
            --border: 214 32% 91%;
            --input: 214 32% 91%;
            --ring: 220 90% 56%;
            --background: 0 0% 100%;
            --foreground: 222 84% 5%;
          }

          .material-elevation-1 {
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
          }

          .material-elevation-2 {
            box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
          }

          .material-ripple {
            position: relative;
            overflow: hidden;
          }

          .material-ripple:before {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
            transition: width 0.6s, height 0.6s, top 0.6s, left 0.6s;
            transform: translate(-50%, -50%);
          }

          .material-ripple:active:before {
            width: 300px;
            height: 300px;
          }
        `}</style>
        {children}
      </div>
    );
  }

  const navigationGroups = [
    {
      name: "Overview",
      items: [
        { name: "Dashboard", path: "Dashboard", icon: Home },
      ]
    },
    {
      name: "Catalog",
      items: [
        { name: "Categories", path: "CATEGORIES", icon: Tag },
        { name: "Products", path: "PRODUCTS", icon: Package },
        { name: "Attributes", path: "ATTRIBUTES", icon: SettingsIcon },
        { name: "Custom Options", path: "CUSTOM_OPTION_RULES", icon: Plus },
        { name: "Product Tabs", path: "PRODUCT_TABS", icon: Package },
        { name: "Product Labels", path: "PRODUCT_LABELS", icon: Tag },
        { name: "Stock Settings", path: "STOCK_SETTINGS", icon: BarChart3 },
      ]
    },
    {
      name: "Sales",
      items: [
        { name: "Orders", path: "ORDERS", icon: Receipt },
        { name: "Customers", path: "CUSTOMERS", icon: Users },
        { name: "Tax", path: "TAX", icon: Receipt },
        { name: "Shipping Methods", path: "SHIPPING_METHODS", icon: Truck },
        { name: "Payment Methods", path: "PAYMENT_METHODS", icon: CreditCard },
        { name: "Coupons", path: "COUPONS", icon: Tag },
        { name: "Delivery Settings", path: "DELIVERY_SETTINGS", icon: Calendar },
      ]
    },
    {
      name: "Content",
      items: [
        { name: "CMS Blocks", path: "CMS_BLOCKS", icon: FileText },
        { name: "CMS Pages", path: "CMS_PAGES", icon: FileText },
        { name: "Image Manager", path: "IMAGE_MANAGER", icon: Camera },
      ]
    },
    {
      name: "Marketing",
      items: [
        { name: "Cookie Consent", path: "COOKIE_CONSENT", icon: Shield },
        { name: "Analytics", path: "ANALYTICS", icon: BarChart3 },
        { name: "HeatMaps", path: "HEATMAPS", icon: Activity },
        { name: "A/B Testing", path: "ABTESTING", icon: FlaskConical },
        { name: "Marketplace Export", path: "MARKETPLACE_EXPORT", icon: Upload },
        { name: "Customer Activity", path: "CUSTOMER_ACTIVITY", icon: BarChart3 },
      ]
    },
    {
      name: "SEO",
      items: [
        { name: "Settings", path: "seo-tools/settings", icon: SettingsIcon },
        { name: "Templates", path: "seo-tools/templates", icon: FileText },
        { name: "Redirects", path: "seo-tools/redirects", icon: RefreshCw },
        { name: "Canonical", path: "seo-tools/canonical", icon: LinkIcon },
        { name: "Hreflang", path: "seo-tools/hreflang", icon: Globe },
        { name: "Robots", path: "seo-tools/robots", icon: Bot },
        { name: "Social & Schema", path: "seo-tools/social", icon: Share2 },
        { name: "Report", path: "seo-tools/report", icon: BarChart3 },
      ]
    },
    {
      name: "Store",
      items: [
        { name: "Settings", path: "SETTINGS", icon: SettingsIcon },
        { name: "Theme & Layout", path: "THEME_LAYOUT", icon: Palette },
        { name: "Image Processing", path: "image-processing", icon: Image },
        { name: "Plugins", path: "PLUGINS", icon: Puzzle },
        { name: "Akeneo Integration", path: "akeneo-integration", icon: RefreshCw },
        { name: "Team", path: "team", icon: Users },
        ...(user?.account_type === 'agency' || user?.role === 'admin' || user?.role === 'store_owner' ? [
          { name: "Stores", path: "STORES", icon: Building2 },
        ] : []),
      ]
    }
  ];

  const toggleGroup = (groupName) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };
  


  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RoleSwitcher />
      <style>{`
        :root {
          --primary: 220 90% 56%;
          --primary-foreground: 220 90% 98%;
          --secondary: 45 93% 58%;
          --secondary-foreground: 45 93% 15%;
          --accent: 210 40% 98%;
          --accent-foreground: 220 13% 13%;
          --destructive: 0 72% 51%;
          --destructive-foreground: 0 0% 98%;
          --border: 220 13% 91%;
          --input: 220 13% 91%;
          --ring: 220 90% 56%;
          --radius: 8px;
          --background: 0 0% 100%;
          --foreground: 222 84% 5%;
          --card: 0 0% 100%;
          --card-foreground: 222 84% 5%;
          --popover: 0 0% 100%;
          --popover-foreground: 222 84% 5%;
          --muted: 210 40% 96%;
          --muted-foreground: 215 16% 47%;
        }

        /* Fix dropdown and select styling globally */
        [data-radix-select-trigger] {
          background-color: white !important;
          border: 1px solid hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }

        [data-radix-select-trigger]:hover {
          background-color: hsl(var(--muted)) !important;
        }

        [data-radix-select-trigger]:focus {
          border-color: hsl(var(--ring)) !important;
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2) !important;
        }

        [data-radix-select-content] {
          background-color: white !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }

        [data-radix-select-item] {
          color: hsl(var(--foreground)) !important;
          background-color: transparent !important;
        }

        [data-radix-select-item]:hover,
        [data-radix-select-item][data-highlighted] {
          background-color: hsl(var(--muted)) !important;
        }

        [data-radix-select-item][data-state="checked"] {
          background-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }

        /* Also fix Popover components used in multi-selects */
        [data-radix-popover-content] {
          background-color: white !important;
          border: 1px solid hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }

        /* Fix Command components */
        [cmdk-root] {
          background-color: white !important;
          color: hsl(var(--foreground)) !important;
        }

        [cmdk-item] {
          color: hsl(var(--foreground)) !important;
        }

        [cmdk-item][data-selected="true"] {
          background-color: hsl(var(--muted)) !important;
        }

        .material-elevation-1 {
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        }

        .material-elevation-2 {
          box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
        }

        .material-elevation-3 {
          box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
        }

        .material-ripple {
          position: relative;
          overflow: hidden;
          transform: translate3d(0, 0, 0);
        }

        .material-ripple:after {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
          background-repeat: no-repeat;
          background-position: 50%;
          transform: scale(10, 10);
          opacity: 0;
          transition: transform .5s, opacity 1s;
        }

        .material-ripple:active:after {
          transform: scale(0, 0);
          opacity: .3;
          transition: 0s;
        }
      `}</style>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white material-elevation-2 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <StoreIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Catalyst</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{user?.first_name || user?.name || user?.email} ({user?.role})</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                    try {
                        if (!selectedStore?.id) return;
                        
                        // Fetch complete store data to ensure we have the slug
                        const fullStoreData = await Store.findById(selectedStore.id);
                        const fullStore = Array.isArray(fullStoreData) ? fullStoreData[0] : fullStoreData;
                        
                        const baseUrl = getStoreBaseUrl(fullStore);
                        const storeSlug = fullStore?.slug || selectedStore?.slug;
                        
                        if (storeSlug) {
                            window.open(getExternalStoreUrl(storeSlug, '', baseUrl), '_blank');
                        } else {
                            console.warn('Store slug not found for store:', selectedStore);
                        }
                    } catch (error) {
                        console.error('Error loading store data for View Storefront:', error);
                    }
                }}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>View Storefront</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(createPageUrl("Billing"))}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/team")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Team</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                    try {
                        await handleLogout();
                    } catch (error) {
                        console.error('❌ Mobile logout error:', error);
                        window.location.href = '/admin/auth';
                    }
                }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col h-full">
          <div className="p-6 flex-shrink-0">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.first_name || user?.full_name || user?.name || user?.email} ({user?.role})
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
               <div className="text-sm text-gray-600 mt-2">
                  Credits: <span className="font-bold text-gray-900">{user?.credits || 0}</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-1">
            {navigationGroups.map((group) => (
              <Collapsible key={group.name} open={openGroups[group.name]} onOpenChange={() => toggleGroup(group.name)}>
                <CollapsibleTrigger asChild>
                   <div className="flex items-center justify-between w-full cursor-pointer py-2">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {group.name}
                      </h3>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openGroups[group.name] ? 'rotate-180' : ''}`} />
                   </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                  {group.items.map((item) => {
                    let isActive = false;
                    const itemHasTab = item.path.includes('?tab=');
                    const isPathBased = item.path.includes('/') && !item.path.includes('?');
                    
                    if (itemHasTab) {
                        const [basePath, query] = item.path.split('?');
                        if (currentPageName === basePath) {
                            const itemTab = new URLSearchParams(query).get('tab');
                            const currentTab = new URLSearchParams(location.search).get('tab') || 'settings'; // Default tab is settings
                            isActive = itemTab === currentTab;
                        }
                    } else if (isPathBased) {
                        // For path-based items like seo-tools/settings, check if current path matches
                        const currentPath = location.pathname.replace('/admin/', '');
                        isActive = currentPath === item.path;
                    } else {
                        // For items without tabs, check if the current page name matches the item's path (ignoring any query params on item.path)
                        isActive = currentPageName === item.path.split('?')[0];
                    }

                    let itemClass = `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`;
                    
                    if (item.path === "Billing") {
                        itemClass += " animate-pulse bg-red-50 text-red-700";
                    }

                    return (
                      <Link
                        key={item.name}
                        to={createAdminUrl(item.path)}
                        className={itemClass}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <StoreIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Catalyst</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Desktop Header with Store Selector */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">{currentPageName || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <StoreSelector />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.first_name || user?.name || user?.email} ({user?.role})</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                  try {
                    if (!selectedStore?.id) return;
                    
                    // Fetch complete store data to ensure we have the slug
                    const fullStoreData = await Store.findById(selectedStore.id);
                    const fullStore = Array.isArray(fullStoreData) ? fullStoreData[0] : fullStoreData;
                    
                    const baseUrl = getStoreBaseUrl(fullStore);
                    const storeSlug = fullStore?.slug || selectedStore?.slug;
                    
                    if (storeSlug) {
                      window.open(getExternalStoreUrl(storeSlug, '', baseUrl), '_blank');
                    } else {
                      console.warn('Store slug not found for store:', selectedStore);
                    }
                  } catch (error) {
                    console.error('Error loading store data for View Storefront:', error);
                  }
                }}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>View Storefront</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(createPageUrl("Billing"))}>
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/team")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Team</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button
                    data-testid="logout"
                    className="w-full flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      try {
                        await handleLogout();
                      } catch (error) {
                        console.error('❌ Desktop logout error:', error);
                        console.error('❌ Error stack:', error.stack);
                        window.location.href = '/admin/auth';
                      }
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        

        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

