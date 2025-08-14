import React from 'react';

export default function SimpleOverlayTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Overlay Test</h1>
      <p className="text-gray-600">
        If you can see this text, the component is loading correctly.
      </p>
      <div className="mt-4 p-4 bg-blue-100 rounded">
        <p>This is a test to verify the component renders properly.</p>
      </div>
    </div>
  );
}