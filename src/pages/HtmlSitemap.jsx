import React, { useState, useEffect } from 'react';
import { Category } from '@/api/entities';
import { Product } from '@/api/entities';
import { CmsPage } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Layout, FileText, ChevronRight, Package } from 'lucide-react';

export default function HtmlSitemap() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoryData, productData, pageData] = await Promise.all([
                    Category.filter({ is_active: true }, "sort_order"),
                    Product.filter({ status: 'active' }, "-updated_date", 50),
                    CmsPage.filter({ is_active: true })
                ]);
                setCategories(categoryData || []);
                setProducts(productData || []);
                setPages(pageData || []);
            } catch (error) {
                console.error("Error fetching sitemap data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const renderCategoryTree = (parentId = null) => {
        const children = categories.filter(cat => cat.parent_id === parentId);
        if (children.length === 0) return null;

        return (
            <ul className={parentId ? "pl-6" : ""}>
                {children.map(category => (
                    <li key={category.id} className="my-2">
                        <Link to={createPageUrl(`Storefront?category=${category.slug}`)} className="flex items-center text-blue-600 hover:underline">
                            <ChevronRight className="w-4 h-4 mr-2" />
                            {category.name}
                        </Link>
                        {renderCategoryTree(category.id)}
                    </li>
                ))}
            </ul>
        );
    };

    if (loading) {
        return <div className="p-8 text-center">Loading sitemap...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white my-8 rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">HTML Sitemap</h1>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center">
                    <Layout className="w-6 h-6 mr-3 text-gray-600"/>
                    Categories
                </h2>
                {categories.length > 0 ? renderCategoryTree() : <p>No categories found.</p>}
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center">
                    <Package className="w-6 h-6 mr-3 text-gray-600"/>
                    Featured Products
                </h2>
                {products.length > 0 ? (
                    <ul>
                        {products.slice(0, 20).map(product => (
                            <li key={product.id} className="my-2">
                                <Link to={createPageUrl(`ProductDetail?id=${product.id}`)} className="flex items-center text-blue-600 hover:underline">
                                    <ChevronRight className="w-4 h-4 mr-2" />
                                    {product.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : <p>No products found.</p>}
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-gray-600"/>
                    Pages
                </h2>
                {pages.length > 0 ? (
                    <ul>
                        {pages.map(page => (
                            <li key={page.id} className="my-2">
                                <Link to={createPageUrl(`CmsPageViewer?slug=${page.slug}`)} className="flex items-center text-blue-600 hover:underline">
                                    <ChevronRight className="w-4 h-4 mr-2" />
                                    {page.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : <p>No additional pages found.</p>}
            </section>
        </div>
    );
}