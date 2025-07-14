import React, { useState, useEffect } from 'react';
import { Product } from '@/api/entities';
import { Category } from '@/api/entities';
import { CmsPage } from '@/api/entities';
import { SeoSetting } from '@/api/entities';

export default function XmlSitemap() {
    const [loading, setLoading] = useState(true);
    const [sitemapXml, setSitemapXml] = useState('');

    useEffect(() => {
        generateSitemap();
    }, []);

    const generateSitemap = async () => {
        try {
            const [products, categories, pages, seoSettings] = await Promise.all([
                Product.filter({ status: 'active' }),
                Category.filter({ is_active: true }),
                CmsPage.filter({ is_active: true }),
                SeoSetting.list()
            ]);

            const settings = seoSettings?.[0] || {
                sitemap_include_products: true,
                sitemap_include_categories: true,
                sitemap_include_pages: true
            };

            let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${window.location.origin}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;

            // Add categories
            if (settings.sitemap_include_categories && categories?.length > 0) {
                categories.forEach(category => {
                    xml += `
  <url>
    <loc>${window.location.origin}/category/${category.slug || category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date(category.updated_date || category.created_date).toISOString().split('T')[0]}</lastmod>
  </url>`;
                });
            }

            // Add products
            if (settings.sitemap_include_products && products?.length > 0) {
                products.forEach(product => {
                    xml += `
  <url>
    <loc>${window.location.origin}/product/${product.slug || product.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${new Date(product.updated_date || product.created_date).toISOString().split('T')[0]}</lastmod>
  </url>`;
                });
            }

            // Add CMS pages
            if (settings.sitemap_include_pages && pages?.length > 0) {
                pages.forEach(page => {
                    xml += `
  <url>
    <loc>${window.location.origin}/page/${page.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${new Date(page.updated_date || page.created_date).toISOString().split('T')[0]}</lastmod>
  </url>`;
                });
            }

            xml += '\n</urlset>';
            setSitemapXml(xml);
        } catch (error) {
            console.error('Error generating sitemap:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Generating sitemap...</div>;
    }

    // Set content type to XML
    React.useEffect(() => {
        const response = new Response(sitemapXml, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
        return response;
    }, [sitemapXml]);

    return (
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {sitemapXml}
        </pre>
    );
}