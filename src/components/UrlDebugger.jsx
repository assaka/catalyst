import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useUrlContext } from '@/hooks/useUrlUtils';

/**
 * Debug component to show current URL context - remove in production
 */
export default function UrlDebugger() {
  const location = useLocation();
  const params = useParams();
  const urlContext = useUrlContext();
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: '#000', 
      color: '#fff', 
      padding: '10px', 
      fontSize: '10px',
      zIndex: 9999,
      maxWidth: '300px',
      maxHeight: '200px',
      overflow: 'auto'
    }}>
      <div><strong>URL Debug:</strong></div>
      <div>Path: {location.pathname}</div>
      <div>Search: {location.search}</div>
      <div>Params: {JSON.stringify(params)}</div>
      <div>Store: {urlContext.storeSlug}</div>
      <div>Page Type: {urlContext.pageType}</div>
      <div>URL Type: {urlContext.urlType}</div>
    </div>
  );
}