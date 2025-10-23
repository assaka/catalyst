const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   GET /api/public-cms-pages
// @desc    Get active CMS pages for public display
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { slug, store_id } = req.query;

    console.log('🎯 Public CMS Pages: Request received', { slug, store_id });

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug is required'
      });
    }

    console.log('🎯 Public CMS Pages: Executing query...');

    // Query to get CMS page by slug
    const whereConditions = ['slug = $1', 'is_active = true'];
    const bindings = [slug];

    if (store_id) {
      whereConditions.push('store_id::text = $2');
      bindings.push(store_id);
    }

    const pages = await sequelize.query(`
      SELECT
        id::text as id,
        slug,
        is_active,
        is_system,
        meta_title,
        meta_description,
        meta_keywords,
        meta_robots_tag,
        store_id::text as store_id,
        related_product_ids,
        published_at,
        sort_order,
        translations,
        created_at,
        updated_at
      FROM cms_pages
      WHERE ${whereConditions.join(' AND ')}
      LIMIT 1
    `, {
      bind: bindings,
      type: QueryTypes.SELECT
    });

    console.log('🎯 Public CMS Pages: Query successful, found:', pages.length, 'page(s)');

    if (pages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'CMS page not found'
      });
    }

    res.json({
      success: true,
      data: pages[0]
    });

  } catch (error) {
    console.error('🚨 Public CMS Pages error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: error.sql || 'No SQL'
    });

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
