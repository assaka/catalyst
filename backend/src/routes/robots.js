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

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(storeId);
    const { SeoSettings } = connection.models;

    // Find SEO settings for the store
    const seoSettings = await SeoSettings.findOne({
      where: { store_id: storeId }
    });
    
    let robotsContent = '';
    
    if (seoSettings && seoSettings.robots_txt_content) {
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
 */
router.get('/store/:storeSlug', async (req, res) => {
  try {
    const { storeSlug } = req.params;

    console.log(`[Robots] Serving robots.txt for store slug: ${storeSlug}`);

    // First find the store by slug to get the store_id from master DB
    const { Store: MasterStore } = require('../models');
    const store = await MasterStore.findOne({
      where: { slug: storeSlug }
    });

    if (!store) {
      console.warn(`[Robots] Store not found for slug: ${storeSlug}`);
      return res.status(404).set({
        'Content-Type': 'text/plain; charset=utf-8'
      }).send('# Store not found\nUser-agent: *\nDisallow: /');
    }

    // Get tenant connection
    const connection = await ConnectionManager.getConnection(store.id);
    const { SeoSettings } = connection.models;

    // Find SEO settings for the store
    const seoSettings = await SeoSettings.findOne({
      where: { store_id: store.id }
    });
    
    let robotsContent = '';
    
    if (seoSettings && seoSettings.robots_txt_content) {
      robotsContent = seoSettings.robots_txt_content;
    } else {
      // Default robots.txt content with store-specific sitemap
      const baseUrl = store.custom_domain || `${req.protocol}://${req.get('host')}/public/${storeSlug}`;
      robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /account/
Disallow: /login

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;
    }
    
    // Set proper content-type and headers for robots.txt
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'X-Robots-Tag': 'noindex' // Don't index the robots.txt URL itself
    });
    
    res.send(robotsContent);
    
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