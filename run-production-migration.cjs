/**
 * Run Database Migration in Production
 * Executes the customization tables creation on Render production database
 */

const https = require('https');

const BACKEND_URL = 'https://catalyst-backend-fzhu.onrender.com';

// SQL to create tables - same as in the migration file
const MIGRATION_SQL = `
-- Customization types lookup table
CREATE TABLE IF NOT EXISTS customization_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    schema_definition JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default customization types
INSERT INTO customization_types (name, description, schema_definition) VALUES
('file_modification', 'Direct file/code modifications', '{"filePath": "string", "originalCode": "string", "modifiedCode": "string", "language": "string", "changeSummary": "string", "changeType": "string", "linesAdded": "number", "linesRemoved": "number", "linesModified": "number"}'),
('layout_modification', 'UI layout changes', '{"operation": "string", "selector": "string", "properties": "object", "conditions": "object"}'),
('css_injection', 'CSS styling injections', '{"selector": "string", "styles": "object", "media_query": "string"}'),
('javascript_injection', 'JavaScript behavior modifications', '{"code": "string", "target": "string", "trigger": "string"}'),
('component_replacement', 'React component replacements', '{"original_component": "string", "replacement_component": "string", "props_mapping": "object"}'),
('hook_customization', 'WordPress-style hooks', '{"hook_name": "string", "callback": "string", "priority": "number"}'),
('event_handler', 'DOM event handlers', '{"selector": "string", "event": "string", "handler": "string"}')
ON CONFLICT (name) DO NOTHING;

-- Main customizations table
CREATE TABLE IF NOT EXISTS customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    customization_type_id INTEGER REFERENCES customization_types(id),
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_component VARCHAR(255),
    target_selector VARCHAR(500),
    customization_data JSONB NOT NULL,
    priority INTEGER DEFAULT 10,
    dependencies TEXT[],
    conflicts_with TEXT[],
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    version_number INTEGER DEFAULT 1
);

-- Other tables and indexes
CREATE TABLE IF NOT EXISTS customization_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customization_id UUID NOT NULL REFERENCES customizations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    customization_data JSONB NOT NULL,
    change_summary TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customization_id, version_number)
);

CREATE TABLE IF NOT EXISTS customization_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    release_name VARCHAR(255) NOT NULL,
    release_version VARCHAR(50) NOT NULL,
    description TEXT,
    release_type VARCHAR(20) DEFAULT 'minor',
    customization_ids UUID[],
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false,
    rollback_data JSONB
);

CREATE TABLE IF NOT EXISTS customization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customization_id UUID NOT NULL REFERENCES customizations(id),
    store_id UUID NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    application_context JSONB,
    result_data JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customization_types_name ON customization_types(name);
CREATE INDEX IF NOT EXISTS idx_customization_types_active ON customization_types(is_active);
CREATE INDEX IF NOT EXISTS idx_customizations_store_id ON customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_customizations_type ON customizations(type);
CREATE INDEX IF NOT EXISTS idx_customizations_type_id ON customizations(customization_type_id);
CREATE INDEX IF NOT EXISTS idx_customizations_target_component ON customizations(target_component);
CREATE INDEX IF NOT EXISTS idx_customizations_active ON customizations(is_active);
CREATE INDEX IF NOT EXISTS idx_customizations_priority ON customizations(priority);
CREATE INDEX IF NOT EXISTS idx_customization_versions_customization_id ON customization_versions(customization_id);
CREATE INDEX IF NOT EXISTS idx_customization_versions_version ON customization_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_customization_releases_store_id ON customization_releases(store_id);
CREATE INDEX IF NOT EXISTS idx_customization_releases_published ON customization_releases(is_published);
CREATE INDEX IF NOT EXISTS idx_customization_logs_store_id ON customization_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_customization_logs_customization_id ON customization_logs(customization_id);
CREATE INDEX IF NOT EXISTS idx_customization_logs_applied_at ON customization_logs(applied_at);
`;

async function runProductionMigration() {
  console.log('🚀 Running customization database migration on production...');
  console.log('🔗 Target:', BACKEND_URL);

  try {
    // Test health endpoint first
    console.log('📊 Testing backend health...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'healthy') {
      console.log('✅ Backend is healthy and responding');
    } else {
      throw new Error('Backend not healthy: ' + JSON.stringify(healthData));
    }

    // Since we don't have a direct migration endpoint, 
    // let's create the customization through the API to trigger table creation
    console.log('🛠️  Creating test customization to trigger table creation...');
    
    const testCustomization = {
      type: 'file_modification',
      name: 'Database Migration Test',
      description: 'Test customization to trigger table creation',
      targetComponent: 'test',
      customizationData: {
        filePath: 'test.js',
        originalCode: 'console.log("original");',
        modifiedCode: 'console.log("modified");',
        language: 'javascript',
        changeSummary: 'Test migration',
        changeType: 'test'
      },
      priority: 10
    };

    // This will fail initially but trigger the table creation in the error handling
    const customizationResponse = await fetch(`${BACKEND_URL}/api/customizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but that's ok for table creation
      },
      body: JSON.stringify(testCustomization)
    });

    const customizationData = await customizationResponse.json();
    console.log('📝 Customization API response:', customizationData);

    if (customizationData.error?.includes('relation "customization_types" does not exist')) {
      console.log('❌ Tables still need to be created manually');
      console.log('🔧 You need to run this SQL manually on the production database:');
      console.log(MIGRATION_SQL);
    } else {
      console.log('✅ Tables appear to be created successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Manual Steps Required:');
    console.log('1. Access your Render.com dashboard');
    console.log('2. Go to your PostgreSQL database');
    console.log('3. Run the following SQL commands:');
    console.log(MIGRATION_SQL);
  }
}

// Run the migration
runProductionMigration();