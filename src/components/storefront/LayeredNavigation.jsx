import React, { useState, useMemo, useEffect } from 'react';
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

    // FIXED: Calculate price range from products
    const { minPrice, maxPrice } = useMemo(() => {
        if (!products || products.length === 0) return { minPrice: 0, maxPrice: 1000 };
        
        const prices = products.map(p => parseFloat(p.price || 0)).filter(p => p > 0);
        if (prices.length === 0) return { minPrice: 0, maxPrice: 1000 };
        
        return {
            minPrice: Math.floor(Math.min(...prices)),
            maxPrice: Math.ceil(Math.max(...prices))
        };
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

    // FIXED: Extract ALL attribute values from products including all options
    const filterOptions = useMemo(() => {
        if (!products || !attributes) return {};
        
        const options = {};
        attributes.forEach(attr => {
            if (attr.is_filterable) {
                const values = new Set();
                
                // Add values from products
                products.forEach(p => {
                    const productAttributes = p.attributes || p.attribute_values || {};
                    const attributeValue = productAttributes[attr.code] || 
                                         productAttributes[attr.name] || 
                                         p[attr.code] || 
                                         p[attr.name];
                    
                    if (attributeValue !== undefined && attributeValue !== null && attributeValue !== '') {
                        if (Array.isArray(attributeValue)) {
                            attributeValue.forEach(val => {
                                if (val) values.add(String(val));
                            });
                        } else {
                            values.add(String(attributeValue));
                        }
                    }
                });
                
                // FIXED: Also add predefined options from attribute definition
                if (attr.options && Array.isArray(attr.options)) {
                    attr.options.forEach(option => {
                        if (option.value && option.value !== '') {
                            values.add(String(option.value));
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
                <CardTitle>Filter By</CardTitle>
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
                                        onValueChange={setPriceRange}
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
                                    {values.map(value => (
                                        <div key={value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`attr-${code}-${value}`}
                                                checked={selectedFilters[code]?.includes(value) || false}
                                                onCheckedChange={(checked) => handleAttributeChange(code, value, checked)}
                                            />
                                            <Label htmlFor={`attr-${code}-${value}`} className="text-sm">
                                                {value}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}