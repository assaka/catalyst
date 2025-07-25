import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const CategoryMenuItem = ({ category, allCategories }) => {
    const children = allCategories.filter(c => c.parent_id === category.id && !c.hide_in_menu);

    if (children.length === 0) {
        return (
            <Link to={createPageUrl(`Storefront?category=${category.slug}`)} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md">
                {category.name}
            </Link>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors focus:outline-none px-3 py-2 rounded-md">
                    {category.name}
                    <ChevronDown className="w-4 h-4 ml-1" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem asChild>
                    <Link to={createPageUrl(`Storefront?category=${category.slug}`)}>
                        View All {category.name}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {children.map(child => (
                    <DropdownMenuItem key={child.id} asChild>
                         <Link to={createPageUrl(`Storefront?category=${child.slug}`)}>
                            {child.name}
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function CategoryNav({ categories }) {
    console.log('🏷️ CategoryNav received categories:', categories);
    
    if (!categories || categories.length === 0) {
        console.log('🏷️ CategoryNav: No categories to display');
        return null;
    }

    const topLevelCategories = categories.filter(c => !c.parent_id && !c.hide_in_menu);
    console.log('🏷️ CategoryNav: Top level categories:', topLevelCategories);
    
    return (
        <nav className="hidden md:flex items-center space-x-2">
            <Link to={createPageUrl('Storefront')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md">
                Home
            </Link>
            {topLevelCategories.map(category => (
                <CategoryMenuItem key={category.id} category={category} allCategories={categories} />
            ))}
        </nav>
    );
}