/**
 * AdminLayoutWrapper
 *
 * Wraps admin routes with TranslationProvider
 * Also checks if user has stores and redirects to onboarding if not
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TranslationProvider } from '@/contexts/TranslationContext';
import apiClient from '@/utils/api';
import { Loader2 } from 'lucide-react';

export function AdminLayoutWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStoreStatus();
  }, [location.pathname]);

  const checkStoreStatus = async () => {
    // Skip check if on auth or onboarding pages
    if (location.pathname === '/admin/auth' || location.pathname === '/admin/store-onboarding') {
      setChecking(false);
      return;
    }

    try {
      // Check if user has any stores
      const response = await apiClient.get('/api/stores/mt/dropdown');

      if (response?.data && response.data.length === 0) {
        console.log('🔍 No stores found, redirecting to onboarding...');
        navigate('/admin/store-onboarding', { replace: true });
        return;
      }

      setChecking(false);
    } catch (error) {
      console.error('Store check error:', error);
      // On error, allow access (fail open)
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <TranslationProvider>
      {children}
    </TranslationProvider>
  );
}
