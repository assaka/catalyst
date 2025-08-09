import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store as StoreIcon, ChevronDown } from 'lucide-react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

export const StoreSelector = ({ className = "" }) => {
  const { 
    availableStores, 
    selectedStore, 
    loading, 
    selectStore, 
    hasMultipleStores 
  } = useStoreSelection();




  // Show loading state, hide only if no stores available after loading
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StoreIcon className="w-4 h-4 text-gray-500" />
        <div className="w-48 h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  // Hide if no stores available
  if (availableStores.length === 0) {
    return null;
  }

  // For single store, show it but disabled
  if (availableStores.length === 1) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StoreIcon className="w-4 h-4 text-gray-500" />
        <div className="w-48 h-10 px-3 py-2 bg-gray-50 border rounded-md flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">{availableStores[0].name}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StoreIcon className="w-4 h-4 text-gray-500" />
      <Select
        value={selectedStore?.id || ''}
        onValueChange={(storeId) => {
          const store = availableStores.find(s => s.id === storeId);
          if (store) {
            selectStore(store);
          }
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select store...">
            {selectedStore?.name || 'Select store...'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableStores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>{store.name}</span>
                {store.domain && (
                  <span className="text-xs text-gray-500">({store.domain})</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StoreSelector;