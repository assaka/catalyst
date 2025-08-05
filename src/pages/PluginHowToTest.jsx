import React from 'react';

export default function PluginHowToTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Plugin How-To Test Page</h1>
      <p>This is a test page to verify routing is working.</p>
      <div className="mt-4 p-4 bg-green-100 rounded">
        ✅ If you can see this page, routing is working correctly!
      </div>
    </div>
  );
}