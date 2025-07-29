import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  getCurrentUser
} from '@/utils/auth';
import { User } from '@/api/entities';

const RoleProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requiresAuth = true,
  redirectTo = null 
}) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      if (!requiresAuth) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Check if any user is logged in by checking role-specific tokens
      const hasCustomerToken = !!(localStorage.getItem('customer_auth_token') && localStorage.getItem('customer_user_data'));
      const hasStoreOwnerToken = !!(localStorage.getItem('store_owner_auth_token') && localStorage.getItem('store_owner_user_data'));
      
      if (!hasCustomerToken && !hasStoreOwnerToken) {
        console.log('🔄 RoleProtectedRoute: No valid tokens, redirecting to auth');
        redirectToAuth();
        return;
      }
      
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('🔄 RoleProtectedRoute: No current user data, redirecting to auth');
        redirectToAuth();
        return;
      }
      

      console.log('🔍 RoleProtectedRoute: Current user role:', currentUser?.role);

      // Check if user has the required role token for this route
      if (allowedRoles.length > 0) {
        let hasRequiredRoleToken = false;
        
        for (const requiredRole of allowedRoles) {
          if (requiredRole === 'customer') {
            const customerToken = localStorage.getItem('customer_auth_token');
            if (customerToken) {
              hasRequiredRoleToken = true;
              break;
            }
          } else if (requiredRole === 'store_owner' || requiredRole === 'admin') {
            const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
            if (storeOwnerToken) {
              hasRequiredRoleToken = true;
              break;
            }
          }
        }
        
        if (!hasRequiredRoleToken) {
          console.log(`🚫 Access denied: No valid token for required roles:`, allowedRoles);
          
          // Check for specific paths
          const currentPath = window.location.pathname.toLowerCase();
          const isCustomerDashboard = currentPath.includes('/customerdashboard');
          const isDashboardPath = currentPath.includes('/dashboard') || 
                                 currentPath.includes('/products') || 
                                 currentPath.includes('/categories') || 
                                 currentPath.includes('/settings') ||
                                 currentPath.includes('/orders') ||
                                 currentPath.includes('/customers') ||
                                 currentPath.includes('/stores');
          
          // Special handling for customer dashboard
          if (isCustomerDashboard) {
            // Check if a store owner/admin is trying to access customer dashboard
            const hasStoreOwnerToken = localStorage.getItem('store_owner_auth_token');
            if (hasStoreOwnerToken) {
              console.log('🔄 RoleProtectedRoute: Store owner trying to access customer dashboard, redirecting to customer auth');
              navigate(createPageUrl('CustomerAuth'));
              return;
            }
          }
          
          // Redirect to appropriate auth page based on required role
          const requiresCustomerRole = allowedRoles.includes('customer');
          if (requiresCustomerRole) {
            console.log('🔄 RoleProtectedRoute: Redirecting to customer auth');
            navigate(createPageUrl('CustomerAuth'));
          } else if (isDashboardPath || allowedRoles.includes('store_owner') || allowedRoles.includes('admin')) {
            console.log('🔄 RoleProtectedRoute: Redirecting to store owner auth');
            navigate(createPageUrl('Auth'));
          } else {
            console.log('🔄 RoleProtectedRoute: Redirecting to store owner auth (default)');
            navigate(createPageUrl('Auth'));
          }
          return;
        }
      }

      // Verify with backend that user still exists and is active
      try {
        const user = await User.me();
        if (!user) {
          redirectToAuth(currentUser.role);
          return;
        }

        // Check if user's role has changed and update role-specific data
        if (user.role !== currentUser.role) {
          console.log('User role has changed, updating role-specific session');
          if (user.role === 'customer') {
            localStorage.setItem('customer_user_data', JSON.stringify(user));
          } else if (user.role === 'store_owner' || user.role === 'admin') {
            localStorage.setItem('store_owner_user_data', JSON.stringify(user));
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Error verifying user:', error);
        redirectToAuth(currentUser.role);
        return;
      }

    } catch (error) {
      console.error('Error checking access:', error);
      redirectToAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToAuth = (userRole = null) => {
    // Get the current user data to determine role if not provided
    const currentUser = getCurrentUser();
    const roleToUse = userRole || currentUser?.role;
    
    console.log('🔄 RoleProtectedRoute: Redirecting to auth for role:', roleToUse);
    
    const authPath = roleToUse === 'customer' ? '/customerauth' : '/auth';
    navigate(authPath);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Component will redirect, so don't render anything
  }

  return children;
};

export default RoleProtectedRoute;