import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Category } from '@/api/entities';
import { Product } from '@/api/entities';
import { CmsPage } from '@/api/entities';
import { SeoSetting } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createCmsPageUrl } from '@/utils/urlUtils';
import { useStore } from '@/components/storefront/StoreProvider';
import { Layout, FileText, ChevronRight, Package } from 'lucide-react';
import { getPageTitle } from '@/utils/translationUtils';

export default function HtmlSitemap() {
    const { storeCode } = useParams();
    const { store } = useStore();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch SEO settings first to determine what to display
                const seoSettings = store?.id ? await SeoSetting.filter({ store_id: store.id }) : [];
                const htmlSitemapSettings = seoSettings?.[0] || {
                    enable_html_sitemap: true,
                    html_sitemap_include_categories: true,
                    html_sitemap_include_products: true,
                    html_sitemap_include_pages: true,
                    html_sitemap_max_products: 20,
                    html_sitemap_product_sort: '-updated_date'
                };

                setSettings(htmlSitemapSettings);

                // Only fetch data if sitemap is enabled
                if (!htmlSitemapSettings.enable_html_sitemap) {
                    setLoading(false);
                    return;
                }

                // Fetch data based on settings
                const promises = [];

                if (htmlSitemapSettings.html_sitemap_include_categories) {
                    promises.push(Category.filter({ is_active: true }, "sort_order"));
                } else {
                    promises.push(Promise.resolve([]));
                }

                if (htmlSitemapSettings.html_sitemap_include_products) {
                    const maxProducts = htmlSitemapSettings.html_sitemap_max_products || 20;
                    const sortOrder = htmlSitemapSettings.html_sitemap_product_sort || '-updated_date';
                    promises.push(Product.filter({ status: 'active' }, sortOrder, maxProducts));
                } else {
                    promises.push(Promise.resolve([]));
                }

                if (htmlSitemapSettings.html_sitemap_include_pages) {
                    promises.push(CmsPage.filter({ is_active: true }));
                } else {
                    promises.push(Promise.resolve([]));
                }

                const [categoryData, productData, pageData] = await Promise.all(promises);

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
    }, [store?.id]);

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

    // Check if HTML sitemap is disabled
    if (settings && !settings.enable_html_sitemap) {
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white my-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">HTML Sitemap</h1>
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                        HTML sitemap is currently disabled. You can enable it in the SEO Settings.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white my-8 rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">HTML Sitemap</h1>

            {settings?.html_sitemap_include_categories && (
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center">
                        <Layout className="w-6 h-6 mr-3 text-gray-600"/>
                        Categories
                    </h2>
                    {categories.length > 0 ? renderCategoryTree() : <p>No categories found.</p>}
                </section>
            )}

            {settings?.html_sitemap_include_products && (
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center">
                        <Package className="w-6 h-6 mr-3 text-gray-600"/>
                        Featured Products
                    </h2>
                    {products.length > 0 ? (
                        <ul>
                            {products.map(product => (
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
            )}

            {settings?.html_sitemap_include_pages && (
                <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center">
                        <FileText className="w-6 h-6 mr-3 text-gray-600"/>
                        Pages
                    </h2>
                    {pages.length > 0 ? (
                        <ul>
                            {pages.map(page => (
                                <li key={page.id} className="my-2">
                                    <Link to={createCmsPageUrl(store?.slug || storeCode, page.slug)} className="flex items-center text-blue-600 hover:underline">
                                        <ChevronRight className="w-4 h-4 mr-2" />
                                        {getPageTitle(page)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : <p>No additional pages found.</p>}
                </section>
            )}
        </div>
    );
}