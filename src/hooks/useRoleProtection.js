import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';

export const useRoleProtection = (shouldApply = true) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only apply role protection if shouldApply is true
    if (!shouldApply) {
      return;
    }
    
    const checkRoleAccess = async () => {
      try {
        // Determine current context first
        const currentPath = location.pathname.toLowerCase();
        const storefrontPages = [
          '/landing', '/', '/storefront', '/productdetail', '/cart', 
          '/checkout', '/order-success', '/ordersuccess'
        ];
        
        // Check if current path matches store slug pattern (/:storeSlug/page)
        const storeSlugPattern = /^\/[^\/]+\/(storefront|productdetail|cart|checkout|order-success|ordersuccess)/.test(currentPath);
        const isStorefrontContext = storefrontPages.some(page => currentPath.startsWith(page)) || storeSlugPattern;
        
        const dashboardPages = [
          '/dashboard', '/products', '/categories', '/settings', '/attributes', 
          '/plugins', '/cmsblocks', '/tax', '/orders', '/coupons', '/cmspages', 
          '/producttabs', '/productlabels', '/customoptionrules', '/shippingmethods', 
          '/googletagmanager', '/deliverysettings', '/themelayout', '/marketplaceexport', 
          '/imagemanager', '/htmlsitemap', '/customers', '/stocksettings', 
          '/analyticssettings', '/paymentmethods', '/seotools', '/xmlsitemap', 
          '/robotstxt', '/onboarding', '/billing', '/clientdashboard', '/stores', 
          '/ordercancel', '/customeractivity', '/cookieconsent'
        ];
        
        const isDashboardContext = dashboardPages.some(page => currentPath.startsWith(page));

        let user = await User.me();
        
        // Handle case where user is returned as an array
        if (Array.isArray(user)) {
          user = user[0];
        }

        if (!user) {
          // Not authenticated - only redirect to auth for dashboard pages
          if (isDashboardContext) {
            navigate(createPageUrl("Auth"));
          }
          // Allow guest access to storefront pages (including store slug pages)
          return;
        }

        const isStoreOwner = user.role === 'store_owner';
        const isAdmin = user.role === 'admin';
        const isCustomer = user.role === 'customer';

        // Enforce role-based access control
        // Allow store_owners to access storefront as guests - no redirect

        if (isDashboardContext && isCustomer) {
          // Customers cannot access dashboard (except customer dashboard)
          if (currentPath !== '/customerdashboard') {
            navigate(createPageUrl("Storefront"));
            return;
          }
        }

      } catch (error) {
        console.error('Role protection check failed:', error);
        
        // Determine context for error handling too
        const currentPath = location.pathname.toLowerCase();
        const dashboardPages = [
          '/dashboard', '/products', '/categories', '/settings', '/attributes', 
          '/plugins', '/cmsblocks', '/tax', '/orders', '/coupons', '/cmspages', 
          '/producttabs', '/productlabels', '/customoptionrules', '/shippingmethods', 
          '/googletagmanager', '/deliverysettings', '/themelayout', '/marketplaceexport', 
          '/imagemanager', '/htmlsitemap', '/customers', '/stocksettings', 
          '/analyticssettings', '/paymentmethods', '/seotools', '/xmlsitemap', 
          '/robotstxt', '/onboarding', '/billing', '/clientdashboard', '/stores', 
          '/ordercancel', '/customeractivity', '/cookieconsent'
        ];
        const isDashboardContext = dashboardPages.some(page => currentPath.startsWith(page));
        
        // On error, only redirect to auth if trying to access dashboard
        if (isDashboardContext) {
          navigate(createPageUrl("Auth"));
        }
      }
    };

    checkRoleAccess();
  }, [location.pathname, navigate, shouldApply]);

  return null;
};

export default useRoleProtection;