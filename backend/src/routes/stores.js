const express = require('express');
const { masterDbClient } = require('../database/masterConnection');
const router = express.Router();

/**
 * PUBLIC STORES ENDPOINT
 * NOTE: Private/authenticated store routes are in storesMasterTenant.js
 * This file only handles /api/public/stores for unauthenticated access
 */

// @route   GET /api/public/stores
// @desc    Get stores for public access (storefront)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { id, slug, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let query = masterDbClient
      .from('stores')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (id) {
      query = query.eq('id', id);
    }

    if (slug) {
      if (slug.includes('.')) {
        // Custom domain lookup
        const { data: domainRecord, error: domainError } = await masterDbClient
          .from('custom_domains')
          .select('store_id')
          .eq('domain', slug)
          .eq('is_active', true)
          .eq('verification_status', 'verified')
          .maybeSingle();

        if (domainError) {
          console.error('Error fetching custom domain:', domainError);
        }

        if (domainRecord) {
          query = query.eq('id', domainRecord.store_id);
        } else {
          return res.json([]);
        }
      } else {
        query = query.eq('slug', slug);
      }
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error('Error fetching stores:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch stores'
      });
    }

    // Return just the data array for public requests
    return res.json(rows || []);
  } catch (error) {
    console.error('Get public stores error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
