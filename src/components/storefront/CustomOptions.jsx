import React, { useState, useEffect } from 'react';
import { CustomOptionRule, Product } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomOptions({ product, onSelectionChange, selectedOptions = [], store, settings }) {
    const [customOptions, setCustomOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayLabel, setDisplayLabel] = useState('Custom Options');
    const currencySymbol = settings?.currency_symbol || '$';

    useEffect(() => {
        if (product && store?.id) {
            loadCustomOptions();
        }
    }, [product?.id, store?.id]);

    const loadCustomOptions = async () => {
        if (!product || !store?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('🎯 CustomOptions: Loading rules for product:', product.id, 'store:', store.id);

            // Fetch all active custom option rules for the store
            const rules = await CustomOptionRule.filter({ 
                store_id: store.id,
                is_active: true 
            });

            console.log('🎯 CustomOptions: Found rules:', rules.map(r => ({
                id: r.id,
                name: r.name,
                conditions: r.conditions,
                optional_product_ids: r.optional_product_ids
            })));

            // Find applicable rules for this product
            // Only evaluate rules if we have a valid product with an ID
            if (!product || !product.id) {
                console.log('❌ CustomOptions: Invalid product, no rules can apply');
                setCustomOptions([]);
                setLoading(false);
                return;
            }

            const applicableRules = rules.filter(rule => isRuleApplicable(rule, product));
            
            console.log('🎯 CustomOptions: Applicable rules:', applicableRules.map(r => ({
                id: r.id,
                name: r.name,
                conditions: r.conditions
            })));
            
            console.log('🎯 CustomOptions: Current product details:', {
                id: product.id,
                name: product.name,
                sku: product.sku,
                slug: product.slug,
                category_ids: product.category_ids,
                attribute_set_id: product.attribute_set_id
            });

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
                    console.log('🎯 CustomOptions: Loading products with IDs:', rule.optional_product_ids);
                    
                    // Load products individually if $in syntax doesn't work
                    const optionProducts = [];
                    for (const productId of rule.optional_product_ids) {
                        try {
                            const products = await Product.filter({ 
                                id: productId,
                                is_active: true 
                            });
                            if (products && products.length > 0) {
                                const product = products[0];
                                // Only include if it's marked as a custom option
                                if (product.is_custom_option) {
                                    optionProducts.push(product);
                                }
                            }
                        } catch (productError) {
                            console.warn(`Failed to load custom option product ${productId}:`, productError);
                        }
                    }

                    console.log('🎯 CustomOptions: Loaded option products:', optionProducts.map(p => ({
                        id: p.id,
                        name: p.name,
                        sku: p.sku,
                        is_custom_option: p.is_custom_option
                    })));
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
        }
    };

    const isRuleApplicable = (rule, product) => {
        console.log('🔍 Evaluating rule applicability:', {
            ruleName: rule.name,
            productId: product.id,
            productSku: product.sku,
            conditions: rule.conditions
        });

        // Check if rule has valid conditions
        if (!rule.conditions || Object.keys(rule.conditions).length === 0) {
            console.log('❌ Rule does not apply: No conditions object defined');
            return false;
        }

        // Additional check: ensure at least one condition has actual values
        const { categories, attribute_sets, skus, attribute_conditions } = rule.conditions;
        const hasValidCategories = categories && Array.isArray(categories) && categories.length > 0;
        const hasValidAttributeSets = attribute_sets && Array.isArray(attribute_sets) && attribute_sets.length > 0;
        const hasValidSkus = skus && Array.isArray(skus) && skus.length > 0;
        const hasValidAttributeConditions = attribute_conditions && Array.isArray(attribute_conditions) && attribute_conditions.length > 0;

        if (!hasValidCategories && !hasValidAttributeSets && !hasValidSkus && !hasValidAttributeConditions) {
            console.log('❌ Rule does not apply: No valid condition values found', {
                categories: categories,
                attribute_sets: attribute_sets,
                skus: skus,
                attribute_conditions: attribute_conditions
            });
            return false;
        }

        let hasAnyCondition = false;

        // Check category conditions
        if (categories && Array.isArray(categories) && categories.length > 0) {
            hasAnyCondition = true;
            const productCategories = product.category_ids || [];
            const hasMatchingCategory = categories.some(catId => productCategories.includes(catId));
            console.log('🔍 Category check:', {
                ruleCategories: categories,
                productCategories,
                match: hasMatchingCategory
            });
            if (hasMatchingCategory) {
                console.log('✅ Rule applies: Category match');
                return true;
            }
        }

        // Check attribute set conditions
        if (attribute_sets && Array.isArray(attribute_sets) && attribute_sets.length > 0) {
            hasAnyCondition = true;
            const match = attribute_sets.includes(product.attribute_set_id);
            console.log('🔍 Attribute set check:', {
                ruleAttributeSets: attribute_sets,
                productAttributeSet: product.attribute_set_id,
                match
            });
            if (match) {
                console.log('✅ Rule applies: Attribute set match');
                return true;
            }
        }

        // Check SKU conditions
        if (skus && Array.isArray(skus) && skus.length > 0) {
            hasAnyCondition = true;
            const match = skus.includes(product.sku);
            console.log('🔍 SKU check:', {
                ruleSKUs: skus,
                productSKU: product.sku,
                match
            });
            if (match) {
                console.log('✅ Rule applies: SKU match');
                return true;
            }
        }

        // Check attribute conditions
        if (attribute_conditions && Array.isArray(attribute_conditions) && attribute_conditions.length > 0) {
            hasAnyCondition = true;
            for (const condition of attribute_conditions) {
                const productValue = product[condition.attribute_code];
                const match = productValue && productValue.toString() === condition.attribute_value.toString();
                console.log('🔍 Attribute condition check:', {
                    attributeCode: condition.attribute_code,
                    expectedValue: condition.attribute_value,
                    productValue,
                    match
                });
                if (match) {
                    console.log('✅ Rule applies: Attribute condition match');
                    return true;
                }
            }
        }

        // If no valid conditions were found, rule does not apply
        if (!hasAnyCondition) {
            console.log('❌ Rule does not apply: No valid conditions found');
            return false;
        }

        console.log('❌ Rule does not apply: No conditions matched');
        return false;
    };

    const handleOptionToggle = (option) => {
        const isSelected = selectedOptions.some(selected => selected.product_id === option.id);
        
        let newSelectedOptions;
        if (isSelected) {
            // Remove option
            newSelectedOptions = selectedOptions.filter(selected => selected.product_id !== option.id);
        } else {
            // Add option with price info
            const optionPrice = option.sale_price || option.price || 0;
            newSelectedOptions = [...selectedOptions, {
                product_id: option.id,
                name: option.name,
                price: parseFloat(optionPrice)
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
                    const optionPrice = option.sale_price || option.price || 0;
                    
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
                                            <Badge variant={isSelected ? "default" : "outline"} className="font-semibold">
                                                +{currencySymbol}{parseFloat(optionPrice).toFixed(2)}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    {option.images && option.images.length > 0 && (
                                        <div className="mt-3">
                                            <img 
                                                src={option.images[0]} 
                                                alt={option.name}
                                                className="w-16 h-16 object-cover rounded-md"
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
                        <span className="text-lg">{currencySymbol}{getTotalOptionsPrice().toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}