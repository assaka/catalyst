import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import SupabaseIntegration from '../components/integrations/SupabaseIntegration';
import SupabaseStorage from '../components/admin/SupabaseStorage';
import { Database } from 'lucide-react';
// Force rebuild - removed api-client import

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Always show both components - SupabaseIntegration handles connection state internally
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supabase Integration</h1>
          <p className="text-gray-600 mt-1">
            {connectionStatus?.connected 
              ? 'Manage your Supabase database and storage services'
              : 'Connect your Supabase account for database and storage management'}
          </p>
        </div>
      </div>

      {/* Show SupabaseIntegration for connection management */}
      <SupabaseIntegration storeId={storeId} />
      
      {/* Show SupabaseStorage only when connected */}
      {connectionStatus?.connected && <SupabaseStorage />}
    </div>
  );
};

export default SupabasePage;