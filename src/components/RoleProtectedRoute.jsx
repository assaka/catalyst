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
        console.log('🔄 RoleProtectedRoute: No current user, redirecting to auth');
        console.log('🔍 Debug: localStorage auth_token:', !!localStorage.getItem('auth_token'));
        console.log('🔍 Debug: localStorage user_data:', !!localStorage.getItem('user_data'));
        console.log('🔍 Debug: localStorage session_role:', localStorage.getItem('session_role'));
        redirectToAuth();
        return;
      }

      // Debug session data
      const sessionRole = localStorage.getItem('session_role');
      console.log('🔍 HAMID DEBUG: Session validation:', {
        currentUser: currentUser,
        currentUserRole: currentUser?.role,
        sessionRole: sessionRole,
        hasSessionRole: !!sessionRole,
        rolesMatch: sessionRole === currentUser?.role
      });
      
      // Validate role-based session
      if (!validateRoleBasedSession()) {
        console.log('🔄 RoleProtectedRoute: Invalid role-based session for user:', currentUser.role);
        
        // Don't immediately redirect - try to verify with backend first
        try {
          const user = await User.me();
          if (user && user.role) {
            // Update local session data if backend has valid user
            localStorage.setItem('user_data', JSON.stringify(user));
            localStorage.setItem('session_role', user.role);
            
            console.log('✅ RoleProtectedRoute: Session refreshed from backend:', user.role);
            
            // Continue with validation
          } else {
            redirectToAuth(currentUser.role);
            return;
          }
        } catch (error) {
          console.log('🔄 RoleProtectedRoute: Backend verification failed, redirecting');
          redirectToAuth(currentUser.role);
          return;
        }
      }

      // If allowedRoles is specified and user role is not in the list, allow access anyway
      // This allows both store owners and customers to access their respective dashboards
      // The page content will determine what to show based on the user's role
      if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
        console.log(`ℹ️ User role '${currentUser.role}' not in allowed roles: ${allowedRoles}, but allowing access - page will handle role-specific content`);
        // Don't block access - let the page handle role-specific content
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
          
          // Continue with updated user data - no role restrictions
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