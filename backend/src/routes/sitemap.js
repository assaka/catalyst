const express = require('express');
const router = express.Router();
const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Generate XML sitemap content
 */
async function generateSitemapXml(storeId, baseUrl) {
  try {
    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { Product, Category, CmsPage, SeoSettings } = connection.models;

    // Get SEO settings for the store
    const seoSettings = await SeoSettings.findOne({
      where: { store_id: storeId }
    });

    const urls = [];

    // Add homepage
    urls.push({
      loc: baseUrl,
      changefreq: 'daily',
      priority: '1.0',
      lastmod: new Date().toISOString().split('T')[0]
    });

    // Add categories if enabled
    if (!seoSettings || seoSettings.sitemap_include_categories !== false) {
      const categories = await Category.findAll({
        where: {
          is_active: true,
          store_id: storeId
        },
        attributes: ['slug', 'updatedAt'],
        order: [['sort_order', 'ASC']]
      });

      categories.forEach(category => {
        urls.push({
          loc: `${baseUrl}/category/${category.slug}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: category.updatedAt ? new Date(category.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
      });
    }

    // Add products if enabled
    if (!seoSettings || seoSettings.sitemap_include_products !== false) {
      const products = await Product.findAll({
        where: {
          status: 'active',
          store_id: storeId
        },
        attributes: ['slug', 'updatedAt'],
        order: [['createdAt', 'DESC']]
      });

      products.forEach(product => {
        urls.push({
          loc: `${baseUrl}/product/${product.slug}`,
          changefreq: 'daily',
          priority: '0.7',
          lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
      });
    }

    // Add CMS pages if enabled
    if (!seoSettings || seoSettings.sitemap_include_pages !== false) {
      const pages = await CmsPage.findAll({
        where: {
          is_active: true,
          store_id: storeId
        },
        attributes: ['slug', 'updatedAt']
      });

      pages.forEach(page => {
        urls.push({
          loc: `${baseUrl}/${page.slug}`,
          changefreq: 'monthly',
          priority: '0.6',
          lastmod: page.updatedAt ? new Date(page.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
      });
    }

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    return xml;
  } catch (error) {
    console.error('[Sitemap] Error generating sitemap:', error);
    throw error;
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


/**
 * GET /api/sitemap/:storeId
 * Serves the sitemap.xml for a specific store by ID
 */
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`[Sitemap] Serving sitemap.xml for store: ${storeId}`);

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { Store } = connection.models;

    // Find the store
    const store = await Store.findByPk(storeId);

    if (!store) {
      console.warn(`[Sitemap] Store not found: ${storeId}`);
      return res.status(404).set({
        'Content-Type': 'text/plain; charset=utf-8'
      }).send('Store not found');
    }

    // Determine base URL
    const baseUrl = store.custom_domain || `${req.protocol}://${req.get('host')}/public/${store.slug}`;

    // Generate sitemap
    const sitemapXml = await generateSitemapXml(storeId, baseUrl);

    if (!sitemapXml) {
      console.log(`[Sitemap] Sitemap disabled for store: ${storeId}`);
      return res.status(404).set({
        'Content-Type': 'text/plain; charset=utf-8'
      }).send('Sitemap is disabled for this store');
    }

    // Set proper content-type and headers for XML
    res.set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-Robots-Tag': 'noindex' // Don't index the sitemap URL itself
    });

    res.send(sitemapXml);

  } catch (error) {
    console.error('[Sitemap] Error serving sitemap.xml:', error);
    res.status(500).set({
      'Content-Type': 'text/plain; charset=utf-8'
    }).send('Error generating sitemap');
  }
});

/**
 * GET /api/sitemap/store/:storeSlug
 * Serves sitemap.xml by store slug instead of ID (more SEO friendly)
 *
 * NOTE: This route requires knowing the store_id from the slug.
 * Since we're using ConnectionManager which needs store_id, we need to find it first.
 * The proper solution is to have the frontend/CDN pass the store_id directly,
 * or use a lightweight slug->id lookup service.
 */
router.get('/store/:storeSlug', async (req, res) => {
  try {
    const { storeSlug } = req.params;

    console.log(`[Sitemap] Serving sitemap.xml for store slug: ${storeSlug}`);

    // ARCHITECTURAL NOTE: Slug lookup is challenging in multi-tenant architecture.
    // We need store_id to get tenant connection, but we only have slug.
    // Options:
    // 1. Query master DB for slug->id mapping (what we're removing)
    // 2. Require frontend to pass store_id as query param
    // 3. Use a global slug registry
    //
    // Best practice: Frontend should use /api/sitemap/:storeId instead

    console.warn('[Sitemap] WARNING: Slug-based lookup not supported in multi-tenant architecture. Use /api/sitemap/:storeId instead.');

    return res.status(400).set({
      'Content-Type': 'text/plain; charset=utf-8'
    }).send('<?xml version="1.0" encoding="UTF-8"?>\n<!-- Error: Slug-based lookup not supported. Please use /api/sitemap/:storeId endpoint instead -->');

  } catch (error) {
    console.error('[Sitemap] Error serving sitemap.xml by slug:', error);
    res.status(500).set({
      'Content-Type': 'text/plain; charset=utf-8'
    }).send('Error generating sitemap');
  }
});

module.exports = router;
module.exports.generateSitemapXml = generateSitemapXml;
