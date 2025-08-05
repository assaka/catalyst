-- Add akeneo_code column to categories table for proper Akeneo integration
ALTER TABLE categories ADD COLUMN akeneo_code VARCHAR(255);

-- Add index for performance
CREATE INDEX idx_categories_akeneo_code ON categories(akeneo_code);

-- Add comment for documentation
COMMENT ON COLUMN categories.akeneo_code IS 'Stores the original Akeneo category code for mapping products to categories during import';