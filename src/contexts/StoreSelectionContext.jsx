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
  const [selectedStore, setSelectedStore] = useState(() => {
    // Try to restore from localStorage immediately
    const savedStoreId = localStorage.getItem('selectedStoreId');
    const savedStoreName = localStorage.getItem('selectedStoreName');
    if (savedStoreId && savedStoreName) {
      return { id: savedStoreId, name: savedStoreName };
    }
    return null;
  });
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

    window.addEventListener('userLoggedOut', handleLogout);
    return () => window.removeEventListener('userLoggedOut', handleLogout);
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      
      const stores = await Store.findAll();
      
      // Always keep existing selection if we have one and no stores were loaded
      if (stores.length === 0 && selectedStore) {
        setAvailableStores([selectedStore]); // Keep the current store in the list
        return; // Don't change selection
      }
      
      setAvailableStores(stores);
      
      // Auto-select first store or load from localStorage
      if (stores.length > 0) {
        const savedStoreId = localStorage.getItem('selectedStoreId');
        const savedStore = savedStoreId ? stores.find(s => s.id === savedStoreId) : null;
        
        if (savedStore) {
          setSelectedStore(savedStore);
          localStorage.setItem('selectedStoreName', savedStore.name);
        } else if (!selectedStore) {
          // Only auto-select if we don't have a current selection
          setSelectedStore(stores[0]);
          localStorage.setItem('selectedStoreId', stores[0].id);
          localStorage.setItem('selectedStoreName', stores[0].name);
        }
      }
    } catch (error) {
      console.error('❌ StoreSelection: Error loading stores:', error);
      // If we have a selected store, keep it
      if (selectedStore) {
        setAvailableStores([selectedStore]);
      } else {
        setAvailableStores([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectStore = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStoreId', store.id);
    localStorage.setItem('selectedStoreName', store.name);
    
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
    getSelectedStoreId: () => selectedStore?.id || null,
    hasMultipleStores: () => availableStores.length > 1
  };

  return (
    <StoreSelectionContext.Provider value={value}>
      {children}
    </StoreSelectionContext.Provider>
  );
};