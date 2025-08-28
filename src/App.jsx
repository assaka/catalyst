import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { StoreSelectionProvider } from "@/contexts/StoreSelectionContext"

function App() {
  return (
    <StoreSelectionProvider>
      <Pages />
      <Toaster />
    </StoreSelectionProvider>
  )
}

export default App 