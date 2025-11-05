const express = require('express');
const { BlacklistIP, BlacklistCountry, BlacklistEmail, BlacklistSettings } = require('../models');
const { storeOwnerOnly } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

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

    let settings = await BlacklistSettings.findOne({ where: { store_id } });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await BlacklistSettings.create({
        store_id,
        block_by_ip: false,
        block_by_email: true,
        block_by_country: false
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

    let settings = await BlacklistSettings.findOne({ where: { store_id } });

    if (settings) {
      await settings.update({
        block_by_ip,
        block_by_email,
        block_by_country
      });
    } else {
      settings = await BlacklistSettings.create({
        store_id,
        block_by_ip,
        block_by_email,
        block_by_country
      });
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

    const offset = (page - 1) * limit;
    const whereClause = { store_id };

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { ip_address: { [Op.iLike]: `%${search}%` } },
        { reason: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const ips = await BlacklistIP.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        ips: ips.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(ips.count / limit),
          total_items: ips.count,
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

    // Check if IP already exists
    const existing = await BlacklistIP.findOne({
      where: { store_id, ip_address }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This IP address is already blacklisted'
      });
    }

    const blacklistEntry = await BlacklistIP.create({
      store_id,
      ip_address,
      reason,
      created_by: req.user?.id
    });

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
    const blacklistEntry = await BlacklistIP.findByPk(req.params.id);

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

    await blacklistEntry.destroy();
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

    const offset = (page - 1) * limit;
    const whereClause = { store_id };

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { country_code: { [Op.iLike]: `%${search}%` } },
        { country_name: { [Op.iLike]: `%${search}%` } },
        { reason: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const countries = await BlacklistCountry.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        countries: countries.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(countries.count / limit),
          total_items: countries.count,
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

    // Check if country already exists
    const existing = await BlacklistCountry.findOne({
      where: { store_id, country_code }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This country is already blacklisted'
      });
    }

    const blacklistEntry = await BlacklistCountry.create({
      store_id,
      country_code: country_code.toUpperCase(),
      country_name,
      reason,
      created_by: req.user?.id
    });

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
    const blacklistEntry = await BlacklistCountry.findByPk(req.params.id);

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

    await blacklistEntry.destroy();
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

    const offset = (page - 1) * limit;
    const whereClause = { store_id };

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { reason: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const emails = await BlacklistEmail.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        emails: emails.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(emails.count / limit),
          total_items: emails.count,
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

    // Check if email already exists
    const existing = await BlacklistEmail.findOne({
      where: { store_id, email: email.toLowerCase() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This email address is already blacklisted'
      });
    }

    const blacklistEntry = await BlacklistEmail.create({
      store_id,
      email: email.toLowerCase(),
      reason,
      created_by: req.user?.id
    });

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

    const blacklistEntry = await BlacklistEmail.findByPk(id);

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

    // Update all customers with this email
    const { Customer } = require('../models');
    const [updatedCount] = await Customer.update(
      {
        is_blacklisted: is_blacklisted,
        blacklist_reason: is_blacklisted ? 'Email blacklisted' : null,
        blacklisted_at: is_blacklisted ? new Date() : null
      },
      {
        where: {
          store_id: store_id,
          email: email.toLowerCase()
        }
      }
    );

    // Delete the blacklist entry if setting to not blacklisted
    if (!is_blacklisted) {
      await blacklistEntry.destroy();
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
    const blacklistEntry = await BlacklistEmail.findByPk(req.params.id);

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

    // Update all customers with this email to not blacklisted
    const { Customer } = require('../models');
    await Customer.update(
      {
        is_blacklisted: false,
        blacklist_reason: null,
        blacklisted_at: null
      },
      {
        where: {
          store_id: store_id,
          email: email.toLowerCase()
        }
      }
    );

    await blacklistEntry.destroy();
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
