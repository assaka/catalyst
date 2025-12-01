import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const storesLoadedRef = useRef(false);

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
      // Skip loading if stores are already loaded - prevents extra API calls on navigation
      if (storesLoadedRef.current && selectedStore?.id) {
        setLoading(false);
        return;
      }
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
      storesLoadedRef.current = false;
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
        storesLoadedRef.current = true;
        return; // Don't change selection
      }

      setAvailableStores(stores);
      storesLoadedRef.current = true;
      
      // Auto-select first ACTIVE store or load from localStorage
      if (stores.length > 0) {
        const savedStoreId = localStorage.getItem('selectedStoreId');
        let savedStore = savedStoreId ? stores.find(s => s.id === savedStoreId) : null;

        if (savedStore) {
          // Found the saved store - but check if it's actually active
          if (savedStore.is_active && savedStore.status !== 'pending_database') {
            // Store is valid - only update if the ID changed to avoid unnecessary re-renders
            setSelectedStore(prev => prev?.id === savedStore.id ? prev : savedStore);
            localStorage.setItem('selectedStoreId', savedStore.id);
            localStorage.setItem('selectedStoreName', savedStore.name);
            localStorage.setItem('selectedStoreSlug', savedStore.slug || savedStore.code);
          } else {
            // Saved store is not active or pending - clear it and select first active store
            localStorage.removeItem('selectedStoreId');
            localStorage.removeItem('selectedStoreName');
            localStorage.removeItem('selectedStoreSlug');

            const firstActiveStore = stores.find(s => s.is_active && s.status !== 'pending_database') || stores.find(s => s.is_active) || stores[0];

            if (firstActiveStore) {
              setSelectedStore(prev => prev?.id === firstActiveStore.id ? prev : firstActiveStore);
              localStorage.setItem('selectedStoreId', firstActiveStore.id);
              localStorage.setItem('selectedStoreName', firstActiveStore.name);
              localStorage.setItem('selectedStoreSlug', firstActiveStore.slug || firstActiveStore.code);
            } else {
              // No active stores at all - clear auth and redirect to login
              localStorage.removeItem('store_owner_auth_token');
              localStorage.removeItem('store_owner_user_data');
              localStorage.setItem('user_logged_out', 'true');
              window.location.href = '/admin/auth?error=no_active_store';
            }
          }
        } else {
          // Saved store not found in user's stores list - clear stale localStorage and select first active store
          console.warn('⚠️ StoreSelection: Saved store not found in user stores, clearing stale selection');
          localStorage.removeItem('selectedStoreId');
          localStorage.removeItem('selectedStoreName');
          localStorage.removeItem('selectedStoreSlug');

          const firstActiveStore = stores.find(s => s.is_active && s.status !== 'pending_database') || stores.find(s => s.is_active) || stores[0];

          if (firstActiveStore) {
            setSelectedStore(prev => prev?.id === firstActiveStore.id ? prev : firstActiveStore);
            localStorage.setItem('selectedStoreId', firstActiveStore.id);
            localStorage.setItem('selectedStoreName', firstActiveStore.name);
            localStorage.setItem('selectedStoreSlug', firstActiveStore.slug || firstActiveStore.code);
          } else {
            console.error('❌ StoreSelection: No stores available!');
          }
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