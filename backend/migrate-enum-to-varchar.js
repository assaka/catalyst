#!/usr/bin/env node

const { supabase } = require('./src/database/connection');

async function migrateEnumToVarchar() {
  try {
    console.log('🚀 Converting slot_configurations.status from ENUM to VARCHAR...');
    
    if (!supabase) {
      console.error('❌ Supabase client not available - cannot run production migration');
      console.log('ℹ️ Make sure these environment variables are set:');
      console.log('   - SUPABASE_URL');
      console.log('   - SUPABASE_SERVICE_ROLE_KEY');
      console.log('   - NODE_ENV=production (or DATABASE_URL set)');
      process.exit(1);
    }
    
    console.log('✅ Supabase connection available');
    
    // Check if table exists and get current column info
    console.log('🔍 Checking current status column type...');
    const { data: columnInfo, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'slot_configurations' AND column_name = 'status'
      `
    });
    
    if (columnError) {
      console.error('❌ Error checking column info:', columnError);
      process.exit(1);
    }
    
    if (!columnInfo || columnInfo.length === 0) {
      console.error('❌ Status column not found in slot_configurations table');
      process.exit(1);
    }
    
    const currentType = columnInfo[0].data_type;
    console.log(`📋 Current status column type: ${currentType}`);
    
    if (currentType === 'character varying' || currentType === 'varchar') {
      console.log('✅ Status column is already VARCHAR - no migration needed');
      process.exit(0);
    }
    
    console.log('🔄 Beginning ENUM to VARCHAR conversion...');
    
    const migrationSQL = `
      -- Drop and recreate slot_configurations table with VARCHAR status
      BEGIN;
      
      -- Step 1: Create backup table
      CREATE TEMP TABLE slot_configurations_backup AS 
      SELECT * FROM slot_configurations;
      
      -- Step 2: Drop existing table and enum type
      DROP TABLE slot_configurations CASCADE;
      DROP TYPE IF EXISTS enum_slot_configurations_status CASCADE;
      
      -- Step 3: Recreate table with VARCHAR status
      CREATE TABLE slot_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE ON UPDATE CASCADE,
        configuration JSONB NOT NULL,
        version VARCHAR DEFAULT '1.0' NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' NOT NULL,
        version_number INTEGER DEFAULT 1 NOT NULL,
        page_type VARCHAR DEFAULT 'cart',
        published_at TIMESTAMPTZ,
        published_by UUID REFERENCES users(id),
        acceptance_published_at TIMESTAMPTZ,
        acceptance_published_by UUID REFERENCES users(id),
        current_edit_id UUID REFERENCES slot_configurations(id),
        parent_version_id UUID REFERENCES slot_configurations(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      
      -- Step 4: Add constraints
      ALTER TABLE slot_configurations 
      ADD CONSTRAINT chk_status_values 
      CHECK (status IN ('draft', 'acceptance', 'published', 'reverted'));
      
      -- Step 5: Create indexes
      CREATE INDEX idx_user_store_status_page ON slot_configurations (user_id, store_id, status, page_type);
      CREATE INDEX idx_store_status_page_version ON slot_configurations (store_id, status, page_type, version_number);
      CREATE INDEX idx_parent_version ON slot_configurations (parent_version_id);
      CREATE INDEX idx_current_edit ON slot_configurations (current_edit_id);
      CREATE INDEX idx_slot_config_store ON slot_configurations (store_id);
      CREATE INDEX idx_slot_config_active ON slot_configurations (is_active);
      CREATE INDEX idx_slot_config_status ON slot_configurations (status);
      
      -- Step 6: Add column comments
      COMMENT ON TABLE slot_configurations IS 'Slot configurations with versioning support';
      COMMENT ON COLUMN slot_configurations.status IS 'Status of the configuration version: draft -> acceptance -> published';
      COMMENT ON COLUMN slot_configurations.acceptance_published_at IS 'Timestamp when this version was published to acceptance';
      COMMENT ON COLUMN slot_configurations.acceptance_published_by IS 'User who published this version to acceptance';
      COMMENT ON COLUMN slot_configurations.current_edit_id IS 'ID of the configuration currently being edited (for revert tracking)';
      
      -- Step 7: Restore data
      INSERT INTO slot_configurations (
        id, user_id, store_id, configuration, version, is_active, status, 
        version_number, page_type, published_at, published_by, 
        acceptance_published_at, acceptance_published_by, current_edit_id,
        parent_version_id, created_at, updated_at
      )
      SELECT 
        id, user_id, store_id, configuration, version, is_active, status::text,
        version_number, page_type, published_at, published_by,
        acceptance_published_at, acceptance_published_by, current_edit_id,
        parent_version_id, created_at, updated_at
      FROM slot_configurations_backup;
      
      COMMIT;
    `;
    
    console.log('📝 Executing conversion SQL...');
    const { error: migrationError } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      
      // Attempt rollback
      console.log('🔄 Attempting rollback...');
      try {
        await supabase.rpc('exec_sql', { sql: 'ROLLBACK;' });
        console.log('✅ Rollback completed');
      } catch (rollbackError) {
        console.error('❌ Rollback also failed:', rollbackError);
      }
      
      process.exit(1);
    }
    
    // Verify the conversion
    console.log('🧪 Verifying conversion...');
    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'slot_configurations' AND column_name = 'status'
      `
    });
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else if (verifyData && verifyData.length > 0) {
      const newColumnInfo = verifyData[0];
      console.log('✅ Conversion verified:');
      console.log(`   - Type: ${newColumnInfo.data_type}`);
      console.log(`   - Length: ${newColumnInfo.character_maximum_length}`);
      console.log(`   - Nullable: ${newColumnInfo.is_nullable}`);
      console.log(`   - Default: ${newColumnInfo.column_default}`);
    }
    
    // Test constraint by checking existing data
    console.log('🔍 Checking existing status values...');
    const { data: statusData, error: statusError } = await supabase
      .from('slot_configurations')
      .select('status')
      .limit(10);
    
    if (statusError) {
      console.log('⚠️ Could not verify existing data:', statusError.message);
    } else {
      const uniqueStatuses = [...new Set(statusData.map(row => row.status))];
      console.log('📊 Existing status values:', uniqueStatuses);
    }
    
    console.log('🎉 ENUM to VARCHAR conversion completed successfully!');
    console.log('✨ Benefits:');
    console.log('   - More flexible status management');
    console.log('   - Easier to add new statuses without enum modifications');
    console.log('   - Better compatibility with ORMs');
    console.log('   - Maintained data integrity with check constraints');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateEnumToVarchar();
}

module.exports = migrateEnumToVarchar;