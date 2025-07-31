import React, { createContext, useContext, useState, useEffect } from 'react';
import { Store } from '@/api/entities';

const StoreSelectionContext = createContext();

export const useStoreSelection = () => {
  const context = useContext(StoreSelectionContext);
  if (!context) {
    throw new Error('useStoreSelection must be used within a StoreSelectionProvider');
  }
  return context;
};

export const StoreSelectionProvider = ({ children }) => {
  const [availableStores, setAvailableStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load available stores on mount
  useEffect(() => {
    loadStores();
  }, []);

  // Listen for logout events and reset context
  useEffect(() => {
    const handleLogout = () => {
      setAvailableStores([]);
      setSelectedStore(null);
      setLoading(true);
    };

    const handleStoreSelectionChanged = () => {
      // Reload stores to get updated data
      loadStores();
    };

    const handleUserDataReady = () => {
      // User data is now available, reload stores
      console.log('StoreSelection: User data ready, reloading stores...');
      loadStores();
    };

    window.addEventListener('userLoggedOut', handleLogout);
    window.addEventListener('storeSelectionChanged', handleStoreSelectionChanged);
    window.addEventListener('userDataReady', handleUserDataReady);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
      window.removeEventListener('storeSelectionChanged', handleStoreSelectionChanged);
      window.removeEventListener('userDataReady', handleUserDataReady);
    };
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      
      // Ensure user data is available before loading stores
      const userToken = localStorage.getItem('store_owner_auth_token');
      const userData = localStorage.getItem('store_owner_user_data');
      
      if (!userToken || !userData) {
        console.log('StoreSelection: Waiting for user authentication...');
        // Short delay to allow login process to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const stores = await Store.findAll();
      const storesArray = Array.isArray(stores) ? stores : [];
      
      console.log(`StoreSelection: Loaded ${storesArray.length} stores for user`);
      setAvailableStores(storesArray);
      
      // Auto-select first store if only one exists, or load from localStorage
      if (storesArray.length > 0) {
        const savedStoreId = localStorage.getItem('selectedStoreId');
        const savedStore = savedStoreId ? storesArray.find(s => s.id === savedStoreId) : null;
        
        if (savedStore) {
          setSelectedStore(savedStore);
        } else {
          // Default to first store
          setSelectedStore(storesArray[0]);
          localStorage.setItem('selectedStoreId', storesArray[0].id);
        }
      } else {
        // No stores available - clear any saved selection
        console.warn('StoreSelection: No stores available for user');
        setSelectedStore(null);
        localStorage.removeItem('selectedStoreId');
      }
    } catch (error) {
      console.error('StoreSelection: Error loading stores:', error);
      setAvailableStores([]);
    } finally {
      setLoading(false);
    }
  };

  const selectStore = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStoreId', store.id);
    
    // Dispatch custom event to notify components of store change
    window.dispatchEvent(new CustomEvent('storeSelectionChanged', { 
      detail: { store } 
    }));
  };

  const value = {
    availableStores,
    selectedStore,
    loading,
    selectStore,
    refreshStores: loadStores,
    // Helper to get selected store ID for API calls
    getSelectedStoreId: () => selectedStore?.id || null,
    // Helper to check if multiple stores exist
    hasMultipleStores: () => availableStores.length > 1
  };

  return (
    <StoreSelectionContext.Provider value={value}>
      {children}
    </StoreSelectionContext.Provider>
  );
};