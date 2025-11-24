import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';

/**
 * Store Onboarding Guard
 *
 * Checks if user has any active stores.
 * If no stores (count = 0) → redirect to /admin/store-onboarding
 * If has stores → continue to requested page
 */
export default function StoreOnboardingGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasStores, setHasStores] = useState(false);

  useEffect(() => {
    checkStoreStatus();
  }, []);

  const checkStoreStatus = async () => {
    // Don't check if already on onboarding page
    if (location.pathname === '/admin/store-onboarding') {
      setChecking(false);
      setHasStores(false);
      return;
    }

    try {
      // Check if user has any stores
      const response = await api.get('/api/stores/mt/dropdown');

      if (response.success && response.data) {
        // Filter for active stores only
        const activeStores = response.data.filter(store => store.status === 'active');
        const activeStoreCount = activeStores.length;

        if (activeStoreCount === 0) {
          // No active stores - redirect to onboarding
          console.log('No active stores found, redirecting to onboarding...');
          navigate('/admin/store-onboarding', { replace: true });
          return;
        } else {
          // Has active stores - allow access
          setHasStores(true);
        }
      } else {
        // API error - allow access (fail open)
        console.warn('Failed to check store status, allowing access');
        setHasStores(true);
      }
    } catch (err) {
      console.error('Store status check error:', err);
      // Error checking - allow access (fail open)
      setHasStores(true);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    // Show loading while checking
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children (the protected page)
  return children;
}
