const express = require('express');
const router = express.Router();
const { supabase } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');

// Apply authentication middleware only if not accessed via public API
// Public API requests (like from storefront) don't need auth for reading
const conditionalAuthMiddleware = (req, res, next) => {
  // If this is a public API call (GET requests for storefront), skip auth
  if (req.method === 'GET' && req.baseUrl.includes('/public/')) {
    return next();
  }
  // For all other operations (POST, PUT, DELETE), require authentication
  return authMiddleware(req, res, next);
};

router.use(conditionalAuthMiddleware);

// Health check route for debugging
router.get('/health', async (req, res) => {
  res.json({ status: 'OK', message: 'Custom option rules API is working' });
});

// Get all custom option rules
router.get('/', async (req, res) => {
  try {
    const { store_id, order_by = '-created_at', limit, offset } = req.query;
    
    let query = supabase
      .from('custom_option_rules')
      .select('*');
    
    if (store_id) {
      query = query.eq('store_id', store_id);
    }
    
    // Handle ordering
    if (order_by) {
      const isDesc = order_by.startsWith('-');
      const field = isDesc ? order_by.substring(1) : order_by;
      query = query.order(field, { ascending: !isDesc });
    }
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching custom option rules:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (error) {
    console.error('Error in GET /custom-option-rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific custom option rule
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('custom_option_rules')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Custom option rule not found' });
      }
      console.error('Error fetching custom option rule:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error in GET /custom-option-rules/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new custom option rule
router.post('/', async (req, res) => {
  try {
    const {
      name,
      display_label = 'Custom Options',
      is_active = true,
      conditions = {},
      optional_product_ids = [],
      store_id,
      translations = {}
    } = req.body;

    if (!name || !store_id) {
      return res.status(400).json({
        error: 'Missing required fields: name and store_id are required'
      });
    }

    const ruleData = {
      name,
      display_label,
      is_active,
      conditions,
      optional_product_ids,
      store_id,
      translations,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('custom_option_rules')
      .insert([ruleData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating custom option rule:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json(data);
  } catch (error) {
    console.error('Error in POST /custom-option-rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a custom option rule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      display_label,
      is_active,
      conditions,
      optional_product_ids,
      store_id,
      translations
    } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (display_label !== undefined) updateData.display_label = display_label;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (optional_product_ids !== undefined) updateData.optional_product_ids = optional_product_ids;
    if (store_id !== undefined) updateData.store_id = store_id;
    if (translations !== undefined) updateData.translations = translations;
    
    const { data, error } = await supabase
      .from('custom_option_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Custom option rule not found' });
      }
      console.error('Error updating custom option rule:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error in PUT /custom-option-rules/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a custom option rule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('custom_option_rules')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting custom option rule:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ message: 'Custom option rule deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /custom-option-rules/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;