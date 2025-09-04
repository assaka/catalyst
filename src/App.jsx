import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { StoreSelectionProvider } from "@/contexts/StoreSelectionContext"
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Layout from '@/pages/Layout'
import Auth from '@/pages/Auth'

// Import pages - using the exports from pages/index.jsx
import * as Pages from '@/pages'

// Import new hook-based systems
import { useEffect } from 'react'
import extensionSystem from '@/core/ExtensionSystem.js'
import hookSystem from '@/core/HookSystem.js'
import eventSystem from '@/core/EventSystem.js'

// Component to wrap pages with Layout
function PageWrapper({ Component, pageName }) {
  return (
    <Layout currentPageName={pageName}>
      <Component />
    </Layout>
  );
}

// Component to handle routing logic
function AppRoutes() {
  const location = useLocation();
  
  // Determine which page to render based on the URL
  const getPageComponent = () => {
    const path = location.pathname;
    
    // Admin routes
    if (path.startsWith('/admin')) {
      // Dashboard
      if (path === '/admin' || path === '/admin/dashboard') return { Component: Pages.Dashboard, name: 'Dashboard' };
      
      // Catalog
      if (path === '/admin/categories') return { Component: Pages.Categories, name: 'Categories' };
      if (path === '/admin/products') return { Component: Pages.Products, name: 'Products' };
      if (path === '/admin/attributes') return { Component: Pages.Attributes, name: 'Attributes' };
      if (path === '/admin/custom-option-rules') return { Component: Pages.CustomOptionRules, name: 'CustomOptionRules' };
      if (path === '/admin/product-tabs') return { Component: Pages.ProductTabs, name: 'ProductTabs' };
      if (path === '/admin/product-labels') return { Component: Pages.ProductLabels, name: 'ProductLabels' };
      if (path === '/admin/stock-settings') return { Component: Pages.StockSettings, name: 'StockSettings' };
      
      // Sales
      if (path === '/admin/orders') return { Component: Pages.Orders, name: 'Orders' };
      if (path === '/admin/customers') return { Component: Pages.Customers, name: 'Customers' };
      if (path === '/admin/tax') return { Component: Pages.Tax, name: 'Tax' };
      if (path === '/admin/shipping-methods') return { Component: Pages.ShippingMethods, name: 'ShippingMethods' };
      if (path === '/admin/payment-methods') return { Component: Pages.PaymentMethods, name: 'PaymentMethods' };
      if (path === '/admin/coupons') return { Component: Pages.Coupons, name: 'Coupons' };
      if (path === '/admin/delivery-settings') return { Component: Pages.DeliverySettings, name: 'DeliverySettings' };
      
      // Content
      if (path === '/admin/cms-blocks') return { Component: Pages.CmsBlocks, name: 'CmsBlocks' };
      if (path === '/admin/cms-pages') return { Component: Pages.CmsPages, name: 'CmsPages' };
      if (path === '/admin/file-library') return { Component: Pages.FileLibrary, name: 'FileLibrary' };
      if (path === '/admin/file-manager') return { Component: Pages.FileManager, name: 'FileManager' };
      
      // Marketing
      if (path === '/admin/cookie-consent') return { Component: Pages.CookieConsent, name: 'CookieConsent' };
      if (path === '/admin/analytics' || path === '/admin/analytics-settings') return { Component: Pages.AnalyticsSettings, name: 'AnalyticsSettings' };
      if (path === '/admin/heatmaps' || path === '/admin/heatmap-analytics') return { Component: Pages.HeatmapAnalytics, name: 'HeatmapAnalytics' };
      if (path === '/admin/ab-testing') return { Component: Pages.ABTesting, name: 'ABTesting' };
      if (path === '/admin/customer-activity') return { Component: Pages.CustomerActivity, name: 'CustomerActivity' };
      
      // SEO
      if (path === '/admin/seo-tools' || path.startsWith('/admin/seo-tools')) return { Component: Pages.SeoTools, name: 'SeoTools' };
      if (path === '/admin/xml-sitemap') return { Component: Pages.XmlSitemap, name: 'XmlSitemap' };
      if (path === '/admin/robots-txt') return { Component: Pages.RobotsTxt, name: 'RobotsTxt' };
      if (path === '/admin/html-sitemap') return { Component: Pages.HtmlSitemap, name: 'HtmlSitemap' };
      if (path === '/admin/google-tag-manager') return { Component: Pages.GoogleTagManager, name: 'GoogleTagManager' };
      
      // Plugins
      if (path === '/admin/plugins') return { Component: Pages.Plugins, name: 'Plugins' };
      if (path === '/admin/plugin-builder') return { Component: Pages.PluginBuilder, name: 'PluginBuilder' };
      if (path === '/admin/plugin-builder-complete') return { Component: Pages.PluginBuilderComplete, name: 'PluginBuilderComplete' };
      if (path === '/admin/plugin-how-to') return { Component: Pages.PluginHowToFixed, name: 'PluginHowToFixed' };
      
      // Import & Export
      if (path === '/admin/akeneo-integration') return { Component: Pages.AkeneoIntegration, name: 'AkeneoIntegration' };
      if (path === '/admin/marketplace-export') return { Component: Pages.MarketplaceExport, name: 'MarketplaceExport' };
      if (path === '/admin/ecommerce-integrations') return { Component: Pages.EcommerceIntegrations, name: 'EcommerceIntegrations' };
      if (path === '/admin/crm-integrations') return { Component: Pages.CRMIntegrations, name: 'CRMIntegrations' };
      if (path === '/admin/shopify-integration') return { Component: Pages.ShopifyIntegration, name: 'ShopifyIntegration' };
      
      // Store
      if (path === '/admin/settings') return { Component: Pages.Settings, name: 'Settings' };
      if (path === '/admin/theme-layout') return { Component: Pages.ThemeLayout, name: 'ThemeLayout' };
      if (path === '/admin/media-storage') return { Component: Pages.MediaStorage, name: 'MediaStorage' };
      if (path === '/admin/database-integrations') return { Component: Pages.DatabaseIntegrations, name: 'DatabaseIntegrations' };
      if (path === '/admin/render-integration') return { Component: Pages.RenderIntegration, name: 'RenderIntegration' };
      if (path === '/admin/stores') return { Component: Pages.Stores, name: 'Stores' };
      if (path === '/admin/supabase') return { Component: Pages.SupabasePage, name: 'SupabasePage' };
      if (path === '/admin/integrations') return { Component: Pages.Integrations, name: 'Integrations' };
      
      // Advanced
      if (path === '/admin/monitoring-dashboard') return { Component: Pages.MonitoringDashboard, name: 'MonitoringDashboard' };
      if (path === '/admin/scheduled-jobs') return { Component: Pages.ScheduledJobs, name: 'ScheduledJobs' };
      
      // Other Admin Pages
      if (path === '/admin/billing') return { Component: Pages.Billing, name: 'Billing' };
      if (path === '/admin/team') return { Component: Pages.TeamPage, name: 'TeamPage' };
      if (path === '/admin/onboarding') return { Component: Pages.Onboarding, name: 'Onboarding' };
      
      // Editor/AI Pages
      if (path === '/admin/ai-context-window' || path === '/editor/ai-context-window') return { Component: Pages.AIContextWindow, name: 'AIContextWindow' };
      if (path === '/admin/cart-slots-editor' || path === '/editor/cart-slots-editor') return { Component: Pages.CartSlotsEditor, name: 'CartSlotsEditor' };
      
      // Auth
      if (path === '/admin/auth') return { Component: Auth, name: 'Auth' };
    }
    
    // Public/Storefront routes
    if (path === '/' || path.startsWith('/public')) {
      if (path.includes('/product/')) return { Component: Pages.ProductDetail, name: 'ProductDetail' };
      if (path.includes('/cart')) return { Component: Pages.Cart, name: 'Cart' };
      if (path.includes('/checkout')) return { Component: Pages.Checkout, name: 'Checkout' };
      if (path.includes('/order-success')) return { Component: Pages.OrderSuccess, name: 'OrderSuccess' };
      if (path.includes('/order-cancel')) return { Component: Pages.OrderCancel, name: 'OrderCancel' };
      if (path.includes('/login') || path.includes('/customer-auth')) return { Component: Pages.CustomerAuth, name: 'CustomerAuth' };
      if (path.includes('/account') || path.includes('/customer-dashboard')) return { Component: Pages.CustomerDashboard, name: 'CustomerDashboard' };
      if (path.includes('/client-dashboard')) return { Component: Pages.ClientDashboard, name: 'ClientDashboard' };
      if (path.includes('/cms-page')) return { Component: Pages.CmsPageViewer, name: 'CmsPageViewer' };
      if (path.includes('/landing')) return { Component: Pages.Landing, name: 'Landing' };
      return { Component: Pages.Storefront, name: 'Storefront' };
    }
    
    // Special routes
    if (path === '/robots.txt') return { Component: Pages.RobotsPublic, name: 'RobotsPublic' };
    if (path === '/cookie-consent') return { Component: Pages.CookieConsent, name: 'CookieConsent' };
    
    // Default to Dashboard
    return { Component: Pages.Dashboard, name: 'Dashboard' };
  };
  
  const { Component, name } = getPageComponent();
  
  return <PageWrapper Component={Component} pageName={name} />;
}

function App() {
  // Initialize the new hook-based architecture
  useEffect(() => {
    const initializeExtensionSystem = async () => {
      console.log('🚀 Initializing Extension System...')
      
      try {
        // Load core extensions
        const extensionsToLoad = [
          {
            module: '/src/extensions/custom-pricing.js',
            enabled: true,
            config: {
              volumeDiscountEnabled: true,
              loyaltyDiscountEnabled: true,
              minimumOrderForDiscount: 100
            }
          },
          {
            module: '/src/extensions/analytics-tracker.js', 
            enabled: true,
            config: {
              customEventsEnabled: true,
              trackUserJourney: true,
              ecommerceTracking: true,
              debugMode: process.env.NODE_ENV === 'development'
            }
          }
        ]

        // Initialize extensions
        await extensionSystem.loadFromConfig(extensionsToLoad)
        
        console.log('✅ Extension System initialized successfully')
        
        // Emit system ready event
        eventSystem.emit('system.ready', {
          timestamp: Date.now(),
          extensionsLoaded: extensionSystem.getLoadedExtensions().length,
          hooksRegistered: Object.keys(hookSystem.getStats()).length
        })

      } catch (error) {
        console.error('❌ Failed to initialize Extension System:', error)
        
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
    <StoreSelectionProvider>
      <Router>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Router>
      <Toaster />
    </StoreSelectionProvider>
  )
}

export default App