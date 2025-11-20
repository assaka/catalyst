const express = require('express');
const router = express.Router();
const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * GET /api/robots/:storeId
 * Serves the robots.txt content for a specific store with proper content-type
 */
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`[Robots] Serving robots.txt for store: ${storeId}`);

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getConnection(storeId);

    // Find SEO settings for the store
    const { data: seoSettings, error } = await tenantDb
      .from('seo_settings')
      .select('robots_txt_content')
      .eq('store_id', storeId)
      .single();

    let robotsContent = '';

    if (!error && seoSettings?.robots_txt_content) {
      robotsContent = seoSettings.robots_txt_content;
    } else {
      // Default robots.txt content
      robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /account/
Disallow: /login

# Add your sitemap URL here
# Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`;
    }

    // Set proper content-type and headers for robots.txt
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'X-Robots-Tag': 'noindex' // Don't index the robots.txt URL itself
    });

    res.send(robotsContent);

  } catch (error) {
    console.error('[Robots] Error serving robots.txt:', error);

    // Send a basic robots.txt even on error
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    });

    res.send(`User-agent: *
Allow: /
Disallow: /admin/`);
  }
});

/**
 * GET /api/robots/store/:storeSlug
 * Serves robots.txt by store slug instead of ID (more SEO friendly)
 *
 * NOTE: This route requires knowing the store_id from the slug.
 * Since we're using ConnectionManager which needs store_id, we need to find it first.
 * The proper solution is to have the frontend/CDN pass the store_id directly,
 * or use a lightweight slug->id lookup service.
 *
 * For now, we'll use a workaround: try to get any tenant connection and query Store table
 */
router.get('/store/:storeSlug', async (req, res) => {
  try {
    const { storeSlug } = req.params;

    console.log(`[Robots] Serving robots.txt for store slug: ${storeSlug}`);

    // ARCHITECTURAL NOTE: Slug lookup is challenging in multi-tenant architecture.
    // We need store_id to get tenant connection, but we only have slug.
    // Options:
    // 1. Query master DB for slug->id mapping (what we're removing)
    // 2. Require frontend to pass store_id as query param
    // 3. Use a global slug registry
    //
    // Best practice: Frontend should use /api/robots/:storeId instead

    console.warn('[Robots] WARNING: Slug-based lookup not supported in multi-tenant architecture. Use /api/robots/:storeId instead.');

    return res.status(400).set({
      'Content-Type': 'text/plain; charset=utf-8'
    }).send(`# Error: Slug-based lookup not supported
# Please use /api/robots/:storeId endpoint instead
User-agent: *
Disallow: /`);

  } catch (error) {
    console.error('[Robots] Error serving robots.txt by slug:', error);

    // Send a basic robots.txt even on error
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    });

    res.send(`User-agent: *
Allow: /
Disallow: /admin/`);
  }
});

module.exports = router;