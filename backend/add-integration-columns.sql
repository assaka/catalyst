-- Add missing columns to integration_configs table

-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integration_configs' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE integration_configs ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add last_sync_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integration_configs' AND column_name = 'last_sync_at'
    ) THEN
        ALTER TABLE integration_configs ADD COLUMN last_sync_at TIMESTAMP;
    END IF;

    -- Add sync_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integration_configs' AND column_name = 'sync_status'
    ) THEN
        -- First create the enum type if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_integration_configs_sync_status') THEN
            CREATE TYPE enum_integration_configs_sync_status AS ENUM ('idle', 'syncing', 'success', 'error');
        END IF;
        
        ALTER TABLE integration_configs ADD COLUMN sync_status enum_integration_configs_sync_status DEFAULT 'idle';
    END IF;

    -- Add sync_error column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integration_configs' AND column_name = 'sync_error'
    ) THEN
        ALTER TABLE integration_configs ADD COLUMN sync_error TEXT;
    END IF;

    -- Add createdAt and updatedAt columns if they don't exist (Sequelize standard)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integration_configs' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE integration_configs ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integration_configs' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE integration_configs ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

END $$;

-- Update existing records to have default values
UPDATE integration_configs SET 
    is_active = true,
    sync_status = 'idle',
    "createdAt" = NOW(),
    "updatedAt" = NOW()
WHERE is_active IS NULL OR sync_status IS NULL OR "createdAt" IS NULL OR "updatedAt" IS NULL;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'integration_configs' 
ORDER BY ordinal_position;