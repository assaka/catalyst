-- Customizations System Database Tables
-- Creates tables for unified customization system (replaces patches)

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
    type VARCHAR(50) NOT NULL, -- For backward compatibility, references customization_types.name
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_component VARCHAR(255), -- Component or file being customized
    target_selector VARCHAR(500), -- CSS selector or component selector
    customization_data JSONB NOT NULL, -- The actual customization content
    priority INTEGER DEFAULT 10, -- Execution priority (lower = higher priority)
    dependencies TEXT[], -- Array of customization IDs this depends on
    conflicts_with TEXT[], -- Array of customization IDs this conflicts with
    created_by UUID, -- User who created the customization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    version_number INTEGER DEFAULT 1
);

-- Customization versions table (for version control)
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

-- Customization releases table (for publishing and rollbacks)
CREATE TABLE IF NOT EXISTS customization_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL,
    release_name VARCHAR(255) NOT NULL,
    release_version VARCHAR(50) NOT NULL,
    description TEXT,
    release_type VARCHAR(20) DEFAULT 'minor', -- 'major', 'minor', 'patch'
    customization_ids UUID[], -- Array of customization IDs in this release
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false,
    rollback_data JSONB -- Data needed for rollback
);

-- Customization application logs (for tracking what's been applied)
CREATE TABLE IF NOT EXISTS customization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customization_id UUID NOT NULL REFERENCES customizations(id),
    store_id UUID NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    application_context JSONB, -- Context when customization was applied
    result_data JSONB, -- Results of applying the customization
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customization_types_name ON customization_types(name);
CREATE INDEX IF NOT EXISTS idx_customization_types_active ON customization_types(is_active);

-- Add unique constraint for upserts
ALTER TABLE customizations ADD CONSTRAINT unique_store_component_type UNIQUE (store_id, target_component, type);

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

-- Comments for documentation
COMMENT ON TABLE customizations IS 'Main table for all store customizations including file modifications, layout changes, CSS injections, etc.';
COMMENT ON TABLE customization_versions IS 'Version history for customizations - tracks all changes over time';
COMMENT ON TABLE customization_releases IS 'Release management for customizations - groups customizations for deployment';
COMMENT ON TABLE customization_logs IS 'Application logs - tracks when and how customizations are applied';

COMMENT ON COLUMN customizations.type IS 'Type of customization: file_modification, layout_modification, css_injection, javascript_injection, component_replacement, hook_customization, event_handler';
COMMENT ON COLUMN customizations.customization_data IS 'JSON data containing the customization content - structure varies by type';
COMMENT ON COLUMN customizations.priority IS 'Execution priority - lower numbers execute first (1 = highest priority)';
COMMENT ON COLUMN customizations.dependencies IS 'Array of customization IDs that must be applied before this one';
COMMENT ON COLUMN customizations.conflicts_with IS 'Array of customization IDs that conflict with this one';

COMMENT ON COLUMN customization_releases.customization_ids IS 'Array of customization UUIDs included in this release';
COMMENT ON COLUMN customization_releases.rollback_data IS 'Data needed to rollback this release if needed';

-- Example data structure for different customization types:
/*
file_modification:
{
  "filePath": "src/pages/Cart.jsx",
  "originalCode": "...",
  "modifiedCode": "...",
  "language": "javascript", 
  "changeSummary": "Added loading state",
  "changeType": "manual_edit",
  "linesAdded": 5,
  "linesRemoved": 2,
  "linesModified": 1
}

layout_modification:
{
  "operation": "hide|show|move|resize",
  "selector": "#cart-total",
  "properties": {"display": "none"},
  "conditions": {"viewport": "mobile"}
}

css_injection:
{
  "selector": ".cart-item",
  "styles": {"border": "1px solid #ccc", "margin": "10px"},
  "media_query": "@media (max-width: 768px)"
}

component_replacement:
{
  "original_component": "CartButton",
  "replacement_component": "CustomCartButton",
  "props_mapping": {"onClick": "onCustomClick"}
}
*/