-- Migration to fix RenderOAuthToken null constraints for Personal Access Token support
-- This allows expires_at and user_id to be nullable for Personal Access Tokens

-- Make expires_at nullable (Personal Access Tokens may not have expiration)
ALTER TABLE render_oauth_tokens 
ALTER COLUMN expires_at DROP NOT NULL;

-- Make user_id nullable (may not be available for all token types)
ALTER TABLE render_oauth_tokens 
ALTER COLUMN user_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN render_oauth_tokens.expires_at IS 'Expiration date for OAuth tokens, nullable for Personal Access Tokens';
COMMENT ON COLUMN render_oauth_tokens.user_id IS 'User ID from Render API, nullable for certain token types';