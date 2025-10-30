import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { StoreSelectionProvider } from "@/contexts/StoreSelectionContext"
import { TranslationProvider } from "@/contexts/TranslationContext"
import { AIProvider } from "@/contexts/AIContext"
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/pages/Layout'
import Auth from '@/pages/Auth'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/config/queryClient'

// Import pages - using the exports from pages/index.jsx
import * as Pages from '@/pages'

// Import plugin components
import DynamicPluginAdminPage from '@/components/plugins/DynamicPluginAdminPage'

// Import new hook-based systems
import { useEffect, useState } from 'react'
import extensionSystem from '@/core/ExtensionSystem.js'
import hookSystem from '@/core/HookSystem.js'
import eventSystem from '@/core/EventSystem.js'

// Global flag to track if plugins are ready (survives race conditions)
window.__pluginsReady = false;

// Component to wrap pages with Layout
function PageWrapper({ Component, pageName }) {
  return (
    <Layout currentPageName={pageName}>
      <Component />
    </Layout>
  );
}

// Initialize database-driven plugins
async function initializeDatabasePlugins() {
  try {

    // Fetch active plugins from database (uses normalized tables structure)
    // Add timestamp to bust cache
    // Try new endpoint first, fallback to legacy if not deployed yet
    let response = await fetch(`/api/plugins/active?_t=${Date.now()}`);

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Failed to load plugins from database:', result);
      return;
    }

    const activePlugins = result.data || [];

    // Load hooks, events AND frontend scripts for each plugin in parallel (faster!)
    // Add timeout to prevent hanging
    const loadPromise = Promise.all(
      activePlugins.map(async (plugin) => {
        await loadPluginHooksAndEvents(plugin.id);
        await loadPluginFrontendScripts(plugin.id);
      })
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Plugin loading timeout (10s)')), 10000)
    );

    await Promise.race([loadPromise, timeoutPromise]);

    // Set global flag to true so components can check it immediately
    window.__pluginsReady = true;

    // Set up pricing notifications globally
    setupGlobalPricingNotifications();

  } catch (error) {
    console.error('❌ Error initializing database plugins:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    // Continue anyway - don't block the app
  }
}

// Load hooks and events for a specific plugin
async function loadPluginHooksAndEvents(pluginId) {
  try {
    // Add timestamp to bust cache
    // Try new endpoint first, fallback to legacy if not deployed yet
    let response = await fetch(`/api/plugins/active/${pluginId}?_t=${Date.now()}`);

    const result = await response.json();

    if (result.success && result.data) {
      const plugin = result.data;

      // Register hooks from database
      if (plugin.hooks) {
        for (const hook of plugin.hooks) {
          if (hook.enabled) {
            try {
              const handlerFunction = createHandlerFromDatabaseCode(hook.handler_code);
              hookSystem.register(hook.hook_name, handlerFunction, hook.priority);
              console.log(`  ✅ Registered hook: ${hook.hook_name}`);
            } catch (error) {
              console.error(`  ❌ Failed to register hook ${hook.hook_name}:`, error.message);
              console.error(`  Code preview:`, hook.handler_code?.substring(0, 100));
              // Continue with other hooks
            }
          }
        }
      }

      // Register events from database
      if (plugin.events) {
        for (const event of plugin.events) {
          if (event.enabled) {
            try {
              const listenerFunction = createHandlerFromDatabaseCode(event.listener_code);
              eventSystem.on(event.event_name, listenerFunction);
              console.log(`  ✅ Registered event: ${event.event_name}`);
            } catch (error) {
              console.error(`  ❌ Failed to register event ${event.event_name}:`, error.message);
              console.error(`  Code preview:`, event.listener_code?.substring(0, 100));
              // Continue with other events
            }
          }
        }
      }
    } else {
      console.error(`❌ Failed to load plugin ${pluginId}:`, result);
    }
  } catch (error) {
    console.error(`❌ Error loading plugin ${pluginId}:`, error);
    console.error('Error stack:', error.stack);
    // Don't throw - continue with other plugins
  }
}

