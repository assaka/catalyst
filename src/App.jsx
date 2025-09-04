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
      if (path === '/admin' || path === '/admin/dashboard') return { Component: Pages.Dashboard, name: 'Dashboard' };
      if (path === '/admin/products') return { Component: Pages.Products, name: 'Products' };
      if (path === '/admin/categories') return { Component: Pages.Categories, name: 'Categories' };
      if (path === '/admin/orders') return { Component: Pages.Orders, name: 'Orders' };
      if (path === '/admin/customers') return { Component: Pages.Customers, name: 'Customers' };
      if (path === '/admin/settings') return { Component: Pages.Settings, name: 'Settings' };
      if (path === '/admin/auth') return { Component: Auth, name: 'Auth' };
      // Add more admin routes as needed
    }
    
    // Public/Storefront routes
    if (path === '/' || path.startsWith('/public')) {
      return { Component: Pages.Storefront, name: 'Storefront' };
    }
    
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