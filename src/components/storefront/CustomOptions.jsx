import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';

export default function CustomOptions({ customOptions, selectedOptions, onOptionsChange }) {
    console.log('CustomOptions component rendered with:', { customOptions, selectedOptions });

    if (!customOptions || customOptions.length === 0) {
        console.log('CustomOptions: No custom options available');
        return null;
    }

    const handleOptionToggle = (option) => {
        const isSelected = selectedOptions.some(selected => selected.product_id === option.id);
        
        if (isSelected) {
            // Remove option
            onOptionsChange(selectedOptions.filter(selected => selected.product_id !== option.id));
        } else {
            // Add option
            onOptionsChange([...selectedOptions, {
                product_id: option.id,
                name: option.name,
                price: option.price || 0
            }]);
        }
    };

    const getTotalOptionsPrice = () => {
        return selectedOptions.reduce((total, option) => total + (option.price || 0), 0);
    };

    return (
        <div className="space-y-4">
            {customOptions.map(option => {
                const isSelected = selectedOptions.some(selected => selected.product_id === option.id);
                
                return (
                    <div 
                        key={option.id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleOptionToggle(option)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                }`}>
                                    {isSelected && (
                                        <Plus className="w-3 h-3 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{option.name}</h4>
                                    {option.short_description && (
                                        <p className="text-sm text-gray-600">{option.short_description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant={isSelected ? "default" : "outline"}>
                                    +${(option.price || 0).toFixed(2)}
                                </Badge>
                            </div>
                        </div>
                        
                        {option.image && option.image.length > 0 && (
                            <div className="mt-3">
                                <img 
                                    src={option.image[0]} 
                                    alt={option.name}
                                    className="w-16 h-16 object-cover rounded"
                                />
                            </div>
                        )}
                    </div>
                );
            })}
            
            {selectedOptions.length > 0 && (
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center font-medium">
                        <span>Total Additional Options:</span>
                        <span>${getTotalOptionsPrice().toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}