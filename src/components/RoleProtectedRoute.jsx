import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdminUrl, createPublicUrl, getStoreSlugFromPublicUrl } from '@/utils/urlUtils';

const RoleProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requiresAuth = true 
}) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = () => {
    if (!requiresAuth) {
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }

    // Simple token check
    const hasCustomerToken = !!localStorage.getItem('customer_auth_token');
    const hasStoreOwnerToken = !!localStorage.getItem('store_owner_auth_token');
    
    // If no specific roles required, just check if any token exists
    if (allowedRoles.length === 0) {
      if (hasCustomerToken || hasStoreOwnerToken) {
        setIsAuthorized(true);
      } else {
        redirectToAuth();
      }
      setIsLoading(false);
      return;
    }

    // Check if required role token exists
    const hasRequiredToken = allowedRoles.some(role => {
      if (role === 'customer') return hasCustomerToken;
      if (role === 'store_owner' || role === 'admin') return hasStoreOwnerToken;
      return false;
    });

    if (hasRequiredToken) {
      setIsAuthorized(true);
    } else {
      redirectToAuth();
    }
    
    setIsLoading(false);
  };

  const redirectToAuth = () => {
    const currentPath = window.location.pathname.toLowerCase();
    const isCustomerRoute = currentPath.includes('/public/') || 
                           currentPath.includes('/customerdashboard') || 
                           currentPath.includes('/account') ||
                           allowedRoles.includes('customer');
    
    if (isCustomerRoute) {
      const storeSlug = getStoreSlugFromPublicUrl(currentPath) || 'default';
      navigate(createPublicUrl(storeSlug, 'CUSTOMER_AUTH'));
    } else {
      navigate(createAdminUrl('ADMIN_AUTH'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
};

export default RoleProtectedRoute;