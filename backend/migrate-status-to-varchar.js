#!/usr/bin/env node

// Simple migration script for Render + Supabase
// Run with: node migrate-status-to-varchar.js

const { createClient } = require('@supabase/supabase-js');

async function migrateStatusColumn() {
  try {
    console.log('🚀 Converting slot_configurations.status from ENUM to VARCHAR...');
    
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.includes('supabase') ? process.env.DATABASE_URL.split('@')[1]?.split('.')[0] + '.supabase.co' : null;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    console.log('🔍 Environment check:');
    console.log(`   - SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - SUPABASE_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing required environment variables');
      process.exit(1);
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');
    
    // Check current table structure
    console.log('🔍 Checking current table structure...');
    
    const { data: tableCheck, error: tableError } = await supabase
      .from('slot_configurations')
      .select('*')
      .limit(1);
    
    if (tableError && !tableError.message.includes('relation "slot_configurations" does not exist')) {
      console.error('❌ Error checking table:', tableError);
      process.exit(1);
    }
    
    if (tableError && tableError.message.includes('relation "slot_configurations" does not exist')) {
      console.log('📋 Table does not exist - will be created by application');
      process.exit(0);
    }
    
    console.log('📋 Table exists, proceeding with migration...');
    
    // Execute the migration
    const migrationSQL = `
      -- Drop and recreate slot_configurations table with VARCHAR status
      BEGIN;
      
      -- Step 1: Create backup table
      CREATE TEMP TABLE slot_configurations_backup AS 
      SELECT * FROM slot_configurations;
      
      -- Step 2: Drop existing table and enum type
      DROP TABLE IF EXISTS slot_configurations CASCADE;
      DROP TYPE IF EXISTS enum_slot_configurations_status CASCADE;
      
      -- Step 3: Recreate table with VARCHAR status
      CREATE TABLE slot_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        store_id UUID NOT NULL,
        configuration JSONB NOT NULL,
        version VARCHAR DEFAULT '1.0' NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' NOT NULL,
        version_number INTEGER DEFAULT 1 NOT NULL,
        page_type VARCHAR DEFAULT 'cart',
        published_at TIMESTAMPTZ,
        published_by UUID,
        acceptance_published_at TIMESTAMPTZ,
        acceptance_published_by UUID,
        current_edit_id UUID,
        parent_version_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      
      -- Step 4: Add foreign key constraints
      ALTER TABLE slot_configurations ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      ALTER TABLE slot_configurations ADD CONSTRAINT fk_store_id FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
      ALTER TABLE slot_configurations ADD CONSTRAINT fk_published_by FOREIGN KEY (published_by) REFERENCES users(id);
      ALTER TABLE slot_configurations ADD CONSTRAINT fk_acceptance_published_by FOREIGN KEY (acceptance_published_by) REFERENCES users(id);
      ALTER TABLE slot_configurations ADD CONSTRAINT fk_current_edit_id FOREIGN KEY (current_edit_id) REFERENCES slot_configurations(id);
      ALTER TABLE slot_configurations ADD CONSTRAINT fk_parent_version_id FOREIGN KEY (parent_version_id) REFERENCES slot_configurations(id);
      
      -- Step 5: Add check constraint
      ALTER TABLE slot_configurations 
      ADD CONSTRAINT chk_status_values 
      CHECK (status IN ('draft', 'acceptance', 'published', 'reverted'));
      
      -- Step 6: Create indexes
      CREATE INDEX idx_user_store_status_page ON slot_configurations (user_id, store_id, status, page_type);
      CREATE INDEX idx_store_status_page_version ON slot_configurations (store_id, status, page_type, version_number);
      CREATE INDEX idx_parent_version ON slot_configurations (parent_version_id);
      CREATE INDEX idx_current_edit ON slot_configurations (current_edit_id);
      CREATE INDEX idx_slot_config_store ON slot_configurations (store_id);
      CREATE INDEX idx_slot_config_active ON slot_configurations (is_active);
      CREATE INDEX idx_slot_config_status ON slot_configurations (status);
      
      -- Step 7: Add comments
      COMMENT ON TABLE slot_configurations IS 'Slot configurations with versioning support';
      COMMENT ON COLUMN slot_configurations.status IS 'Status: draft -> acceptance -> published';
      
      -- Step 8: Restore data (if any existed)
      INSERT INTO slot_configurations (
        id, user_id, store_id, configuration, version, is_active, status, 
        version_number, page_type, published_at, published_by, 
        acceptance_published_at, acceptance_published_by, current_edit_id,
        parent_version_id, created_at, updated_at
      )
      SELECT 
        id, user_id, store_id, configuration, version, is_active, 
        CASE 
          WHEN status::text = 'draft' THEN 'draft'
          WHEN status::text = 'acceptance' THEN 'acceptance'  
          WHEN status::text = 'published' THEN 'published'
          WHEN status::text = 'reverted' THEN 'reverted'
          ELSE 'draft'
        END as status,
        version_number, page_type, published_at, published_by,
        acceptance_published_at, acceptance_published_by, current_edit_id,
        parent_version_id, created_at, updated_at
      FROM slot_configurations_backup
      WHERE EXISTS (SELECT 1 FROM slot_configurations_backup);
      
      COMMIT;
    `;
    
    console.log('📝 Executing migration SQL...');
    
    // Note: Supabase client doesn't have direct SQL execution, so we'll use a different approach
    // We need to use the REST API or direct PostgreSQL connection
    console.log('⚠️  Direct SQL execution requires database admin access');
    console.log('🔧 You may need to run this SQL manually in Supabase dashboard:');
    console.log('');
    console.log('-- MIGRATION SQL --');
    console.log(migrationSQL);
    console.log('-- END MIGRATION SQL --');
    console.log('');
    
    // Alternative: Try using RPC if available
    console.log('💡 Alternatively, you can:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Paste and run the migration SQL above');
    console.log('3. Or set up a PostgreSQL admin function to execute this');
    
    console.log('🎉 Migration SQL prepared successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateStatusColumn();