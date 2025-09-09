import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { StoreSelectionProvider } from "@/contexts/StoreSelectionContext"
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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

function App() {
  // Initialize the new hook-based architecture
  useEffect(() => {
    const initializeExtensionSystem = async () => {
      console.log('🚀 Initializing Extension System...')
      
      try {
        // Load core extensions
        const extensionsToLoad = [
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
          <Route path="/admin/file-manager" element={<PageWrapper Component={Pages.FileManager} pageName="FileManager" />} />
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
          <Route path="/admin/google-tag-manager" element={<PageWrapper Component={Pages.GoogleTagManager} pageName="GoogleTagManager" />} />
          <Route path="/admin/akeneo-integration" element={<PageWrapper Component={Pages.AkeneoIntegration} pageName="akeneo-integration" />} />
          <Route path="/admin/marketplace-export" element={<PageWrapper Component={Pages.MarketplaceExport} pageName="MARKETPLACE_EXPORT" />} />
          <Route path="/admin/ecommerce-integrations" element={<PageWrapper Component={Pages.EcommerceIntegrations} pageName="ecommerce-integrations" />} />
          <Route path="/admin/crm-integrations" element={<PageWrapper Component={Pages.CRMIntegrations} pageName="crm-integrations" />} />
          <Route path="/admin/shopify-integration" element={<PageWrapper Component={Pages.ShopifyIntegration} pageName="ShopifyIntegration" />} />
          <Route path="/admin/settings" element={<PageWrapper Component={Pages.Settings} pageName="SETTINGS" />} />
          <Route path="/admin/theme-layout" element={<PageWrapper Component={Pages.ThemeLayout} pageName="THEME_LAYOUT" />} />
          <Route path="/admin/media-storage" element={<PageWrapper Component={Pages.MediaStorage} pageName="media-storage" />} />
          <Route path="/admin/database-integrations" element={<PageWrapper Component={Pages.DatabaseIntegrations} pageName="database-integrations" />} />
          <Route path="/admin/render-integration" element={<PageWrapper Component={Pages.RenderIntegration} pageName="render-integration" />} />
          <Route path="/admin/stores" element={<PageWrapper Component={Pages.Stores} pageName="STORES" />} />
          <Route path="/admin/supabase" element={<PageWrapper Component={Pages.SupabasePage} pageName="SupabasePage" />} />
          <Route path="/admin/integrations" element={<PageWrapper Component={Pages.Integrations} pageName="Integrations" />} />
          <Route path="/admin/monitoring-dashboard" element={<PageWrapper Component={Pages.MonitoringDashboard} pageName="monitoring-dashboard" />} />
          <Route path="/admin/scheduled-jobs" element={<PageWrapper Component={Pages.ScheduledJobs} pageName="scheduled-jobs" />} />
          <Route path="/admin/billing" element={<PageWrapper Component={Pages.Billing} pageName="Billing" />} />
          <Route path="/admin/team" element={<PageWrapper Component={Pages.TeamPage} pageName="TeamPage" />} />
          <Route path="/admin/onboarding" element={<PageWrapper Component={Pages.Onboarding} pageName="Onboarding" />} />
          <Route path="/admin/ai-context-window" element={<PageWrapper Component={Pages.AIContextWindow} pageName="AIContextWindow" />} />
          <Route path="/admin/auth" element={<PageWrapper Component={Auth} pageName="Auth" />} />
          
          {/* Unified Plugins Section - Independent from Admin */}
          <Route path="/plugins" element={<PageWrapper Component={Pages.UnifiedPluginManager} pageName="Plugins" />} />
          <Route path="/plugins/*" element={<PageWrapper Component={Pages.UnifiedPluginManager} pageName="Plugins" />} />
          
          {/* Editor routes */}
          <Route path="/editor" element={<Navigate to="/editor/ai-context-window" replace />} />
          <Route path="/editor/ai-context" element={<PageWrapper Component={Pages.AIContextWindow} pageName="AIContextWindow" />} />
          
          {/* Public/Storefront routes with store code and dynamic parameters */}
          <Route path="/public/:storeCode/category/:categorySlug" element={<PageWrapper Component={Pages.Category} pageName="Category" />} />
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
          <Route path="/public/:storeCode" element={<PageWrapper Component={Pages.Storefront} pageName="Storefront" />} />
          <Route path="/landing" element={<PageWrapper Component={Pages.Landing} pageName="Landing" />} />
          
          {/* Special routes */}
          <Route path="/robots.txt" element={<PageWrapper Component={Pages.RobotsPublic} pageName="RobotsPublic" />} />
          <Route path="/cookie-consent" element={<PageWrapper Component={Pages.CookieConsent} pageName="CookieConsent" />} />
          
          {/* Homepage */}
          <Route path="/" element={<PageWrapper Component={Pages.Storefront} pageName="Storefront" />} />
          
          {/* Catch all - redirect to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </StoreSelectionProvider>
  )
}

export default App