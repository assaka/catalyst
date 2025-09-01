-- Create and populate file_baselines table for Supabase
-- Run this script in your Supabase SQL editor

-- Create the file_baselines table if it doesn't exist
CREATE TABLE IF NOT EXISTS file_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT UNIQUE NOT NULL,
  baseline_code TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  version TEXT DEFAULT 'latest',
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  last_modified TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_baselines_path ON file_baselines(file_path);
CREATE INDEX IF NOT EXISTS idx_file_baselines_version ON file_baselines(version);
CREATE INDEX IF NOT EXISTS idx_file_baselines_type ON file_baselines(file_type);

-- Enable RLS (Row Level Security)
ALTER TABLE file_baselines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust as needed for your authentication system)
CREATE POLICY "Allow authenticated users to read file_baselines" ON file_baselines
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert file_baselines" ON file_baselines
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update file_baselines" ON file_baselines
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Note: You'll need to manually insert the file baselines data
-- The following is a template for inserting baseline files:

-- INSERT INTO file_baselines (file_path, baseline_code, code_hash, file_type, file_size, last_modified) 
-- VALUES 
--   ('src/core/slot-editor/HybridCustomizationEditor.jsx', '[FILE_CONTENT]', '[SHA256_HASH]', 'jsx', [FILE_SIZE], NOW()),
--   ('src/core/slot-editor/ConfigurationEditor.jsx', '[FILE_CONTENT]', '[SHA256_HASH]', 'jsx', [FILE_SIZE], NOW()),
--   ('src/core/slot-editor/ConfigurationPreview.jsx', '[FILE_CONTENT]', '[SHA256_HASH]', 'jsx', [FILE_SIZE], NOW()),
--   ('src/core/slot-editor/SlotsWorkspace.jsx', '[FILE_CONTENT]', '[SHA256_HASH]', 'jsx', [FILE_SIZE], NOW()),
--   ('src/core/slot-editor/types.js', '[FILE_CONTENT]', '[SHA256_HASH]', 'js', [FILE_SIZE], NOW()),
--   ('src/pages/CartSlotted.jsx', '[FILE_CONTENT]', '[SHA256_HASH]', 'jsx', [FILE_SIZE], NOW()),
--   ('src/core/slot-system/default-components/CartSlots.jsx', '[FILE_CONTENT]', '[SHA256_HASH]', 'jsx', [FILE_SIZE], NOW());

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_file_baselines_updated_at 
  BEFORE UPDATE ON file_baselines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get or create a baseline
CREATE OR REPLACE FUNCTION get_or_create_baseline(
  p_file_path TEXT,
  p_baseline_code TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  file_path TEXT,
  baseline_code TEXT,
  has_baseline BOOLEAN
) AS $$
BEGIN
  -- Try to get existing baseline
  RETURN QUERY
  SELECT 
    fb.id,
    fb.file_path,
    fb.baseline_code,
    true as has_baseline
  FROM file_baselines fb
  WHERE fb.file_path = p_file_path
  AND fb.version = 'latest'
  LIMIT 1;
  
  -- If no baseline found and code provided, create one
  IF NOT FOUND AND p_baseline_code IS NOT NULL THEN
    INSERT INTO file_baselines (
      file_path, 
      baseline_code, 
      code_hash, 
      file_type, 
      file_size, 
      last_modified
    ) VALUES (
      p_file_path,
      p_baseline_code,
      encode(sha256(p_baseline_code::bytea), 'hex'),
      CASE 
        WHEN p_file_path LIKE '%.jsx' THEN 'jsx'
        WHEN p_file_path LIKE '%.js' THEN 'js'
        WHEN p_file_path LIKE '%.ts' THEN 'ts'
        WHEN p_file_path LIKE '%.tsx' THEN 'tsx'
        WHEN p_file_path LIKE '%.css' THEN 'css'
        WHEN p_file_path LIKE '%.json' THEN 'json'
        ELSE 'text'
      END,
      length(p_baseline_code),
      NOW()
    )
    RETURNING 
      id,
      file_path,
      baseline_code,
      true as has_baseline;
  END IF;
  
  -- If still no baseline, return empty result
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      NULL::UUID as id,
      p_file_path as file_path,
      NULL::TEXT as baseline_code,
      false as has_baseline;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON file_baselines TO authenticated;
-- GRANT USAGE ON SEQUENCE file_baselines_id_seq TO authenticated;