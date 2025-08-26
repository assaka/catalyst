-- Create customization_snapshots table for version control and AST diff tracking
CREATE TABLE IF NOT EXISTS customization_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customization_id UUID NOT NULL REFERENCES customization_overlays(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    change_summary VARCHAR(512),
    change_description TEXT,
    change_type VARCHAR(20) DEFAULT 'modification' CHECK (change_type IN ('initial', 'modification', 'merge', 'rollback', 'auto_save')),
    ast_diff JSON,
    line_diff JSON,
    unified_diff TEXT,
    diff_stats JSON DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'finalized', 'archived')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    finalized_at TIMESTAMP NULL,
    metadata JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure version numbers are unique per customization
    CONSTRAINT unique_customization_version UNIQUE (customization_id, version_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_customization_id ON customization_snapshots(customization_id);
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_created_by ON customization_snapshots(created_by);
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_status ON customization_snapshots(status);
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_change_type ON customization_snapshots(change_type);
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_created_at ON customization_snapshots(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customization_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customization_snapshots_updated_at
    BEFORE UPDATE ON customization_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_customization_snapshots_updated_at();