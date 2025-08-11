-- Create render_oauth_tokens table for storing Render OAuth credentials
CREATE TABLE IF NOT EXISTS render_oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255),
    scope TEXT,
    deployment_permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_render_oauth_tokens_store_id ON render_oauth_tokens(store_id);
CREATE INDEX IF NOT EXISTS idx_render_oauth_tokens_user_id ON render_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_render_oauth_tokens_expires_at ON render_oauth_tokens(expires_at);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_render_oauth_tokens_updated_at ON render_oauth_tokens;
CREATE TRIGGER update_render_oauth_tokens_updated_at
    BEFORE UPDATE ON render_oauth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();