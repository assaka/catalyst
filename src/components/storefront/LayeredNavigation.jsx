import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LayeredNavigation({ products, attributes, onFilterChange }) {
    const [selectedFilters, setSelectedFilters] = useState({});
    const [priceRange, setPriceRange] = useState([0, 1000]);




    // FIXED: Calculate price range from products considering compare_price
    const { minPrice, maxPrice } = useMemo(() => {
        if (!products || products.length === 0) return { minPrice: 0, maxPrice: 1000 };
        
        const prices = [];
        products.forEach(p => {
            const price = parseFloat(p.price || 0);
            if (price > 0) prices.push(price);
            
            // Also consider compare_price if it exists and is different
            const comparePrice = parseFloat(p.compare_price || 0);
            if (comparePrice > 0 && comparePrice !== price) {
                prices.push(comparePrice);
            }
        });
        
        if (prices.length === 0) return { minPrice: 0, maxPrice: 1000 };
        
        const calculatedRange = {
            minPrice: Math.floor(Math.min(...prices)),
            maxPrice: Math.ceil(Math.max(...prices))
        };
        
        return calculatedRange;
    }, [products]);

    // Initialize price range when products change
    useEffect(() => {
        setPriceRange([minPrice, maxPrice]);
    }, [minPrice, maxPrice]);

    // FIXED: Send filters when they change
    useEffect(() => {
        const filtersToSend = { ...selectedFilters };
        
        // Only add price range if it's different from the full range
        if (priceRange[0] !== minPrice || priceRange[1] !== maxPrice) {
            filtersToSend.priceRange = priceRange;
        }
        
        
        onFilterChange(filtersToSend);
    }, [selectedFilters, priceRange, minPrice, maxPrice, onFilterChange]);
    
    const handleAttributeChange = (attributeCode, value, checked) => {
        setSelectedFilters(prev => {
            const newFilters = { ...prev };
            const currentValues = newFilters[attributeCode] || [];
            if (checked) {
                newFilters[attributeCode] = [...currentValues, value];
            } else {
                newFilters[attributeCode] = currentValues.filter(v => v !== value);
                if (newFilters[attributeCode].length === 0) {
                    delete newFilters[attributeCode];
                }
            }
            return newFilters;
        });
    };

    // Clear all filters function
    const clearAllFilters = () => {
        setSelectedFilters({});
        setPriceRange([minPrice, maxPrice]);
    };

    // Handle price range change with debugging
    const handlePriceRangeChange = (newRange) => {
        setPriceRange(newRange);
    };

    // Check if any filters are active
    const hasActiveFilters = Object.keys(selectedFilters).length > 0 || 
                           (priceRange[0] !== minPrice || priceRange[1] !== maxPrice);

    // FIXED: Extract ALL attribute values from products including all options
    const filterOptions = useMemo(() => {
        if (!products || !attributes) {
            return {};
        }
        
        const options = {};
        attributes.forEach(attr => {
            if (attr.is_filterable) {
                const values = new Set();
                
                // Add values from products - try multiple possible attribute keys
                products.forEach(p => {
                    const productAttributes = p.attributes || p.attribute_values || {};
                    
                    // Try multiple possible keys for the attribute (expanded list)
                    const possibleKeys = [
                        attr.code,
                        attr.name,
                        attr.code?.toLowerCase(),
                        attr.name?.toLowerCase(),
                        // Add more variations for color specifically
                        attr.code?.toLowerCase().replace(/[_-\s]/g, ''),
                        attr.name?.toLowerCase().replace(/[_-\s]/g, ''),
                        // Common color attribute variations
                        'color', 'Color', 'COLOR',
                        'colour', 'Colour', 'COLOUR'
                    ].filter(Boolean);
                    
                    let attributeValue = null;
                    for (const key of possibleKeys) {
                        if (key && (productAttributes[key] !== undefined || p[key] !== undefined)) {
                            attributeValue = productAttributes[key] || p[key];
                            break;
                        }
                    }

                    if (attributeValue !== undefined && attributeValue !== null && attributeValue !== '') {
                        if (Array.isArray(attributeValue)) {
                            attributeValue.forEach(val => {
                                // Extract value from object if needed
                                let extractedValue = val;
                                if (typeof val === 'object' && val !== null) {
                                    extractedValue = val.value || val.label || val.name || String(val);
                                }
                                if (extractedValue) values.add(String(extractedValue));
                            });
                        } else {
                            // Extract value from object if needed
                            let extractedValue = attributeValue;
                            if (typeof attributeValue === 'object' && attributeValue !== null) {
                                extractedValue = attributeValue.value || attributeValue.label || attributeValue.name || String(attributeValue);
                            }
                            values.add(String(extractedValue));
                        }
                    }
                });
                
                // FIXED: Also add predefined options from attribute definition
                if (attr.options && Array.isArray(attr.options)) {
                    attr.options.forEach(option => {
                        // Handle different option formats
                        const optionValue = option.value || option.label || option;
                        if (optionValue && optionValue !== '') {
                            values.add(String(optionValue));
                        }
                    });
                }

                if (values.size > 0) {
                    options[attr.code] = {
                        name: attr.name,
                        values: Array.from(values).sort()
                    };
                }
            }
        });

        return options;
    }, [products, attributes]);

    if (!products || products.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Filter By</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">No products to filter</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center h-5">
                    <CardTitle>Filter By</CardTitle>
                    {hasActiveFilters && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearAllFilters}
                            className="text-xs"
                        >
                            Clear All
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={['price', ...Object.keys(filterOptions)]} className="w-full">
                    {/* FIXED: Price Slider */}
                    <AccordionItem value="price">
                        <AccordionTrigger className="font-semibold">Price</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4">
                                <div className="px-2">
                                    <Slider
                                        min={minPrice}
                                        max={maxPrice}
                                        step={1}
                                        value={priceRange}
                                        onValueChange={handlePriceRangeChange}
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>${priceRange[0]}</span>
                                    <span>${priceRange[1]}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Min: ${minPrice}</span>
                                    <span>Max: ${maxPrice}</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* FIXED: Attribute Filters with all options */}
                    {Object.entries(filterOptions).map(([code, { name, values }]) => (
                        <AccordionItem key={code} value={code}>
                            <AccordionTrigger className="font-semibold">{name}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {values.map(value => {
                                        // Count products that have this attribute value
                                        const productCount = products.filter(p => {
                                            const productAttributes = p.attributes || p.attribute_values || {};
                                            const attributeValue = productAttributes[code] || p[code];

                                            // Extract value from object if needed
                                            let extractedValue = attributeValue;
                                            if (typeof attributeValue === 'object' && attributeValue !== null) {
                                                if (Array.isArray(attributeValue)) {
                                                    // For arrays, check if any value matches
                                                    return attributeValue.some(val => {
                                                        const valToCheck = typeof val === 'object' && val !== null
                                                            ? (val.value || val.label || val.name || String(val))
                                                            : val;
                                                        return String(valToCheck) === String(value);
                                                    });
                                                } else {
                                                    extractedValue = attributeValue.value || attributeValue.label || attributeValue.name || String(attributeValue);
                                                }
                                            }

                                            return String(extractedValue) === String(value);
                                        }).length;
                                        
                                        return (
                                            <div key={value} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`attr-${code}-${value}`}
                                                        checked={selectedFilters[code]?.includes(value) || false}
                                                        onCheckedChange={(checked) => handleAttributeChange(code, value, checked)}
                                                    />
                                                    <Label htmlFor={`attr-${code}-${value}`} className="text-sm">
                                                        {value}
                                                    </Label>
                                                </div>
                                                <span className="text-xs text-gray-400">({productCount})</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}