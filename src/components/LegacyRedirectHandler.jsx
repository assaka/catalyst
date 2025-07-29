import React from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';

/**
 * Component to handle legacy URL redirects with proper parameter handling
 */
export default function LegacyRedirectHandler({ redirectPattern }) {
  const params = useParams();
  const location = useLocation();
  
  // Replace parameter placeholders with actual values
  let redirectTo = redirectPattern;
  Object.entries(params).forEach(([key, value]) => {
    redirectTo = redirectTo.replace(`:${key}`, value);
  });
  
  // Preserve query parameters for categories and filters
  const queryString = location.search;
  if (queryString) {
    // Convert old query parameters to new SEO-friendly URLs
    const urlParams = new URLSearchParams(queryString);
    const category = urlParams.get('category');
    
    if (category && redirectTo.includes('/shop')) {
      // Convert ?category=home-garden to /category/home-garden
      redirectTo = redirectTo.replace('/shop', `/category/${category}`);
      // Remove the category parameter from query string
      urlParams.delete('category');
      const remainingParams = urlParams.toString();
      redirectTo = remainingParams ? `${redirectTo}?${remainingParams}` : redirectTo;
    } else {
      redirectTo = `${redirectTo}${queryString}`;
    }
  }
  
  console.log('🔄 Legacy redirect:', location.pathname + location.search, '→', redirectTo);
  
  return <Navigate to={redirectTo} replace />;
}