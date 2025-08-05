import React from 'react';

export default function PluginHowToDebug() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Plugin Development Guide (Debug Version)
        </h1>
        <p className="text-gray-600 mb-8">
          This is a simplified debug version to test routing.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">✅ Route is Working!</h2>
          <p className="text-gray-700">
            If you can see this page, the routing for `/admin/plugin-how-to` is working correctly.
            The issue might be with the complex UI components in the full version.
          </p>
          
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-medium text-blue-800">Next Steps:</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Verify all UI component imports are working</li>
              <li>• Check for console errors in browser</li>
              <li>• Test individual components</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}