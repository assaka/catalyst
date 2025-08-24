-- Hybrid Customizations System
-- Combines user-friendly customizations with AST-level version control and rollback
-- Provides precise change tracking with deployment capabilities

-- Main customizations table - user-facing customizations
CREATE TABLE IF NOT EXISTS hybrid_customizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- User-friendly metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,
    component_type VARCHAR(100), -- 'page', 'component', 'layout', 'hook', 'utility'
    file_path VARCHAR(500) NOT NULL,
    
    -- Version control
    version_number INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT true,
    root_customization_id UUID, -- Points to the first version in the chain
    parent_version_id UUID REFERENCES hybrid_customizations(id),
    
    -- Code content (current state)
    baseline_code TEXT NOT NULL, -- Original unmodified code
    current_code TEXT NOT NULL, -- Current state after all modifications
    
    -- AI integration
    ai_prompts JSONB DEFAULT '[]'::jsonb,
    ai_changes JSONB DEFAULT '[]'::jsonb,
    customization_history JSONB DEFAULT '[]'::jsonb,
    
    -- Deployment integration
    deployment_status VARCHAR(50) DEFAULT 'draft',
    deployed_at TIMESTAMP,
    deployment_url VARCHAR(500),
    render_service_id VARCHAR(255),
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'rolled_back'
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_deployment_status CHECK (deployment_status IN ('draft', 'deployed', 'failed', 'pending', 'rolled_back')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'archived', 'rolled_back')),
    CONSTRAINT hybrid_customizations_name_user_version_unique UNIQUE(name, user_id, version_number)
);

-- Version snapshots table - AST-level precise tracking for each change
CREATE TABLE IF NOT EXISTS customization_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customization_id UUID NOT NULL REFERENCES hybrid_customizations(id) ON DELETE CASCADE,
    snapshot_number INTEGER NOT NULL, -- Sequential snapshot within customization
    
    -- Change metadata
    change_type VARCHAR(50) NOT NULL, -- 'initial', 'ai_modification', 'manual_edit', 'rollback'
    change_summary VARCHAR(1000),
    change_description TEXT,
    
    -- AST analysis (precision tracking)
    original_hash VARCHAR(64), -- SHA-256 of code before this change
    modified_hash VARCHAR(64), -- SHA-256 of code after this change
    original_ast JSONB, -- AST before change
    modified_ast JSONB, -- AST after change
    ast_diff JSONB, -- Calculated AST differences
    affected_symbols JSONB, -- Functions/variables/classes affected
    
    -- Patch operations (for rollback)
    patch_operations JSONB NOT NULL, -- JSON Patch RFC 6902 operations
    reverse_patch_operations JSONB NOT NULL, -- Operations to undo this change
    patch_preview TEXT, -- Human-readable preview
    
    -- Code states
    code_before TEXT, -- Code state before this change
    code_after TEXT NOT NULL, -- Code state after this change
    
    -- AI context (if applicable)
    ai_prompt TEXT,
    ai_explanation TEXT,
    ai_metadata JSONB,
    
    -- User context
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_change_type CHECK (change_type IN ('initial', 'ai_modification', 'manual_edit', 'rollback', 'merge')),
    CONSTRAINT unique_snapshot_number_per_customization UNIQUE(customization_id, snapshot_number)
);

-- Rollback history table - tracks rollback operations
CREATE TABLE IF NOT EXISTS customization_rollbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customization_id UUID NOT NULL REFERENCES hybrid_customizations(id) ON DELETE CASCADE,
    
    -- Rollback details
    rolled_back_from_snapshot INTEGER NOT NULL, -- Which snapshot we rolled back from
    rolled_back_to_snapshot INTEGER NOT NULL, -- Which snapshot we rolled back to
    rollback_type VARCHAR(50) NOT NULL, -- 'full_rollback', 'selective_rollback', 'cherry_pick'
    
    -- Affected changes
    reverted_snapshots JSONB NOT NULL, -- List of snapshot IDs that were reverted
    applied_operations JSONB NOT NULL, -- Patch operations that were applied for rollback
    
    -- Metadata
    rollback_reason TEXT,
    rollback_summary VARCHAR(500),
    
    -- User and timing
    performed_by UUID NOT NULL REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_rollback_type CHECK (rollback_type IN ('full_rollback', 'selective_rollback', 'cherry_pick')),
    CONSTRAINT valid_rollback_direction CHECK (rolled_back_from_snapshot > rolled_back_to_snapshot)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hybrid_customizations_user_store ON hybrid_customizations(user_id, store_id);
