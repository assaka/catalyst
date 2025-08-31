import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { StoreSelectionProvider } from "@/contexts/StoreSelectionContext"

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
      <Pages />
      <Toaster />
    </StoreSelectionProvider>
  )
}

export default App 