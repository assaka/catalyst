import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';

export const useRoleProtection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkRoleAccess = async () => {
      try {
        let user = await User.me();
        
        // Handle case where user is returned as an array
        if (Array.isArray(user)) {
          user = user[0];
        }

        if (!user) {
          // Not authenticated - redirect to auth
          navigate(createPageUrl("Auth"));
          return;
        }

        // Determine current context
        const currentPath = location.pathname.toLowerCase();
        const storefrontPages = [
          '/landing', '/', '/storefront', '/productdetail', '/cart', 
          '/checkout', '/order-success', '/ordersuccess'
        ];
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
        
        const isStorefrontContext = storefrontPages.some(page => currentPath.startsWith(page));
        const isDashboardContext = dashboardPages.some(page => currentPath.startsWith(page));
        
        const isStoreOwner = user.role === 'store_owner';
        const isAdmin = user.role === 'admin';
        const isCustomer = user.role === 'customer';

        // Enforce role-based access control
        if (isStorefrontContext && (isStoreOwner || isAdmin)) {
          // Store owners/admins cannot access storefront
          navigate(createPageUrl("Dashboard"));
          return;
        }

        if (isDashboardContext && isCustomer) {
          // Customers cannot access dashboard (except customer dashboard)
          if (currentPath !== '/customerdashboard') {
            navigate(createPageUrl("Storefront"));
            return;
          }
        }

      } catch (error) {
        console.error('Role protection check failed:', error);
        // On error, redirect to auth
        navigate(createPageUrl("Auth"));
      }
    };

    checkRoleAccess();
  }, [location.pathname, navigate]);

  return null;
};

export default useRoleProtection;