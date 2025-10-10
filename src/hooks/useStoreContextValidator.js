import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clearCustomerSessionIfInvalid } from '@/utils/auth';

/**
 * Hook to validate customer store context
 * Automatically clears customer session if accessing a different store
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
    const sessionCleared = clearCustomerSessionIfInvalid(storeCode);

    if (sessionCleared) {
      console.log('🔄 Customer session cleared due to store mismatch, reloading page');
      // Reload the page to reflect logged-out state
      window.location.reload();
    }
  }, [storeCode, navigate]);

  return null;
};

export default useStoreContextValidator;
