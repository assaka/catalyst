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

export default function LayeredNavigation({
    products,
    attributes,
    onFilterChange,
    showActiveFilters = true,
    slotConfig = {},
    settings = {}
}) {
    const [selectedFilters, setSelectedFilters] = useState({});
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [expandedAttributes, setExpandedAttributes] = useState({});

    // Extract slot configurations for styling
    const {
        filter_card_header = {},
        filter_clear_all_button = {},
        filter_active_filters = {},
        filter_active_filters_label = {},
        filter_price_section = {},
        filter_price_title = {},
        filter_attribute_section = {},
        filter_attribute_title = {},
        filter_attribute_option = {},
        filter_option_checkbox = {},
        filter_option_label = {},
        filter_option_count = {}
    } = slotConfig;

    // Extract store settings with defaults
    const enableProductFilters = settings.enable_product_filters !== false; // Default to true
    const collapseFilters = settings.collapse_filters === true;
    const maxVisibleAttributes = settings.max_visible_attributes || 5;




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
                                    extractedValue = val.value || val.label || val.name;
                                }
                                if (extractedValue && extractedValue !== '[object Object]') {
                                    values.add(String(extractedValue));
                                }
                            });
                        } else {
                            // Extract value from object if needed
                            let extractedValue = attributeValue;
                            if (typeof attributeValue === 'object' && attributeValue !== null) {
                                extractedValue = attributeValue.value || attributeValue.label || attributeValue.name;
                            }
                            if (extractedValue && extractedValue !== '[object Object]') {
                                values.add(String(extractedValue));
                            }
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

                // Only include attributes that have values with products
                if (values.size > 0) {
                    const sortedValues = Array.from(values).sort();

                    // Filter out values that have no products
                    const valuesWithProducts = sortedValues.filter(value => {
                        const productCount = products.filter(p => {
                            const productAttributes = p.attributes || p.attribute_values || {};

                            // Try multiple possible keys for the attribute
                            const possibleKeys = [
                                attr.code,
                                attr.name,
                                attr.code?.toLowerCase(),
                                attr.name?.toLowerCase(),
                                attr.code?.toLowerCase().replace(/[_-\s]/g, ''),
                                attr.name?.toLowerCase().replace(/[_-\s]/g, ''),
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

                            // Extract value from object if needed
                            let extractedValue = attributeValue;
                            if (typeof attributeValue === 'object' && attributeValue !== null) {
                                if (Array.isArray(attributeValue)) {
                                    // For arrays, check if any value matches
                                    return attributeValue.some(val => {
                                        const valToCheck = typeof val === 'object' && val !== null
                                            ? (val.value || val.label || val.name)
                                            : val;
                                        return valToCheck && String(valToCheck) === String(value);
                                    });
                                } else {
                                    extractedValue = attributeValue.value || attributeValue.label || attributeValue.name;
                                }
                            }

                            return extractedValue && String(extractedValue) === String(value);
                        }).length;

                        return productCount > 0;
                    });

                    // Only include this attribute if it has values with products
                    if (valuesWithProducts.length > 0) {
                        options[attr.code] = {
                            name: attr.name,
                            values: valuesWithProducts
                        };
                    }
                }
            }
        });

        return options;
    }, [products, attributes]);

    // Don't render if filters are disabled
    if (!enableProductFilters) {
        return null;
    }

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
                    <CardTitle
                        className={filter_card_header.className}
                        style={filter_card_header.styles || {}}
                    >
                        {filter_card_header.content || "Filter By"}
                    </CardTitle>
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFilters}
                            className={filter_clear_all_button.className || "text-xs"}
                            style={filter_clear_all_button.styles || {}}
                        >
                            {filter_clear_all_button.content || "Clear All"}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Active Filters - below Filter By title */}
                {showActiveFilters && hasActiveFilters && (
                    <div
                        className={filter_active_filters.className || "mb-4 p-2"}
                        style={filter_active_filters.styles || {}}
                    >
                        <div className="flex flex-wrap items-center">
                            {(() => {
                                const activeFilterElements = [];

                                // Add active attribute filters
                                Object.entries(selectedFilters).forEach(([filterKey, filterValues]) => {
                                    if (filterKey !== 'priceRange' && Array.isArray(filterValues)) {
                                        filterValues.forEach(value => {
                                            activeFilterElements.push(
                                                <span
                                                    key={`${filterKey}-${value}`}
                                                    className="inline-flex items-center px-2 rounded-full text-xs bg-blue-100 text-blue-800 mr-2 mb-2"
                                                >
                                                    {filterKey}: {value}
                                                    <button
                                                        onClick={() => {
                                                            const newValues = filterValues.filter(v => v !== value);
                                                            const newFilters = { ...selectedFilters };
                                                            if (newValues.length > 0) {
                                                                newFilters[filterKey] = newValues;
                                                            } else {
                                                                delete newFilters[filterKey];
                                                            }
                                                            setSelectedFilters(newFilters);
                                                        }}
                                                        className="text-xl ml-2 text-blue-600 hover:text-blue-800"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        });
                                    }
                                });

                                // Add price range filter if active
                                if (priceRange[0] !== minPrice || priceRange[1] !== maxPrice) {
                                    const [min, max] = priceRange;
                                    activeFilterElements.push(
                                        <span
                                            key="price-range"
                                            className="inline-flex items-center px-2 rounded-full text-xs bg-green-100 text-green-800 mr-2 mb-2"
                                        >
                                            Price: ${min} - ${max}
                                            <button
                                                onClick={() => {
                                                    setPriceRange([minPrice, maxPrice]);
                                                }}
                                                className="text-xl ml-2 text-green-600 hover:text-green-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    );
                                }

                                return activeFilterElements;
                            })()}
                        </div>
                    </div>
                )}
                <Accordion
                    type="multiple"
                    defaultValue={collapseFilters ? [] : ['price', ...Object.keys(filterOptions)]}
                    className="w-full"
                >
                    {/* FIXED: Price Slider */}
                    <AccordionItem value="price">
                        <AccordionTrigger
                            className={filter_price_title.className || "font-semibold"}
                            style={filter_price_title.styles || {}}
                        >
                            {filter_price_title.content || "Price"}
                        </AccordionTrigger>
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
                    {Object.entries(filterOptions).map(([code, { name, values }]) => {
                        // Only render attribute sections that have values
                        if (!values || values.length === 0) {
                            return null;
                        }

                        return (
                            <AccordionItem key={code} value={code}>
                                <AccordionTrigger
                                    className={filter_attribute_title.className || "font-semibold"}
                                    style={filter_attribute_title.styles || {}}
                                >
                                    {name}
                                </AccordionTrigger>
                                <AccordionContent>
                                <div
                                    className={filter_attribute_section.className || "space-y-2"}
                                    style={filter_attribute_section.styles || {}}
                                >
                                    {(() => {
                                        const isExpanded = expandedAttributes[code];
                                        const visibleValues = isExpanded ? values : values.slice(0, maxVisibleAttributes);
                                        const hasMoreValues = values.length > maxVisibleAttributes;

                                        return (
                                            <>
                                                <div className={hasMoreValues && !isExpanded ? "max-h-48 overflow-hidden" : "max-h-48 overflow-y-auto"}>
                                                    {visibleValues.map(value => {
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
                                                            ? (val.value || val.label || val.name)
                                                            : val;
                                                        return valToCheck && String(valToCheck) === String(value);
                                                    });
                                                } else {
                                                    extractedValue = attributeValue.value || attributeValue.label || attributeValue.name;
                                                }
                                            }

                                            return extractedValue && String(extractedValue) === String(value);
                                        }).length;

                                        // Only render if there are products with this attribute value
                                        if (productCount === 0) {
                                            return null;
                                        }

                                        return (
                                            <div
                                                key={value}
                                                className={filter_attribute_option.className || "flex items-center justify-between"}
                                                style={filter_attribute_option.styles || {}}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`attr-${code}-${value}`}
                                                        checked={selectedFilters[code]?.includes(value) || false}
                                                        onCheckedChange={(checked) => handleAttributeChange(code, value, checked)}
                                                        className={filter_option_checkbox.className || ""}
                                                        style={filter_option_checkbox.styles || {}}
                                                    />
                                                    <Label
                                                        htmlFor={`attr-${code}-${value}`}
                                                        className={filter_option_label.className || "text-sm"}
                                                        style={filter_option_label.styles || {}}
                                                    >
                                                        {value}
                                                    </Label>
                                                </div>
                                                <span
                                                    className={filter_option_count.className || "text-xs text-gray-400"}
                                                    style={filter_option_count.styles || {}}
                                                >
                                                    ({productCount})
                                                </span>
                                            </div>
                                        );
                                    })}
                                                </div>
                                                {hasMoreValues && (
                                                    <button
                                                        onClick={() => setExpandedAttributes(prev => ({
                                                            ...prev,
                                                            [code]: !prev[code]
                                                        }))}
                                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
                                                    >
                                                        {isExpanded ? 'Show Less' : `Show More (${values.length - maxVisibleAttributes} more)`}
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}