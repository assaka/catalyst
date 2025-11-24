-- ============================================
-- Create store_media_storages table (TENANT TABLE)
-- Manages multiple media storage connections per store
-- with one marked as primary for default operations
-- This table lives in each TENANT database, not master
-- ============================================

CREATE TABLE IF NOT EXISTS store_media_storages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,

  -- Storage provider type
  storage_type VARCHAR(50) NOT NULL CHECK (storage_type IN (
    'supabase',
    'aws-s3',
    's3',
    'google-storage',
    'gcs',
    'azure-blob',
    'cloudflare-r2',
    'local'
  )),

  -- Storage provider name/label
  storage_name VARCHAR(255),

  -- Encrypted credentials (AES-256)
  credentials_encrypted TEXT,

  -- Configuration details (non-sensitive, stored as JSONB)
  config_data JSONB DEFAULT '{}',

  -- Connection details (non-sensitive)
  bucket_name VARCHAR(255),
  region VARCHAR(100),
  endpoint_url TEXT,

  -- Primary flag - only ONE can be primary per store
  is_primary BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_connection_test TIMESTAMP,
  connection_status VARCHAR(50) DEFAULT 'pending' CHECK (connection_status IN (
    'pending',
    'connected',
    'failed',
    'timeout'
  )),

  -- Usage stats
  total_files INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_store_media_storages_store_id
  ON store_media_storages(store_id);

CREATE INDEX IF NOT EXISTS idx_store_media_storages_active
  ON store_media_storages(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_store_media_storages_primary
  ON store_media_storages(store_id, is_primary)
  WHERE is_primary = true;

CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_media_storage_per_store
  ON store_media_storages(store_id, is_primary)
  WHERE is_primary = true;

-- Trigger to ensure only one primary per store
CREATE OR REPLACE FUNCTION ensure_single_primary_media_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset all other primary flags for this store
    UPDATE store_media_storages
    SET is_primary = false
    WHERE store_id = NEW.store_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_primary_media_storage
  BEFORE INSERT OR UPDATE ON store_media_storages
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_media_storage();

-- Trigger for updated_at
CREATE TRIGGER update_store_media_storages_updated_at
  BEFORE UPDATE ON store_media_storages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE store_media_storages IS 'Manages multiple media storage provider connections per store with encrypted credentials';
COMMENT ON COLUMN store_media_storages.is_primary IS 'Marks the primary media storage connection. Only one can be primary per store.';
COMMENT ON COLUMN store_media_storages.credentials_encrypted IS 'Encrypted storage provider credentials (API keys, secrets, etc.)';
COMMENT ON COLUMN store_media_storages.config_data IS 'Non-sensitive configuration data stored as JSONB';

-- Migrate existing data from store settings to store_media_storages
-- This ensures backward compatibility
INSERT INTO store_media_storages (store_id, storage_type, is_primary, is_active, connection_status)
SELECT
  s.id as store_id,
  COALESCE(
    s.settings->>'default_mediastorage_provider',
    s.settings->>'default_database_provider',
    sd.database_type
  ) as storage_type,
  true as is_primary,
  true as is_active,
  'connected' as connection_status
FROM stores s
LEFT JOIN store_databases sd ON sd.store_id = s.id AND sd.is_primary = true
WHERE (
  s.settings->>'default_mediastorage_provider' IS NOT NULL
  OR s.settings->>'default_database_provider' IS NOT NULL
  OR sd.database_type IS NOT NULL
)
ON CONFLICT DO NOTHING;

-- ============================================
-- store_media_storages table creation complete
-- ============================================
