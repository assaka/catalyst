import React, { useState, useEffect } from 'react';
import { CustomOptionRule } from '@/api/entities';
import { StorefrontProduct } from '@/api/storefront-entities';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDisplayPrice } from '@/utils/priceUtils';
import { useStore } from '@/components/storefront/StoreProvider';

export default function CustomOptions({ product, onSelectionChange, selectedOptions = [], store, settings }) {
    const { taxes, selectedCountry } = useStore();
    const [customOptions, setCustomOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayLabel, setDisplayLabel] = useState('Custom Options');
    const [isLoading, setIsLoading] = useState(false); // Prevent duplicate loading
    const currencySymbol = settings?.currency_symbol || '$';

    useEffect(() => {
        if (product && store?.id && !isLoading) {
            loadCustomOptions();
        }
    }, [product?.id, store?.id]);

    const loadCustomOptions = async () => {
        if (!product || !store?.id || isLoading) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setIsLoading(true);
            
            // Fetch all active custom option rules for the store
            
            let rules = [];
            try {
                rules = await CustomOptionRule.filter({ 
                    store_id: store.id,
                    is_active: true 
                });
            } catch (apiError) {
                console.error('CustomOptions: API call failed:', apiError);
                setCustomOptions([]);
                setLoading(false);
                return;
            }

            // Find applicable rules for this product
            // Only evaluate rules if we have a valid product with an ID
            if (!product || !product.id) {
                setCustomOptions([]);
                setLoading(false);
                return;
            }

            const applicableRules = rules.filter(rule => isRuleApplicable(rule, product));

            if (applicableRules.length === 0) {
                setCustomOptions([]);
                setLoading(false);
                return;
            }

            // Use the first applicable rule (you could enhance this to merge multiple rules)
            const rule = applicableRules[0];
            setDisplayLabel(rule.display_label || 'Custom Options');

            // Load the custom option products
            if (rule.optional_product_ids && rule.optional_product_ids.length > 0) {
                try {
                    // Load products individually if $in syntax doesn't work
                    const optionProducts = [];
                    for (const productId of rule.optional_product_ids) {
                        // Skip if this is the current product being viewed
                        if (productId === product.id) {
                            continue;
                        }
                        
                        try {
                            const products = await StorefrontProduct.filter({ 
                                id: productId,
                                status: 'active'
                            });
                            if (products && products.length > 0) {
                                const customOptionProduct = products[0];
                                // Only include if it's marked as a custom option
                                if (customOptionProduct.is_custom_option) {
                                    optionProducts.push(customOptionProduct);
                                }
                            }
                        } catch (productError) {
                            console.error(`Failed to load custom option product ${productId}:`, productError);
                        }
                    }

                    setCustomOptions(optionProducts);
                } catch (error) {
                    console.error('Error loading custom option products:', error);
                    setCustomOptions([]);
                }
            } else {
                setCustomOptions([]);
            }
        } catch (error) {
            console.error('Error loading custom options:', error);
            setCustomOptions([]);
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    };

    const isRuleApplicable = (rule, product) => {
        console.log('🔍 CustomOptions: Checking rule:', rule.name, 'for product:', product.sku);

        // Parse conditions if they're a string
        let conditions;
        try {
            conditions = typeof rule.conditions === 'string'
                ? JSON.parse(rule.conditions)
                : rule.conditions;
        } catch (e) {
            console.error('Failed to parse conditions:', e);
            return false;
        }

        console.log('🔍 CustomOptions: Parsed conditions:', conditions);

        // Check if rule has valid conditions
        if (!conditions || Object.keys(conditions).length === 0) {
            console.log('❌ No valid conditions');
            return false;
        }

        // Additional check: ensure at least one condition has actual values
        const { categories, attribute_sets, skus, attribute_conditions } = conditions;
        const hasValidCategories = categories && Array.isArray(categories) && categories.length > 0;
        const hasValidAttributeSets = attribute_sets && Array.isArray(attribute_sets) && attribute_sets.length > 0;
        const hasValidSkus = skus && Array.isArray(skus) && skus.length > 0;
        const hasValidAttributeConditions = attribute_conditions && Array.isArray(attribute_conditions) && attribute_conditions.length > 0;

        if (!hasValidCategories && !hasValidAttributeSets && !hasValidSkus && !hasValidAttributeConditions) {
            console.log('❌ No valid condition arrays');
            return false;
        }

        let hasAnyCondition = false;

        // Check category conditions
        if (categories && Array.isArray(categories) && categories.length > 0) {
            hasAnyCondition = true;
            const productCategories = product.category_ids || [];
            console.log('🔍 Checking categories:', categories, 'against product categories:', productCategories);
            const hasMatchingCategory = categories.some(catId => productCategories.includes(catId));
            if (hasMatchingCategory) {
                console.log('✅ Rule matches by category');
                return true;
            }
        }

        // Check attribute set conditions
        if (attribute_sets && Array.isArray(attribute_sets) && attribute_sets.length > 0) {
            hasAnyCondition = true;
            console.log('🔍 Checking attribute sets:', attribute_sets, 'against product attribute_set_id:', product.attribute_set_id);
            const match = attribute_sets.includes(product.attribute_set_id);
            if (match) {
                console.log('✅ Rule matches by attribute set');
                return true;
            }
        }

        // Check SKU conditions
        if (skus && Array.isArray(skus) && skus.length > 0) {
            hasAnyCondition = true;
            console.log('🔍 Checking SKUs:', skus, 'against product SKU:', product.sku);
            const match = skus.includes(product.sku);
            if (match) {
                console.log('✅ Rule matches by SKU');
                return true;
            }
        }

        // Check attribute conditions
        if (attribute_conditions && Array.isArray(attribute_conditions) && attribute_conditions.length > 0) {
            hasAnyCondition = true;
            for (const condition of attribute_conditions) {
                const productValue = product[condition.attribute_code];
                const match = productValue && productValue.toString() === condition.attribute_value.toString();
                if (match) {
                    return true;
                }
            }
        }

        // If no valid conditions were found, rule does not apply
        if (!hasAnyCondition) {
            return false;
        }

        return false;
    };

    const handleOptionToggle = (option) => {
        const isSelected = selectedOptions.some(selected => selected.product_id === option.id);
        
        let newSelectedOptions;
        if (isSelected) {
            // Remove option
            newSelectedOptions = selectedOptions.filter(selected => selected.product_id !== option.id);
        } else {
            // Add option with price info - use lower price if compare_price exists
            let optionPrice = parseFloat(option.price || 0);
            if (option.compare_price && parseFloat(option.compare_price) > 0 && parseFloat(option.compare_price) !== parseFloat(option.price)) {
                optionPrice = Math.min(parseFloat(option.price), parseFloat(option.compare_price));
            }
            newSelectedOptions = [...selectedOptions, {
                product_id: option.id,
                name: option.name,
                price: optionPrice
            }];
        }
        
        onSelectionChange(newSelectedOptions);
    };

    const getTotalOptionsPrice = () => {
        return selectedOptions.reduce((total, option) => total + (parseFloat(option.price) || 0), 0);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }

    if (!customOptions || customOptions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">{displayLabel}</h3>
            <div className="space-y-3">
                {customOptions.map(option => {
                    const isSelected = selectedOptions.some(selected => selected.product_id === option.id);
                    
                    // Calculate display prices
                    const hasSpecialPrice = option.compare_price && parseFloat(option.compare_price) > 0 && parseFloat(option.compare_price) !== parseFloat(option.price);
                    const displayPrice = hasSpecialPrice ? Math.min(parseFloat(option.price || 0), parseFloat(option.compare_price || 0)) : parseFloat(option.price || 0);
                    const originalPrice = hasSpecialPrice ? Math.max(parseFloat(option.price || 0), parseFloat(option.compare_price || 0)) : null;
                    
                    return (
                        <div 
                            key={option.id} 
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                isSelected 
                                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                            onClick={() => handleOptionToggle(option)}
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                }`}>
                                    {isSelected && (
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{option.name}</h4>
                                            {option.short_description && (
                                                <p className="text-sm text-gray-600 mt-1">{option.short_description}</p>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            {hasSpecialPrice ? (
                                                <div className="text-right">
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant={isSelected ? "default" : "outline"} className="font-semibold bg-red-100 text-red-800 border-red-300">
                                                            +{formatDisplayPrice(displayPrice, currencySymbol, store, taxes, selectedCountry)}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-gray-500 line-through mt-1">
                                                        +{formatDisplayPrice(originalPrice, currencySymbol, store, taxes, selectedCountry)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Badge variant={isSelected ? "default" : "outline"} className="font-semibold">
                                                    +{formatDisplayPrice(displayPrice, currencySymbol, store, taxes, selectedCountry)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {option.images && option.images.length > 0 && (
                                        <div className="mt-3">
                                            <img
                                                src={
                                                    typeof option.images[0] === 'string'
                                                        ? option.images[0]
                                                        : option.images[0]?.url || option.images[0]?.src || 'https://placehold.co/64x64?text=No+Image'
                                                }
                                                alt={option.name}
                                                className="w-16 h-16 object-cover rounded-md"
                                                onError={(e) => {
                                                    e.target.src = 'https://placehold.co/64x64?text=No+Image';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {selectedOptions.length > 0 && (
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center font-medium text-gray-700">
                        <span>Total Additional Options:</span>
                        <span className="text-lg">{formatDisplayPrice(getTotalOptionsPrice(), currencySymbol, store, taxes, selectedCountry)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}