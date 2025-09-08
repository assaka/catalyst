#!/usr/bin/env node

const { supabase } = require('./src/database/connection');

async function migrateSupabaseVersioning() {
  try {
    console.log('🚀 Running Supabase versioning migration...');
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      process.exit(1);
    }
    
    // Check if table exists and get its current structure
    console.log('🔍 Checking current table structure...');
    const { data: existing, error: checkError } = await supabase
      .from('slot_configurations')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking table:', checkError);
      process.exit(1);
    }
    
    console.log('✅ Table exists, checking for versioning columns...');
    
    const versioningColumns = ['status', 'version_number', 'page_type', 'published_at', 'published_by', 'parent_version_id'];
    const hasData = existing && existing.length > 0;
    let missingColumns = [];
    
    if (hasData) {
      missingColumns = versioningColumns.filter(col => !(col in existing[0]));
      console.log(`📋 Current columns: ${Object.keys(existing[0]).join(', ')}`);
      console.log(`🔧 Missing versioning columns: ${missingColumns.join(', ') || 'None'}`);
    } else {
      console.log('📋 Table exists but has no data to check structure');
      // Assume we need all versioning columns
      missingColumns = versioningColumns;
    }
    
    if (missingColumns.length === 0) {
      console.log('✅ All versioning columns already exist!');
      process.exit(0);
    }
    
    // Run SQL migration to add missing columns
    console.log('🔄 Adding versioning columns to Supabase...');
    
    const migrationSQL = `
      -- Add versioning columns to slot_configurations table
      DO $$
      BEGIN
        -- Add status column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'slot_configurations' AND column_name = 'status') THEN
          ALTER TABLE slot_configurations 
          ADD COLUMN status TEXT NOT NULL DEFAULT 'published' 
          CHECK (status IN ('draft', 'published', 'reverted'));
        END IF;
        
        -- Add version_number column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'slot_configurations' AND column_name = 'version_number') THEN
          ALTER TABLE slot_configurations 
          ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;
        END IF;
        
        -- Add page_type column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'slot_configurations' AND column_name = 'page_type') THEN
          ALTER TABLE slot_configurations 
          ADD COLUMN page_type TEXT DEFAULT 'cart';
        END IF;
        
        -- Add published_at column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'slot_configurations' AND column_name = 'published_at') THEN
          ALTER TABLE slot_configurations 
          ADD COLUMN published_at TIMESTAMPTZ;
        END IF;
        
        -- Add published_by column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'slot_configurations' AND column_name = 'published_by') THEN
          ALTER TABLE slot_configurations 
          ADD COLUMN published_by UUID REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        
        -- Add parent_version_id column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'slot_configurations' AND column_name = 'parent_version_id') THEN
          ALTER TABLE slot_configurations 
          ADD COLUMN parent_version_id UUID REFERENCES slot_configurations(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
      
      -- Update existing records to have published status and version 1
      UPDATE slot_configurations 
      SET 
        status = 'published', 
        version_number = 1,
        page_type = 'cart',
        published_at = COALESCE(updated_at, created_at)
      WHERE is_active = true;
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_slot_config_user_store_status_page 
      ON slot_configurations (user_id, store_id, status, page_type);
      
      CREATE INDEX IF NOT EXISTS idx_slot_config_store_status_page_version 
      ON slot_configurations (store_id, status, page_type, version_number);
      
      CREATE INDEX IF NOT EXISTS idx_slot_config_parent_version 
      ON slot_configurations (parent_version_id);
    `;
    
    // Execute the migration SQL
    const { error: migrationError } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      process.exit(1);
    }
    
    console.log('✅ Versioning migration completed successfully!');
    
    // Verify the migration
    console.log('🧪 Verifying migration...');
    const { data: updated, error: verifyError } = await supabase
      .from('slot_configurations')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError);
    } else if (updated && updated.length > 0) {
      const record = updated[0];
      console.log('📋 Updated table structure:', Object.keys(record).join(', '));
      
      // Check if all versioning columns are present
      const allPresent = versioningColumns.every(col => col in record);
      console.log(`🔧 All versioning columns present: ${allPresent ? '✅ Yes' : '❌ No'}`);
      
      if (allPresent) {
        console.log('🎉 Migration verification successful!');
      }
    }
    
    // Count updated records
    const { count, error: countError } = await supabase
      .from('slot_configurations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (!countError) {
      console.log(`📊 Records updated to 'published' status: ${count}`);
    }
    
    console.log('🎉 Supabase versioning migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Supabase versioning migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateSupabaseVersioning();
}

module.exports = migrateSupabaseVersioning;