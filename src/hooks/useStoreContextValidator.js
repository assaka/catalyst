import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clearCustomerSessionIfInvalid } from '@/utils/auth';

/**
 * Hook to validate customer store context
 * Checks if customer session belongs to current store
 * NOTE: Does NOT clear the session - just validates it for the current store
 */
export const useStoreContextValidator = () => {
  const { storeCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Only validate for customer sessions
    const customerToken = localStorage.getItem('customer_auth_token');
    if (!customerToken) {
      return; // No customer session to validate
    }

    // Skip if no store code in URL (non-storefront pages)
    if (!storeCode) {
      return;
    }

    console.log('🔒 Validating store context for:', storeCode);

    // Check if customer session matches current store
    const sessionNotValidForThisStore = clearCustomerSessionIfInvalid(storeCode);

    if (sessionNotValidForThisStore) {
      // Session exists but for a different store
      // Don't reload - just let the app show logged-out state for this store
      // The session will still be valid when they return to their original store
      console.log('ℹ️ Customer session not valid for this store (preserved for original store)');
    }
  }, [storeCode, navigate]);

  return null;
};

export default useStoreContextValidator;
