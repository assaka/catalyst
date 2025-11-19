const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const ConnectionManager = require('../services/database/ConnectionManager');

const router = express.Router();
const { authorize, storeOwnerOnly } = require('../middleware/auth');

// @route   GET /api/blacklist/settings
// @desc    Get blacklist settings for a store
// @access  Private (Store Owner Only)
router.get('/settings', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: settings, error } = await tenantDb
      .from('blacklist_settings')
      .select('*')
      .eq('store_id', store_id)
      .maybeSingle();

    if (error) {
      console.error('Get blacklist settings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    // Create default settings if they don't exist
    if (!settings) {
      const { data: newSettings, error: createError } = await tenantDb
        .from('blacklist_settings')
        .insert({
          store_id,
          block_by_ip: false,
          block_by_email: true,
          block_by_country: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Create blacklist settings error:', createError);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }

      return res.json({
        success: true,
        data: newSettings
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get blacklist settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/blacklist/settings
// @desc    Update blacklist settings
// @access  Private (Store Owner Only)
router.put('/settings', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;
    const { block_by_ip, block_by_email, block_by_country } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: existing } = await tenantDb
      .from('blacklist_settings')
      .select('*')
      .eq('store_id', store_id)
      .maybeSingle();

    let settings;
    if (existing) {
      const { data, error } = await tenantDb
        .from('blacklist_settings')
        .update({
          block_by_ip,
          block_by_email,
          block_by_country
        })
        .eq('store_id', store_id)
        .select()
        .single();

      if (error) {
        console.error('Update blacklist settings error:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
      settings = data;
    } else {
      const { data, error } = await tenantDb
        .from('blacklist_settings')
        .insert({
          store_id,
          block_by_ip,
          block_by_email,
          block_by_country
        })
        .select()
        .single();

      if (error) {
        console.error('Create blacklist settings error:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
      settings = data;
    }

    res.json({
      success: true,
      data: settings,
      message: 'Blacklist settings updated successfully'
    });
  } catch (error) {
    console.error('Update blacklist settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ==================== IP BLACKLIST ROUTES ====================

// @route   GET /api/blacklist/ips
// @desc    Get all blacklisted IPs for a store
// @access  Private (Store Owner Only)
router.get('/ips', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id, search, page = 1, limit = 20 } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const offset = (page - 1) * limit;

    let query = tenantDb
      .from('blacklist_ips')
      .select('*', { count: 'exact' })
      .eq('store_id', store_id);

    // Add search functionality
    if (search) {
      query = query.or(`ip_address.ilike.%${search}%,reason.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: ips, error, count } = await query;

    if (error) {
      console.error('Get blacklist IPs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.json({
      success: true,
      data: {
        ips: ips || [],
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil((count || 0) / limit),
          total_items: count || 0,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get blacklist IPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/blacklist/ips
// @desc    Add IP to blacklist
// @access  Private (Store Owner Only)
router.post('/ips', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;
    const { ip_address, reason } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!ip_address) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if IP already exists
    const { data: existing } = await tenantDb
      .from('blacklist_ips')
      .select('*')
      .eq('store_id', store_id)
      .eq('ip_address', ip_address)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This IP address is already blacklisted'
      });
    }

    const { data: blacklistEntry, error } = await tenantDb
      .from('blacklist_ips')
      .insert({
        store_id,
        ip_address,
        reason,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Create blacklist IP error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.status(201).json({
      success: true,
      data: blacklistEntry,
      message: 'IP address blacklisted successfully'
    });
  } catch (error) {
    console.error('Create blacklist IP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/blacklist/ips/:id
// @desc    Remove IP from blacklist
// @access  Private (Store Owner Only)
router.delete('/ips/:id', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: blacklistEntry } = await tenantDb
      .from('blacklist_ips')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!blacklistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Blacklist entry not found'
      });
    }

    // Verify it belongs to the correct store
    if (blacklistEntry.store_id !== store_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { error } = await tenantDb
      .from('blacklist_ips')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete blacklist IP error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.json({
      success: true,
      message: 'IP address removed from blacklist'
    });
  } catch (error) {
    console.error('Delete blacklist IP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ==================== COUNTRY BLACKLIST ROUTES ====================

// @route   GET /api/blacklist/countries
// @desc    Get all blacklisted countries for a store
// @access  Private (Store Owner Only)
router.get('/countries', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id, search, page = 1, limit = 20 } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const offset = (page - 1) * limit;

    let query = tenantDb
      .from('blacklist_countries')
      .select('*', { count: 'exact' })
      .eq('store_id', store_id);

    // Add search functionality
    if (search) {
      query = query.or(`country_code.ilike.%${search}%,country_name.ilike.%${search}%,reason.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: countries, error, count } = await query;

    if (error) {
      console.error('Get blacklist countries error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.json({
      success: true,
      data: {
        countries: countries || [],
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil((count || 0) / limit),
          total_items: count || 0,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get blacklist countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/blacklist/countries
// @desc    Add country to blacklist
// @access  Private (Store Owner Only)
router.post('/countries', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;
    const { country_code, country_name, reason } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!country_code) {
      return res.status(400).json({
        success: false,
        message: 'Country code is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if country already exists
    const { data: existing } = await tenantDb
      .from('blacklist_countries')
      .select('*')
      .eq('store_id', store_id)
      .eq('country_code', country_code.toUpperCase())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This country is already blacklisted'
      });
    }

    const { data: blacklistEntry, error } = await tenantDb
      .from('blacklist_countries')
      .insert({
        store_id,
        country_code: country_code.toUpperCase(),
        country_name,
        reason,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Create blacklist country error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.status(201).json({
      success: true,
      data: blacklistEntry,
      message: 'Country blacklisted successfully'
    });
  } catch (error) {
    console.error('Create blacklist country error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/blacklist/countries/:id
// @desc    Remove country from blacklist
// @access  Private (Store Owner Only)
router.delete('/countries/:id', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: blacklistEntry } = await tenantDb
      .from('blacklist_countries')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!blacklistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Blacklist entry not found'
      });
    }

    // Verify it belongs to the correct store
    if (blacklistEntry.store_id !== store_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { error } = await tenantDb
      .from('blacklist_countries')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete blacklist country error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.json({
      success: true,
      message: 'Country removed from blacklist'
    });
  } catch (error) {
    console.error('Delete blacklist country error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ==================== EMAIL BLACKLIST ROUTES ====================

// @route   GET /api/blacklist/emails
// @desc    Get all blacklisted emails for a store
// @access  Private (Store Owner Only)
router.get('/emails', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id, search, page = 1, limit = 20 } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const offset = (page - 1) * limit;

    let query = tenantDb
      .from('blacklist_emails')
      .select('*', { count: 'exact' })
      .eq('store_id', store_id);

    // Add search functionality
    if (search) {
      query = query.or(`email.ilike.%${search}%,reason.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: emails, error, count } = await query;

    if (error) {
      console.error('Get blacklist emails error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.json({
      success: true,
      data: {
        emails: emails || [],
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil((count || 0) / limit),
          total_items: count || 0,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get blacklist emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/blacklist/emails
// @desc    Add email to blacklist
// @access  Private (Store Owner Only)
router.post('/emails', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;
    const { email, reason } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if email already exists
    const { data: existing } = await tenantDb
      .from('blacklist_emails')
      .select('*')
      .eq('store_id', store_id)
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already blacklisted'
      });
    }

    const { data: blacklistEntry, error } = await tenantDb
      .from('blacklist_emails')
      .insert({
        store_id,
        email: email.toLowerCase(),
        reason,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Create blacklist email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.status(201).json({
      success: true,
      data: blacklistEntry,
      message: 'Email address blacklisted successfully'
    });
  } catch (error) {
    console.error('Create blacklist email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/blacklist/emails/:id/:state
// @desc    Update blacklist status for an email and all customers with that email
// @access  Private (Store Owner Only)
router.put('/emails/:id/:state', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;
    const { id, state } = req.params;
    const is_blacklisted = state === 'true';

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get blacklist entry from tenant DB
    const { data: blacklistEntry } = await tenantDb
      .from('blacklist_emails')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!blacklistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Blacklist entry not found'
      });
    }

    // Verify it belongs to the correct store
    if (blacklistEntry.store_id !== store_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const email = blacklistEntry.email;

    // Update all customers with this email in tenant DB
    const { data: customers, error: updateError } = await tenantDb
      .from('customers')
      .update({
        is_blacklisted: is_blacklisted,
        blacklist_reason: is_blacklisted ? 'Email blacklisted' : null,
        blacklisted_at: is_blacklisted ? new Date().toISOString() : null
      })
      .eq('store_id', store_id)
      .eq('email', email.toLowerCase())
      .select();

    if (updateError) {
      console.error('Update customers error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    const updatedCount = customers ? customers.length : 0;

    // Delete the blacklist entry if setting to not blacklisted
    if (!is_blacklisted) {
      await tenantDb
        .from('blacklist_emails')
        .delete()
        .eq('id', id);
    }

    res.json({
      success: true,
      data: {
        updated_customers: updatedCount,
        email: email,
        is_blacklisted: is_blacklisted
      },
      message: is_blacklisted
        ? `Email blacklisted and ${updatedCount} customer(s) updated`
        : `Email removed from blacklist and ${updatedCount} customer(s) updated`
    });
  } catch (error) {
    console.error('Update blacklist email status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/blacklist/emails/:id
// @desc    Remove email from blacklist (legacy - use PUT /emails/:id/:state instead)
// @access  Private (Store Owner Only)
router.delete('/emails/:id', storeOwnerOnly, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Get blacklist entry from tenant DB
    const { data: blacklistEntry } = await tenantDb
      .from('blacklist_emails')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!blacklistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Blacklist entry not found'
      });
    }

    // Verify it belongs to the correct store
    if (blacklistEntry.store_id !== store_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const email = blacklistEntry.email;

    // Update all customers with this email to not blacklisted in tenant DB
    await tenantDb
      .from('customers')
      .update({
        is_blacklisted: false,
        blacklist_reason: null,
        blacklisted_at: null
      })
      .eq('store_id', store_id)
      .eq('email', email.toLowerCase());

    // Delete blacklist entry
    await tenantDb
      .from('blacklist_emails')
      .delete()
      .eq('id', req.params.id);

    res.json({
      success: true,
      message: 'Email address removed from blacklist'
    });
  } catch (error) {
    console.error('Delete blacklist email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
