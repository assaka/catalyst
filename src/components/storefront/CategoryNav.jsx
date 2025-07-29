import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl, createCategoryUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';

export default function CategoryNav({ categories }) {
    const { store } = useStore();
    console.log('🔗 CategoryNav: Received categories:', categories);
    
    if (!categories || categories.length === 0 || !store) {
        console.log('🔗 CategoryNav: No categories or store to display');
        return null;
    }

    // Show all categories that are not hidden in menu (both parent and child categories)
    const visibleCategories = categories.filter(c => !c.hide_in_menu);
    console.log('🔗 CategoryNav: Visible categories after filtering:', visibleCategories);
    
    return (
        <nav className="hidden md:flex items-center space-x-2">
            <Link to={createPublicUrl(store.slug, 'STOREFRONT')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md">
                Home
            </Link>
            {visibleCategories.map(category => (
                <Link 
                    key={category.id} 
                    to={createCategoryUrl(store.slug, category.slug)} 
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md"
                >
                    {category.name}
                </Link>
            ))}
        </nav>
    );
}