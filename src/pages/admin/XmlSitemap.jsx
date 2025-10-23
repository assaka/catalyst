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

    // Helper function to safely format dates
    const formatDate = (dateValue) => {
        try {
            if (!dateValue) return new Date().toISOString().split('T')[0];
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
                return new Date().toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0];
        } catch (error) {
            return new Date().toISOString().split('T')[0];
        }
    };

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
                    const lastmod = formatDate(category.updatedAt || category.updated_date || category.createdAt || category.created_date);
                    xml += `
  <url>
    <loc>${window.location.origin}/category/${category.slug || category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
                });
            }

            // Add products
            if (settings.sitemap_include_products && products?.length > 0) {
                products.forEach(product => {
                    const lastmod = formatDate(product.updatedAt || product.updated_date || product.createdAt || product.created_date);
                    xml += `
  <url>
    <loc>${window.location.origin}/product/${product.slug || product.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
                });
            }

            // Add CMS pages
            if (settings.sitemap_include_pages && pages?.length > 0) {
                pages.forEach(page => {
                    const lastmod = formatDate(page.updatedAt || page.updated_date || page.createdAt || page.created_date);
                    xml += `
  <url>
    <loc>${window.location.origin}/page/${page.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${lastmod}</lastmod>
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