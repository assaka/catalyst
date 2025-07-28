import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AttributeDebug({ attributes, products }) {
  const clearAttributeCache = () => {
    // Clear the cached attributes data
    const storeId = localStorage.getItem('selectedStoreId') || '157d4590-49bf-4b0b-bd77-abe131909528';
    const cacheKey = `attributes-${storeId}`;
    localStorage.removeItem(cacheKey);
    
    // Refresh the page to reload data
    window.location.reload();
  };

  if (!attributes || !products) {
    return (
      <Card className="mb-4 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">🔍 Attribute Debug - No Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Attributes: {attributes ? 'Available' : 'Missing'}</p>
          <p>Products: {products ? 'Available' : 'Missing'}</p>
          <button 
            onClick={clearAttributeCache}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Clear Cache & Reload
          </button>
        </CardContent>
      </Card>
    );
  }

  const colorAttribute = attributes.find(a => 
    a.name === 'Color' || 
    a.code === 'color' || 
    a.name?.toLowerCase() === 'color' ||
    a.code?.toLowerCase() === 'color'
  );

  const sampleProduct = products[0];

  return (
    <Card className="mb-4 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-600">🔍 Attribute Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">Total Attributes: {attributes.length}</h4>
          <p>Filterable: {attributes.filter(a => a.is_filterable).length}</p>
        </div>

        <div>
          <h4 className="font-semibold">Color Attribute Status:</h4>
          {colorAttribute ? (
            <div className="ml-4 space-y-1">
              <p>✅ Found: {colorAttribute.name} ({colorAttribute.code})</p>
              <p>Filterable: {colorAttribute.is_filterable ? '✅ Yes' : '❌ No'}</p>
              <p>Options: {colorAttribute.options?.length || 0}</p>
              {colorAttribute.options?.length > 0 && (
                <p>Option values: {colorAttribute.options.map(o => o.value || o.label || o).join(', ')}</p>
              )}
            </div>
          ) : (
            <p className="ml-4 text-red-600">❌ No Color attribute found</p>
          )}
        </div>

        <div>
          <h4 className="font-semibold">All Filterable Attributes:</h4>
          <div className="ml-4">
            {attributes.filter(a => a.is_filterable).map(attr => (
              <div key={attr.id} className="text-sm">
                • {attr.name} ({attr.code}) - {attr.options?.length || 0} options
              </div>
            ))}
          </div>
        </div>

        {sampleProduct && (
          <div>
            <h4 className="font-semibold">Sample Product Attributes:</h4>
            <div className="ml-4">
              <p>Product: {sampleProduct.name}</p>
              <p>Has attributes field: {sampleProduct.attributes ? '✅ Yes' : '❌ No'}</p>
              <p>Has attribute_values field: {sampleProduct.attribute_values ? '✅ Yes' : '❌ No'}</p>
              {sampleProduct.attributes && (
                <div className="text-sm mt-2">
                  <p>Attribute keys: {Object.keys(sampleProduct.attributes).join(', ') || 'None'}</p>
                  {Object.keys(sampleProduct.attributes).includes('color') && (
                    <p>Color value: {sampleProduct.attributes.color}</p>
                  )}
                  {Object.keys(sampleProduct.attributes).includes('Color') && (
                    <p>Color value: {sampleProduct.attributes.Color}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>This debug tool helps identify why Color attribute isn't showing in layered navigation.</p>
          <p>Remove this component once the issue is resolved.</p>
          {attributes.length === 0 && (
            <button 
              onClick={clearAttributeCache}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              🔄 Clear Cache & Reload
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}