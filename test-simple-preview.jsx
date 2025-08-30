import React from 'react';
import SimplePreview from '@/components/SimplePreview';

/**
 * Test component for SimplePreview
 * Shows Cart.jsx with patches applied
 */
const TestSimplePreview = () => {
  return (
    <div className="h-screen w-full">
      <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Simple Preview Test
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Testing Cart.jsx loaded from file_baselines with patches applied
        </p>
      </div>
      
      <div className="h-full">
        <SimplePreview />
      </div>
    </div>
  );
};

export default TestSimplePreview;