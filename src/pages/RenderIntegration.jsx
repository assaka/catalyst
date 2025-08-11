import React from 'react';
import RenderIntegrationComponent from '../components/integrations/RenderIntegration';
import { useStoreSelection } from '../contexts/StoreSelectionContext';
import { Cloud, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';

const RenderIntegration = () => {
  const { selectedStore } = useStoreSelection();
  const storeId = selectedStore?.id || localStorage.getItem('selectedStoreId');

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Store Selected</h2>
          <p className="text-gray-600">Please select a store to configure Render integration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-gray-600 mt-1">
            Connect your store to Render for seamless application deployment and hosting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://render.com/docs', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Render Docs
          </Button>
        </div>
      </div>

      {/* Integration Component */}
      <RenderIntegrationComponent storeId={storeId} />
    </div>
  );
};

export default RenderIntegration;