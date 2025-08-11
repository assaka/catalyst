import React from 'react';
import RenderIntegrationComponent from '../components/integrations/RenderIntegration';
import { useStoreSelection } from '../contexts/StoreSelectionContext';

const RenderIntegration = () => {
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Render Integration</h1>
        <p className="text-gray-600">
          Connect your store to Render for seamless application deployment and hosting.
        </p>
      </div>

      <RenderIntegrationComponent storeId={storeId} />
    </div>
  );
};

export default RenderIntegration;