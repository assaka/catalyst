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

        // Extract relative path by removing /public/{storeSlug} prefix
        // Example: /public/hamid2/category/old-name → /category/old-name
        let relativePath = currentPath;
        const publicMatch = currentPath.match(/^\/public\/([^\/]+)(.*)/);
        if (publicMatch) {
          const storeSlugFromUrl = publicMatch[1];
          relativePath = publicMatch[2] || '/';
        }

        // Check for redirect using the relative path
        const response = await fetch(`/api/redirects/check?store_id=${storeId}&path=${encodeURIComponent(relativePath)}`);

        if (response.ok) {
          const data = await response.json();
          if (data.found && data.to_url) {
            console.log(`🔀 Redirect found: ${relativePath} → ${data.to_url}`);

            // Determine if this is an external redirect (absolute URL)
            const isAbsoluteUrl = data.to_url.startsWith('http://') || data.to_url.startsWith('https://');
            const isFullInternalPath = data.to_url.startsWith('/public/');

            // Build the full destination URL
            let destinationUrl = data.to_url;

            if (!isAbsoluteUrl && !isFullInternalPath) {
              // Relative path - prepend the store prefix from current URL
              if (publicMatch) {
                destinationUrl = `/public/${publicMatch[1]}${data.to_url}`;
              }
            }

            console.log(`🔀 Redirecting to: ${destinationUrl} (type: ${isAbsoluteUrl ? 'external' : 'internal'})`);

            // For external URLs, use window.location for proper navigation
            if (isAbsoluteUrl) {
              window.location.href = destinationUrl;
              return;
            }

            // For internal URLs, use React Router navigate
            navigate(destinationUrl, { replace: true });
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