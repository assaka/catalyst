import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <Link 
                to={createPageUrl('Storefront')} 
                className="flex items-center hover:text-blue-600 transition-colors"
            >
                <Home className="w-4 h-4 mr-1" />
                Home
            </Link>
            
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    {index === items.length - 1 ? (
                        // Last item - current page, not a link
                        <span className="font-medium text-gray-900">{item.name}</span>
                    ) : (
                        // Not last item - make it a link
                        <Link 
                            to={item.url} 
                            className="hover:text-blue-600 transition-colors"
                        >
                            {item.name}
                        </Link>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}