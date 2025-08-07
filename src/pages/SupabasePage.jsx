import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import SupabaseIntegration from '../components/integrations/SupabaseIntegration';
import SupabaseStorage from '../components/admin/SupabaseStorage';
import { Database } from 'lucide-react';

const SupabasePage = () => {
  const { selectedStore } = useStoreSelection();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');

  useEffect(() => {
    if (storeId && storeId !== 'undefined') {
      loadConnectionStatus();
    }
  }, [storeId]);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/supabase/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-store-id': storeId
        }
      });

      const data = await response.json();
      if (data.success) {
        setConnectionStatus(data);
      }
    } catch (error) {
      console.error('Error loading Supabase status:', error);
      setConnectionStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a store to manage Supabase integration</p>
        </div>
      </div>
    );
  }

  // If not connected, show the SupabaseIntegration component for OAuth flow
  if (!connectionStatus?.connected) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supabase Integration</h1>
            <p className="text-gray-600 mt-1">Connect your Supabase account for database and storage management</p>
          </div>
        </div>
        
        {/* Show SupabaseIntegration for connection setup */}
        <SupabaseIntegration storeId={storeId} />
      </div>
    );
  }

  // If connected, show the SupabaseStorage component with Storage Buckets and Statistics
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supabase Integration</h1>
          <p className="text-gray-600 mt-1">Manage your Supabase database and storage services</p>
        </div>
      </div>

      {/* Show SupabaseIntegration at the top for connection management */}
      <SupabaseIntegration storeId={storeId} />
      
      {/* Show SupabaseStorage below for storage management */}
      <SupabaseStorage />
    </div>
  );
};

export default SupabasePage;