const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// Migration route to add custom_option_rules table
router.post('/add-custom-option-rules-table', async (req, res) => {
  try {
    console.log('Starting custom_option_rules table creation...');
    
    // Create the custom_option_rules table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS custom_option_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        display_label VARCHAR(255) DEFAULT 'Custom Options',
        is_active BOOLEAN DEFAULT true,
        conditions JSONB DEFAULT '{}',
        optional_product_ids JSONB DEFAULT '[]',
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const { error: tableError } = await supabase.rpc('exec_sql', { 
      sql: createTableQuery 
    });
    
    if (tableError) {
      console.error('Error creating table:', tableError);
      return res.status(500).json({ 
        error: 'Failed to create table', 
        details: tableError.message 
      });
    }
    
    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_custom_option_rules_store_id ON custom_option_rules(store_id);',
      'CREATE INDEX IF NOT EXISTS idx_custom_option_rules_is_active ON custom_option_rules(is_active);'
    ];
    
    for (const indexQuery of indexQueries) {
      const { error: indexError } = await supabase.rpc('exec_sql', { 
        sql: indexQuery 
      });
      
      if (indexError) {
        console.error('Error creating index:', indexError);
        // Continue with other indexes even if one fails
      }
    }
    
    // Create trigger for updated_at
    const triggerQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      CREATE TRIGGER update_custom_option_rules_updated_at 
      BEFORE UPDATE ON custom_option_rules 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql: triggerQuery 
    });
    
    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
      // This is not critical, so we continue
    }
    
    console.log('custom_option_rules table created successfully');
    
    res.json({ 
      success: true, 
      message: 'custom_option_rules table created successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    });
  }
});

module.exports = router;