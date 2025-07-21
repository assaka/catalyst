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

  // Don't show selector if only one store or loading
  if (loading || !hasMultipleStores()) {
    return null;
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