import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createAdminUrl, createPublicUrl, getCurrentUrlType, getStoreSlugFromPublicUrl } from '@/utils/urlUtils';
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
          
          // Check for specific paths and URL types
          const currentPath = window.location.pathname.toLowerCase();
          const urlType = getCurrentUrlType();
          const isPublicRoute = currentPath.startsWith('/public/');
          const isAdminRoute = currentPath.startsWith('/admin/');
          const isCustomerDashboard = currentPath.includes('/customerdashboard') || currentPath.includes('/account');
          const isDashboardPath = isAdminRoute || 
                                 currentPath.includes('/dashboard') || 
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
              const storeSlug = getStoreSlugFromPublicUrl(currentPath) || 'default';
              navigate(createPublicUrl(storeSlug, 'CUSTOMER_AUTH'));
              return;
            }
          }
          
          // Redirect to appropriate auth page based on required role and URL structure
          const requiresCustomerRole = allowedRoles.includes('customer');
          if (requiresCustomerRole || isPublicRoute) {
            console.log('🔄 RoleProtectedRoute: Redirecting to customer auth');
            const storeSlug = getStoreSlugFromPublicUrl(currentPath) || 'default';
            navigate(createPublicUrl(storeSlug, 'CUSTOMER_AUTH'));
          } else if (isDashboardPath || allowedRoles.includes('store_owner') || allowedRoles.includes('admin') || isAdminRoute) {
            console.log('🔄 RoleProtectedRoute: Redirecting to admin auth');
            navigate(createAdminUrl('ADMIN_AUTH'));
          } else {
            console.log('🔄 RoleProtectedRoute: Redirecting to admin auth (default)');
            navigate(createAdminUrl('ADMIN_AUTH'));
          }
          return;
        }
      }

      // Verify with backend that user still exists and is active
      try {
        console.log('🔍 RoleProtectedRoute: Verifying user with backend...');
        console.log('🔍 RoleProtectedRoute: Current user data:', currentUser);
        console.log('🔍 RoleProtectedRoute: Available tokens:', {
          storeOwner: !!localStorage.getItem('store_owner_auth_token'),
          customer: !!localStorage.getItem('customer_auth_token')
        });
        
        const user = await User.me();
        console.log('🔍 RoleProtectedRoute: Backend user verification result:', user);
        
        if (!user) {
          console.log('❌ RoleProtectedRoute: Backend returned null user, redirecting to auth');
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

        console.log('✅ RoleProtectedRoute: User verified successfully, granting access');
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ RoleProtectedRoute: Error verifying user:', error);
        console.log('🔍 RoleProtectedRoute: Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        // Check if it's an invalid token error
        if (error.message && (error.message.includes('Invalid token') || error.message.includes('Unauthorized'))) {
          console.log('🔧 RoleProtectedRoute: Invalid token detected, clearing auth data');
          
          // Clear the invalid token
          if (currentUser?.role === 'customer') {
            localStorage.removeItem('customer_auth_token');
            localStorage.removeItem('customer_user_data');
          } else {
            localStorage.removeItem('store_owner_auth_token');
            localStorage.removeItem('store_owner_user_data');
          }
        }
        
        console.log('🔄 RoleProtectedRoute: Redirecting to auth due to verification error');
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
    
    if (roleToUse === 'customer') {
      const currentPath = window.location.pathname.toLowerCase();
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
    return null; // Component will redirect, so don't render anything
  }

  return children;
};

export default RoleProtectedRoute;