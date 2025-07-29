import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  getCurrentUser, 
  activateRoleSession 
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
      
      // Check if we need to auto-switch roles for dual-session users
      if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
        console.log(`🔍 Current role '${currentUser.role}' not allowed for this route, checking for dual sessions...`);
        
        // Check if user has the required role in another session
        let canAutoSwitch = false;
        let targetRole = null;
        
        for (const requiredRole of allowedRoles) {
          // Check role-specific tokens to see if user has that role logged in
          let hasRoleSession = false;
          if (requiredRole === 'customer') {
            hasRoleSession = !!(localStorage.getItem('customer_auth_token') && localStorage.getItem('customer_user_data'));
          } else if (requiredRole === 'store_owner' || requiredRole === 'admin') {
            hasRoleSession = !!(localStorage.getItem('store_owner_auth_token') && localStorage.getItem('store_owner_user_data'));
          }
          
          if (hasRoleSession) {
            console.log(`✅ Found ${requiredRole} session, auto-switching...`);
            canAutoSwitch = true;
            targetRole = requiredRole;
            break;
          }
        }
        
        if (canAutoSwitch && targetRole) {
          // Auto-switch to the required role
          if (activateRoleSession(targetRole)) {
            console.log(`✅ Auto-switched to ${targetRole} role for this route`);
            // Re-run checkAccess after role switch
            setTimeout(() => checkAccess(), 100);
            return;
          }
        }
      }

      console.log('🔍 RoleProtectedRoute: Current user role:', currentUser?.role);

      // Check if user role is allowed for this route
      if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
        console.log(`🚫 Access denied: User role '${currentUser.role}' not in allowed roles:`, allowedRoles);
        
        // Redirect based on user role
        if (currentUser.role === 'customer') {
          console.log('🔄 RoleProtectedRoute: Redirecting customer to CustomerDashboard');
          navigate(createPageUrl('CustomerDashboard'));
        } else if (currentUser.role === 'store_owner' || currentUser.role === 'admin') {
          console.log('🔄 RoleProtectedRoute: Redirecting store owner to Dashboard');
          navigate(createPageUrl('Dashboard'));
        } else {
          redirectToAuth(currentUser.role);
        }
        return;
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