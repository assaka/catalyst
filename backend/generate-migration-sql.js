#!/usr/bin/env node

// Generate migration SQL for converting ENUM to VARCHAR
// This can be run in Supabase Dashboard → SQL Editor

console.log('🚀 Generating SQL to convert slot_configurations.status from ENUM to VARCHAR...');
console.log('');
console.log('📋 Copy and paste this SQL into Supabase Dashboard → SQL Editor:');
console.log('');
console.log('-- ================================================');
console.log('-- SLOT CONFIGURATIONS: ENUM → VARCHAR MIGRATION');
console.log('-- ================================================');
console.log('');

const migrationSQL = `-- Convert slot_configurations.status from ENUM to VARCHAR
-- Run this in Supabase Dashboard → SQL Editor

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

-- Step 4: Add foreign key constraints (if referenced tables exist)
DO $$
BEGIN
  -- Add foreign keys only if target tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE slot_configurations ADD CONSTRAINT fk_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE slot_configurations ADD CONSTRAINT fk_published_by 
    FOREIGN KEY (published_by) REFERENCES users(id);
    
    ALTER TABLE slot_configurations ADD CONSTRAINT fk_acceptance_published_by 
    FOREIGN KEY (acceptance_published_by) REFERENCES users(id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
    ALTER TABLE slot_configurations ADD CONSTRAINT fk_store_id 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Self-referencing foreign keys
ALTER TABLE slot_configurations ADD CONSTRAINT fk_current_edit_id 
FOREIGN KEY (current_edit_id) REFERENCES slot_configurations(id);

ALTER TABLE slot_configurations ADD CONSTRAINT fk_parent_version_id 
FOREIGN KEY (parent_version_id) REFERENCES slot_configurations(id);

-- Step 5: Add check constraint for valid status values
ALTER TABLE slot_configurations 
ADD CONSTRAINT chk_status_values 
CHECK (status IN ('draft', 'acceptance', 'published', 'reverted'));

-- Step 6: Create indexes for performance
CREATE INDEX idx_user_store_status_page ON slot_configurations (user_id, store_id, status, page_type);
CREATE INDEX idx_store_status_page_version ON slot_configurations (store_id, status, page_type, version_number);
CREATE INDEX idx_parent_version ON slot_configurations (parent_version_id);
CREATE INDEX idx_current_edit ON slot_configurations (current_edit_id);
CREATE INDEX idx_slot_config_store ON slot_configurations (store_id);
CREATE INDEX idx_slot_config_active ON slot_configurations (is_active);
CREATE INDEX idx_slot_config_status ON slot_configurations (status);

-- Step 7: Add table and column comments
COMMENT ON TABLE slot_configurations IS 'Slot configurations with DTAP versioning support';
COMMENT ON COLUMN slot_configurations.status IS 'Status: draft → acceptance → published';
COMMENT ON COLUMN slot_configurations.acceptance_published_at IS 'Timestamp when published to acceptance';
COMMENT ON COLUMN slot_configurations.acceptance_published_by IS 'User who published to acceptance';
COMMENT ON COLUMN slot_configurations.current_edit_id IS 'Currently edited configuration ID';

-- Step 8: Restore data from backup (if any existed)
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
WHERE EXISTS (SELECT 1 FROM slot_configurations_backup LIMIT 1);

COMMIT;

-- Verification queries
SELECT 'Migration completed successfully' as message;
SELECT COUNT(*) as total_records FROM slot_configurations;
SELECT status, COUNT(*) as count FROM slot_configurations GROUP BY status;`;

console.log(migrationSQL);
console.log('');
console.log('-- ================================================');
console.log('-- END MIGRATION SQL');
console.log('-- ================================================');
console.log('');
console.log('✅ Migration SQL generated successfully!');
console.log('');
console.log('📋 Instructions:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute the migration');
console.log('5. Check the verification output at the bottom');
console.log('');
console.log('⚠️  This will:');
console.log('   - Backup your existing data');
console.log('   - Drop and recreate the table with VARCHAR status');
console.log('   - Restore all your data');
console.log('   - Add proper constraints and indexes');
console.log('');
console.log('🎯 Benefits after migration:');
console.log('   - Flexible status management');
console.log('   - Easy to add new statuses');
console.log('   - Better ORM compatibility');
console.log('   - No enum type dependencies');
console.log('');
console.log('🚀 Ready to run on Supabase!');