-- Create customization_overlays table for code customization tracking
CREATE TABLE IF NOT EXISTS customization_overlays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(512) NOT NULL,
    component_type VARCHAR(20) DEFAULT 'component' CHECK (component_type IN ('component', 'page', 'service', 'util', 'config')),
    baseline_code TEXT NOT NULL,
    current_code TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'published')),
    change_type VARCHAR(20) DEFAULT 'manual_edit' CHECK (change_type IN ('manual_edit', 'ai_generated', 'merge', 'rollback')),
    metadata JSON DEFAULT '{}',
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customization_overlays_user_id ON customization_overlays(user_id);
CREATE INDEX IF NOT EXISTS idx_customization_overlays_store_id ON customization_overlays(store_id);
CREATE INDEX IF NOT EXISTS idx_customization_overlays_file_path ON customization_overlays(file_path);
CREATE INDEX IF NOT EXISTS idx_customization_overlays_status ON customization_overlays(status);
CREATE INDEX IF NOT EXISTS idx_customization_overlays_user_file ON customization_overlays(user_id, file_path);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customization_overlays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customization_overlays_updated_at
    BEFORE UPDATE ON customization_overlays
    FOR EACH ROW
    EXECUTE FUNCTION update_customization_overlays_updated_at();