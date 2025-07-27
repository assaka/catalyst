import { useLocation, useParams } from 'react-router-dom';
import { getStoreSlugFromUrl } from '@/utils';

export const useStoreSlug = () => {
  const location = useLocation();
  const params = useParams();
  
  // Get store slug from URL pattern /:storeSlug/page
  const storeSlug = getStoreSlugFromUrl(location.pathname) || params.storeCode;
  
  // Check if we're in a store context
  const isStoreContext = !!storeSlug;
  
  return {
    storeSlug,
    isStoreContext
  };
};