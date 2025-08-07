-- Create table for Shopify OAuth tokens
CREATE TABLE IF NOT EXISTS shopify_oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    shop_id BIGINT,
    shop_name VARCHAR(255),
    shop_email VARCHAR(255),
    shop_country VARCHAR(2),
    shop_currency VARCHAR(3),
    shop_timezone VARCHAR(100),
    plan_name VARCHAR(100),
    webhook_endpoint_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id),
    UNIQUE(shop_domain)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_store_id ON shopify_oauth_tokens(store_id);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_shop_domain ON shopify_oauth_tokens(shop_domain);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_shopify_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_shopify_oauth_tokens_updated_at ON shopify_oauth_tokens;
CREATE TRIGGER update_shopify_oauth_tokens_updated_at
    BEFORE UPDATE ON shopify_oauth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_shopify_oauth_tokens_updated_at();