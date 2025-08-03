import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getUserDataForRole, 
  activateRoleSession, 
  hasBothRolesLoggedIn,
  getCurrentUser 
} from '@/utils/auth';
import { createPageUrl, createStoreUrl } from '@/utils';
import { User as UserIcon, Store as StoreIcon } from 'lucide-react';

const RoleSwitcher = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [storeOwnerData, setStoreOwnerData] = useState(null);
  const [hasBothRoles, setHasBothRoles] = useState(false);

  useEffect(() => {
    updateRoleData();
    
    // Listen for role session changes
    const handleRoleChange = (event) => {
      updateRoleData();
    };
    
    window.addEventListener('roleSessionChanged', handleRoleChange);
    return () => window.removeEventListener('roleSessionChanged', handleRoleChange);
  }, []);

  const updateRoleData = () => {
    const currentUser = getCurrentUser();
    const currentRole = currentUser?.role;
    const customer = getUserDataForRole('customer');
    const storeOwner = getUserDataForRole('store_owner') || getUserDataForRole('admin');
    const bothRoles = hasBothRolesLoggedIn();
    
    setActiveRole(currentRole);
    setCustomerData(customer);
    setStoreOwnerData(storeOwner);
    setHasBothRoles(bothRoles);

  };

  const switchToCustomer = () => {
    if (activateRoleSession('customer')) {
      setActiveRole('customer');
      // Navigate to customer dashboard or storefront
      navigate(createPageUrl('CustomerDashboard'));
    }
  };

  const switchToStoreOwner = () => {
    const targetRole = storeOwnerData?.role === 'admin' ? 'admin' : 'store_owner';
    if (activateRoleSession(targetRole)) {
      setActiveRole(targetRole);
      // Navigate to store owner dashboard
      navigate(createPageUrl('Dashboard'));
    }
  };

  // Don't show if user doesn't have both roles
  if (!hasBothRoles) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="text-xs font-medium text-gray-600 mb-2">Active Session</div>
      
      <div className="flex gap-2">
        {customerData && (
          <Button
            variant={activeRole === 'customer' ? 'default' : 'outline'}
            size="sm"
            onClick={switchToCustomer}
            className="flex items-center gap-1"
          >
            <UserIcon size={14} />
            <span className="text-xs">
              Customer
              {activeRole === 'customer' && <Badge variant="secondary" className="ml-1 text-xs">Active</Badge>}
            </span>
          </Button>
        )}
        
        {storeOwnerData && (
          <Button
            variant={activeRole === 'store_owner' || activeRole === 'admin' ? 'default' : 'outline'}
            size="sm"
            onClick={switchToStoreOwner}
            className="flex items-center gap-1"
          >
            <StoreIcon size={14} />
            <span className="text-xs">
              {storeOwnerData.role === 'admin' ? 'Admin' : 'Store Owner'}
              {(activeRole === 'store_owner' || activeRole === 'admin') && 
                <Badge variant="secondary" className="ml-1 text-xs">Active</Badge>
              }
            </span>
          </Button>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        {activeRole === 'customer' 
          ? `Logged in as: ${customerData?.first_name} ${customerData?.last_name}`
          : `Logged in as: ${storeOwnerData?.first_name} ${storeOwnerData?.last_name}`
        }
      </div>
    </div>
  );
};

export default RoleSwitcher;