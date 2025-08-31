-- Customization System Database Schema
-- Handles layout changes, JavaScript modifications, and extensible customizations

-- Core customization types and metadata
CREATE TABLE IF NOT EXISTS customization_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'layout', 'javascript', 'styling', 'component', 'hook'
    schema_version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store customizations per store
CREATE TABLE IF NOT EXISTS store_customizations (
    id SERIAL PRIMARY KEY,
    store_id UUID NOT NULL,
    customization_type_id INTEGER REFERENCES customization_types(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Core customization data
    target_component VARCHAR(200), -- Component/element being customized
    target_selector VARCHAR(500), -- CSS selector or component path
    customization_data JSONB NOT NULL, -- The actual customization content
    
    -- Metadata
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 10, -- For ordering/conflicts
    
    -- Dependencies and conflicts
    dependencies JSONB DEFAULT '[]', -- Array of required customizations/extensions
    conflicts_with JSONB DEFAULT '[]', -- Array of conflicting customizations
    
    -- Versioning and history
    parent_id INTEGER REFERENCES store_customizations(id), -- For versioning
    created_by UUID, -- User who created it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique customizations per store and target
    UNIQUE(store_id, customization_type_id, target_component, name)
);

-- Track customization application and performance
CREATE TABLE IF NOT EXISTS customization_logs (
    id SERIAL PRIMARY KEY,
    store_id UUID NOT NULL,
    customization_id INTEGER REFERENCES store_customizations(id),
    
    -- Application details
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    application_context VARCHAR(100), -- 'page_load', 'user_action', 'hook_trigger', etc.
    execution_time_ms INTEGER,
    
    -- Results and errors
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'warning', 'skipped'
    error_message TEXT,
    warning_message TEXT,
    
    -- Context data
    user_agent TEXT,
    page_url TEXT,
    session_id VARCHAR(100),
    user_id UUID
);

-- Pre-built customization templates
CREATE TABLE IF NOT EXISTS customization_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    
    -- Template data
    template_data JSONB NOT NULL,
    preview_image_url TEXT,
    documentation_url TEXT,
    
    -- Compatibility and requirements
    compatible_versions JSONB DEFAULT '[]', -- Array of compatible system versions
    required_extensions JSONB DEFAULT '[]', -- Array of required extensions
    
    -- Metadata
    author VARCHAR(200),
    version VARCHAR(20) DEFAULT '1.0.0',
    is_public BOOLEAN DEFAULT false,
    install_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track template installations
CREATE TABLE IF NOT EXISTS template_installations (
    id SERIAL PRIMARY KEY,
    store_id UUID NOT NULL,
    template_id INTEGER REFERENCES customization_templates(id),
    customization_id INTEGER REFERENCES store_customizations(id),
    
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    installed_by UUID,
    configuration_overrides JSONB DEFAULT '{}',
    
    UNIQUE(store_id, template_id)
);

-- Insert default customization types
INSERT INTO customization_types (name, description, category) VALUES
('layout_modification', 'Modify component layouts and positioning', 'layout'),
('css_injection', 'Inject custom CSS styles', 'styling'),
('javascript_injection', 'Inject custom JavaScript code', 'javascript'),
('component_replacement', 'Replace entire components with custom ones', 'component'),
('hook_customization', 'Customize hook behavior and data flow', 'hook'),
('event_handler', 'Add custom event handlers', 'javascript'),
('api_modification', 'Modify API calls and responses', 'javascript'),
('theme_customization', 'Customize themes and color schemes', 'styling'),
('content_modification', 'Modify page content and text', 'layout'),
('workflow_customization', 'Customize user workflows and flows', 'hook')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_customizations_store_id ON store_customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_store_customizations_active ON store_customizations(is_active);
CREATE INDEX IF NOT EXISTS idx_store_customizations_priority ON store_customizations(priority);
CREATE INDEX IF NOT EXISTS idx_store_customizations_target ON store_customizations(target_component);
CREATE INDEX IF NOT EXISTS idx_customization_logs_store_id ON customization_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_customization_logs_applied_at ON customization_logs(applied_at);
CREATE INDEX IF NOT EXISTS idx_customization_templates_category ON customization_templates(category);
CREATE INDEX IF NOT EXISTS idx_customization_templates_public ON customization_templates(is_public);