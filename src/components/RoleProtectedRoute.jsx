import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getCurrentUser, validateRoleBasedSession, hasValidRoleSession } from '@/utils/auth';
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

      const currentUser = getCurrentUser();
      
      // Check if user is logged in
      if (!currentUser) {
        redirectToAuth();
        return;
      }

      // Validate role-based session
      if (!validateRoleBasedSession()) {
        console.log('Invalid role-based session, redirecting to auth');
        redirectToAuth(currentUser.role);
        return;
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
        console.log(`Access denied: User role '${currentUser.role}' not in allowed roles:`, allowedRoles);
        handleUnauthorizedAccess(currentUser.role);
        return;
      }

      // Verify with backend that user still exists and is active
      try {
        const user = await User.me();
        if (!user) {
          redirectToAuth(currentUser.role);
          return;
        }

        // Check if user's role has changed
        if (user.role !== currentUser.role) {
          console.log('User role has changed, updating session');
          localStorage.setItem('user_data', JSON.stringify(user));
          localStorage.setItem('session_role', user.role);
          
          // Recheck authorization with new role
          if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            handleUnauthorizedAccess(user.role);
            return;
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
    const authPath = userRole === 'customer' ? '/customerauth' : '/auth';
    navigate(authPath);
  };

  const handleUnauthorizedAccess = (userRole) => {
    if (redirectTo) {
      navigate(redirectTo);
      return;
    }

    // Default redirection based on user role
    if (userRole === 'customer') {
      navigate(createPageUrl('CustomerDashboard'));
    } else if (userRole === 'store_owner' || userRole === 'admin') {
      navigate(createPageUrl('Dashboard'));
    } else {
      redirectToAuth(userRole);
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