const express = require('express');
const router = express.Router();

// Route to get SQL commands for creating custom_option_rules table
router.post('/add-custom-option-rules-table', async (req, res) => {
  try {
    console.log('Providing SQL for custom_option_rules table creation...');
    
    const sqlCommands = `
-- Create custom_option_rules table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_option_rules_store_id ON custom_option_rules(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_option_rules_is_active ON custom_option_rules(is_active);

-- Create trigger for updated_at (function already exists)
CREATE TRIGGER update_custom_option_rules_updated_at 
BEFORE UPDATE ON custom_option_rules 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
    
    res.json({ 
      success: true, 
      message: 'SQL commands for custom_option_rules table',
      sql: sqlCommands,
      instructions: 'Execute these SQL commands in your Supabase SQL editor',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate SQL', 
      details: error.message 
    });
  }
});

module.exports = router;