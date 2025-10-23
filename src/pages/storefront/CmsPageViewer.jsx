import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorefrontCmsPage, StorefrontProduct } from '@/api/storefront-entities';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
// Redirect handling moved to global RedirectHandler component
import { useNotFound } from '@/utils/notFoundUtils';
import { getPageTitle, getPageContent } from '@/utils/translationUtils';

export default function CmsPageViewer() {
    const { pageSlug } = useParams();
    const slug = pageSlug;
    const { showNotFound } = useNotFound();
    const [page, setPage] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }
        if (slug) {
            const fetchPage = async () => {
                try {
                    setLoading(true);
                    // Fetch CMS page using slug query parameter
                    const response = await fetch(`/api/public/cms-pages?slug=${encodeURIComponent(slug)}`);
                    const result = await response.json();

                    if (result.success && result.data) {
                        const currentPage = result.data;
                        setPage(currentPage);
                        if (currentPage.related_product_ids && currentPage.related_product_ids.length > 0) {
                            // Fetch only the related products using storefront API with specific IDs
                            const products = await StorefrontProduct.filter({
                                id: { $in: currentPage.related_product_ids }
                            });
                            setRelatedProducts(products || []);
                        }
                    } else {
                        // Global redirect handler already checked - just show 404
                        console.warn(`CMS page with slug '${slug}' not found.`);
                        setPage(null);
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

    if (!page && !loading) {
        // Trigger 404 page display
        showNotFound(`CMS page "${slug}" not found`);
        return null;
    }

    const pageTitle = getPageTitle(page);
    const pageContent = getPageContent(page);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <SeoHeadManager pageType="cms_page" pageData={page} />
            <article className="prose lg:prose-xl mx-auto bg-white p-8 rounded-lg shadow">
                <h1>{pageTitle}</h1>
                <div dangerouslySetInnerHTML={{ __html: pageContent }} />
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