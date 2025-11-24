import React, { createContext, useContext, useState, useEffect } from 'react';
import { Store } from '@/api/entities';
import { useLocation } from 'react-router-dom';

const StoreSelectionContext = createContext();

export const useStoreSelection = () => {
  const context = useContext(StoreSelectionContext);
  if (!context) {
    throw new Error('useStoreSelection must be used within a StoreSelectionProvider');
  }
  return context;
};

export const StoreSelectionProvider = ({ children }) => {
  const location = useLocation();
  const [availableStores, setAvailableStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(() => {
    // Try to restore from localStorage immediately
    const savedStoreId = localStorage.getItem('selectedStoreId');
    const savedStoreName = localStorage.getItem('selectedStoreName');
    const savedStoreSlug = localStorage.getItem('selectedStoreSlug');
    if (savedStoreId && savedStoreName) {
      return { id: savedStoreId, name: savedStoreName, slug: savedStoreSlug };
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Check if we're on an admin page (exclude auth and onboarding)
  const isAdminPage = () => {
    const path = location.pathname;
    const isAuth = path === '/admin/auth' || path === '/auth';
    const isOnboarding = path === '/admin/store-onboarding';

    if (isAuth || isOnboarding) {
      return false; // Don't load stores on auth/onboarding
    }

    return path.startsWith('/admin') || path.startsWith('/editor') || path.startsWith('/plugins');
  };

  // Load available stores on mount only if on admin pages
  useEffect(() => {
    if (isAdminPage()) {
      loadStores();
    } else {
      // Not on admin page, skip loading
      setLoading(false);
    }
  }, [location.pathname]);

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
      
      // Auto-select first ACTIVE store or load from localStorage
      if (stores.length > 0) {
        const savedStoreId = localStorage.getItem('selectedStoreId');
        let savedStore = savedStoreId ? stores.find(s => s.id === savedStoreId) : null;

        console.log('🔍 StoreSelection: savedStoreId from localStorage:', savedStoreId);
        console.log('🔍 StoreSelection: Found savedStore:', savedStore ? savedStore.name : 'NOT FOUND');
        console.log('🔍 StoreSelection: Available stores:', stores.map(s => ({ id: s.id, name: s.name, slug: s.slug })));

        if (savedStore) {
          // Found the saved store - use it
          console.log('✅ StoreSelection: Using saved store:', savedStore.name);
          setSelectedStore(savedStore);
          localStorage.setItem('selectedStoreId', savedStore.id);
          localStorage.setItem('selectedStoreName', savedStore.name);
          localStorage.setItem('selectedStoreSlug', savedStore.slug || savedStore.code);
        } else if (!selectedStore) {
          // No saved store or not found - use first ACTIVE store
          const firstActiveStore = stores.find(s => s.is_active) || stores[0];
          console.log('⚠️ StoreSelection: Saved store not found, using first active store:', firstActiveStore.name);
          setSelectedStore(firstActiveStore);
          localStorage.setItem('selectedStoreId', firstActiveStore.id);
          localStorage.setItem('selectedStoreName', firstActiveStore.name);
          localStorage.setItem('selectedStoreSlug', firstActiveStore.slug || firstActiveStore.code);
        }

        console.log('✅ StoreSelection: Final localStorage values:', {
          selectedStoreId: localStorage.getItem('selectedStoreId'),
          selectedStoreName: localStorage.getItem('selectedStoreName'),
          selectedStoreSlug: localStorage.getItem('selectedStoreSlug')
        });
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
    localStorage.setItem('selectedStoreSlug', store.slug);

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