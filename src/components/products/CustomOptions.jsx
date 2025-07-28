import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function CustomOptions({ 
  product, 
  applicableOptionalProducts, 
  selectedCustomOptions, 
  onOptionToggle, 
  customOptionsLabel, 
  settings 
}) {
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    setSelectedOptions(selectedCustomOptions || []);
  }, [selectedCustomOptions]);

  const handleOptionChange = (option, checked) => {
    // Use lower price if compare_price exists and is different
    let optionPrice = parseFloat(option.price || 0);
    if (option.compare_price && parseFloat(option.compare_price) > 0 && parseFloat(option.compare_price) !== parseFloat(option.price)) {
      optionPrice = Math.min(parseFloat(option.price), parseFloat(option.compare_price));
    }
    
    const newOption = {
      id: option.id,
      name: option.name,
      price: optionPrice,
      quantity: checked ? 1 : 0,
      selected: checked
    };

    if (onOptionToggle) {
      onOptionToggle(newOption);
    }
  };

  const getTotalPrice = () => {
    return selectedOptions.reduce((total, option) => {
      return total + ((option.price || 0) * (option.quantity || 0));
    }, 0);
  };

  if (!applicableOptionalProducts || applicableOptionalProducts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{customOptionsLabel || 'Custom Options'}</CardTitle>
        <p className="text-sm text-gray-600">
          Select additional options for this product.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {applicableOptionalProducts.map((option) => (
            <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`option_${option.id}`}
                  checked={selectedOptions.some(selected => selected.id === option.id)}
                  onCheckedChange={(checked) => handleOptionChange(option, checked)}
                />
                <div>
                  <Label htmlFor={`option_${option.id}`} className="font-medium cursor-pointer">
                    {option.name}
                  </Label>
                  {option.short_description && (
                    <p className="text-sm text-gray-500">{option.short_description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {option.compare_price && parseFloat(option.compare_price) > 0 && parseFloat(option.compare_price) !== parseFloat(option.price) ? (
                  <div>
                    <span className="font-semibold text-red-600">
                      {settings?.hide_currency_product ? '' : '$'}{(() => {
                        const minPrice = Math.min(parseFloat(option.price || 0), parseFloat(option.compare_price || 0));
                        return isNaN(minPrice) ? '0.00' : minPrice.toFixed(2);
                      })()}
                    </span>
                    <div className="text-sm text-gray-500 line-through">
                      {settings?.hide_currency_product ? '' : '$'}{(() => {
                        const maxPrice = Math.max(parseFloat(option.price || 0), parseFloat(option.compare_price || 0));
                        return isNaN(maxPrice) ? '0.00' : maxPrice.toFixed(2);
                      })()}
                    </div>
                  </div>
                ) : (
                  <span className="font-semibold">
                    {settings?.hide_currency_product ? '' : '$'}{(() => {
                      const price = parseFloat(option.price || 0);
                      return isNaN(price) ? '0.00' : price.toFixed(2);
                    })()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedOptions.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Selected Custom Options:</h4>
            <div className="space-y-1">
              {selectedOptions.map((option) => (
                <div key={option.id} className="flex justify-between text-sm">
                  <span>{option.name}</span>
                  <span>
                    {settings?.hide_currency_product ? '' : '$'}{(() => {
                      const price = parseFloat(option.price || 0);
                      return isNaN(price) ? '0.00' : price.toFixed(2);
                    })()}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total Custom Options:</span>
                <span>
                  {settings?.hide_currency_product ? '' : '$'}{getTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}