import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { StoreSelectionProvider } from "@/contexts/StoreSelectionContext"
import GlobalPatchProvider from "@/components/storefront/GlobalPatchProvider"

function App() {
  return (
    <StoreSelectionProvider>
      <GlobalPatchProvider>
        <Pages />
        <Toaster />
      </GlobalPatchProvider>
    </StoreSelectionProvider>
  )
}

export default App 