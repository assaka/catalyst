import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CmsPage } from '@/api/entities';
import { Product } from '@/api/entities';
import RecommendedProducts from '@/components/storefront/RecommendedProducts';
import SeoHeadManager from '@/components/storefront/SeoHeadManager';
import { checkMultiplePathsForRedirect, getPossiblePaths, extractSlugFromRedirectUrl } from '@/utils/redirectUtils';
import { useStore } from '@/components/storefront/StoreProvider';

export default function CmsPageViewer() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { store } = useStore();
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
                    } else {
                        // No CMS page found - check for redirects before showing 404
                        console.warn(`CMS page with slug '${slug}' not found. Checking for redirects...`);
                        
                        if (store?.id) {
                            const possiblePaths = getPossiblePaths('cms', slug);
                            const redirectTo = await checkMultiplePathsForRedirect(possiblePaths, store.id);
                            
                            if (redirectTo) {
                                console.log(`🔀 Redirecting from CMS page ${slug} to ${redirectTo}`);
                                const newSlug = extractSlugFromRedirectUrl(redirectTo);
                                // Determine the correct URL format for CMS pages
                                const cmsUrl = redirectTo.startsWith('/page/') ? 
                                    `/store/${store.slug}/page?slug=${newSlug}` :
                                    `/store/${store.slug}/${newSlug}`;
                                navigate(cmsUrl, { replace: true });
                                return;
                            }
                        }
                        
                        // No redirect found - page will remain null for 404
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