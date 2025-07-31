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
          '/admin/dashboard', '/admin/products', '/admin/categories', '/admin/settings', '/admin/attributes', 
          '/admin/plugins', '/admin/cms-blocks', '/admin/tax', '/admin/orders', '/admin/coupons', '/admin/cms-pages', 
          '/admin/product-tabs', '/admin/product-labels', '/admin/custom-option-rules', '/admin/shipping-methods', 
          '/admin/google-tag-manager', '/admin/delivery-settings', '/admin/theme-layout', '/admin/marketplace-export', 
          '/admin/image-manager', '/admin/customers', '/admin/stock-settings', 
          '/admin/analytics', '/admin/payment-methods', '/admin/seo-tools', 
          '/onboarding', '/billing', '/client-dashboard', '/admin/stores', 
          '/admin/customer-activity', '/admin/cookie-consent'
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
          '/admin/dashboard', '/admin/products', '/admin/categories', '/admin/settings', '/admin/attributes', 
          '/admin/plugins', '/admin/cms-blocks', '/admin/tax', '/admin/orders', '/admin/coupons', '/admin/cms-pages', 
          '/admin/product-tabs', '/admin/product-labels', '/admin/custom-option-rules', '/admin/shipping-methods', 
          '/admin/google-tag-manager', '/admin/delivery-settings', '/admin/theme-layout', '/admin/marketplace-export', 
          '/admin/image-manager', '/admin/customers', '/admin/stock-settings', 
          '/admin/analytics', '/admin/payment-methods', '/admin/seo-tools', 
          '/onboarding', '/billing', '/client-dashboard', '/admin/stores', 
          '/admin/customer-activity', '/admin/cookie-consent'
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