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
        const visibleCategories = categories.filter(c => !c.hide_in_menu);

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
            } else {
                // This is a root category
                rootCategories.push(categoryNode);
            }
        });

        return rootCategories;
    };

    const rootCategories = buildCategoryTree(categories);

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
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuItem asChild>
                            <Link 
                                to={createCategoryUrl(store.slug, category.slug)}
                                className="w-full font-medium text-gray-900"
                            >
                                View All {category.name}
                            </Link>
                        </DropdownMenuItem>
                        <div className="border-t border-gray-200 my-1" />
                        {category.children.map(child => (
                            <DropdownMenuItem key={child.id} asChild>
                                <Link 
                                    to={createCategoryUrl(store.slug, child.slug)}
                                    className="w-full text-gray-700"
                                >
                                    {child.name}
                                </Link>
                            </DropdownMenuItem>
                        ))}
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