// Load frontend scripts for a specific plugin
async function loadPluginFrontendScripts(pluginId) {
  try {
    // Fetch scripts from normalized plugin_scripts table
    const response = await fetch(`/api/plugins/${pluginId}/scripts?scope=frontend&_t=${Date.now()}`);

    if (!response.ok) {
      console.warn(`  ⚠️ Failed to load scripts for ${pluginId}: ${response.status}`);
      return;
    }

    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      for (const script of result.data) {
        try {
          // Validate script content is actually JavaScript
          if (!script.content || script.content.trim().startsWith('<')) {
            console.error(`  ❌ Script ${script.name} contains HTML, not JavaScript. Skipping.`);
            continue;
          }

          // Create a script tag and inject the code
          const scriptElement = document.createElement('script');
          scriptElement.type = 'module'; // Use module to support ES6 import/export
          scriptElement.textContent = script.content;
          scriptElement.setAttribute('data-plugin-id', pluginId);
          scriptElement.setAttribute('data-script-name', script.name);

          document.head.appendChild(scriptElement);

        } catch (error) {
          console.error(`  ❌ Error executing script ${script.name}:`, error);
        }
      }
    } else {
      console.warn(`  ⚠️ No frontend scripts found for ${pluginId}`);
    }
  } catch (error) {
    console.error(`❌ Error loading frontend scripts for ${pluginId}:`, error);
    // Don't throw - continue with other plugins
  }
}

// Create executable function from database-stored code
function createHandlerFromDatabaseCode(code) {
  try {
    // Remove 'export default' if present (database may have full function declarations)
    let cleanCode = code.trim();
    if (cleanCode.startsWith('export default')) {
      cleanCode = cleanCode.replace(/^export\s+default\s+/, '');
    }

    // Remove trailing semicolon if present
    cleanCode = cleanCode.replace(/;[\s]*$/, '');

    // If it's a function declaration (named or anonymous), convert to expression
    if (cleanCode.startsWith('async function') || cleanCode.startsWith('function')) {
      cleanCode = '(' + cleanCode + ')';
    }
    // If it's already wrapped (like arrow functions with parens), no need to wrap again
    else if (!cleanCode.startsWith('(')) {
      // For arrow functions like: eventData => {...} or (eventData) => {...}
      // Wrap them to ensure they're treated as expressions
      cleanCode = '(' + cleanCode + ')';
    }

    // Use Function constructor to evaluate the function string
    const handler = new Function('return ' + cleanCode)();
    return handler;
  } catch (error) {
    console.error('❌ Error creating handler from database code:', error);
    console.error('Failed code:', code);
    return () => {
      console.warn('⚠️ Fallback handler called - original code had syntax error');
    };
  }
}

// Set up global pricing notification system (100% database-driven)
function setupGlobalPricingNotifications() {
  // Only set up if not already exists
  if (window.showPricingNotification) return;
  
  // Create notification container
  if (!document.getElementById('pricing-notifications')) {
    const container = document.createElement('div');
    container.id = 'pricing-notifications';
    container.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 300px;
    `;
    document.body.appendChild(container);
  }

  // Global notification function (called by database-driven plugin code)
  window.showPricingNotification = (options) => {
    const { message, type = 'info', discounts = [] } = options;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
      color: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer;
      animation: slideIn 0.3s ease-out;
    `;
    
    let content = `<div style="font-weight: 500; margin-bottom: 4px;">${message}</div>`;
    if (discounts.length > 0) {
      content += '<div style="font-size: 12px; opacity: 0.9;">';
      discounts.forEach(discount => {
        content += `• ${discount.description || discount.rule_name}<br>`;
      });
      content += '</div>';
    }
    
    notification.innerHTML = content;
    notification.onclick = () => notification.remove();
    
    document.getElementById('pricing-notifications').appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 5000);
  };

  // Add CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

}

