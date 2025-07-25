import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OptionalProducts({ products, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!products || products.length === 0) {
    return null;
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-xl font-semibold mb-4">Optional Add-ons</h3>
      
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search for add-ons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="space-y-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <img 
                src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                alt={product.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-gray-600">${parseFloat(product.price || 0).toFixed(2)}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onAdd(product)}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        ))}
        {filteredProducts.length === 0 && searchTerm && (
          <p className="text-gray-500 text-center py-4">No matching add-ons found.</p>
        )}
      </div>
    </div>
  );
}