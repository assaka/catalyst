import React from 'react';
import { AlertCircle, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const NoStoreSelected = ({ message = "Please select a store to continue" }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Store Selected</h3>
              <p className="text-gray-600">{message}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>Use the store selector in the header above</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoStoreSelected;