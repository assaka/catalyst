import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PublishButton = ({ storeId, storeName }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            Publish Store
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Deploy your store to make it publicly accessible
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Publishing Feature
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Configure your deployment settings to enable store publishing.
            </p>
          </div>
        </div>
      </div>

      <Button
        disabled
        className="w-full flex items-center justify-center space-x-2"
        size="lg"
      >
        <span>Configure Deployment</span>
      </Button>
    </div>
  );
};

export default PublishButton;