CREATE INDEX IF NOT EXISTS idx_hybrid_customizations_file_path ON hybrid_customizations(file_path);
CREATE INDEX IF NOT EXISTS idx_hybrid_customizations_current_version ON hybrid_customizations(is_current_version) WHERE is_current_version = true;
CREATE INDEX IF NOT EXISTS idx_hybrid_customizations_root ON hybrid_customizations(root_customization_id);
CREATE INDEX IF NOT EXISTS idx_hybrid_customizations_component_type ON hybrid_customizations(component_type);
CREATE INDEX IF NOT EXISTS idx_hybrid_customizations_deployment_status ON hybrid_customizations(deployment_status);

CREATE INDEX IF NOT EXISTS idx_customization_snapshots_customization ON customization_snapshots(customization_id, snapshot_number);
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_change_type ON customization_snapshots(change_type);
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_created ON customization_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_created_by ON customization_snapshots(created_by);

CREATE INDEX IF NOT EXISTS idx_customization_rollbacks_customization ON customization_rollbacks(customization_id);
CREATE INDEX IF NOT EXISTS idx_customization_rollbacks_performed ON customization_rollbacks(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_customization_rollbacks_performed_by ON customization_rollbacks(performed_by);

-- GIN indexes for JSONB searching
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_affected_symbols ON customization_snapshots USING GIN (affected_symbols);
CREATE INDEX IF NOT EXISTS idx_customization_snapshots_patch_ops ON customization_snapshots USING GIN (patch_operations);
CREATE INDEX IF NOT EXISTS idx_hybrid_customizations_tags ON hybrid_customizations USING GIN (tags);

-- Update triggers
CREATE OR REPLACE FUNCTION update_hybrid_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_hybrid_customizations_updated_at ON hybrid_customizations;
CREATE TRIGGER update_hybrid_customizations_updated_at
    BEFORE UPDATE ON hybrid_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_hybrid_customizations_updated_at();

-- Function to automatically set root_customization_id for new versions
CREATE OR REPLACE FUNCTION set_root_customization_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new version (has parent_version_id), set root to parent's root
    IF NEW.parent_version_id IS NOT NULL THEN
        SELECT COALESCE(root_customization_id, id) INTO NEW.root_customization_id 
        FROM hybrid_customizations 
        WHERE id = NEW.parent_version_id;
    ELSE
        -- If this is the first version, set root to itself
        NEW.root_customization_id = NEW.id;
    END IF;
    
    -- Ensure only one current version per customization chain
    IF NEW.is_current_version = true AND NEW.root_customization_id IS NOT NULL THEN
        UPDATE hybrid_customizations 
        SET is_current_version = false 
        WHERE root_customization_id = NEW.root_customization_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_root_customization_id_trigger ON hybrid_customizations;
CREATE TRIGGER set_root_customization_id_trigger
    BEFORE INSERT OR UPDATE ON hybrid_customizations
    FOR EACH ROW
    EXECUTE FUNCTION set_root_customization_id();

-- Sample data for development
INSERT INTO hybrid_customizations (
    id,
    user_id,
    name,
    description,
    component_type,
    file_path,
    baseline_code,
    current_code,
    ai_prompts,
    status
) 
SELECT 
    gen_random_uuid(),
    u.id,
    'Enhanced Hero Section v1',
    'AI-enhanced hero section with version control and rollback capabilities',
    'component',
    'src/components/HeroSection.jsx',
    'import React from "react";

export default function HeroSection() {
  return (
    <div className="bg-gray-100 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-lg mb-8">Simple hero section</p>
      </div>
    </div>
  );
}',
    'import React from "react";

export default function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4 animate-fade-in">
          Welcome to Our Amazing Store
        </h1>
        <p className="text-xl mb-8 opacity-90">
          Discover incredible products with AI-enhanced shopping
        </p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Shop Now
        </button>
      </div>
    </div>
  );
}',
    '["Make the hero section more modern with gradients", "Add animations and better typography", "Include a call-to-action button"]'::jsonb,
    'active'
FROM users u 
WHERE u.role = 'store_owner' 
LIMIT 1
ON CONFLICT DO NOTHING;