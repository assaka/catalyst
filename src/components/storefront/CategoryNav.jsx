import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl, createCategoryUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function CategoryNav({ categories }) {
    const { store } = useStore();

    if (!categories || categories.length === 0 || !store) {
        return null;
    }

    // Build hierarchical tree from flat category list
    const buildCategoryTree = (categories) => {
        const categoryMap = new Map();
        const rootCategories = [];

        // Filter out hidden categories first
        let visibleCategories = categories.filter(c => !c.hide_in_menu);

        // If store has a root category, filter to only show that category tree
        if (store?.settings?.rootCategoryId && store.settings.rootCategoryId !== 'none') {
            const filterCategoryTree = (categoryId, allCategories) => {
                const children = allCategories.filter(c => c.parent_id === categoryId);
                let result = children.slice(); // Copy array
                
                children.forEach(child => {
                    result = result.concat(filterCategoryTree(child.id, allCategories));
                });
                
                return result;
            };
            
            // Include the root category itself and all its descendants
            const rootCategory = visibleCategories.find(c => c.id === store.settings.rootCategoryId);
            if (rootCategory) {
                const descendants = filterCategoryTree(store.settings.rootCategoryId, visibleCategories);
                
                // Check if we should exclude root category from menu
                if (store.settings.excludeRootFromMenu) {
                    visibleCategories = descendants; // Only show descendants, not the root
                } else {
                    visibleCategories = [rootCategory, ...descendants]; // Include root and descendants
                }
            } else {
                // If root category not found, show empty navigation
                console.warn('Root category not found:', store.settings.rootCategoryId);
                visibleCategories = [];
            }
        }

        console.log('👀 Visible categories after filtering:', visibleCategories.map(c => ({
            id: c.id,
            name: c.name,
            parent_id: c.parent_id,
            hide_in_menu: c.hide_in_menu
        })));

        // Create a map of all visible categories
        visibleCategories.forEach(category => {
            categoryMap.set(category.id, { ...category, children: [] });
        });

        // Build the tree structure
        visibleCategories.forEach(category => {
            const categoryNode = categoryMap.get(category.id);
            if (category.parent_id && categoryMap.has(category.parent_id)) {
                // This category has a parent, add it to parent's children
                const parent = categoryMap.get(category.parent_id);
                parent.children.push(categoryNode);
                console.log(`📎 Added child "${category.name}" to parent "${parent.name}"`);
            } else {
                // This is a root category
                rootCategories.push(categoryNode);
                console.log(`🌱 Added root category "${category.name}"`);
            }
        });

        return rootCategories;
    };

    const rootCategories = buildCategoryTree(categories);
    
    // Debug logging for navigation
    console.log('🔧 CategoryNav debug:', {
        totalCategories: categories.length,
        rootCategoryId: store?.settings?.rootCategoryId,
        excludeRootFromMenu: store?.settings?.excludeRootFromMenu,
        rootCategoriesCount: rootCategories.length,
        rootCategories: rootCategories.map(c => ({
            id: c.id,
            name: c.name,
            childrenCount: c.children?.length || 0,
            hasChildren: !!(c.children && c.children.length > 0),
            children: c.children?.map(child => ({ id: child.id, name: child.name })) || []
        }))
    });

    // Render all descendants of a category with proper indentation
    const renderCategoryDescendants = (category, depth = 0) => {
        const items = [];
        
        // Add the category itself
        items.push(
            <DropdownMenuItem key={category.id} asChild>
                <Link 
                    to={createCategoryUrl(store.slug, category.slug)}
                    className="w-full text-gray-700"
                    style={{ paddingLeft: `${depth * 16 + 12}px` }}
                >
                    {depth > 0 && '→ '}{category.name}
                </Link>
            </DropdownMenuItem>
        );
        
        // Add all children recursively
        if (category.children && category.children.length > 0) {
            category.children.forEach(child => {
                items.push(...renderCategoryDescendants(child, depth + 1));
            });
        }
        
        return items;
    };

    // Render category with children as dropdown
    const renderCategoryWithChildren = (category) => {
        if (category.children && category.children.length > 0) {
            return (
                <DropdownMenu key={category.id}>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md h-auto flex items-center space-x-1"
                        >
                            <span>{category.name}</span>
                            <ChevronDown className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto">
                        <DropdownMenuItem asChild>
                            <Link 
                                to={createCategoryUrl(store.slug, category.slug)}
                                className="w-full font-medium text-gray-900 border-b border-gray-200 pb-2 mb-2"
                            >
                                View All {category.name}
                            </Link>
                        </DropdownMenuItem>
                        {category.children.map(child => renderCategoryDescendants(child, 0))}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        } else {
            // Regular category without children
            return (
                <Link 
                    key={category.id}
                    to={createCategoryUrl(store.slug, category.slug)} 
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md"
                >
                    {category.name}
                </Link>
            );
        }
    };

    return (
        <nav className="hidden md:flex items-center space-x-2">
            <Link to={createPublicUrl(store.slug, 'STOREFRONT')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md">
                Home
            </Link>
            {rootCategories.map(category => renderCategoryWithChildren(category))}
        </nav>
    );
}