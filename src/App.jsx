import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { StoreSelectionProvider } from "@/contexts/StoreSelectionContext"
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
import { AdminLayoutWrapper } from '@/components/admin/AdminLayoutWrapper'

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
    <AdminLayoutWrapper>
      <Layout currentPageName={pageName}>
        <Component />
      </Layout>
    </AdminLayoutWrapper>
  );
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
          <Route path="/admin/storefronts" element={<PageWrapper Component={Pages.Storefronts} pageName="STOREFRONTS" />} />
          <Route path="/admin/stock-settings" element={<PageWrapper Component={Pages.StockSettings} pageName="STOCK_SETTINGS" />} />
          <Route path="/admin/cache" element={<PageWrapper Component={Pages.Cache} pageName="CACHE" />} />
          <Route path="/admin/orders" element={<PageWrapper Component={Pages.Orders} pageName="ORDERS" />} />
          <Route path="/admin/sales-settings" element={<PageWrapper Component={Pages.SalesSettings} pageName="SALES_SETTINGS" />} />
          <Route path="/admin/customers" element={<PageWrapper Component={Pages.Customers} pageName="CUSTOMERS" />} />
          <Route path="/admin/blacklist" element={<PageWrapper Component={Pages.Blacklist} pageName="BLACKLIST" />} />
          <Route path="/admin/tax" element={<PageWrapper Component={Pages.Tax} pageName="TAX" />} />
          <Route path="/admin/shipping-methods" element={<PageWrapper Component={Pages.ShippingMethods} pageName="SHIPPING_METHODS" />} />
          <Route path="/admin/payment-methods" element={<PageWrapper Component={Pages.PaymentMethods} pageName="PAYMENT_METHODS" />} />
          <Route path="/admin/coupons" element={<PageWrapper Component={Pages.Coupons} pageName="COUPONS" />} />
          <Route path="/admin/delivery-settings" element={<PageWrapper Component={Pages.DeliverySettings} pageName="DELIVERY_SETTINGS" />} />
          <Route path="/admin/cms-blocks" element={<PageWrapper Component={Pages.CmsBlocks} pageName="CMS_BLOCKS" />} />
          <Route path="/admin/cms-pages" element={<PageWrapper Component={Pages.CmsPages} pageName="CMS_PAGES" />} />
          <Route path="/admin/emails" element={<PageWrapper Component={Pages.Emails} pageName="EMAILS" />} />
          <Route path="/admin/settings/email" element={<PageWrapper Component={Pages.EmailSettings} pageName="EMAIL_SETTINGS" />} />
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
          <Route path="/admin/marketplace-hub" element={<PageWrapper Component={Pages.MarketplaceHub} pageName="MARKETPLACE_HUB" />} />
          <Route path="/admin/background-jobs" element={<PageWrapper Component={Pages.BackgroundJobs} pageName="BACKGROUND_JOBS" />} />
          <Route path="/admin/job-scheduler" element={<PageWrapper Component={Pages.JobScheduler} pageName="JOB_SCHEDULER" />} />
          <Route path="/admin/import-export-jobs" element={<PageWrapper Component={Pages.ImportExportJobs} pageName="IMPORT_EXPORT_JOBS" />} />
          <Route path="/admin/shopify-integration" element={<PageWrapper Component={Pages.ShopifyIntegration} pageName="ShopifyIntegration" />} />
          <Route path="/admin/settings" element={<PageWrapper Component={Pages.Settings} pageName="SETTINGS" />} />
          <Route path="/admin/navigation-manager" element={<PageWrapper Component={Pages.NavigationManager} pageName="NAVIGATION_MANAGER" />} />
          <Route path="/admin/theme-layout" element={<PageWrapper Component={Pages.ThemeLayout} pageName="THEME_LAYOUT" />} />
          <Route path="/admin/media-storage" element={<PageWrapper Component={Pages.MediaStorage} pageName="media-storage" />} />
          <Route path="/admin/custom-domains" element={<PageWrapper Component={Pages.CustomDomains} pageName="custom-domains" />} />
          <Route path="/admin/database-integrations" element={<PageWrapper Component={Pages.DatabaseIntegrations} pageName="database-integrations" />} />
          <Route path="/admin/stores" element={<PageWrapper Component={Pages.Stores} pageName="STORES" />} />
          <Route path="/admin/billing" element={<PageWrapper Component={Pages.Billing} pageName="Billing" />} />
          <Route path="/admin/uptime-report" element={<PageWrapper Component={Pages.UptimeReport} pageName="UptimeReport" />} />
          <Route path="/admin/team" element={<PageWrapper Component={Pages.TeamPage} pageName="TeamPage" />} />
          <Route path="/admin/store-onboarding" element={<PageWrapper Component={Pages.StoreOnboarding} pageName="StoreOnboarding" />} />
          <Route path="/admin/ai-context-window" element={<PageWrapper Component={Pages.AIContextWindow} pageName="AIContextWindow" />} />
          <Route path="/admin/translations" element={<PageWrapper Component={Pages.Translations} pageName="Translations" />} />
          <Route path="/admin/auth" element={<PageWrapper Component={Auth} pageName="Auth" />} />

          {/* Plugins Section */}
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

          {/* AI Workspace - Unified Editor + AI */}
          <Route path="/ai-workspace" element={<PageWrapper Component={Pages.AIWorkspace} pageName="AIWorkspace" />} />

          {/* Custom Domain Routes (when accessed via custom domain like www.myshop.com) */}
          {/* These routes match when NOT on platform domains (vercel.app, localhost, etc.) */}
          {!window.location.hostname.includes('vercel.app') &&
           !window.location.hostname.includes('onrender.com') &&
           !window.location.hostname.includes('localhost') &&
           !window.location.hostname.includes('127.0.0.1') && (
            <>
              <Route path="/category/*" element={<PageWrapper Component={Pages.Category} pageName="Category" />} />
              <Route path="/product/:productSlug" element={<PageWrapper Component={Pages.ProductDetail} pageName="ProductDetail" />} />
              <Route path="/cart" element={<PageWrapper Component={Pages.Cart} pageName="Cart" />} />
              <Route path="/checkout" element={<PageWrapper Component={Pages.Checkout} pageName="Checkout" />} />
              <Route path="/order-success" element={<PageWrapper Component={Pages.OrderSuccess} pageName="OrderSuccess" />} />
              <Route path="/order-cancel" element={<PageWrapper Component={Pages.OrderCancel} pageName="OrderCancel" />} />
              <Route path="/login" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
              <Route path="/register" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
              <Route path="/forgot-password" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
              <Route path="/reset-password" element={<PageWrapper Component={Pages.ResetPassword} pageName="ResetPassword" />} />
              <Route path="/account" element={<PageWrapper Component={Pages.CustomerDashboard} pageName="CustomerDashboard" />} />
              <Route path="/cms-page/:pageSlug" element={<PageWrapper Component={Pages.CmsPageViewer} pageName="CmsPageViewer" />} />
              <Route path="/sitemap" element={<PageWrapper Component={Pages.SitemapPublic} pageName="SitemapPublic" />} />
              <Route path="/robots.txt" element={<Pages.RobotsPublic />} />
            </>
          )}

          {/* Public/Storefront routes with store code and dynamic parameters */}
          <Route path="/public/:storeCode/robots.txt" element={<Pages.RobotsTxtHandler />} />
          <Route path="/public/:storeCode/category/*" element={<PageWrapper Component={Pages.Category} pageName="Category" />} />
          <Route path="/public/:storeCode/product/:productSlug" element={<PageWrapper Component={Pages.ProductDetail} pageName="ProductDetail" />} />
          <Route path="/public/:storeCode/cart" element={<PageWrapper Component={Pages.Cart} pageName="Cart" />} />
          <Route path="/public/:storeCode/checkout" element={<PageWrapper Component={Pages.Checkout} pageName="Checkout" />} />
          <Route path="/public/:storeCode/order-success" element={<PageWrapper Component={Pages.OrderSuccess} pageName="OrderSuccess" />} />
          <Route path="/public/:storeCode/order-cancel" element={<PageWrapper Component={Pages.OrderCancel} pageName="OrderCancel" />} />
          <Route path="/public/:storeCode/login" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
          <Route path="/public/:storeCode/register" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
          <Route path="/public/:storeCode/forgot-password" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
          <Route path="/public/:storeCode/reset-password" element={<PageWrapper Component={Pages.ResetPassword} pageName="ResetPassword" />} />
          <Route path="/public/:storeCode/customer-auth" element={<PageWrapper Component={Pages.CustomerAuth} pageName="CustomerAuth" />} />
          <Route path="/public/:storeCode/verify-email" element={<PageWrapper Component={Pages.EmailVerification} pageName="EmailVerification" />} />
          <Route path="/public/:storeCode/account" element={<PageWrapper Component={Pages.CustomerDashboard} pageName="CustomerDashboard" />} />
          <Route path="/public/:storeCode/customer-dashboard" element={<PageWrapper Component={Pages.CustomerDashboard} pageName="CustomerDashboard" />} />
          <Route path="/public/:storeCode/cms-page/:pageSlug" element={<PageWrapper Component={Pages.CmsPageViewer} pageName="CmsPageViewer" />} />
          <Route path="/public/:storeCode/sitemap" element={<PageWrapper Component={Pages.SitemapPublic} pageName="SitemapPublic" />} />
          <Route path="/public/:storeCode" element={<PageWrapper Component={Pages.Storefront} pageName="Storefront" />} />
          <Route path="/landing" element={<PageWrapper Component={Pages.Landing} pageName="Landing" />} />
          
          {/* Special routes */}
          <Route path="/robots.txt" element={<PageWrapper Component={Pages.RobotsPublic} pageName="RobotsPublic" />} />
          <Route path="/cookie-consent" element={<PageWrapper Component={Pages.CookieConsent} pageName="CookieConsent" />} />
          
          {/* Auth route - redirect to admin auth */}
          <Route path="/auth" element={<Navigate to="/admin/auth" replace />} />

          {/* Team Invitation */}
          <Route path="/accept-invitation/:token" element={<Pages.AcceptInvitation />} />

          {/* Homepage */}
          <Route path="/" element={<PageWrapper Component={Pages.Storefront} pageName="Storefront" />} />

          {/* Catch all - show 404 page */}
          <Route path="*" element={<PageWrapper Component={Pages.NotFound} pageName="NotFound" />} />
            </Routes>
            <Toaster />
          </StoreSelectionProvider>
        </Router>
      </AIProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App