function App() {
  // Initialize the new hook-based architecture
  useEffect(() => {
    const initializeExtensionSystem = async () => {
      try {
        // Load core extensions
        const extensionsToLoad = [
          // Disabled - file doesn't exist or has loading issues
          // {
          //   module: '/src/extensions/analytics-tracker.js',
          //   enabled: true,
          //   config: {
          //     customEventsEnabled: true,
          //     trackUserJourney: true,
          //     ecommerceTracking: true,
          //     debugMode: process.env.NODE_ENV === 'development'
          //   }
          // }
        ]

        // Initialize extensions (non-blocking)
        try {
          await extensionSystem.loadFromConfig(extensionsToLoad);
        } catch (extError) {
          // Extensions are optional - continue anyway
        }

        // Initialize database-driven plugins
        await initializeDatabasePlugins();

        // Emit system ready event
        eventSystem.emit('system.ready', {
          timestamp: Date.now(),
          extensionsLoaded: extensionSystem.getLoadedExtensions().length,
          hooksRegistered: Object.keys(hookSystem.getStats()).length,
          databasePluginsLoaded: true
        })

      } catch (error) {
        console.error('❌ Failed to initialize Extension System:', error);
        console.error('❌ Error stack:', error.stack);

        // Emit system error event
        eventSystem.emit('system.error', {
          error: error.message,
          timestamp: Date.now()
        })
      }
    }

    initializeExtensionSystem()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <AIProvider>
          <Router>
            <StoreSelectionProvider>
            <Routes>
          {/* Admin routes */}
          <Route path="/admin" element={<PageWrapper Component={Pages.Dashboard} pageName="Dashboard" />} />
          <Route path="/admin/dashboard" element={<PageWrapper Component={Pages.Dashboard} pageName="Dashboard" />} />
          <Route path="/admin/categories" element={<PageWrapper Component={Pages.Categories} pageName="CATEGORIES" />} />
          <Route path="/admin/products" element={<PageWrapper Component={Pages.Products} pageName="PRODUCTS" />} />
          <Route path="/admin/attributes" element={<PageWrapper Component={Pages.Attributes} pageName="ATTRIBUTES" />} />
          <Route path="/admin/custom-option-rules" element={<PageWrapper Component={Pages.CustomOptionRules} pageName="CUSTOM_OPTION_RULES" />} />
          <Route path="/admin/product-tabs" element={<PageWrapper Component={Pages.ProductTabs} pageName="PRODUCT_TABS" />} />
          <Route path="/admin/product-labels" element={<PageWrapper Component={Pages.ProductLabels} pageName="PRODUCT_LABELS" />} />
          <Route path="/admin/stock-settings" element={<PageWrapper Component={Pages.StockSettings} pageName="STOCK_SETTINGS" />} />
          <Route path="/admin/cache" element={<PageWrapper Component={Pages.Cache} pageName="CACHE" />} />
          <Route path="/admin/orders" element={<PageWrapper Component={Pages.Orders} pageName="ORDERS" />} />
          <Route path="/admin/customers" element={<PageWrapper Component={Pages.Customers} pageName="CUSTOMERS" />} />
          <Route path="/admin/tax" element={<PageWrapper Component={Pages.Tax} pageName="TAX" />} />
          <Route path="/admin/shipping-methods" element={<PageWrapper Component={Pages.ShippingMethods} pageName="SHIPPING_METHODS" />} />
          <Route path="/admin/payment-methods" element={<PageWrapper Component={Pages.PaymentMethods} pageName="PAYMENT_METHODS" />} />
          <Route path="/admin/coupons" element={<PageWrapper Component={Pages.Coupons} pageName="COUPONS" />} />
          <Route path="/admin/delivery-settings" element={<PageWrapper Component={Pages.DeliverySettings} pageName="DELIVERY_SETTINGS" />} />
          <Route path="/admin/cms-blocks" element={<PageWrapper Component={Pages.CmsBlocks} pageName="CMS_BLOCKS" />} />
          <Route path="/admin/cms-pages" element={<PageWrapper Component={Pages.CmsPages} pageName="CMS_PAGES" />} />
          <Route path="/admin/file-library" element={<PageWrapper Component={Pages.FileLibrary} pageName="file-library" />} />
          <Route path="/admin/cookie-consent" element={<PageWrapper Component={Pages.CookieConsent} pageName="COOKIE_CONSENT" />} />
          <Route path="/admin/analytics" element={<PageWrapper Component={Pages.AnalyticsSettings} pageName="ANALYTICS" />} />
          <Route path="/admin/analytics-settings" element={<PageWrapper Component={Pages.AnalyticsSettings} pageName="ANALYTICS" />} />
          <Route path="/admin/heatmaps" element={<PageWrapper Component={Pages.HeatmapAnalytics} pageName="HEATMAPS" />} />
          <Route path="/admin/heatmap-analytics" element={<PageWrapper Component={Pages.HeatmapAnalytics} pageName="HEATMAPS" />} />
          <Route path="/admin/ab-testing" element={<PageWrapper Component={Pages.ABTesting} pageName="ABTESTING" />} />
          <Route path="/admin/customer-activity" element={<PageWrapper Component={Pages.CustomerActivity} pageName="CUSTOMER_ACTIVITY" />} />
          <Route path="/admin/seo-tools/settings" element={<PageWrapper Component={Pages.SeoSettings} pageName="seo-tools/settings" />} />
          <Route path="/admin/seo-tools/templates" element={<PageWrapper Component={Pages.SeoTemplates} pageName="seo-tools/templates" />} />
          <Route path="/admin/seo-tools/redirects" element={<PageWrapper Component={Pages.SeoRedirects} pageName="seo-tools/redirects" />} />
          <Route path="/admin/seo-tools/canonical" element={<PageWrapper Component={Pages.SeoCanonical} pageName="seo-tools/canonical" />} />
          <Route path="/admin/seo-tools/hreflang" element={<PageWrapper Component={Pages.SeoHreflang} pageName="seo-tools/hreflang" />} />
          <Route path="/admin/seo-tools/robots" element={<PageWrapper Component={Pages.SeoRobots} pageName="seo-tools/robots" />} />
          <Route path="/admin/seo-tools/social" element={<PageWrapper Component={Pages.SeoSocial} pageName="seo-tools/social" />} />
          <Route path="/admin/seo-tools/report" element={<PageWrapper Component={Pages.SeoReport} pageName="seo-tools/report" />} />
          <Route path="/admin/xml-sitemap" element={<PageWrapper Component={Pages.XmlSitemap} pageName="XmlSitemap" />} />
          <Route path="/admin/robots-txt" element={<PageWrapper Component={Pages.RobotsTxt} pageName="RobotsTxt" />} />
          <Route path="/admin/html-sitemap" element={<PageWrapper Component={Pages.HtmlSitemap} pageName="HtmlSitemap" />} />
          <Route path="/admin/akeneo-integration" element={<PageWrapper Component={Pages.AkeneoIntegration} pageName="akeneo-integration" />} />
          <Route path="/admin/marketplace-export" element={<PageWrapper Component={Pages.MarketplaceExport} pageName="MARKETPLACE_EXPORT" />} />
          <Route path="/admin/ecommerce-integrations" element={<PageWrapper Component={Pages.EcommerceIntegrations} pageName="ecommerce-integrations" />} />
          <Route path="/admin/crm-integrations" element={<PageWrapper Component={Pages.CRMIntegrations} pageName="crm-integrations" />} />
          <Route path="/admin/shopify-integration" element={<PageWrapper Component={Pages.ShopifyIntegration} pageName="ShopifyIntegration" />} />
          <Route path="/admin/settings" element={<PageWrapper Component={Pages.Settings} pageName="SETTINGS" />} />
          <Route path="/admin/navigation-manager" element={<PageWrapper Component={Pages.NavigationManager} pageName="NAVIGATION_MANAGER" />} />
          <Route path="/admin/theme-layout" element={<PageWrapper Component={Pages.ThemeLayout} pageName="THEME_LAYOUT" />} />
          <Route path="/admin/media-storage" element={<PageWrapper Component={Pages.MediaStorage} pageName="media-storage" />} />
          <Route path="/admin/custom-domains" element={<PageWrapper Component={Pages.CustomDomains} pageName="custom-domains" />} />
          <Route path="/admin/database-integrations" element={<PageWrapper Component={Pages.DatabaseIntegrations} pageName="database-integrations" />} />
          <Route path="/admin/stores" element={<PageWrapper Component={Pages.Stores} pageName="STORES" />} />
          <Route path="/admin/monitoring-dashboard" element={<PageWrapper Component={Pages.MonitoringDashboard} pageName="monitoring-dashboard" />} />
          <Route path="/admin/scheduled-jobs" element={<PageWrapper Component={Pages.ScheduledJobs} pageName="scheduled-jobs" />} />
          <Route path="/admin/billing" element={<PageWrapper Component={Pages.Billing} pageName="Billing" />} />
          <Route path="/admin/team" element={<PageWrapper Component={Pages.TeamPage} pageName="TeamPage" />} />
          <Route path="/admin/onboarding" element={<PageWrapper Component={Pages.Onboarding} pageName="Onboarding" />} />
          <Route path="/admin/ai-context-window" element={<PageWrapper Component={Pages.AIContextWindow} pageName="AIContextWindow" />} />
          <Route path="/admin/translations" element={<PageWrapper Component={Pages.Translations} pageName="Translations" />} />
          <Route path="/admin/ai-studio" element={<PageWrapper Component={Pages.AIStudio} pageName="AIStudio" />} />
          <Route path="/admin/auth" element={<PageWrapper Component={Auth} pageName="Auth" />} />

          {/* Plugins Section - New unified AI Studio integrated */}
          <Route path="/plugins" element={<PageWrapper Component={Pages.Plugins} pageName="Plugins" />} />
          <Route path="/plugins/*" element={<PageWrapper Component={Pages.Plugins} pageName="Plugins" />} />
          <Route path="/admin/plugins" element={<PageWrapper Component={Pages.Plugins} pageName="Plugins" />} />

          {/* Dynamic Plugin Admin Pages - 100% database-driven from plugin_admin_pages */}
          <Route path="/admin/plugins/:pluginSlug/:pageKey" element={<PageWrapper Component={DynamicPluginAdminPage} pageName="Plugin Admin Page" />} />
          
          {/* Editor routes */}
          <Route path="/editor" element={<Navigate to="/editor/ai-context-window" replace />} />
          <Route path="/editor/ai-context" element={<PageWrapper Component={Pages.AIContextWindow} pageName="AIContextWindow" />} />
          <Route path="/editor/header" element={<PageWrapper Component={Pages.HeaderSlotsEditor} pageName="HeaderSlotsEditor" />} />
          <Route path="/editor/product" element={<PageWrapper Component={Pages.ProductSlotsEditor} pageName="ProductSlotsEditor" />} />
          <Route path="/editor/category" element={<PageWrapper Component={Pages.CategorySlotsEditor} pageName="CategorySlotsEditor" />} />
          <Route path="/editor/cart" element={<PageWrapper Component={Pages.CartSlotsEditor} pageName="CartSlotsEditor" />} />
          
          {/* Public/Storefront routes with store code and dynamic parameters */}
          <Route path="/public/:storeCode/robots.txt" element={<Pages.RobotsTxtHandler />} />
          <Route path="/public/:storeCode/category/*" element={<PageWrapper Component={Pages.Category} pageName="Category" />} />
          <Route path="/public/:storeCode/product/:productSlug" element={<PageWrapper Component={Pages.ProductDetail} pageName="ProductDetail" />} />
          <Route path="/public/:storeCode/cart" element={<PageWrapper Component={Pages.Cart} pageName="Cart" />} />
          <Route path="/public/:storeCode/checkout" element={<PageWrapper Component={Pages.Checkout} pageName="Checkout" />} />
          <Route path="/public/:storeCode/order-success" element={<PageWrapper Component={Pages.OrderSuccess} pageName="OrderSuccess" />} />
          <Route path="/public/:storeCode/order-cancel" element={<PageWrapper Component={Pages.OrderCancel} pageName="OrderCancel" />} />
          <Route path="/public/:storeCode/login" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
          <Route path="/public/:storeCode/customer-auth" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
          <Route path="/public/:storeCode/account" element={<PageWrapper Component={Pages.CustomerDashboard} pageName="CustomerDashboard" />} />
          <Route path="/public/:storeCode/customer-dashboard" element={<PageWrapper Component={Pages.CustomerDashboard} pageName="CustomerDashboard" />} />
          <Route path="/public/:storeCode/client-dashboard" element={<PageWrapper Component={Pages.ClientDashboard} pageName="ClientDashboard" />} />
          <Route path="/public/:storeCode/cms-page/:pageSlug" element={<PageWrapper Component={Pages.CmsPageViewer} pageName="CmsPageViewer" />} />
          <Route path="/public/:storeCode/sitemap" element={<PageWrapper Component={Pages.SitemapPublic} pageName="SitemapPublic" />} />
          <Route path="/public/:storeCode" element={<PageWrapper Component={Pages.Storefront} pageName="Storefront" />} />
          <Route path="/landing" element={<PageWrapper Component={Pages.Landing} pageName="Landing" />} />
          
          {/* Special routes */}
          <Route path="/robots.txt" element={<PageWrapper Component={Pages.RobotsPublic} pageName="RobotsPublic" />} />
          <Route path="/cookie-consent" element={<PageWrapper Component={Pages.CookieConsent} pageName="CookieConsent" />} />
          
          {/* Homepage */}
          <Route path="/" element={<PageWrapper Component={Pages.Storefront} pageName="Storefront" />} />

          {/* Catch all - show 404 page */}
          <Route path="*" element={<PageWrapper Component={Pages.NotFound} pageName="NotFound" />} />
            </Routes>
            <Toaster />
          </StoreSelectionProvider>
        </Router>
      </AIProvider>
    </TranslationProvider>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App