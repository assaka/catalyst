#!/usr/bin/env node

const { supabase } = require('./src/database/connection');

async function migrateEnhancedVersioning() {
  try {
    console.log('🚀 Running enhanced versioning migration for slot_configurations...');
    
    if (!supabase) {
      console.error('❌ Supabase client not available - cannot run production migration');
      console.log('ℹ️ This script is for production use only');
      process.exit(1);
    }
    
    console.log('✅ Supabase connection available');
    
    // Check if table exists
    console.log('🔍 Checking if slot_configurations table exists...');
    const { data, error: checkError } = await supabase
      .from('slot_configurations')
      .select('*')
      .limit(1);
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking table:', checkError);
      process.exit(1);
    }
    
    const tableExists = !checkError;
    console.log(`📋 Table exists: ${tableExists}`);
    
    if (tableExists) {
      console.log('🔄 Executing enhanced versioning migration SQL...');
      
      const migrationSQL = `
        -- Enhanced versioning migration for slot_configurations
        BEGIN;
        
        -- Add 'acceptance' to the status enum if it doesn't exist
        DO $$
        BEGIN
          -- Check if the enum value already exists
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_slot_configurations_status') 
            AND enumlabel = 'acceptance'
          ) THEN
            -- Add 'acceptance' after 'draft'
            ALTER TYPE enum_slot_configurations_status ADD VALUE 'acceptance' AFTER 'draft';
            RAISE NOTICE 'Added acceptance status to ENUM';
          ELSE
            RAISE NOTICE 'Acceptance status already exists in ENUM';
          END IF;
        END $$;
        
        -- Add new columns if they don't exist
        DO $$
        BEGIN
          -- Add acceptance_published_at column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'acceptance_published_at') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN acceptance_published_at TIMESTAMPTZ;
            RAISE NOTICE 'Added acceptance_published_at column';
          ELSE
            RAISE NOTICE 'acceptance_published_at column already exists';
          END IF;
          
          -- Add acceptance_published_by column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'acceptance_published_by') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN acceptance_published_by UUID REFERENCES users(id);
            RAISE NOTICE 'Added acceptance_published_by column';
          ELSE
            RAISE NOTICE 'acceptance_published_by column already exists';
          END IF;
          
          -- Add current_edit_id column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'current_edit_id') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN current_edit_id UUID REFERENCES slot_configurations(id);
            RAISE NOTICE 'Added current_edit_id column';
          ELSE
            RAISE NOTICE 'current_edit_id column already exists';
          END IF;
        END $$;
        
        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_slot_config_current_edit 
        ON slot_configurations (current_edit_id);
        
        CREATE INDEX IF NOT EXISTS idx_slot_config_acceptance_status
        ON slot_configurations (store_id, status, page_type) WHERE status = 'acceptance';
        
        -- Update column comments
        COMMENT ON COLUMN slot_configurations.status IS 'Status of the configuration version: draft -> acceptance -> published';
        COMMENT ON COLUMN slot_configurations.acceptance_published_at IS 'Timestamp when this version was published to acceptance';
        COMMENT ON COLUMN slot_configurations.acceptance_published_by IS 'User who published this version to acceptance';
        COMMENT ON COLUMN slot_configurations.current_edit_id IS 'ID of the configuration currently being edited (for revert tracking)';
        
        COMMIT;
      `;
      
      const { error: migrationError } = await supabase.rpc('exec_sql', { 
        sql: migrationSQL 
      });
      
      if (migrationError) {
        console.error('❌ Migration failed:', migrationError);
        process.exit(1);
      }
      
      console.log('✅ Migration executed successfully');
    } else {
      console.log('⚠️ Table does not exist - it will be created when needed');
    }
    
    // Verify migration
    console.log('🧪 Verifying migration...');
    const { data: testData, error: testError } = await supabase
      .from('slot_configurations')
      .select('*')
      .limit(1);
    
    if (!testError && testData.length > 0) {
      const enhancedColumns = ['acceptance_published_at', 'acceptance_published_by', 'current_edit_id'];
      const record = testData[0];
      
      console.log('📋 Checking enhanced versioning columns:');
      for (const column of enhancedColumns) {
        const exists = column in record;
        console.log(`${exists ? '✅' : '❌'} ${column}: ${exists ? 'exists' : 'missing'}`);
      }
    } else if (testError && testError.code !== 'PGRST116') {
      console.log('⚠️ Could not verify - table might be empty or inaccessible');
    }
    
    console.log('🎉 Enhanced versioning migration completed!');
    console.log('📝 DTAP Flow now available:');
    console.log('   - Draft → Acceptance (preview)');
    console.log('   - Acceptance → Production (live)');
    console.log('   - Enhanced revert with proper tracking');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Enhanced versioning migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateEnhancedVersioning();
}

module.exports = migrateEnhancedVersioning;