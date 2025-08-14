-- Migration: Create editor_customizations table for storing file tree editor settings
-- Description: Store user customizations for file tree editor including layout, theme, and file preferences

CREATE TABLE IF NOT EXISTS editor_customizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Editor settings
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- File-specific customizations
    file_customizations JSONB NOT NULL DEFAULT '{}',
    
    -- Layout preferences
    layout_preferences JSONB NOT NULL DEFAULT '{
        "file_tree_open": true,
        "chat_open": true,
        "file_tree_width": 256,
        "chat_width": 320,
        "editor_theme": "dark",
        "font_size": 14,
        "word_wrap": true
    }',
    
    -- Recently opened files
    recent_files JSONB NOT NULL DEFAULT '[]',
    
    -- Custom shortcuts and preferences
    preferences JSONB NOT NULL DEFAULT '{
        "auto_save": true,
        "auto_save_delay": 3000,
        "show_line_numbers": true,
        "highlight_active_line": true,
        "expanded_folders": {}
    }',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_editor_customizations_user_id ON editor_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_editor_customizations_store_id ON editor_customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_editor_customizations_user_store ON editor_customizations(user_id, store_id);

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_editor_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_editor_customizations_updated_at ON editor_customizations;
CREATE TRIGGER update_editor_customizations_updated_at
    BEFORE UPDATE ON editor_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_editor_customizations_updated_at();

-- Add some sample default customizations for different user types
-- These will be helpful for initial setup

COMMENT ON TABLE editor_customizations IS 'Stores user-specific editor customizations and preferences for the file tree editor';
COMMENT ON COLUMN editor_customizations.settings IS 'General editor settings and configurations';
COMMENT ON COLUMN editor_customizations.file_customizations IS 'File-specific customizations (syntax highlighting, bookmarks, etc.)';
COMMENT ON COLUMN editor_customizations.layout_preferences IS 'Layout preferences for panels, theme, font settings';
COMMENT ON COLUMN editor_customizations.recent_files IS 'Array of recently opened files with metadata';
COMMENT ON COLUMN editor_customizations.preferences IS 'User preferences for editor behavior and shortcuts';