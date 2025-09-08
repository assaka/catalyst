#!/usr/bin/env node

const { supabase } = require('./src/database/connection');

async function migrateProductionVersioning() {
  try {
    console.log('🚀 Running production versioning migration for slot_configurations...');
    
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
      // Check if versioning columns already exist
      console.log('🔍 Checking for existing versioning columns...');
      
      const migrationSQL = `
        -- Add versioning columns if they don't exist
        DO $$
        BEGIN
          -- Add status column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'status') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN status TEXT NOT NULL DEFAULT 'published' 
            CHECK (status IN ('draft', 'published', 'reverted'));
            RAISE NOTICE 'Added status column';
          ELSE
            RAISE NOTICE 'Status column already exists';
          END IF;
          
          -- Add version_number column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'version_number') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;
            RAISE NOTICE 'Added version_number column';
          ELSE
            RAISE NOTICE 'Version_number column already exists';
          END IF;
          
          -- Add page_type column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'page_type') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN page_type TEXT DEFAULT 'cart';
            RAISE NOTICE 'Added page_type column';
          ELSE
            RAISE NOTICE 'Page_type column already exists';
          END IF;
          
          -- Add published_at column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'published_at') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN published_at TIMESTAMPTZ;
            RAISE NOTICE 'Added published_at column';
          ELSE
            RAISE NOTICE 'Published_at column already exists';
          END IF;
          
          -- Add published_by column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'published_by') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN published_by UUID;
            RAISE NOTICE 'Added published_by column';
          ELSE
            RAISE NOTICE 'Published_by column already exists';
          END IF;
          
          -- Add parent_version_id column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'slot_configurations' AND column_name = 'parent_version_id') THEN
            ALTER TABLE slot_configurations 
            ADD COLUMN parent_version_id UUID;
            RAISE NOTICE 'Added parent_version_id column';
          ELSE
            RAISE NOTICE 'Parent_version_id column already exists';
          END IF;
        END
        $$;
        
        -- Update existing records
        UPDATE slot_configurations 
        SET 
          status = 'published', 
          version_number = 1,
          page_type = 'cart',
          published_at = COALESCE(updated_at, created_at, NOW())
        WHERE status IS NULL OR version_number IS NULL;
        
        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_slot_config_user_store_status_page 
        ON slot_configurations (user_id, store_id, status, page_type);
        
        CREATE INDEX IF NOT EXISTS idx_slot_config_store_status_page_version 
        ON slot_configurations (store_id, status, page_type, version_number);
        
        CREATE INDEX IF NOT EXISTS idx_slot_config_parent_version 
        ON slot_configurations (parent_version_id);
      `;
      
      console.log('🔄 Executing migration SQL...');
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
      const versioningColumns = ['status', 'version_number', 'page_type', 'published_at', 'published_by', 'parent_version_id'];
      const record = testData[0];
      
      console.log('📋 Checking versioning columns:');
      for (const column of versioningColumns) {
        const exists = column in record;
        console.log(\`\${exists ? '✅' : '❌'} \${column}: \${exists ? 'exists' : 'missing'}\`);
      }
    } else if (testError && testError.code !== 'PGRST116') {
      console.log('⚠️ Could not verify - table might be empty or inaccessible');
    }
    
    console.log('🎉 Production versioning migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Production migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateProductionVersioning();
}

module.exports = migrateProductionVersioning;