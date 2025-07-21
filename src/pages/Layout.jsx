

import React, { useState, useEffect, Fragment } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Auth } from "@/api/entities";
import apiClient from "@/api/client";
import { Store } from "@/api/entities";
import StorefrontLayout from '@/components/storefront/StorefrontLayout';
import StoreSelector from '@/components/admin/StoreSelector';

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
  Share2
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
    
    // Add global click detector to debug logout issues
    const globalClickHandler = (e) => {
      if (e.target.textContent?.includes('Logout') || e.target.closest('[data-testid="logout"]')) {
        console.log('🎯 Global click detected on logout element!', {
          target: e.target,
          textContent: e.target.textContent,
          classList: e.target.classList?.toString()
        });
      }
    };
    
    document.addEventListener('click', globalClickHandler, true);
    
    return () => {
      document.removeEventListener('click', globalClickHandler, true);
    };
  }, []);

  const loadUserAndHandleCredits = async () => {
    try {
      let userData = await retryApiCall(() => User.me());
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastDeduction = userData.last_credit_deduction_date ? new Date(userData.last_credit_deduction_date) : null;
      
      if (!lastDeduction || lastDeduction < today) {
        if ((userData.credits || 0) > 0) {
          const newCredits = userData.credits - 1;
          await User.updateMyUserData({ 
            credits: newCredits,
            last_credit_deduction_date: new Date().toISOString()
          });
          userData.credits = newCredits; 
          userData.last_credit_deduction_date = new Date().toISOString();
        }
      }
      
      setUser(userData);
    } catch (error) {
      console.log("User not authenticated");
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
        const currentStore = userStores[0];
        const storePlugins = await retryApiCall(() => 
          StorePlugin.filter({ 
            is_active: true, 
            store_id: currentStore.id 
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
      console.log("GTM not configured", error);
    }
  };

  const publicPages = ['Landing', 'Auth', 'Pricing', 'Onboarding'];
  const storefrontPages = ['Storefront', 'ProductDetail', 'Cart', 'Checkout', 'CustomerDashboard', 'CmsPageViewer', 'OrderSuccess', 'HtmlSitemap'];
  const isPublicPage = publicPages.includes(currentPageName);
  const isStorefrontPage = storefrontPages.includes(currentPageName);
  const isCustomerDashboard = currentPageName === 'CustomerDashboard';
  const isAdminPage = !isPublicPage && !isStorefrontPage && !isCustomerDashboard;

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
  
  // Handle admin pages
  if (isAdminPage) {
      if (!isLoading && (!user || (user.account_type !== 'agency' && user.role !== 'admin' && user.role !== 'store_owner'))) {
          const destination = user ? "CustomerDashboard" : "Landing";
          navigate(createPageUrl(destination));
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
        { name: "Categories", path: "Categories", icon: Tag },
        { name: "Products", path: "Products", icon: Package },
        { name: "Image Manager", path: "ImageManager", icon: Camera },
        { name: "Attributes", path: "Attributes", icon: SettingsIcon },
        { name: "Custom Options", path: "CustomOptionRules", icon: Plus },
        { name: "Product Tabs", path: "ProductTabs", icon: Package },
        { name: "Product Labels", path: "ProductLabels", icon: Tag },
        { name: "Stock Settings", path: "StockSettings", icon: BarChart3 },
      ]
    },
    {
      name: "Sales",
      items: [
        { name: "Orders", path: "Orders", icon: Receipt },
        { name: "Customers", path: "Customers", icon: Users },
        { name: "Tax", path: "Tax", icon: Receipt },
        { name: "Shipping Methods", path: "ShippingMethods", icon: Truck },
        { name: "Payment Methods", path: "PaymentMethods", icon: CreditCard },
        { name: "Coupons", path: "Coupons", icon: Tag },
        { name: "Delivery Settings", path: "DeliverySettings", icon: Calendar },
      ]
    },
    {
      name: "Content",
      items: [
        { name: "CMS Blocks", path: "CmsBlocks", icon: FileText },
        { name: "CMS Pages", path: "CmsPages", icon: FileText },
      ]
    },
    {
      name: "Marketing",
      items: [
        { name: "Cookie Consent", path: "CookieConsent", icon: Shield },
        { name: "Analytics", path: "AnalyticsSettings", icon: BarChart3 },
        { name: "Marketplace Export", path: "MarketplaceExport", icon: Upload },
        { name: "Customer Activity", path: "CustomerActivity", icon: BarChart3 },
      ]
    },
    {
      name: "SEO",
      items: [
        { name: "Settings", path: "SeoTools?tab=settings", icon: SettingsIcon },
        { name: "Templates", path: "SeoTools?tab=templates", icon: FileText },
        { name: "Redirects", path: "SeoTools?tab=redirects", icon: RefreshCw },
        { name: "Canonical", path: "SeoTools?tab=canonical", icon: LinkIcon },
        { name: "Hreflang", path: "SeoTools?tab=hreflang", icon: Globe },
        { name: "Robots", path: "SeoTools?tab=robots", icon: Bot },
        { name: "Social & Schema", path: "SeoTools?tab=social", icon: Share2 },
        { name: "Report", path: "SeoTools?tab=report", icon: BarChart3 },
      ]
    },
    {
      name: "Store",
      items: [
        { name: "Settings", path: "Settings", icon: SettingsIcon },
        { name: "Theme & Layout", path: "ThemeLayout", icon: Palette },
        { name: "Plugins", path: "Plugins", icon: Puzzle },
        ...(user?.account_type === 'agency' || user?.role === 'admin' || user?.role === 'store_owner' ? [
          { name: "Stores", path: "Stores", icon: Building2 },
        ] : []),
      ]
    }
  ];

  const toggleGroup = (groupName) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };
  
  const hasNoCredits = (user?.credits || 0) <= 0;
  const showWarning = hasNoCredits && user?.account_type === 'agency';


  return (
    <div className="min-h-screen bg-gray-50 flex">
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
                <DropdownMenuLabel>My Account5 - {user.role} - {user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open(createPageUrl("Storefront"), '_blank')}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>View Storefront</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(createPageUrl("Billing"))}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                    console.log('🚨🚨🚨 MOBILE LOGOUT CLICKED 🚨🚨🚨');
                    console.log('📱 Mobile logout handler triggered');
                    try {
                        console.log('📱 About to call Auth.logout()...');
                        await Auth.logout();
                        console.log('✅ Mobile logout completed, redirecting...');
                        // Add a small delay to ensure all cleanup is complete
                        setTimeout(() => {
                            console.log('📱 Mobile redirect to /auth');
                            window.location.href = '/auth';
                        }, 100);
                    } catch (error) {
                        console.error('❌ Mobile logout error:', error);
                        window.location.href = '/auth';
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

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
             <div className="text-sm text-gray-600 mt-2">
                Credits: <span className="font-bold text-gray-900">{user?.credits || 0}</span>
            </div>
          </div>

          <nav className="space-y-1">
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
                    
                    if (itemHasTab) {
                        const [basePath, query] = item.path.split('?');
                        if (currentPageName === basePath) {
                            const itemTab = new URLSearchParams(query).get('tab');
                            const currentTab = new URLSearchParams(location.search).get('tab') || 'settings'; // Default tab is settings
                            isActive = itemTab === currentTab;
                        }
                    } else {
                        // For items without tabs, check if the current page name matches the item's path (ignoring any query params on item.path)
                        isActive = currentPageName === item.path.split('?')[0];
                    }

                    let itemClass = `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`;
                    
                    if (item.path === "Billing" && showWarning) {
                        itemClass += " animate-pulse bg-red-50 text-red-700";
                    }

                    return (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.path)}
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
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open(createPageUrl("Storefront"), '_blank')}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>View Storefront</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(createPageUrl("Billing"))}>
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button
                    data-testid="logout"
                    className="w-full flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onMouseEnter={() => console.log('🐭 Desktop logout hover detected')}
                    onMouseDown={() => console.log('🖱️ Desktop logout mouse down')}
                    onMouseUp={() => console.log('🖱️ Desktop logout mouse up')}
                    onClick={async (e) => {
                      console.log('🚨🚨🚨 DESKTOP LOGOUT CLICKED 🚨🚨🚨');
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🖥️ Desktop logout handler triggered', e);
                      console.log('🔍 Event details:', {
                        type: e.type,
                        target: e.target,
                        currentTarget: e.currentTarget,
                        defaultPrevented: e.defaultPrevented
                      });
                      
                      try {
                        console.log('🖥️ About to call Auth.logout()...');
                        console.log('🚫 DISABLING ALL REDIRECTS FOR DEBUGGING');
                        
                        await Auth.logout();
                        
                        console.log('✅ Desktop logout completed!');
                        console.log('🔍 LOGOUT VERIFICATION - Final state check:');
                        console.log('- isLoggedOut:', apiClient.isLoggedOut);
                        console.log('- hasToken:', !!apiClient.token);
                        console.log('- tokenInStorage:', localStorage.getItem('auth_token'));
                        console.log('- logoutFlagInStorage:', localStorage.getItem('user_logged_out'));
                        console.log('🎉 LOGOUT PROCESS COMPLETE - NO REDIRECT FOR DEBUGGING');
                        console.log('🔧 Manual redirect: window.location.href = "/auth"');
                        
                      } catch (error) {
                        console.error('❌ Desktop logout error:', error);
                        console.error('❌ Error stack:', error.stack);
                        console.log('🔍 Error occurred, checking state anyway:');
                        console.log('- isLoggedOut:', apiClient.isLoggedOut);
                        console.log('- hasToken:', !!apiClient.token);
                        console.log('- tokenInStorage:', localStorage.getItem('auth_token'));
                        console.log('- logoutFlagInStorage:', localStorage.getItem('user_logged_out'));
                        console.log('🚫 NO REDIRECT ON ERROR FOR DEBUGGING');
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
        
        {showWarning && (
            <div className="bg-red-600 text-white text-center p-2 text-sm z-10">
                You have no credits. Your store is inactive. 
                <Link to={createPageUrl("Billing")} className="font-bold underline ml-2 hover:text-red-100">
                    Please Add Credits
                </Link>
            </div>
        )}

        <div className={`flex-1 ${showWarning ? 'opacity-50 pointer-events-none' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

