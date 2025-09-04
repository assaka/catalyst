import React from 'react';
import PreviewTab from '@/components/editor/ai-context/PreviewTab';

/**
 * Test component for the new Preview Tab
 * Tests specific patch application for Cart.jsx
 */
const TestPreviewTab = () => {
  const testFileName = 'src/pages/Cart.jsx';
  
  return (
    <div className="h-screen w-full">
      <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Preview Tab Test
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Testing specific patch application for Cart preview
        </p>
        <div className="mt-2 text-xs space-x-4">
          <span>Store: 8cc01a01-3a78-4f20-beb8-a566a07834e5</span>
          <span>Patch: a432e3d2-42ef-4df6-b5cc-3dcd28c513fe</span>
          <span>File: {testFileName}</span>
        </div>
      </div>
      
      <div className="h-full">
        <PreviewTab 
          fileName={testFileName}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default TestPreviewTab;