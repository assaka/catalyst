import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { StoreSelectionProvider } from "@/contexts/StoreSelectionContext"
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Import pages
import { 
  Dashboard, 
  Storefront,
  ProductDetail,
  Cart,
  Checkout,
  CustomerAuth,
  Settings,
  Products,
  Categories,
  Orders,
  Customers
} from '@/pages'

// Import new hook-based systems
import { useEffect } from 'react'
import extensionSystem from '@/core/ExtensionSystem.js'
import hookSystem from '@/core/HookSystem.js'
import eventSystem from '@/core/EventSystem.js'

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
          {/* Public/Storefront Routes */}
          <Route path="/" element={<Navigate to="/public" replace />} />
          <Route path="/public" element={<Storefront />} />
          <Route path="/public/:storeCode" element={<Storefront />} />
          <Route path="/public/:storeCode/category/:categorySlug" element={<Storefront />} />
          <Route path="/public/:storeCode/product/:productSlug" element={<ProductDetail />} />
          <Route path="/public/:storeCode/cart" element={<Cart />} />
          <Route path="/public/:storeCode/checkout" element={<Checkout />} />
          <Route path="/login" element={<CustomerAuth />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/products" element={<Products />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/customers" element={<Customers />} />
          <Route path="/admin/settings" element={<Settings />} />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/public" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </StoreSelectionProvider>
  )
}

export default App