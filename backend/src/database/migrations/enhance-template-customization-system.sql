-- Enhanced Template Customization System Migration
-- Separates JS from HTML and adds better customization support

-- Add JavaScript assets table for separated JS code
CREATE TABLE IF NOT EXISTS template_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    template_id UUID REFERENCES store_templates(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('javascript', 'css', 'image', 'font', 'other')),
    asset_name VARCHAR(255) NOT NULL,
    asset_path VARCHAR(500) NOT NULL, -- Path in store's Supabase
    asset_url TEXT NOT NULL, -- Full URL to the asset
    file_size INTEGER DEFAULT 0,
    mime_type VARCHAR(100),
    checksum VARCHAR(64), -- For integrity checking
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(store_id, template_id, asset_name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_assets_store ON template_assets(store_id);
CREATE INDEX IF NOT EXISTS idx_template_assets_template ON template_assets(template_id);
CREATE INDEX IF NOT EXISTS idx_template_assets_type ON template_assets(asset_type);

-- Add template components table for reusable components
CREATE TABLE IF NOT EXISTS template_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    component_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL CHECK (component_type IN ('widget', 'section', 'element', 'layout')),
    html_template TEXT NOT NULL,
    css_styles JSON DEFAULT '{}',
    javascript_code TEXT, -- Optional JS for the component
    schema_definition JSON DEFAULT '{}', -- Props/configuration schema
    preview_image TEXT, -- URL to preview image
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Can be shared with other stores
    tags JSON DEFAULT '[]', -- For categorization
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(store_id, component_name)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_template_components_store ON template_components(store_id);
CREATE INDEX IF NOT EXISTS idx_template_components_type ON template_components(component_type);
CREATE INDEX IF NOT EXISTS idx_template_components_public ON template_components(is_public);

-- Add template customization layers
CREATE TABLE IF NOT EXISTS template_customization_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES store_templates(id) ON DELETE CASCADE,
    layer_name VARCHAR(255) NOT NULL, -- e.g., 'header', 'footer', 'sidebar'
    layer_type VARCHAR(50) NOT NULL CHECK (layer_type IN ('global', 'page-specific', 'conditional')),
    html_content TEXT,
    css_styles JSON DEFAULT '{}',
    javascript_handlers JSON DEFAULT '{}', -- Event handlers, etc.
    display_conditions JSON DEFAULT '{}', -- When to show this layer
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_customization_layers_store ON template_customization_layers(store_id);
CREATE INDEX IF NOT EXISTS idx_customization_layers_template ON template_customization_layers(template_id);
CREATE INDEX IF NOT EXISTS idx_customization_layers_active ON template_customization_layers(is_active);

-- Add store data migration tracking
CREATE TABLE IF NOT EXISTS store_data_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    migration_type VARCHAR(100) NOT NULL, -- 'catalog', 'sales', 'content', 'analytics'
    source_system VARCHAR(50) DEFAULT 'catalyst', 
    target_system VARCHAR(50) NOT NULL, -- 'supabase'
    supabase_project_url TEXT,
    supabase_anon_key TEXT,
    supabase_service_key TEXT, -- Encrypted
    migration_status VARCHAR(50) DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed', 'paused')),
    migration_config JSON DEFAULT '{}', -- Tables to migrate, transforms, etc.
    migrated_tables JSON DEFAULT '[]', -- List of completed table migrations
    migration_progress DECIMAL(5,2) DEFAULT 0.00, -- Progress percentage
    last_sync_at TIMESTAMP,
    error_log JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(store_id, migration_type, target_system)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_data_migrations_store ON store_data_migrations(store_id);
CREATE INDEX IF NOT EXISTS idx_data_migrations_status ON store_data_migrations(migration_status);
CREATE INDEX IF NOT EXISTS idx_data_migrations_type ON store_data_migrations(migration_type);

-- Add store Supabase connections table
CREATE TABLE IF NOT EXISTS store_supabase_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    connection_name VARCHAR(255) NOT NULL DEFAULT 'primary',
    project_url TEXT NOT NULL,
    anon_key TEXT NOT NULL, -- For frontend access
    service_key TEXT NOT NULL, -- Encrypted, for backend operations
    jwt_secret TEXT, -- Encrypted, for token validation
    database_url TEXT, -- Direct database access if needed
    connection_status VARCHAR(50) DEFAULT 'active' CHECK (connection_status IN ('active', 'inactive', 'error')),
    last_tested_at TIMESTAMP,
    connection_metadata JSON DEFAULT '{}', -- Project settings, quotas, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(store_id, connection_name)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_supabase_connections_store ON store_supabase_connections(store_id);
CREATE INDEX IF NOT EXISTS idx_supabase_connections_status ON store_supabase_connections(connection_status);

-- Extend store_templates table with new fields
ALTER TABLE store_templates ADD COLUMN IF NOT EXISTS javascript_bundle_url TEXT;
ALTER TABLE store_templates ADD COLUMN IF NOT EXISTS css_bundle_url TEXT;
ALTER TABLE store_templates ADD COLUMN IF NOT EXISTS component_dependencies JSON DEFAULT '[]';
ALTER TABLE store_templates ADD COLUMN IF NOT EXISTS performance_metrics JSON DEFAULT '{}';
ALTER TABLE store_templates ADD COLUMN IF NOT EXISTS seo_settings JSON DEFAULT '{}';
ALTER TABLE store_templates ADD COLUMN IF NOT EXISTS accessibility_settings JSON DEFAULT '{}';
ALTER TABLE store_templates ADD COLUMN IF NOT EXISTS mobile_optimized BOOLEAN DEFAULT true;
ALTER TABLE store_templates ADD COLUMN IF NOT EXISTS bundle_size INTEGER DEFAULT 0;