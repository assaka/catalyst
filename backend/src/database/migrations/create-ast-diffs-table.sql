-- AST Diffs table for storing code change overlays
-- Patches act as overlays that can be applied over original source code

CREATE TABLE IF NOT EXISTS ast_diffs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- File and change metadata
    file_path VARCHAR(500) NOT NULL,
    original_hash VARCHAR(64) NOT NULL, -- SHA-256 of original content for integrity
    
    -- AST analysis data
    original_ast JSONB NOT NULL,       -- AST of original code
    modified_ast JSONB NOT NULL,       -- AST of modified code
    ast_diff JSONB NOT NULL,           -- Calculated AST differences
    
    -- Patch overlay data
    patch_operations JSONB NOT NULL,   -- JSON Patch RFC 6902 operations
    patch_preview TEXT,                -- Human-readable preview of changes
    
    -- Change metadata
    change_summary VARCHAR(1000),      -- Brief description of changes
    change_type VARCHAR(50) NOT NULL,  -- 'addition', 'modification', 'deletion', 'refactor'
    affected_symbols JSONB,            -- List of functions/variables/classes affected
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'applied', 'rejected', 'reverted'
    applied_at TIMESTAMP,
    reverted_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT valid_change_type CHECK (change_type IN ('addition', 'modification', 'deletion', 'refactor', 'style')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'applied', 'rejected', 'reverted'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ast_diffs_store_file ON ast_diffs(store_id, file_path);
CREATE INDEX IF NOT EXISTS idx_ast_diffs_user ON ast_diffs(user_id);
CREATE INDEX IF NOT EXISTS idx_ast_diffs_status ON ast_diffs(status);
CREATE INDEX IF NOT EXISTS idx_ast_diffs_created ON ast_diffs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ast_diffs_change_type ON ast_diffs(change_type);

-- GIN index for JSONB searching
CREATE INDEX IF NOT EXISTS idx_ast_diffs_affected_symbols ON ast_diffs USING GIN (affected_symbols);
CREATE INDEX IF NOT EXISTS idx_ast_diffs_patch_ops ON ast_diffs USING GIN (patch_operations);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ast_diffs_updated_at ON ast_diffs;
CREATE TRIGGER update_ast_diffs_updated_at
    BEFORE UPDATE ON ast_diffs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- This shows how patches work as overlays
-- Note: Only insert if both store and user exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM stores WHERE id = '157d4590-49bf-4b0b-bd77-abe131909528') THEN
        INSERT INTO ast_diffs (
            store_id, 
            user_id, 
            file_path, 
            original_hash,
            original_ast,
            modified_ast,
            ast_diff,
            patch_operations,
            patch_preview,
            change_summary,
            change_type,
            affected_symbols,
            status
        ) 
        SELECT 
            '157d4590-49bf-4b0b-bd77-abe131909528'::uuid,
            u.id,
            'src/components/ui/button.jsx',
            'abc123def456',
            '{"type": "Program", "body": [{"type": "FunctionDeclaration", "name": "Button"}]}',
            '{"type": "Program", "body": [{"type": "FunctionDeclaration", "name": "Button"}, {"type": "VariableDeclaration", "name": "variant"}]}',
            '{"added": [{"type": "VariableDeclaration", "name": "variant", "line": 5}], "modified": [], "deleted": []}',
            '[{"op": "add", "path": "/body/1", "value": {"type": "VariableDeclaration", "name": "variant"}}]',
            'Added variant prop handling to Button component',
            'Added new variant state variable for button styling',
            'addition',
            '["Button", "variant"]',
            'draft'
        FROM users u 
        LIMIT 1
        ON CONFLICT DO NOTHING;
    END IF;
END $$;