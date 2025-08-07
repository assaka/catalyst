import React from 'react';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import SupabaseStorage from '../components/admin/SupabaseStorage';
import { Database } from 'lucide-react';

const SupabasePage = () => {
  const { selectedStore } = useStoreSelection();

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supabase Integration</h1>
          <p className="text-gray-600 mt-1">Manage your Supabase database and storage services</p>
        </div>
      </div>

      {/* Use the SupabaseStorage component which has all the features */}
      <SupabaseStorage />
    </div>
  );
};

export default SupabasePage;