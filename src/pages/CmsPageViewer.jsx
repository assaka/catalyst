import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CmsPage } from '@/api/entities';
import { Product } from '@/api/entities';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';

export default function CmsPageViewer() {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const slug = searchParams.get('slug');

    useEffect(() => {
        if (slug) {
            const fetchPage = async () => {
                try {
                    setLoading(true);
                    const pages = await CmsPage.filter({ slug: slug, is_active: true });
                    if (pages && pages.length > 0) {
                        const currentPage = pages[0];
                        setPage(currentPage);
                        if (currentPage.related_product_ids && currentPage.related_product_ids.length > 0) {
                            const products = await Product.list(); // Simplified, in a real app might filter by IDs
                            const filteredProducts = products.filter(p => currentPage.related_product_ids.includes(p.id));
                            setRelatedProducts(filteredProducts);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching CMS page:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchPage();
        }
    }, [slug]);

    if (loading) {
        return <div className="text-center p-8">Loading...</div>;
    }

    if (!page) {
        return <div className="text-center p-8">Page not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <SeoHeadManager pageType="cms_page" pageData={page} />
            <article className="prose lg:prose-xl mx-auto bg-white p-8 rounded-lg shadow">
                <h1>{page.title}</h1>
                <div dangerouslySetInnerHTML={{ __html: page.content }} />
            </article>

            {relatedProducts.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-2xl font-bold text-center mb-8">Related Products</h2>
                    <RecommendedProducts products={relatedProducts} />
                </div>
            )}
        </div>
    );
}