import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createPublicUrl, createCategoryUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function CategoryNav({ categories }) {
    const { store } = useStore();
    
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [isMobile, setIsMobile] = useState(false);
    
    if (!categories || categories.length === 0 || !store) {
        return null;
    }

    // Detect mobile/desktop
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Check if all menu items should be expanded by default
    // On mobile, always use expandAllMenuItems = false
    const expandAllMenuItems = isMobile ? false : (store?.settings?.expandAllMenuItems || false);
    
    // Reset expanded categories when expandAllMenuItems setting changes
    useEffect(() => {
        if (!expandAllMenuItems) {
            // Clear all expanded categories when the setting is disabled
            setExpandedCategories(new Set());
        }
    }, [expandAllMenuItems]);
    
    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

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

    // Render all descendants of a category with proper indentation
    const renderCategoryDescendants = (category, depth = 0, isDropdown = true) => {
        const items = [];
        
        // Add the category itself
        if (isDropdown) {
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
        } else {
            items.push(
                <Link 
                    key={category.id}
                    to={createCategoryUrl(store.slug, category.slug)}
                    className="block w-full text-gray-700 hover:bg-gray-100 px-3 py-2 text-sm"
                    style={{ paddingLeft: `${depth * 16 + 12}px` }}
                >
                    {depth > 0 && '→ '}{category.name}
                </Link>
            );
        }
        
        // Add all children recursively
        if (category.children && category.children.length > 0) {
            category.children.forEach(child => {
                items.push(...renderCategoryDescendants(child, depth + 1, isDropdown));
            });
        }
        
        return items;
    };

    // Render always-expanded category tree
    const renderExpandedCategory = (category, depth = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        
        return (
            <div key={category.id} className="block">
                <div className="flex items-center justify-between">
                    <Link 
                        to={createCategoryUrl(store.slug, category.slug)}
                        className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md flex-1 touch-manipulation"
                        style={{ marginLeft: `${depth * 16}px` }}
                    >
                        {category.name}
                    </Link>
                    {hasChildren && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategory(category.id)}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                toggleCategory(category.id);
                            }}
                            className="p-1 h-auto ml-1 hover:bg-gray-100 touch-manipulation float-right"
                            aria-label={isExpanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                        </Button>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-4">
                        {category.children.map(child => renderExpandedCategory(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Render category with children as dropdown (collapsible mode)
    const renderCategoryWithChildren = (category) => {
        if (category.children && category.children.length > 0) {
            return (
                <DropdownMenu key={category.id}>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md h-auto flex items-center whitespace-nowrap"
                        >
                            <span>{category.name}</span>
                            <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto z-50 bg-white border border-gray-200 shadow-lg">
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
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md whitespace-nowrap"
                >
                    {category.name}
                </Link>
            );
        }
    };

    // Render desktop hover-based category with absolute positioned submenu
    const renderDesktopHoverCategory = (category) => {
        if (category.children && category.children.length > 0) {
            return (
                <div key={category.id} className="relative group">
                    <Link 
                        to={createCategoryUrl(store.slug, category.slug)}
                        className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md inline-flex items-center whitespace-nowrap"
                    >
                        {category.name}
                        <ChevronDown className="w-3 h-3 ml-1" />
                    </Link>
                    
                    {/* Submenu - absolutely positioned to avoid layout shifts */}
                    <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                        <div className="py-1">
                            <Link 
                                to={createCategoryUrl(store.slug, category.slug)}
                                className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 border-b border-gray-200"
                            >
                                View All {category.name}
                            </Link>
                            {category.children.map(child => renderDesktopSubmenuItem(child, 0))}
                        </div>
                    </div>
                </div>
            );
        } else {
            // Regular category without children
            return (
                <Link 
                    key={category.id}
                    to={createCategoryUrl(store.slug, category.slug)} 
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md whitespace-nowrap"
                >
                    {category.name}
                </Link>
            );
        }
    };

    // Render submenu items recursively for desktop hover menus
    const renderDesktopSubmenuItem = (category, depth = 0) => {
        const items = [];
        
        // Add the category itself
        items.push(
            <Link 
                key={category.id}
                to={createCategoryUrl(store.slug, category.slug)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                style={{ paddingLeft: `${16 + depth * 12}px` }}
            >
                {depth > 0 && '→ '}{category.name}
            </Link>
        );
        
        // Add all children recursively
        if (category.children && category.children.length > 0) {
            category.children.forEach(child => {
                items.push(...renderDesktopSubmenuItem(child, depth + 1));
            });
        }
        
        return items;
    };

    // Render submenu items with hover expansion for all levels
    const renderDesktopSubmenuItemWithControl = (category, depth = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isSecondLevel = depth === 0; // First level under main categories
        
        if (hasChildren) {
            // Category with children - create hover submenu
            return (
                <div key={category.id} className="relative group">
                    <Link 
                        to={createCategoryUrl(store.slug, category.slug)}
                        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        style={{ paddingLeft: `${16 + depth * 12}px` }}
                    >
                        <span>{depth > 0 && '→ '}{category.name}</span>
                        <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                    
                    {/* Nested submenu - appears on hover to the right */}
                    <div className="absolute left-full top-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 ml-1">
                        <div className="py-1">
                            <Link 
                                to={createCategoryUrl(store.slug, category.slug)}
                                className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 border-b border-gray-200"
                            >
                                View All {category.name}
                            </Link>
                            {/* Show children - expandAllMenuItems controls second-level visibility */}
                            {(isSecondLevel && expandAllMenuItems) || !isSecondLevel ? (
                                // Show children if not second level, or if second level and expandAllMenuItems is true
                                category.children.map(child => renderDesktopSubmenuItemWithControl(child, depth + 1))
                            ) : (
                                // Second level with expandAllMenuItems = false: show children but they won't show their grandchildren
                                category.children.map(child => renderDesktopSubmenuItemSimple(child, depth + 1))
                            )}
                        </div>
                    </div>
                </div>
            );
        } else {
            // Regular category without children
            return (
                <Link 
                    key={category.id}
                    to={createCategoryUrl(store.slug, category.slug)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    style={{ paddingLeft: `${16 + depth * 12}px` }}
                >
                    {depth > 0 && '→ '}{category.name}
                </Link>
            );
        }
    };

    // Render menu items with hover expansion when they have children
    const renderDesktopSubmenuItemSimple = (category, depth = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        
        if (hasChildren) {
            // Category with children - make it hoverable
            return (
                <div key={category.id} className="relative group">
                    <Link 
                        to={createCategoryUrl(store.slug, category.slug)}
                        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        style={{ paddingLeft: `${16 + depth * 12}px` }}
                    >
                        <span>{depth > 0 && '→ '}{category.name}</span>
                        <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                    
                    {/* Nested submenu - appears on hover to the right */}
                    <div className="absolute left-full top-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 ml-1">
                        <div className="py-1">
                            <Link 
                                to={createCategoryUrl(store.slug, category.slug)}
                                className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 border-b border-gray-200"
                            >
                                View All {category.name}
                            </Link>
                            {/* Always show children for items that have them */}
                            {category.children.map(child => renderDesktopSubmenuItemSimple(child, depth + 1))}
                        </div>
                    </div>
                </div>
            );
        } else {
            // Regular category without children
            return (
                <Link 
                    key={category.id}
                    to={createCategoryUrl(store.slug, category.slug)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    style={{ paddingLeft: `${16 + depth * 12}px` }}
                >
                    {depth > 0 && '→ '}{category.name}
                </Link>
            );
        }
    };

    return (
        <>
            {/* Mobile view - always collapsible with vertical layout */}
            <nav className="block md:hidden space-y-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <Link

                    to={createPublicUrl(store.slug, 'STOREFRONT')} 
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-2 py-1 rounded-md block mb-2 touch-manipulation whitespace-nowrap"
                >
                    Home
                </Link>
                <div className="space-y-1">
                    {rootCategories.map(category => renderExpandedCategory(category))}
                </div>
            </nav>
            
            {/* Desktop view - Always hover-based, expandAllMenuItems controls second-level expansion */}
            <nav className="hidden md:block">
                <div className="flex items-center space-x-2">
                    <Link to={createPublicUrl(store.slug, 'STOREFRONT')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md whitespace-nowrap">
                        Home
                    </Link>
                    {rootCategories.map(category => {
                        if (category.children && category.children.length > 0) {
                            return (
                                <div key={category.id} className="relative group">
                                    <Link 
                                        to={createCategoryUrl(store.slug, category.slug)}
                                        className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md inline-flex items-center whitespace-nowrap"
                                    >
                                        {category.name}
                                        <ChevronDown className="w-3 h-3 ml-1" />
                                    </Link>
                                    {/* Submenu visible on hover */}
                                    <div className="absolute left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
                                        <div className="py-1">
                                            <Link 
                                                to={createCategoryUrl(store.slug, category.slug)}
                                                className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 border-b border-gray-200"
                                            >
                                                View All {category.name}
                                            </Link>
                                            {expandAllMenuItems ? 
                                // Show all children recursively with indentation when expandAllMenuItems = true
                                category.children.map(child => renderDesktopSubmenuItem(child, 0))
                                :
                                // Show only direct children that can hover-expand when expandAllMenuItems = false
                                category.children.map(child => renderDesktopSubmenuItemSimple(child, 0))
                            }
                                        </div>
                                    </div>
                                </div>
                            );
                        } else {
                            // Regular category without children
                            return (
                                <Link 
                                    key={category.id}
                                    to={createCategoryUrl(store.slug, category.slug)} 
                                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md whitespace-nowrap"
                                >
                                    {category.name}
                                </Link>
                            );
                        }
                    })}
                </div>
            </nav>
        </>
    );
}