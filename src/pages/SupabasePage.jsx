import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import SupabaseIntegration from '../components/integrations/SupabaseIntegration';
import SupabaseStorage from '../components/admin/SupabaseStorage';
import { Database, Check, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import apiClient from '../api/client';
// Force rebuild - removed api-client import

const SupabasePage = () => {
  const { selectedStore } = useStoreSelection();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');

  useEffect(() => {
    if (storeId && storeId !== 'undefined') {
      loadConnectionStatus();
      checkIfDefault();
    }
  }, [storeId]);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      // Use apiClient which handles authentication correctly
      const response = await apiClient.get('/supabase/status', {
        'x-store-id': storeId
      });
      
      if (response.data.success) {
        setConnectionStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading Supabase status:', error);
      setConnectionStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const checkIfDefault = async () => {
    try {
      const response = await apiClient.get(`/stores/${storeId}/default-database-provider`);
      setIsDefault(response.data?.provider === 'supabase');
    } catch (error) {
      console.error('Error checking default database provider:', error);
    }
  };

  const handleSetAsDefault = async () => {
    if (!storeId) {
      toast.error('Please select a store first');
      return;
    }

    setSettingDefault(true);
    try {
      await apiClient.post(`/stores/${storeId}/default-database-provider`, {
        provider: 'supabase'
      });
      
      setIsDefault(true);
      toast.success('Supabase set as default database provider');
      
      // Refresh the default status to ensure consistency
      await checkIfDefault();
    } catch (error) {
      console.error('Error setting default database provider:', error);
      toast.error('Failed to set as default database provider');
    } finally {
      setSettingDefault(false);
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
        <Button
          onClick={handleSetAsDefault}
          disabled={settingDefault || isDefault}
          variant={isDefault ? "secondary" : "default"}
          size="sm"
          className="flex items-center gap-2"
        >
          {isDefault ? (
            <>
              <Check className="h-4 w-4" />
              <span>Default Database</span>
            </>
          ) : (
            <>
              <Star className="h-4 w-4" />
              <span>Set as Default</span>
            </>
          )}
        </Button>
      </div>

      {/* Show SupabaseIntegration for connection management */}
      <SupabaseIntegration storeId={storeId} />
      
      {/* Show SupabaseStorage only when connected */}
      {connectionStatus?.connected && <SupabaseStorage />}
    </div>
  );
};

export default SupabasePage;