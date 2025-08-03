import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

const RedirectHandler = ({ children, storeId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [show404, setShow404] = useState(false);

  useEffect(() => {
    // Only check once per location change and only if we have a store ID
    if (!storeId || hasChecked || isChecking) return;
    
    const checkForRedirect = async () => {
      setIsChecking(true);
      
      try {
        const currentPath = location.pathname;
        // Skip redirect checking for admin routes, API routes, etc.
        if (currentPath.startsWith('/admin') || 
            currentPath.startsWith('/api') || 
            currentPath.startsWith('/auth') ||
            currentPath === '/') {
          setHasChecked(true);
          setIsChecking(false);
          return;
        }

        // Check for redirect using the current full path
        const response = await fetch(`/api/redirects/check?store_id=${storeId}&path=${encodeURIComponent(currentPath)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.found && data.to_url) {
            console.log(`🔀 Global redirect: ${currentPath} → ${data.to_url}`);
            // Navigate to the redirect destination
            navigate(data.to_url, { replace: true });
            return; // Don't set hasChecked since we're navigating away
          }
        }
      } catch (error) {
        console.warn('Error in global redirect check:', error);
      } finally {
        setHasChecked(true);
        setIsChecking(false);
      }
    };

    checkForRedirect();
  }, [location.pathname, storeId, hasChecked, isChecking, navigate]);

  // Reset check status when location changes
  useEffect(() => {
    setHasChecked(false);
    setShow404(false);
  }, [location.pathname]);

  // Listen for 404 events from child components
  useEffect(() => {
    const handle404Event = (event) => {
      // Child component is signaling that content was not found
      console.log('404 event received:', event.detail);
      setShow404(true);
    };

    window.addEventListener('show404Page', handle404Event);
    return () => window.removeEventListener('show404Page', handle404Event);
  }, []);

  // Show loading while checking for redirects
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show 404 page if child components have signaled content not found
  if (show404) {
    return <NotFoundPage />;
  }

  // Render children once redirect check is complete
  return children;
};

export default RedirectHandler;